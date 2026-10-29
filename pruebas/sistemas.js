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
  'Ruinas: producen por hora, con tope del almacén, y guardan los decimales': `
    jugador.nivel = 30; jugador.oro = 1e7; jugador.mat.piedra = 1e4;
    mejorarEdificio('forja'); mejorarEdificio('forja'); const p0 = jugador.mat.piedra;
    offsetDias += 1 / 24; const una = produccionRuinas().piedra;       // 1 h a Nv 2: 0,5 × 2 = 1 piedra
    offsetDias += 1; const tope = produccionRuinas().piedra;            // 25 h: se queda en las 8 del almacén
    const r = recogerRuinas(), tras = produccionRuinas().piedra;
    [Math.abs(una - 1) < 1e-6, Math.abs(tope - 8) < 1e-6, r.piedra === 8, jugador.mat.piedra === p0 + 8, tras === 0]`,
  'Ruinas: reloj hacia atrás no produce; edificio bloqueado por nivel; el almacén amplía el tope': `
    jugador.nivel = 30; jugador.oro = 1e8; jugador.mat.piedra = 1e4; mejorarEdificio('forja');
    offsetDias -= 2; const atras = produccionRuinas().piedra || 0; offsetDias += 2;
    const bloqueado = mejorarEdificio('pozo') === false;
    for (let i = 0; i < 10; i++) mejorarEdificio('almacen');
    [atras === 0, bloqueado, Math.abs(horasAlmacen() - 16) < 1e-9, mejorarEdificio('almacen') === false]`,
  'Ruinas: bonos de estadísticas, oro y encantar': `
    jugador.nivel = 30; jugador.oro = 1e8; jugador.mat.piedra = 1e4;
    const vida0 = estadisticas().vida, o = { enc: 0 }, enc0 = costeEncantar(o).oro;
    for (let i = 0; i < 10; i++) { mejorarEdificio('altar'); mejorarEdificio('forja'); mejorarEdificio('tesoreria'); }
    [estadisticas().vida > vida0, Math.abs(bonoRuinas('oro') - .05) < 1e-9, costeEncantar(o).oro === Math.round(enc0 * .9)]`,
  'Ecos: reto diario gratis, una vez al día, con memoria y venganza': `
    jugador.nivel = 20; const E = revisarEcos(), id = E.reto, R = E.rival[id], f0 = fuerzaEco(id), cr0 = jugador.cristales;
    const otro = ECOS.find(e => e.id !== id).id, noOtro = batallaEco(otro) === null;
    prepararBatalla(batallaEco()); cobrarResultado(true);
    const gano = [R.gan, R.racha].join(), venganza = Math.abs(fuerzaEco(id) / f0 - (1 + VENGANZA_PASO)) < 1e-9, cr1 = jugador.cristales - cr0;
    const unaVez = batallaEco() === null; E.dia = 'ayer'; revisarEcos(); E.reto = id;
    prepararBatalla(batallaEco()); cobrarResultado(false);
    [noOtro, gano === '1,1', venganza, cr1 === CRISTALES_RETO, unaVez, R.venganza === 0 && R.racha === 0 && R.per === 1, E.puntos === PUNTOS_ECO.victoria]`,
  'Ecos: la venganza tiene tope y Aldric baja tras 3 victorias seguidas': `
    jugador.nivel = 20; const E = revisarEcos(), R = E.rival.aldric; const f0 = eco('aldric').fuerza(R);
    for (let i = 0; i < 5; i++) { E.dia = 'x' + i; revisarEcos(); E.reto = 'aldric'; prepararBatalla(batallaEco()); cobrarResultado(true); }
    [R.venganza === VENGANZA_MAX, f0 === 1.15, eco('aldric').fuerza(R) === 1.05]`,
  'Ecos: ranking semanal con premio el lunes y título a las 10 victorias': `
    jugador.nivel = 20; const E = revisarEcos(); E.puntos = 1e6; const cr0 = jugador.cristales, fi0 = revisarEvento().fichas;
    const primero = rankingEcos()[0].yo; E.semana = 'pasada'; revisarEcos();
    E.rival.kael.gan = VICTORIAS_TITULO_ECO; revisarTitulos(false);
    [primero, jugador.cristales - cr0 === PREMIO_RANKING_ECOS[0].cristales, revisarEvento().fichas - fi0 === PREMIO_RANKING_ECOS[0].fichas, E.puntos === 0,
     jugador.titulos.eco_kael === true]`,
  'Códice: hitos de colección una sola vez, con premio': `
    const c = COLECCIONES.find(x => x.id === 'mascotas'), n = MASCOTAS.length; jugador.mascotas = {};
    const nada = reclamarHito('mascotas', 25) === null;
    for (const m of MASCOTAS.slice(0, Math.ceil(n / 2))) jugador.mascotas[m.id] = 1;
    const cr0 = jugador.cristales, fi0 = revisarEvento().fichas;
    const h25 = !!reclamarHito('mascotas', 25), h50 = !!reclamarHito('mascotas', 50), otra = reclamarHito('mascotas', 25) === null, h75 = reclamarHito('mascotas', 75) === null;
    [nada, h25, h50, otra, h75, jugador.cristales - cr0 === 8, revisarEvento().fichas - fi0 === 20,
     hitosPendientes().every(([id, p]) => id !== 'mascotas' || p > 50)]`,
  'Códice: marco al completar y solo si está ganado': `
    jugador.mascotas = {}; for (const m of MASCOTAS) jugador.mascotas[m.id] = 1;
    const sinGanar = ponerMarco('zarpa') === false && ponerMarco('mascotas') === false;
    for (const p of [25, 50, 75, 100]) reclamarHito('mascotas', p);
    [sinGanar, ponerMarco('mascotas'), marcoActual() === 'mascotas', ponerMarco('skins') === false, ponerMarco(null) && marcoActual() === null]`,
  'Códice: cazador veterano a las 100 y piezas de set aunque se desguacen': `
    const n = enemigosColeccion()[0]; jugador.bestiario = { [n]: 99 };
    const v = COLECCIONES.find(c => c.id === 'veterano'), antes = progresoColeccion(v)[0]; jugador.bestiario[n] = 100;
    const m = MODELOS.find(x => x.jefe), o = crearObjeto(m.id); jugador.objetos.push(o);
    const sets = COLECCIONES.find(c => c.id === 'sets'), conPieza = progresoColeccion(sets)[0];
    desguazar([o]); jugador.objetos = jugador.objetos.filter(x => x !== o);
    [antes === 0, progresoColeccion(v)[0] === 1, conPieza === 1, progresoColeccion(sets)[0] === 1]`,
  'Torre alta: Esencia en los hitos desde el 100 y Ancestral cada 50': `
    const sinEs = !premioHito(90).esencia, es100 = premioHito(100).esencia === 10, es120 = premioHito(120).esencia === 14;
    jugador.torre.mejor = 149; const n0 = jugador.objetos.length, e0 = jugador.mat.esencia; pisoSuperado(150);
    const o = jugador.objetos.at(-1);
    jugador.torre.mejor = 159; pisoSuperado(160); const o2 = jugador.objetos.at(-1);
    [sinEs, es100, es120, modelo[o.modelo].rareza === 'ancestral', jugador.mat.esencia - e0 === premioHito(150).esencia + premioHito(160).esencia,
     modelo[o2.modelo].rareza !== 'ancestral', jugador.objetos.length === n0 + 2]`,
  'Torre alta: enemigos de las etapas 2-3 desde el 101 (si están disponibles)': `
    const nombres = n => pisoTorre(n).enemigos.map(e => e.nombre).join();
    const altos = TIPOS_TORRE_ALTA.map(t => TIPOS_ENEMIGO[t].nombre);
    [!altos.some(x => nombres(99).includes(x)), altos.some(x => nombres(101).includes(x)) || altos.some(x => nombres(102).includes(x)),
     pisoTorre(120).enemigos[0].nombre === TIPOS_ENEMIGO.senor.nombre]`,
  'Estados: los monstruos hacen daño fijo (no % de tu vida), con tope': `
    const c = CAMPANAS.find(x => x.id === '1-5'), e = c.dificultades.dificil.enemigos.find(x => (x.aplica || []).some(a => a.pct));
    const a = e.aplica.find(x => x.pct); prepararBatalla(batallaCampana(c, 'dificil')); const yo = heroeYo();
    const d1 = danoEstadoMonstruo(e, a, yo); yo.vidaMax *= 10; const d2 = danoEstadoMonstruo(e, a, yo);
    const jefe = danoEstadoMonstruo({}, { pct: .05 }, { vidaMax: 1000 });
    [d1 === d2, d1 === Math.max(1, Math.round(vidaEsperada(e.nEq) * Math.min(a.pct, TOPE_PCT_ESTADO))), jefe === 25]`,
  'Estados: al héroe y a los jefes el mismo estado reinicia su duración (no se acumula)': `
    prepararBatalla(batallaCampana(CAMPANAS[0], 'normal')); const yo = heroeYo(), mob = batalla.grupo.enemigos[0];
    aplicarEstado(yo, 'veneno', 3, 10); yo.estados.veneno.turnos = 1; aplicarEstado(yo, 'veneno', 3, 10);
    aplicarEstado(yo, 'quemadura', 2, 5);
    mob.e.jefe = false; aplicarEstado(mob, 'veneno', 3, 10); aplicarEstado(mob, 'veneno', 3, 10);
    const jefe = { heroe: false, e: { jefe: true }, estados: {}, conEfectos: false }; aplicarEstado(jefe, 'veneno', 3, 10); aplicarEstado(jefe, 'veneno', 3, 10);
    [yo.estados.veneno.pilas === 1, yo.estados.veneno.turnos === 3, !!yo.estados.quemadura, mob.estados.veneno.pilas === 2, jefe.estados.veneno.pilas === 1]`,
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
