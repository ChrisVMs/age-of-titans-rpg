  // ---------------- Expediciones (pantalla) ----------------
  function pintarMisiones() {
    const M = revisarMisiones(), tabs = { diaria: 'Diarias', semanal: 'Semanales', evSemana: 'Evento', expedicion: 'Expedición' };   // el login tiene su propio icono (📅)
    const punto = { diaria: misionesReclamables('diaria') || bonusDisponible('diaria'), semanal: misionesReclamables('semanal') || bonusDisponible('semanal'),
                    login: loginDisponible(), evSemana: eventoReclamable(), expedicion: expedicionLista() };
    let cuerpo = '';
    if (misTab === 'diaria' || misTab === 'semanal') {
      const lista = misionesVisibles(misTab), R = M['r' + misTab], cofres = BONUS_MISIONES[misTab], hechas = misionesHechas(R), tope = cofres.at(-1).meta;
      cuerpo = `<small class="nota">${misTab === 'diaria' ? 'Se renuevan cada día.' : 'Se renuevan cada lunes.'}</small>` + lista.map(m => {
        const v = Math.min(m.meta, M[misTab][m.ev] || 0), lista_ = v >= m.meta, rec = R[m.id];
        return `<div class="mision${rec ? ' hecha' : lista_ ? ' lista-m' : ''}"><div class="info">${m.txt}<small>${htmlPremio(m.premio)}</small>
          <div class="prog"><i style="width:${v / m.meta * 100}%"></i></div></div><small>${v}/${m.meta}</small>
          <button data-reclamar="${m.id}" ${lista_ && !rec ? '' : 'disabled'}>${rec ? '<img class="ic-txt" src="img/iconos/hecho.png" alt="">' : 'Reclamar'}</button></div>`;
      }).join('');
      cuerpo = `<div class="actividad"><div class="prog"><i style="width:${Math.min(1, hechas / tope) * 100}%"></i></div>${cofres.map((c, i) => {
        const rec = R['cofre' + i], listo = hechas >= c.meta;
        return `<button class="cofre-act${rec ? ' hecha' : listo ? ' lista-m' : ''}" style="left:${c.meta / tope * 100}%" data-reclamar="cofre${i}" ${listo && !rec ? '' : 'disabled'}>${rec ? '<img class="ic-txt" src="img/iconos/hecho.png" alt="">' : '<img class="ic-txt" src="img/iconos/regalo.png" alt="">'}<small>${c.meta}</small></button>`;
      }).join('')}</div><small class="nota"><img class="ic-txt" src="img/iconos/regalo.png" alt="">${cofres.map(c => `${c.meta}: ${htmlPremio(c.premio)}`).join(' · ')}</small>` + cuerpo;
    } else if (misTab === 'evSemana') {
      const E = revisarEvento(), t = temaSemana(), tieneT = (jugador.titulos || {})[idTituloTema(t)];
      cuerpo = `<div class="torre-card"><h3>${t.icono} ${t.nombre}</h3>
          <small><img class="ic-txt" src="img/iconos/ficha.png" alt="">${t.fichas < 1 ? `1 ficha cada ${Math.round(1 / t.fichas)}` : t.fichas} por ${t.unidad} · esta semana ${E.ganadas}/${TOPE_FICHAS_SEMANA}</small>
          <b><img class="ic-txt" src="img/iconos/ficha.png" alt="">${E.fichas} fichas</b></div>
        <div class="mision${tieneT ? ' hecha' : ''}"><div class="info">Título «${t.titulo[0]}»<small>${textoBono(t.titulo[1])} · solo esta semana</small></div>
          <button data-evcomprar="titulo" ${puedeComprarEvento('titulo') ? '' : 'disabled'}>${tieneT ? '<img class="ic-txt" src="img/iconos/hecho.png" alt="">' : `<img class="ic-txt" src="img/iconos/ficha.png" alt="">${PRECIO_TITULO_EVENTO}`}</button></div>` +
        TIENDA_EVENTO.map(it => `<div class="mision"><div class="info">${htmlPremio(it.premio)}<small>${compradosEvento(it.id)}/${it.max} esta semana</small></div>
          <button data-evcomprar="${it.id}" ${puedeComprarEvento(it.id) ? '' : 'disabled'}><img class="ic-txt" src="img/iconos/ficha.png" alt="">${it.coste}</button></div>`).join('');
    } else if (misTab === 'login') {
      const L = jugador.login || { dias: 0 }, hoyIdx = L.dias % 7;
      cuerpo = `<small class="nota">Entra cada día para recoger tu recompensa. Cada semana completa las recompensas suben un 25 % (hasta ×3). Llevas ${L.dias} días.</small>
        <div class="login-dias">${LOGIN.map((_, i) => `<div class="login-dia${i < hoyIdx || (i === hoyIdx && !loginDisponible()) ? ' hecho' : i === hoyIdx ? ' hoy' : ''}"><b>Día ${i + 1}</b><br>${htmlPremio(LOGIN[i])}</div>`).join('')}</div>
        <button id="reclamarLogin" ${loginDisponible() ? '' : 'disabled'}>${loginDisponible() ? `Recoger: ${htmlPremio(premioLogin())}` : 'Vuelve mañana'}</button>`;
    } else {
      const E = jugador.expedicion, propias = MASCOTAS.filter(m => nivelMascota(m) > 0 && m.id !== jugador.mascota);
      if (E) { const m = MASCOTAS.find(x => x.id === E.mascota), falta = Math.max(0, E.fin - Date.now());
        cuerpo = `<div class="torre-card"><h3><img class="ic-txt" src="img/iconos/masc_${m.id}.png" alt="">${m.nombre} está de expedición (${E.horas} h)</h3>
          <small>${falta ? `Vuelve en ${Math.floor(falta / 3600000)} h ${Math.ceil(falta % 3600000 / 60000)} min` : '¡Ha vuelto!'}</small>
          <small>Trae: ${htmlPremio(premioExpedicion(m, E.horas))}</small>
          <button id="recogerExp" ${falta ? 'disabled' : ''}>Recoger</button></div>`;
      } else if (!propias.length) cuerpo = '<small class="nota">Necesitas una mascota que no lleves puesta. Cómprala en la sección Mascota.</small>';
      else { expMasc = propias.some(m => m.id === expMasc) ? expMasc : propias[0].id; const m = MASCOTAS.find(x => x.id === expMasc);
        cuerpo = `<small class="nota">Manda una mascota que no lleves puesta; al volver trae oro y materiales. Mejores mascotas traen más.</small>
          <div class="tabs">${propias.map(x => `<button data-expm="${x.id}" class="${x.id === expMasc ? 'on' : ''}"><img class="ic-txt" src="img/iconos/masc_${x.id}.png" alt="">${x.nombre}</button>`).join('')}</div>
          <div class="tabs">${HORAS_EXPEDICION.map(h => `<button data-exph="${h}" class="${h === expHoras ? 'on' : ''}">${h} h</button>`).join('')}</div>
          <small>Trae: ${htmlPremio(premioExpedicion(m, expHoras))}</small><button id="mandarExp">Mandar de expedición</button>`; }
    }
    $('misiones').innerHTML = `<div class="tabs">${Object.entries(tabs).map(([k, t]) => `<button data-mtab="${k}" class="${k === misTab ? 'on' : ''}${punto[k] ? ' con-punto' : ''}" style="position:relative">${t}</button>`).join('')}</div>${cuerpo}`;
  }
  $('misiones').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.mtab && !desbloqueado(b.dataset.mtab)) return avisoBloqueo(b.dataset.mtab);
    if (b.dataset.mtab) misTab = b.dataset.mtab;
    if (b.dataset.reclamar) { const pr = reclamarMision(misTab, b.dataset.reclamar); if (pr) avisar(textoPremio(pr)); }
    if (b.dataset.evcomprar) { const r = comprarEvento(b.dataset.evcomprar); if (r) avisar(r.titulo ? `Nuevo título: «${r.titulo}»` : textoPremio(r)); }
    if (b.dataset.expm) expMasc = b.dataset.expm;
    if (b.dataset.exph) expHoras = +b.dataset.exph;
    if (b.id === 'mandarExp' && !jugador.expedicion) { jugador.expedicion = { mascota: expMasc, horas: expHoras, fin: Date.now() + expHoras * 3600000 }; avisar('🧭 ¡En marcha!'); }
    if (b.id === 'recogerExp' && expedicionLista()) { const E = jugador.expedicion, pr = premioExpedicion(MASCOTAS.find(x => x.id === E.mascota), E.horas); delete jugador.expedicion; darPremio(pr); avisar(textoPremio(pr)); }
    guardar(); pintarHud(); pintarMisiones();
  });
