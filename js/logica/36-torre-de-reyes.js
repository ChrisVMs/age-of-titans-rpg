  // ---------------- Torre de reyes ----------------
  // Evento semanal multijugador: tu grupo (hasta 3, desde la sala) contra los 3 "reyes" a la vez, 3 contra 3 en el rombo.
  // Los reyes son el top 3 del ranking del servidor (sin contarte a ti) y luchan con un % de sus atributos reales según la
  // dificultad (ataque, defensa, vida y armadura), con sus efectos, golpes de estado y habilidades de clase.
  // 3 intentos al día; cada dificultad da su premio la primera vez que se gana en la semana (se reinicia cada lunes).
  const DIF_REYES = {
    normal:    { nombre: 'Normal',    pct: .6,  premio: { oro: 5000, almas: 10 } },
    dificil:   { nombre: 'Difícil',   pct: .8,  premio: { oro: 10000, almas: 20, polvo: 5 } },
    pesadilla: { nombre: 'Pesadilla', pct: 1,   premio: { oro: 20000, almas: 40, polvo: 15 } },
    infierno:  { nombre: 'Infierno',  pct: 1.3, premio: { oro: 35000, almas: 70, polvo: 30 } },
  };
  const INTENTOS_REYES = 3;
  // efectos defensivos de un perfil (arena y reyes los usan como los usarías tú)
  function efectosDefensa(ef) { return Object.fromEntries(['esquiva', 'reduccion', 'resistencia', 'robo', 'contra'].map(k => [k, ef(k)])); }
  function revisarReyes() {
    const R = jugador.reyes ||= {};
    if (R.semana !== semana()) { R.semana = semana(); R.vencidas = {}; }
    R.vencidas ||= {};
    if (R.dia !== hoy()) { R.dia = hoy(); R.entradas = INTENTOS_REYES; }
    return R;
  }
  // los reyes: los 3 mejores bots del ranking (puesto 1 = el de más poder)
  function reyesSemana() {
    return rankingServidor().filter(x => !x.yo).slice(0, 3).map((t, i) =>
      ({ puesto: i + 1, nombre: t.nombre, clase: t.clase, nivel: t.nivel, poder: t.poder, perfil: t.bot }));
  }
  function iniciarReyes(dif, aliados, posiciones) {
    const R = revisarReyes(), d = DIF_REYES[dif];
    if (R.entradas <= 0) return;
    R.entradas--; guardar();
    iniciarCampana(batallaReyes(dif, aliados, posiciones));
  }
  function batallaReyes(dif, aliados, posiciones) {   // la batalla contra los 3 reyes (sin gastar el intento)
    const d = DIF_REYES[dif];
    return { nombre: `👑 Torre de reyes · ${d.nombre}`, reyes: dif, aliados, posiciones, premio: { xp: 150 * (Object.keys(DIF_REYES).indexOf(dif) + 1) },
      botin: { piedra: [0, 0], polvo: 0 },
      enemigos: reyesSemana().map(rey => ({ nombre: `${CLASES[rey.clase].icono} ${rey.nombre}`, rey: true, rival: true, jefe: rey.puesto === 1,
        perfil: rey.perfil, pct: d.pct, oro: 0, xp: 0 })) };
  }
  function reyVencido(dif) {
    const R = revisarReyes(), d = DIF_REYES[dif];
    if (R.vencidas[dif]) return `<br>👑 Ya ganaste ${d.nombre} esta semana: sin premio extra.`;
    R.vencidas[dif] = true; darPremio(d.premio);
    if (dif === 'pesadilla' || dif === 'infierno') sumarLogro('reyes1');
    guardar();
    return `<br><b>👑 ¡Has vencido a los 3 reyes en ${d.nombre}!</b> ${textoPremio(d.premio)}`;
  }
  // La pantalla de la Torre de reyes ES la sala previa (grupo, dificultad, empezar). El ranking tiene su propia pantalla.
  let rankSel = 0;
