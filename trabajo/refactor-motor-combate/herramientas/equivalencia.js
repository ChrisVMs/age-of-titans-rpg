// Compara dos versiones del juego con la misma semilla (ver ESTADO.md, "Cómo verificar").
// Uso: node equivalencia.js <carpeta del juego> <ruta a antes.html>        (necesita Playwright con Chromium)
//   MEDIR=medir-duelo.js node equivalencia.js ...   → estadísticas de 1 contra 1 en vez de igualdad exacta
// Sirve index.html y la copia en http://127.0.0.1:8765, corre el script de medida en las dos y muestra las diferencias.
const { chromium } = require('playwright'), fs = require('fs'), http = require('http'), path = require('path');
const [juego, antes] = process.argv.slice(2), SP = path.dirname(process.argv[1]);   // SP: esta carpeta (los scripts de medida y el resultado)
const srv = http.createServer((q, r) => { const u = q.url.split('?')[0]; const f = u === '/antes.html' ? antes : path.join(juego, decodeURIComponent(u));
  fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'); r.end(d); }); }).listen(8765, '127.0.0.1');
(async () => {
  const b = await chromium.launch(), code = fs.readFileSync(path.join(SP, process.env.MEDIR || 'medir-semilla.js'), 'utf8'), res = {};
  for (const v of ['antes.html', 'index.html']) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://127.0.0.1:8765/${v}?pruebas`); await p.waitForTimeout(1500);
    res[v] = await p.evaluate(code).catch(e => ({ __error: String(e) }));
    if (errs.length) console.log(v, 'errores de página:', errs.slice(0, 5));
    await p.close();
  }
  await b.close(); srv.close();
  const A = res['antes.html'], N = res['index.html'];
  if (A.__error || N.__error) { console.log(A.__error, N.__error); return; }
  let dif = 0, tot = 0;
  for (const k of Object.keys(A)) { if (k === '__escenarios') continue; tot++;
    if (JSON.stringify(A[k]) !== JSON.stringify(N[k])) { dif++; if (dif <= 12) console.log('DISTINTO', k, '\n  antes', A[k].slice(0, 2).join(' | '), '\n  ahora', (N[k] || []).slice(0, 2).join(' | ')); } }
  console.log(`casos: ${tot}, distintos: ${dif}`);
  if (N.__escenarios) console.log('escenarios ahora:\n ' + N.__escenarios.join('\n '));
  fs.writeFileSync(path.join(SP, process.env.SALIDA || "resultado.json"), JSON.stringify(res));
})();
