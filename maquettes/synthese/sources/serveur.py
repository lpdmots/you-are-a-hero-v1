"""Aperçu local de la maquette, sans mise en cache (les modifications s'affichent au rechargement)."""
import functools, http.server, os, sys

class SansCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4827
racine = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(SansCache, directory=racine)).serve_forever()
