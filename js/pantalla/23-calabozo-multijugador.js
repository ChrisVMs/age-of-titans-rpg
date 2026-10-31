  // ---------------- Calabozo multijugador (pantalla) ----------------
  function pintarCalabozo() {
    if (!calabozoAbierto(calSel)) calSel = 1;
    if (!difAbierta(calSel, difCal)) difCal = 'normal';
    const enSala = sala && sala.modo === 'calabozo';
    $('calabozo').innerHTML = `<div class="liga"><span class="ic"><img class="ic-liga" src="img/iconos/cal_${enSala ? sala.cal : calSel}.png" alt=""></span><div style="flex:1"><b>Calabozo multijugador</b><br>
        <div class="difs-cab" id="difBtns"></div></div>
        <select id="calSel" class="combo" ${enSala ? 'disabled' : ''}>${CALABOZOS.map(c => `<option value="${c.id}" ${c.id === (enSala ? sala.cal : calSel) ? 'selected' : ''} ${calabozoAbierto(c.id) ? '' : 'disabled'}>${c.icono} ${c.nombre} · Nv ${c.n}${jugador.calabozos[c.id] ? ' ✔' : calabozoAbierto(c.id) ? '' : ` 🔒 supera ${calabozo(c.id - 1).nombre}`}</option>`).join('')}</select></div>
      ${(() => { const sig = CALABOZOS.find(c => !calabozoAbierto(c.id)); return sig ? `<small class="nota"><img class="ic-txt" src="img/iconos/candado.png" alt=""><img class="ic-txt" src="img/iconos/cal_${sig.id}.png" alt="">${sig.nombre}: supera <img class="ic-txt" src="img/iconos/cal_${sig.id - 1}.png" alt="">${calabozo(sig.id - 1).nombre} en cualquier dificultad para desbloquearlo.</small>` : ''; })()}
      <div id="calabozoCont"></div>`;
    $('calSel').onchange = e => { calSel = +e.target.value; pintarCalabozo(); };   // repinta: las dificultades abiertas dependen del calabozo
    pintarSala();
  }
  // dificultades como botones bajo el título (bloqueadas hasta superar la anterior en ese calabozo)
  function pintarDifsCalabozo() {
    const enSala = sala && sala.modo === 'calabozo', id = enSala ? sala.cal : calSel, actual = enSala ? sala.dif : difCal, fijo = enSala && !esDueno(sala, 'yo');
    $('difBtns').innerHTML = ORDEN_DIF.map(d => { const ok = difAbierta(id, d);
      return `<button class="d-${d}${d === actual ? ' on' : ''}" data-difcal="${d}" ${ok && !fijo ? '' : 'disabled'}>${DIFICULTADES[d]}${ok ? '' : ' <img class="ic-txt" src="img/iconos/candado.png" alt="">'}</button>`; }).join('');
  }
  $('calabozo').addEventListener('click', e => {   // en tu sala cambia su dificultad (todos vuelven a pulsar Ready); fuera, la de la próxima sala
    const b = e.target.closest('[data-difcal]'); if (!b) return clickSala(e);
    if (b.disabled) return;
    if (sala && sala.modo === 'calabozo') { if (esDueno(sala, 'yo') && sala.dif !== b.dataset.difcal) { sala.dif = b.dataset.difcal; reiniciarReady(sala); pintarSala(); } }
    else { difCal = b.dataset.difcal; pintarDifsCalabozo(); }
  });

  function pintarReyes() {
    const R = revisarReyes();
    $('reyes').innerHTML = `<div class="liga"><span class="ic"><img class="ic-liga" src="img/iconos/reyes.png" alt=""></span><div><b>Torre de reyes</b><br>
        <small>Tu grupo contra los 3 reyes del servidor a la vez · intentos hoy: ${R.entradas}/${INTENTOS_REYES} · se reinicia en ${(8 - ahoraJuego().getDay()) % 7 || 7} días</small></div></div>
      <div id="reyesCont"></div>`;
    pintarSala();
  }
  // ranking del servidor: lista a la izquierda; el jugador elegido, a la derecha
  let rankTab = 'servidor';
  const tabsRanking = () => `<div class="tabs">${[['servidor', 'Servidor'], ['ecos', 'Ecos']].map(([k, t]) =>
    `<button data-ranktab="${k}" class="${k === rankTab ? 'on' : ''}${k === 'ecos' && retoPendiente() ? ' con-punto' : ''}" style="position:relative">${t}</button>`).join('')}</div>`;
  function pintarRanking() {
    if (rankTab === 'ecos' && desbloqueado('pArena')) return pintarEcos();
    const ranking = rankingServidor(), x = ranking[rankSel] || ranking[0], p = x.yo ? jugador : x.bot, s0 = conPerfil(p, estadisticas);
    $('ranking').innerHTML = tabsRanking() + `<div class="ranking-vista"><div class="ranking-servidor">${ranking.map((r, i) =>
        `<div class="${r.yo ? 'yo' : ''}${i === rankSel ? ' sel' : ''}" data-rank="${i}"><b>#${i + 1}</b><span>${iconoClase(r.clase)}${r.nombre}</span><span class="clase">${CLASES[r.clase].nombre}</span><span>Nv ${r.nivel}</span><b><img class="ic-txt" src="img/iconos/poder.png" alt="Poder">${r.poder.toLocaleString('es')}</b></div>`).join('')}</div>
      <div class="ranking-ficha"><div class="pj-mini grande${x.yo && marcoActual() ? ' marco-' + marcoActual() : ''}" data-retrato="${x.yo ? '' : x.nombre}"></div>
        <b>${i18nPuesto(rankSel)} ${x.nombre}</b><small>${iconoClase(x.clase)}${CLASES[x.clase].nombre} · Nv ${x.nivel}</small>
        <small><img class="ic-txt" src="img/iconos/poder.png" alt="Poder">${x.poder.toLocaleString('es')} poder</small>
        <small style="white-space:nowrap"><img class="ic-txt" src="img/iconos/vida.png" alt="Vida">${s0.vida.toLocaleString('es')} · <img class="ic-txt" src="img/iconos/ataque.png" alt="Ataque">${s0.ataque} · <img class="ic-txt" src="img/iconos/defensa.png" alt="Defensa">${s0.defensa} · <img class="ic-txt" src="img/iconos/armadura.png" alt="Armadura">${s0.armadura}</small></div></div>`;
    pintarRetratos($('ranking'));
  }
  $('ranking').addEventListener('click', e => {
    const t = e.target.closest('[data-ranktab]');
    if (t) { if (t.dataset.ranktab === 'ecos' && !desbloqueado('pArena')) return avisoBloqueo('pArena'); rankTab = t.dataset.ranktab; return pintarRanking(); }
    if (e.target.closest('#retoEco')) { const c = batallaEco(); if (c) { guardar(); iniciarCampana(c); } return; }
    const r = e.target.closest('[data-rank]'); if (r) { rankSel = +r.dataset.rank; pintarRanking(); }
  });
  // Ecos: el reto del día, el historial con cada uno y el ranking de la semana
  function pintarEcos() {
    const E = revisarEcos(), r = eco(E.reto), R = E.rival[r.id], frase = r.frases.reto[Math.floor(azarSemilla(`reto ${hoy()}`)() * r.frases.reto.length)];
    $('ranking').innerHTML = tabsRanking() + `<div class="torre-card"><h3>${iconoDe(r)} ${r.nombre}${R.venganza ? ' · 🔥 venganza' : ''}</h3>
        <small>«${frase}»</small><small>Gratis · ${htmlPremio(PREMIO_RETO)} · <img class="ic-txt" src="img/iconos/cristales.png" alt="">${R.venganza ? CRISTALES_VENGANZA : CRISTALES_RETO}</small>
        <button id="retoEco" ${retoPendiente() ? '' : 'disabled'}>${retoPendiente() ? 'Aceptar el reto' : 'Mañana, otro reto'}</button></div>
      ${ECOS.map(e => { const x = E.rival[e.id]; return `<div class="mision"><span class="ic-runa">${iconoDe(e, 'ic-grande')}</span><div class="info">${e.nombre}
        <small>tú ${x.gan} – ${x.per}${x.venganza ? ` · 🔥 +${Math.round(x.venganza * 100)} %` : ''}</small></div></div>`; }).join('')}
      <div class="ranking"><h3>Ranking de la semana</h3>${rankingEcos().map((x, i) => `<div class="${x.yo ? 'yo' : ''}"><span>${i18nPuesto(i)} ${x.icono || ''} ${x.nombre}</span>
        <b>${x.puntos.toLocaleString('es')}</b><small>${PREMIO_RANKING_ECOS[i] ? `<img class="ic-txt" src="img/iconos/cristales.png" alt="">${PREMIO_RANKING_ECOS[i].cristales} · 🎟️ ${PREMIO_RANKING_ECOS[i].fichas}` : ''}</small></div>`).join('')}</div>`;
  }
  // dibuja el personaje (con su equipo y skin) en cada hueco [data-retrato]; vacío = tú
  function pintarRetratos(cont) {
    cont.querySelectorAll('[data-retrato]').forEach(el => {
      const n = el.dataset.retrato, p = n ? perfilBot(n) : jugador; if (!p) return;
      const esc = document.createElement('div'); esc.className = 'escala';
      const fr = document.createElement('div'); fr.className = 'frames guerrero quieto'; esc.appendChild(fr); el.appendChild(esc);
      const capas = montarCapas(fr); conPerfil(p, () => pintarVista(capas));
    });
  }
  function iniciarReyes(dif, aliados, posiciones) {
    const R = revisarReyes(), d = DIF_REYES[dif];
    if (R.entradas <= 0) return;
    R.entradas--; guardar();
    iniciarCampana(batallaReyes(dif, aliados, posiciones));
  }
  function iniciarCalabozo(dif, aliados, posiciones, id) {
    const C = revisarCalabozo(), ayuda = C.entradas <= 0;   // sin intentos: puedes ayudar al grupo, pero no recibes recompensa
    if (!ayuda) { C.entradas--; guardar(); }
    iniciarCampana(batallaCalabozo(dif, aliados, posiciones, id, ayuda));
  }
