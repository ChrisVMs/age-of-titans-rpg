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
  };
  // Etapas: cada nivel = [nombre, enemigos en orden]
  const ETAPAS = [
    { id: 1, nombre: 'Etapa 1: El cementerio maldito', niveles: [
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
    { id: 2, nombre: 'Etapa 2', bloqueada: true },
    { id: 3, nombre: 'Etapa 3', bloqueada: true },
  ];
  // n = número de nivel en toda la campaña (1-1 = 1, 2-1 = 11...): la base crece ~23 % de vida y de daño por nivel
  // Daño base 3-5: estos enemigos luchan siempre en grupo (todos golpean en la misma ronda), así que pegan la mitad que
  // un enemigo en solitario. Lo que dicen sus datos es lo que pegan: el combate no aplica ningún multiplicador aparte.
  // El cofre de los drops depende del nivel (no de la dificultad): farmear 1-1 en Infierno no da cofres dorados.
  const cofreDeNivel = n => n <= 3 ? 'madera' : n <= 7 ? 'hierro' : n <= 10 ? 'dorado' : 'mitico';
  function crearDificultad(n, d, tipos) {
    const m = MOD_DIF[d], vidaBase = 45 * 1.23 ** (n - 1), danoBase = 1.23 ** (n - 1), k = m.premio, g = 1.25 ** (n - 1);
    const enemigos = tipos.map(t => {
      const T = TIPOS_ENEMIGO[t], vida = Math.round(vidaBase * T.vida * m.vida);
      return { nombre: T.nombre, jefe: T.jefe, avance: T.avance, filtro: T.filtro, vida, armadura: (T.armadura || 0) + m.armadura,
        dano: [Math.round(3 * danoBase * T.dano * m.dano), Math.round(5 * danoBase * T.dano * m.dano)],
        oro: Math.round(vidaBase * T.vida * .4 * m.oro), xp: Math.round(vida * .33),
        aplica: (T.aplica || []).map(a => ({ ...a, prob: Math.min(.6, a.prob * m.estados) })) };
    });
    return { premio: { oro: Math.round(60 * g * m.oro), xp: Math.round(40 * g * k), piedra: Math.round((3 + n) * k), polvo: Math.round((1 + n / 3) * k) },
      botin: { piedra: [Math.round((1 + n / 4) * Math.sqrt(k)), Math.round((2 + n / 3) * Math.sqrt(k))],
               polvo: Math.min(.9, (.2 + .03 * n) * (1 + (k - 1) / 6)), cofre: cofreDeNivel(n), drop: m.drop }, enemigos };
  }
  // Lista plana de niveles: { id: '1-3', etapa, nombre, jefe, dificultades }
  const CAMPANAS = ETAPAS.filter(e => e.niveles).flatMap(e => e.niveles.map(([nombre, tipos], i) => {
    const n = (e.id - 1) * 10 + i + 1;
    return { id: `${e.id}-${i + 1}`, etapa: e.id, nombre: `${e.id}-${i + 1} ${nombre}`, jefe: tipos.some(t => TIPOS_ENEMIGO[t].jefe),
             dificultades: Object.fromEntries(ORDEN_DIF.map(d => [d, crearDificultad(n, d, tipos)])) };
  }));
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
  let XP_BARRIDO = .5;   // parte de la XP de la batalla que da el barrido: la mitad, para que pelear valga más que repetir (let: lo ajusta el simulador)
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
    ganar(g.oro, g.xp, { piedra: g.piedra, polvo: g.polvo });
    ui.avisar(`⚡ ${c.id} ${DIFICULTADES[d]}: ● ${g.oro} · ${g.xp} XP · 🔷 ${g.piedra}${g.polvo ? ' · ✨ ' + g.polvo : ''}${objetos.length ? ' · 🎁 ' + objetos.map(o => modelo[o.modelo].nombre).join(', ') : ''}`);
    ui.pintarCampanas();
  }
  function batallaCampana(c, d) { return { nombre: `${c.nombre} · ${DIFICULTADES[d]}`, idCampana: c.id, dif: d, ...c.dificultades[d] }; }
