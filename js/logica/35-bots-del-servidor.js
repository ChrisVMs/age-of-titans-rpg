  // ---------------- Bots del servidor (perfiles de prueba) ----------------
  // 4 perfiles completos construidos con las piezas reales del juego (equipo, encantamiento, runas, mascota, árbol,
  // reliquias, maestría, título, skin). Su Poder lo calcula la misma función poder() que el tuyo: no hay cifras inventadas.
  // Forman el ranking del servidor; los 3 primeros son los reyes de la Torre de reyes. Se pueden cargar como partida de pruebas.
  const DEF_BOTS = [
    { nombre: 'Kaito',   clase: 'guerrero', nivel: 57, rareza: 'legendaria', enc: 18, est: 4,   // ⚔ 27 054
      extras: { casco: ['vida', 'critico'], armadura: ['defensa', 'reduccion'], espada: ['ataque', 'danoCritico'], capa: ['vida', 'jefes'] },
      runas: ['ataque', 'vida', 'critico', 'defensa'], nivRuna: 6, mascota: 'grifo', nivMasc: 6, titulo: 'veterano', skin: ['obsidiana_oscura', 3],
      reliquias: { colmillo: 2, ceniza: 2, collar: 1 }, maestria: 2300, prioridad: ['furia', 'baluarte', 'tactica'] },
    { nombre: 'Lyra',    clase: 'arquero',  nivel: 56, rareza: 'mitica',     enc: 13, est: 4,   // ⚔ 25 870
      extras: { casco: ['critico', 'vida', 'defensa'], armadura: ['vida', 'esquiva', 'armadura'], espada: ['ataque', 'penetracion', 'critico'], capa: ['danoCritico', 'critico', 'vida'] },
      runas: ['critico', 'danoCritico', 'ataque', 'penetracion'], nivRuna: 7, mascota: 'pantera', nivMasc: 7, titulo: 'cazador', skin: ['cristalino_amaranto', 2],
      reliquias: { cuerno: 2, hacha: 1 }, maestria: 1900, prioridad: ['precision', 'caceria', 'supervivencia'] },
    { nombre: 'Thorin',  clase: 'mago',     nivel: 60, rareza: 'mitica',     enc: 13, est: 3,   // ⚔ 29 294
      extras: { casco: ['habilidad', 'vida', 'resistencia'], armadura: ['vida', 'reduccion', 'armadura'], espada: ['ataque', 'habilidad', 'critico'], capa: ['vida', 'defensa', 'jefes'] },
      runas: ['habilidad', 'ataque', 'vida', 'armadura'], nivRuna: 5, mascota: 'dragon', nivMasc: 5, titulo: 'veterano', skin: ['egida_tormentosa', 2],
      reliquias: { corona: 2, sello: 1, ala: 1 }, maestria: 2600, prioridad: ['fuego', 'arcano', 'hielo'] },
    { nombre: 'Morgana', clase: 'guerrero', nivel: 54, rareza: 'legendaria', enc: 18, est: 4,   // ⚔ 25 273
      extras: { casco: ['defensa', 'vida'], armadura: ['armadura', 'reduccion'], espada: ['ataque', 'critico'], capa: ['vida', 'resistencia'] },
      runas: ['defensa', 'vida', 'armadura', 'reduccion'], nivRuna: 6, mascota: 'tortuga', nivMasc: 9, titulo: 'conquistador', skin: ['guardian_espectral', 3],
      reliquias: { collar: 2, ala: 1 }, maestria: 1700, prioridad: ['baluarte', 'furia', 'tactica'] },
    { nombre: 'Sigrid',  clase: 'arquero',  nivel: 46, rareza: 'legendaria', enc: 15, est: 3,
      extras: { casco: ['critico', 'vida'], armadura: ['vida', 'esquiva'], espada: ['ataque', 'critico'], capa: ['danoCritico', 'vida'] },
      runas: ['critico', 'ataque', 'vida', 'danoCritico'], nivRuna: 5, mascota: 'pantera', nivMasc: 5, titulo: 'cazador', skin: ['cristalino_amaranto', 1],
      reliquias: { cuerno: 1 }, maestria: 1200, prioridad: ['precision', 'caceria', 'supervivencia'] },
    { nombre: 'Elric',   clase: 'mago',     nivel: 44, rareza: 'legendaria', enc: 14, est: 3,
      extras: { casco: ['habilidad', 'vida'], armadura: ['vida', 'armadura'], espada: ['ataque', 'habilidad'], capa: ['vida', 'defensa'] },
      runas: ['habilidad', 'ataque', 'vida', 'defensa'], nivRuna: 5, mascota: 'grifo', nivMasc: 5, titulo: 'veterano', skin: ['egida_tormentosa', 1],
      reliquias: { sello: 1 }, maestria: 1000, prioridad: ['fuego', 'arcano', 'hielo'] },
  ];
  // reparte los puntos del árbol en el orden de ramas indicado, respetando los requisitos de cada nodo
  function arbolAuto(clase, puntos, prioridad) {
    const a = {};
    for (const idRama of prioridad) { const rama = ARBOL[clase].find(r => r.id === idRama);
      rama.nodos.forEach((n, i) => { while (puntos > 0 && (a[n.id] || 0) < n.max && nodoAbierto(rama, i, a)) { a[n.id] = (a[n.id] || 0) + 1; puntos--; } }); }
    return a;
  }
  function construirBot(d, k) {
    const b = { nombre: d.nombre, bot: true, nivel: d.nivel, xp: 0, clase: d.clase, oro: 50000, mat: { piedra: 500, polvo: 200, almas: 60, esencia: 0 },
      estamina: ESTAMINA_MAX, diaEstamina: hoy(), objetos: [], equipado: {} };
    for (const ranura of ['casco', 'armadura', 'espada', 'capa']) {
      const m = MODELOS.find(x => x.ranura === ranura && x.rareza === d.rareza && !x.jefe);
      const o = { uid: 900000 + k * 100 + b.objetos.length, modelo: m.id, enc: d.enc,
                  lineas: [...LINEAS_RANURA[ranura], ...d.extras[ranura]].map(a => ({ a, e: d.est })) };
      b.objetos.push(o); b.equipado[ranura] = o.uid;
    }
    b.runas = d.runas.map((tipo, i) => ({ uid: 950000 + k * 10 + i, tipo, nivel: d.nivRuna })); b.runasPuestas = b.runas.map(r => r.uid);
    b.mascotas = { [d.mascota]: d.nivMasc }; b.mascota = d.mascota;
    b.skinsPropias = { [d.skin[0]]: d.skin[1] }; b.skin = d.skin[0];
    b.reliquias = { ...d.reliquias }; b.maestria = { [d.clase]: d.maestria };
    b.titulos = { [d.titulo]: true }; b.titulo = d.titulo;
    b.arbol = arbolAuto(d.clase, Math.floor(d.nivel / 2), d.prioridad);
    return b;
  }
  let cacheBots = null;
  const bots = () => cacheBots ||= DEF_BOTS.map(construirBot);
  // evalúa cualquier función del juego "como si" el perfil fuera el jugador (estadísticas, efectos, poder)
  function conPerfil(perfil, fn) { const yo = jugador; jugador = perfil; try { return fn(); } finally { jugador = yo; } }
  function rankingServidor() {
    // si estás jugando con un bot, ese bot eres tú (no aparece dos veces ni puede tocarte como rey)
    return [...bots().filter(b => b.nombre !== jugador.nombre).map(b => ({ nombre: b.nombre, clase: b.clase, nivel: b.nivel, poder: conPerfil(b, () => poder()), bot: b })),
            { nombre: `${jugador.nombre} (tú)`, clase: jugador.clase, nivel: jugador.nivel, poder: poder(), yo: true }].sort((x, y) => y.poder - x.poder);
  }
