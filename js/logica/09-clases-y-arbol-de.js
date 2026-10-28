  // ---------------- Clases y árbol de habilidades ----------------
  // Cada clase tiene 3 ramas de 5 nodos. Un punto cada 2 niveles (40 al nivel 80, de 51 posibles). Para abrir el nodo N de una rama
  // hacen falta 3·(N-1) puntos gastados en esa rama y al menos 1 rango en el nodo anterior.
  //   stat: % a estadísticas por rango · ef: % a efectos de combate por rango (se suman a los de la skin)
  //   poder: % de poder por rango para nodos especiales que no son estadísticas ni efectos
  //   habMult: [habilidad, +x por rango] · habRecarga: [habilidad, -turnos por rango] · golpe: estado al golpear (prob. % por rango)
  //   cargaInicial: las habilidades empiezan la batalla cargadas
  // Clases: cada una cambia los atributos base (mod, en %), da un efecto propio (ef) y tiene sus habilidades y su árbol.
  // Se puede cambiar de clase gratis fuera de batalla; los puntos del árbol y la maestría son de cada clase.
  // Arquero y Mago usan por ahora el sprite del guerrero (sprites propios pendientes).
  const CLASES = {
    guerrero: { nombre: 'Guerrero', icono: '⚔️', desc: 'Resistente y equilibrado. Aguanta golpes y remata con fuerza.', mod: {}, ef: {} },
    arquero:  { nombre: 'Arquero',  icono: '🏹', desc: 'Daño alto y críticos; menos vida y defensa. Hace sangrar y envenena.',
                mod: { ataque: 10, vida: -12, defensa: -20 }, ef: { critico: .05, esquiva: .04 } },
    mago:     { nombre: 'Mago',     icono: '🔮', desc: 'Habilidades muy fuertes que queman y congelan; frágil cuerpo a cuerpo.',
                mod: { ataque: 6, vida: -15, armadura: -25 }, ef: { habilidad: .15, resistencia: .05 } },
  };
  const ARBOL = {
    guerrero: [
      { id: 'furia', nombre: 'Furia', icono: '🗡️', nodos: [
        { id: 'fuerza',      nombre: 'Fuerza bruta',      icono: '💪', max: 5, stat: { ataque: 2 }, d: r => `+${2 * r} % de ataque` },
        { id: 'certero',     nombre: 'Golpe certero',     icono: '🎯', max: 5, ef: { critico: 2 }, d: r => `${2 * r} % de prob. de crítico` },
        { id: 'estocada_m',  nombre: 'Estocada feroz',    icono: '⚡', max: 3, poder: 1.5, habMult: ['estocada', .2], d: r => `Estocada hace +${20 * r} % de daño` },
        { id: 'sed',         nombre: 'Sed de sangre',     icono: '🩸', max: 3, ef: { robo: 2 }, d: r => `${2 * r} % de robo de vida` },
        { id: 'aplastante',  nombre: 'Golpe aplastante',  icono: '🔨', max: 1, poder: 4, d: () => 'Nueva habilidad: golpe ×3 que aturde al enemigo 1 turno (recarga 5)' },
      ] },
      { id: 'baluarte', nombre: 'Baluarte', icono: '🛡️', nodos: [
        { id: 'piel',        nombre: 'Piel de hierro',    icono: '❤️', max: 5, stat: { vida: 3 }, d: r => `+${3 * r} % de vida` },
        { id: 'coraza',      nombre: 'Coraza',            icono: '🧱', max: 5, stat: { defensa: 3, armadura: 3 }, d: r => `+${3 * r} % de defensa y armadura` },
        { id: 'represalia',  nombre: 'Represalia',        icono: '↩️', max: 3, ef: { contra: 3 }, d: r => `${3 * r} % de prob. de contraatacar al recibir un golpe` },
        { id: 'aliento',     nombre: 'Segundo aliento',   icono: '🌬️', max: 3, poder: 1, d: r => `Al bajar del 30 % de vida te curas un ${10 * r} % (una vez por batalla)` },
        { id: 'bastion',     nombre: 'Último bastión',    icono: '🏰', max: 1, poder: 3, d: () => 'Sobrevives a un golpe mortal con 1 de vida (una vez por batalla)' },
      ] },
      { id: 'tactica', nombre: 'Táctica', icono: '📜', nodos: [
        { id: 'maestria',    nombre: 'Maestría',          icono: '📖', max: 5, ef: { habilidad: 4 }, d: r => `+${4 * r} % de daño de habilidades` },
        { id: 'reflejos',    nombre: 'Reflejos',          icono: '💨', max: 5, ef: { esquiva: 2 }, d: r => `${2 * r} % de prob. de esquivar ataques normales` },
        { id: 'tajo_veloz',  nombre: 'Tajo veloz',        icono: '🌀', max: 1, poder: 2, habRecarga: ['tajo', 1], d: () => 'Tajo ascendente se recarga 1 turno antes' },
        { id: 'cazador',     nombre: 'Cazador de bestias', icono: '🐲', max: 3, ef: { jefes: 5 }, d: r => `+${5 * r} % de daño contra jefes` },
        { id: 'adrenalina',  nombre: 'Adrenalina',        icono: '🔥', max: 1, poder: 2, cargaInicial: true, d: () => 'Empiezas cada batalla con las habilidades cargadas' },
      ] },
    ],
    arquero: [
      { id: 'precision', nombre: 'Precisión', icono: '🎯', nodos: [
        { id: 'punteria',    nombre: 'Puntería',          icono: '🏹', max: 5, stat: { ataque: 2 }, d: r => `+${2 * r} % de ataque` },
        { id: 'ojo_halcon',  nombre: 'Ojo de halcón',     icono: '🦅', max: 5, ef: { critico: 2 }, d: r => `${2 * r} % de prob. de crítico` },
        { id: 'disparo_m',   nombre: 'Disparo afinado',   icono: '🎯', max: 3, poder: 1.5, habMult: ['disparo', .2], d: r => `Disparo certero hace +${20 * r} % de daño` },
        { id: 'letal',       nombre: 'Punta letal',       icono: '💀', max: 3, ef: { danoCritico: 8 }, d: r => `+${8 * r} % de daño crítico` },
        { id: 'perforante',  nombre: 'Flecha perforante', icono: '🗡️', max: 1, poder: 4, d: () => 'Nueva habilidad: flecha ×3,2 que atraviesa la armadura (recarga 5)' },
      ] },
      { id: 'supervivencia', nombre: 'Supervivencia', icono: '🍃', nodos: [
        { id: 'agilidad',    nombre: 'Agilidad',          icono: '💨', max: 5, ef: { esquiva: 2 }, d: r => `${2 * r} % de prob. de esquivar` },
        { id: 'cuero',       nombre: 'Cuero curtido',     icono: '🧥', max: 5, stat: { vida: 3, defensa: 2 }, d: r => `+${3 * r} % de vida y +${2 * r} % de defensa` },
        { id: 'trampas',     nombre: 'Trampas',           icono: '🪤', max: 3, golpe: { estado: 'sangrado', prob: 5, turnos: 3, pct: .2 }, poder: 1, d: r => `${5 * r} % de hacer sangrar al golpear (3 turnos, 20 % de tu ataque)` },
        { id: 'instinto',    nombre: 'Instinto',          icono: '👁️', max: 3, ef: { reduccion: 3 }, d: r => `-${3 * r} % de daño recibido` },
        { id: 'camuflaje',   nombre: 'Camuflaje',         icono: '🌿', max: 1, ef: { esquiva: 6 }, poder: 1, d: () => '+6 % de prob. de esquivar' },
      ] },
      { id: 'caceria', nombre: 'Cacería', icono: '🐺', nodos: [
        { id: 'rastreo',     nombre: 'Rastreo',           icono: '🐾', max: 5, ef: { jefes: 4 }, d: r => `+${4 * r} % de daño contra jefes` },
        { id: 'flecha_ven',  nombre: 'Flechas venenosas', icono: '☠️', max: 5, golpe: { estado: 'veneno', prob: 4, turnos: 3, pct: .12 }, poder: 1, d: r => `${4 * r} % de envenenar al golpear (acumulable)` },
        { id: 'lluvia_r',    nombre: 'Lluvia rápida',     icono: '🌧️', max: 1, poder: 2, habRecarga: ['lluvia', 1], d: () => 'Lluvia de flechas se recarga 1 turno antes' },
        { id: 'penetrante',  nombre: 'Puntas de acero',   icono: '🔩', max: 3, ef: { penetracion: 5 }, d: r => `+${5 * r} % de penetración` },
        { id: 'marca',       nombre: 'Marca del cazador', icono: '🎖️', max: 1, ef: { remate: 12 }, d: () => '+12 % de daño a enemigos por debajo del 50 % de vida' },
      ] },
    ],
    mago: [
      { id: 'fuego', nombre: 'Fuego', icono: '🔥', nodos: [
        { id: 'poder_arc',   nombre: 'Poder arcano',      icono: '✨', max: 5, stat: { ataque: 2 }, d: r => `+${2 * r} % de ataque` },
        { id: 'ignicion',    nombre: 'Ignición',          icono: '🔥', max: 5, golpe: { estado: 'quemadura', prob: 5, turnos: 2, pct: .25 }, poder: 1, d: r => `${5 * r} % de quemar al golpear (2 turnos, 25 % de tu ataque)` },
        { id: 'bola_m',      nombre: 'Bola mayor',        icono: '☀️', max: 3, poder: 1.5, habMult: ['bola', .25], d: r => `Bola de fuego hace +${25 * r} % de daño` },
        { id: 'combustion',  nombre: 'Combustión',        icono: '💥', max: 3, ef: { critico: 3 }, d: r => `${3 * r} % de prob. de crítico` },
        { id: 'meteoro',     nombre: 'Meteoro',           icono: '☄️', max: 1, poder: 4, d: () => 'Nueva habilidad: meteoro ×4 que quema (recarga 6)' },
      ] },
      { id: 'hielo', nombre: 'Hielo', icono: '❄️', nodos: [
        { id: 'escarcha',    nombre: 'Armadura de escarcha', icono: '🧊', max: 5, stat: { armadura: 5, vida: 2 }, d: r => `+${5 * r} % de armadura y +${2 * r} % de vida` },
        { id: 'piel_hielo',  nombre: 'Piel de hielo',     icono: '🛡️', max: 5, ef: { reduccion: 2 }, d: r => `-${2 * r} % de daño recibido` },
        { id: 'lanza_m',     nombre: 'Lanza afilada',     icono: '❄️', max: 3, poder: 1.5, habMult: ['lanza', .2], d: r => `Lanza de hielo hace +${20 * r} % de daño` },
        { id: 'hielo_et',    nombre: 'Hielo eterno',      icono: '🏔️', max: 3, ef: { resistencia: 5 }, d: r => `+${5 * r} % de resistencia` },
        { id: 'ventisca',    nombre: 'Ventisca',          icono: '🌨️', max: 1, poder: 2, habRecarga: ['lanza', 1], d: () => 'Lanza de hielo se recarga 1 turno antes' },
      ] },
      { id: 'arcano', nombre: 'Arcano', icono: '📘', nodos: [
        { id: 'sabiduria',   nombre: 'Sabiduría',         icono: '📖', max: 5, ef: { habilidad: 4 }, d: r => `+${4 * r} % de daño de habilidades` },
        { id: 'mente',       nombre: 'Mente firme',       icono: '🧠', max: 5, stat: { vida: 3 }, d: r => `+${3 * r} % de vida` },
        { id: 'drenaje',     nombre: 'Drenaje',           icono: '🩸', max: 3, ef: { robo: 2 }, d: r => `${2 * r} % de robo de vida` },
        { id: 'concentra',   nombre: 'Concentración',     icono: '🔮', max: 3, ef: { danoCritico: 8 }, d: r => `+${8 * r} % de daño crítico` },
        { id: 'torrente',    nombre: 'Torrente de maná',  icono: '🌊', max: 1, poder: 2, cargaInicial: true, d: () => 'Empiezas cada batalla con las habilidades cargadas' },
      ] },
    ],
  };
  const costeReinicio = () => Math.max(500, 100 * jugador.nivel);   // crece con el nivel (8 000 al nivel 80)
  jugador.clase ||= 'guerrero'; jugador.arbol ||= {};
  const ramasClase = () => ARBOL[jugador.clase] || [];
  const nodosClase = () => ramasClase().flatMap(r => r.nodos);
  // 'a' = el árbol a consultar: por defecto el guardado (el que cuenta en combate); la pantalla pasa el borrador
  const rango = (id, a = jugador.arbol) => a[id] || 0;
  const rangoClase = id => nodosClase().some(n => n.id === id) ? rango(id) : 0;   // solo cuenta si el nodo es de la clase actual
  const puntosRama = (rama, a = jugador.arbol) => rama.nodos.reduce((s, n) => s + rango(n.id, a), 0);
  const puntosGastados = (a = jugador.arbol) => nodosClase().reduce((s, n) => s + rango(n.id, a), 0);
  // Tope de 45 puntos: el árbol entero cuesta 51, así que incluso con todas las ascensiones hay que elegir qué dejar fuera.
  const PUNTOS_ARBOL_MAX = 45;
  const puntosTotales = () => Math.min(PUNTOS_ARBOL_MAX, Math.floor(jugador.nivel / 2) + (jugador.puntosExtra || 0) + (jugador.ascension || 0) * 2);   // +2 por ascensión
  const puntosLibres = (a = jugador.arbol) => puntosTotales() - puntosGastados(a);
  // partidas del reparto anterior (1 punto por nivel): si gastó más de lo que ahora tiene, se le devuelven
  if (puntosLibres() < 0) { jugador.arbol = {}; jugador.arbolDevuelto = true; }
  function nodoAbierto(rama, i, a = jugador.arbol) {   // requisitos de rama y nodo anterior
    return puntosRama(rama, a) >= 3 * i && (i === 0 || rango(rama.nodos[i - 1].id, a) > 0);
  }
  // Borrador: los + y − se aplican aquí y solo cuentan al pulsar Guardar. El − solo deshace puntos aún sin guardar
  // (lo guardado solo se quita con Reiniciar) y no puede dejar nodos superiores sin sus requisitos.
  let borrador = null;
  const arbolVista = () => borrador || jugador.arbol;
  const puntosSinGuardar = () => borrador ? puntosGastados(borrador) - puntosGastados() : 0;
  function puedeQuitar(rama, i) {
    const id = rama.nodos[i].id;
    if (!borrador || rango(id, borrador) <= rango(id)) return false;
    const prueba = { ...borrador, [id]: borrador[id] - 1 };
    return rama.nodos.every((n, k) => !rango(n.id, prueba) || nodoAbierto(rama, k, prueba));
  }
  function guardarArbol() {
    if (!borrador) return;
    jugador.arbol = Object.fromEntries(Object.entries(borrador).filter(([, v]) => v > 0));
    borrador = null; guardar(); avisar('Árbol guardado');
  }
  function statsArbol() {
    const t = {};
    for (const n of nodosClase()) if (n.stat) for (const [a, v] of Object.entries(n.stat)) t[a] = (t[a] || 0) + v * rango(n.id);
    return t;
  }
  const efectoArbol = esp => nodosClase().reduce((s, n) => s + (n.ef && n.ef[esp] ? n.ef[esp] * rango(n.id) / 100 : 0), 0);
  const poderArbol = () => nodosClase().reduce((s, n) => s + (n.poder || 0) * rango(n.id) / 100, 0);

  let claseVista = jugador.clase, arbolSel = null;
  // texto de lo que da una clase (modificadores y efecto propio)
  const textoClase = id => { const c = CLASES[id];
    return [...Object.entries(c.mod).map(([a, v]) => `${v > 0 ? '+' : ''}${v} % ${ATRIBUTOS[a].toLowerCase()}`),
            ...Object.entries(c.ef).map(([a, v]) => `+${r1(v * 100)} % ${nombreEf(a).toLowerCase()}`)].join(', ') || 'Sin modificadores'; };
