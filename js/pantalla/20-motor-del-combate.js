  // ---------------- Motor del combate (todos los modos) (pantalla) ----------------
  // ---- efectos de estado ----
  function pintarEstadosU(u, est = u.estados) {
    u.el.querySelector('.estados').innerHTML = Object.entries(est).map(([id, e]) =>
      `<span title="${ESTADOS[id].nombre}">${ESTADOS[id].icono}${e.pilas > 1 ? '×' + e.pilas : ''} ${e.turnos}</span>`).join('');
  }
  // Mascota: cada N turnos muerde a un enemigo al azar (daño = % de tu ataque) o cura al héroe con menos vida (% de su vida máxima)
  function prepararMascota() {   // despertar D5: la mascota brilla y el guerrero deja estela con su skin
    const m = mascotaActual(), k = skinActual(); $('acompana').innerHTML = m ? dibujoMascota(m, .5) : '';
    $('acompana').classList.toggle('despierta', !!m && nivelDespertar('mascota', m.id) >= D_VISUAL);
    marcoGuerrero.classList.toggle('estela', !!k && nivelDespertar('skin', k.id) >= D_VISUAL);
  }
