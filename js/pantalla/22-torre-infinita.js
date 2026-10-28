  // ---------------- Torre infinita (pantalla) ----------------
  function pintarTorre() {
    const n = jugador.torre.mejor + 1, p = pisoTorre(n), hito = Math.ceil(n / 10) * 10;
    $('torre').innerHTML = `<div class="formacion-resumen">${textoFormacion()} <button data-ir-formacion="pTorre">🛡 Formación</button></div><div class="liga"><span class="ic">🗼</span><div><b>Mejor piso: ${jugador.torre.mejor}</b><br><small>Sin estamina · los pisos se generan sin fin y cada uno es siempre igual</small></div></div>
      <div class="torre-card${p.jefe ? ' jefe' : ''}"><h3>Piso ${n}${p.jefe ? ' · JEFE' : ''}</h3>
        <small>${p.enemigos.map(e => e.nombre).join(' · ')}</small>
        ${p.mods.length ? `<div class="mods">${p.mods.map(md => { const desc = (md.torre || md).desc; return `<span title="${desc}">${md.icono} ${md.nombre}: ${desc}</span>`; }).join('')}</div>` : ''}
        <small>Recompensa: ${textoPremio({ oro: p.premio.oro, piedra: p.premio.piedra, polvo: p.premio.polvo })} · ${p.premio.xp} XP</small>
        <small>Próximo hito (piso ${hito}): ${textoPremio(premioHito(hito))} + objeto</small>
        <button id="subirTorre">Subir al piso ${n}</button></div>`;
    $('subirTorre').onclick = iniciarTorre;
  }
  function iniciarTorre() { iniciarCampana(batallaTorre()); }
