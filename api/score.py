import json
from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options, read_body, call_claude, SYSTEM_SCORE, prompt_score

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            content = body.get("content", "")
            channel = body.get("channel", "LinkedIn")
            goal = body.get("goal", "engagement and brand awareness")
            if not content:
                cors_response(self, 400, {"error": "content required"})
                return
            text, usage = call_claude(SYSTEM_SCORE, prompt_score(content, channel, goal), max_tokens=1500)
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            cors_response(self, 200, {"result": result, "usage": usage})
        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}", "raw": text[:500]})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
