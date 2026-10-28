// Compara dos versiones del juego con las mismas batallas y semillas (sin navegador).
// Uso: node pruebas/equivalencia.js <carpeta de la otra versión>   (por ejemplo, un `git worktree` del commit anterior)
// Juega 234 casos (6 perfiles × campaña, Torre, calabozo, reyes, arena, jefes y duelo) con 6 semillas en cada versión.
const fs = require('fs'), path = require('path');
const medir = fs.readFileSync(path.join(__dirname, '..', 'trabajo', 'refactor-motor-combate', 'herramientas', 'medir-semilla.js'), 'utf8');
const otra = require(path.resolve(process.argv[2], 'pruebas', 'cargar.js'))(), esta = require('./cargar')();
const A = otra.correr(medir), B = esta.correr(medir), dif = {};
let n = 0;
for (const k of Object.keys(A)) { if (k[0] === '_') continue; n++;
  if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) { const m = k.split(' · ')[1].replace(/[0-9]+$/, '').replace(/-medio$/, ''); dif[m] = (dif[m] || 0) + 1; } }
console.log(`${n} casos · distintos: ${Object.values(dif).reduce((a, b) => a + b, 0)}`, Object.keys(dif).length ? JSON.stringify(dif) : '');
process.exitCode = Object.keys(dif).length ? 1 : 0;
