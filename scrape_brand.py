import json
import urllib.request
import re
from html.parser import HTMLParser
from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options, read_body, call_claude

SYSTEM_SCRAPE = """You are a brand analyst. Given the text content of a company's website, 
extract structured brand information. Be specific and factual — only include what you can 
confidently infer from the content. If something isn't clear, leave it as a short reasonable guess 
based on context. Always respond with valid JSON only — no markdown fences, no preamble."""


def prompt_scrape_brand(url: str, page_text: str) -> str:
    # Truncate to ~6000 chars to stay within reasonable token limits
    truncated = page_text[:6000]
    return f"""Extract brand information from this company website.

URL: {url}

PAGE CONTENT:
{truncated}

Return JSON with this exact structure (fill every field — guess reasonably if not explicit):
{{
  "company_name": "the company name",
  "industry": "their industry / sector",
  "description": "what they do in 1-2 sentences",
  "target_audience": "who their customers are",
  "value_prop": "their core value proposition",
  "brand_voice": "3-4 adjective description of their communication tone based on the page copy",
  "competitors": "likely competitors (comma-separated, infer from industry if not stated)",
  "goals": "likely content marketing goals based on their business"
}}"""


class TextExtractor(HTMLParser):
    """Simple HTML → text extractor. Skips script/style/nav/footer."""
    SKIP_TAGS = {'script', 'style', 'nav', 'footer', 'header', 'noscript', 'svg', 'path'}

    def __init__(self):
        super().__init__()
        self.texts = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP_TAGS:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth == 0:
            cleaned = data.strip()
            if cleaned:
                self.texts.append(cleaned)

    def get_text(self):
        return '\n'.join(self.texts)


def fetch_page_text(url: str) -> str:
    """Fetch URL and extract visible text content."""
    if not url.startswith('http'):
        url = 'https://' + url

    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; ContentEngine/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
    })
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')

    extractor = TextExtractor()
    extractor.feed(html)
    text = extractor.get_text()

    # Also extract meta description and title
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    meta_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)', html, re.IGNORECASE)
    if not meta_match:
        meta_match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description', html, re.IGNORECASE)

    prefix = ''
    if title_match:
        prefix += f"Page Title: {title_match.group(1).strip()}\n"
    if meta_match:
        prefix += f"Meta Description: {meta_match.group(1).strip()}\n"

    return (prefix + '\n' + text).strip()


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            url = body.get("url", "").strip()
            if not url:
                cors_response(self, 400, {"error": "url required"})
                return

            # Fetch and extract page text
            try:
                page_text = fetch_page_text(url)
            except Exception as e:
                cors_response(self, 422, {"error": f"Could not fetch URL: {str(e)}"})
                return

            if len(page_text.strip()) < 50:
                cors_response(self, 422, {"error": "Page returned too little text content"})
                return

            # Claude extracts brand info
            text, usage = call_claude(SYSTEM_SCRAPE, prompt_scrape_brand(url, page_text), max_tokens=800, api_key=body.get("api_key"))
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            kb = json.loads(clean)
            cors_response(self, 200, {"knowledge_base": kb, "usage": usage, "chars_extracted": len(page_text)})

        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}"})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
