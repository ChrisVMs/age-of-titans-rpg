  // ---------------- Colección (pantalla) ----------------
  function pintarColeccion() {
    $('coleccion').innerHTML = `<small class="nota">Cada entrada conseguida te da un bono permanente; completar una colección da un bono extra.</small>` +
      COLECCIONES.map(c => { const e = c.entradas(), [ok, tot] = progresoColeccion(c), base = Object.fromEntries(Object.entries(c.porEntrada).map(([a, v]) => [a, v * ok]));
        return `<div class="coleccion"><h3>${c.nombre} · ${ok}/${tot}</h3><small class="nota">${c.desc}</small>
          <div class="bono">Ahora: ${ok ? textoBonos(base) : '—'} (+${Object.values(c.porEntrada)[0]} % ${ATRIBUTOS[Object.keys(c.porEntrada)[0]].toLowerCase()} por entrada)</div>
          <div class="bono${ok >= tot ? ' listo' : ''}">${ok >= tot ? '✔' : '🔒'} Completa: ${textoBonos({}, c.completa)}</div>
          <div class="rejilla" style="margin-top:6px">${e.map(x => `<div class="item${x.ok ? '' : ' bloq'}"><span style="font-size:26px">${x.ok ? x.icono : '❓'}</span><small>${x.ok ? x.nombre : '???'}</small>${x.extra ? `<b>${x.extra}</b>` : ''}</div>`).join('')}</div></div>`;
      }).join('');
  }
