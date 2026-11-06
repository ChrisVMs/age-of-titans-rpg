  // ---------------- Pacto (pantalla) ----------------
  function pintarPacto() {
    const P = pacto(), J = P.jefe, c = costeDonacion(), pct = Math.round(J.vida / J.vidaMax * 100), asalto = enAsalto();
    const horas = HORAS_ASALTO.map(([a, b]) => `${a}-${b} h`).join(' y ');
    const fila = (n, d) => `<div class="${n === 'yo' ? 'yo' : ''}"><span>${n === 'yo' ? `${jugador.nombre} (tú)` : n}</span><b>${(d || 0).toLocaleString('es')}</b></div>`;
    const quien = Object.entries(J.dano).sort((a, b) => b[1] - a[1]);
    $('pactoPanel').innerHTML = `
      <div class="liga"><span class="ic">🤝</span><div style="flex:1"><b>Pacto de ${jugador.nombre}</b><br>
        <small>${PACTO_MIEMBROS} miembros: tú, ${P.miembros.join(', ')}</small></div></div>
      <h3>Donaciones · fondos ${P.fondos.toLocaleString('es')}</h3>
      <button id="pactoDonar" ${P.donaciones < DONACIONES_DIA && tieneCoste(c) ? '' : 'disabled'}>Donar ${htmlPremio(c)} · ${DONACIONES_DIA - P.donaciones}/${DONACIONES_DIA} hoy</button>
      ${TEC_PACTO.map(t => { const n = P.tec[t.id] || 0, m = Math.max(1, n);
        const bono = t.st ? `+${Math.round(t.pct * m * 10) / 10} % ${t.st}` : `+${Math.round((t.oro || t.xp) * m * 100)} % ${t.oro ? 'oro' : 'XP'} de batalla`;
        return `<div class="mision"><span class="ic-runa">${t.icono}</span><div class="info">${t.nombre}${n ? ` · Nv ${n}/${TEC_MAX}` : ''}<small>${bono}</small></div>
          ${n >= TEC_MAX ? '<button disabled>Máx.</button>' : `<button data-tec="${t.id}" ${P.fondos >= costeTec(n) ? '' : 'disabled'}>Mejorar<br><small>${costeTec(n)} fondos</small></button>`}</div>`; }).join('')}
      <h3>Jefe de la semana: ${J.e.nombre}</h3>
      <div class="grieta-vida"><div class="prog"><i style="width:${pct}%"></i></div><small>${J.vida.toLocaleString('es')} / ${J.vidaMax.toLocaleString('es')}</small></div>
      <small>${asalto ? '⚔️ <b>¡Hora del asalto!</b> Tu daño cuenta doble.' : `Hora del asalto (daño ×${MULT_ASALTO}): ${horas}.`}</small>
      ${J.vida <= 0 ? `<button id="pactoPremio" ${premioPactoListo() ? '' : 'disabled'}>${premioPactoListo() ? `Cobrar ${htmlPremio(PREMIO_JEFE_PACTO)}` : 'Premio cobrado'}</button>`
        : `<button id="pactoJefe" ${P.intentos < INTENTOS_JEFE_PACTO ? '' : 'disabled'}>Atacar · ${INTENTOS_JEFE_PACTO - P.intentos}/${INTENTOS_JEFE_PACTO} hoy</button>`}
      <div class="ranking"><h3>Daño esta semana</h3>${quien.map(([n, d]) => fila(n, d)).join('') || '<small>Nadie le ha pegado aún</small>'}</div>`;
  }
  $('pactoPanel').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.id === 'pactoDonar' && donarPacto()) avisar(`🤝 +${APORTE_DONACION} fondos`);
    if (b.dataset.tec && mejorarTec(b.dataset.tec)) { const t = TEC_PACTO.find(x => x.id === b.dataset.tec); avisar(`${t.icono} ${t.nombre} Nv ${pacto().tec[t.id]}`); }
    if (b.id === 'pactoPremio') { const p = cobrarPremioPacto(); if (p) avisar(textoPremio(p)); }
    if (b.id === 'pactoJefe') { const c = batallaPacto(); guardar(); if (c) return iniciarCampana(c); }
    guardar(); pintarHud(); pintarPacto();
  });
