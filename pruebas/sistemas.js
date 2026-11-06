// Pruebas de los sistemas fuera del combate (misiones, evento semanal...), sin navegador: node pruebas/sistemas.js
// Cada prueba corre en un juego recién cargado (partida nueva). Añadir una = añadir una entrada a PRUEBAS.
const t0 = Date.now();
const PRUEBAS = {
  'Pacto: miembros del servidor, donaciones con tope diario, tecnología con fondos y bono en las estadísticas': `
    cacheBots = DEF_BOTS.map(construirBot);   // un servidor con jugadores (sin bots fijos, el pacto sale de los del servidor)
    jugador.nivel = NIVEL_PACTO; jugador.oro = 1e6; delete jugador.pacto;
    const P = pacto(), f0 = P.fondos, ok = [donarPacto(), donarPacto(), donarPacto(), donarPacto()];
    P.fondos = costeTec(0); const sube = mejorarTec('fuerza'), bono = statsPacto().ataque;
    [P.miembros.length === PACTO_MIEMBROS - 1, ok.join() === 'true,true,true,false', P.fondos === 0, sube, bono === TEC_PACTO[0].pct, !mejorarTec('fuerza')]`,
  'Pacto: el jefe semanal comparte la vida; tus intentos son limitados; los bots le pegan cada día; premio una vez': `
    cacheBots = DEF_BOTS.map(construirBot);   // un servidor con jugadores (sin bots fijos, el pacto sale de los del servidor)
    jugador.nivel = NIVEL_PACTO; delete jugador.pacto; const P = pacto(), v0 = P.jefe.vida;
    const c = batallaPacto(); jugarHastaFin(c, habLista, 300); cobrarResultado(false);
    const v1 = P.jefe.vida, mio = P.jefe.dano.yo || 0;
    batallaPacto(); const sin = batallaPacto();
    offsetDias++; pacto(); const v2 = P.jefe.vida;
    P.jefe.vida = 0; const premio = cobrarPremioPacto(), otra = cobrarPremioPacto();
    [v1 < v0 && v0 - v1 === mio, sin === null, P.intentos === 0, v2 < v1, !!premio, otra === null]`,
  'Jugar hoy sin pantalla: el simulador gasta la estamina de hoy con tu partida y no cambia el día': `
    jugador.nivel = 10; jugador.estamina = ESTAMINA_MAX; const d0 = offsetDias, dia = hoy();
    const r = simularProgresion({ dias: 1, semilla: 7, perfil: structuredClone(jugador), tipo: { ...TIPOS_JUGADOR.constante, juega: 1, gasto: 1, estaminaExtra: 0 } });
    [!!r, r.jugador.estamina < ESTAMINA_CAMPANA, r.jugador.diaEstamina === dia, offsetDias === d0]`,
  'simMejorar en una partida sin mascotas, runas ni skins todavía (bot de pantalla tras perder)': `
    delete jugador.mascotas; delete jugador.runas; delete jugador.skinsPropias; jugador.oro = 1e5; simMejorar();
    [typeof jugador.mascotas === 'object', Array.isArray(jugador.runas)]`,
  'Reintentar: campaña solo con más poder; lo demás 2 veces al día; jefes mundiales, siempre': `
    const p = poder(), f = { '1-2:normal': { poder: p, n: 1 }, 'jefecerbero': { poder: p * 10, n: 1 }, '1-3:normal': { poder: p / (1 + MEJORA_REINTENTO) - 1, n: 1 },
      '1-4:normal': { poder: p, cerca: true, n: 1 }, '1-5:normal': { poder: p, cerca: true, n: REINTENTOS_GRATIS } }, hoy = {};
    anotarDerrota(f, 'torre', hoy); const unaTorre = puedeReintentar(f, 'torre', hoy); anotarDerrota(f, 'torre', hoy);
    [puedeReintentar(f, '2-1:normal', hoy), !puedeReintentar(f, '1-2:normal', hoy), puedeReintentar(f, 'jefecerbero', hoy), puedeReintentar(f, '1-3:normal', hoy),
     unaTorre, !puedeReintentar(f, 'torre', hoy), !f.torre, puedeReintentar(f, '1-4:normal', hoy), !puedeReintentar(f, '1-5:normal', hoy)]`,
  'Bot en grupo: elige el calabozo sin superar más bajo (o el mejor superado) y la primera Torre de reyes sin vencer': `
    const c = CALABOZOS[0]; jugador.calabozos = {}; jugador.calabozosDif = {};
    const abierto = calabozoAbierto(c.id), primero = opcionCalabozoSim();
    jugador.calabozosDif[c.id + ':normal'] = true; const tras = opcionCalabozoSim(), fallado = opcionCalabozoSim(k => k !== 'cal' + c.id + ':dificil');
    const R = revisarReyes(), d0 = Object.keys(DIF_REYES); R.vencidas = {}; const r0 = opcionReyesSim(); R.vencidas[d0[0]] = true;
    [!abierto || primero.join() === c.id + ',normal', !abierto || tras[1] !== 'normal' || tras[0] !== c.id, !abierto || fallado.length === 2, r0 === d0[0], opcionReyesSim() === d0[1]]`,
  'Habilidades con criterio: guarda la más fuerte si viene un jefe, la usa contra el jefe y no remata con habilidades': `
    HABILIDADES = [{ id: 'd', mult: 2, turnos: 1 }, { id: 'f', mult: 4, turnos: 1 }]; batalla.carga.d = batalla.carga.f = 5;
    const u = (jefe, vida = 100) => ({ vida, vidaMax: 100, e: { jefe } });
    const prueba = (enemigos, duelo, lista = [], i = 0) => { batalla.grupo = { enemigos, duelo, objetivo: null }; batalla.campana = { enemigos: lista }; batalla.iEnemigo = i; return habCriterio(); };
    const viene = prueba([u(false)], true, [{}, { jefe: true }]), jefe = prueba([u(true)], true, [{ jefe: true }]);
    const remate = prueba([u(false, 10)], false), normal = prueba([u(false)], false);
    batalla.carga.d = batalla.carga.f = 0; const nada = prueba([u(true)], true, [{ jefe: true }]);
    [viene.id === 'd', jefe.id === 'f', remate === null, normal.id === 'f', nada === null]`,
  'Tipos de jugador: sin tipo es el constante con autoataque; el casual se salta días y gasta menos estamina que el constante': `
    const base = simularProgresion({ dias: 3, semilla: 5, estaminaExtra: 150 }).dia, cte = simularProgresion({ dias: 3, semilla: 5, tipo: { ...TIPOS_JUGADOR.constante, habilidades: 'auto' } }).dia;
    const cas = simularProgresion({ dias: 10, semilla: 5, tipo: 'casual' }).dia, ctl = simularProgresion({ dias: 10, semilla: 5, tipo: 'constante' }).dia;
    const libres = cas.filter(x => x.batallas === 0).length;
    [JSON.stringify(base) === JSON.stringify(cte), libres >= 1 && libres <= 6, cas.at(-1).nivel <= ctl.at(-1).nivel,
     cas.reduce((t, x) => t + x.batallas, 0) < ctl.reduce((t, x) => t + x.batallas, 0)]`,
  'Varios Auto (bot): hace los barridos que permite la estamina y no barre niveles sin superar': `
    const c = CAMPANAS[0]; (jugador.superadas ||= {})[c.id + ':normal'] = true;
    jugador.estamina = ESTAMINA_CAMPANA * 3; const n = barridos(c, 'normal', 10);
    jugador.estamina = ESTAMINA_CAMPANA * 5; const sin = barridos(CAMPANAS[1], 'normal', 10);
    [n === 3, jugador.estamina === ESTAMINA_CAMPANA * 5, sin === 0]`,
  'Cambio de cristales por oro: cobra cristales, da oro según el nivel y no deja comprar sin cristales': `
    jugador.nivel = 10; jugador.cristales = 25; const o = jugador.oro;
    const ok = cambiarOro(0), sin = cambiarOro(0);
    [ok, !sin, jugador.cristales === 5, jugador.oro === o + 3000]`,
  'Skins por clase: el Asesino solo ve las suyas y cada clase guarda su skin equipada': `
    jugador.clase = 'asesino'; jugador.oro = 1e6; const k = SKINS.find(x => x.id === 'espectro');
    const solo = skinsClase().map(x => x.id).join(); comprarSkin(k); ponerSkin('espectro');
    const conSkin = !!skinActual() && skinActual().sprite.tira.includes('espectro');
    jugador.clase = 'guerrero'; const g = skinActual(); jugador.clase = 'asesino';
    [solo === 'espectro', conSkin, g === null, skinPuesta('asesino') === 'espectro']`,
  'Títulos: los bonos de todos los desbloqueados se suman; el elegido solo se muestra': `
    jugador.titulos = {}; const p0 = poder();
    const [a, b] = TITULOS.filter(t => Object.keys(t.bono).length).slice(0, 2); jugador.titulos[a.id] = jugador.titulos[b.id] = true;
    const s = statsTitulos(), p1 = poder(); jugador.titulo = a.id; const p2 = poder();
    [Object.entries(a.bono).every(([k, v]) => s[k] >= v), Object.entries(b.bono).every(([k, v]) => s[k] >= v), p1 > p0, p2 === p1]`,
  'Asesino: tres habilidades desde el inicio; Paso veloz y Danza incesante acortan sus recargas': `
    jugador.clase = 'asesino'; jugador.arbol = {};
    const sin = calcularHabilidades().habs.map(h => h.id).join();
    jugador.arbol = { danza_r: 1, paso_r: 1 }; const con = calcularHabilidades().habs;
    [sin === 'punalada,paso,danza', con.find(h => h.id === 'danza').turnos === 5, con.find(h => h.id === 'paso').turnos === 3, ARBOL.asesino.every(r => r.nodos.length === 5), con.find(h => h.id === 'danza').buff === 'danza']`,
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
    [Math.abs(una - 1) < 1e-6, Math.abs(tope - 8) < 1e-6, r.piedra === 8, jugador.mat.piedra === p0 + 8, tras < 1e-3]`,
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
  'Cristales: un paquete comprado entrega sus cristales': `
    const c0 = jugador.cristales || 0; const ok = cobrarPaquete(1), mal = cobrarPaquete(99);
    [ok, mal === false, jugador.cristales === c0 + PAQUETES_CRISTALES[1].cristales]`,
  'Servidor de bots: plan fijo por semilla, 99 nombres distintos y clases válidas': `
    const p = planServidor(), q = planServidor();
    [p.length === BOTS_SERVIDOR, JSON.stringify(p) === JSON.stringify(q), new Set(p.map(b => b.nombre)).size === p.length,
     p.every(b => CLASES[b.clase] && RITMOS_BOT[b.ritmo] && b.inicio >= INICIO_BOT[0] && b.inicio <= INICIO_BOT[1]),
     JSON.stringify(planServidor(BOTS_SERVIDOR, 2)) !== JSON.stringify(p)]`,
  'Servidor de bots: días pendientes según el día del servidor': `
    const b = { inicio: 3 };
    [diasPendientesBot(b, 0, 2) === 0, diasPendientesBot(b, 0, 3) === 1, diasPendientesBot(b, 2, 5) === 1, diasPendientesBot(b, 5, 5) === 0]`,
  'Servidor de bots: avanzar un bot 2 días sube su nivel y conserva nombre y clase': `
    const b = { id: 0, nombre: 'Prueba', clase: 'mago', inicio: 0, ritmo: 'intenso', semilla: 7 }, yo = jugador.nombre;
    const p = avanzarBot(b, null, 0, 2, 0), p2 = avanzarBot(b, p, 2, 1, 2);
    [p.nivel > 1, p.nombre === 'Prueba', p.clase === 'mago', p.bot === true, p2.nivel >= p.nivel, jugador.nombre === yo]`,
  'Servidor de bots: empiezan sin ventajas (recursos del juego publicado)': `
    const b = { id: 1, nombre: 'Real', clase: 'guerrero', inicio: 0, ritmo: 'casual', semilla: 3 };
    let p0 = null; const r = simularProgresion; simularProgresion = o => { p0 = structuredClone(o.perfil); return null; };
    try { avanzarBot(b, null, 0, 1, 0); } finally { simularProgresion = r; }
    [!p0 || (p0.oro === INICIO_REAL_BOT.oro && p0.mat.piedra === INICIO_REAL_BOT.mat.piedra && p0.mat.esencia === 0 && p0.cristales === 0)]`,
  'Clases: cadena guerrero > asesino/arquero > maga > guerrero (entre personajes; contra monstruos no cuenta)': `
    const v = (a, b) => duelosClase(a, b, { veces: 30 });
    [ventajaClase('mago', 'guerrero') > 1, ventajaClase('guerrero', 'mago') === 1, ventajaClase('asesino', undefined) === 1,
     v('guerrero', 'asesino') > .55, v('guerrero', 'arquero') > .55, v('mago', 'guerrero') > .55, v('asesino', 'mago') > .52, v('arquero', 'mago') > .55,
     Math.abs(v('asesino', 'arquero') - .5) < .15]`,
  'Arena: el rival es un jugador del servidor con tu poder × f (lucha con sus habilidades)': `
    const antes = cacheBots; cacheBots = DEF_BOTS.slice(0, 3).map(construirBot);   // un servidor con jugadores
    const A = revisarArena(), e = batallaArena(1).enemigos[0], pd = conPerfil(e.perfil, () => poder()) * e.pct; cacheBots = antes;
    [!!e.perfil, e.pct > 0, Math.abs(pd / (poder() * A.rivales[1].f) - 1) < .01]`,
  'Contenido alto: el arte de un enemigo se enchufa como dato (hoja)': `
    const T = TIPOS_ENEMIGO.esqueleto, antes = T.hoja; T.hoja = 'img/enemigos/esqueleto.png';
    const e = crearDificultad(15, 'normal', ['esqueleto']).enemigos[0], sin = crearDificultad(15, 'normal', ['parca']).enemigos[0];
    T.hoja = antes;
    [e.hoja === 'img/enemigos/esqueleto.png', !sin.hoja, e.filtro === T.filtro]`,
  'Jefes: Pesadilla se abre al vencer al normal, más dura y con su propia vida del día': `
    const cerrada = !jefeAbierto('cerbero', 'pesadilla'); (jugador.logros ||= {}).jefes = { cerbero: true };
    const n = batallaMundial('cerbero', 'normal'), p = batallaMundial('cerbero', 'pesadilla');
    estadoMundial('cerbero', 'normal').vida = 5;
    [cerrada, jefeAbierto('cerbero', 'pesadilla'), p.enemigos[0].vida === vidaJefe('cerbero', 'pesadilla'), p.enemigos[0].vida > n.enemigos[0].vida,
     p.premio.oro > n.premio.oro, estadoMundial('cerbero', 'pesadilla').vida === vidaJefe('cerbero', 'pesadilla'), p.difJefe === 'pesadilla']`,
  'Jefes: piezas de Pesadilla con líneas a ★4 o más y garantía propia': `
    batalla.danoHecho = 0; jugador.pityJefe = { 'cerbero:pesadilla': DIF_JEFE.pesadilla.garantia - 1 }; obtenidos = [];
    const n0 = jugador.objetos.length; botinEquipoJefe('cerbero', false, 'pesadilla'); const o = jugador.objetos.at(-1);
    [jugador.objetos.length === n0 + 1, o.lineas.every(l => l.e >= DIF_JEFE.pesadilla.estrellasMin), jugador.pityJefe['cerbero:pesadilla'] === 0, !jugador.pityJefe.cerbero]`,
  'Botín: solo por batalla completa ganada, nunca por monstruo': `
    jugador.nivel = 10; const c = batallaCampana(CAMPANAS[3], 'normal');
    prepararBatalla(c); const u = batalla.grupo.enemigos[0]; cobrar(u); const tras1 = batalla.ganado.oro; cobrarResultado(false); const perdio = batalla.ganado.oro;
    prepararBatalla(batallaCampana(CAMPANAS[3], 'normal')); const u2 = batalla.grupo.enemigos[0]; cobrar(u2); cobrarResultado(true);
    [tras1 === 0, perdio === 0, batalla.ganado.oro >= u2.e.oro + (c.premio.oro || 0)]`,
  'Evento: bloqueado antes de su nivel': `
    jugador.nivel = 1; contarMision(temaSemana().ev, 1000); [revisarEvento().fichas === 0]`,
  'Textos: cada número de un valor (árbol en puntos, bendiciones de la Grieta, eventos, modificadores) sale en su descripción': `
    const limpio = t => t.replace(/<[^>]+>/g, ''), cifra = v => String(+(+v).toFixed(2)).replace('.', '[,.]');
    const mal = [], ver = (quien, t, vals) => { for (const v of vals) if (v && !new RegExp('(^|[^0-9,.])' + cifra(v) + '([^0-9]|$)').test(limpio(t))) mal.push(quien + ': falta ' + v + ' en «' + limpio(t) + '»'); };
    for (const [cl, ramas] of Object.entries(ARBOL)) for (const r of ramas) for (const n of r.nodos)   // rango 1
      ver(cl + '/' + n.id, n.d(1), [...Object.values(n.ef || {}).map(v => puntosDe(v)), ...Object.values(n.stat || {}), ...(n.golpe ? [n.golpe.prob, n.golpe.pct * 100, n.golpe.turnos] : []), ...(n.habMult ? [n.habMult[1] * 100] : [])]);
    for (const h of HAB_TODAS.filter(h => h.nodo)) ver('habilidad/' + h.id, ARBOL[h.clase].flatMap(r => r.nodos).find(n => n.id === h.nodo).d(1), [h.mult, h.turnos]);
    for (const b of BENDICIONES) ver('grieta/' + b.id, b.desc, [...Object.values(b.st || {}), (b.cura || 0) * 100]);
    for (const e of EVENTOS) ver('evento/' + e.nombre, e.desc, [...['mat', 'oro', 'jefes', 'xp'].map(k => e[k] ? (e[k] - 1) * 100 : 0), e.drop && e.drop !== 2 ? (e.drop - 1) * 100 : 0, (e.forja || 0) * 100, (e.caza || 0) * 100]);
    for (const m of [...MODIFICADORES, ...MODIFICADORES.filter(x => x.torre).map(x => ({ ...x, ...x.torre, id: x.id + ' (Torre)' }))]) {   // se aplica a un enemigo de prueba
      const e = { vida: 1000, dano: [100, 100], armadura: 0 }; m.ap(e);
      ver('modificador/' + m.id, m.desc, [(e.dano[0] / 100 - 1) * 100, (e.vida / 1000 - 1) * 100, e.armadura, (e.espinas || 0) * 100, (e.regen || 0) * 100]);
    }
    mal.length ? mal : [true]`,
  'Clases: el crítico es del asesino y del arquero; guerrero y maga solo lo consiguen con equipo, runas, mascota, skins…': `
    const conCritico = c => [...ARBOL[c].flatMap(r => r.nodos).filter(n => (n.ef || {}).critico).map(n => n.id), ...((CLASES[c].ef || {}).critico ? ['clase'] : [])];
    [!BASE_SEC.critico, conCritico('guerrero').length === 0, conCritico('mago').length === 0, conCritico('asesino').length > 0, conCritico('arquero').length > 0]`,
};
let ok = 0;
for (const [nombre, codigo] of Object.entries(PRUEBAS)) {
  let r; try { r = require('./cargar')().correr(`{ ${codigo} }`); } catch (e) { r = [e.message]; }
  const bien = Array.isArray(r) && r.every(x => x === true); ok += bien;
  console.log(bien ? '✅' : '❌', nombre, bien ? '' : '· ' + JSON.stringify(r));
}
console.log(`${ok}/${Object.keys(PRUEBAS).length} en ${Date.now() - t0} ms`);
process.exitCode = ok === Object.keys(PRUEBAS).length ? 0 : 1;
