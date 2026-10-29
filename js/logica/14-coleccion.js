  // ---------------- Colección ----------------
  // Cada entrada conseguida da un pequeño % a un atributo base; completar la colección da un efecto extra.
  const COLECCIONES = [
    { id: 'bestiario', nombre: 'Bestiario', desc: 'Enemigos derrotados', porEntrada: { ataque: .3 }, completa: { jefes: 3 },
      entradas: () => enemigosColeccion().map(n => ({ nombre: n, icono: '💀', ok: !!(jugador.bestiario || {})[n], extra: (jugador.bestiario || {})[n] ? `×${jugador.bestiario[n]}` : '' })) },
    { id: 'mascotas', nombre: 'Mascotas', desc: 'Mascotas compradas', porEntrada: { vida: 1 }, completa: { resistencia: 3 },
      entradas: () => MASCOTAS.map(m => ({ nombre: m.nombre, icono: m.cara, ok: nivelMascota(m) > 0 })) },
    { id: 'skins', nombre: 'Skins', desc: 'Skins compradas', porEntrada: { defensa: .5 }, completa: { critico: 2 },
      entradas: () => SKINS.map(k => ({ nombre: k.nombre, icono: k.icono, ok: estrellasSkin(k.id) > 0 })) },
    { id: 'reliquias', nombre: 'Reliquias', desc: 'Reliquias de jefes mundiales', porEntrada: { armadura: .5 }, completa: { penetracion: 5 },
      entradas: () => RELIQUIAS.map(r => ({ nombre: r.nombre, icono: r.icono, ok: nivelReliquia(r.id) > 0 })) },
    // Códice (2026-10-29): colecciones largas que hacen volver a contenido viejo
    { id: 'titulos', nombre: 'Títulos', desc: 'Títulos conseguidos (logros, evento semanal y Ecos)', porEntrada: { vida: .3 }, completa: { resistencia: 2 },
      entradas: () => TITULOS.map(t => ({ nombre: t.nombre, icono: '🏷️', ok: !!(jugador.titulos || {})[t.id] })) },
    { id: 'sets', nombre: 'Piezas de set', desc: 'Equipo de los jefes mundiales', porEntrada: { ataque: .4 }, completa: { jefes: 3 },
      entradas: () => MODELOS.filter(m => m.jefe).map(m => ({ nombre: m.nombre, icono: '⚔️', ok: (jugador.objetos || []).some(o => o.modelo === m.id) || !!(jugador.codice || {}).piezas?.[m.id] })) },
    { id: 'etapa2', nombre: 'Bestiario: Etapa 2', desc: 'Enemigos de las ruinas del reino caído', porEntrada: { defensa: .3 }, completa: { critico: 2 },
      entradas: () => enemigosEtapa(2).map(n => ({ nombre: n, icono: '💀', ok: !!(jugador.bestiario || {})[n] })) },
    { id: 'etapa3', nombre: 'Bestiario: Etapa 3', desc: 'Enemigos del Abismo', porEntrada: { defensa: .3 }, completa: { critico: 2 },
      entradas: () => enemigosEtapa(3).map(n => ({ nombre: n, icono: '💀', ok: !!(jugador.bestiario || {})[n] })) },
    { id: 'veterano', nombre: 'Cazador veterano', desc: `Cada enemigo derrotado ${100} veces`, porEntrada: { ataque: .2 }, completa: {},
      entradas: () => enemigosColeccion().map(n => ({ nombre: n, icono: '🎯', ok: ((jugador.bestiario || {})[n] || 0) >= 100, extra: `${Math.min(100, (jugador.bestiario || {})[n] || 0)}/100` })) },
  ];
  const enemigosEtapa = e => !logicaLista ? [] : cacheEnemigos['etapa' + e] ||= [...new Set(CAMPANAS.filter(c => c.etapa === e).flatMap(c => Object.values(c.dificultades).flatMap(d => d.enemigos.map(x => x.nombre))))];
  // Hitos: al 25/50/75/100 % de cada colección, un premio (una vez). El 100 % da además el marco de esa colección.
  const HITOS_COLECCION = [{ pct: 25, premio: { cristales: 3 } }, { pct: 50, premio: { cristales: 5, fichas: 20 } }, { pct: 75, premio: { cristales: 8, fichas: 40 } }, { pct: 100, premio: { cristales: 10 } }];
  // Marcos de perfil (CSS .marco-<id>): uno por colección completa
  const MARCOS = { bestiario: 'Hueso', mascotas: 'Zarpa', skins: 'Prisma', reliquias: 'Infernal', titulos: 'Dorado', sets: 'Forja', etapa2: 'Ruinas', etapa3: 'Abismo', veterano: 'Exterminador' };
  const colVisible = c => c.entradas().length > 0;   // las etapas sin publicar no cuentan
  const pctColeccion = c => { const [ok, tot] = progresoColeccion(c); return tot ? ok / tot * 100 : 0; };
  const hitoCobrado = (id, pct) => !!((jugador.codice || {}).hitos || {})[`${id}:${pct}`];
  const hitosPendientes = () => COLECCIONES.filter(colVisible).flatMap(c => HITOS_COLECCION.filter(h => pctColeccion(c) >= h.pct && !hitoCobrado(c.id, h.pct)).map(h => [c.id, h.pct]));
  function reclamarHito(id, pct) {
    const c = COLECCIONES.find(x => x.id === id), h = HITOS_COLECCION.find(x => x.pct === pct);
    if (!c || !h || !colVisible(c) || pctColeccion(c) < pct || hitoCobrado(id, pct)) return null;
    ((jugador.codice ||= {}).hitos ||= {})[`${id}:${pct}`] = true;
    const { fichas, ...resto } = h.premio; darPremio(resto); if (fichas) revisarEvento().fichas += fichas;
    return h.premio;
  }
  const marcosDisponibles = () => Object.keys(MARCOS).filter(id => hitoCobrado(id, 100));
  const marcoActual = () => marcosDisponibles().includes(jugador.marco) ? jugador.marco : null;
  function ponerMarco(id) { if (id && !marcosDisponibles().includes(id)) return false; jugador.marco = id || null; return true; }
  TITULOS.push(T('exterminador', 'Exterminador', 'legendario', 'Completa la colección Cazador veterano',
    () => progresoColeccion(COLECCIONES.find(c => c.id === 'veterano')), { ataque: 4, vida: 4 }));
  // las piezas de set cuentan aunque luego las desguaces
  function anotarPiezas() { for (const o of jugador.objetos || []) if (modelo[o.modelo]?.jefe) ((jugador.codice ||= {}).piezas ||= {})[o.modelo] = true; }
  // todos los enemigos distintos de las campañas + los jefes mundiales (se definen en archivos posteriores: solo con la lógica cargada)
  // Las listas de enemigos solo cambian al rehacer la campaña (armarCampanas las borra): se calculan una vez. Sin esto, cada
  // cálculo de poder recorría todos los niveles y dificultades (más de la mitad del tiempo del simulador).
  let cacheEnemigos = {};
  function enemigosColeccion() {
    if (!logicaLista) return Object.keys(jugador.bestiario || {});
    return cacheEnemigos.todos ||= enemigosColeccionSinCache();
  }
  function enemigosColeccionSinCache() {
    const n = new Set();
    for (const c of CAMPANAS) for (const d of Object.values(c.dificultades || {})) for (const e of d.enemigos || []) n.add(e.nombre);
    for (const m of Object.values(MUNDIALES)) n.add(m.enemigo.nombre);
    return [...n];
  }
  const progresoColeccion = c => { const e = c.entradas(); return [e.filter(x => x.ok).length, e.length]; };
  function statsColeccion() {
    const t = {};
    for (const c of COLECCIONES) { const [ok] = progresoColeccion(c);
      for (const [a, v] of Object.entries(c.porEntrada)) t[a] = (t[a] || 0) + v * ok; }
    return t;
  }
  function efectoColeccion(esp) {
    if (!logicaLista) return 0;
    const prog = memoizar('colecciones', () => COLECCIONES.map(progresoColeccion));
    return COLECCIONES.reduce((s, c, i) => { const [ok, tot] = prog[i]; return s + (tot && ok >= tot && c.completa[esp] ? c.completa[esp] / 100 : 0); }, 0);
  }
