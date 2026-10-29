  // ---------------- La Grieta (pantalla) ----------------
  function pintarGrieta() {
    const G = revisarGrieta(), n = G.piso + 1, vida = Math.round(G.vida * 100);
    const bends = G.bend.map(id => BENDICIONES.find(b => b.id === id)).map(b => `<span title="${b.desc}">${b.icono} ${b.nombre}</span>`).join('');
    let cuerpo;
    if (G.ofertas) cuerpo = `<h3>Elige una bendición</h3>` + G.ofertas.map(id => BENDICIONES.find(b => b.id === id)).map(b =>
      `<button class="bendicion" data-bend="${b.id}"><b>${b.icono} ${b.nombre}</b><small>${b.desc}</small></button>`).join('');
    else if (G.piso >= GRIETA_PISOS && !G.activa) cuerpo = `<h3>🌀 ¡Grieta completada!</h3><small>Vuelve el lunes.</small>`;
    else if (!G.activa && !G.intentos) cuerpo = `<h3>Sin intentos</h3><small>Vuelve el lunes.</small>`;
    else {
      const p = pisoGrieta(n, G);
      cuerpo = `<h3>Piso ${n}${p.jefe ? ' · JEFE' : ''}</h3><small>${p.enemigos.map(e => e.nombre).join(' · ')}</small>
        <div class="mods">${p.mods.map(md => { const d = (md.torre || md).desc; return `<span title="${d}">${md.icono} ${md.nombre}: ${d}</span>`; }).join('')}</div>
        <small>${n > G.mejor ? `Recompensa: ${textoPremio(premioPisoGrieta(n, G.nEq))}${PREMIO_JEFE_GRIETA[n] ? ' · ' + textoPremio(PREMIO_JEFE_GRIETA[n]) : ''}` : 'Ya cobrado esta semana'}</small>
        <button id="entrarGrieta">${G.activa ? `Bajar al piso ${n}` : `Empezar intento (${G.intentos}/${GRIETA_INTENTOS})`}</button>`;
    }
    $('grieta').innerHTML = `<div class="liga"><span class="ic">🌀</span><div><b>Mejor piso esta semana: ${G.mejor}/${GRIETA_PISOS}</b>
        <br><small>La vida no se recupera entre pisos · perder termina el intento</small></div></div>
      ${G.activa ? `<div class="grieta-vida"><div class="prog"><i style="width:${vida}%"></i></div><small>❤️ ${vida} %</small></div>` : ''}
      ${bends ? `<div class="mods">${bends}</div>` : ''}
      <div class="torre-card">${cuerpo}</div>`;
  }
  $('grieta').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.bend) { elegirBendicion(b.dataset.bend); guardar(); pintarGrieta(); }
    if (b.id === 'entrarGrieta') { const c = batallaGrieta(); if (c) { guardar(); iniciarCampana(c); } }
  });
