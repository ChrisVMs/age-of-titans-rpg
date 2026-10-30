  // ---------------- Campañas: etapas de 10 niveles (1-1 ... 1-10) ----------------
  // Cada nivel tiene 4 dificultades. Normal del nivel siguiente se abre al superar Normal del anterior;
  // cada dificultad de un nivel se abre al superar la anterior de ese mismo nivel.
  // Los enemigos usan la hoja de la parca recoloreada (sprites propios pendientes).
  // jefe: true -> hoja sin pies, doble de tamaño y flotando. 'avance' = cuánto se acerca al atacar.
  // botin: materiales por enemigo (piedras [min, max], prob. de polvo, cofre del que salen los drops); el jefe da el triple.
  const DIFICULTADES = { normal: 'Normal', dificil: 'Difícil', pesadilla: 'Pesadilla', infierno: 'Infierno' };
  const ORDEN_DIF = Object.keys(DIFICULTADES);
  // multiplicadores de cada dificultad sobre la base del nivel
  const MOD_DIF = {
    // dano: calibrado para que, con el equipo propio de esa dificultad, un golpe normal quite ~5-8 % de la vida
    // oro: crece más despacio que el resto del premio · drop: multiplica la prob. de soltar equipo
    normal:    { vida: 1,   dano: 1,   armadura: 0,  estados: .7,  premio: 1, oro: 1,   drop: 1 },
    dificil:   { vida: 1.8, dano: 2.3, armadura: 10, estados: .85, premio: 2, oro: 1.5, drop: 1.25 },
    pesadilla: { vida: 3.2, dano: 3.2, armadura: 30, estados: 1,   premio: 4, oro: 2.2, drop: 1.5 },
    infierno:  { vida: 6,   dano: 7.2, armadura: 60, estados: 1.3, premio: 8, oro: 3.2, drop: 2 },
  };
  // Etapas altas: dificultades más juntas (mismo premio). En ese tramo el jugador ya no mejora tanto el equipo: con la
  // escalera de la Etapa 1 (×6 de vida en Infierno) la Difícil era un muro.
  const MOD_DIF_ALTO = {
    normal: MOD_DIF.normal,
    dificil:   { ...MOD_DIF.dificil,   vida: 1.35, dano: 1.45 },
    pesadilla: { ...MOD_DIF.pesadilla, vida: 1.8,  dano: 2 },
    infierno:  { ...MOD_DIF.infierno,  vida: 2.4,  dano: 2.8 },
  };
  // tipos de enemigo: multiplicadores sobre la base del nivel y estados que aplican
  const TIPOS_ENEMIGO = {
    parca:     { nombre: 'Parca',             vida: 1,    dano: 1,    filtro: '' },
    sombria:   { nombre: 'Parca sombría',     vida: 1.15, dano: 1.1,  filtro: 'brightness(.55) contrast(1.2)' },
    carmesi:   { nombre: 'Parca carmesí',     vida: 1.25, dano: 1.15, filtro: 'sepia(1) saturate(4) hue-rotate(-40deg) brightness(.85)',
                 aplica: [{ estado: 'sangrado', prob: .25, turnos: 3, pct: .03 }] },
    maldita:   { nombre: 'Parca maldita',     vida: 1.3,  dano: 1.2,  armadura: 10, filtro: 'grayscale(1) brightness(.4) contrast(1.6)',
                 aplica: [{ estado: 'sangrado', prob: .3, turnos: 3, pct: .03 }] },
    pantano:   { nombre: 'Parca del pantano', vida: 1.1,  dano: 1,    armadura: 10, filtro: 'sepia(1) saturate(5) hue-rotate(50deg) brightness(.8)',
                 aplica: [{ estado: 'veneno', prob: .35, turnos: 3, pct: .025 }] },
    escarcha:  { nombre: 'Parca de escarcha', vida: 1.2,  dano: 1,    armadura: 15, filtro: 'sepia(1) saturate(3) hue-rotate(160deg) brightness(1.15)',
                 aplica: [{ estado: 'congelacion', prob: .18, turnos: 1 }] },
    ignea:     { nombre: 'Parca ígnea',       vida: 1.2,  dano: 1.1,  armadura: 15, filtro: 'sepia(1) saturate(6) hue-rotate(-20deg)',
                 aplica: [{ estado: 'quemadura', prob: .3, turnos: 2, pct: .04 }] },
    brasas:    { nombre: 'Parca de brasas',   vida: 1.3,  dano: 1.15, armadura: 20, filtro: 'sepia(1) saturate(7) hue-rotate(-25deg) brightness(.9)',
                 aplica: [{ estado: 'quemadura', prob: .35, turnos: 2, pct: .04 }] },
    ancestral: { nombre: 'Parca Ancestral',   vida: 3.5,  dano: 1.6,  armadura: 30, jefe: true, avance: 170,
                 filtro: 'brightness(.7) sepia(.4) hue-rotate(220deg) saturate(1.6)', aplica: [{ estado: 'sangrado', prob: .3, turnos: 3, pct: .03 }] },
    bruja:     { nombre: 'Bruja del pantano', vida: 3.8,  dano: 1.6,  armadura: 50, jefe: true, avance: 170,
                 filtro: 'sepia(1) saturate(4) hue-rotate(70deg) brightness(.7)',
                 aplica: [{ estado: 'veneno', prob: .4, turnos: 3, pct: .03 }, { estado: 'congelacion', prob: .12, turnos: 1 }] },
    // Etapa 2: las ruinas del reino caído (sprites propios pendientes: hoja de la parca con otro color)
    esqueleto: { nombre: 'Esqueleto guerrero', vida: 1.1,  dano: 1.1,  armadura: 15, filtro: 'grayscale(1) brightness(1.45) contrast(1.1)' },
    caballero: { nombre: 'Caballero espectral', vida: 1.2, dano: 1.05, armadura: 45, filtro: 'grayscale(.6) sepia(.3) hue-rotate(170deg) brightness(1.2) saturate(1.6)',
                 aplica: [{ estado: 'aturdimiento', prob: .08, turnos: 1 }] },
    gargola:   { nombre: 'Gárgola',            vida: 1.5,  dano: .95,  armadura: 30, filtro: 'grayscale(1) brightness(.75) contrast(1.3)' },
    campeon:   { nombre: 'Campeón caído',      vida: 3.6,  dano: 1.6,  armadura: 60, jefe: true, avance: 170, filtro: 'grayscale(.5) sepia(.6) hue-rotate(-15deg) brightness(.9) contrast(1.3)',
                 aplica: [{ estado: 'sangrado', prob: .3, turnos: 3, pct: .03 }, { estado: 'aturdimiento', prob: .1, turnos: 1 }] },
    liche:     { nombre: 'Rey Liche',          vida: 4,    dano: 1.7,  armadura: 60, jefe: true, avance: 170, filtro: 'sepia(1) saturate(3) hue-rotate(150deg) brightness(1.1)',
                 aplica: [{ estado: 'congelacion', prob: .15, turnos: 1 }, { estado: 'veneno', prob: .35, turnos: 3, pct: .03 }] },
    // Etapa 3: el Abismo (sprites propios pendientes)
    diablillo: { nombre: 'Diablillo',          vida: 1,    dano: 1.2,  armadura: 15, filtro: 'sepia(1) saturate(8) hue-rotate(-30deg) brightness(1.05)',
                 aplica: [{ estado: 'quemadura', prob: .35, turnos: 2, pct: .04 }] },
    demonio:   { nombre: 'Demonio',            vida: 1.4,  dano: 1.35, armadura: 35, filtro: 'sepia(1) saturate(6) hue-rotate(-50deg) brightness(.6) contrast(1.4)',
                 aplica: [{ estado: 'quemadura', prob: .3, turnos: 2, pct: .05 }] },
    sucubo:    { nombre: 'Súcubo',             vida: 1.15, dano: 1.15, armadura: 20, filtro: 'sepia(1) saturate(5) hue-rotate(270deg) brightness(.85)',
                 aplica: [{ estado: 'sangrado', prob: .35, turnos: 3, pct: .035 }] },
    verdugo:   { nombre: 'Verdugo infernal',   vida: 3.8,  dano: 1.8,  armadura: 70, jefe: true, avance: 170, filtro: 'sepia(1) saturate(7) hue-rotate(-40deg) brightness(.55) contrast(1.5)',
                 aplica: [{ estado: 'quemadura', prob: .35, turnos: 2, pct: .05 }, { estado: 'sangrado', prob: .3, turnos: 3, pct: .035 }] },
    senor:     { nombre: 'Señor del Abismo',   vida: 4.4,  dano: 1.9,  armadura: 80, jefe: true, avance: 170, filtro: 'sepia(1) saturate(9) hue-rotate(-45deg) brightness(.45) contrast(1.6)',
                 aplica: [{ estado: 'quemadura', prob: .4, turnos: 3, pct: .05 }, { estado: 'aturdimiento', prob: .1, turnos: 1 }] },
  };
  // Etapas: cada nivel = [nombre, enemigos en orden]; fondo: imagen de la batalla (sin ella, el fondo por defecto)
  const ETAPAS = [
    { id: 1, nombre: 'Etapa 1: El cementerio maldito', fondo: 'img/fondos/etapa1.jpg', niveles: [
      ['Puertas del cementerio',  ['parca', 'parca', 'sombria']],
      ['Tumbas olvidadas',        ['parca', 'sombria', 'sombria']],
      ['Cripta sombría',          ['sombria', 'carmesi', 'sombria']],
      ['Osario sangriento',       ['carmesi', 'maldita', 'carmesi']],
      ['Mausoleo ancestral',      ['maldita', 'carmesi', 'ancestral']],
      ['Ciénaga podrida',         ['pantano', 'pantano', 'maldita']],
      ['Lago helado',             ['escarcha', 'pantano', 'escarcha']],
      ['Pantano en llamas',       ['ignea', 'brasas', 'ignea']],
      ['Bosque de los ahorcados', ['escarcha', 'ignea', 'pantano']],
      ['Guarida de la bruja',     ['pantano', 'escarcha', 'ignea', 'bruja']],
    ] },
    { id: 2, nombre: 'Etapa 2: Las ruinas del reino caído', arte: false, niveles: [
      ['Puerta derruida',         ['esqueleto', 'esqueleto', 'gargola']],
      ['Patio de armas',          ['esqueleto', 'caballero', 'esqueleto']],
      ['Capilla profanada',       ['caballero', 'esqueleto', 'gargola']],
      ['Murallas rotas',          ['gargola', 'gargola', 'caballero']],
      ['Salón de los caídos',     ['caballero', 'esqueleto', 'campeon']],
      ['Biblioteca maldita',      ['esqueleto', 'gargola', 'esqueleto']],
      ['Criptas reales',          ['caballero', 'caballero', 'gargola']],
      ['Torre del vigía',         ['gargola', 'caballero', 'gargola']],
      ['Puente de los reyes',     ['caballero', 'gargola', 'caballero']],
      ['Trono del Rey Liche',     ['esqueleto', 'caballero', 'gargola', 'liche']],
    ] },
    { id: 3, nombre: 'Etapa 3: El Abismo', arte: false, niveles: [
      ['Grieta humeante',         ['diablillo', 'diablillo', 'sucubo']],
      ['Ríos de lava',            ['diablillo', 'demonio', 'diablillo']],
      ['Jardín de ceniza',        ['sucubo', 'diablillo', 'sucubo']],
      ['Forja de almas',          ['demonio', 'diablillo', 'demonio']],
      ['Cadalso del verdugo',     ['sucubo', 'demonio', 'verdugo']],
      ['Templo de los pactos',    ['sucubo', 'sucubo', 'diablillo']],
      ['Llanura de huesos',       ['demonio', 'sucubo', 'demonio']],
      ['Muralla de fuego',        ['demonio', 'demonio', 'diablillo']],
      ['Puertas del Abismo',      ['sucubo', 'demonio', 'sucubo']],
      ['Corazón del Abismo',      ['diablillo', 'demonio', 'sucubo', 'senor']],
    ] },
  ];
  // arte: false = sus enemigos aún no tienen sprite propio. En el juego publicado sale "Próximamente"; en modo pruebas se
  // juega con la hoja de la parca recoloreada (y el simulador la recorre).
  const etapaDisponible = e => !!e.niveles && (e.arte !== false || MODO_PRUEBAS);
  // Escalado de cada etapa: dificultad a la que empieza (n equivalente de la Etapa 1) y cuánto sube por nivel. La Etapa 1
  // sube +23 % por nivel; en las siguientes el jugador apenas crece en poder, así que suben más despacio.
  let ESCALA_ETAPA = { 1: { desde: 1, paso: 1 }, 2: { desde: 15, paso: .55 }, 3: { desde: 19, paso: .4 } };
  // Premio propio de las etapas altas: Esencia (aura) y, en el último jefe, equipo Ancestral
  const ESENCIA_ETAPA = { 2: 2, 3: 3 };   // por batalla ganada en Normal; las demás dificultades, × su premio
  // n = dificultad del nivel (en la Etapa 1, su número: 1-1 = 1 ... 1-10 = 10; las etapas altas usan ESCALA_ETAPA): la base
  // crece ~23 % de vida y de daño por cada punto de n
  // Daño base 3-5: estos enemigos luchan siempre en grupo (todos golpean en la misma ronda), así que pegan la mitad que
  // un enemigo en solitario. Lo que dicen sus datos es lo que pegan: el combate no aplica ningún multiplicador aparte.
  // El cofre de los drops depende del nivel (no de la dificultad): farmear 1-1 en Infierno no da cofres dorados.
  const cofreDeNivel = n => n <= 3 ? 'madera' : n <= 7 ? 'hierro' : n <= 10 ? 'dorado' : 'mitico';
  function crearDificultad(n, d, tipos, mods = MOD_DIF) {
    const m = mods[d], vidaBase = 45 * 1.23 ** (n - 1), danoBase = 1.23 ** (n - 1), k = m.premio, g = 1.25 ** (n - 1);
    const enemigos = tipos.map(t => {
      const T = TIPOS_ENEMIGO[t], vida = Math.round(vidaBase * T.vida * m.vida);
      return { nombre: T.nombre, jefe: T.jefe, avance: T.avance, filtro: T.filtro, vida, armadura: (T.armadura || 0) + m.armadura,
        nEq: n + Math.log(m.vida * m.dano) / (2 * Math.log(1.23)),   // nivel de contenido (con la dificultad): fija el daño de sus estados
        dano: [Math.round(3 * danoBase * T.dano * m.dano), Math.round(5 * danoBase * T.dano * m.dano)],
        oro: Math.round(vidaBase * T.vida * .4 * m.oro), xp: Math.round(vida * .33),
        aplica: (T.aplica || []).map(a => ({ ...a, prob: Math.min(.6, a.prob * m.estados) })) };
    });
    return { premio: { oro: Math.round(60 * g * m.oro), xp: Math.round(40 * g * k), piedra: Math.round((3 + n) * k), polvo: Math.round((1 + n / 3) * k) },
      botin: { piedra: [Math.round((1 + n / 4) * Math.sqrt(k)), Math.round((2 + n / 3) * Math.sqrt(k))],
               polvo: Math.min(.9, (.2 + .03 * n) * (1 + (k - 1) / 6)), cofre: cofreDeNivel(n), drop: m.drop }, enemigos };
  }
  // Lista plana de niveles: { id: '1-3', etapa, nombre, jefe, dificultades }
  // (armarCampanas rehace la lista: el simulador la usa para probar otros ESCALA_ETAPA)
  const CAMPANAS = [];
  function armarCampanas() { cacheEnemigos = {}; CAMPANAS.splice(0, Infinity, ...ETAPAS.filter(etapaDisponible).flatMap(e => e.niveles.map(([nombre, tipos], i) => {
    const E = ESCALA_ETAPA[e.id], n = E.desde + i * E.paso;   // n equivalente de la Etapa 1 (decimal en las etapas altas)
    const dificultades = Object.fromEntries(ORDEN_DIF.map(d => [d, crearDificultad(n, d, tipos, e.id > 1 ? MOD_DIF_ALTO : MOD_DIF)]));
    if (ESENCIA_ETAPA[e.id]) for (const d of ORDEN_DIF) dificultades[d].premio.esencia = Math.round(ESENCIA_ETAPA[e.id] * MOD_DIF[d].premio);
    return { id: `${e.id}-${i + 1}`, etapa: e.id, n, mods: e.id > 1 ? MOD_DIF_ALTO : MOD_DIF, nombre: `${e.id}-${i + 1} ${nombre}`, jefe: tipos.some(t => TIPOS_ENEMIGO[t].jefe),
             ancestral: e.id === 3 && i === 9, dificultades };
  }))); }
  armarCampanas();
  // Poder demostrado: el n equivalente más alto que has superado, contando la dificultad (cada nivel de campaña es ~+23 %
  // de vida y de daño, así que una dificultad que multiplica vida×daño por k vale log(k) / log(1,23²) niveles).
  const nDificultad = (c, d) => c.n + Math.log(c.mods[d].vida * c.mods[d].dano) / (2 * Math.log(1.23));
  const nPoderCampana = () => Math.max(1, ...CAMPANAS.flatMap(c => ORDEN_DIF.filter(d => superada(c.id, d)).map(d => nDificultad(c, d))));
  // Partidas del sistema anterior (claves '1:normal', '2:dificil'...): ese progreso ya no corresponde a ningún nivel
  if (jugador.superadas) for (const k of Object.keys(jugador.superadas)) if (!/^\d+-\d+:/.test(k)) delete jugador.superadas[k];
  const superada = (id, d) => !!(jugador.superadas || {})[`${id}:${d}`];
  function desbloqueada(c, d) {
    const i = ORDEN_DIF.indexOf(d);
    if (i > 0) return superada(c.id, ORDEN_DIF[i - 1]);
    const k = CAMPANAS.indexOf(c); return k === 0 || superada(CAMPANAS[k - 1].id, 'normal');
  }
  function razonBloqueo(c, d) {
    const i = ORDEN_DIF.indexOf(d);
    return i > 0 ? `Supera ${DIFICULTADES[ORDEN_DIF[i - 1]]}` : `Supera ${CAMPANAS[CAMPANAS.indexOf(c) - 1].id}`;
  }
  // Auto (barrido): en un nivel ya superado en esa dificultad, cobra sus recompensas sin pelear gastando la misma estamina
  // (la experiencia, a la mitad: XP_BARRIDO).
  // Da lo mismo que ganar la batalla: premio, oro/XP y botín de cada enemigo (con eventos y efectos), misiones y maestría.
  let XP_BARRIDO = .18;   // parte de la XP de la batalla que da el barrido (let: lo ajusta el simulador). Con .5, el barrido de las
  // etapas altas daba ~10 M de XP en 60 días y el Nv 80 llegaba hacia el día 40
  let ESENCIA_BARRIDO = .04;   // y de la Esencia (los decimales se guardan para el siguiente): con la entera se llenaban el aura y el despertar en un mes
  function barrido(c, d) {
    revisarEstamina();
    if (!superada(c.id, d)) return;
    if (jugador.estamina < ESTAMINA_CAMPANA) return ui.avisar('Sin estamina: vuelve mañana');
    jugador.estamina -= ESTAMINA_CAMPANA; contarMision('estamina', ESTAMINA_CAMPANA); contarMision('victoria');
    const dif = c.dificultades[d], b = dif.botin, ev = eventoHoy() || {}, dropEv = ev.drop || 1, g = { ...dif.premio, almas: 0 }, objetos = [];
    for (const k of ['oro', 'xp', 'piedra', 'polvo']) g[k] = g[k] || 0;
    for (const e of dif.enemigos) {
      const x = e.jefe ? 3 : 1;
      sumarLogro('enemigos'); contarMision('enemigos'); (jugador.bestiario ||= {})[e.nombre] = (jugador.bestiario[e.nombre] || 0) + 1; sumarMaestria(e.jefe ? 5 : 1);
      g.oro += e.oro; g.xp += e.xp; g.piedra += azar(...b.piedra) * x; g.polvo += (rnd() < b.polvo * (1 + efecto('fortuna')) * dropEv ? 1 : 0) * x;
      if (b.cofre && rnd() < (e.jefe ? .3 : .06) * (b.drop || 1) * (1 + efecto('fortuna')) * dropEv)
        objetos.push(objetoAzar(COFRES.find(k => k.id === b.cofre).probs, efecto('fortuna') / 3 + (ev.caza || 0)));
    }
    g.oro = Math.round(g.oro * (1 + efecto('oro')) * (ev.oro || 1)); g.xp = Math.round(g.xp * XP_BARRIDO * (ev.xp || 1) * (1 + efecto('experiencia')));
    g.piedra = Math.round(g.piedra * (ev.mat || 1)); g.polvo = Math.round(g.polvo * (ev.mat || 1));
    jugador.objetos.push(...objetos);
    const es = (g.esencia || 0) * ESENCIA_BARRIDO + (jugador.restoEsencia || 0); jugador.restoEsencia = es % 1;
    ganar(g.oro, g.xp, { piedra: g.piedra, polvo: g.polvo, esencia: Math.floor(es) });
    ui.avisar(`⚡ ${c.id} ${DIFICULTADES[d]}: ● ${g.oro} · ${g.xp} XP · 🔷 ${g.piedra}${g.polvo ? ' · ✨ ' + g.polvo : ''}${objetos.length ? ' · 🎁 ' + objetos.map(o => modelo[o.modelo].nombre).join(', ') : ''}`);
    ui.pintarCampanas();
  }
  // fondo de la batalla: el de la etapa de esa campaña (las demás batallas, el de siempre)
  const fondoBatalla = c => { const e = c.idCampana && ETAPAS.find(x => x.id === +c.idCampana.split('-')[0]); return (e && e.fondo) || null; };
  function batallaCampana(c, d) { return { nombre: `${c.nombre} · ${DIFICULTADES[d]}`, idCampana: c.id, dif: d, ancestral: c.ancestral, ...c.dificultades[d] }; }
  // Señor del Abismo (3-10): pieza Ancestral segura la primera vez en cada dificultad; luego, con esta probabilidad (no en el Auto)
  const PROB_ANCESTRAL = { normal: .1, dificil: .15, pesadilla: .25, infierno: .4 };
