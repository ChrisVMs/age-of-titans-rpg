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
  'Recargas: 3 anuncios y 1 de cristales al día': `
    jugador.estamina = 0; jugador.cristales = 120;
    const a = [cobrarAnuncio(), cobrarAnuncio(), cobrarAnuncio(), cobrarAnuncio()];
    const c = [recargarConCristales(), recargarConCristales()];
    const est = jugador.estamina; revisarRecargas().dia = 'ayer';
    [a.join() === 'true,true,true,false', c.join() === 'true,false', est === 3 * ESTAMINA_ANUNCIO + RECARGA_CRISTALES.estamina,
     jugador.cristales === 120 - RECARGA_CRISTALES.coste, anunciosQuedan() === ANUNCIOS_DIA]`,
  'Recargas: sin cristales no hay recarga': `
    jugador.cristales = RECARGA_CRISTALES.coste - 1; [recargarConCristales() === false]`,
  'Cristales: capítulo completo una vez por dificultad': `
    jugador.superadas ||= {}; const c0 = jugador.cristales, et1 = CAMPANAS.filter(c => c.id.startsWith('1-'));
    for (const c of et1.slice(0, 9)) jugador.superadas[c.id + ':normal'] = true;
    const antes = premioCapitulo('1-9', 'normal');
    jugador.superadas['1-10:normal'] = true;
    const r = premioCapitulo('1-10', 'normal'), otra = premioCapitulo('1-10', 'normal');
    [antes === null, r.cristales === CRISTALES_CAPITULO.normal, otra === null, jugador.cristales === c0 + CRISTALES_CAPITULO.normal, premioCapitulo('1-10', 'dificil') === null]`,
  'Grieta: la vida pasa al piso siguiente y las bendiciones suben estadísticas': `
    jugador.nivel = 40; const G = revisarGrieta(), c = batallaGrieta(); prepararBatalla(c);
    heroeYo().vida = Math.round(heroeYo().vidaMax / 2); cobrarResultado(true);
    const ofertas = G.ofertas.length, mitad = Math.abs(G.vida - .5) < .01;
    const b = G.ofertas.map(id => BENDICIONES.find(x => x.id === id)).find(x => x.st && !x.cura) || BENDICIONES.find(x => x.id === G.ofertas[0]);
    const sinElegir = batallaGrieta() === null; elegirBendicion(b.id);
    const c2 = batallaGrieta(), atq = estadisticas().ataque; prepararBatalla(c2);
    [ofertas === 3, mitad, sinElegir, c2.grieta === 2, Math.abs(heroeYo().vida / heroeYo().vidaMax - G.vida) < .01,
     !b.st || !b.st.ataque || batalla.st.ataque > atq]`,
  'Grieta: perder termina el intento, 2 por semana, y se cobra solo lo nuevo': `
    jugador.nivel = 40; const G = revisarGrieta();
    prepararBatalla(batallaGrieta()); cobrarResultado(true); G.ofertas = null;
    prepararBatalla(batallaGrieta()); cobrarResultado(false);
    const tras1 = [G.activa, G.intentos, G.mejor].join(), c = batallaGrieta(), premio1 = Object.keys(c.premio).length;
    prepararBatalla(c); cobrarResultado(false);
    [tras1 === 'false,1,1', premio1 === 0, batallaGrieta() === null]`,
  'Grieta: salir a mitad de un piso cuenta como derrota; el lunes se reinicia': `
    jugador.nivel = 40; batallaGrieta(); const G = revisarGrieta(), salio = !G.activa && G.intentos === 1;
    G.semana = 'otra'; revisarGrieta();
    [salio, G.intentos === GRIETA_INTENTOS, G.piso === 0]`,
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
