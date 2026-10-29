  // ---------------- Ecos: rivales con memoria ----------------
  // 4 rivales con nombre que crecen contigo (su fuerza es tu poder × su curva), recuerdan el historial contigo y se
  // vengan: si les ganas vuelven más fuertes (+VENGANZA_PASO, hasta VENGANZA_MAX); si te ganan, se les pasa. Cada día uno
  // te reta (pelea gratis, sin entradas de arena) y compiten contigo en un ranking semanal con premio el lunes.
  // Pelean con el motor de la arena (rival construido con tus estadísticas × su fuerza). Añadir un Eco = una entrada.
  let ECO_BASE = 1.7;   // vida y daño de los Ecos sobre un rival de arena (objetivo: ganar ~50-65 % de los retos)
  const VENGANZA_PASO = .05, VENGANZA_MAX = .15, VICTORIAS_TITULO_ECO = 10;
  const ECOS = [
    { id: 'kael', icono: '🗡️', nombre: 'Kael el Veloz', filtro: 'hue-rotate(180deg) saturate(1.4)',
      fuerza: () => 1.08, estilo: { vida: .92, dano: 1.05, critico: .1 },
      frases: { reto: ['¿Otra vez tú? Esta vez ni me verás venir.', 'Hoy voy un paso por delante.'],
                gana: ['Demasiado lento.', 'Sigue entrenando.'], pierde: ['Suerte... Mañana no la tendrás.', '¡Revancha!'] },
      titulo: ['Némesis de Kael', { ataque: 3, defensa: 2 }] },
    { id: 'brunna', icono: '🛡️', nombre: 'Brunna la Muralla', filtro: 'sepia(.6) saturate(1.6)',
      fuerza: () => jugador.nivel < 50 ? .9 : 1.1, estilo: { vida: 1.2, dano: .85, armadura: 1.3 },
      frases: { reto: ['Ven. Choca contra el muro.', 'No me moverás.'],
                gana: ['Las murallas no caen.', 'Golpea más fuerte.'], pierde: ['Una grieta... la taparé.', 'Volveré más dura.'] },
      titulo: ['Rompemuros', { vida: 3, armadura: 2 }] },
    { id: 'vex', icono: '🌑', nombre: 'Vex la Sombra', filtro: 'grayscale(.7) brightness(.7)',
      fuerza: () => 1 + (azarSemilla('vex' + semana())() - .5) * .24, estilo: { vida: 1, dano: 1, veneno: .35 },
      frases: { reto: ['Las sombras te susurran mi nombre.', 'Hoy estoy de humor...'],
                gana: ['El veneno nunca falla.', 'Te dije que no confiaras en la luz.'], pierde: ['Me desvanezco... por ahora.', 'Volveré cuando no mires.'] },
      titulo: ['Cazasombras', { ataque: 2, vida: 3 }] },
    { id: 'aldric', icono: '👑', nombre: 'Aldric el Veterano', filtro: 'hue-rotate(40deg) saturate(1.8)',
      fuerza: R => (R.racha || 0) >= 3 ? 1.05 : 1.15, estilo: { vida: 1.05, dano: 1.05 },
      frases: { reto: ['Muéstrame lo que has aprendido.', 'Un veterano no regala nada.'],
                gana: ['Aún te falta, joven.', 'La experiencia pesa.'], pierde: ['Bien luchado. Me has superado.', 'El alumno crece...'] },
      titulo: ['Heredero de Aldric', { ataque: 3, vida: 3 }] },
  ];
  const PREMIO_RETO = { oro: 1500, xp: 300 }, CRISTALES_RETO = 1, CRISTALES_VENGANZA = 2;
  const PUNTOS_ECO = { victoria: 150, venganza: 50, torre: 5, grieta: 15 };   // tus puntos semanales
  const PREMIO_RANKING_ECOS = [{ cristales: 15, fichas: 100 }, { cristales: 10, fichas: 60 }, { cristales: 6, fichas: 30 }, { cristales: 3, fichas: 15 }, { cristales: 1, fichas: 5 }];
  TITULOS.push(...ECOS.map(e => T('eco_' + e.id, e.titulo[0], 'epico', `Gana ${VICTORIAS_TITULO_ECO} veces a ${e.nombre}`,
    () => [Math.min(VICTORIAS_TITULO_ECO, ((jugador.ecos || {}).rival || {})[e.id]?.gan || 0), VICTORIAS_TITULO_ECO], e.titulo[1])));
  const eco = id => ECOS.find(e => e.id === id);
  function revisarEcos() {
    const E = jugador.ecos ||= { rival: {}, puntos: 0 };
    for (const e of ECOS) E.rival[e.id] ||= { gan: 0, per: 0, racha: 0, venganza: 0 };
    if (E.semana !== semana()) {   // lunes: premio por el puesto de la semana anterior y ranking a cero
      if (E.semana) { const pr = premioRankingEcos(); if (pr) { darPremio({ cristales: pr.cristales }); revisarEvento().fichas += pr.fichas; E.ultimoPremio = pr; } }
      E.semana = semana(); E.puntos = 0;
    }
    if (E.dia !== hoy()) { E.dia = hoy(); E.reto = ECOS[Math.floor(azarSemilla('eco' + hoy())() * ECOS.length)].id; E.hecho = false; }
    return E;
  }
  const fuerzaEco = id => { const R = revisarEcos().rival[id]; return eco(id).fuerza(R) * (1 + R.venganza); };
  // puntos de los Ecos en la semana: por día transcurrido, según su fuerza (sin estado: se recalcula igual siempre)
  function puntosEco(id, dias = (ahoraJuego().getDay() + 6) % 7 + 1, sem = semana()) {   // sin revisarEcos: la usa al cerrar la semana
    const R = jugador.ecos.rival[id];
    let t = 0; for (let d = 0; d < dias; d++) t += Math.round(110 * eco(id).fuerza(R) + azarSemilla(`ecopts ${id} ${sem} ${d}`)() * 60);
    return t;
  }
  function rankingEcos(dias) {
    const E = revisarEcos();
    return [{ yo: true, nombre: jugador.nombre, puntos: E.puntos }, ...ECOS.map(e => ({ id: e.id, nombre: e.nombre, icono: e.icono, puntos: puntosEco(e.id, dias) }))]
      .sort((a, b) => b.puntos - a.puntos);
  }
  function premioRankingEcos() {   // al cerrar la semana (7 días de los Ecos)
    const E = jugador.ecos, l = [{ yo: true, puntos: E.puntos }, ...ECOS.map(e => ({ puntos: puntosEco(e.id, 7, E.semana) }))].sort((a, b) => b.puntos - a.puntos);
    return PREMIO_RANKING_ECOS[l.findIndex(x => x.yo)];
  }
  function sumarPuntosEco(n) { if (desbloqueado('pArena')) revisarEcos().puntos += n; }
  const retoPendiente = () => desbloqueado('pArena') && !revisarEcos().hecho;
  function batallaEco(id = revisarEcos().reto) {   // el reto del día (gratis)
    if (!retoPendiente() || id !== revisarEcos().reto) return null;
    const e = eco(id), f = fuerzaEco(id), s0 = estadisticas(), st = e.estilo, q = Math.sqrt(f);
    return { nombre: `${e.icono} ${e.nombre}`, arena: true, eco: id, premio: { ...PREMIO_RETO }, botin: { piedra: [0, 0], polvo: 0 },
      enemigos: [{ nombre: e.nombre, rival: true, filtro: e.filtro, vida: Math.round(s0.vida * q * 1.12 * (st.vida || 1) * ECO_BASE),
        armadura: Math.round(s0.armadura * f * (st.armadura || 1)), defensa: Math.round(s0.defensa * f), ef: efectosDefensa(efecto),
        dano: [Math.round(s0.ataque * q * .9 * (st.dano || 1) * ECO_BASE), Math.round(s0.ataque * q * 1.1 * (st.dano || 1) * ECO_BASE)], oro: 0, xp: 0,
        critico: efecto('critico') + (st.critico || 0), danoCritico: DANO_CRITICO_BASE + efecto('danoCritico'), habilidad: { nombre: 'Golpe de rival', turnos: 4, mult: 2.5 },
        aplica: [{ estado: 'sangrado', prob: .15, turnos: 2, pct: .03 }, ...(st.veneno ? [{ estado: 'veneno', prob: st.veneno, turnos: 3, pct: .025 }] : [])] }] };
  }
  // al terminar el reto (lo llama cobrarResultado): memoria, venganza, puntos y la frase del Eco
  function resultadoEco(gano) {
    const E = revisarEcos(), id = batalla.campana.eco, e = eco(id), R = E.rival[id], venganza = R.venganza > 0;
    E.hecho = true;
    const frase = l => l[Math.floor(azarSemilla(`frase ${id} ${hoy()}`)() * l.length)];
    if (!gano) { R.per++; R.racha = 0; R.venganza = 0; return `<br>${e.icono} «${frase(e.frases.gana)}» · ${e.nombre} ${R.per} – ${R.gan} tú`; }
    R.gan++; R.racha++; R.venganza = Math.min(VENGANZA_MAX, R.venganza + VENGANZA_PASO);
    const cr = venganza ? CRISTALES_VENGANZA : CRISTALES_RETO; jugador.cristales += cr;
    E.puntos += PUNTOS_ECO.victoria + (venganza ? PUNTOS_ECO.venganza : 0);
    return `<br>${e.icono} «${frase(e.frases.pierde)}» · tú ${R.gan} – ${R.per} ${e.nombre} · 💎 ${cr}`;
  }
