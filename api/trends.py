import json
from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options, read_body, call_claude, SYSTEM_TRENDS, prompt_trends

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            industry = body.get("industry", "technology")
            audience = body.get("audience", "B2B professionals")
            n = body.get("count", 5)
            text, usage = call_claude(SYSTEM_TRENDS, prompt_trends(industry, audience, n), max_tokens=2000)
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            cors_response(self, 200, {"result": result, "usage": usage})
        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}", "raw": text[:500]})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
