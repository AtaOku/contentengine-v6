import json
from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options, read_body, call_claude, SYSTEM_SEO, prompt_seo

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            content = body.get("content", "")
            keyword = body.get("keyword", "")
            secondary = body.get("secondary_keywords", [])
            if not content or not keyword:
                cors_response(self, 400, {"error": "content and keyword required"})
                return
            text, usage = call_claude(SYSTEM_SEO, prompt_seo(content, keyword, secondary), max_tokens=2000)
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            cors_response(self, 200, {"result": result, "usage": usage})
        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}", "raw": text[:500]})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
