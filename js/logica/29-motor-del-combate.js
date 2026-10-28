  // ---------------- Motor del combate (todos los modos) ----------------
  // Un solo motor para todas las batallas: el 1 contra 1 (arena y jefes mundiales) es un grupo de 1 héroe contra 1 enemigo.
  // Resuelve la ronda entera de una vez, sin tocar la pantalla ni esperar animaciones: cambia el estado de las unidades
  // (vida, estados, cargas) y deja en una lista los eventos que la interfaz reproduce después. Así el resultado de la ronda
  // no depende de lo que tarde la animación, y la misma ronda se puede simular sin dibujar nada.
  //   [tipo, ...datos] → 'vidaU' u, actual, max, retraso · 'fxU' u, clase, texto, dy, retraso · 'curaU' u, cantidad, icono, retraso
  //   'estadosU' u, copia · 'claseU' u, nombre, on · 'animHeroe' u, objetivo, hab · 'animEnemigo' u, objetivo, ataque · 'volver' u
  //   'golpe' atacante, objetivo, hab, crítico, daño, jefe · 'muerteU' u, jefe · 'marcar' u · 'mascota' yo, avanza · 'espera' ms
  //   'estadoAtaque' texto · 'carga' · 'transformar' · 'siguiente' · 'resultado' gano
  let eventos = [];
  const emitir = (...e) => eventos.push(e);
  const verVida = (u, retraso = 0) => emitir('vidaU', u, u.vida, u.vidaMax, retraso);
  const verFx = (u, cls, texto, retraso = 0, dy = 0) => emitir('fxU', u, cls, texto, dy, retraso);
  const verEstados = u => emitir('estadosU', u, JSON.parse(JSON.stringify(u.estados)));   // copia: luego siguen cambiando
  function curar(u, c, icono = '', retraso = 0) { u.vida = Math.min(u.vidaMax, u.vida + c); verVida(u, retraso); emitir('curaU', u, c, icono, retraso); }
  const esJefe = e => !!(e && (e.jefe || e.cerbero || e.asmodeo || e.minotauro));
  const tipoJefe = (e = batalla.enemigo) => ({ cerbero: !!e.cerbero, asmodeo: !!e.asmodeo, minotauro: !!e.minotauro });
  const heroeYo = () => batalla.grupo.heroes.find(h => h.yo);
  const enemigoDuelo = () => batalla.grupo.enemigos[0];   // 1 contra 1: el enemigo que está luchando

  // Lo único que cambia entre el 1 contra 1 (duelo) y el grupo: el ritmo de la animación de cada escena (ms)
  const REGLAS = {
    duelo: { duelo: true, esperas: { estados: 600, control: 700, esquiva: 700, contra: 600, turnoEnemigo: 600, mascotaIda: 220, mascotaVuelta: 450, curaMascota: 600 } },
    grupo: { duelo: false, esperas: { estados: 450, control: 500, esquiva: 250, contra: 300, turnoEnemigo: 250, mascotaIda: 0, mascotaVuelta: 400, curaMascota: 400 } },
  };
  const reglas = () => batalla.reglas || REGLAS.grupo;

  // ---- unidades ----
  // Cada combatiente es una unidad: { lado (0 héroes, 1 enemigos), pos, nombre, vida, vidaMax, st, estados, inmune, ... }.
  // Los jugadores (tú, aliados y reyes) llevan perfil, ef (sus efectos), golpes, s4 (sets), habs y carga; los monstruos, e
  // (sus datos). conEfectos: tiene efectos defensivos propios (esquiva, resistencia, contraataque...): jugadores y rivales de arena.
  // duelo: es del 1 contra 1 (los dos en la casilla del frente), se dibuja en su lado de la escena (slots) en vez de en el rombo.
  // el: el elemento donde se dibuja (lo pone la pantalla).
  function crearUnidad(lado, pos, nombre) {   // motor: datos de la unidad (dibujarUnidad le pone su elemento)
    const [x, y] = pos ? (lado === 0 ? XY_HEROE : XY_ENEMIGO)[pos] : [];
    return { lado, pos, nombre, x, y, estados: {}, inmune: 0 };
  }
  function unidadJugador(m) {   // tú o un aliado: m = { yo, pos, perfil }
    const u = crearUnidad(0, m.pos, m.yo ? `${jugador.nombre} Nv ${jugador.nivel}` : `${m.perfil.nombre} Nv ${m.perfil.nivel}`);
    u.heroe = true; u.yo = !!m.yo; u.perfil = m.perfil; u.clase = m.perfil.clase; u.conEfectos = true;
    u.st = u.yo ? batalla.st : conPerfil(m.perfil, estadisticas);
    u.ef = u.yo ? efecto : k => conPerfil(m.perfil, () => efecto(k));
    u.golpes = u.yo ? golpesEstado() : conPerfil(m.perfil, golpesEstado);
    u.s4 = u.yo ? set4 : j => conPerfil(m.perfil, () => set4(j));   // sets de 4 piezas de cada jugador
    if (u.yo) { u.habs = HABILIDADES; u.carga = batalla.carga; }
    else { const h = conPerfil(m.perfil, calcularHabilidades); u.habs = h.habs; u.carga = Object.fromEntries(h.habs.map(x => [x.id, h.llenas ? x.turnos : 0])); }
    u.vida = u.vidaMax = u.st.vida;
    return u;
  }
  function unidadMonstruo(e, pos) {   // un monstruo, un jefe o un rival de la arena (sus efectos defensivos van en e.ef)
    const u = crearUnidad(1, pos, e.nombre);
    u.e = e; u.st = { ataque: 0, defensa: 0, vida: e.vida, armadura: e.armadura || 0 }; u.vida = u.vidaMax = e.vida;
    u.ef = k => e.ef ? e.ef[k] || 0 : 0; u.conEfectos = !!e.ef; u.turnoRival = 0;
    return u;
  }
  // 1 contra 1: tú contra los enemigos de la batalla, de uno en uno
  function armarDuelo() {
    const yo = unidadJugador({ yo: true, pos: 'frente', perfil: jugador }); yo.duelo = true;
    batalla.grupo = { heroes: [yo], enemigos: [], turnoMascota: 0, objetivo: null, duelo: true };
    siguienteEnemigo(0);
  }
  function siguienteEnemigo(i) {   // motor: el enemigo i entra en combate (1 contra 1)
    const e = batalla.campana.enemigos[i], u = unidadMonstruo(e, 'frente');
    batalla.enemigo = e; batalla.iEnemigo = i; u.duelo = true;
    if (batalla.campana.mundial) u.vida = estadoMundial(batalla.campana.mundial).vida;   // el jefe mundial conserva el daño de otros intentos
    batalla.infernal = !!e.cerbero && u.vida <= e.vida / 2;
    batalla.grupo.enemigos = [u]; batalla.grupo.objetivo = u;
  }
  // Quien tiene efectos defensivos puede resistirlo (lo evita o le hace menos daño). Los jefes mundiales no se pueden
  // controlar (aturdir, congelar); los demás jefes, rivales y reyes, no dos veces seguidas (inmunidad unos turnos).
  function aplicarEstado(u, id, turnos, dano = 0) {
    const def = ESTADOS[id];
    if (u.conEfectos) { const rs = resistir(u.ef('resistencia')); if (rs.evita) { verFx(u, 'num-cura', '🛡 Resistido', 250, -30); return; } dano = Math.round(dano * rs.factor); }
    if (!u.heroe && def.control) {
      const e = u.e;
      if (e.cerbero || e.asmodeo || e.minotauro) { verFx(u, 'num-cura', '🛡 Inmune', 250, -30); return; }
      if (e.jefe || e.rival || e.rey) { if (u.inmune > 0) { verFx(u, 'num-cura', '🛡 Inmune', 250, -30); return; } u.inmune = turnos + 2; }
    }
    const e = u.estados[id];
    if (e && def.acumula) { e.pilas = Math.min(def.acumula, e.pilas + 1); e.turnos = Math.max(e.turnos, turnos); e.dano = Math.max(e.dano, dano); }
    else u.estados[id] = { turnos, dano, pilas: 1 };
    verFx(u, 'dano', `${def.icono} ${def.nombre}`, 250, -30); verEstados(u);
  }
  function regenerar(u) {   // modificador Regeneración
    if (u.e && u.e.regen && u.vida > 0 && u.vida < u.vidaMax) curar(u, Math.min(u.vidaMax - u.vida, Math.round(u.vidaMax * u.e.regen)), '💚 ');
  }
  // Al empezar su turno: daño de sus estados y un turno menos de cada uno. Devuelve true si no actúa (pierde el turno o cae).
  function resolverTick(u) {
    const R = reglas(); let total = 0, iconos = '', control = null;
    if (u.inmune > 0) u.inmune--;
    for (const [id, e] of Object.entries(u.estados)) {
      if (ESTADOS[id].control) control = ESTADOS[id]; else { total += e.dano * e.pilas; iconos += ESTADOS[id].icono; }
      if (--e.turnos <= 0) delete u.estados[id];
    }
    verEstados(u);
    if (total > 0) {
      total = Math.min(total, Math.max(0, u.vida)); u.vida -= total; if (!u.heroe) batalla.danoHecho += total;
      verVida(u); verFx(u, 'dano', `${iconos} -${total}`); emitir('espera', R.esperas.estados);
    }
    if (u.vida <= 0) { morir(u); return true; }
    if (control) { verFx(u, 'num-cura', `${control.icono} Pierde el turno`); emitir('espera', R.esperas.control); }
    return !!control;
  }

  // ---- objetivos ----
  const vivos = l => l.filter(u => u.vida > 0);
  function objetivoPorPosicion(l) {   // golpe normal: más probable al frente
    const v = vivos(l), tot = v.reduce((t, u) => t + PESO_POS[u.pos], 0); let r = rnd() * tot;
    for (const u of v) { r -= PESO_POS[u.pos]; if (r < 0) return u; } return v[0];
  }
  const objetivoAlAzar = l => elegir(vivos(l));
  // Objetivo del jugador: el enemigo que toque (golpes y habilidades van a él). Si no eligió o cayó, el más adelantado
  // (frente, arriba, abajo, retaguardia); también en autoataque. Aliados y enemigos siguen eligiendo por posición.
  function elegirObjetivo() {   // motor
    let t = batalla.grupo.objetivo && batalla.grupo.objetivo.vida > 0 ? batalla.grupo.objetivo : null;
    if (!t) t = POSICIONES.map(p => batalla.grupo.enemigos.find(e => e.pos === p && e.vida > 0)).find(Boolean) || vivos(batalla.grupo.enemigos)[0];
    batalla.grupo.objetivo = t; return t;
  }
  // set 4 del Minotauro: un golpe de más del 15 % de la vida máxima se reduce un 35 %
  function aguanteSet4(t, dano) {
    if (!(t.s4 && t.s4('minotauro') && dano > t.vidaMax * SET4_GOLPE)) return dano;
    verFx(t, 'num-cura', '🐂 Aguante', 200, -30); return Math.max(1, Math.round(dano * (1 - SET4_REDUCE)));
  }
  // aliados y reyes eligen solos: su mejor habilidad lista (las demás siguen cargando)
  function habAuto(u) {
    const h = u.habs.filter(x => u.carga[x.id] >= x.turnos).sort((a, b) => b.mult - a.mult)[0] || null;
    for (const x of u.habs) u.carga[x.id] = x === h ? 0 : Math.min(x.turnos, u.carga[x.id] + 1);
    return h;
  }

  // ---- acciones ----
  // Último bastión y Segundo aliento de un héroe tras recibir un golpe: una vez por batalla cada uno
  function nodosVida(t) {
    if (!t.heroe) return;
    const r = id => t.yo ? rangoClase(id) : conPerfil(t.perfil, () => rangoClase(id));
    if (t.vida <= 0 && r('bastion') && !t.bastionUsado) {
      t.bastionUsado = true; t.vida = 1; verVida(t); verFx(t, 'num-cura', '🏰 Último bastión', 400, -30);
    }
    if (t.vida > 0 && t.vida < t.vidaMax * .3 && r('aliento') && !t.alientoUsado) {
      t.alientoUsado = true; curar(t, Math.min(t.vidaMax - t.vida, Math.round(t.vidaMax * .1 * r('aliento'))), '🌬️ ', 500);
    }
  }
  // Efectos de la habilidad sobre el objetivo: aturdimiento y su estado (quemadura, congelación, sangrado...)
  function efectosHab(u, t, hab) {
    if (!hab || t.vida <= 0) return;
    if (hab.aturde) aplicarEstado(t, 'aturdimiento', 1);
    if (hab.aplica && rnd() < hab.aplica.prob) aplicarEstado(t, hab.aplica.estado, hab.aplica.turnos, Math.max(1, Math.round(u.st.ataque * (hab.aplica.pct || 0))));
  }
  // Un jugador actúa: tú, un aliado (héroes contra enemigos) o un rey (contra los héroes). hab: la que eligió el jugador.
  function resolverAccionJugador(u, hab, rivales) {
    const R = reglas(), pierde = resolverTick(u);
    if (u.yo) {   // cada turno carga las demás habilidades
      for (const x of u.habs) u.carga[x.id] = x === hab ? 0 : Math.min(x.turnos, u.carga[x.id] + 1);
      emitir('carga');
    } else hab = habAuto(u);
    if (pierde || !vivos(rivales).length) return;
    let t;
    if (u.yo && rivales === batalla.grupo.enemigos) { t = elegirObjetivo(); if (!t.duelo) emitir('marcar', t); }
    else t = hab ? objetivoAlAzar(rivales) : objetivoPorPosicion(rivales);
    emitir('animHeroe', u, t, hab);
    if (t.conEfectos && rnd() < t.ef('esquiva')) {
      verFx(t, 'num-cura', '💨 Esquiva'); emitir('espera', R.esperas.esquiva); emitir('volver', u);
      return;
    }
    // daño: bruto → × habilidad, jefes y remate → × crítico → × defensa del objetivo → × su reducción → fases de jefe
    let dano = danoGuerrero(u.st), critico = false;
    let m = multGolpe(u.ef, hab, esJefe(t.e), t.vida < t.vidaMax / 2);
    if (rnd() < u.ef('critico')) { critico = true; m *= DANO_CRITICO_BASE + u.ef('danoCritico'); }
    const def = t.perfil ? t.st : { armadura: t.e.armadura || 0, defensa: t.e.defensa || 0 };   // misma defensa para todos
    m *= factorDefensa({ armadura: armaduraEfectiva(def.armadura, u.ef('penetracion'), hab && hab.perfora), defensa: def.defensa }) * (1 - t.ef('reduccion'));
    dano = Math.max(1, Math.round(dano * m));
    if (batalla.infernal && t.e && t.e.cerbero) dano = Math.max(1, Math.round(dano / (critico ? INFERNAL.defensaCritico : INFERNAL.defensa)));
    if (batalla.escudoRestante > 0 && t.e && t.e.asmodeo) {   // escudo de Asmodeo: absorbe el 80 % y gasta un turno; una habilidad lo rompe
      if (hab) { dano = Math.max(1, Math.round(dano * .7)); batalla.escudoRestante = 0; emitir('claseU', t, 'escudado', false); verFx(t, 'num-cura', '💥 Escudo roto', 300); }
      else { dano = Math.max(1, Math.round(dano * (1 - ESCUDO.reduce))); if (--batalla.escudoRestante === 0) emitir('claseU', t, 'escudado', false); }
    }
    dano = Math.min(t.vida, aguanteSet4(t, dano));
    t.vida -= dano; if (!t.heroe) batalla.danoHecho += dano; verVida(t);
    nodosVida(t);
    if (t.e && t.e.espinas && dano > 0 && u.vida > 1) {   // modificador Espinas: devuelve parte del daño
      const r = Math.max(1, Math.round(dano * t.e.espinas)); u.vida = Math.max(1, u.vida - r); verVida(u); verFx(u, 'dano', `🌵 -${r}`, 300);
    }
    const robo = Math.round(dano * u.ef('robo')); if (robo > 0 && u.vida < u.vidaMax) curar(u, Math.min(robo, u.vidaMax - u.vida), '💀 ', 300);
    if (hab && u.s4('asmodeo') && u.vida < u.vidaMax) curar(u, Math.min(u.vidaMax - u.vida, Math.round(u.vidaMax * SET4_CURA)), '🔯 ', 300);   // set 4 de Asmodeo
    if (t.vida > 0) {
      for (const g of u.golpes) if (rnd() < g.prob) aplicarEstado(t, g.estado, g.turnos, Math.max(1, Math.round(u.st.ataque * g.pct)));
      if (critico && u.s4('cerbero')) aplicarEstado(t, 'quemadura', 2, Math.max(1, Math.round(u.st.ataque * .3)));   // set 4 de Cerbero
      efectosHab(u, t, hab);
    }
    emitir('golpe', u, t, hab, critico, dano, t.duelo ? tipoJefe() : null);
    if (t.e && t.e.cerbero && !batalla.infernal && t.vida > 0 && t.vida <= t.vidaMax / 2) { batalla.infernal = true; emitir('transformar'); }
    emitir('espera', 250); emitir('volver', u);
    if (t.vida <= 0) { morir(t); return; }
    if (t.conEfectos && rnd() < t.ef('contra')) {   // contraataque del objetivo
      const c = t.perfil ? danoGuerrero(t.st) * .6 * factorDefensa(u.st) * (1 - u.ef('reduccion'))   // un rey: como cualquier jugador
        : danoRecibido(azar(...t.e.dano) * .6, u.st) * (1 - u.ef('reduccion'));   // el rival de la arena
      contraatacar(t, u, c);
    }
  }
  function contraatacar(de, a, c) {
    c = Math.max(1, Math.min(a.vida, Math.round(c))); a.vida -= c; if (!a.heroe) batalla.danoHecho += c;
    verVida(a); verFx(a, 'dano critico', `⚙ Contra -${c}`); emitir('espera', reglas().esperas.contra);
    if (a.vida <= 0) morir(a);
  }
  // Qué hace un enemigo en su turno: los jefes mundiales, su especial según sus contadores (la animación solo lo dibuja)
  function decidirAtaqueEnemigo(u) {
    const e = u.e;
    if (e.cerbero) {
      batalla.turnoBola++; batalla.turnoLanza++;
      batalla.especialCerbero = !batalla.infernal ? null : batalla.turnoBola >= BOLA_FUEGO.turnos ? 'bola' : batalla.turnoLanza >= LANZALLAMAS.turnos ? 'lanza' : null;
      if (batalla.especialCerbero === 'bola') batalla.turnoBola = 0;
      if (batalla.especialCerbero === 'lanza') batalla.turnoLanza = 0;
      return batalla.especialCerbero || 'normal';
    }
    if (e.asmodeo) {
      batalla.turnoOnda++; batalla.turnoCura++;
      const herido = u.vida <= u.vidaMax / 2;
      if (herido) batalla.turnoEscudo++;
      if (herido && !batalla.escudoRestante && batalla.turnoEscudo >= ESCUDO.turnos) { batalla.turnoEscudo = 0; return batalla.especialAsmodeo = 'escudo'; }   // el escudo usa su turno, como la curación
      if (herido && batalla.turnoCura >= CURACION.turnos) { batalla.turnoCura = 0; return batalla.especialAsmodeo = 'cura'; }
      if (batalla.turnoOnda >= ONDA_ALAS.turnos) { batalla.turnoOnda = 0; return batalla.especialAsmodeo = 'onda'; }
      batalla.especialAsmodeo = null;
      return rnd() < .5 ? 'garras' : 'barrido';
    }
    if (e.minotauro) {
      if (u.vida <= u.vidaMax * FURIA.umbral && !batalla.furiaRestante && ++batalla.turnoFuria >= FURIA.turnos) { batalla.turnoFuria = 0; return batalla.especialMinotauro = 'furia'; }
      if (++batalla.turnoTajo >= GRAN_TAJO.turnos) { batalla.turnoTajo = 0; return batalla.especialMinotauro = 'tajo'; }
      batalla.especialMinotauro = batalla.furiaRestante > 0 ? 'golpe-furia' : null;
    }
    return 'normal';
  }
  // Especiales de jefe que no son un golpe (entrar en furia, levantar el escudo, curarse): true si gastó así su turno
  function especialSinGolpe(u) {
    if (batalla.especialMinotauro === 'furia') {
      batalla.furiaRestante = FURIA.dura; emitir('claseU', u, 'furia', true); verFx(u, 'num-cura', '🔥 ¡Furia! x3');
      batalla.especialMinotauro = null; emitir('espera', 700); return true;
    }
    if (batalla.especialAsmodeo === 'escudo') {
      batalla.escudoRestante = ESCUDO.dura; emitir('claseU', u, 'escudado', true); verFx(u, 'num-cura', '🛡 Escudo');
      batalla.especialAsmodeo = null; emitir('espera', 700); return true;
    }
    if (batalla.especialAsmodeo === 'cura') {   // quemado, envenenado o sangrando: cura la mitad
      const herido = ['quemadura', 'veneno', 'sangrado'].some(k => u.estados[k]);
      if (herido) verFx(u, 'num-cura', '☠ Curación a la mitad', 300);
      curar(u, Math.min(u.vidaMax - u.vida, Math.round(u.vidaMax * CURACION.pct * (herido ? .5 : 1))));
      batalla.especialAsmodeo = null; emitir('espera', 900); return true;
    }
    return false;
  }
  // Golpe especial de jefe: multiplica el daño y añade el daño fijo de la bola de fuego o del Gran Tajo
  function golpeEspecial(t, dano) {
    if (batalla.especialCerbero === 'lanza') dano = Math.round(dano * LANZALLAMAS.mult);
    if (batalla.especialAsmodeo === 'onda') { dano = Math.round(dano * ONDA_ALAS.mult); batalla.especialAsmodeo = null; }
    if (batalla.especialMinotauro === 'tajo') {   // Gran Tajo: x3 (y x3 más si está en furia) + 10 % de la vida máxima
      dano *= GRAN_TAJO.mult * (batalla.furiaRestante > 0 ? FURIA.mult : 1);
      if (batalla.furiaRestante > 0 && --batalla.furiaRestante === 0) emitir('claseU', enemigoDuelo(), 'furia', false);
      const corte = Math.max(1, Math.round(t.vidaMax * GRAN_TAJO.quema * resistir(t.ef('resistencia')).factor * Math.max(.2, 1 - 2 * t.ef('reduccion'))));   // la reducción cuenta doble aquí
      dano += corte; verFx(t, 'dano critico', `🪓 -${corte}`, 350); batalla.especialMinotauro = null;
    }
    if (batalla.especialMinotauro === 'golpe-furia') {   // furia: daño x3, gasta un turno de duración
      dano *= FURIA.mult; batalla.especialMinotauro = null;
      if (--batalla.furiaRestante === 0) emitir('claseU', enemigoDuelo(), 'furia', false);
    }
    if (batalla.especialCerbero === 'bola') {   // quemadura de la bola de fuego: daño extra fijo, ignora armadura y defensa
      const quema = Math.max(1, Math.round(t.vidaMax * BOLA_FUEGO.quemadura * resistir(t.ef('resistencia')).factor));
      dano += quema; verFx(t, 'dano critico', `🔥 -${quema}`, 350);
    }
    batalla.especialCerbero = null;
    return dano;
  }
  // Un monstruo, jefe o rival de la arena ataca a un héroe
  function resolverAccionEnemigo(u) {
    const R = reglas();
    if (resolverTick(u)) return;
    regenerar(u);
    if (!vivos(batalla.grupo.heroes).length) return;
    const ataque = decidirAtaqueEnemigo(u), t = objetivoPorPosicion(batalla.grupo.heroes);
    emitir('animEnemigo', u, t, ataque);
    if (especialSinGolpe(u)) { emitir('volver', u); return; }
    const especial = !!(batalla.especialCerbero || batalla.especialAsmodeo || batalla.especialMinotauro);   // no se esquivan
    if (!especial && rnd() < t.ef('esquiva')) { verFx(t, 'num-cura', '💨 Esquiva'); emitir('espera', R.esperas.esquiva); emitir('volver', u); return; }
    const e = u.e; let dano = danoRecibido(azar(...e.dano), t.st), critico = false;
    if (e.rival) {   // el rival de la arena: su Estocada cada N turnos y sus críticos
      if (++u.turnoRival % e.habilidad.turnos === 0) { dano = Math.round(dano * e.habilidad.mult); verFx(u, 'num-cura', `⚔ ${e.habilidad.nombre}`); }
      if (rnd() < e.critico) { critico = true; dano = Math.round(dano * e.danoCritico); }
    }
    dano = Math.max(1, Math.round(dano * (1 - t.ef('reduccion'))));
    if (batalla.infernal) dano = Math.round(dano * INFERNAL.dano);
    if (especial) dano = golpeEspecial(t, dano);
    dano = Math.min(t.vida, aguanteSet4(t, dano));
    t.vida -= dano; verVida(t);
    const roboR = Math.min(Math.round(dano * u.ef('robo')), u.vidaMax - u.vida);   // robo de vida del rival
    if (roboR > 0) curar(u, roboR, '💀 ', 300);
    nodosVida(t);
    if (t.vida > 0) for (const a of e.aplica || []) if (rnd() < a.prob) aplicarEstado(t, a.estado, a.turnos, Math.max(1, Math.round(t.vidaMax * (a.pct || 0))));
    emitir('golpe', u, t, null, critico, dano, t.duelo ? tipoJefe() : null);
    emitir('espera', 250); emitir('volver', u);
    if (t.vida <= 0) { morir(t); return; }
    if (rnd() < t.ef('contra')) {   // contraataque de tu skin
      contraatacar(t, u, danoGuerrero(t.st) * .6);
    }
  }
  function resolverMascota() {
    const R = reglas(), m = mascotaActual(), yo = heroeYo(); if (!m || !yo || yo.vida <= 0) return;
    if (++batalla.grupo.turnoMascota < m.accion.turnos) return; batalla.grupo.turnoMascota = 0;
    const pct = valorNivel(m.accion.pct, nivelMascota(m)) / 100;
    if (m.accion.tipo === 'cura') {
      const t = vivos(batalla.grupo.heroes).sort((a, b) => a.vida / a.vidaMax - b.vida / b.vidaMax)[0];
      curar(t, Math.min(t.vidaMax - t.vida, Math.round(t.vidaMax * pct * (1 + efecto('curacion')))), '🐾 '); emitir('espera', R.esperas.curaMascota); return;
    }
    const t = objetivoAlAzar(batalla.grupo.enemigos); if (!t) return;
    emitir('mascota', yo, true); emitir('espera', R.esperas.mascotaIda);
    const dt = t.perfil ? t.st : { armadura: t.e.armadura || 0, defensa: t.e.defensa || 0 };
    const def = factorDefensa({ armadura: armaduraEfectiva(dt.armadura, efecto('penetracion')), defensa: dt.defensa }) * (1 - t.ef('reduccion'));
    const d = Math.max(1, Math.min(t.vida, Math.round(batalla.st.ataque * pct * def * (batalla.infernal ? 1 / INFERNAL.defensa : 1))));
    t.vida -= d; batalla.danoHecho += d; verVida(t); verFx(t, 'dano', `🐾 -${d}`);
    const ap = m.accion.aplica; if (ap && t.vida > 0 && rnd() < ap.prob) aplicarEstado(t, ap.estado, ap.turnos, Math.max(1, Math.round(batalla.st.ataque * (ap.pct || 0))));
    emitir('mascota', yo, false); emitir('espera', R.esperas.mascotaVuelta);
    if (t.vida <= 0) morir(t);
  }
  function morir(u) {
    if (!u.heroe && !u.e.rey) cobrar(u);   // los reyes no dan botín: el premio es el de la dificultad
    emitir('muerteU', u, u.duelo && !u.heroe ? tipoJefe(u.e) : null);
  }
  // botín de un enemigo vencido: se acumula y se cobra al terminar la batalla
  function cobrar(u) {
    if (batalla.campana.abandonada) return;   // la ronda en curso ya no cuenta muertes ni botín
    const e = u.e, b = batalla.campana.botin, x = e.jefe ? 3 : 1, dropEv = (eventoHoy() || {}).drop || 1;   // fin de semana: doble botín
    sumarLogro('enemigos'); contarMision('enemigos');
    const mat = { piedra: azar(...b.piedra) * x, polvo: (rnd() < b.polvo * (1 + efecto('fortuna')) * dropEv ? 1 : 0) * x };
    if (b.cofre && rnd() < (e.jefe ? .3 : .06) * (b.drop || 1) * (1 + efecto('fortuna')) * dropEv) {   // objeto de equipo
      const o = objetoAzar(COFRES.find(k => k.id === b.cofre).probs, efecto('fortuna') / 3 + ((eventoHoy() || {}).caza || 0));   // Fortuna: 1/3 de prob. de subir rareza; Cacería: +15 %
      batalla.ganado.objetos.push(o); verFx(u, 'premio', `🎁 ${modelo[o.modelo].nombre}`, 700, 30);
    }
    if (!e.rival) { jugador.bestiario ||= {}; jugador.bestiario[e.nombre] = (jugador.bestiario[e.nombre] || 0) + 1; }
    sumarMaestria(esJefe(e) ? 5 : 1);
    batalla.ganado.oro += e.oro; batalla.ganado.xp += e.xp; batalla.ganado.piedra += mat.piedra; batalla.ganado.polvo += mat.polvo;
    verFx(u, 'premio', u.duelo ? `+${e.oro} oro  +${e.xp} XP  🔷${mat.piedra}${mat.polvo ? ' ✨' + mat.polvo : ''}` : `+${e.oro} oro +${e.xp} XP`);
  }

  // ---- ronda ----
  // Actúan los héroes (de delante atrás), la mascota y luego los enemigos. Devuelve los eventos para dibujarla.
  function resolverRonda(hab) {
    eventos = [];
    const G = batalla.grupo, R = reglas(), orden = l => POSICIONES.flatMap(p => l.filter(u => u.pos === p));
    emitir('estadoAtaque', 'Atacando...');
    for (const u of orden(G.heroes)) if (u.vida > 0 && vivos(G.enemigos).length) resolverAccionJugador(u, hab, G.enemigos);
    if (vivos(G.enemigos).length) resolverMascota();
    if (vivos(G.enemigos).length && vivos(G.heroes).length) {
      emitir('estadoAtaque', 'Esperando...'); emitir('espera', R.esperas.turnoEnemigo);
      for (const u of orden(G.enemigos)) {
        if (u.vida <= 0 || !vivos(G.heroes).length) continue;
        if (u.perfil) resolverAccionJugador(u, null, G.heroes); else resolverAccionEnemigo(u);
      }
    }
    if (!vivos(G.enemigos).length) {
      if (R.duelo && batalla.iEnemigo + 1 < batalla.campana.enemigos.length) { siguienteEnemigo(batalla.iEnemigo + 1); emitir('siguiente'); }
      else { emitir('espera', 400); emitir('resultado', true); }
    }
    else if (!vivos(G.heroes).length) emitir('resultado', false);
    return eventos;
  }
