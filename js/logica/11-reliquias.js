  // ---------------- Reliquias ----------------
  // Botín de los jefes mundiales. Todas las que tienes están activas; repetirla sube su nivel (máx. 5).
  //   ef: % a un efecto por nivel · golpe: prob. (% por nivel) de aplicar un estado al golpear
  const RELIQUIAS = [
    { id: 'colmillo', jefe: 'cerbero',   nombre: 'Colmillo de Cerbero',  icono: '🦷', golpe: { estado: 'quemadura', prob: 4, turnos: 2, pct: .3 } },
    { id: 'collar',   jefe: 'cerbero',   nombre: 'Collar infernal',      icono: '📿', ef: { resistencia: 4 } },
    { id: 'ceniza',   jefe: 'cerbero',   nombre: 'Ceniza del Hades',     icono: '⚱️', ef: { jefes: 5 } },
    { id: 'ala',      jefe: 'asmodeo',   nombre: 'Ala de Asmodeo',       icono: '🪶', ef: { esquiva: 3 } },
    { id: 'corona',   jefe: 'asmodeo',   nombre: 'Corona demoníaca',     icono: '👑', ef: { habilidad: 5 } },
    { id: 'sello',    jefe: 'asmodeo',   nombre: 'Sello del pacto',      icono: '🔯', golpe: { estado: 'veneno', prob: 5, turnos: 3, pct: .15 } },
    { id: 'cuerno',   jefe: 'minotauro', nombre: 'Cuerno del Minotauro', icono: '🐂', ef: { penetracion: 4 } },
    { id: 'hacha',    jefe: 'minotauro', nombre: 'Hacha rota',           icono: '🪓', golpe: { estado: 'sangrado', prob: 5, turnos: 3, pct: .25 } },
    { id: 'pezuna',   jefe: 'minotauro', nombre: 'Pezuña de bronce',     icono: '🔔', ef: { danoCritico: 8 } },
  ];
  // Solo 3 reliquias activas a la vez (elegidas por el jugador): son una decisión de build, no una suma de todo.
  // Por eso cada una vale más por nivel que cuando estaban todas activas. Sin elección guardada, se usan las 3 de más nivel.
  const RANURAS_RELIQUIA = 3;
  function reliquiasActivas() {
    const tiene = RELIQUIAS.filter(r => (jugador.reliquias || {})[r.id]);
    if (jugador.reliquiasPuestas) return tiene.filter(r => jugador.reliquiasPuestas.includes(r.id)).slice(0, RANURAS_RELIQUIA);
    return tiene.sort((a, b) => jugador.reliquias[b.id] - jugador.reliquias[a.id]).slice(0, RANURAS_RELIQUIA);
  }
  const RELIQUIA_MAX = 5, NOMBRE_JEFE = { cerbero: 'Cerbero', asmodeo: 'Asmodeo', minotauro: 'Gran Minotauro' };
  const nivelReliquia = id => (jugador.reliquias || {})[id] || 0;
  function efectoReliquias(esp) { return reliquiasActivas().reduce((s, r) => s + (r.ef && r.ef[esp] ? r.ef[esp] * nivelReliquia(r.id) * multDespertar('reliquia', r.id) / 100 : 0), 0); }
  // pasiva del despertar: lo que tus reliquias despertadas dan a tus aliados (se calcula con tu partida, no la suya)
  function efectoReliquiasAliados(esp) { return reliquiasActivas().reduce((s, r) => s + (r.ef && r.ef[esp] && pasivaDespertar('reliquia', r.id) ? r.ef[esp] * nivelReliquia(r.id) * multDespertar('reliquia', r.id) / 100 * PASIVA_RELIQUIA : 0), 0); }
  function golpesEstado() {   // reliquias + nodos del árbol de la clase actual
    return [...reliquiasActivas().filter(r => r.golpe).map(r => ({ ...r.golpe, prob: r.golpe.prob * nivelReliquia(r.id) * multDespertar('reliquia', r.id) / 100 })),
            ...nodosClase().filter(n => n.golpe && rango(n.id)).map(n => ({ ...n.golpe, prob: n.golpe.prob * rango(n.id) / 100 }))];
  }
  function textoReliquia(r, n = Math.max(1, nivelReliquia(r.id))) {
    const k = multDespertar('reliquia', r.id);
    if (r.ef) return textoBonos({}, Object.fromEntries(Object.entries(r.ef).map(([a, v]) => [a, v * n * k])));
    const g = r.golpe, e = ESTADOS[g.estado];
    return `${Math.round(g.prob * n * k * 10) / 10} % de ${e.nombre.toLowerCase()} ${e.icono} al golpear (${g.turnos} turnos, ${g.pct * 100} % de tu ataque por turno)`;
  }
  // Al terminar un intento contra un jefe mundial: reliquia segura si lo derrotas; si no, probabilidad según el daño
  function botinReliquia(jefe, gano) {
    const prob = gano ? 1 : Math.min(.6, .15 + batalla.danoHecho / MUNDIALES[jefe].enemigo.vida * 3);
    if (rnd() >= prob) return '';
    const r = elegir(RELIQUIAS.filter(x => x.jefe === jefe)); jugador.reliquias ||= {};
    if (nivelReliquia(r.id) >= RELIQUIA_MAX) { jugador.mat.polvo += 30; return `<br>${r.icono} ${r.nombre} (ya al máximo): ✨ +30 polvo`; }
    jugador.reliquias[r.id] = nivelReliquia(r.id) + 1;
    return `<br><b>${r.icono} Reliquia: ${r.nombre} ${nivelReliquia(r.id) > 1 ? 'Nv ' + nivelReliquia(r.id) : '¡nueva!'}</b>`;
  }

  // Equipo exclusivo del jefe: 35 % si lo derrotas; si no, hasta un 10 % según el daño causado
  // Equipo de jefe (piezas de su set). Garantía: 8 intentos seguidos sin pieza de ese jefe dan una segura, y la garantía
  // prefiere una pieza que aún no tengas (para que completar el set de 4 no dependa solo de la suerte).
  const GARANTIA_JEFE = 8;
  function botinEquipoJefe(jefe, gano) {
    const P = jugador.pityJefe ||= {}; P[jefe] = (P[jefe] || 0) + 1;
    const prob = (gano ? .35 : Math.min(.1, batalla.danoHecho / MUNDIALES[jefe].enemigo.vida * .5)) * ((eventoHoy() || {}).jefes || 1);
    if (rnd() >= prob && P[jefe] < GARANTIA_JEFE) return `<br><small class="proteccion">🍀 Pieza de set garantizada en ${GARANTIA_JEFE - P[jefe]} intento${GARANTIA_JEFE - P[jefe] > 1 ? 's' : ''}</small>`;
    const garantia = P[jefe] >= GARANTIA_JEFE; P[jefe] = 0;
    const todas = MODELOS.filter(m => m.jefe === jefe), faltan = todas.filter(m => !jugador.objetos.some(o => o.modelo === m.id));
    const o = crearObjeto(elegir(garantia && faltan.length ? faltan : todas).id); jugador.objetos.push(o);
    obtenidos.push(o); return '';
  }
