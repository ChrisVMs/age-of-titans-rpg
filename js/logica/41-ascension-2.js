  // ---------------- Ascensión (pantalla del árbol) ----------------
  function htmlAscension() {
    const a = ascension();
    if (jugador.nivel < 80 && !a) return '';
    return `<div class="maestria">⭐ Ascensión <b>${a}/${ASCENSION_MAX}</b>${a ? ` · +${5 * a} % a todo · +${2 * a} puntos de habilidad` : ''}
      ${jugador.nivel >= 80 && a < ASCENSION_MAX ? `<br><small>Vuelves al nivel 1 y se reinician los árboles; ganas +5 % a todo y 2 puntos de habilidad más.</small><br><button id="ascender">Ascender</button>` : ''}</div>`;
  }
  async function ascender() {
    if (jugador.nivel < 80 || ascension() >= ASCENSION_MAX) return;
    if (!await confirmar('¿Ascender? Vuelves al nivel 1 y se reinician los árboles de habilidades, a cambio de +5 % a todo y 2 puntos de habilidad extra para siempre.')) return;
    jugador.ascension = ascension() + 1; jugador.nivel = 1; jugador.xp = 0; jugador.arbol = {}; borrador = null;
    guardar(); montarHabilidades(); aplicarEquipo(); pintarHud(); avisar(`⭐ Ascensión ${jugador.ascension}`); pintarArbol();
  }

  // ================= Batalla por grupos: formación en rombo 1-2-1 =================
  // Cada lado tiene 4 casillas: retaguardia | arriba y abajo | frente. En solitario ocupas una (a elegir); en grupo sois hasta
  // 3 jugadores (sin servidor, los aliados son los bots). Los golpes normales eligen objetivo por casilla (frente 50 %,
  // arriba 20 %, abajo 20 %, retaguardia 10 %, repartido entre las ocupadas); las habilidades caen sobre cualquiera.
  // Cada ronda atacan todas las unidades: tú eliges tus habilidades, los aliados usan las suyas solos.
  // Se usa en Campaña, Torre y Torre de reyes (3 contra 3: los reyes luchan como jugadores); jefes mundiales y Arena siguen 1 contra 1.
  const POSICIONES = ['frente', 'arriba', 'abajo', 'atras'];
  const NOMBRE_POS = { frente: 'Frente', arriba: 'Arriba', abajo: 'Abajo', atras: 'Retaguardia' };
  const PESO_POS = { frente: 50, arriba: 20, abajo: 20, atras: 10 };
  const MAX_JUGADORES = 3;
  const XY_HEROE = { atras: [0, 125], arriba: [170, 30], abajo: [170, 220], frente: [340, 125] };   // coordenadas en la escena
  const XY_ENEMIGO = { frente: [640, 125], arriba: [810, 30], abajo: [810, 220], atras: [980, 125] };
  const ANCHO_GRUPO = 1276, ALTO_GRUPO = 450;
  let CALABOZO_SOLO = 1;   // vida de los enemigos del calabozo si vas solo (let: lo ajusta el simulador de progresión)
  const VIDA_POR_ALIADO = .7;   // con aliados los enemigos tienen más vida (+70 % por aliado)
  jugador.formacion ||= { pos: 'frente', aliados: [] };
  // (función declarada: la Campaña la usa al dibujarse en el arranque, antes de llegar a este bloque)
  function textoFormacion() {
    const F = jugador.formacion || { pos: 'frente', aliados: [] }, N = { frente: 'Frente', arriba: 'Arriba', abajo: 'Abajo', atras: 'Retaguardia' };
    return `Formación: <b>Tú</b> (${N[F.pos]})${(MODO_PRUEBAS ? F.aliados : []).map(a => ` + ${a.bot} (${N[a.pos]})`).join('')}`;
  }

  // ---- pantalla de formación ----
  let volverDeFormacion = 'pCampana', fichaSel = 'yo';

  // ---- montaje de la escena ----
  batalla.grupo = null;
  function armarGrupo(c) {   // motor: héroes y enemigos de la batalla en grupo
    const F = jugador.formacion, P = c.posiciones, miPos = P ? P.yo : F.pos, heroes = [], libres = POSICIONES.filter(p => p !== miPos);
    const aliados = c.aliados ? c.aliados.map((bot, i) => ({ bot, pos: (P && P[bot]) || libres[i] })) : MODO_PRUEBAS ? F.aliados : [];   // formación de la sala; los bots, solo en pruebas
    const miembros = [{ yo: true, pos: miPos, perfil: jugador }, ...aliados.map(a => ({ pos: a.pos, perfil: bots().find(b => b.nombre === a.bot) })).filter(m => m.perfil)];
    for (const m of miembros) heroes.push(unidadJugador(m));
    // enemigos: jefe al frente, el resto en las demás casillas; más vida si vienes en grupo
    // monstruos: el jefe siempre en la retaguardia y el resto delante (frente, arriba, abajo); los reyes, n.º 1 al frente
    const reyes = c.enemigos.some(e => e.perfil);
    const lista = reyes ? c.enemigos.slice(0, 4) : [...c.enemigos.filter(e => !e.jefe), ...c.enemigos.filter(e => e.jefe)].slice(0, 4);
    const nJefes = reyes ? 0 : lista.filter(e => e.jefe).length, delante = POSICIONES.filter(p => p !== 'atras');
    const posDe = (e0, i) => reyes ? POSICIONES[i] : e0.jefe && nJefes === 1 ? 'atras' : (nJefes === 1 ? delante : POSICIONES)[i];
    const enemigos = lista.map((e0, i) => {
      if (e0.perfil) return unidadRey(e0, POSICIONES[i]);
      const solo = c.calabozo && heroes.length === 1 ? CALABOZO_SOLO : 1;   // el calabozo está pensado para ir en grupo
      return unidadMonstruo({ ...e0, vida: Math.round(e0.vida * (1 + VIDA_POR_ALIADO * (heroes.length - 1)) * solo) }, posDe(e0, i));
    });
    batalla.grupo = { heroes, enemigos, turnoMascota: 0, objetivo: null };
    elegirObjetivo();   // se marca el frontal desde el inicio
    batalla.enemigo = enemigos[0].e;   // para los textos del resultado
  }

  // un rey de la Torre de reyes: lucha como un jugador, con un % de sus atributos reales (dificultad)
  function unidadRey(e, pos) {
    const u = crearUnidad(1, pos, e.nombre), p = e.perfil, s0 = conPerfil(p, estadisticas);
    u.e = e; u.perfil = p; u.clase = p.clase;
    u.st = Object.fromEntries(Object.entries(s0).map(([k, v]) => [k, Math.round(v * e.pct)]));
    u.ef = k => conPerfil(p, () => efecto(k)); u.conEfectos = true; u.golpes = conPerfil(p, golpesEstado); u.s4 = j => conPerfil(p, () => set4(j));
    const h = conPerfil(p, calcularHabilidades); u.habs = h.habs; u.carga = Object.fromEntries(h.habs.map(x => [x.id, 0]));
    u.vida = u.vidaMax = u.st.vida;
    return u;
  }

  // Multijugador (Torre de reyes y calabozo): tienes 10 s para elegir tu ataque; si no pulsas nada, se lanza un ataque
  // normal para no retrasar a los demás jugadores. La cuenta se ve sobre el botón de atacar.
  const TIEMPO_TURNO = 10;
  let cuentaTurno = null;
