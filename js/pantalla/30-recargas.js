  // ---------------- Recargas de estamina (pantalla) ----------------
  // Tocar la estamina del HUD abre las recargas: anuncios y cristales. Sin SDK de anuncios todavía, ui.verAnuncio da el
  // anuncio por visto (la app Android lo cambiará por el anuncio real).
  ui.verAnuncio ||= async () => true;
  function pintarRecargas() {
    abrirModal('comun', `<h2><img class="ic-txt" src="img/iconos/estamina.png" alt="">Estamina ${jugador.estamina}/${ESTAMINA_MAX}</h2>
      <button id="recAnuncio" ${anunciosQuedan() > 0 ? '' : 'disabled'}><img class="ic-txt" src="img/iconos/anuncio.png" alt="">Anuncio: +${ESTAMINA_ANUNCIO} <img class="ic-txt" src="img/iconos/estamina.png" alt="">(${anunciosQuedan()}/${ANUNCIOS_DIA})</button>
      <button id="recCristales" ${puedeRecargaCristales() ? '' : 'disabled'}><img class="ic-txt" src="img/iconos/cristales.png" alt="">${RECARGA_CRISTALES.coste}: +${RECARGA_CRISTALES.estamina} <img class="ic-txt" src="img/iconos/estamina.png" alt="">${revisarRecargas().cristales ? ' (mañana)' : ''}</button>
      <button id="recCerrar">Cerrar</button>`);
  }
  document.addEventListener('click', async e => {
    if (e.target.closest('.hud .estamina, .recurso.estamina')) return pintarRecargas();
    const b = e.target.closest('#recAnuncio, #recCristales, #recCerrar'); if (!b || b.disabled) return;
    if (b.id === 'recCerrar') return cerrarModal();
    if (b.id === 'recAnuncio') { b.disabled = true; if (await ui.verAnuncio()) cobrarAnuncio(); }
    else recargarConCristales();
    guardar(); pintarHud(); pintarRecargas();
  });
