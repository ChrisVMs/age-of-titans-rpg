  // ---------------- Simulador de batallas (pruebas) ----------------
  // Juega batallas enteras con el motor, sin dibujar ni esperar. En cada ronda decide `decidir` (por defecto, como el
  // autoataque: la primera habilidad cargada). Trabaja sobre una copia de la partida: botín, misiones o vida de los jefes
  // mundiales no llegan a la partida real, y mientras simula no se guarda ni se avisa nada.
  // Corre fn(partidaReal) sobre una copia de la partida: lo que haga (botín, misiones, vida de jefes mundiales) no llega
  // a la partida real, no se guarda ni se avisa nada, y al terminar la batalla y el azar vuelven a como estaban.
  function aislado(fn) {
    if (ui.enBatalla()) return null;   // la batalla en curso usa el mismo estado
    const real = jugador, uid = sigUid, antes = { ...batalla }, carga = { ...batalla.carga }, habs = HABILIDADES;
    // la pantalla no se entera de la simulación: sin esto, abriendo index.html sin servidor (los bots se simulan en el hilo
    // principal) se dibujaban sus personajes y su equipo en tu escena
    const pantalla = { ...ui }; for (const k in ui) if (typeof ui[k] === 'function' && k !== 'enBatalla') ui[k] = () => {};
    simulando = true; jugador = structuredClone(real);
    try { return fn(real); }
    finally {
      Object.assign(ui, pantalla);
      jugador = real; sigUid = uid; simulando = false; HABILIDADES = habs; sembrar(null);
      for (const k in batalla) delete batalla[k];
      Object.assign(batalla, antes);
      for (const k in batalla.carga) delete batalla.carga[k];
      Object.assign(batalla.carga, carga);
    }
  }
  // Habilidades con criterio (como un jugador atento, no el autoataque): contra un jefe, la más fuerte lista; si viene un
  // jefe más adelante, guarda la más fuerte y usa las demás; no gasta habilidades en un enemigo casi muerto.
  const VIDA_REMATE = .2;   // por debajo de esta parte de su vida, el objetivo se remata con el ataque normal
  function habCriterio() {
    const listas = HABILIDADES.filter(h => batalla.carga[h.id] >= h.turnos);
    if (!listas.length) return null;
    const G = batalla.grupo, vivosE = G.enemigos.filter(u => u.vida > 0), t = G.objetivo && G.objetivo.vida > 0 ? G.objetivo : vivosE[0];
    const porFuerza = [...listas].sort((a, b) => b.mult - a.mult), fuerte = [...HABILIDADES].sort((a, b) => b.mult - a.mult)[0];
    if (vivosE.some(u => esJefe(u.e))) return porFuerza[0];
    if (t && t.vida < t.vidaMax * VIDA_REMATE && vivosE.length === 1 && !(G.duelo && quedanEnemigos())) return null;
    const viene = G.duelo && (batalla.campana.enemigos || []).slice(batalla.iEnemigo + 1).some(esJefe);
    return (viene ? porFuerza.filter(h => h !== listas.find(x => x.id === fuerte.id)) : porFuerza)[0] || null;
  }
  const quedanEnemigos = () => (batalla.campana.enemigos || []).length > batalla.iEnemigo + 1;
  // Juega la batalla c hasta el final con el motor; devuelve true (victoria), false (derrota) o null (sin terminar)
  function jugarHastaFin(c, decidir = habLista, maxRondas = 300) {
    prepararBatalla(c);
    let n = 0;
    while (n < maxRondas) {
      const ev = resolverRonda(decidir()); n++;
      const e = ev.find(x => x[0] === 'resultado'); if (e) return { fin: e[1], rondas: n };
    }
    return { fin: null, rondas: n };
  }
  function simular(c, { veces = 100, decidir = habLista, maxRondas = 300, semilla = null } = {}) {
    return aislado(real => {
      sembrar(semilla);
      const r = { victorias: 0, derrotas: 0, sinTerminar: 0, rondas: 0, vida: 0 };
      for (let i = 0; i < veces; i++) {
        jugador = structuredClone(real);
        const { fin, rondas } = jugarHastaFin(c, decidir, maxRondas);
        if (fin === true) r.victorias++; else if (fin === false) r.derrotas++; else r.sinTerminar++;
        const yo = heroeYo();
        r.rondas += rondas; r.vida += Math.max(0, yo.vida / yo.vidaMax);
      }
      return { ...r, veces, pctVictoria: Math.round(r.victorias / veces * 100), rondasMedia: Math.round(r.rondas / veces * 10) / 10, vidaMedia: Math.round(r.vida / veces * 100) };
    });
  }
  // ---- Enfrentamientos entre clases (pruebas) ----
  // Mismo equipo y nivel (el del primer bot del servidor) y solo cambia la clase; el árbol se reparte por las ramas de su clase.
  function perfilClase(clase, nivel = 60) {
    return construirBot({ ...DEF_BOTS[0], nombre: 'Clase ' + clase, clase, nivel, prioridad: ARBOL[clase].map(r => r.id) }, 0);
  }
  // % de victorias de la clase a contra la b en duelos 1 contra 1 (la mitad atacando cada uno, para no favorecer a nadie)
  function duelosClase(a, b, { veces = 40, nivel = 60 } = {}) {
    return aislado(() => {
      const pelea = (x, y, s) => { sembrar(s); jugador = Object.assign(perfilClase(x, nivel), { formacion: { pos: 'frente', aliados: [] } });
        const c = { nombre: 'Duelo de clases', reyes: 'pvp', aliados: [], premio: {}, botin: { piedra: [0, 0], polvo: 0 },
          enemigos: [{ nombre: 'Rival', rey: true, rival: true, perfil: perfilClase(y, nivel), pct: 1, oro: 0, xp: 0 }] };
        return jugarHastaFin(c, habLista, 300).fin; };
      let g = 0;
      const pts = r => r === true ? 1 : r === false ? 0 : .5;   // sin terminar: medio punto
      for (let i = 0; i < veces; i++) g += pts(pelea(a, b, 500 + i)) + 1 - pts(pelea(b, a, 500 + i));
      return g / (2 * veces);
    });
  }
