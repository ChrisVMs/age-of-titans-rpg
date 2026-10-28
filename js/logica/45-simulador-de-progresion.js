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
    const ponerMascota = () => simMejor(MASCOTAS.filter(m => nivelMascota(m) > 0).map(m => m.id), id => { jugador.mascota = id; });
    const ponerSkin = () => simMejor([null, ...SKINS.filter(k => estrellasSkin(k.id) > 0).map(k => k.id)], id => { jugador.skin = id; });
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
    if (desbloqueado('skins')) for (const k of SKINS) cands.push({
      valor: () => { const n = estrellasSkin(k.id), oro = n ? COSTE_ESTRELLA(n) : PRECIO_SKIN, puesta = jugador.skin;
        if (n >= 5 || jugador.oro < oro) return 0;
        return prueba(() => { (jugador.skinsPropias ||= {})[k.id] = n + 1; jugador.skin = k.id; }, () => { if (n) jugador.skinsPropias[k.id] = n; else delete jugador.skinsPropias[k.id]; jugador.skin = puesta; }) / oro; },
      hacer: () => { const ok = estrellasSkin(k.id) ? mejorarSkin(k) : comprarSkin(k); if (ok) ponerSkin(); return ok; } });
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
  function simCobrar() {   // misiones y bonus hechos
    for (const tipo of ['diaria', 'semanal']) { for (const m of misionesVisibles(tipo)) reclamarMision(tipo, m.id); reclamarMision(tipo, 'bonus'); }
  }
  // Un jugador gratuito juega días seguidos sin pantalla, con las decisiones del bot: cada día recoge el login y las
  // expediciones, gasta la estamina, sube la Torre, usa las entradas de arena, jefes, calabozo y Torre de reyes, cobra las
  // misiones, abre cofres, se equipa lo mejor (y desguaza el resto), reparte el árbol, refina y gasta el oro en lo que más
  // poder le da (simMejorar). Las batallas se resuelven con el motor (autoataque). Devuelve el día de cada hito.
  // Corre sobre una copia de la partida (aislado).
  //   perfil: partida de la que parte (por defecto, una nueva) · dias · semilla: azar reproducible · expediciones: de 8 h al
  //   día · grupo: jugadores en calabozo y reyes (los aliados son copias del simulado: gente de su mismo nivel) ·
  //   estaminaExtra: recargas al día además de la gratis (anuncios, diamantes)
  function simularProgresion({ dias = 60, perfil = null, semilla = 1, expediciones = 2, grupo = 3, estaminaExtra = 0 } = {}) {
    const offset0 = offsetDias, temporizador = window.setTimeout, botsAntes = [...bots()];
    window.setTimeout = () => 0;   // los avisos diferidos (desbloqueos, títulos) no deben salir al terminar
    try {
      return aislado(() => {
        sembrar(semilla);
        jugador = perfil ? structuredClone(perfil) : Object.assign(partidaNueva(), { nombre: 'Simulado', clase: 'guerrero', arbol: {}, torre: { mejor: 0 },
          calabozos: {}, calabozosDif: {}, mascotas: {}, runas: [], skinsPropias: {}, formacion: { pos: 'frente', aliados: [] } });   // los campos que el juego rellena al cargar
        const hitos = { nivel: {}, campana: {}, torre: {}, jefes: {}, calabozo: {}, reyes: {} }, dia = [], fuentes = {};
        const xpTotal = () => { let t = jugador.xp; for (let n = 1; n < jugador.nivel; n++) t += xpParaSubir(n); return t; };
        const medir = (fuente, f) => { const x = xpTotal(), o = jugador.oro, r = f(), F = fuentes[fuente] ||= { xp: 0, oro: 0, veces: 0 };
          F.xp += xpTotal() - x; F.oro += jugador.oro - o; F.veces++; return r; };   // XP y oro de cada fuente (el oro gastado en mejoras no cuenta: se mide aparte)
        const aliados = () => {   // copias del simulado como aliados (los bots se buscan por nombre)
          const nombres = Array.from({ length: grupo - 1 }, (_, i) => `Aliado ${i + 1}`);
          cacheBots.splice(botsAntes.length, Infinity, ...nombres.map(nombre => Object.assign(structuredClone(jugador), { nombre })));
          return nombres;
        };
        const jugar = c => {   // como iniciarCampana, sin pantalla: cobra la entrada, pelea y cobra el resultado
          const coste = c.arena || c.mundial || c.torre || c.reyes || c.calabozo ? 0 : (c.coste || ESTAMINA_CAMPANA);
          if (jugador.estamina < coste) return null;
          jugador.estamina -= coste; if (coste) contarMision('estamina', coste);
          if (c.aliados) c.aliados = aliados();
          const { fin } = jugarHastaFin(c, habLista, 400);
          cacheBots.splice(botsAntes.length);
          cobrarResultado(fin === true); return fin === true;
        };
        for (let d = 1; d <= dias; d++) {
          offsetDias = offset0 + d - 1; revisarEstamina(); jugador.estamina += estaminaExtra;   // recargas extra del día (anuncios, diamantes)
          revisarArena(); revisarReyes(); revisarCalabozo(); revisarMisiones(); entradasJefe();   // lo que se renueva cada día, como al abrir el juego (el Campamento lo revisa al pintarse)
          if (loginDisponible()) medir('login', reclamarLogin);
          if (desbloqueado('expedicion')) {   // expediciones de 8 h al día (las que da tiempo a mandar y recoger)
            const m = MASCOTAS.filter(x => nivelMascota(x) > 0 && x.id !== jugador.mascota).sort((a, b) => Object.keys(CAT_MASCOTA).indexOf(b.cat) - Object.keys(CAT_MASCOTA).indexOf(a.cat))[0];
            if (m) for (let i = 0; i < expediciones; i++) medir('expedición', () => darPremio(premioExpedicion(m, 8)));
          }
          const fallos = {}, pocos = k => (fallos[k] || 0) < 2;   // como el bot: tras 2 derrotas, eso se deja para otro día
          let batallas = 0;
          while (batallas < 200) {
            medir('misiones', simCobrar);
            if (batallas % 5 === 0) {   // cada 5 batallas (y al empezar el día) organiza el equipo y gasta
              botCofres(); botEquipar(); botArbol();
              desguazar(jugador.objetos.filter(o => !Object.values(jugador.equipado).includes(o.uid)));   // lo que no lleva puesto, a almas
              simMejorar(); simRunas(); simRefinar();
            }
            let k = null, c = null;
            if (jugador.estamina >= ESTAMINA_CAMPANA)
              for (const x of CAMPANAS) { for (const df of ORDEN_DIF) if (desbloqueada(x, df) && !superada(x.id, df) && pocos(`${x.id}:${df}`)) { k = `${x.id}:${df}`; c = batallaCampana(x, df); break; } if (c) break; }
            if (!c && desbloqueado('pTorre') && pocos('torre')) { k = 'torre'; c = batallaTorre(); }
            if (!c && desbloqueado('pArena') && revisarArena().entradas > 0) {
              const a = revisarArena(), i = a.rivales.reduce((m, r, j) => r.f < a.rivales[m].f ? j : m, 0);
              a.entradas--; a.rivalActual = i; k = 'arena'; c = batallaArena(i);
            }
            if (!c && desbloqueado('pEvento') && entradasJefe() > 0) {
              const id = Object.keys(MUNDIALES).find(m => estadoMundial(m).vida > 0 && pocos('jefe' + m));
              if (id) { jugador.entradasJefe--; k = 'jefe' + id; c = batallaMundial(id); }
            }
            if (!c && desbloqueado('pCalabozo') && revisarCalabozo().entradas > 0) {   // el siguiente sin superar; si no, el mejor superado
              const abiertos = CALABOZOS.filter(x => calabozoAbierto(x.id)).flatMap(x => ORDEN_DIF.filter(df => difAbierta(x.id, df)).map(df => [x.id, df]));
              const [id, df] = abiertos.find(([id, df]) => !jugador.calabozosDif[`${id}:${df}`] && pocos(`cal${id}:${df}`)) || abiertos.filter(([id, df]) => jugador.calabozosDif[`${id}:${df}`]).at(-1) || [];
              if (id) { revisarCalabozo().entradas--; k = `cal${id}:${df}`; c = batallaCalabozo(df, ['x'], null, id); }
            }
            if (!c && desbloqueado('pReyes') && revisarReyes().entradas > 0) {
              const df = Object.keys(DIF_REYES).find(x => !revisarReyes().vencidas[x] && pocos('reyes' + x));
              if (df) { revisarReyes().entradas--; k = 'reyes' + df; c = batallaReyes(df, ['x'], null); }
            }
            if (!c) {   // farmeo: barrido del nivel más alto ya superado
              const x = jugador.estamina >= ESTAMINA_CAMPANA && [...CAMPANAS].reverse().flatMap(y => [...ORDEN_DIF].reverse().map(df => [y, df])).find(([y, df]) => superada(y.id, df));
              if (!x) break;
              medir('barrido', () => barrido(...x)); batallas++; continue;
            }
            const fuente = c.idCampana ? 'campaña' : c.torre ? 'torre' : c.arena ? 'arena' : c.mundial ? 'jefes' : c.calabozo ? 'calabozo' : 'reyes';
            const gano = medir(fuente, () => jugar(c)); batallas++;
            if (gano === null) break;
            if (!gano) fallos[k] = (fallos[k] || 0) + 1;
            else {
              if (c.idCampana) hitos.campana[`${c.idCampana} ${c.dif}`] ||= d;
              if (c.torre && c.torre % 10 === 0) hitos.torre[c.torre] ||= d;
              if (c.mundial) hitos.jefes[c.mundial] ||= d;
              if (c.calabozo) hitos.calabozo[`${c.cal} ${c.calabozo}`] ||= d;
              if (c.reyes) hitos.reyes[c.reyes] ||= d;
            }
          }
          for (let n = 2; n <= jugador.nivel; n++) hitos.nivel[n] ||= d;
          dia.push({ dia: d, nivel: jugador.nivel, poder: poder(), torre: jugador.torre.mejor, oro: jugador.oro, batallas });
        }
        return { hitos, dia, fuentes, final: dia.at(-1) };
      });
    } finally { window.setTimeout = temporizador; offsetDias = offset0; cacheBots.splice(botsAntes.length); }
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
