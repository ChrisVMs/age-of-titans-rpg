  // ---------------- Recargas de estamina (pantalla) ----------------
  // Tocar la estamina del HUD abre las recargas: anuncios y cristales. Sin SDK de anuncios todavía, ui.verAnuncio da el
  // anuncio por visto (la app Android lo cambiará por el anuncio real).
  ui.verAnuncio ||= async () => true;
  // Sin tienda de pagos todavía: en modo pruebas la compra de cristales se da por pagada (gratis); fuera, no se puede.
  // La app Android lo cambiará por el pago real.
  ui.comprarPaquete ||= async () => MODO_PRUEBAS;
  function pintarRecargas() {
    abrirModal('comun', `<h2><img class="ic-txt" src="img/iconos/estamina.png" alt="">Estamina ${jugador.estamina}/${ESTAMINA_MAX}</h2>
      <button id="recAnuncio" ${anunciosQuedan() > 0 ? '' : 'disabled'}><img class="ic-txt" src="img/iconos/anuncio.png" alt="">Anuncio: +${ESTAMINA_ANUNCIO} <img class="ic-txt" src="img/iconos/estamina.png" alt="">(${anunciosQuedan()}/${ANUNCIOS_DIA})</button>
      <button id="recCristales" ${puedeRecargaCristales() ? '' : 'disabled'}><img class="ic-txt" src="img/iconos/cristales.png" alt="">${RECARGA_CRISTALES.coste}: +${RECARGA_CRISTALES.estamina} <img class="ic-txt" src="img/iconos/estamina.png" alt="">${revisarRecargas().cristales ? ' (mañana)' : ''}</button>
      <button id="recCerrar">Cerrar</button>`);
  }
  function pintarCompraOro() {
    abrirModal('comun', `<h2><img class="ic-txt" src="img/iconos/oro.png" alt="">Oro ${jugador.oro.toLocaleString('es')}</h2>
      ${CAMBIO_ORO.map((c, i) => `<button data-cambio-oro="${i}" ${(jugador.cristales || 0) < c.cristales ? 'disabled' : ''}><img class="ic-txt" src="img/iconos/cristales.png" alt="">${c.cristales} → <img class="ic-txt" src="img/iconos/oro.png" alt="">${oroDeCambio(c).toLocaleString('es')}</button>`).join('')}
      <button id="recCerrar">Cerrar</button>`);
  }
  function pintarCompraCristales() {
    abrirModal('comun', `<h2><img class="ic-txt" src="img/iconos/cristales.png" alt="">Cristales ${jugador.cristales || 0}</h2>
      ${PAQUETES_CRISTALES.map((p, i) => `<button data-paquete="${i}" ${MODO_PRUEBAS ? '' : 'disabled'}><img class="ic-txt" src="img/iconos/cristales.png" alt="">${p.cristales} · ${p.precio}</button>`).join('')}
      <small class="nota">${MODO_PRUEBAS ? 'Modo pruebas: la compra es gratis.' : 'Compra próximamente. Se consiguen con misiones, login, Ecos, colección y recompensas de ranking.'}</small>
      <button id="recCerrar">Cerrar</button>`);
  }
  document.addEventListener('click', async e => {
    if (e.target.closest('.hud .estamina, .recurso.estamina')) return pintarRecargas();
    if (e.target.closest('.hud .oro, .recurso.oro')) return pintarCompraOro();
    if (e.target.closest('.hud .cristales, .recurso.cristales')) return pintarCompraCristales();
    const pq = e.target.closest('[data-paquete]');
    if (pq && !pq.disabled) { pq.disabled = true; if (await ui.comprarPaquete(PAQUETES_CRISTALES[+pq.dataset.paquete]) && cobrarPaquete(+pq.dataset.paquete)) { avisar(`+${PAQUETES_CRISTALES[+pq.dataset.paquete].cristales} cristales`); guardar(); pintarHud(); } return pintarCompraCristales(); }
    const co = e.target.closest('[data-cambio-oro]');
    if (co && !co.disabled) { if (cambiarOro(+co.dataset.cambioOro)) { avisar('Oro comprado'); guardar(); pintarHud(); } return pintarCompraOro(); }
    const b = e.target.closest('#recAnuncio, #recCristales, #recCerrar'); if (!b || b.disabled) return;
    if (b.id === 'recCerrar') return cerrarModal();
    if (b.id === 'recAnuncio') { b.disabled = true; if (await ui.verAnuncio()) cobrarAnuncio(); }
    else recargarConCristales();
    guardar(); pintarHud(); pintarRecargas();
  });
