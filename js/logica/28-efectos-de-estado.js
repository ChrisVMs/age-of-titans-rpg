  // ---------------- Efectos de estado ----------------
  // Daño por turno (quemadura, veneno, sangrado) o pérdida del turno (congelación, aturdimiento).
  // Se resuelven al empezar el turno de quien los sufre. El daño por turno se fija al aplicarse:
  // si lo aplica un enemigo es un % de tu vida máxima; si lo aplicas tú, un % de tu ataque.
  const ESTADOS = {
    quemadura:    { icono: '🔥', nombre: 'Quemadura' },
    veneno:       { icono: '☠️', nombre: 'Veneno', acumula: 5 },   // se acumula hasta 5 veces
    sangrado:     { icono: '🩸', nombre: 'Sangrado' },
    congelacion:  { icono: '❄️', nombre: 'Congelación', control: true },
    aturdimiento: { icono: '💫', nombre: 'Aturdimiento', control: true },
    danza:        { icono: '✖️', nombre: 'Danza de cuchillas', mejora: true },   // buff del Asesino: más daño (BUFF_DANZA)
  };
  for (const [id, e] of Object.entries(ESTADOS)) e.img = id === 'danza' ? 'hab_danza' : 'est_' + id;   // icono HD
  // Buffs propios (habilidades con 'buff'): no hacen daño ni hacen perder el turno; duran sus turnos de ataque.
  const BUFF_DANZA = { turnos: 3, dano: .5 };   // Danza de cuchillas: +50 % de daño en los 3 ataques siguientes
  // Daño de los estados que ponen los monstruos: FIJO, un % (TOPE_PCT_ESTADO como mucho) de la vida que se espera que tenga
  // el jugador en ese contenido (vidaEsperada, medida con el simulador). Así, al subir de poder, duelen menos. Sin nivel de
  // contenido (jefes mundiales, rivales de arena y Ecos) es un % de tu vida máxima, con el mismo tope.
  // Al héroe y a los jefes el mismo estado no se acumula: reinicia su duración (estados distintos sí conviven). Antes el
  // veneno se apilaba ×5 (12-15 % de la vida por turno).
  const TOPE_PCT_ESTADO = .025;
  const vidaEsperada = n => 153 * 1.117 ** (n - 1);   // vida el día en que se supera ese contenido (simulador, 3 semillas): ~1 k en n 18, ~2,4 k en n 26
  const sinPilas = u => u.heroe || !!(u.e && (u.e.jefe || u.e.rey || u.e.cerbero || u.e.asmodeo || u.e.minotauro));
  const danoEstadoMonstruo = (e, a, objetivo) => Math.max(1, Math.round((e.nEq ? vidaEsperada(e.nEq) : objetivo.vidaMax) * Math.min(a.pct || 0, TOPE_PCT_ESTADO)));
