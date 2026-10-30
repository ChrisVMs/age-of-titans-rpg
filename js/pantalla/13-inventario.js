  // ---------------- Inventario (pantalla) ----------------
  document.querySelector('.inv-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-invtab]'); if (!b) return;
    if (!desbloqueado(b.dataset.invtab)) return avisoBloqueo(b.dataset.invtab);
    invTab = b.dataset.invtab; pintarInventario();
  });
  function pintarPerfil() {
    const m = mascotaActual(), pct = jugador.xp / xpParaSubir(jugador.nivel) * 100;
    $('perfil').innerHTML = (editandoNombre
        ? `<div class="nombre-edit"><input id="nombreInput" maxlength="14" value="${jugador.nombre.replace(/"/g, '&quot;')}" aria-label="Tu nombre"><button id="guardarNombre" aria-label="Guardar">✔</button><button id="cancelarNombre" aria-label="Cancelar">✖</button></div>`
        : `<div class="nombre-jugador"><b>${jugador.nombre}</b><button id="editarNombre" aria-label="Editar nombre">✏️</button></div>`) +
      `${etiquetaTitulo(tituloActual())}<div><b>${iconoClase(jugador.clase)}${CLASES[jugador.clase].nombre}</b> · Nv ${jugador.nivel}</div><div class="xp"><i style="width:${pct}%"></i></div>
      <small>${jugador.xp} / ${xpParaSubir(jugador.nivel)} XP</small>
      <div class="masc">Mascota: ${m ? `<span style="font-size:22px">${m.hoja ? '' : m.cara}</span>${m.hoja ? dibujoMascota(m, .16) : ''} <b>${m.nombre}</b> Nv ${nivelMascota(m)}` : '<i>ninguna</i>'}</div>`;
  }
  $('perfil').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'editarNombre') { editandoNombre = true; pintarPerfil(); $('nombreInput').focus(); }
    else if (b.id === 'cancelarNombre') { editandoNombre = false; pintarPerfil(); }
    else if (b.id === 'guardarNombre') {
      const n = $('nombreInput').value.trim(), err = validarNombre(n);
      if (err) return avisar(err);
      jugador.nombre = n; editandoNombre = false; guardar(); pintarPerfil(); pintarCampamento(); avisar('Nombre guardado');
    }
  });
  function pintarTabMascota() {
    jugador.mascotas = jugador.mascotas || {};
    const m = mascotaActual(), propias = MASCOTAS.filter(x => nivelMascota(x) > 0);
    $('tabMascota').innerHTML = (m ? `<div class="masc-actual"><div class="cara" style="font-size:72px">${dibujoMascota(m, .5)}</div>
        <h3 style="margin:0;color:#e8b830">${m.nombre} · Nv ${nivelMascota(m)}</h3>
        <ul style="margin:0;font-size:13px">${bonosMascota(m, nivelMascota(m)).map(t => `<li>${t}</li>`).join('')}<li>${textoAccionMascota(m, nivelMascota(m))}</li></ul>
        <button data-masc-inv="quitar">Desequipar</button></div>`
      : `<div class="masc-actual"><i>Sin mascota equipada</i></div>`) +
      `<h3>Tus mascotas</h3>` +
      (propias.length ? `<div class="masc-lista">${propias.map(x => `<button class="item${x.id === jugador.mascota ? ' puesto' : ''}" data-masc-inv="${x.id}">
          <span class="cara">${dibujoMascota(x, .25)}</span><small>${x.nombre} · Nv ${nivelMascota(x)}</small></button>`).join('')}</div>`
        : '<small>No tienes mascotas. Cómpralas en la sección Mascota del menú.</small>');
  }
  $('tabMascota').addEventListener('click', e => {
    const b = e.target.closest('[data-masc-inv]'); if (!b) return;
    jugador.mascota = b.dataset.mascInv === 'quitar' ? null : b.dataset.mascInv;
    guardar(); pintarInventario();
  });
  function pintarInventario() {
    pintarPerfil(); pintarAura(document.querySelector('.vitrina'), nivelAura());
    document.querySelectorAll('.inv-tabs button').forEach(b => b.classList.toggle('on', b.dataset.invtab === invTab));
    $('tabObjetos').hidden = invTab !== 'objetos'; $('tabMascota').hidden = invTab !== 'mascota'; $('tabSkins').hidden = invTab !== 'skins'; $('tabTitulos').hidden = invTab !== 'titulos'; $('tabAura').hidden = invTab !== 'aura';
    if (invTab === 'titulos') { pintarTabTitulos(); if (jugador.tituloNuevo) { jugador.tituloNuevo = false; guardar(); } }
    if (invTab === 'mascota') pintarTabMascota();
    if (invTab === 'skins') pintarTabSkins();
    if (invTab === 'aura') pintarTabAura();
    const st = estadisticas();
    $('stats').innerHTML = `<div class="poder"><img class="ic-txt" src="img/iconos/poder.png" alt="">Poder<b>${poder(st).toLocaleString('es')}</b></div>`
      + Object.entries(ATRIBUTOS).map(([a, n]) => `<div>${n}<b>${st[a]}</b></div>`).join('')
      + Object.entries(SECUNDARIOS).map(([a, n]) => `<div class="sec">${n}<b>${textoEfecto(a)}</b></div>`).join('')
      + Object.entries(OTROS_EFECTOS).filter(([a]) => efecto(a) > 0).map(([a, n]) => `<div class="sec">${n}<b>${textoEfecto(a)}</b></div>`).join('');
    // materiales: cada uno en su propia casilla, solo aquí en el inventario
    $('mats').innerHTML = Object.entries(MATERIALES).map(([k, n]) => { const [ic, ...nom] = n.split(' ');
      return `<div class="item mat-slot" data-material="${k}"><span class="mat-ic">${ic}</span><b>${(jugador.mat[k] || 0).toLocaleString('es')}</b><small>${nom.join(' ')}</small></div>`; }).join('');
    $('ranuras').innerHTML = Object.entries(RANURAS).filter(([, d]) => !d.interna).map(([r, d]) => {
      const o = objeto(jugador.equipado[r]), m = modelo[o.modelo];
      return `<button class="item puesto r-${m.rareza}" data-uid="${o.uid}">${icono(m)}<b>${d.nombre}</b><small>${nombreObj(o)}</small></button>`;
    }).join('');
    const equipados = new Set(Object.values(jugador.equipado));
    // bolsa separada por tipo de pieza; el filtro deja ver solo una categoría
    const libres = jugador.objetos.filter(o => !equipados.has(o.uid))
      .sort((a, b) => ORDEN_RAREZA.indexOf(modelo[b.modelo].rareza) - ORDEN_RAREZA.indexOf(modelo[a.modelo].rareza) || (b.enc || 0) - (a.enc || 0));
    const deRanura = r => libres.filter(o => modelo[o.modelo].ranura === r);
    $('bolsaFiltros').innerHTML = ['todos', ...CATEGORIAS_BOLSA].map(r =>
      `<button data-filtro="${r}" class="${r === filtroBolsa ? 'on' : ''}" title="${r === 'todos' ? 'Todo' : RANURAS[r].nombre}">${iconoFiltro(r)} <small>${r === 'todos' ? libres.length : deRanura(r).length}</small></button>`).join('');
    $('bolsa').innerHTML = (filtroBolsa === 'todos' ? CATEGORIAS_BOLSA : [filtroBolsa]).map(r => {
      const lista = deRanura(r);
      return `<h4 class="cat-bolsa">${RANURAS[r].nombre} (${lista.length})</h4><div class="bolsa">${lista.map(o => { const m = modelo[o.modelo];
        return `<button class="item r-${m.rareza}" data-uid="${o.uid}">${icono(m)}<small>${nombreObj(o)}</small></button>`; }).join('')
        || '<small>Sin piezas de este tipo. Abre cofres en la Tienda.</small>'}</div>`;
    }).join('');
  }
  $('bolsaFiltros').addEventListener('click', e => {
    const b = e.target.closest('[data-filtro]'); if (!b) return;
    filtroBolsa = b.dataset.filtro; pintarInventario();
  });
  document.querySelector('.inv-listas').addEventListener('click', e => {
    const b = e.target.closest('button[data-uid]'); if (b) mostrarObjeto(+b.dataset.uid);
  });
  $('pBolsa').addEventListener('click', e => { const b = e.target.closest('button[data-uid]'); if (b) mostrarObjeto(+b.dataset.uid); });
  function abrirModal(rareza, html) {
    const caja = $('detCaja');
    caja.className = 'caja r-' + rareza; caja.innerHTML = html;
    $('detalle').classList.add('visible');
  }
  const cerrarModal = () => $('detalle').classList.remove('visible');
  $('detalle').addEventListener('click', e => { if (e.target.id === 'detalle' && !modalFijo) cerrarModal(); });
  function mostrarObjeto(uid, titulo) {
    const o = objeto(uid), m = modelo[o.modelo], r = RAREZAS[m.rareza];
    const actual = objeto(jugador.equipado[m.ranura]), puesto = actual.uid === uid;
    abrirModal(m.rareza, `
      ${titulo ? `<div class="recompensa">${titulo}</div>` : ''}
      <span class="icono ${titulo ? 'brillo' : ''}" style="background-image:url(${RANURAS[m.ranura].icono});filter:${m.color || 'none'}"></span>
      <h2>${nombreObj(o)}</h2><div class="rareza">${r.nombre} · ${RANURAS[m.ranura].nombre} · ${etiquetaCalidad(o)}</div>
      <div class="atributos">${lineasHtml(o)}</div>
      <div class="atributos">${filasTotales(valores(o), puesto ? null : valores(actual))}</div>
      ${puesto ? '<small>Equipado</small>' : `<small>Total comparado con: ${modelo[actual.modelo].nombre}${actual.enc ? ' +' + actual.enc : ''}</small>`}
      <div class="fila">${puesto ? '' : `<button data-acc="equipar">Equipar</button>${almasDe(o) ? `<button data-acc="desguazar">Desguazar 💠${almasDe(o)}</button>` : `<button data-acc="vender">Vender ● ${r.venta}</button>`}`}</div>
      <div class="fila"><button data-acc="herreria">Herrería</button><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = async e => {
      const acc = e.target.closest('button')?.dataset.acc; if (!acc) return;
      if (acc === 'equipar') { jugador.equipado[m.ranura] = uid; guardar(); aplicarEquipo(); }
      if (acc === 'vender') { jugador.objetos = jugador.objetos.filter(x => x.uid !== uid); ganar(r.venta, 0); pintarInventario(); }
      if (acc === 'desguazar') {
        if ((o.enc || 0) >= 5 && !await confirmar(`¿Desguazar ${modelo[o.modelo].nombre} +${o.enc}?`)) return;
        const d = desguazar([o]); avisar(`💠 +${d.almas} polvo de almas`); guardar(); pintarHud(); pintarInventario();
      }
      if (acc === 'herreria') { herSel = uid; herTab = 'encantar'; ir('pHerreria'); }
      cerrarModal();
    };
  }
