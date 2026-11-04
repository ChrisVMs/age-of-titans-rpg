  // ---------------- Pacto (gremio, por ahora local) ----------------
  // Tu grupo de PACTO_MIEMBROS: tú y jugadores del servidor de poder parecido. Hoy el "servidor" son los bots
  // (servidorPacto); con un servidor real solo cambia servidorPacto, el resto del Pacto queda igual.
  // - Donaciones: cada día puedes donar oro DONACIONES_DIA veces; los demás miembros donan solos. Los fondos suben las
  //   tecnologías comunes (TEC_PACTO), que dan un bono a todo el Pacto.
  // - Jefe semanal: vida compartida. Cada miembro le pega cada día (tú, INTENTOS_JEFE_PACTO batallas; los bots, solos).
  //   Si cae antes del fin de semana, cada miembro cobra PREMIO_JEFE_PACTO. Cada semana sale otro jefe con vida nueva.
  // - Hora del asalto (HORAS_ASALTO, hora del juego): tu daño al jefe del Pacto cuenta doble. Es la cita diaria.
  const PACTO_MIEMBROS = 5, DONACIONES_DIA = 3, INTENTOS_JEFE_PACTO = 2, NIVEL_PACTO = 20;
  const APORTE_DONACION = 10;                       // fondos por donación (la tuya y la de cada bot)
  const DONACIONES_BOT_DIA = 2;                     // las que hace cada bot al día
  const costeDonacion = () => ({ oro: 50 * jugador.nivel });
  // tecnologías: cada nivel suma pct % al atributo (st) o una fracción de oro / XP de las batallas
  const TEC_PACTO = [
    { id: 'fuerza',  icono: '⚔️', nombre: 'Fuerza',  st: 'ataque',  pct: .5 },
    { id: 'aguante', icono: '❤️', nombre: 'Aguante', st: 'vida',    pct: .5 },
    { id: 'muralla', icono: '🛡️', nombre: 'Muralla', st: 'defensa', pct: .5 },
    { id: 'botin',   icono: '💰', nombre: 'Botín',   oro: .01 },
    { id: 'saber',   icono: '📖', nombre: 'Saber',   xp: .01 },
  ];
  const TEC_MAX = 20, costeTec = n => 20 * (n + 1);   // fondos de n a n + 1 (todo al máximo: ~140 días de un Pacto activo)
  const JEFES_PACTO = ['campeon', 'liche', 'verdugo', 'senor', 'ancestral', 'bruja'];   // uno por semana, en rueda
  const VIDA_JEFE_PACTO = 60;          // vida = la de un jefe de tu nivel de campaña × esto
  const DANO_BOT_DIA = .025;           // parte de la vida del jefe que quita cada bot al día (4 bots: 70 % en la semana)
  const HORAS_ASALTO = [[12, 14], [20, 22]], MULT_ASALTO = 2;
  const PREMIO_JEFE_PACTO = { cristales: 30, esencia: 3, almas: 5 };

  // "Servidor": quién puede estar en tu Pacto. Local: los bots del servidor de pruebas.
  const servidorPacto = { candidatos: () => bots().filter(b => b.nombre !== jugador.nombre) };
  const pactoAbierto = () => jugador.nivel >= NIVEL_PACTO || (jugador.ascension || 0) > 0;
  const fechaDe = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };   // de hoy() / semana()
  const enAsalto = (h = ahoraJuego().getHours()) => HORAS_ASALTO.some(([a, b]) => h >= a && h < b);

  // estado del Pacto (lo crea al primer uso con los miembros de poder más parecido) y su puesta al día diaria y semanal
  function pacto() {
    jugador.pacto ||= { miembros: [], fondos: 0, tec: {}, dia: null, donaciones: 0, intentos: 0, semana: null, jefe: null, aportes: {} };
    const P = jugador.pacto, d = hoy();
    if (P.semana !== semana()) nuevoJefePacto(P);
    if (P.dia !== d) {   // nuevo día: completa los huecos, se reponen tus donaciones e intentos; los bots donan y pegan al jefe
      completarPacto(P);
      const dias = P.dia ? Math.min(7, Math.max(1, Math.round((fechaDe(d) - fechaDe(P.dia)) / 864e5))) : 1;
      P.dia = d; P.donaciones = 0; P.intentos = 0;
      for (const n of P.miembros) {
        P.fondos += DONACIONES_BOT_DIA * APORTE_DONACION * dias;
        P.aportes[n] = (P.aportes[n] || 0) + DONACIONES_BOT_DIA * APORTE_DONACION * dias;
        danoJefePacto(P, n, Math.round(P.jefe.vidaMax * DANO_BOT_DIA * dias));
      }
    }
    return P;
  }
  // huecos libres: los jugadores del servidor de poder más parecido al tuyo (al empezar el servidor hay pocos)
  function completarPacto(P) {
    const faltan = PACTO_MIEMBROS - 1 - P.miembros.length; if (faltan <= 0) return;
    const yo = poder(), nuevos = servidorPacto.candidatos().filter(b => !P.miembros.includes(b.nombre))
      .map(b => [b.nombre, Math.abs(conPerfil(b, () => poder()) - yo)]).sort((a, b) => a[1] - b[1]).slice(0, faltan).map(x => x[0]);
    P.miembros.push(...nuevos);
  }
  function nuevoJefePacto(P) {
    const k = JEFES_PACTO[(Math.floor(fechaDe(semana()).getTime() / 6048e5) % JEFES_PACTO.length + JEFES_PACTO.length) % JEFES_PACTO.length];
    const e = crearDificultad(Math.max(1, nPoderCampana()), 'normal', [k]).enemigos[0];
    const vida = Math.round(e.vida * VIDA_JEFE_PACTO);
    P.semana = semana(); P.jefe = { tipo: k, vidaMax: vida, vida, dano: {}, cobrado: false, e: { ...e, vida, oro: 0, xp: 0 } };
  }
  function danoJefePacto(P, quien, d) {
    if (!P.jefe || P.jefe.vida <= 0) return 0;
    d = Math.min(P.jefe.vida, Math.max(0, d)); P.jefe.vida -= d; P.jefe.dano[quien] = (P.jefe.dano[quien] || 0) + d;
    return d;
  }
  const nivelTec = id => (pacto().tec[id] || 0);
  function statsPacto() {   // % de atributos para estadisticas()
    const t = {}; if (!jugador.pacto) return t;
    for (const x of TEC_PACTO) if (x.st && jugador.pacto.tec[x.id]) t[x.st] = (t[x.st] || 0) + x.pct * jugador.pacto.tec[x.id];
    return t;
  }
  const bonoPacto = k => jugador.pacto ? TEC_PACTO.reduce((s, x) => s + (x[k] || 0) * (jugador.pacto.tec[x.id] || 0), 0) : 0;

  function donarPacto() {
    const P = pacto(), c = costeDonacion();
    if (!pactoAbierto() || P.donaciones >= DONACIONES_DIA || !tieneCoste(c)) return false;
    pagar(c); P.donaciones++; P.fondos += APORTE_DONACION; P.aportes.yo = (P.aportes.yo || 0) + APORTE_DONACION;
    return true;
  }
  function mejorarTec(id) {
    const P = pacto(), x = TEC_PACTO.find(t => t.id === id), n = P.tec[id] || 0;
    if (!x || n >= TEC_MAX || P.fondos < costeTec(n)) return false;
    P.fondos -= costeTec(n); P.tec[id] = n + 1; return true;
  }
  // batalla contra el jefe del Pacto (1 contra 1, conserva el daño de todos); gasta un intento al empezar
  function batallaPacto() {
    const P = pacto(); if (!pactoAbierto() || P.intentos >= INTENTOS_JEFE_PACTO || P.jefe.vida <= 0) return null;
    P.intentos++;
    return { nombre: `🤝 Jefe del Pacto: ${P.jefe.e.nombre}`, pacto: true, enemigos: [{ ...P.jefe.e, vida: P.jefe.vidaMax }],
             premio: { oro: 0, xp: 0 }, botin: { piedra: [0, 0], polvo: 0 } };
  }
  // al terminar la batalla del Pacto (desde cobrarResultado): el daño (doble en la hora del asalto) baja la vida
  // compartida y paga como un jefe. Devuelve el texto extra del resultado.
  function resultadoPacto() {
    const P = pacto(), mult = enAsalto() ? MULT_ASALTO : 1, d = danoJefePacto(P, 'yo', batalla.danoHecho * mult);
    batalla.ganado.oro += Math.round(d * .2); batalla.ganado.xp += Math.round(d * .1);
    batalla.ganado.piedra += Math.floor(d / 100); batalla.ganado.polvo += Math.floor(d / 375);
    return `<br>🤝 Daño al jefe del Pacto: <b>${d.toLocaleString('es')}</b>${mult > 1 ? ' (asalto ×2)' : ''}`;
  }
  const premioPactoListo = () => !!jugador.pacto && jugador.pacto.jefe && jugador.pacto.jefe.vida <= 0 && !jugador.pacto.jefe.cobrado;
  function cobrarPremioPacto() {
    if (!premioPactoListo()) return null;
    jugador.pacto.jefe.cobrado = true; darPremio(PREMIO_JEFE_PACTO); return PREMIO_JEFE_PACTO;
  }
  // vida del jefe para el motor (1 contra 1): la compartida de esta semana
  const vidaJefePacto = () => pacto().jefe.vida;
