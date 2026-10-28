  // ---------------- Calabozo multijugador (pantalla) ----------------
  function pintarCalabozo() {
    if (!calabozoAbierto(calSel)) calSel = 1;
    if (!difAbierta(calSel, difCal)) difCal = 'normal';
    const enSala = sala && sala.modo === 'calabozo';
    $('calabozo').innerHTML = `<div class="liga"><span class="ic">🏰</span><div style="flex:1"><b>Calabozo multijugador</b><br>
        <div class="difs-cab" id="difBtns"></div></div>
        <select id="calSel" class="combo" ${enSala ? 'disabled' : ''}>${CALABOZOS.map(c => `<option value="${c.id}" ${c.id === (enSala ? sala.cal : calSel) ? 'selected' : ''} ${calabozoAbierto(c.id) ? '' : 'disabled'}>${c.icono} ${c.nombre} · Nv ${c.n}${jugador.calabozos[c.id] ? ' ✔' : calabozoAbierto(c.id) ? '' : ` 🔒 supera ${calabozo(c.id - 1).nombre}`}</option>`).join('')}</select></div>
      ${(() => { const sig = CALABOZOS.find(c => !calabozoAbierto(c.id)); return sig ? `<small class="nota">🔒 ${sig.icono} ${sig.nombre}: supera ${calabozo(sig.id - 1).icono} ${calabozo(sig.id - 1).nombre} en cualquier dificultad para desbloquearlo.</small>` : ''; })()}
      <div id="calabozoCont"></div>`;
    $('calSel').onchange = e => { calSel = +e.target.value; pintarCalabozo(); };   // repinta: las dificultades abiertas dependen del calabozo
    pintarSala();
  }
  // dificultades como botones bajo el título (bloqueadas hasta superar la anterior en ese calabozo)
  function pintarDifsCalabozo() {
    const enSala = sala && sala.modo === 'calabozo', id = enSala ? sala.cal : calSel, actual = enSala ? sala.dif : difCal, fijo = enSala && !esDueno(sala, 'yo');
    $('difBtns').innerHTML = ORDEN_DIF.map(d => { const ok = difAbierta(id, d);
      return `<button class="d-${d}${d === actual ? ' on' : ''}" data-difcal="${d}" ${ok && !fijo ? '' : 'disabled'}>${DIFICULTADES[d]}${ok ? '' : ' 🔒'}</button>`; }).join('');
  }
  $('calabozo').addEventListener('click', e => {   // en tu sala cambia su dificultad (todos vuelven a pulsar Ready); fuera, la de la próxima sala
    const b = e.target.closest('[data-difcal]'); if (!b) return clickSala(e);
    if (b.disabled) return;
    if (sala && sala.modo === 'calabozo') { if (esDueno(sala, 'yo') && sala.dif !== b.dataset.difcal) { sala.dif = b.dataset.difcal; reiniciarReady(sala); pintarSala(); } }
    else { difCal = b.dataset.difcal; pintarDifsCalabozo(); }
  });

  function pintarReyes() {
    const R = revisarReyes();
    $('reyes').innerHTML = `<div class="liga"><span class="ic">👑</span><div><b>Torre de reyes</b><br>
        <small>Tu grupo contra los 3 reyes del servidor a la vez · intentos hoy: ${R.entradas}/${INTENTOS_REYES} · se reinicia en ${(8 - ahoraJuego().getDay()) % 7 || 7} días</small></div></div>
      <div id="reyesCont"></div>`;
    pintarSala();
  }
  // ranking del servidor: lista a la izquierda; el jugador elegido, a la derecha
  function pintarRanking() {
    const ranking = rankingServidor(), x = ranking[rankSel] || ranking[0], p = x.yo ? jugador : x.bot, s0 = conPerfil(p, estadisticas);
    $('ranking').innerHTML = `<div class="ranking-vista"><div class="ranking-servidor">${ranking.map((r, i) =>
        `<div class="${r.yo ? 'yo' : ''}${i === rankSel ? ' sel' : ''}" data-rank="${i}"><b>#${i + 1}</b><span>${CLASES[r.clase].icono} ${r.nombre}</span><span class="clase">${CLASES[r.clase].nombre}</span><span>Nv ${r.nivel}</span><b>⚔ ${r.poder.toLocaleString('es')}</b></div>`).join('')}</div>
      <div class="ranking-ficha"><div class="pj-mini grande" data-retrato="${x.yo ? '' : x.nombre}"></div>
        <b>${i18nPuesto(rankSel)} ${x.nombre}</b><small>${CLASES[x.clase].icono} ${CLASES[x.clase].nombre} · Nv ${x.nivel}</small>
        <small>⚔ ${x.poder.toLocaleString('es')} poder</small>
        <small>❤ ${s0.vida.toLocaleString('es')} · 🗡 ${s0.ataque} · 🛡 ${s0.defensa} · ⛨ ${s0.armadura}</small></div></div>`;
    pintarRetratos($('ranking'));
  }
  $('ranking').addEventListener('click', e => { const r = e.target.closest('[data-rank]'); if (r) { rankSel = +r.dataset.rank; pintarRanking(); } });
  // dibuja el personaje (con su equipo y skin) en cada hueco [data-retrato]; vacío = tú
  function pintarRetratos(cont) {
    cont.querySelectorAll('[data-retrato]').forEach(el => {
      const n = el.dataset.retrato, p = n ? perfilBot(n) : jugador; if (!p) return;
      const esc = document.createElement('div'); esc.className = 'escala';
      const fr = document.createElement('div'); fr.className = 'frames guerrero quieto'; esc.appendChild(fr); el.appendChild(esc);
      const capas = montarCapas(fr); conPerfil(p, () => pintarVista(capas));
    });
  }
