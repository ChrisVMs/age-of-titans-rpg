  // ---------------- Motor del combate (todos los modos) (pantalla) ----------------
  // ---- efectos de estado ----
  function pintarEstadosU(u, est = u.estados) {
    u.el.querySelector('.estados').innerHTML = Object.entries(est).map(([id, e]) =>
      `<span title="${ESTADOS[id].nombre}">${ESTADOS[id].icono}${e.pilas > 1 ? '×' + e.pilas : ''} ${e.turnos}</span>`).join('');
  }
  // Mascota: cada N turnos muerde a un enemigo al azar (daño = % de tu ataque) o cura al héroe con menos vida (% de su vida máxima)
  function prepararMascota() { const m = mascotaActual(); $('acompana').innerHTML = m ? dibujoMascota(m, .5) : ''; }
