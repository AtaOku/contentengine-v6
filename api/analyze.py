import json
from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options, read_body, call_claude, SYSTEM_ANALYST, prompt_analyze

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            kb = body.get("knowledge_base", {})
            if not kb:
                cors_response(self, 400, {"error": "knowledge_base required"})
                return
            text, usage = call_claude(SYSTEM_ANALYST, prompt_analyze(kb), max_tokens=1500)
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            analysis = json.loads(clean)
            cors_response(self, 200, {"analysis": analysis, "usage": usage})
        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}", "raw": text[:500]})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
