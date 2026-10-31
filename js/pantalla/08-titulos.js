  // ---------------- Títulos (pantalla) ----------------
  function pintarTabTitulos() {
    const tienes = TITULOS.filter(t => jugador.titulos[t.id]).length;
    $('tabTitulos').innerHTML = `<small>Tienes ${tienes} de ${TITULOS.length} títulos. Sus bonos se suman: ${textoBono(statsTitulos()) || 'ninguno aún'}. El elegido se muestra junto a tu nombre.</small>
      <div class="titulos" style="margin-top:8px">${TITULOS.map(t => {
        const ok = jugador.titulos[t.id], puesto = ok && jugador.titulo === t.id, [a, m] = t.prog();
        return `<div class="titulo-fila${ok ? '' : ' bloq'}${puesto ? ' puesto' : ''}" style="--tc:${RAREZA_TITULO[t.rareza]}">
          <div class="info"><b>${ok ? '' : '<img class="ic-txt" src="img/iconos/candado.png" alt="">'}${t.nombre}</b><small>${t.desc}${Object.keys(t.bono).length ? ` · <span class="bono">${textoBono(t.bono)}</span>` : ''}</small>
            ${ok ? '' : `<small>${Math.min(a, m)} / ${m}</small><div class="prog"><i style="width:${Math.min(100, a / m * 100)}%"></i></div>`}</div>
          ${ok ? `<button data-titulo="${puesto ? '' : t.id}">${puesto ? 'Quitar' : 'Mostrar'}</button>` : ''}</div>`;
      }).join('')}</div>`;
  }
  $('tabTitulos').addEventListener('click', e => {
    const b = e.target.closest('[data-titulo]'); if (!b) return;
    jugador.titulo = b.dataset.titulo || null; guardar(); pintarInventario();
  });
