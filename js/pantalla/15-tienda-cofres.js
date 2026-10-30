  // ---------------- Tienda: cofres (pantalla) ----------------
  function pintarTiendaSkins() {
    jugador.skinsPropias = jugador.skinsPropias || {};
    $('tiendaSkins').innerHTML = SKINS.map(k => { const n = estrellasSkin(k.id);
      return `<div class="cofre" style="border-color:${k.color}"><h3 style="color:${k.color}">${k.icono} ${k.nombre}</h3>
        <img src="${k.img}" alt="" style="height:96px;image-rendering:pixelated">
        <small>+${k.base[1]}% ${ATRIBUTOS[k.base[0]]} por ★ · ${k.menos ? '−' : '+'}${k.valor}% ${k.txt}</small>
        ${n ? `<button disabled>Comprada ${textoEstrellas(n)}</button>` : `<button data-comprar-skin="${k.id}" ${jugador.oro < PRECIO_SKIN ? 'disabled' : ''}>Comprar ● ${PRECIO_SKIN}</button>`}</div>`; }).join('');
  }
  $('tiendaSkins').addEventListener('click', e => {
    const b = e.target.closest('[data-comprar-skin]'); if (!b || jugador.oro < PRECIO_SKIN) return;
    comprarSkin(SKINS.find(x => x.id === b.dataset.comprarSkin)); guardar(); pintarHud(); pintarTiendaSkins();
    avisar(`¡${k.nombre} comprada!`);
  });
  document.querySelector('.tienda-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tiendatab]'); if (!b) return;
    tiendaTab = b.dataset.tiendatab; pintarTienda();
  });
  function pintarTienda() {
    document.querySelectorAll('.tienda-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tiendatab === tiendaTab));
    $('cofres').hidden = tiendaTab !== 'cofres'; $('tiendaSkins').hidden = tiendaTab !== 'skins';
    pintarTiendaSkins();
    $('cofres').innerHTML = COFRES.map(c => `
      <div class="cofre"><h3>${c.nombre}</h3><div class="img" style="filter:${c.filtro || 'none'}"></div>
        <div class="probs">${Object.entries(c.probs).filter(([, p]) => p).map(([r, p]) =>
          `<div class="r-${r}"><span>${RAREZAS[r].nombre}</span><span>${p}%</span></div>`).join('')}</div>
        <div class="fila-cofre">
          <button data-cofre="${c.id}" data-n="1" ${jugador.oro < c.precio ? 'disabled' : ''}>Abrir ● ${c.precio}</button>
          <button data-cofre="${c.id}" data-n="10" ${jugador.oro < c.precio * 10 ? 'disabled' : ''}>x10 ● ${c.precio * 10}</button>
        </div></div>`).join('');
  }
  $('cofres').addEventListener('click', e => {
    const b = e.target.closest('[data-cofre]'); if (!b) return;
    const c = COFRES.find(x => x.id === b.dataset.cofre), n = +b.dataset.n;
    if (jugador.oro < c.precio * n) return;
    jugador.oro -= c.precio * n; sumarLogro('cofres', n); contarMision('cofres', n);
    const nuevos = Array.from({ length: n }, () => abrirCofre(c));
    guardar(); pintarHud(); pintarTienda(); pintarInventario();
    if (n === 1) return mostrarObjeto(nuevos[0].uid, `¡${c.nombre} abierto!`);
    // x10: resumen ordenado de mejor a peor; tocar uno abre su ficha
    nuevos.sort((a, b) => ORDEN_RAREZA.indexOf(modelo[b.modelo].rareza) - ORDEN_RAREZA.indexOf(modelo[a.modelo].rareza));
    const mejor = modelo[nuevos[0].modelo].rareza;
    abrirModal(mejor, `<div class="recompensa">¡10 ${c.nombre.toLowerCase()}s abiertos!</div>
      <div class="bolsa">${nuevos.map(o => { const m = modelo[o.modelo];
        return `<button class="item r-${m.rareza} brillo" data-uid="${o.uid}">${icono(m)}<small>${m.nombre}</small></button>`; }).join('')}</div>
      <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = ev => {
      const it = ev.target.closest('[data-uid]'); if (it) return mostrarObjeto(+it.dataset.uid);
      if (ev.target.closest('[data-acc]')) cerrarModal();
    };
  });

  $('campLogin').onclick = () => abrirLogin();
  // pruebas: "Día X +" pasa al día siguiente (reinicia lo diario; lo semanal, al cumplirse la semana)
  $('diaPrueba').textContent = `Día ${offsetDias + 1}`;
  $('sumarDia').onclick = () => { if (!MODO_PRUEBAS) return; try { localStorage.setItem(DIA_PRUEBA, offsetDias + 1); } catch {} guardar(); location.reload(); };
  $('navBatalla').onclick = () => $('modoBatalla').classList.add('visible');
  $('cerrarModoBatalla').onclick = () => $('modoBatalla').classList.remove('visible');
  $('modoBatalla').addEventListener('click', e => { const b = e.target.closest('[data-modo-batalla]'); if (!b) return;
    if (!desbloqueado(b.dataset.modoBatalla)) return avisoBloqueo(b.dataset.modoBatalla);
    $('modoBatalla').classList.remove('visible'); ir(b.dataset.modoBatalla); });
  $('abrirPruebas').onclick = () => $('pruebasMenu').classList.add('visible');
  $('cerrarPruebas').onclick = () => $('pruebasMenu').classList.remove('visible');
  $('campTitulos').onclick = () => { invTab = 'titulos'; ir('pInventario'); };
  $('oroPrueba').onclick = () => { ganar(10000, 0); avisar('+10 000 oro'); };
  $('matPrueba').onclick = () => { darPremio({ piedra: 200, polvo: 50, almas: 50, esencia: 100, cristales: 100 }); guardar(); pintarHud(); avisar('🔷 200 · ✨ 50 · 💠 50 · 🌟 100 · 💎 100'); };
  // estamina, jefes mundiales, Torre de reyes, arena, calabozo, Grieta, recargas y reto del Eco: todo de nuevo como al empezar el día
  $('entradasPrueba').onclick = () => {
    jugador.estamina = ESTAMINA_MAX; jugador.mundiales = {}; delete jugador.mundial; jugador.entradasJefe = ENTRADAS_JEFE;
    const R = revisarReyes(); R.entradas = INTENTOS_REYES; R.vencidas = {};
    const a = revisarArena(); a.entradas = ARENA_ENTRADAS; generarRivales();
    revisarCalabozo().entradas = INTENTOS_CALABOZO; Object.assign(revisarRecargas(), { anuncios: 0, cristales: false });
    const G = revisarGrieta(); if (!G.activa) G.intentos = GRIETA_INTENTOS; revisarEcos().hecho = false;
    guardar(); pintarHud(); pintarCampamento(); avisar('Estamina y entradas al máximo');
  };
  $('resetPrueba').onclick = async () => {   // partida nueva desde cero (conserva el nombre), sin oro ni materiales
    if (!await confirmar('¿Reiniciar el personaje? Vuelve al nivel 1 sin oro, materiales ni progreso. No se puede deshacer.', 'Reiniciar', 'Cancelar')) return;
    const clase = await elegirOpcion('Elige tu clase', Object.entries(CLASES).map(([id, c]) => ({ id, texto: `${c.icono} ${c.nombre}` })));
    const nombre = jugador.nombre; jugador = partidaNueva(); jugador.nombre = nombre; jugador.clase = clase; jugador.arbol = {}; jugador.oro = 0;
    for (const k in jugador.mat) jugador.mat[k] = 0;
    // si el juego está abierto en otra pestaña, se bloquea (si no, volvería a guardar encima la partida vieja)
    if (canalPestanas) canalPestanas.postMessage({ t: 'tomar', id: idPestana });
    pestanaBloqueada = false; guardar(); location.reload();
  };
  function pintarPerfilesPrueba() {
    let hay = false; try { hay = !!localStorage.getItem(CLAVE_RESPALDO); } catch {}
    $('perfilesPrueba').innerHTML = `<small>Jugar con la partida de un bot:</small> ${DEF_BOTS.map((d, i) => `<button class="prueba" data-bot="${i}">${iconoClase(d.clase)}${d.nombre}</button>`).join('')}
      ${hay ? '<button class="prueba" data-bot="volver">↩ Volver a mi partida</button>' : ''}`;
  }
  $('perfilesPrueba').addEventListener('click', e => {
    const b = e.target.closest('[data-bot]'); if (!b) return;
    try {
      if (b.dataset.bot === 'volver') { localStorage.setItem(CLAVE, localStorage.getItem(CLAVE_RESPALDO)); localStorage.removeItem(CLAVE_RESPALDO); }
      else {
        if (!jugador.bot) localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(jugador));   // solo se respalda tu partida real
        const bot = JSON.parse(JSON.stringify(bots()[+b.dataset.bot])); bot.sigUid = 990000;
        localStorage.setItem(CLAVE, JSON.stringify(bot));
      }
    } catch { avisar('No se pudo cambiar de perfil'); return; }
    location.reload();
  });
  $('abrirPruebas').addEventListener('click', pintarPerfilesPrueba);
  $('puntosPrueba').onclick = () => { jugador.puntosExtra = (jugador.puntosExtra || 0) + 5; guardar(); pintarCampamento(); avisar('+5 puntos de habilidad'); };
  // la fila de pruebas en batalla está oculta salvo que se active aquí (se recuerda)
  const ponerPruebasBatalla = on => { document.documentElement.classList.toggle('con-pruebas-batalla', on); $('pruebasBatalla').checked = on;
    try { localStorage.setItem('batalla.pruebasBatalla', on ? '1' : ''); } catch {} };
  $('pruebasBatalla').onchange = e => ponerPruebasBatalla(e.target.checked);
  const ponerSinRecarga = on => { sinRecarga = on; $('sinRecarga').checked = on;
    if (on) HABILIDADES.forEach(h => batalla.carga[h.id] = h.turnos);
    try { localStorage.setItem('batalla.sinRecarga', on ? '1' : ''); } catch {} };
  $('sinRecarga').onchange = e => { ponerSinRecarga(e.target.checked); if (batalla.carga) pintarEspecial(); };
  try { ponerSinRecarga(!!localStorage.getItem('batalla.sinRecarga')); } catch { ponerSinRecarga(false); }
  const pintarOrientacion = () => { $('btnOrientacion').textContent = ICONO_ORIENTACION[orientacion];
    $('btnOrientacion').setAttribute('aria-label', `Pantalla: ${orientacion}`); };
  $('btnOrientacion').onclick = () => {
    orientacion = ORIENTACIONES[(ORIENTACIONES.indexOf(orientacion) + 1) % ORIENTACIONES.length];
    try { localStorage.setItem('batalla.orientacion', orientacion); } catch {}
    pintarOrientacion(); bloquearOrientacion(); avisar(`Pantalla: ${orientacion}`);
    dispatchEvent(new Event('resize'));   // reajusta lienzo, escala de batalla y UI
  };
  pintarOrientacion();
  try { ponerPruebasBatalla(!!localStorage.getItem('batalla.pruebasBatalla')); } catch { ponerPruebasBatalla(false); }

  montarGuerrero($('vitrina'));
  montarGuerrero($('campGuerrero'));
  montarGuerrero(document.querySelector('#s1 .frames'));
  aplicarEquipo();
  pintarHud();
