  // ---------------- Simulador de progresión (pruebas) ----------------
  // simMejor, simRunas, simMejorar, simRefinar y simCobrar: las decisiones del jugador simulado (simularProgresion, abajo).
  // No llaman a ui.aplicarEquipo(): solo repinta la pantalla, y repintar en cada prueba hacía el simulador varias veces más lento.
  function simMejor(lista, poner) {   // pone la opción de lista que más poder da
    let mejor = null, p0 = -1;
    for (const x of lista) { poner(x); const p = poder(); if (p > p0) { p0 = p; mejor = x; } }
    poner(mejor);
  }
  function simRunas() {   // fusiona las repetidas y llena las ranuras con las que más poder dan
    if (!desbloqueado('pRunas') || !jugador.runas) return;
    jugador.runasPuestas ||= Array(RANURAS_RUNA).fill(null);
    for (let otra = true; otra;) { otra = false; for (const r of jugador.runas) if (!jugador.runasPuestas.includes(r.uid) && fusionarRuna(r)) { otra = true; break; } }
    for (let i = 0; i < RANURAS_RUNA; i++) {
      const libres = jugador.runas.filter(r => !jugador.runasPuestas.includes(r.uid) || jugador.runasPuestas[i] === r.uid);
      simMejor([null, ...libres], r => { jugador.runasPuestas[i] = r ? r.uid : null; });
    }
  }
  // Greedy perezoso: cada mejora posible (encantar una pieza puesta, comprar o subir una mascota o una skin, subir una runa
  // puesta, crear una runa si hay ranura libre) se valora en poder por oro; se toma la de más valor recalculándola, y si
  // sigue siendo la mejor se compra. Solo se recalcula la de arriba: decide como el greedy completo con muchos menos cálculos.
  // El encantamiento cuenta su probabilidad; la runa nueva, la ganancia media de los tipos.
  function simMejorar() {
    jugador.mascotas ||= {}; jugador.runas ||= []; jugador.skinsPropias ||= {};   // una partida de pantalla los crea al abrir su pantalla
    const ponerMascota = () => simMejor(MASCOTAS.filter(m => nivelMascota(m) > 0).map(m => m.id), id => { jugador.mascota = id; });
    const elegirSkin = () => simMejor([null, ...skinsDisponibles().map(k => k.id)], id => ponerSkin(id));
    const prueba = (cambiar, deshacer) => { const base = poder(); cambiar(); const g = poder() - base; deshacer(); return g; };
    const cands = [];   // { valor(): poder por oro (0 si no se puede), hacer(): true si compró }
    for (const uid of Object.values(jugador.equipado)) { const o = objeto(uid);
      cands.push({ valor: () => { const c = costeEncantar(o); return o.enc >= encMax(o) || !tieneCoste(c) ? 0 : prueba(() => o.enc++, () => o.enc--) * c.prob / 100 / c.oro; },
                   hacer: () => tieneCoste(costeEncantar(o)) && o.enc < encMax(o) && !!encantar(o) }); }
    if (desbloqueado('mascota')) for (const m of MASCOTAS) cands.push({
      valor: () => { const n = nivelMascota(m), oro = n ? costeMejora(m, n) : m.precio, puesta = jugador.mascota;
        if ((n && n >= MASCOTA_MAX) || jugador.oro < oro) return 0;
        return prueba(() => { jugador.mascotas[m.id] = n + 1; jugador.mascota = m.id; }, () => { if (n) jugador.mascotas[m.id] = n; else delete jugador.mascotas[m.id]; jugador.mascota = puesta; }) / oro; },
      hacer: () => { const ok = nivelMascota(m) ? mejorarMascota(m) : comprarMascota(m); if (ok) ponerMascota(); return ok; } });
    if (desbloqueado('aura')) cands.push({   // el aura: Esencia y oro
      valor: () => { const n = nivelAura(), c = costeAura(n); return n >= AURA_MAX || !tieneCoste(c) ? 0 : prueba(() => { jugador.aura = n + 1; }, () => { jugador.aura = n; }) / c.oro; },
      hacer: () => subirAura() });
    if (desbloqueado('despertar'))   // despertar lo que lleva puesto y ya está al máximo
      for (const [tipo, id] of [...(mascotaActual() ? [['mascota', mascotaActual().id]] : []), ...(skinActual() ? [['skin', skinActual().id]] : []),
                                ...reliquiasActivas().map(r => ['reliquia', r.id])]) cands.push({
        valor: () => { if (!puedeDespertar(tipo, id) || !tieneCoste(costeDespertar(tipo, id))) return 0; const n = nivelDespertar(tipo, id), D = ((jugador.despertar ||= {})[tipo] ||= {});
          return prueba(() => { D[id] = n + 1; }, () => { D[id] = n; }) / costeDespertar(tipo, id).oro; },
        hacer: () => despertar(tipo, id) });
    if (desbloqueado('skins')) for (const k of skinsClase()) cands.push({
      valor: () => { const n = estrellasSkin(k.id), oro = n ? COSTE_ESTRELLA(n) : PRECIO_SKIN, puesta = skinPuesta();
        if (n >= 5 || jugador.oro < oro) return 0;
        return prueba(() => { (jugador.skinsPropias ||= {})[k.id] = n + 1; ponerSkin(k.id); }, () => { if (n) jugador.skinsPropias[k.id] = n; else delete jugador.skinsPropias[k.id]; ponerSkin(puesta); }) / oro; },
      hacer: () => { const ok = estrellasSkin(k.id) ? mejorarSkin(k) : comprarSkin(k); if (ok) elegirSkin(); return ok; } });
    if (desbloqueado('pRunas')) {
      const puestas = (jugador.runasPuestas ||= Array(RANURAS_RUNA).fill(null));
      for (let i = 0; i < RANURAS_RUNA; i++) cands.push({   // la runa de la ranura i: subirla, o crear una si está vacía
        valor: () => { const r = (jugador.runas || []).find(x => x.uid === puestas[i]);
          if (r) { const c = costeMejoraRuna(r.nivel); return r.nivel >= RUNA_MAX || !tieneCoste(c) ? 0 : prueba(() => r.nivel++, () => r.nivel--) / c.oro; }
          if (!tieneCoste(COSTE_RUNA)) return 0;
          const tipos = Object.keys(RUNAS);
          return tipos.reduce((t, tipo) => t + prueba(() => { jugador.runas.push({ uid: -1, tipo, nivel: 1 }); puestas[i] = -1; }, () => { jugador.runas.pop(); puestas[i] = null; }), 0) / tipos.length / COSTE_RUNA.oro; },
        hacer: () => { const r = (jugador.runas || []).find(x => x.uid === puestas[i]);
          if (r) return mejorarRuna(r);
          if (!tieneCoste(COSTE_RUNA)) return false; crearRuna(); simRunas(); return true; } });
    }
    let lista = cands.map(c => ({ c, v: c.valor() })).filter(x => x.v > 0);
    for (let i = 0; i < 400 && lista.length; i++) {
      lista.sort((a, b) => b.v - a.v);
      const x = lista[0]; x.v = x.c.valor();
      if (x.v <= 0) { lista.shift(); continue; }
      if (lista[1] && x.v < lista[1].v) continue;   // ya no es la mejor: vuelve a su sitio con su valor nuevo
      if (!x.c.hacer()) { lista.shift(); continue; }
      x.v = x.c.valor(); if (x.v <= 0) lista.shift();
    }
  }
  // Refinar con el polvo que sobra (deja 20 para las runas): sortea la peor línea (menos de ★4) de cada pieza puesta y se
  // queda con lo que dé más poder.
  function simRefinar() {
    if (!desbloqueado('refinar')) return;
    for (let i = 0; i < 40 && jugador.mat.polvo >= 20 + COSTE_REFINAR.polvo && jugador.oro >= COSTE_REFINAR.oro; i++) {
      const o = Object.values(jugador.equipado).map(objeto).find((x, j) => j >= i % 4 && x.lineas.some(l => l.e < 4)) || Object.values(jugador.equipado).map(objeto).find(x => x.lineas.some(l => l.e < 4));
      if (!o) return;
      const linea = o.lineas.reduce((m, l, j) => l.e < o.lineas[m].e ? j : m, 0), vieja = o.lineas[linea], base = poder();
      const nueva = refinar(o); o.lineas[linea] = nueva;
      if (poder() <= base) o.lineas[linea] = vieja;
    }
  }
  function simRuinas() {   // con oro de sobra (3 veces el coste), el edificio más barato
    if (!desbloqueado('pRuinas')) return;
    for (;;) { const e = EDIFICIOS.filter(x => edificioAbierto(x) && nivelEdificio(x.id) < EDIFICIO_MAX).sort((a, b) => nivelEdificio(a.id) - nivelEdificio(b.id))[0];
      if (!e || jugador.oro < 3 * costeEdificio(nivelEdificio(e.id)).oro || !mejorarEdificio(e.id)) return; }
  }
  // como un jugador: primero los jefes que nunca ha vencido, luego las Pesadillas abiertas y luego el resto
  function opcionJefeSim(pocos = () => true) {
    const prio = ([m, d]) => d === 'normal' && !jefeVencido(m) ? 0 : d === 'pesadilla' ? 1 : 2;
    return Object.keys(MUNDIALES).flatMap(m => ['normal', 'pesadilla'].map(d => [m, d]))
      .filter(([m, d]) => jefeAbierto(m, d) && estadoMundial(m, d).vida > 0 && pocos('jefe' + m + d)).sort((a, b) => prio(a) - prio(b))[0];
  }
  // calabozo: el siguiente sin superar (de la dificultad más baja); si no, el mejor superado · [id, dif] o []
  function opcionCalabozoSim(pocos = () => true) {
    const abiertos = CALABOZOS.filter(x => calabozoAbierto(x.id)).flatMap(x => ORDEN_DIF.filter(df => difAbierta(x.id, df)).map(df => [x.id, df]));
    return [...abiertos].sort((a, b) => ORDEN_DIF.indexOf(a[1]) - ORDEN_DIF.indexOf(b[1])).find(([id, df]) => !jugador.calabozosDif[`${id}:${df}`] && pocos(`cal${id}:${df}`))
      || abiertos.filter(([id, df]) => jugador.calabozosDif[`${id}:${df}`]).at(-1) || [];
  }
  // Torre de reyes: la primera dificultad sin vencer esta semana
  const opcionReyesSim = (pocos = () => true) => Object.keys(DIF_REYES).find(x => !revisarReyes().vencidas[x] && pocos('reyes' + x));
  // Pacto: dona lo que puede, sube la tecnología más baja (reparte), cobra el premio del jefe
  function simPacto() {
    if (!desbloqueado('pPacto')) return;
    while (donarPacto());
    for (;;) { const t = [...TEC_PACTO].sort((a, b) => nivelTec(a.id) - nivelTec(b.id))[0]; if (!mejorarTec(t.id)) break; }
    cobrarPremioPacto();
  }
  function simCobrar() {   // misiones y bonus hechos
    for (const tipo of ['diaria', 'semanal']) { for (const m of misionesVisibles(tipo)) reclamarMision(tipo, m.id); BONUS_MISIONES[tipo].forEach((_, i) => reclamarMision(tipo, 'cofre' + i)); }
    for (const [id, p] of hitosPendientes()) reclamarHito(id, p);   // hitos del Códice
    comprarEvento('titulo');   // el título primero; mientras no lo tenga, ahorra para él (la tienda, solo con lo que sobre)
    const tieneTitulo = () => (jugador.titulos || {})[idTituloTema(temaSemana())], E = revisarEvento();
    for (const it of [...TIENDA_EVENTO].reverse()) while ((tieneTitulo() || E.fichas - it.coste >= PRECIO_TITULO_EVENTO) && comprarEvento(it.id));
  }
  // Tipos de jugador que puede simular simularProgresion (tipo): cuánto se parece a una persona real.
  //   juega: probabilidad de jugar cada día (los días que no juega solo pasa el tiempo) · estaminaExtra: recargas al día
  //   (anuncios, diamantes) · gasto: parte de la estamina del día que gasta (el resto se pierde) · arena: a qué rival ataca (facil, azar o fuerte) · anuncios y cristales:
  //   si el bot de pantalla recarga estamina viendo anuncios o con cristales (el simulador lo resume en estaminaExtra) ·
  //   habilidades: 'auto' (la primera lista, como el autoataque) o 'criterio' (habCriterio: guarda la fuerte para el jefe).
  // Sin tipo, simularProgresion es el bot de siempre (todo cada día, autoataque); 'constante' es eso con habilidades con criterio.
  const TIPOS_JUGADOR = {
    casual:    { nombre: 'Casual',    juega: .7, estaminaExtra: 0,   gasto: .6, arena: 'azar',   anuncios: false, cristales: false, habilidades: 'auto' },
    constante: { nombre: 'Constante', juega: 1,  estaminaExtra: 150, gasto: 1,  arena: 'facil',  anuncios: true,  cristales: false, habilidades: 'criterio' },
    pago:      { nombre: 'De pago',   juega: 1,  estaminaExtra: 300, gasto: 1,  arena: 'fuerte', anuncios: true,  cristales: true,  habilidades: 'criterio' },
  };
  // Tras perder un nivel de campaña (gasta estamina) se hace como un jugador: si perdió por poco (a los enemigos les quedaba
  // menos de DERROTA_AJUSTADA de su vida) lo reintenta hasta REINTENTOS_GRATIS veces; si lo aplastaron, primero mejora
  // (equipo, oro, runas) y solo vuelve con un MEJORA_REINTENTO más de poder que cuando perdió. Lo demás no gasta estamina (Torre, Grieta, Eco)
  // o usa entradas que se pierden al acabar el día (arena, calabozo, reyes): se reintenta hasta REINTENTOS_GRATIS veces al
  // día. Los jefes mundiales, siempre: cada intento les quita vida.
  // fallos: { clave: { poder, cerca, n } } (sigue de un día a otro) · dia: { clave: derrotas hoy }
  const MEJORA_REINTENTO = .05, REINTENTOS_GRATIS = 2, DERROTA_AJUSTADA = .3;
  const esGratis = k => !/^\d+-\d+:/.test(k);   // claves de campaña: 'etapa-nivel:dificultad'
  const puedeReintentar = (fallos, k, dia = {}) => k.startsWith('jefe') ? true : esGratis(k) ? (dia[k] || 0) < REINTENTOS_GRATIS
    : !fallos[k] || poder() >= fallos[k].poder * (1 + MEJORA_REINTENTO) || (fallos[k].cerca && fallos[k].n < REINTENTOS_GRATIS);
  // vida que les queda a los enemigos (0-1) en la batalla que acaba de terminar
  const vidaEnemigos = () => { const E = (batalla.grupo || {}).enemigos || [], m = E.reduce((t, u) => t + u.vidaMax, 0);
    const resto = batalla.grupo && batalla.grupo.duelo ? (batalla.campana.enemigos || []).length - batalla.iEnemigo - 1 : 0;   // 1 contra 1: los que no salieron
    return m ? Math.min(1, (E.reduce((t, u) => t + Math.max(0, u.vida), 0) / m + resto) / (1 + resto)) : 1; };
  const anotarDerrota = (fallos, k, dia) => {
    if (esGratis(k)) { dia[k] = (dia[k] || 0) + 1; return; }
    const p = poder(), f = fallos[k], igual = f && p < f.poder * (1 + MEJORA_REINTENTO);   // sin mejorar desde la anterior
    fallos[k] = { poder: igual ? f.poder : p, cerca: vidaEnemigos() < DERROTA_AJUSTADA, n: igual ? f.n + 1 : 1 };
  };
  const rivalArenaSim = (rivales, modo, r) => modo === 'azar' ? Math.floor(r() * rivales.length)
    : rivales.reduce((m, x, k) => (modo === 'fuerte' ? x.f > rivales[m].f : x.f < rivales[m].f) ? k : m, 0);
  // Un jugador gratuito juega días seguidos sin pantalla, con las decisiones del bot: cada día recoge el login y las
  // expediciones, gasta la estamina, sube la Torre, usa las entradas de arena, jefes, calabozo y Torre de reyes, cobra las
  // misiones, abre cofres, se equipa lo mejor (y desguaza el resto), reparte el árbol, refina y gasta el oro en lo que más
  // poder le da (simMejorar). Las batallas se resuelven con el motor (autoataque). Devuelve el día de cada hito.
  // Corre sobre una copia de la partida (aislado).
  //   perfil: partida de la que parte (por defecto, una nueva) · dias · semilla: azar reproducible · expediciones: de 8 h al
  //   día · grupo: jugadores en calabozo y reyes (los aliados son copias del simulado: gente de su mismo nivel) ·
  //   estaminaExtra: recargas al día además de la gratis (anuncios, diamantes) · alDia(d): aviso al terminar cada día (progreso)
  //   tipo: clave de TIPOS_JUGADOR u objeto con sus campos (su estaminaExtra manda sobre la del parámetro)
  //   Devuelve también la partida simulada (jugador), para poder seguir jugándola.
  function simularProgresion({ dias = 60, perfil = null, semilla = 1, expediciones = 2, grupo = 3, estaminaExtra = 0, alDia = null, clase = 'guerrero', tipo = null } = {}) {
    const T = { juega: 1, gasto: 1, arena: 'facil', estaminaExtra, ...(typeof tipo === 'string' ? TIPOS_JUGADOR[tipo] : tipo) };
    const offset0 = offsetDias, temporizador = window.setTimeout, botsAntes = [...bots()], relojReal = Date.now, ahora0 = Date.now();
    window.setTimeout = () => 0;
    Date.now = () => ahora0;   // reloj quieto: lo que depende de la hora (ruinas) no cambia según lo rápido que simule   // los avisos diferidos (desbloqueos, títulos) no deben salir al terminar
    try {
      return aislado(() => {
        sembrar(semilla);
        // los campos que el juego rellena al cargar o al abrir sus pantallas (una partida recién reiniciada aún no los tiene)
        const campos = { arbol: {}, torre: { mejor: 0 }, calabozos: {}, calabozosDif: {}, mascotas: {}, runas: [], skinsPropias: {}, formacion: { pos: 'frente', aliados: [] } };
        jugador = perfil ? Object.assign(campos, structuredClone(perfil)) : Object.assign(partidaNueva(), { nombre: 'Simulado', clase }, campos);
        if (perfil) sigUid = Math.max(sigUid, perfil.sigUid || 0);   // seguir una partida: sus objetos ya usan esos números
        const nivel0 = jugador.nivel;   // los niveles que ya tenía no son hitos de esta simulación
        const hitos = { nivel: {}, campana: {}, torre: {}, jefes: {}, calabozo: {}, reyes: {}, grieta: {}, ecos: {}, ecosJugados: {} }, dia = [], fuentes = {};
        const xpTotal = () => { let t = jugador.xp; for (let n = 1; n < jugador.nivel; n++) t += xpParaSubir(n); return t; };
        const medir = (fuente, f) => { const x = xpTotal(), o = jugador.oro, es = jugador.mat.esencia || 0, r = f(), F = fuentes[fuente] ||= { xp: 0, oro: 0, esencia: 0, veces: 0 };
          F.xp += xpTotal() - x; F.oro += jugador.oro - o; F.esencia += Math.max(0, (jugador.mat.esencia || 0) - es); F.veces++; return r; };   // XP y oro de cada fuente (el oro gastado en mejoras no cuenta: se mide aparte)
        const aliados = () => {   // copias del simulado como aliados (los bots se buscan por nombre)
          const nombres = Array.from({ length: grupo - 1 }, (_, i) => `Aliado ${i + 1}`);
          cacheBots.splice(botsAntes.length, Infinity, ...nombres.map(nombre => Object.assign(structuredClone(jugador), { nombre })));
          return nombres;
        };
        const jugar = c => {   // como iniciarCampana, sin pantalla: cobra la entrada, pelea y cobra el resultado
          const coste = c.arena || c.mundial || c.torre || c.reyes || c.calabozo || c.grieta || c.pacto ? 0 : (c.coste || ESTAMINA_CAMPANA);
          if (jugador.estamina < coste) return null;
          jugador.estamina -= coste; if (coste) contarMision('estamina', coste);
          if (c.aliados) c.aliados = aliados();
          const { fin } = jugarHastaFin(c, T.habilidades === 'criterio' ? habCriterio : habLista, 400);
          cacheBots.splice(botsAntes.length);
          cobrarResultado(fin === true); return fin === true;
        };
        const fila = (d, batallas) => ({ dia: d, nivel: jugador.nivel, poder: poder(), torre: jugador.torre.mejor, oro: jugador.oro, aura: nivelAura(), batallas,
          despertar: Object.values(jugador.despertar || {}).reduce((s, o) => s + Object.values(o).reduce((a, b) => a + b, 0), 0),
          ruinas: Object.values((jugador.ruinas || {}).niveles || {}).reduce((a, b) => a + b, 0), codice: Object.keys((jugador.codice || {}).hitos || {}).length });
        const azarArena = azarSemilla('arena ' + semilla);
        const fallos = jugador.simFallos ||= {};   // derrotas (clave → poder al perder): siguen en la partida de un día (y una llamada) a otro
        for (let d = 1; d <= dias; d++) {
          offsetDias = offset0 + d - 1;
          if (T.juega < 1 && azarSemilla(`juega ${semilla} ${d}`)() >= T.juega) {   // hoy no juega: solo pasa el tiempo
            if (alDia) alDia(d); dia.push(fila(d, 0)); continue;
          }
          revisarEstamina(); jugador.estamina += T.estaminaExtra;   // recargas extra del día (anuncios, diamantes)
          const reserva = Math.floor(jugador.estamina * (1 - T.gasto));   // lo que no llega a gastar hoy
          const hayEstamina = () => jugador.estamina - reserva >= ESTAMINA_CAMPANA;
          revisarArena(); revisarReyes(); revisarCalabozo(); revisarMisiones(); entradasJefe();   // lo que se renueva cada día, como al abrir el juego (el Campamento lo revisa al pintarse)
          if (loginDisponible()) medir('login', reclamarLogin);
          if (desbloqueado('pRuinas')) medir('ruinas', recogerRuinas);   // una vez al día (lo que quepa en el almacén)
          if (desbloqueado('expedicion')) {   // expediciones de 8 h al día (las que da tiempo a mandar y recoger)
            const m = MASCOTAS.filter(x => nivelMascota(x) > 0 && x.id !== jugador.mascota).sort((a, b) => Object.keys(CAT_MASCOTA).indexOf(b.cat) - Object.keys(CAT_MASCOTA).indexOf(a.cat))[0];
            if (m) for (let i = 0; i < expediciones; i++) medir('expedición', () => darPremio(premioExpedicion(m, 8)));
          }
          const hoyF = {}, pocos = k => puedeReintentar(fallos, k, hoyF);
          let batallas = 0, mejorar = false;
          while (batallas < 200) {
            medir('misiones', simCobrar);
            if (batallas % 5 === 0 || mejorar) {   // cada 5 batallas, al empezar el día y tras perder: organiza el equipo y gasta
              mejorar = false;
              botCofres(); botEquipar(); botArbol();
              desguazar(jugador.objetos.filter(o => !Object.values(jugador.equipado).includes(o.uid)));   // lo que no lleva puesto, a almas
              simMejorar(); simRunas(); simRefinar(); simRuinas(); simPacto();
            }
            let k = null, c = null;
            if (hayEstamina())
              for (const x of CAMPANAS) { for (const df of ORDEN_DIF) if (desbloqueada(x, df) && !superada(x.id, df) && pocos(`${x.id}:${df}`)) { k = `${x.id}:${df}`; c = batallaCampana(x, df); break; } if (c) break; }
            if (!c && desbloqueado('pTorre') && pocos('torre')) { k = 'torre'; c = batallaTorre(); }
            if (!c && desbloqueado('pArena') && revisarArena().entradas > 0) {
              const a = revisarArena(), i = rivalArenaSim(a.rivales, T.arena, azarArena);
              a.entradas--; a.rivalActual = i; k = 'arena'; c = batallaArena(i);
            }
            if (!c && desbloqueado('pEvento') && entradasJefe() > 0) {
              const op = opcionJefeSim(pocos);
              if (op) { jugador.entradasJefe--; k = 'jefe' + op[0] + op[1]; c = batallaMundial(op[0], op[1]); }
            }
            if (!c && desbloqueado('pCalabozo') && revisarCalabozo().entradas > 0) {   // el siguiente sin superar; si no, el mejor superado
              const [id, df] = opcionCalabozoSim(pocos);
              if (id) { revisarCalabozo().entradas--; k = `cal${id}:${df}`; c = batallaCalabozo(df, ['x'], null, id); }
            }
            if (!c && desbloqueado('pReyes') && revisarReyes().entradas > 0) {
              const df = opcionReyesSim(pocos);
              if (df) { revisarReyes().entradas--; k = 'reyes' + df; c = batallaReyes(df, ['x'], null); }
            }
            if (!c && desbloqueado('pPacto')) { c = batallaPacto(); if (c) k = 'pacto'; }   // el jefe del Pacto (sus intentos del día)
            if (!c && retoPendiente()) { k = 'eco'; c = batallaEco(); }   // el reto del Eco, siempre
            if (!c && desbloqueado('pGrieta')) {   // Grieta: bendición y el siguiente piso
              elegirBendicion(bendicionSugerida());
              c = batallaGrieta(); if (c) k = 'grieta';
            }
            if (!c) {   // farmeo: el barrido que más rinde (XP, oro y Esencia) entre los niveles ya superados
              const rinde = ([y, df]) => { const D = y.dificultades[df], s = k => (D.premio[k] || 0) + D.enemigos.reduce((t, e) => t + (e[k] || 0), 0);
                return s('xp') * XP_BARRIDO + s('oro') + (D.premio.esencia || 0) * ESENCIA_BARRIDO * 300; };
              const x = hayEstamina() && CAMPANAS.flatMap(y => ORDEN_DIF.map(df => [y, df])).filter(([y, df]) => superada(y.id, df)).sort((a, b) => rinde(b) - rinde(a))[0];
              if (!x) break;
              medir('barrido', () => barrido(...x)); batallas++; continue;
            }
            const fuente = c.idCampana ? 'campaña' : c.pacto ? 'pacto' : c.eco ? 'eco' : c.grieta ? 'grieta' : c.torre ? 'torre' : c.arena ? 'arena' : c.mundial ? 'jefes' : c.calabozo ? 'calabozo' : 'reyes';
            const gano = medir(fuente, () => jugar(c)); batallas++;
            if (c.eco) hitos.ecosJugados[c.eco] = (hitos.ecosJugados[c.eco] || 0) + 1;
            if (gano === null) break;
            if (!gano) { anotarDerrota(fallos, k, hoyF); mejorar = true; }
            else {
              if (c.idCampana) hitos.campana[`${c.idCampana} ${c.dif}`] ||= d;
              if (c.torre && c.torre % 10 === 0) hitos.torre[c.torre] ||= d;
              if (c.mundial) hitos.jefes[c.mundial + (c.difJefe === 'pesadilla' ? ' pesadilla' : '')] ||= d;
              if (c.calabozo) hitos.calabozo[`${c.cal} ${c.calabozo}`] ||= d;
              if (c.reyes) hitos.reyes[c.reyes] ||= d;
              if (c.eco) hitos.ecos[c.eco] = (hitos.ecos[c.eco] || 0) + 1;
              if (c.grieta) { const s = Math.ceil(d / 7); hitos.grieta[s] = Math.max(hitos.grieta[s] || 0, c.grieta); }   // mejor piso de cada semana
            }
          }
          for (let n = nivel0 + 1; n <= jugador.nivel; n++) hitos.nivel[n] ||= d;
          revisarTitulos();   // igual con pantalla y sin ella (la pantalla guarda más a menudo, y guardar revisa los títulos)
          if (alDia) alDia(d);
          dia.push(fila(d, batallas));
        }
        jugador.sigUid = sigUid;   // la partida simulada, lista para guardarse como la tuya
        return { hitos, dia, fuentes, final: dia.at(-1), jugador: structuredClone(jugador) };
      });
    } finally { window.setTimeout = temporizador; Date.now = relojReal; offsetDias = offset0; cacheBots.splice(botsAntes.length); }
  }
  function opcionesSimulacion() {   // batallas que se pueden simular desde el menú de pruebas
    const sig = CAMPANAS.find(c => !superada(c.id, 'normal')) || CAMPANAS.at(-1);
    return [
      [`Campaña ${sig.id}`, () => batallaCampana(sig, 'normal')],
      [`Torre · piso ${jugador.torre.mejor + 1}`, () => batallaTorre()],
      ...revisarArena().rivales.map((r, i) => [`Arena: ${r.nombre}`, () => batallaArena(i)]),
      ...Object.keys(MUNDIALES).map(id => [`Jefe: ${MUNDIALES[id].enemigo.nombre}`, () => batallaMundial(id)]),
    ];
  }
