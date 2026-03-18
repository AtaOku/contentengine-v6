import json
from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options, read_body, call_claude, SYSTEM_CHAIN, prompt_chain

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            topic = body.get("topic", "")
            audience = body.get("audience", "professionals")
            n = body.get("pieces", 3)
            goal = body.get("goal", "educate and convert")
            if not topic:
                cors_response(self, 400, {"error": "topic required"})
                return
            text, usage = call_claude(SYSTEM_CHAIN, prompt_chain(topic, audience, n, goal), max_tokens=3000, api_key=body.get("api_key"))
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            cors_response(self, 200, {"result": result, "usage": usage})
        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}", "raw": text[:500]})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
