  // ---------------- Misiones diarias, semanales y login ----------------
  const MISIONES = {
    diaria: [
      { id: 'd_enem',  txt: 'Derrota 30 enemigos',          ev: 'enemigos',  meta: 30,  premio: { oro: 1500 } },
      { id: 'd_vict',  txt: 'Gana 5 batallas de campaña',   ev: 'victoria',  meta: 5,   premio: { piedra: 15 } },
      { id: 'd_est',   txt: 'Gasta 100 de estamina',        ev: 'estamina',  meta: 100, premio: { polvo: 4 } },
      { id: 'd_jefe',  txt: 'Usa 2 entradas de jefe',       ev: 'jefe',      meta: 2,   premio: { almas: 3 } },
      { id: 'd_arena', txt: 'Lucha 3 veces en la Arena',    ev: 'arena',     meta: 3,   premio: { oro: 1000 } },
      { id: 'd_torre', txt: 'Supera 2 pisos de la Torre',   ev: 'torre',     meta: 2,   premio: { almas: 2 } },
      { id: 'd_enc',   txt: 'Encanta 3 veces',              ev: 'encantar',  meta: 3,   premio: { piedra: 10 } },
    ],
    semanal: [
      { id: 's_enem',  txt: 'Derrota 300 enemigos',         ev: 'enemigos',  meta: 300, premio: { almas: 15 } },
      { id: 's_vict',  txt: 'Gana 30 batallas de campaña',  ev: 'victoria',  meta: 30,  premio: { oro: 10000 } },
      { id: 's_jefe',  txt: 'Usa 12 entradas de jefe',      ev: 'jefe',      meta: 12,  premio: { almas: 20 } },
      { id: 's_torre', txt: 'Supera 10 pisos de la Torre',  ev: 'torre',     meta: 10,  premio: { polvo: 20 } },
      { id: 's_arena', txt: 'Gana 10 combates de Arena',    ev: 'arenaVict', meta: 10,  premio: { oro: 8000 } },
      { id: 's_cofre', txt: 'Abre 20 cofres',               ev: 'cofres',    meta: 20,  premio: { piedra: 60 } },
    ],
  };
  const BONUS_MISIONES = { diaria: { meta: 5, premio: { almas: 5, estamina: 30 } }, semanal: { meta: 5, premio: { almas: 30, oro: 15000 } } };
  // login: ciclo de 7 días; cada semana completa sube las recompensas un 25 % (hasta ×3)
  const LOGIN = [{ oro: 1000 }, { piedra: 20 }, { polvo: 5 }, { estamina: 50 }, { almas: 5 }, { oro: 3000, piedra: 20 }, { almas: 10, polvo: 10 }];
  function revisarMisiones() {
    const M = jugador.misiones ||= {};
    if (M.dia !== hoy()) { M.dia = hoy(); M.diaria = {}; M.rdiaria = {}; }
    if (M.semana !== semana()) { M.semana = semana(); M.semanal = {}; M.rsemanal = {}; }
    return M;
  }
  function contarMision(ev, n = 1) { const M = revisarMisiones(); M.diaria[ev] = (M.diaria[ev] || 0) + n; M.semanal[ev] = (M.semanal[ev] || 0) + n; }
  // Login de 30 días: un casillero por día (se reclama desde el icono 📅 del Campamento); al completar el 30 vuelve al 1.
  // No hace falta entrar días seguidos: cada día que entras reclamas el siguiente casillero.
  function premioDia(d) {
    if (d === 30) return { oro: 10000, almas: 30, polvo: 30 };
    if (d % 7 === 0) return { oro: 1000 * d / 7, almas: 5 + 3 * d / 7 };
    if (d % 5 === 0) return { polvo: 5 + d / 5, piedra: 15 };
    return d % 2 ? { oro: 300 + 50 * d } : { piedra: 5 + d, estamina: d % 4 === 0 ? 30 : 0 };
  }
  const login30 = () => jugador.login30 ||= { n: 0, ultimo: null };
  const loginDisponible = () => login30().ultimo !== hoy();
  function reclamarLogin() {   // el casillero del día; tras el 30 vuelve al 1
    const L = login30(); if (L.n >= 30) L.n = 0;
    L.n++; L.ultimo = hoy(); const pr = premioDia(L.n); darPremio(pr); return pr;
  }
  const premioLogin = () => premioDia(login30().n % 30 + 1); const premioLoginViejo = () => { const L = jugador.login || { dias: 0 }, k = Math.min(3, 1 + Math.floor(L.dias / 7) * .25);
    return Object.fromEntries(Object.entries(LOGIN[L.dias % 7]).map(([a, v]) => [a, Math.round(v * k)])); };
  // las misiones de un modo aún bloqueado no aparecen (serían imposibles)
  const MODO_MISION = { jefe: 'pEvento', arena: 'pArena', arenaVict: 'pArena', torre: 'pTorre', encantar: 'pHerreria' };
  const misionesVisibles = tipo => MISIONES[tipo].filter(m => desbloqueado(MODO_MISION[m.ev]));
  function misionesReclamables(tipo) { const M = revisarMisiones(); return misionesVisibles(tipo).filter(m => (M[tipo][m.ev] || 0) >= m.meta && !M['r' + tipo][m.id]).length; }
  function bonusDisponible(tipo) { const M = revisarMisiones(); return !M['r' + tipo].bonus && Object.keys(M['r' + tipo]).length >= BONUS_MISIONES[tipo].meta; }
