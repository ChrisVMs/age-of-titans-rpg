  // ---------------- Aura (pantalla) ----------------
  // Pestaña "Aura" del Héroe: el aura se ve como queda y se sube con Esencia y oro
  function pintarTabAura() {
    const n = nivelAura(), c = costeAura(n);
    $('tabAura').innerHTML = `<div class="masc-actual"><div class="aura-vista"></div><h3><img class="ic-txt" src="img/iconos/mat_esencia.png" alt="">Aura Nv ${n}/${AURA_MAX}</h3>
      <div class="atributos" style="width:100%"><div><span>Bono</span><span>+${n * AURA_PCT} % a todo</span></div>
        ${n < AURA_MAX ? `<div><span>En Nv ${n + 1}</span><span>+${(n + 1) * AURA_PCT} % a todo</span></div>` : ''}</div>
      <div class="fila">${n < AURA_MAX ? `<button data-acc="subir" class="${tieneCoste(c) ? '' : 'sin-recursos'}">Subir · ${textoCoste(c)}</button>` : '<button disabled>Nivel máx.</button>'}</div>
      <small>Brilla más con cada nivel. La Esencia sale del contenido de nivel alto.</small></div>${htmlTitan()}`;
    pintarAura($('tabAura').querySelector('.aura-vista'), n);
  }
  // Modo Titán: nivel, lo que da y el siguiente nivel; se sube como el aura
  function htmlTitan() {
    const n = nivelTitan(); if (!n) return `<div class="masc-actual"><h3>⚡ Modo Titán</h3><small>🔒 Nivel ${nivelDesbloqueo('titan')}</small></div>`;
    const d = datosTitan(n), sig = n < TITAN_MAX ? datosTitan(n + 1) : null, D = DEFINITIVAS[jugador.clase], c = costeTitan(n);
    const fila = (t, x) => `<div><span>${t}</span><span>+${Math.round(x.extra * 100)} % daño · golpe ×${String(x.golpe).replace('.', ',')}${x.definitiva ? ` · ${D.icono}` : ''}</span></div>`;
    return `<div class="masc-actual"><h3>⚡ Modo Titán Nv ${n}/${TITAN_MAX}</h3>
      <div class="atributos" style="width:100%">${fila('Ahora', d)}${sig ? fila(`En Nv ${n + 1}`, sig) : ''}</div>
      <div class="fila">${sig ? `<button data-acc="titan" class="${tieneCoste(c) ? '' : 'sin-recursos'}">Subir · ${textoCoste(c)}</button>` : '<button disabled>Nivel máx.</button>'}</div>
      <small>${D.icono} ${D.nombre}: desde el Nv 5, una vez por activación.</small></div>`;
  }
  $('tabAura').addEventListener('click', e => {
    if (e.target.closest('[data-acc="titan"]')) {
      const c = costeTitan(nivelTitan());
      if (!tieneCoste(c)) return avisar(`Te falta: ${faltaCoste(c)}`);
      if (subirTitan()) { avisar(`⚡ Titán Nv ${nivelTitan()}`); guardar(); pintarHud(); pintarTabAura(); }
      return;
    }
    if (!e.target.closest('[data-acc="subir"]')) return;
    const c = costeAura(nivelAura());
    if (!tieneCoste(c)) return avisar(`Te falta: ${faltaCoste(c)}`);
    if (subirAura()) { avisar(`🌟 Aura Nv ${nivelAura()}`); guardar(); pintarHud(); pintarInventario(); }
  });
