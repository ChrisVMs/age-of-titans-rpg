  // ---------------- Simulador de batallas (pruebas) ----------------
  // Juega batallas enteras con el motor, sin dibujar ni esperar. En cada ronda decide `decidir` (por defecto, como el
  // autoataque: la primera habilidad cargada). Trabaja sobre una copia de la partida: botín, misiones o vida de los jefes
  // mundiales no llegan a la partida real, y mientras simula no se guarda ni se avisa nada.
  // Corre fn(partidaReal) sobre una copia de la partida: lo que haga (botín, misiones, vida de jefes mundiales) no llega
  // a la partida real, no se guarda ni se avisa nada, y al terminar la batalla y el azar vuelven a como estaban.
  function aislado(fn) {
    if (ui.enBatalla()) return null;   // la batalla en curso usa el mismo estado
    const real = jugador, uid = sigUid, antes = { ...batalla }, carga = { ...batalla.carga }, habs = HABILIDADES;
    simulando = true; jugador = structuredClone(real);
    try { return fn(real); }
    finally {
      jugador = real; sigUid = uid; simulando = false; HABILIDADES = habs; sembrar(null);
      for (const k in batalla) delete batalla[k];
      Object.assign(batalla, antes);
      for (const k in batalla.carga) delete batalla.carga[k];
      Object.assign(batalla.carga, carga);
    }
  }
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
