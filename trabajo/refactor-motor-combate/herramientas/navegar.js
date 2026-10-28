// Recorre todas las pantallas del juego y sus pestañas buscando errores. Uso: node navegar.js <carpeta del juego> (Playwright con Chromium)
const { chromium } = require('playwright'), fs = require('fs'), http = require('http'), path = require('path');
const juego = process.argv[2];
const srv = http.createServer((q, r) => { const f = path.join(juego, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, x) => { if (e) { r.statusCode = 404; return r.end(); }
  r.setHeader('Content-Type', f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'); r.end(x); }); }).listen(0, '127.0.0.1', async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 900, height: 420 } }), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/index.html?pruebas`); await p.waitForTimeout(1200);
  await p.evaluate(`jugador = Object.assign(construirBot(DEF_BOTS[0], 95), { formacion: { pos: 'frente', aliados: [] }, torre: { mejor: 12 }, nombre: 'Prueba' }); jugador.mascotas ||= {}; pintarCampamento();`);
  const pantallas = await p.evaluate(`[...document.querySelectorAll('.pantalla')].map(x => x.id)`);
  for (const id of pantallas) { await p.evaluate(`try { ir('${id}') } catch (e) { console.error(e) }`); await p.waitForTimeout(250);
    const tabs = await p.$$(`#${id} [data-tab], #${id} [data-invtab], #${id} [data-mtab]`); for (const t of tabs) { await t.click({ force: true }).catch(() => {}); await p.waitForTimeout(80); }
    await p.evaluate(`document.querySelectorAll('.modal.visible').forEach(m => m.classList.remove('visible'))`); }
  console.log('pantallas:', pantallas.length, '· errores:', errs.length ? errs : 'ninguno'); await b.close(); srv.close(); });
