import json
from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options, read_body, call_claude, SYSTEM_REPURPOSE, prompt_repurpose

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            original = body.get("content", "")
            source_format = body.get("source_format", "Blog")
            target_channels = body.get("target_channels", ["LinkedIn", "Twitter/X"])
            brand_voice = body.get("brand_voice", "professional and direct")
            if not original:
                cors_response(self, 400, {"error": "content required"})
                return
            text, usage = call_claude(SYSTEM_REPURPOSE, prompt_repurpose(original, source_format, target_channels, brand_voice), max_tokens=2000)
            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            cors_response(self, 200, {"result": result, "usage": usage})
        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}", "raw": text[:500]})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
