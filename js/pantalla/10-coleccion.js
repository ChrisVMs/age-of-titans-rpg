  // ---------------- Colección (pantalla) ----------------
  function pintarColeccion() {
    const marcos = marcosDisponibles();
    $('coleccion').innerHTML = `<small class="nota">Cada entrada conseguida te da un bono permanente; completar una colección da un bono extra.</small>` +
      (marcos.length ? `<div class="marcos">Marco: ${[null, ...marcos].map(id => `<button data-marco="${id || ''}" class="${(marcoActual() || null) === id ? 'on' : ''}">${id ? MARCOS[id] : 'Ninguno'}</button>`).join('')}</div>` : '') +
      COLECCIONES.filter(colVisible).map(c => { const e = c.entradas(), [ok, tot] = progresoColeccion(c), base = Object.fromEntries(Object.entries(c.porEntrada).map(([a, v]) => [a, v * ok]));
        return `<div class="coleccion"><h3>${c.nombre} · ${ok}/${tot}</h3><small class="nota">${c.desc}</small>
          <div class="bono">Ahora: ${ok ? textoBonos(base) : '—'} (+${Object.values(c.porEntrada)[0]} % ${ATRIBUTOS[Object.keys(c.porEntrada)[0]].toLowerCase()} por entrada)</div>
          ${Object.keys(c.completa).length ? `<div class="bono${ok >= tot ? ' listo' : ''}">${ok >= tot ? '✔' : '<img class="ic-txt" src="img/iconos/candado.png" alt="">'} Completa: ${textoBonos({}, c.completa)}</div>` : ''}
          <div class="hitos-col">${HITOS_COLECCION.map(h => { const listo = pctColeccion(c) >= h.pct, cob = hitoCobrado(c.id, h.pct);
            return `<button data-hito="${c.id}:${h.pct}" class="${cob ? 'hecha' : listo ? 'lista-m' : ''}" ${listo && !cob ? '' : 'disabled'}>${cob ? '✔' : h.pct + ' %'}<small>${textoPremio(h.premio)}${h.pct === 100 ? ' · marco' : ''}</small></button>`; }).join('')}</div>
          <div class="rejilla" style="margin-top:6px">${e.map(x => `<div class="item${x.ok ? '' : ' bloq'}"><span style="font-size:26px">${x.ok ? x.icono : '❓'}</span><small>${x.ok ? x.nombre : '???'}</small>${x.extra ? `<b>${x.extra}</b>` : ''}</div>`).join('')}</div></div>`;
      }).join('');
  }
  $('coleccion').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.hito) { const [id, p] = b.dataset.hito.split(':'), pr = reclamarHito(id, +p); if (pr) avisar(+p === 100 ? `🖼️ Marco ${MARCOS[id]}` : textoPremio(pr)); }
    if ('marco' in b.dataset) ponerMarco(b.dataset.marco || null);
    guardar(); pintarHud(); pintarColeccion();
  });
