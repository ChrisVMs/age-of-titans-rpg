  // ---------------- Títulos ----------------
  // Se desbloquean con logros y quedan para siempre. Solo el título equipado da su bono (en %).
  const RAREZA_TITULO = { comun: '#cfcfcf', raro: '#5cf', epico: '#b48cff', legendario: '#ffb02e', mitico: '#ff4d6d' };
  const logro = k => (jugador.logros || {})[k] || 0;
  const jefeVencido = id => ((jugador.logros || {}).jefes || {})[id] ? 1 : 0;
  const nSuperadas = () => Object.keys(jugador.superadas || {}).length;
  const T = (id, nombre, rareza, desc, prog, bono = {}) => ({ id, nombre, rareza, desc, prog, bono });
  const TITULOS = [
    T('recluta',        'Recluta',             'comun',      'Empieza tu aventura',                () => [1, 1]),
    T('cazador',        'Cazador',             'comun',      'Derrota 100 enemigos',               () => [logro('enemigos'), 100], { ataque: 2 }),
    T('afortunado',     'Afortunado',          'raro',       'Abre 100 cofres',                    () => [logro('cofres'), 100], { armadura: 4 }),
    T('veterano',       'Veterano',            'raro',       'Alcanza el nivel 20',                () => [jugador.nivel, 20], { vida: 4 }),
    T('conquistador',   'Conquistador',        'raro',       'Supera 10 niveles de campaña (cualquier dificultad)', () => [nSuperadas(), 10], { defensa: 4 }),
    T('coleccionista',  'Coleccionista',       'raro',       'Consigue 5 skins',                   () => [Object.keys(jugador.skinsPropias || {}).length, 5], { vida: 3 }),
    T('verdugo',        'Verdugo',             'epico',      'Derrota 1000 enemigos',              () => [logro('enemigos'), 1000], { ataque: 5 }),
    T('domador',        'Domador de Cerbero',  'epico',      'Derrota a Cerbero',                  () => [jefeVencido('cerbero'), 1], { vida: 5 }),
    T('exorcista',      'Exorcista',           'epico',      'Derrota a Asmodeo',                  () => [jefeVencido('asmodeo'), 1], { defensa: 5 }),
    T('matatoros',      'Matatoros',           'epico',      'Derrota al Gran Minotauro',          () => [jefeVencido('minotauro'), 1], { ataque: 5 }),
    T('herrero',        'Maestro herrero',     'epico',      'Encanta un objeto a +15',            () => [Math.max(0, ...jugador.objetos.map(o => o.enc || 0)), 15], { defensa: 3, armadura: 5 }),
    T('pesadilla',      'Pesadilla encarnada', 'legendario', 'Supera un nivel en Pesadilla',       () => [Object.keys(jugador.superadas || {}).some(k => k.endsWith(':pesadilla')) ? 1 : 0, 1], { ataque: 6 }),
    T('infierno',       'Señor del infierno',  'mitico',     'Supera la Etapa 1 completa en Infierno', () => [Object.keys(jugador.superadas || {}).filter(k => /^1-\d+:infierno$/.test(k)).length, 10], { vida: 6, defensa: 6 }),
    T('resplandeciente','Resplandeciente',     'legendario', 'Sube una skin a ★5',                 () => [Math.max(0, ...Object.values(jugador.skinsPropias || {})), 5], { ataque: 4, defensa: 4 }),
    T('leyenda',        'Leyenda viviente',    'legendario', 'Alcanza el nivel 50',                () => [jugador.nivel, 50], { ataque: 5, vida: 5, defensa: 5, armadura: 5 }),
    T('matarreyes',     'Matarreyes',          'mitico',     'Vence a los 3 reyes en Pesadilla o Infierno', () => [logro('reyes1') ? 1 : 0, 1], { ataque: 6, vida: 6 }),
    T('azote',          'Azote de los dioses', 'mitico',     'Derrota a los tres jefes mundiales', () => [jefeVencido('cerbero') + jefeVencido('asmodeo') + jefeVencido('minotauro'), 3], { ataque: 8, vida: 8 }),
    T('senor',          'Señor de la guerra',  'mitico',     'Gasta 40 puntos de habilidad (todos los del nivel 80)', () => [puntosGastados(), Math.floor(NIVEL_MAX / 2)], { ataque: 6, defensa: 6 }),
  ];
  const tituloActual = () => (jugador.titulos || {})[jugador.titulo] ? TITULOS.find(t => t.id === jugador.titulo) : null;
  const textoBono = b => Object.entries(b).map(([a, v]) => `+${v} % ${ATRIBUTOS[a].toLowerCase()}`).join(', ');
  const etiquetaTitulo = t => t ? `<span class="titulo-tag" style="--tc:${RAREZA_TITULO[t.rareza]}">«${t.nombre}»</span>` : '';
  function revisarTitulos(avisos = true) {   // desbloquea los títulos cuyos logros ya se cumplen
    jugador.titulos ||= {};
    for (const t of TITULOS) {
      if (jugador.titulos[t.id]) continue;
      const [a, m] = t.prog();
      if (a >= m) { jugador.titulos[t.id] = true; if (avisos) jugador.tituloNuevo = true; if (avisos) setTimeout(() => avisar(`Nuevo título: «${t.nombre}»`), 900); }
    }
  }
  revisarTitulos(false); titulosListos = true;

  const nombreEf = esp => SECUNDARIOS[esp] || OTROS_EFECTOS[esp];
  const r1 = v => Math.round(v * 10) / 10;
  // texto de bonos: base = % a atributos base, ef = % a efectos
  const textoBonos = (base = {}, ef = {}) => [...Object.entries(base).map(([a, v]) => `+${r1(v)} % ${ATRIBUTOS[a].toLowerCase()}`),
    ...Object.entries(ef).map(([a, v]) => `+${r1(v)} % ${nombreEf(a).toLowerCase()}`)].join(', ');
