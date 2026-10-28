// Uso: node pantalla.js <carpeta del juego>   (necesita Playwright con Chromium)
// Juega batallas reales en pantalla (autoataque, velocidad máxima) y comprueba que terminan sin errores.
const { chromium } = require('playwright'), fs = require('fs'), http = require('http'), path = require('path');
const juego = process.argv[2], SP = path.dirname(process.argv[1]);
const srv = http.createServer((q, r) => { const f = path.join(juego, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('Content-Type', f.endsWith('.html') ? 'text/html' : f.endsWith('.png') ? 'image/png' : f.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream'); r.end(d); }); }).listen(8766, '127.0.0.1');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 900, height: 420 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('http://127.0.0.1:8766/index.html?pruebas'); await p.waitForTimeout(1200);
  await p.evaluate(`jugador = Object.assign(construirBot(DEF_BOTS[1], 90), { formacion: { pos: 'frente', aliados: [] }, torre: { mejor: 0 } }); jugador.formacion.aliados = [{ bot: 'Kaito', pos: 'arriba' }];`);
  const batallas = [
    ['arena', `revisarArena(); generarRivales(); iniciarCampana(batallaArena(0))`],
    ['cerbero', `jugador.mundiales = {}; estadoMundial('cerbero').vida = Math.round(MUNDIALES.cerbero.enemigo.vida * .52); iniciarCampana(batallaMundial('cerbero'))`],
    ['asmodeo', `jugador.mundiales = {}; estadoMundial('asmodeo').vida = Math.round(MUNDIALES.asmodeo.enemigo.vida * .55); iniciarCampana(batallaMundial('asmodeo'))`],
    ['minotauro', `jugador.mundiales = {}; estadoMundial('minotauro').vida = Math.round(MUNDIALES.minotauro.enemigo.vida * .75); iniciarCampana(batallaMundial('minotauro'))`],
    ['duelo3', `iniciarCampana({ nombre: 'Duelo', coste: 0, premio: {}, botin: { piedra: [1, 2], polvo: .3 }, enemigos: crearDificultad(6, 'normal', ['parca', 'ignea', 'escarcha']).enemigos })`],
    ['campaña+aliado', `iniciarCampana(batallaCampana(CAMPANAS[3], 'normal'))`],
    ['torre', `iniciarCampana(batallaTorre(10))`],
  ];
  for (const [nombre, js] of batallas) {
    const antes = errs.length;
    await p.evaluate(`ponerVelocidad(VELOCIDADES.at(-1)); ${js}`); await p.waitForTimeout(1500);
    await p.evaluate(`if (!auto) btnAuto.click()`);
    let fin = false; const t0 = Date.now();
    while (Date.now() - t0 < 120000) { await p.waitForTimeout(1000); if (await p.evaluate(`$('resultado').classList.contains('visible')`)) { fin = true; break; } }
    await p.screenshot({ path: path.join(SP, `pant_${nombre}.png`) });
    const res = await p.evaluate(`$('resTitulo').textContent + ' · ' + $('resTexto').textContent.slice(0, 90)`);
    console.log(nombre.padEnd(16), fin ? 'terminó:' : 'NO TERMINÓ', fin ? res : '', errs.length > antes ? '\n   ERRORES: ' + errs.slice(antes).join(' | ') : '');
    await p.evaluate(`if (auto) btnAuto.click(); salirBatalla('pCampana')`); await p.waitForTimeout(500);
  }
  await b.close(); srv.close();
})();
