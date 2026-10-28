// Evalúa un script de medida dentro del juego (modo pruebas) y muestra lo que devuelve. Uso: node correr.js <carpeta del juego> <script>
const { chromium } = require('playwright'), fs = require('fs'), http = require('http'), path = require('path');
const [juego, script] = process.argv.slice(2);
const srv = http.createServer((q, r) => fs.readFile(path.join(juego, q.url.split('?')[0]), (e, x) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', 'text/html'); r.end(x); })).listen(8780, '127.0.0.1');
(async () => { const b = await chromium.launch(), p = await b.newPage(); await p.goto('http://127.0.0.1:8780/index.html?pruebas'); await p.waitForTimeout(1000);
  console.log(JSON.stringify(await p.evaluate(fs.readFileSync(script, 'utf8')), null, 1)); await b.close(); srv.close(); })();
