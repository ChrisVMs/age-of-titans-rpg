// La pantalla no debe cambiar el juego: la misma partida simulada tiene que dar lo mismo cargando solo la lógica que
// cargando también la pantalla (con el navegador simulado). Si falla, algo de js/pantalla gasta azar o cambia el estado.
// Uso: node pruebas/sin-pantalla.js
const cargar = require('./cargar'), conPantalla = cargar({ pantalla: true }), soloLogica = cargar();
let ok = true;
for (const semilla of [1, 2, 3]) {
  const q = `JSON.stringify(simularProgresion({ dias: 20, semilla: ${semilla} }).dia)`, igual = conPantalla.correr(q) === soloLogica.correr(q);
  console.log(igual ? '✅' : '❌', `semilla ${semilla}: ${igual ? 'igual' : 'distinta'} con pantalla y sin ella`); ok &&= igual;
}
process.exitCode = ok ? 0 : 1;
