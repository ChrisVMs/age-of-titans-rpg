  // ---------------- Ruinas del campamento (pantalla) ----------------
  function pintarRuinas() {
    const p = produccionRuinas(), lleno = Math.round(llenadoRuinas() * 100), hayAlgo = Object.values(p).some(v => v >= 1);
    $('ruinas').innerHTML = `<div class="liga"><span class="ic">🏚️</span><div><b>Almacén ${lleno} %</b>
        <br><small>Producen aunque no juegues · caben ${horasAlmacen()} h</small></div></div>
      <button id="recogerRuinas" ${hayAlgo ? '' : 'disabled'}>Recoger ${hayAlgo ? textoPremio(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Math.floor(v)]))) : ''}</button>
      ${EDIFICIOS.map(e => {
        const n = nivelEdificio(e.id), abierto = edificioAbierto(e), c = costeEdificio(n), m = Math.max(1, n), r1 = v => Math.round(v * 10) / 10;
        const prod = Object.entries(e.prod).map(([k, f]) => `${ICONO_PREMIO[k]} ${r1(f(m) * 24).toLocaleString('es')}/día`).join(' ');
        const bono = e.bono.st ? `+${r1(e.bono.pct * m)} % ${e.txt}` : e.bono.oro ? `+${r1(e.bono.oro * m * 100)} % ${e.txt}`
          : e.bono.encantar ? `−${Math.round(e.bono.encantar * m * 100)} % oro al encantar` : e.bono.almacen ? `+${r1(e.bono.almacen * m)} ${e.txt}` : '';
        return `<div class="mision${abierto ? '' : ' hecha'}"><span style="font-size:24px">${n ? e.icono : '🏚️'}</span>
          <div class="info">${e.nombre}${n ? ` · Nv ${n}/${EDIFICIO_MAX}` : ''}<small>${[prod, bono].filter(Boolean).join(' · ')}</small></div>
          ${!abierto ? `<small><img class="ic-txt" src="img/iconos/candado.png" alt="">Nv ${e.nivel}</small>` : n >= EDIFICIO_MAX ? '<button disabled>Máx.</button>'
            : `<button data-edificio="${e.id}" ${tieneCoste(c) ? '' : 'disabled'}>${n ? 'Mejorar' : 'Reconstruir'}<br><small>${textoPremio(c)}</small></button>`}</div>`;
      }).join('')}`;
  }
  $('ruinas').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.id === 'recogerRuinas') avisar(textoPremio(recogerRuinas()));
    if (b.dataset.edificio && mejorarEdificio(b.dataset.edificio)) { const ed = EDIFICIOS.find(x => x.id === b.dataset.edificio); avisar(`${ed.icono} ${ed.nombre} Nv ${nivelEdificio(ed.id)}`); }
    guardar(); pintarHud(); pintarRuinas();
  });
