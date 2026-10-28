  // ---------------- Bot de pruebas ----------------
  // "repetir": en batalla activa el autoataque y, al terminar, pulsa Jugar de nuevo / Reintentar / Subir piso.
  // "jugar": además elige qué jugar (campaña, Torre, Arena, jefes mundiales; nada multijugador), se equipa lo de más
  // poder, reparte los puntos de habilidad y compra cofres con el oro que sobra. Para cuando no queda nada que jugar hoy.
  let botModo = null, botVel = 1;
  const botFallos = {};   // derrotas por batalla (clave): a las 2 el bot deja de intentarla
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  function botEquipar() {
    for (const r of Object.keys(RANURAS)) {
      let mejor = jugador.equipado[r], pMejor = poder();
      for (const o of jugador.objetos) {
        if (modelo[o.modelo].ranura !== r || o.uid === mejor) continue;
        jugador.equipado[r] = o.uid; const p = poder();
        if (p > pMejor) { pMejor = p; mejor = o.uid; }
      }
      if (mejor) jugador.equipado[r] = mejor; else delete jugador.equipado[r];   // ranura que estaba vacía
    }
    aplicarEquipo();
  }
  function botArbol() {
    if (!desbloqueado('pArbol')) return;
    while (puntosLibres() > 0) {
      let mejor = null, pMejor = -1;
      for (const rama of ramasClase()) rama.nodos.forEach((n, i) => {
        if (rango(n.id) >= n.max || !nodoAbierto(rama, i)) return;
        jugador.arbol[n.id] = rango(n.id) + 1; const p = poder();
        if (--jugador.arbol[n.id] <= 0) delete jugador.arbol[n.id];
        if (p > pMejor) { pMejor = p; mejor = n; }
      });
      if (!mejor) break;
      jugador.arbol[mejor.id] = rango(mejor.id) + 1;
    }
  }
  function botCofres() {   // el mejor cofre x10 que se pueda pagar dejando 2000 de oro
    const c = [...COFRES].reverse().find(k => k.precio && jugador.oro >= k.precio * 10 + 2000);
    if (!c) return;
    jugador.oro -= c.precio * 10; sumarLogro('cofres', 10); contarMision('cofres', 10);
    for (let i = 0; i < 10; i++) abrirCofre(c);
  }
  function botPreparar() { botCofres(); botEquipar(); botArbol(); guardar(); pintarHud(); }
