  // ---------------- Calabozo multijugador ----------------
  // Mazmorra en grupo (hasta 3, desde una sala) contra 3 monstruos y un jefe a la vez, en el rombo. El dueño elige el
  // calabozo y la dificultad; cada uno se desbloquea al superar el anterior. Niveles 10/12/14/16, calibrados con un perfil
  // de ~5,7k de poder (lo normal al desbloquearlo en Nv 25): la Cripta en Normal se pierde por poco yendo solo y se gana
  // con 3 jugadores con ~50-75 % de vida.
  // No gasta estamina (2 intentos al día) y paga 1,5 veces su premio (más el botín de cada enemigo): compensa ir en grupo sin
  // dejar la campaña sin sentido. Los enemigos tienen +70 % de vida por aliado.
  const CALABOZOS = [
    { id: 1, nombre: 'Cripta del cementerio', icono: '⚰️', n: 10,  tipos: ['parca', 'sombria', 'carmesi'],  jefe: 'ancestral' },
    { id: 2, nombre: 'Mausoleo ancestral',    icono: '🏛️', n: 12,  tipos: ['carmesi', 'maldita', 'sombria'], jefe: 'ancestral' },
    { id: 3, nombre: 'Ciénaga de la bruja',   icono: '🌫️', n: 14,  tipos: ['pantano', 'escarcha', 'ignea'],  jefe: 'bruja' },
    { id: 4, nombre: 'Abismo de brasas',      icono: '🌋', n: 16, tipos: ['ignea', 'brasas', 'maldita'],    jefe: 'bruja' },
  ];
  jugador.calabozos ||= {};
  const calabozo = id => CALABOZOS.find(c => c.id === id) || CALABOZOS[0];
  const calabozoAbierto = id => id === 1 || !!jugador.calabozos[id - 1];
  // Dificultades: Normal abierta; cada una se desbloquea al superar la anterior en ese calabozo
  jugador.calabozosDif ||= {};
  const difAbierta = (id, d) => d === 'normal' || !!jugador.calabozosDif[`${id}:${ORDEN_DIF[ORDEN_DIF.indexOf(d) - 1]}`];
  const premioCalabozo = (id, dif) => Object.fromEntries(Object.entries(crearDificultad(calabozo(id).n, dif, []).premio).map(([k, v]) => [k, Math.round(v * 1.5)]));
  // Sin estamina: 2 intentos al día
  const INTENTOS_CALABOZO = 2;
  function revisarCalabozo() { const C = jugador.calabozoDia ||= {}; if (C.dia !== hoy()) { C.dia = hoy(); C.entradas = INTENTOS_CALABOZO; } return C; }
  function iniciarCalabozo(dif, aliados, posiciones, id) {
    const C = revisarCalabozo(), ayuda = C.entradas <= 0;   // sin intentos: puedes ayudar al grupo, pero no recibes recompensa
    if (!ayuda) { C.entradas--; guardar(); }
    iniciarCampana(batallaCalabozo(dif, aliados, posiciones, id, ayuda));
  }
  function batallaCalabozo(dif, aliados, posiciones, id, ayuda = false) {   // la batalla del calabozo id (sin gastar el intento)
    const c = calabozo(id), tipos = [0, 1, 2].map(() => elegir(c.tipos)), d = crearDificultad(c.n, dif, [c.jefe, ...tipos]);
    for (const e of d.enemigos) { e.vida = Math.round(e.vida * MULT_CALABOZO.vida); e.dano = e.dano.map(x => Math.round(x * MULT_CALABOZO.dano)); }
    return { nombre: `${c.icono} ${c.nombre} · ${DIFICULTADES[dif]}`, calabozo: dif, cal: c.id, ayuda, aliados, posiciones, premio: premioCalabozo(c.id, dif), botin: d.botin, enemigos: d.enemigos };
  }
  const MULT_CALABOZO = { vida: 2.3, dano: 1.5 };   // un free player de ~5,8k lo pasaba solo: ahora pide grupo
  const OBJETO_CALABOZO = { normal: { epica: 100 }, dificil: { epica: 70, legendaria: 30 }, pesadilla: { legendaria: 90, mitica: 10 }, infierno: { legendaria: 75, mitica: 25 } };
  function calabozoSuperado(id) {
    if (jugador.calabozos[id] || !calabozoAbierto(id)) return '';   // en la sala de otro no te saltas el anterior
    jugador.calabozos[id] = true; guardar(); const sig = CALABOZOS.find(c => c.id === id + 1);
    return sig ? `<br>🔓 ${sig.icono} ${sig.nombre}` : '';
  }
  // el calabozo se elige arriba (combo): la lista muestra sus salas y "Crear sala" abre una para ese calabozo
  let calSel = 1, difCal = 'normal';
  const i18nPuesto = i => i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
