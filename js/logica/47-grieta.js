  // ---------------- La Grieta (mazmorra semanal) ----------------
  // 15 pisos seguidos que cambian cada semana (enemigos y modificadores sembrados con la semana). La vida NO se recupera
  // entre pisos y tras cada victoria eliges 1 de 3 bendiciones (solo para esta semana). Perder termina el intento; hay
  // GRIETA_INTENTOS por semana y solo se cobran los pisos que superan tu mejor marca de la semana. El lunes se reinicia.
  // Añadir una bendición o cambiar los premios = editar las listas.
  const GRIETA_PISOS = 15, GRIETA_INTENTOS = 2, GRIETA_JEFES = [5, 10, 15];
  const BENDICIONES = [
    { id: 'furia',    icono: '⚔️', nombre: 'Furia',       desc: '+12 % de ataque',    st: { ataque: 12 } },
    { id: 'muralla',  icono: '🛡️', nombre: 'Muralla',     desc: '+12 % de defensa',   st: { defensa: 12 } },
    { id: 'vigor',    icono: '❤️', nombre: 'Vigor',       desc: '+15 % de vida',      st: { vida: 15 } },
    { id: 'coraza',   icono: '🦾', nombre: 'Coraza',      desc: '+20 % de armadura',  st: { armadura: 20 } },
    { id: 'respiro',  icono: '💚', nombre: 'Respiro',     desc: 'recupera el 40 % de la vida', cura: .4 },
    { id: 'segunda',  icono: '🔥', nombre: 'Segundo aire', desc: 'recupera el 25 % y +6 % de ataque', cura: .25, st: { ataque: 6 } },
  ];
  // premio de cada piso (n) y de los pisos de jefe; nEq: dificultad de la semana (sale del nivel del jugador)
  const premioPisoGrieta = (n, nEq) => ({ oro: Math.round(120 * nEq * (1 + n / 10)), xp: Math.round(60 * nEq * (1 + n / 10)), piedra: 2 + Math.floor(n / 3) });
  const PREMIO_JEFE_GRIETA = { 5: { almas: 5, polvo: 5 }, 10: { almas: 10, cristales: 5 }, 15: { almas: 20, cristales: 10, esencia: 10 } };
  // dificultad (n equivalente de la campaña): fija en la semana según lo más difícil que hayas superado en la campaña
  // (nPoderCampana; el nivel no sirve: sube aunque el poder se estanque) y sube con cada piso
  let GRIETA_ESCALA = { base: -2, porPiso: .35 };
  const nEqGrieta = () => Math.max(1, nPoderCampana() + GRIETA_ESCALA.base);
  function revisarGrieta() {
    const G = jugador.grieta ||= {};
    if (G.semana !== semana()) Object.assign(G, { semana: semana(), nEq: nEqGrieta(), intentos: GRIETA_INTENTOS, mejor: 0,
      piso: 0, vida: 1, bend: [], ofertas: null, enCurso: false, activa: false });
    if (G.enCurso && !ui.enBatalla()) terminarIntentoGrieta();   // se salió a mitad de un piso: cuenta como derrota
    return G;
  }
  function pisoGrieta(n, G = revisarGrieta()) {
    const rnd = azarSemilla('grieta' + G.semana + ':' + n), jefe = GRIETA_JEFES.includes(n);
    const pool = [...TIPOS_TORRE, 'esqueleto', 'caballero', 'gargola', 'diablillo', 'demonio', 'sucubo'].filter(t => TIPOS_ENEMIGO[t]);
    const tipos = jefe ? [n === 15 ? 'liche' : n === 10 ? 'bruja' : 'ancestral', pool[Math.floor(rnd() * pool.length)]]
      : [0, 1, 2].map(() => pool[Math.floor(rnd() * pool.length)]);
    const d = crearDificultad(G.nEq + n * GRIETA_ESCALA.porPiso, 'normal', tipos);
    const mods = elegirMods(rnd, jefe ? 2 : 1, MODIFICADORES);
    for (const e of d.enemigos) { for (const md of mods) (md.torre || md).ap(e); e.oro = 0; e.xp = 0; }
    return { enemigos: d.enemigos, mods, jefe };
  }
  // % de estadísticas de las bendiciones elegidas (se suman)
  function statsBendiciones(G = revisarGrieta()) {
    const t = {}; for (const id of G.bend) for (const [a, v] of Object.entries(BENDICIONES.find(b => b.id === id).st || {})) t[a] = (t[a] || 0) + v; return t;
  }
  const puedeEntrarGrieta = () => { const G = revisarGrieta(); return desbloqueado('pGrieta') && !G.ofertas && (G.activa || G.intentos > 0) && G.piso < GRIETA_PISOS; };
  // La batalla del siguiente piso (empieza un intento si no hay uno activo). null si no se puede.
  function batallaGrieta() {
    if (!puedeEntrarGrieta()) return null;
    const G = revisarGrieta();
    if (!G.activa) Object.assign(G, { activa: true, intentos: G.intentos - 1, piso: 0, vida: 1, bend: [] });
    const n = G.piso + 1, p = pisoGrieta(n, G);
    G.enCurso = true;
    return { nombre: `🌀 Grieta · Piso ${n}${p.jefe ? ' · JEFE' : ''}`, grieta: n, aliados: [], stPct: statsBendiciones(G), vidaYo: G.vida,
             premio: n > G.mejor ? premioPisoGrieta(n, G.nEq) : {}, botin: { piedra: [0, 0], polvo: 0 }, enemigos: p.enemigos };
  }
  function terminarIntentoGrieta() { const G = jugador.grieta; Object.assign(G, { activa: false, enCurso: false, ofertas: null }); }
  // Al terminar el piso (lo llama cobrarResultado): guarda la vida, cobra el premio de jefe y ofrece bendiciones
  function grietaTerminada(gano, vidaFrac) {
    const G = jugador.grieta, n = batalla.campana.grieta; G.enCurso = false;   // sin revisarGrieta: aún cuenta como "en curso"
    if (!gano) { terminarIntentoGrieta(); return `<br>🌀 Fin del intento en el piso ${n}`; }
    G.piso = n; G.vida = Math.max(.01, vidaFrac);
    let t = '';
    if (n > G.mejor) { G.mejor = n; sumarPuntosEco(PUNTOS_ECO.grieta); const pj = PREMIO_JEFE_GRIETA[n]; if (pj) { darPremio(pj); t += `<br>🏅 Piso ${n}: ${textoPremio(pj)}`; } }
    if (n >= GRIETA_PISOS) { terminarIntentoGrieta(); return t + '<br>🌀 ¡Grieta completada!'; }
    G.ofertas = elegirMods(azarSemilla('bend' + G.semana + ':' + n + ':' + G.intentos), 3, BENDICIONES).map(b => b.id);
    return t;
  }
  // la que elegiría un jugador sensato (bot y simulador): cura si va por debajo de la mitad; si no, estadísticas
  function bendicionSugerida(G = revisarGrieta()) {
    const of = (G.ofertas || []).map(id => BENDICIONES.find(b => b.id === id));
    return ((G.vida < .5 && of.find(b => b.cura)) || of.find(b => b.st && !b.cura) || of[0] || {}).id;
  }
  function elegirBendicion(id) {
    const G = revisarGrieta(); if (!G.ofertas || !G.ofertas.includes(id)) return false;
    const b = BENDICIONES.find(x => x.id === id);
    if (b.cura) G.vida = Math.min(1, G.vida + b.cura);
    if (b.st) G.bend.push(id);
    G.ofertas = null; return true;
  }
