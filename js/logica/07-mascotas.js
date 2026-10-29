  // ---------------- Mascotas ----------------
  // Cada mascota da un bono pasivo (% sobre tus estadísticas) y una acción en batalla cada N turnos.
  // Se compra una vez con oro y se mejora hasta el nivel 10; solo una acompaña al guerrero.
  // Categorías de mascota, de la más común a la más rara. El precio sale de la categoría.
  const CAT_MASCOTA = {
    verde:   { nombre: 'Común',      color: '#4fd16a', precio: 1000 },
    azul:    { nombre: 'Rara',       color: '#4aa3ff', precio: 2500 },
    morado:  { nombre: 'Épica',      color: '#b45cff', precio: 5000 },
    naranja: { nombre: 'Legendaria', color: '#ff9f1a', precio: 9000 },
    rojo:    { nombre: 'Mítica',     color: '#ff3b3b', precio: 15000 },
  };
  // Cada mascota da un bono pasivo y una acción en batalla cada N turnos. Valores [nivel 1, +por nivel] (nivel máx. 10).
  //   bono: % a atributos base · ef: % a efectos (crítico, robo, reducción...) · accion: golpe (% de tu ataque) o cura (% de tu vida)
  //   accion.aplica: además del golpe, prob. de aplicar un estado (daño por turno = % de tu ataque)
  // Presupuesto aproximado por categoría (nivel 1): verde ~10 %, azul ~15 %, morado ~21 %, naranja ~28 %, rojo ~36 % en bonos,
  // y acciones más fuertes o más frecuentes. Sin hoja de sprites se dibuja el emoji.
  const MASCOTAS = [
    { id: 'rata', cat: 'verde', nombre: 'Rata de cripta', cara: '🐀', bono: { ataque: [4, 1] },
      accion: { tipo: 'golpe', turnos: 3, mult: 2.5 }, desc: 'Mordisquea al enemigo' },
    { id: 'sapo', cat: 'verde', nombre: 'Sapo del pantano', cara: '🐸', bono: { vida: [5, 1.5] },
      accion: { tipo: 'golpe', turnos: 3, mult: 1.5, aplica: { estado: 'veneno', prob: .4, turnos: 3, mult: 1.0 } }, desc: 'Escupe veneno' },
    { id: 'buho', cat: 'verde', nombre: 'Búho nocturno', cara: '🦉', bono: { defensa: [5, 1.5] },
      accion: { tipo: 'cura', turnos: 4, mult: 1.5 }, desc: 'Te cura' },

    { id: 'lobo', cat: 'azul', nombre: 'Lobo sombrío', cara: '🐺', bono: { ataque: [8, 2] },
      accion: { tipo: 'golpe', turnos: 3, mult: 3.08 }, desc: 'Muerde al enemigo' },
    { id: 'tortuga', cat: 'azul', nombre: 'Tortuga de piedra', cara: '🐢', bono: { armadura: [10, 2.5], vida: [5, 1] }, ef: { reduccion: [2, .4] },
      accion: { tipo: 'cura', turnos: 4, mult: 1.54 }, desc: 'Te protege y cura' },
    { id: 'murcielago', cat: 'azul', nombre: 'Murciélago vampiro', cara: '🦇', bono: { ataque: [5, 1.5] }, ef: { robo: [2, .4] },
      accion: { tipo: 'golpe', turnos: 3, mult: 2.31, aplica: { estado: 'sangrado', prob: .3, turnos: 3, mult: 1.15 } }, desc: 'Muerde y desangra' },

    { id: 'fenix', cat: 'morado', nombre: 'Fénix', cara: '🦅', hoja: { img: 'img/mascotas/fenix.png', ancho: 272, alto: 232, total: 26, ms: 59 },
      bono: { vida: [10, 3] },   // hoja: 26 cuadros del vídeo (sin repetidos, bucle sin salto)
      accion: { tipo: 'cura', turnos: 4, mult: 1.88 }, desc: 'Te cura' },
    { id: 'pantera', cat: 'morado', nombre: 'Pantera sombría', cara: '🐆', bono: { ataque: [8, 2] }, ef: { critico: [3, .5] },
      accion: { tipo: 'golpe', turnos: 3, mult: 2.81 }, desc: 'Zarpazo' },
    { id: 'golem', cat: 'morado', nombre: 'Gólem de hielo', cara: '🗿', bono: { defensa: [8, 2], armadura: [8, 2] },
      accion: { tipo: 'golpe', turnos: 4, mult: 1.88, aplica: { estado: 'congelacion', prob: .35, turnos: 1 } }, desc: 'Golpe helado' },

    { id: 'dragon', cat: 'naranja', nombre: 'Dragón joven', cara: '🐉', bono: { ataque: [7, 1.8], vida: [7, 1.8] },
      accion: { tipo: 'golpe', turnos: 2, mult: 1.5, aplica: { estado: 'quemadura', prob: .3, turnos: 2, mult: 1.0 } }, desc: 'Escupe fuego al enemigo' },
    { id: 'grifo', cat: 'naranja', nombre: 'Grifo real', cara: '🦁', bono: { ataque: [8, 2], vida: [8, 2] }, ef: { jefes: [5, 1] },
      accion: { tipo: 'golpe', turnos: 3, mult: 2.5 }, desc: 'Embestida en picado' },
    { id: 'unicornio', cat: 'naranja', nombre: 'Unicornio celeste', cara: '🦄', bono: { vida: [12, 3] }, ef: { resistencia: [5, 1] },
      accion: { tipo: 'cura', turnos: 3, mult: 2.0 }, desc: 'Te cura con su cuerno' },

    { id: 'hidra', cat: 'rojo', nombre: 'Hidra de tres cabezas', cara: '🐍', bono: { ataque: [12, 3], vida: [8, 2] },
      accion: { tipo: 'golpe', turnos: 2, mult: 1.67, aplica: { estado: 'veneno', prob: .5, turnos: 3, mult: 0.62 } }, desc: 'Muerde con sus tres cabezas' },
    { id: 'leviatan', cat: 'rojo', nombre: 'Leviatán abisal', cara: '🐋', bono: { vida: [15, 3.5], armadura: [10, 2.5] }, ef: { reduccion: [5, 1] },
      accion: { tipo: 'cura', turnos: 3, mult: 1.67 }, desc: 'Te envuelve en agua sanadora' },
    { id: 'can', cat: 'rojo', nombre: 'Can infernal', cara: '🐕', bono: { ataque: [12, 3] }, ef: { critico: [4, .6], danoCritico: [10, 2] },
      accion: { tipo: 'golpe', turnos: 2, mult: 2.29, aplica: { estado: 'quemadura', prob: .4, turnos: 2, mult: 1.04 } }, desc: 'Muerde con llamas' },
  ].map(m => ({ ...m, precio: CAT_MASCOTA[m.cat].precio }));
  const MASCOTA_MAX = 10;
  // Fuerza de la mascota: un % de tus estadísticas según su calidad y su nivel ([base, +por nivel]); el despertar la sube.
  // Su golpe es su ataque × accion.mult; su cura, su ataque × accion.mult (antes: % de tu ataque o de la vida máxima).
  // Los mult se eligieron para que a nivel 1 golpeen y curen lo mismo que antes.
  const STAT_MASCOTA = { verde: [10, 1.1], azul: [13, 1.45], morado: [16, 1.8], naranja: [20, 2.2], rojo: [24, 2.7] };   // a nivel 10, el doble que a nivel 1 (como antes)
  const pctStatsMascota = (m, n = nivelMascota(m)) => valorNivel(STAT_MASCOTA[m.cat], n) * multDespertar('mascota', m.id);
  const ataqueMascota = (m, ataque, n = nivelMascota(m)) => ataque * pctStatsMascota(m, n) / 100;
  const valorNivel = ([base, porNivel], n) => Math.round((base + porNivel * (n - 1)) * 10) / 10;   // [base, +por nivel]
  const costeMejora = (m, n) => Math.round(m.precio * .5 * n);
  // sprite animado (bucle de vuelo) o emoji si la mascota aún no tiene hoja
  function dibujoMascota(m, escala) {
    if (!m.hoja) return m.cara;
    const h = m.hoja;
    return `<div class="sprite-mascota" data-seq="${(h.secuencia || [...Array(h.total).keys()]).join(',')}" data-ancho="${h.ancho * escala}" style="width:${h.ancho * escala}px;height:${h.alto * escala}px;background:url(${h.img}) 0 0 / ${h.total * h.ancho * escala}px ${h.alto * escala}px no-repeat"></div>`;
  }
  let pasoMascota = 0;
  const mascotaActual = () => { const id = jugador.mascota; return id && MASCOTAS.find(m => m.id === id); };
  const nivelMascota = m => (jugador.mascotas || {})[m.id] || 0;
  function efectoMascota(esp) { const m = mascotaActual(); return m && m.ef && m.ef[esp] ? valorNivel(m.ef[esp], nivelMascota(m)) * multDespertar('mascota', m.id) / 100 : 0; }
  // textos de bonos y efectos de una mascota a cierto nivel
  const bonosMascota = (m, n, k = multDespertar('mascota', m.id)) => [...Object.entries(m.bono).map(([a, v]) => `+${Math.round(valorNivel(v, n) * k * 10) / 10}% ${ATRIBUTOS[a]}`),
    ...Object.entries(m.ef || {}).map(([a, v]) => `+${Math.round(valorNivel(v, n) * k * 10) / 10}% ${nombreEf(a)}`)];
  // Pantalla de mascotas: rejilla de iconos por categoría (todas a la vista) + ficha de la elegida al lado
  let mascSel = null;
  // comprar solo si no la tienes (antes reiniciaba su nivel a 1); mejorar solo si es tuya (sin dueño el coste era 0)
  function comprarMascota(m) {
    if (nivelMascota(m) > 0 || jugador.oro < m.precio) return false;
    jugador.oro -= m.precio; jugador.mascotas[m.id] = 1; jugador.mascota = jugador.mascota || m.id; return true;
  }
  function mejorarMascota(m) {
    const n = nivelMascota(m); if (!(n > 0 && n < MASCOTA_MAX && jugador.oro >= costeMejora(m, n))) return false;
    jugador.oro -= costeMejora(m, n); jugador.mascotas[m.id] = n + 1; return true;
  }
