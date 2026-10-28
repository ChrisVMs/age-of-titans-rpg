  // ---------------- Arena (PvP asíncrono) ----------------
  // Rivales controlados por la IA, creados como copias de un guerrero con un poder parecido al tuyo.
  // 5 entradas al día; ganar da puntos de arena (más contra rivales fuertes) y perder los resta.
  const ARENA_ENTRADAS = 5, COSTE_RIVALES = 200;
  const LIGAS = [[0, 'Bronce', '🥉'], [1100, 'Plata', '🥈'], [1300, 'Oro', '🥇'], [1600, 'Diamante', '💎'], [2000, 'Leyenda', '👑']];
  const NOMBRES_RIVAL = ['Aldric', 'Brunhilda', 'Kael', 'Morgana', 'Thorin', 'Isolde', 'Ragnar', 'Seraphine', 'Darius', 'Lyra', 'Gorak', 'Elowen'];
  const FILTROS_RIVAL = ['hue-rotate(90deg) saturate(2)', 'hue-rotate(200deg) saturate(2)', 'sepia(1) saturate(4) hue-rotate(10deg)', 'grayscale(1) brightness(1.4)'];
  const diasFinMes = () => { const d = ahoraJuego(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1; };
  const ligaDe = pts => { let i = 0; LIGAS.forEach((l, k) => { if (pts >= l[0]) i = k; }); return i; };
  // Los rivales tienen su propio azar (mismo día, puntos y victorias = mismos rivales): se generan al mirar la arena o el
  // Campamento, y con el azar del juego eso cambiaba las batallas siguientes según lo que se hubiera pintado antes.
  function generarRivales() {
    const A = jugador.arena, pts = A.puntos, r = azarSemilla(`rivales ${hoy()} ${pts} ${A.victorias || 0}`), de = l => l[Math.floor(r() * l.length)];
    A.rivales = [.85, 1, 1.15].map(f => ({ nombre: de(NOMBRES_RIVAL), f: Math.round((f + (r() - .5) * .04) * 100) / 100,
      puntos: Math.max(0, pts + Math.round((f - 1) * 300) + Math.floor(r() * 51) - 25), filtro: de(FILTROS_RIVAL) }));
  }
  // Temporadas mensuales: al cambiar de mes se entrega el premio de la liga alcanzada y los puntos se reinician a medias
  const PREMIO_LIGA = [{ oro: 1000 }, { oro: 3000, almas: 5 }, { oro: 6000, almas: 12 }, { oro: 12000, almas: 25 }, { oro: 20000, almas: 45 }];
  const mesActual = () => { const d = ahoraJuego(); return `${d.getFullYear()}-${d.getMonth() + 1}`; };
  function revisarArena() {
    jugador.arena ||= { puntos: 1000, victorias: 0 };
    const A = jugador.arena;
    if (!A.temporada) A.temporada = mesActual();
    else if (A.temporada !== mesActual()) {
      const li = ligaDe(A.puntos), pr = PREMIO_LIGA[li]; darPremio(pr);
      setTimeout(() => ui.avisar(`🏆 Fin de temporada (${LIGAS[li][1]}): ${textoPremio(pr)}`), 1500);
      A.puntos = A.puntos > 1000 ? 1000 + Math.floor((A.puntos - 1000) / 2) : A.puntos; A.temporada = mesActual(); guardar();
    }
    if (jugador.arena.dia !== hoy()) { jugador.arena.dia = hoy(); jugador.arena.entradas = ARENA_ENTRADAS; generarRivales(); }
    return jugador.arena;
  }
  function batallaArena(i) {   // la batalla contra el rival i (sin gastar la entrada)
    const a = revisarArena(), r = a.rivales[i], s0 = estadisticas(), li = ligaDe(a.puntos);
    return ({ nombre: `Arena: ${r.nombre}`, arena: true, premio: { oro: 300 + 150 * li, xp: 60, piedra: 4, polvo: 5 + li },   // la Arena es la fuente propia de polvo (refinar y pulir)
      botin: { piedra: [0, 0], polvo: 0 }, enemigos: [{ nombre: r.nombre, rival: true, vida: Math.round(s0.vida * Math.sqrt(r.f) * 1.12), armadura: Math.round(s0.armadura * r.f), defensa: Math.round(s0.defensa * r.f), ef: efectosDefensa(efecto),
        dano: [Math.round(s0.ataque * Math.sqrt(r.f) * .9), Math.round(s0.ataque * Math.sqrt(r.f) * 1.1)], oro: 0, xp: 0, filtro: r.filtro,
        critico: efecto('critico'), danoCritico: DANO_CRITICO_BASE + efecto('danoCritico'), habilidad: { nombre: 'Estocada', turnos: 4, mult: 2.5 },
        aplica: [{ estado: 'sangrado', prob: .15, turnos: 2, pct: .03 }] }] });
  }
  function resultadoArena(gano) {
    const a = revisarArena(), r = a.rivales[a.rivalActual] || { f: 1 }, d = gano ? Math.round(25 * r.f) : -12, antes = ligaDe(a.puntos);
    a.puntos = Math.max(0, a.puntos + d); if (gano) { a.victorias = (a.victorias || 0) + 1; sumarMaestria(3); contarMision('arenaVict'); }
    generarRivales();
    const l = LIGAS[ligaDe(a.puntos)];
    return `<br><b>🏆 Arena: ${d > 0 ? '+' : ''}${d} pts (${a.puntos})</b>${ligaDe(a.puntos) > antes ? `<br>¡Ascenso a liga ${l[2]} ${l[1]}!` : ''}`;
  }
