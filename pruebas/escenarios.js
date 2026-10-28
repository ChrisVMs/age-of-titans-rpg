// Corre los escenarios de prueba del combate sin navegador: node pruebas/escenarios.js
const t0 = Date.now(), juego = require('./cargar')();
const res = juego.correr('correrEscenarios()');
for (const r of res) console.log(r.ok ? '✅' : r.pendiente ? '⚠️ ' : '❌', r.nombre, r.ok ? '' : '· ' + r.detalle);
console.log(`${res.filter(r => r.ok).length}/${res.length} en ${Date.now() - t0} ms`);
process.exitCode = res.every(r => r.ok || r.pendiente) ? 0 : 1;
