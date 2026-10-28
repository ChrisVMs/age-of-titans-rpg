  // ---------------- Herrería (pantalla) ----------------
  function pintarHerreria() {
    const equipados = new Set(Object.values(jugador.equipado));
    // lista separada por tipo de pieza (lo equipado primero en cada una), con el mismo filtro que el inventario
    const todos = [...jugador.objetos]
      .sort((a, b) => equipados.has(b.uid) - equipados.has(a.uid) || ORDEN_RAREZA.indexOf(modelo[b.modelo].rareza) - ORDEN_RAREZA.indexOf(modelo[a.modelo].rareza) || (b.enc || 0) - (a.enc || 0));
    const deRanura = r => todos.filter(o => modelo[o.modelo].ranura === r);
    $('herFiltros').innerHTML = ['todos', ...CATEGORIAS_BOLSA].map(r =>
      `<button data-filtro="${r}" class="${r === filtroHer ? 'on' : ''}" ${candidato ? 'disabled' : ''} title="${r === 'todos' ? 'Todo' : RANURAS[r].nombre}">${iconoFiltro(r)} <small>${r === 'todos' ? todos.length : deRanura(r).length}</small></button>`).join('');
    $('herLista').innerHTML = (filtroHer === 'todos' ? CATEGORIAS_BOLSA : [filtroHer]).map(r => {
      const lista = deRanura(r);
      return `<h4 class="cat-bolsa">${RANURAS[r].nombre} (${lista.length})</h4><div class="bolsa">${lista.map(o => { const m = modelo[o.modelo];
        return `<button class="item r-${m.rareza}${equipados.has(o.uid) ? ' puesto' : ''}${o.uid === herSel ? ' sel-her' : ''}" data-uid="${o.uid}">${icono(m)}<small>${nombreObj(o)}</small></button>`; }).join('')
        || '<small>Sin piezas de este tipo.</small>'}</div>`;
    }).join('');
    const o = herSel && objeto(herSel), panel = $('herPanel');
    if (!o) { panel.className = 'caja her-panel'; panel.innerHTML = ''; return; }
    const m = modelo[o.modelo], r = RAREZAS[m.rareza], max = encMax(o);
    panel.className = 'caja her-panel r-' + m.rareza;
    let cuerpo;
    if (herTab === 'encantar') {
      const c = costeEncantar(o, bendecir);
      cuerpo = o.enc >= max ? `<p class="enc">¡Encantamiento máximo (+${max})!</p>` : `
        <p><span class="enc">+${o.enc}</span> → <span class="enc">+${o.enc + 1}</span> (máx. +${max}) · éxito <b>${c.prob}%</b>
          ${probEncantar(o.enc) < 100 ? `<br><small class="proteccion">🍀 Protección: ${o.fallos ? `+${Math.min(100 - probEncantar(o.enc), bonoProteccion(probEncantar(o.enc), o.fallos))} % por ${o.fallos} fallo${o.fallos > 1 ? 's' : ''} seguido${o.fallos > 1 ? 's' : ''} · ` : ''}garantizado tras ${garantiaEnc(probEncantar(o.enc))} fallos seguidos</small>` : ''}
          ${degradaAl(o.enc) && !bendecir ? `<br><span class="falta">Si falla, ${PROB_DEGRADAR * 100} % de bajar a +${o.enc - 1}</span>` : ''}</p>
        <div class="fila"><button data-acc="encantar" class="${tieneCoste(c) ? '' : 'sin-recursos'}">Encantar · ${textoCoste(c)}</button></div>
        <label class="bendicion"><input type="checkbox" id="bendecir" ${bendecir ? 'checked' : ''}> Bendición: +${BENDICION}% de éxito y no se degrada</label>
        <div class="atributos">${filasTotales(valores(o, o.enc + 1), valores(o))}</div>`;
    } else {
      cuerpo = `
        <small>Elige una línea. <b>Refinar</b> sortea atributo y estrellas; <b>Pulir</b> mantiene el atributo y solo sortea las estrellas.
          <span class="proteccion">🍀 ★4+ garantizada en ${GARANTIA_REFINAR - (o.sinBuena || 0)} sorteo${GARANTIA_REFINAR - (o.sinBuena || 0) > 1 ? 's' : ''}</span></small>
        <div class="lineas">${o.lineas.map((l, i) => `<button data-linea="${i}" class="${i === lineaSel ? 'sel' : ''}" ${candidato ? 'disabled' : ''}><span>${nombreAtr(l.a)} ${estrellas(l.e)}</span><span>+${fmtAtr(l.a, valorLinea(o, l))}</span></button>`).join('')}</div>
        ${candidato ? `
          <div class="atributos"><div><span>Nuevo: ${nombreAtr(candidato.a)} ${estrellas(candidato.e)}</span><span>+${fmtAtr(candidato.a, valorLinea(o, candidato))}</span></div></div>
          <div class="fila"><button data-acc="aceptar">Aceptar</button><button data-acc="descartar">Descartar</button></div>` : `
          <div class="fila"><button data-acc="refinar" class="${tieneCoste(COSTE_REFINAR) ? '' : 'sin-recursos'}">Refinar<br><small>${textoCoste(COSTE_REFINAR)}</small></button>
            <button data-acc="pulir" class="${tieneCoste(COSTE_PULIR) ? '' : 'sin-recursos'}" ${o.lineas[lineaSel].e < 5 ? '' : 'disabled'}>Pulir ★<br><small>${textoCoste(COSTE_PULIR)}</small></button></div>`}`;
    }
    panel.innerHTML = `
      <span class="icono" style="background-image:url(${RANURAS[m.ranura].icono});filter:${m.color || 'none'}"></span>
      <h2>${nombreObj(o)}</h2>
      <div class="atributos">${lineasHtml(o)}</div>
      <div class="tabs">${[['encantar', 'Encantar'], ['refinar', 'Refinar']].map(([t, n]) =>
        `<button data-tab="${t}" class="${t === herTab ? 'on' : ''}" ${candidato ? 'disabled' : ''}>${n}</button>`).join('')}</div>
      ${cuerpo}`;
  }
  $('convertirAlmas').onclick = async () => {
    const n = Math.min(10, Math.floor(jugador.mat.piedra / CONVERTIR_ALMA.piedra), Math.floor(jugador.oro / CONVERTIR_ALMA.oro));
    if (n < 1) return avisar(`Hacen falta 🔷 ${CONVERTIR_ALMA.piedra} y ● ${CONVERTIR_ALMA.oro} por alma`);
    if (!await confirmar(`¿Convertir 🔷 ${n * CONVERTIR_ALMA.piedra} piedras y ● ${n * CONVERTIR_ALMA.oro} en 💠 ${n} almas?`)) return;
    jugador.mat.piedra -= n * CONVERTIR_ALMA.piedra; jugador.oro -= n * CONVERTIR_ALMA.oro; jugador.mat.almas += n;
    guardar(); pintarHud(); pintarHerreria(); avisar(`💠 +${n} almas`);
  };
  $('desguaceRapido').onclick = async () => {
    const eq = new Set(Object.values(jugador.equipado));
    const lista = jugador.objetos.filter(o => !eq.has(o.uid) && !(o.enc > 0) && ['comun', 'rara'].includes(modelo[o.modelo].rareza));
    if (!lista.length) { avisar('No hay comunes ni raras sin encantar'); return; }
    if (!await confirmar(`¿Desguazar ${lista.length} objetos comunes y raras sin encantar?`)) return;
    const d = desguazar(lista); herSel = null; avisar(`💠 +${d.almas} almas · ● +${d.oro}`); guardar(); pintarHud(); pintarHerreria(); pintarInventario();
  };
  $('herFiltros').addEventListener('click', e => {
    const b = e.target.closest('[data-filtro]'); if (!b || b.disabled) return;
    filtroHer = b.dataset.filtro; pintarHerreria();
  });
  $('herLista').addEventListener('click', e => {
    const b = e.target.closest('[data-uid]'); if (!b || candidato) return;
    herSel = +b.dataset.uid; lineaSel = 0; pintarHerreria();
  });
  $('herPanel').addEventListener('change', e => { if (e.target.id === 'bendecir') { bendecir = e.target.checked; pintarHerreria(); } });
  $('herPanel').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const o = objeto(herSel);
    if (b.dataset.tab && !desbloqueado(b.dataset.tab)) return avisoBloqueo(b.dataset.tab);
    if (b.dataset.tab) { herTab = b.dataset.tab; lineaSel = 0; return pintarHerreria(); }
    if (b.dataset.linea) { lineaSel = +b.dataset.linea; return pintarHerreria(); }
    const acc = b.dataset.acc;
    // sin recursos: aviso breve que no tapa la pantalla (en vez de un botón desactivado sin explicación)
    const costeAcc = { encantar: () => costeEncantar(o, bendecir), refinar: () => COSTE_REFINAR, pulir: () => COSTE_PULIR }[acc];
    if (costeAcc && !tieneCoste(costeAcc())) {   // qué falta, con su nombre, y al tocar el aviso de un material se explica dónde conseguirlo
      const c = costeAcc(), mat = Object.keys(MATERIALES).find(k => c[k] && jugador.mat[k] < c[k]);
      return mat ? mensaje(`Te falta: ${faltaCoste(c)}

Fuente: ${INFO_MATERIALES[mat].fuente}`) : avisar(`Te falta: ${faltaCoste(c)}`);
    }
    if (acc === 'encantar') { const r = encantar(o, bendecir); avisar(r === 'exito' ? `¡Éxito! +${o.enc}` : r === 'baja' ? `Falló: baja a +${o.enc}` : 'El encantamiento falló'); }
    if (acc === 'refinar') candidato = refinar(o);
    if (acc === 'pulir') candidato = pulirLinea(o, lineaSel);
    if (acc === 'aceptar') { o.lineas[lineaSel] = candidato; candidato = null; }
    if (acc === 'descartar') candidato = null;
    guardar(); pintarHud(); pintarHerreria(); pintarInventario();
  });
