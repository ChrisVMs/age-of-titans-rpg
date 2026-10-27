# Sirve el juego en http://127.0.0.1:8765/index.html?pruebas y, en /antes.html, una copia de index.html guardada
# antes de un cambio, para comparar las dos versiones con la misma semilla (ver ESTADO.md, "Cómo verificar").
# Uso: python servidor.py <carpeta del juego> <ruta a antes.html>
import http.server, sys
juego, antes = sys.argv[1], sys.argv[2]
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=juego, **k)
    def translate_path(self, path):
        if path.split('?')[0] == '/antes.html': return antes
        return super().translate_path(path)
http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
