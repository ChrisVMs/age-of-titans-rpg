// La pantalla no debe cambiar el juego: la misma partida simulada tiene que dar lo mismo cargando solo la lógica que
// cargando también la pantalla (con el navegador simulado). Se compara la partida entera al final de cada día (no solo el
// resumen). Si falla, algo de js/pantalla gasta azar o cambia el estado (p. ej. renueva algo "al consultarlo" en otro momento).
// Uso: node pruebas/sin-pantalla.js [días] [semillas, separadas por comas]
const cargar = require('./cargar'), conPantalla = cargar({ pantalla: true }), soloLogica = cargar();
const dias = +process.argv[2] || 20, semillas = (process.argv[3] || '1,2,3,4,5').split(',').map(Number);
// primera diferencia entre dos partidas (ruta y valores), o null
function diferencia(a, b, ruta = '') {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = diferencia(a[k], b[k], `${ruta}.${k}`); if (d) return d; }
  }
  return `${ruta || '(raíz)'}: ${JSON.stringify(a)?.slice(0, 80)} ≠ ${JSON.stringify(b)?.slice(0, 80)}`;
}
let ok = true;
for (const semilla of semillas) {
  const q = `(() => { const dias = []; simularProgresion({ dias: ${dias}, semilla: ${semilla}, alDia: () => dias.push(JSON.stringify(jugador)) }); return dias; })()`;
  const A = conPantalla.correr(q), B = soloLogica.correr(q);
  const d = A.findIndex((x, i) => x !== B[i]), igual = d < 0;
  console.log(igual ? '✅' : '❌', `semilla ${semilla}: ${igual ? 'igual con pantalla y sin ella' : `distinta con pantalla desde el día ${d + 1} → ${diferencia(JSON.parse(A[d]), JSON.parse(B[d]))}`}`);
  ok &&= igual;
}
process.exitCode = ok ? 0 : 1;
