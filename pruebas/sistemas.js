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
  'Despertar: pide el máximo y nivel 50, cobra y sube el bono un 10 % por nivel': `
    const m = MASCOTAS[0]; jugador.mascotas = { [m.id]: 9 }; jugador.mascota = m.id; jugador.nivel = 50;
    jugador.oro = 1e6; jugador.mat.esencia = 1000;
    const sinMax = despertar('mascota', m.id) === false; jugador.mascotas[m.id] = 10; jugador.nivel = 49;
    const sinNivel = despertar('mascota', m.id) === false; jugador.nivel = 50;
    const a = Object.keys(m.bono)[0], pct = () => { const k = m.bono[a]; return valorNivel(k, 10) * multDespertar('mascota', m.id); };
    const p0 = pct(), es0 = jugador.mat.esencia, ok = despertar('mascota', m.id), p1 = pct();
    [sinMax, sinNivel, ok, Math.abs(p1 / p0 - 1.1) < 1e-9, jugador.mat.esencia === es0 - COSTE_DESPERTAR[0].esencia]`,
  'Despertar: tope en D5 y pasiva desde D3': `
    const k = SKINS[0]; jugador.skinsPropias = { [k.id]: 5 }; jugador.skin = k.id; jugador.nivel = 60; jugador.oro = 1e7; jugador.mat.esencia = 1e4;
    const v0 = valorSkin(k); despertar('skin', k.id); despertar('skin', k.id); const sinPasiva = !pasivaDespertar('skin', k.id);
    despertar('skin', k.id); const v3 = valorSkin(k), conPasiva = pasivaDespertar('skin', k.id);
    despertar('skin', k.id); despertar('skin', k.id);
    [sinPasiva, conPasiva, Math.abs(v3 - (Math.round((k.valor * 1 * 1.3 + PASIVA_SKIN.valor) * 10) / 10)) < 1e-9, v3 > v0,
     nivelDespertar('skin', k.id) === DESPERTAR_MAX, despertar('skin', k.id) === false]`,
  'Despertar: las reliquias despertadas dan la mitad a los aliados': `
    const r = RELIQUIAS.find(x => x.ef); const esp = Object.keys(r.ef)[0];
    jugador.reliquias = { [r.id]: 5 }; jugador.reliquiasPuestas = [r.id]; jugador.nivel = 60; jugador.oro = 1e7; jugador.mat.esencia = 1e4;
    const antes = efectoReliquiasAliados(esp); for (let i = 0; i < 3; i++) despertar('reliquia', r.id);
    [antes === 0, Math.abs(efectoReliquiasAliados(esp) - efectoReliquias(esp) * PASIVA_RELIQUIA) < 1e-9]`,
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
