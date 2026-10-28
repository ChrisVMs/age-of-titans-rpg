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
  ];
  // todos los enemigos distintos de las campañas + los jefes mundiales (se definen más abajo: solo cuando el juego ya cargó)
  function enemigosColeccion() {
    if (!campListo) return Object.keys(jugador.bestiario || {});
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
    if (!campListo) return 0;
    const prog = memoizar('colecciones', () => COLECCIONES.map(progresoColeccion));
    return COLECCIONES.reduce((s, c, i) => { const [ok, tot] = prog[i]; return s + (ok >= tot && c.completa[esp] ? c.completa[esp] / 100 : 0); }, 0);
  }
