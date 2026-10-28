// Corre trabajos en paralelo, cada uno en una página nueva. Uso: node paralelo.js <carpeta> <trabajos.json> [páginas]
// trabajos.json: [{ "nombre": "...", "pagina": "index.html", "js": "expresión a evaluar" }]
const { chromium } = require('playwright'), fs = require('fs'), http = require('http'), path = require('path');
const [juego, archivo, n = 4] = process.argv.slice(2), trabajos = JSON.parse(fs.readFileSync(archivo, 'utf8'));
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0], f = u.startsWith('/@/') ? u.slice(2) : path.join(juego, u);
  fs.readFile(f, (e, x) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', 'text/html'); r.end(x); }); }).listen(0, '127.0.0.1', async () => {
  const puerto = srv.address().port, b = await chromium.launch(), cola = [...trabajos];
  const obrero = async () => { for (let t; (t = cola.shift());) {
    const p = await b.newPage(), t0 = Date.now(); await p.goto(`http://127.0.0.1:${puerto}/${t.pagina || 'index.html'}?pruebas`); await p.waitForTimeout(800);
    const r = await p.evaluate(t.js).catch(e => 'ERROR ' + e.message); await p.close();
    console.log(JSON.stringify({ nombre: t.nombre, s: Math.round((Date.now() - t0) / 1000), r })); } };
  await Promise.all(Array.from({ length: +n }, obrero)); await b.close(); srv.close(); });
