from http.server import BaseHTTPRequestHandler
from api._shared import cors_response, handle_options

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        handle_options(self)
    def do_GET(self):
        cors_response(self, 200, {"status": "ok", "version": "6.0.0", "engine": "ContentEngine AI"})
    def log_message(self, *args):
        pass
