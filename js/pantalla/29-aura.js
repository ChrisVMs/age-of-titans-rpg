  // ---------------- Aura (pantalla) ----------------
  // Pestaña "Aura" del Héroe: el aura se ve como queda y se sube con Esencia y oro
  function pintarTabAura() {
    const n = nivelAura(), c = costeAura(n);
    $('tabAura').innerHTML = `<div class="masc-actual"><div class="aura-vista"></div><h3>🌟 Aura Nv ${n}/${AURA_MAX}</h3>
      <div class="atributos" style="width:100%"><div><span>Bono</span><span>+${n * AURA_PCT} % a todo</span></div>
        ${n < AURA_MAX ? `<div><span>En Nv ${n + 1}</span><span>+${(n + 1) * AURA_PCT} % a todo</span></div>` : ''}</div>
      <div class="fila">${n < AURA_MAX ? `<button data-acc="subir" class="${tieneCoste(c) ? '' : 'sin-recursos'}">Subir · ${textoCoste(c)}</button>` : '<button disabled>Nivel máx.</button>'}</div>
      <small>Brilla más con cada nivel. La Esencia sale del contenido de nivel alto.</small></div>`;
    pintarAura($('tabAura').querySelector('.aura-vista'), n);
  }
  $('tabAura').addEventListener('click', e => {
    if (!e.target.closest('[data-acc="subir"]')) return;
    const c = costeAura(nivelAura());
    if (!tieneCoste(c)) return avisar(`Te falta: ${faltaCoste(c)}`);
    if (subirAura()) { avisar(`🌟 Aura Nv ${nivelAura()}`); guardar(); pintarHud(); pintarInventario(); }
  });
