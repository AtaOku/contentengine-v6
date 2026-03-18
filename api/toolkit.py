import json
from http.server import BaseHTTPRequestHandler
from api._shared import (
    cors_response, handle_options, read_body, call_claude,
    SYSTEM_SEO, SYSTEM_VOICE, SYSTEM_SCORE,
    prompt_seo, prompt_voice, prompt_score,
)


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)

    def do_POST(self):
        try:
            body = read_body(self)
            tool_type = body.get("type", "")

            if tool_type == "seo":
                content = body.get("content", "")
                keyword = body.get("keyword", "")
                secondary = body.get("secondary_keywords", [])
                if not content or not keyword:
                    cors_response(self, 400, {"error": "content and keyword required"})
                    return
                text, usage = call_claude(SYSTEM_SEO, prompt_seo(content, keyword, secondary), max_tokens=2000)

            elif tool_type == "voice":
                samples = body.get("samples", [])
                new_topic = body.get("topic", "")
                if not samples or not new_topic:
                    cors_response(self, 400, {"error": "samples and topic required"})
                    return
                text, usage = call_claude(SYSTEM_VOICE, prompt_voice(samples, new_topic), max_tokens=2000)

            elif tool_type == "score":
                content = body.get("content", "")
                channel = body.get("channel", "LinkedIn")
                goal = body.get("goal", "engagement and brand awareness")
                if not content:
                    cors_response(self, 400, {"error": "content required"})
                    return
                text, usage = call_claude(SYSTEM_SCORE, prompt_score(content, channel, goal), max_tokens=1500)

            else:
                cors_response(self, 400, {"error": f"Unknown toolkit type: {tool_type}. Use 'seo', 'voice', or 'score'."})
                return

            clean = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = json.loads(clean)
            cors_response(self, 200, {"result": result, "usage": usage})

        except json.JSONDecodeError as e:
            cors_response(self, 500, {"error": f"JSON parse error: {str(e)}", "raw": text[:500]})
        except Exception as e:
            cors_response(self, 500, {"error": str(e)})

    def log_message(self, *args):
        pass
