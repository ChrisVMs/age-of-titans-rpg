// Pruebas de los sistemas fuera del combate (misiones, evento semanal...), sin navegador: node pruebas/sistemas.js
// Cada prueba corre en un juego recién cargado (partida nueva). Añadir una = añadir una entrada a PRUEBAS.
const t0 = Date.now();
const PRUEBAS = {
  'Barra de actividad: el cofre 1 pide 2 misiones y no se cobra dos veces': `
    const M = revisarMisiones(); M.diaria.enemigos = 30;
    reclamarMision('diaria', 'd_enem'); const antes = reclamarMision('diaria', 'cofre0');
    M.diaria.victoria = 5; reclamarMision('diaria', 'd_vict');
    [antes === null, !!reclamarMision('diaria', 'cofre0'), reclamarMision('diaria', 'cofre0') === null, reclamarMision('diaria', 'cofre1') === null]`,
  'Evento: solo la actividad del tema da fichas, con tope semanal': `
    jugador.nivel = 20; const t = temaSemana(), otro = TEMAS_SEMANA.find(x => x.ev !== t.ev);
    contarMision(otro.ev, 5); const f0 = revisarEvento().fichas;
    contarMision(t.ev, Math.ceil(10 / t.fichas)); const f1 = revisarEvento().fichas;
    contarMision(t.ev, 1e6);
    [f0 === 0, f1 >= 10, revisarEvento().ganadas === TOPE_FICHAS_SEMANA]`,
  'Evento: tienda con límite semanal y título del tema una vez': `
    jugador.nivel = 20; const E = revisarEvento(); E.fichas = 5000; const it = TIENDA_EVENTO[0];
    for (let i = 0; i < it.max; i++) comprarEvento(it.id);
    const tope = comprarEvento(it.id) === null, tit = !!comprarEvento('titulo'), otra = comprarEvento('titulo') === null;
    E.semana = 'otra'; const nueva = !!comprarEvento(it.id);
    [tope, tit, otra, jugador.titulos[idTituloTema(temaSemana())] === true, nueva]`,
  'Evento: bloqueado antes de su nivel': `
    jugador.nivel = 1; contarMision(temaSemana().ev, 1000); [revisarEvento().fichas === 0]`,
};
let ok = 0;
for (const [nombre, codigo] of Object.entries(PRUEBAS)) {
  let r; try { r = require('./cargar')().correr(`{ ${codigo} }`); } catch (e) { r = [e.message]; }
  const bien = Array.isArray(r) && r.every(x => x === true); ok += bien;
  console.log(bien ? '✅' : '❌', nombre, bien ? '' : '· ' + JSON.stringify(r));
}
console.log(`${ok}/${Object.keys(PRUEBAS).length} en ${Date.now() - t0} ms`);
process.exitCode = ok === Object.keys(PRUEBAS).length ? 0 : 1;
