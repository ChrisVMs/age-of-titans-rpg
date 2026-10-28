  // ---------------- Salas multijugador: Torre de reyes y Calabozo ----------------
  // Sin estar en una sala se ve la lista de salas del modo (con cuántos jugadores tiene cada una) y se puede crear otra.
  // En la sala hay 3 huecos que se llenan de izquierda a derecha: el dueño (quien la creó) y luego los que llegan.
  // Los invitados pulsan Ready desde su lado; el dueño empieza cuando todos están listos. Si el dueño sale, el
  // jugador 2 pasa a ser el dueño. Sin servidor, los demás son bots: aceptan invitaciones, pulsan Ready 1 s después
  // de llegar y, si la sala es de un bot, la empieza él cuando estás listo. Pruebas: si sales de tu sala, salen todos.
  // Los reyes son réplicas de los 3 primeros: esos jugadores también pueden entrar e invitarse (si no, el top 3 no podría jugar). Dentro de una sala no hay flecha de volver: solo se sale abandonándola.
  const salas = { reyes: [], calabozo: [] };   // { id, modo, miembros: [{ n: 'yo' | bot, llego, listo }], dif, invitando }
  let sala = null;   // la sala en la que estás
  const nombreDif = (modo, d) => modo === 'reyes' ? DIF_REYES[d].nombre : DIFICULTADES[d];
  // vuelta a la fase previa (tras una batalla o al cambiar la dificultad): los invitados pulsan Ready otra vez
  function reiniciarReady(s) {
    for (const m of s.miembros.slice(1)) m.listo = false;
    setTimeout(() => { for (const m of s.miembros.slice(1)) if (m.n !== 'yo' && m.llego) m.listo = true; if (sala === s) ui.repintarSala(); }, 1000);   // pruebas: los bots, 1 s después
  }
  const perfilBot = n => bots().find(b => b.nombre === n);
  const perfilDe = n => n === 'yo' ? jugador : perfilBot(n);
  const nombreDe = n => n === 'yo' ? `${jugador.nombre} (tú)` : n;
  const esDueno = (s, n) => s.miembros[0] && s.miembros[0].n === n;
  const idSala = () => 1000 + Math.floor(Math.random() * 9000);
  // salas de otros jugadores (bots) para la lista, una vez por sesión
  function sembrarSalas(modo) {
    if (salas[modo].sembrada) return; salas[modo].sembrada = true;
    if (!MODO_PRUEBAS) return;   // los bots son solo para pruebas: sin servidor no hay salas de otros jugadores
    const libres = bots().filter(b => b.nombre !== jugador.nombre).map(b => b.nombre);
    const listo = n => ({ n, llego: true, listo: true });
    if (libres[0]) salas[modo].push({ id: idSala(), modo, dif: 'normal', cal: 1, miembros: [listo(libres[0])] });
    if (libres[2]) salas[modo].push({ id: idSala(), modo, dif: 'dificil', cal: 2, miembros: [listo(libres[1]), listo(libres[2])] });
  }
  function quitarDeSala(s, n) {
    const dueno = esDueno(s, n);
    s.miembros = s.miembros.filter(m => m.n !== n);   // si era el dueño, el siguiente (jugador 2) pasa a serlo
    if (n === 'yo' && dueno) s.miembros = [];   // pruebas: si sales de tu sala, salen todos
    if (!s.miembros.length) salas[s.modo].splice(salas[s.modo].indexOf(s), 1);   // en el sitio: la lista conserva su marca de sembrada
  }
  // formación de la sala (rombo): la elige el dueño; quien llega ocupa la primera casilla libre
  function posSala(s) {
    const P = s.pos ||= {};
    for (const n of Object.keys(P)) if (!s.miembros.some(m => m.n === n)) delete P[n];
    for (const m of s.miembros) if (!P[m.n]) {
      const usadas = Object.values(P), pref = m.n === 'yo' ? jugador.formacion.pos : 'frente';
      P[m.n] = usadas.includes(pref) ? POSICIONES.find(x => !usadas.includes(x)) : pref;
    }
    return P;
  }
  function candidatosSala() {
    if (!MODO_PRUEBAS) return [];   // sin servidor no hay jugadores online a los que invitar (los bots, solo en pruebas)
    const fuera = new Set([jugador.nombre, ...sala.miembros.map(m => m.n)]);
    return bots().filter(b => !fuera.has(b.nombre));
  }
  const puedeJugar = modo => modo === 'calabozo' ? true : revisarReyes().entradas > 0;   // calabozo sin intentos: entra como ayuda
  const ayudaCalabozo = modo => modo === 'calabozo' && revisarCalabozo().entradas <= 0;
