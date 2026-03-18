import json
from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options, read_body, call_claude, SYSTEM_CAROUSEL, prompt_carousel

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            topic = body.get("topic", "")
            platform = body.get("platform", "LinkedIn")
            n_slides = body.get("slides", 6)
            brand_voice = body.get("brand_voice", "professional")
            if not topic:
                cors_response(self, 400, {"error": "topic required"})
                return
            text, usage = call_claude(SYSTEM_CAROUSEL, prompt_carousel(topic, platform, n_slides, brand_voice), max_tokens=2500)
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            cors_response(self, 200, {"result": result, "usage": usage})
        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}", "raw": text[:500]})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
