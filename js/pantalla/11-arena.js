  // ---------------- Arena (PvP asíncrono) (pantalla) ----------------
  function pintarArena() {
    const a = revisarArena(), l = LIGAS[ligaDe(a.puntos)], st0 = estadisticas(), p = poder(st0);
    $('arenaPvp').innerHTML = `<div class="liga"><span class="ic">${l[2]}</span><div><b>Liga ${l[1]}</b><br>${a.puntos} puntos · ${a.victorias || 0} victorias
        <br><small>Entradas hoy: ${a.entradas}/${ARENA_ENTRADAS} · Temporada: acaba en ${diasFinMes()} días · premio de tu liga: ${textoPremio(PREMIO_LIGA[ligaDe(a.puntos)])}</small></div></div>
      <small class="nota">PvP asíncrono: luchas contra copias de guerreros controladas por la IA, con un poder parecido al tuyo. Sus sprites de guerrero llegarán más adelante.</small>
      ${a.rivales.map((r, i) => `<div class="rival"><span class="ic-runa"><img class="ic-grande" src="img/iconos/arena.png" alt=""></span><div class="info"><b>${r.nombre}</b><small><img class="ic-txt" src="img/iconos/poder.png" alt="">${Math.round(p * r.f).toLocaleString('es')} poder · ${r.puntos} pts</small>
        <small>${r.f < .95 ? 'Fácil' : r.f > 1.05 ? 'Difícil' : 'Igualado'} · ganar: +${Math.round(25 * r.f)} pts</small></div>
        <button data-rival="${i}" ${a.entradas > 0 ? '' : 'disabled'}>Desafiar</button></div>`).join('')}
      <div class="fila" style="display:flex;gap:8px;align-items:center"><button data-acc="rivales" ${jugador.oro >= COSTE_RIVALES ? '' : 'disabled'}>Cambiar rivales</button><small>● ${COSTE_RIVALES}</small></div>`;
  }
  $('arenaPvp').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const a = revisarArena();
    if (b.dataset.acc === 'rivales' && jugador.oro >= COSTE_RIVALES) { jugador.oro -= COSTE_RIVALES; generarRivales(); guardar(); pintarHud(); pintarArena(); return; }
    if (b.dataset.rival == null || a.entradas <= 0) return;
    a.entradas--; a.rivalActual = +b.dataset.rival; guardar();
    iniciarCampana(batallaArena(+b.dataset.rival));
  });
