  const $ = id => document.getElementById(id);
  if (!MODO_PRUEBAS) document.documentElement.classList.add('sin-pruebas');
  function ajustarLienzo() {
    const W = innerWidth, H = innerHeight, b = document.body;
    const girar = orientacion === 'horizontal' && H > W, vertical = orientacion === 'vertical' && W > H;
    const AW = girar ? H : W, AH = girar ? W : H;   // ancho y alto del lienzo antes de girarlo
    const ampliar = !vertical && AW > AH && AH > 520;
    const k = ampliar ? AH / ALTO_DISENO : 1;
    b.style.width = ampliar || girar ? `${AW / k}px` : vertical ? `${Math.min(W, Math.round(H * 9 / 19.5))}px` : '';
    b.style.height = ampliar || girar ? `${AH / k}px` : '';
    b.style.margin = vertical ? '0 auto' : '';
    b.style.transform = (girar ? `translate(${W}px,0) rotate(90deg) ` : '') + (ampliar ? `scale(${k})` : '');
    document.documentElement.classList.toggle('ampliado', ampliar);
  }
  addEventListener('resize', ajustarLienzo); ajustarLienzo(); bloquearOrientacion();

  // ---------------- Navegación entre pantallas ----------------
  // Confirmación con un diálogo propio del juego (nada de confirm/alert del navegador: no existen igual en Android).
  // Devuelve una promesa: true si se acepta.
  function confirmar(texto, si = 'Aceptar', no = 'Cancelar') {
    return new Promise(res => {
      $('dialogoTexto').textContent = texto; $('dialogoSi').textContent = si; $('dialogoNo').textContent = no; $('dialogoNo').hidden = false;
      const fin = v => { $('dialogo').classList.remove('visible'); $('dialogoSi').onclick = $('dialogoNo').onclick = null; res(v); };
      $('dialogoSi').onclick = () => fin(true); $('dialogoNo').onclick = () => fin(false);
      $('dialogo').classList.add('visible');
    });
  }
  function mensaje(texto, ok = 'OK') {
    return colaMensaje = colaMensaje.then(() => new Promise(res => {
      $('dialogoTexto').textContent = texto; $('dialogoSi').textContent = ok; $('dialogoNo').hidden = true;
      $('dialogoSi').onclick = () => { $('dialogo').classList.remove('visible'); $('dialogoNo').hidden = false; $('dialogoSi').onclick = null; res(); };
      $('dialogo').classList.add('visible');
    }));
  }
  let pantallaActual = 'menu';
  function ir(id) {
    if (!desbloqueado(id)) return avisoBloqueo(id);
    if (candidato && id !== 'pHerreria') { avisar('Acepta o descarta el refinamiento'); return; }
    if (pantallaActual === 'pArbol' && id !== 'pArbol' && borrador) {   // cambios del árbol sin guardar: se pregunta y luego se sigue
      confirmar(`Tienes ${puntosSinGuardar()} punto(s) de habilidad sin guardar. ¿Guardarlos?`, 'Guardar', 'Descartar')
        .then(ok => { if (ok) guardarArbol(); else borrador = null; ir(id); });
      return;
    }
    document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === id));
    pantallaActual = id;
    if (id === 'pBatalla') ajustarEscala();
    if (id === 'menu' && campListo) paginarAccesos();   // pudo cambiar el tamaño mientras estaba oculto
    if (id === 'pTienda') pintarTienda();
    if (id === 'pInventario') pintarInventario();   // el nivel pudo cambiar en batalla
    if (id === 'pHerreria') pintarHerreria();
    if (id === 'pCampana') pintarCampanas();
    if (id === 'pEvento') pintarEvento();
    if (id === 'pMascota') pintarMascotas();
    if (id === 'pArbol') pintarArbol();
    if (id === 'pRunas') pintarRunas();
    if (id === 'pColeccion') pintarColeccion();
    if (id === 'pTorre') pintarTorre();
    if (id === 'pReyes') pintarReyes();
    if (id === 'pFormacion') pintarFormacion();
    if (id === 'pRanking') pintarRanking();
    if (id === 'pBolsa') pintarInventario();
    if (id === 'pCalabozo') pintarCalabozo();
    if (id === 'pMisiones') pintarMisiones();
    if (id === 'pArena') pintarArena();
    if (id === 'menu' && campListo) pintarCampamento();
  }
  document.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => ir(b.dataset.ir));
  document.addEventListener('click', e => { const m = e.target.closest('[data-material]'); if (m) infoMaterial(m.dataset.material); });
  function bloquearPestana() {
    if (pestanaBloqueada) return; pestanaBloqueada = true; auto = false;
    try { musica.pause(); musicaEpica.pause(); } catch {}
    document.getElementById('otraPestana').classList.add('visible');
  }
  if (canalPestanas) {
    canalPestanas.onmessage = e => {
      const m = e.data || {}; if (m.id === idPestana) return;
      if (m.t === 'hola' && !pestanaBloqueada) canalPestanas.postMessage({ t: 'ocupada', id: idPestana });   // ya hay una abierta: esta
      else if (m.t === 'ocupada' || m.t === 'tomar') bloquearPestana();
    };
    canalPestanas.postMessage({ t: 'hola', id: idPestana });
    document.getElementById('usarAqui').onclick = () => { canalPestanas.postMessage({ t: 'tomar', id: idPestana }); location.reload(); };
  }
  function avisar(texto) {
    if (simulando) return;
    const a = document.createElement('div'); a.className = 'aviso'; a.textContent = texto;
    document.body.appendChild(a); setTimeout(() => a.remove(), 2000);
  }
  function pintarHud() {
    const pct = jugador.nivel >= NIVEL_MAX ? 100 : jugador.xp / xpParaSubir(jugador.nivel) * 100;
    document.querySelectorAll('.hud').forEach(h => h.innerHTML =
      `<span>Nv ${jugador.nivel}${jugador.nivel >= NIVEL_MAX ? ' MAX' : ''}</span><span class="xp" title="${jugador.xp}/${xpParaSubir(jugador.nivel)} XP"><i style="width:${pct}%"></i></span><span class="oro">● ${jugador.oro}</span><span class="estamina" title="Estamina: se recarga cada día">⚡ ${jugador.estamina}/${ESTAMINA_MAX}</span>`
      + (h.closest('#pHerreria') || h.closest('#pRunas') ? (h.closest('#pRunas') ? ['polvo'] : Object.keys(MATERIALES)).map(k => `<span class="mat-hud" data-material="${k}">${MATERIALES[k].split(' ')[0]} ${jugador.mat[k].toLocaleString('es')}</span>`).join('') : ''));   // en la herrería, también sus materiales
    if (campListo) pintarCampamento();
  }
  setInterval(() => {   // un solo reloj anima todos los sprites de mascota visibles (~17 fps, como el vídeo)
    pasoMascota++;
    document.querySelectorAll('.sprite-mascota').forEach(el => {
      const seq = el.dataset.seq.split(','); el.style.backgroundPositionX = (-seq[pasoMascota % seq.length] * +el.dataset.ancho) + 'px';
    });
  }, 59);
  function pintarMascotas() {
    jugador.mascotas = jugador.mascotas || {};
    const m = MASCOTAS.find(x => x.id === mascSel) || mascotaActual() || MASCOTAS[0]; mascSel = m.id;
    const rejilla = Object.entries(CAT_MASCOTA).map(([cat, c]) => `<div class="masc-grupo" style="--cm:${c.color}"><h4>● ${c.nombre} <small>● ${c.precio}</small></h4>
      <div class="masc-cat">${MASCOTAS.filter(x => x.cat === cat).map(x => { const n = nivelMascota(x);
        return `<button class="masc-tile${n ? '' : ' bloq'}${x.id === mascSel ? ' sel' : ''}${jugador.mascota === x.id ? ' puesta' : ''}" data-msel="${x.id}">
          <span class="ic">${dibujoMascota(x, .16)}</span><small>${x.nombre}</small><b>${n ? 'Nv ' + n : '🔒'}</b></button>`; }).join('')}</div></div>`).join('');
    const c = CAT_MASCOTA[m.cat], n = nivelMascota(m), tiene = n > 0, puesta = jugador.mascota === m.id, nv = Math.max(1, n);
    const bonos = bonosMascota(m, nv).map(t => `<li>${t}</li>`).join('');
    const boton = !tiene ? `<button data-masc="${m.id}" data-acc="comprar" ${jugador.oro < m.precio ? 'disabled' : ''}>Comprar ● ${m.precio}</button>`
      : `<div class="fila-cofre">${puesta ? '<button disabled>Acompañando</button>' : `<button data-masc="${m.id}" data-acc="equipar">Llevar</button>`}
         ${n < MASCOTA_MAX ? `<button data-masc="${m.id}" data-acc="mejorar" ${jugador.oro < costeMejora(m, n) ? 'disabled' : ''}>Mejorar ● ${costeMejora(m, n)}</button>` : '<button disabled>Nivel máx.</button>'}</div>`;
    $('mascotas').innerHTML = `<div class="masc-rejilla">${rejilla}</div>
      <div class="cofre mascota-card${puesta ? ' puesta' : ''}" style="--cm:${c.color}"><span class="tag-cat">${c.nombre}</span><div class="cara">${dibujoMascota(m, .5)}</div>
        <h3>${m.nombre}${tiene ? ` · Nv ${n}` : ''}</h3><ul>${bonos}<li>${textoAccionMascota(m, nv)}</li></ul>${boton}</div>`;
  }
  $('mascotas').addEventListener('click', e => {
    const t = e.target.closest('[data-msel]'); if (t) { mascSel = t.dataset.msel; pintarMascotas(); return; }
    const b = e.target.closest('[data-masc]'); if (!b || b.disabled) return;
    const m = MASCOTAS.find(x => x.id === b.dataset.masc), n = nivelMascota(m);
    if (b.dataset.acc === 'comprar') comprarMascota(m);
    if (b.dataset.acc === 'equipar') jugador.mascota = m.id;
    if (b.dataset.acc === 'mejorar' && mejorarMascota(m)) avisar(`${m.nombre} Nv ${n + 1}`);
    guardar(); pintarHud(); pintarMascotas(); pintarInventario();
  });
  function pintarTabSkins() {
    const k = skinActual(), propias = skinsDisponibles();
    if (!skinSel || !propias.some(x => x.id === skinSel)) skinSel = k ? k.id : null;
    const sel = SKINS.find(x => x.id === skinSel);
    $('tabSkins').innerHTML = (sel ? fichaSkin(sel) : `<div class="masc-actual"><i>${propias.length ? 'Toca una skin para ver su ficha' : 'No tienes skins: cómpralas en la Tienda'}</i></div>`) +
      `<small>Equipada: <b>${k ? k.nombre : 'ninguna (se ve tu equipo)'}</b>. La skin cambia tu aspecto y suma su bono; el resto de stats sigue siendo el del equipo.</small>
      <div class="skins-lista" style="margin-top:8px">
        ${propias.map(x => `<button class="item${x.id === skinSel ? ' sel-her' : ''}${jugador.skin === x.id ? ' puesto' : ''}" data-skin="${x.id}"><img src="${x.img}" alt=""><small>${x.nombre}<br>${textoEstrellas(estrellasSkin(x.id))}</small></button>`).join('')}
      </div>`;
  }
  $('tabSkins').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.skin) { skinSel = b.dataset.skin; return pintarTabSkins(); }   // seleccionar, no equipar
    const acc = b.dataset.acc, k = SKINS.find(x => x.id === skinSel); if (!k) return;
    if (acc === 'equipar') { jugador.skin = k.id; avisar(`${k.nombre} equipada`); }
    if (acc === 'quitar') jugador.skin = null;
    if (acc === 'mejorar') { if (!mejorarSkin(k)) return; avisar(`${k.nombre} ★${estrellasSkin(k.id)}`); pintarHud(); }
    guardar(); aplicarEquipo();
  });
  function pintarArbol() {
    claseVista = jugador.clase;   // solo se muestra el árbol de tu clase
    const ramas = ARBOL[claseVista] || [], propia = claseVista === jugador.clase, A = arbolVista(), pend = puntosSinGuardar();
    const sel = ramas.flatMap(r => r.nodos.map((n, i) => ({ n, i, rama: r }))).find(x => x.n.id === arbolSel);
    let ficha = '<small>Toca un nodo para ver qué hace.</small>';
    if (sel) {
      const { n, i, rama } = sel, r = rango(n.id, A), abierto = nodoAbierto(rama, i, A);
      const req = i > 0 && !abierto ? `<p class="req">Requiere ${3 * i} puntos en ${rama.nombre} y aprender ${rama.nodos[i - 1].nombre}</p>` : '';
      ficha = `<h2>${n.icono} ${n.nombre}</h2>
        <p>Rango <b>${r}/${n.max}</b>${r > rango(n.id) ? ` <span class="pend">(+${r - rango(n.id)} sin guardar)</span>` : ''}</p>
        ${r ? `<p>Actual: ${n.d(r)}</p>` : ''}
        ${r < n.max ? `<p>${r ? 'Siguiente' : 'Efecto'}: ${n.d(r + 1)}</p>` : '<p>Rango máximo</p>'}${req}`;
    }
    $('arbol').innerHTML = `${htmlMaestria()}${htmlAscension()}
      ${propia ? `<div class="arbol-puntos">Puntos libres: <b>${puntosLibres(A)}</b> · gastados ${puntosGastados(A)}
        <button id="reiniciarArbol" ${puntosGastados() || pend ? '' : 'disabled'}>Reiniciar ● ${costeReinicio()}</button></div>
        ${pend ? `<div class="arbol-guardar"><span>✏️ ${pend} punto${pend > 1 ? 's' : ''} sin guardar</span>
          <button id="descartarArbol">Descartar</button><button id="guardarArbol">💾 Guardar</button></div>` : ''}` : ''}
      <div class="ramas">${ramas.map(rama => `<div class="rama"><h3>${rama.icono} ${rama.nombre}<small>${puntosRama(rama, A)} pts</small></h3>
        ${rama.nodos.map((n, i) => {
          const r = rango(n.id, A), abierto = nodoAbierto(rama, i, A), nuevo = r > rango(n.id);
          const cls = r >= n.max ? 'aprendido max' : r ? 'aprendido' : abierto && puntosLibres(A) > 0 ? 'disponible' : abierto ? '' : 'bloqueado';
          const elegido = n.id === arbolSel && propia;
          return `<div class="nodo-wrap${r ? ' aprendido' : ''}">
            ${elegido ? `<button class="nodo-pm menos" data-pm="-1" ${puedeQuitar(rama, i) ? '' : 'disabled'} aria-label="Quitar punto">−</button>` : ''}
            <button class="nodo ${cls}${nuevo ? ' pendiente' : ''}${n.id === arbolSel ? ' sel' : ''}" data-nodo="${n.id}" aria-label="${n.nombre}">${n.icono}<i>${r}/${n.max}</i></button>
            ${elegido ? `<button class="nodo-pm mas" data-pm="1" ${abierto && puntosLibres(A) > 0 && r < n.max ? '' : 'disabled'} aria-label="Añadir punto">+</button>` : ''}</div>`;
        }).join('')}</div>`).join('')}</div>
      <div class="caja ficha-nodo">${ficha}</div>`;
    if (campListo) pintarCampamento();   // avisos rojos de puntos libres
  }
  $('arbol').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.nodo) { arbolSel = b.dataset.nodo; pintarArbol(); return; }
    if (b.dataset.clase) { claseVista = b.dataset.clase; arbolSel = null; pintarArbol(); return; }
    if (b.id === 'ascender') { ascender(); return; }
    if (b.dataset.especial) {   // especialización de maestría: gratis la primera vez, luego cuesta oro
      const id = b.dataset.especial; if (especialidad() === id) return;
      if (especialidad() && jugador.oro < COSTE_ESPECIAL) return avisar(`Cambiar de especialización cuesta ● ${COSTE_ESPECIAL}`);
      if (especialidad()) jugador.oro -= COSTE_ESPECIAL;
      (jugador.especialidad ||= {})[jugador.clase] = id; guardar(); aplicarEquipo(); pintarHud(); pintarArbol(); avisar(`${ESPECIALIDADES[id].icono} ${ESPECIALIDADES[id].nombre}`); return;
    }
    if (b.id === 'cambiarClase') {   // cambio de clase: gratis fuera de batalla; cada clase conserva sus puntos y su maestría
      if (borrador) borrador = null;
      jugador.clase = claseVista; arbolSel = null; guardar(); montarHabilidades(); aplicarEquipo(); pintarHud();
      avisar(`${CLASES[jugador.clase].icono} Ahora eres ${CLASES[jugador.clase].nombre}`); pintarArbol(); return;
    }
    if (b.dataset.pm) {   // + / − del nodo seleccionado (sobre el borrador)
      const rama = ramasClase().find(r => r.nodos.some(n => n.id === arbolSel)), i = rama.nodos.findIndex(n => n.id === arbolSel);
      const A = borrador || { ...jugador.arbol };
      if (b.dataset.pm === '1') {
        if (puntosLibres(A) <= 0 || !nodoAbierto(rama, i, A) || rango(arbolSel, A) >= rama.nodos[i].max) return;
        A[arbolSel] = rango(arbolSel, A) + 1; borrador = A;
      } else {
        if (!puedeQuitar(rama, i)) return;
        borrador[arbolSel]--;
      }
      if (!puntosSinGuardar()) borrador = null;   // volvió a lo guardado
      pintarArbol();
    }
    if (b.id === 'guardarArbol') { guardarArbol(); pintarArbol(); }
    if (b.id === 'descartarArbol') { borrador = null; pintarArbol(); }
    if (b.id === 'reiniciarArbol') {
      if (!puntosGastados()) { borrador = null; pintarArbol(); return; }   // solo había cambios sin guardar
      if (jugador.oro < costeReinicio()) { avisar('Oro insuficiente'); return; }
      jugador.oro -= costeReinicio(); jugador.arbol = {}; borrador = null; guardar(); pintarHud(); avisar('Árbol reiniciado'); pintarArbol();
    }
  });
  function pintarTabTitulos() {
    const tienes = TITULOS.filter(t => jugador.titulos[t.id]).length;
    $('tabTitulos').innerHTML = `<small>Tienes ${tienes} de ${TITULOS.length} títulos. Solo el título equipado da su bono.</small>
      <div class="titulos" style="margin-top:8px">${TITULOS.map(t => {
        const ok = jugador.titulos[t.id], puesto = ok && jugador.titulo === t.id, [a, m] = t.prog();
        return `<div class="titulo-fila${ok ? '' : ' bloq'}${puesto ? ' puesto' : ''}" style="--tc:${RAREZA_TITULO[t.rareza]}">
          <div class="info"><b>${ok ? '' : '🔒 '}${t.nombre}</b><small>${t.desc}${Object.keys(t.bono).length ? ` · <span class="bono">${textoBono(t.bono)}</span>` : ''}</small>
            ${ok ? '' : `<small>${Math.min(a, m)} / ${m}</small><div class="prog"><i style="width:${Math.min(100, a / m * 100)}%"></i></div>`}</div>
          ${ok ? `<button data-titulo="${puesto ? '' : t.id}">${puesto ? 'Quitar' : 'EQUIPAR'}</button>` : ''}</div>`;
      }).join('')}</div>`;
  }
  $('tabTitulos').addEventListener('click', e => {
    const b = e.target.closest('[data-titulo]'); if (!b) return;
    jugador.titulo = b.dataset.titulo || null; guardar(); pintarInventario();
  });
  // Cada tarjeta lleva sus botones: EQUIPAR / Quitar, ▲ mejorar, Fusionar (si hay 3 iguales) y fundir (las no equipadas)
  function pintarRunas() {
    jugador.runas ||= []; jugador.runasPuestas ||= Array(RANURAS_RUNA).fill(null);
    const puestas = jugador.runasPuestas, hayHueco = puestas.includes(null);
    const iguales = r => jugador.runas.filter(x => x !== r && !puestas.includes(x.uid) && x.tipo === r.tipo && x.nivel === r.nivel);
    const tarjeta = (r, puesta) => `<div class="item runa${puesta ? ' puesto' : ''}"><span style="font-size:28px">${RUNAS[r.tipo].icono}</span>
      <small>${RUNAS[r.tipo].nombre}${r.cal ? ` <b style="color:${CAL_RUNA[r.cal].color}">${CAL_RUNA[r.cal].nombre}</b>` : ''} · Nv ${r.nivel}</small><b>${textoRuna(r)}</b>
      ${puesta ? `<button data-acc="quitar" data-runa="${r.uid}">Quitar</button>`
               : `<button data-acc="equipar" data-runa="${r.uid}" ${hayHueco ? '' : 'disabled'}>EQUIPAR</button>`}
      <div class="acc-runa">${r.nivel < RUNA_MAX ? `<button class="mejorar${tieneCoste(costeMejoraRuna(r.nivel)) ? '' : ' sin-recursos'}" data-acc="mejorar" data-runa="${r.uid}">▲ Nv ${r.nivel + 1}</button>` : ''}
      ${r.nivel < RUNA_MAX && iguales(r).length >= 2 ? `<button class="fusionar" data-acc="fusionar" data-runa="${r.uid}">Fusionar → Nv ${r.nivel + 1}</button>` : ''}
      <button class="pulir${tieneCoste(COSTE_PULIR_RUNA) ? '' : ' sin-recursos'}" data-acc="pulir" data-runa="${r.uid}">💎 Pulir</button>
      ${puesta ? '' : `<button class="fundir" data-acc="fundir" data-runa="${r.uid}">♻ Fundir</button>`}</div></div>`;
    const libres = jugador.runas.filter(r => !puestas.includes(r.uid)).sort((a, b) => b.nivel - a.nivel || a.tipo.localeCompare(b.tipo));
    $('runas').innerHTML = `
      <h3>Ranuras de runa</h3>
      <div class="rejilla ranuras-runa">${puestas.map(uid => { const r = jugador.runas.find(x => x.uid === uid);
        return r ? tarjeta(r, true) : '<div class="item vacia"><span style="font-size:28px">◇</span><small>Vacía</small></div>'; }).join('')}</div>
      <div class="fila" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button data-acc="crear" ${tieneCoste(COSTE_RUNA) ? '' : 'disabled'}>Crear runa al azar</button><small>Crea una runa de tipo aleatorio · cuesta <span class="${jugador.oro < COSTE_RUNA.oro ? 'falta' : ''}">● ${COSTE_RUNA.oro} oro</span> y <span class="${jugador.mat.polvo < COSTE_RUNA.polvo ? 'falta' : ''}">✨ ${COSTE_RUNA.polvo} polvo</span></small></div>
      <h3>Tus runas (${libres.length})</h3>
      <small class="nota">Junta 3 runas iguales del mismo nivel para fusionarlas en una de nivel superior (máx. Nv ${RUNA_MAX}). Las runas <b style="color:${CAL_RUNA[1].color}">raras</b> y <b style="color:${CAL_RUNA[2].color}">perfectas</b> suman un efecto secundario; púlelas (● ${COSTE_PULIR_RUNA.oro} · ✨ ${COSTE_PULIR_RUNA.polvo}) para subir su calidad o cambiar el secundario.${hayHueco ? '' : ' Las 4 ranuras están llenas: quita una para equipar otra.'}</small>
      <div class="rejilla">${libres.map(r => tarjeta(r, false)).join('') || '<small>Aún no tienes runas sin equipar.</small>'}</div>
      <h3>Reliquias · ${reliquiasActivas().length}/${RANURAS_RELIQUIA} activas</h3><small class="nota">Se consiguen derrotando o dañando a los jefes mundiales; repetirla sube su nivel. Solo ${RANURAS_RELIQUIA} pueden estar activas: elige las que encajen con tu build.</small>
      <div class="rejilla">${RELIQUIAS.map(r => { const n = nivelReliquia(r.id), activa = reliquiasActivas().includes(r);
        return `<div class="item${n ? '' : ' bloq'}${activa ? ' puesto' : ''}"><span style="font-size:28px">${r.icono}</span><small>${r.nombre}${n ? ` · Nv ${n}/${RELIQUIA_MAX}` : ''}</small>
          <b>${n ? textoReliquia(r) : `🔒 ${NOMBRE_JEFE[r.jefe]}`}</b>
          ${n ? (activa ? `<button data-acc="quitarRel" data-rel="${r.id}">Quitar</button>` : `<button data-acc="ponerRel" data-rel="${r.id}" ${reliquiasActivas().length < RANURAS_RELIQUIA ? '' : 'disabled'}>ACTIVAR</button>`) : ''}</div>`; }).join('')}</div>`;
  }
  $('runas').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const puestas = jugador.runasPuestas, acc = b.dataset.acc, r = jugador.runas.find(x => x.uid === +b.dataset.runa);
    if (acc === 'crear' && tieneCoste(COSTE_RUNA)) { const nueva = crearRuna(); avisar(`${RUNAS[nueva.tipo].icono} ${RUNAS[nueva.tipo].nombre}${nueva.cal ? ' ' + CAL_RUNA[nueva.cal].nombre : ''}`); }
    if (acc === 'ponerRel' || acc === 'quitarRel') {   // reliquias activas (la primera vez se fija la elección automática)
      jugador.reliquiasPuestas = reliquiasActivas().map(x => x.id).filter(id => id !== b.dataset.rel);
      if (acc === 'ponerRel' && jugador.reliquiasPuestas.length < RANURAS_RELIQUIA) jugador.reliquiasPuestas.push(b.dataset.rel);
      guardar(); return pintarRunas();
    }
    if (r && acc === 'equipar' && puestas.includes(null)) puestas[puestas.indexOf(null)] = r.uid;
    if (r && acc === 'quitar') puestas[puestas.indexOf(r.uid)] = null;
    if (r && acc === 'mejorar' && !tieneCoste(costeMejoraRuna(r.nivel))) return avisar(`Te falta: ${faltaCoste(costeMejoraRuna(r.nivel))}`);
    if (r && acc === 'pulir' && !tieneCoste(COSTE_PULIR_RUNA)) return avisar(`Te falta: ${faltaCoste(COSTE_PULIR_RUNA)}`);
    if (r && acc === 'mejorar' && mejorarRuna(r)) avisar(`${RUNAS[r.tipo].nombre} Nv ${r.nivel}`);
    if (r && acc === 'fundir' && !puestas.includes(r.uid)) {
      if (r.nivel >= 3 && !await confirmar(`¿Fundir ${RUNAS[r.tipo].nombre} Nv ${r.nivel}? Recuperas ${polvoFundir(r)} de polvo.`)) return;
      jugador.mat.polvo += polvoFundir(r); jugador.runas = jugador.runas.filter(x => x !== r); avisar(`♻ +${polvoFundir(r)} polvo`);
    }
    if (r && acc === 'fusionar' && fusionarRuna(r)) avisar(`Fusión: ${RUNAS[r.tipo].nombre}${r.cal ? ' ' + CAL_RUNA[r.cal].nombre : ''} Nv ${r.nivel}`);
    if (r && acc === 'pulir' && tieneCoste(COSTE_PULIR_RUNA)) {   // sube la calidad (con garantía) o cambia el secundario
      pagar(COSTE_PULIR_RUNA); const c0 = r.cal || 0;
      if (c0 < 2) {
        r.pul = (r.pul || 0) + 1;
        if (r.pul >= GARANTIA_PULIR[c0] || rnd() < [.3, .08][c0]) { r.pul = 0; r.extra = null; calidadNueva(r, c0 + 1); avisar(`💎 ¡Runa ${CAL_RUNA[r.cal].nombre}!`); }
        else { if (c0) r.extra = elegir(extrasRuna(r)); avisar('💎 Sin mejora de calidad'); }
      } else { r.extra = elegir(extrasRuna(r).filter(k => k !== r.extra)); avisar(`💎 Nuevo secundario: ${nombreEf(r.extra)}`); }
    }
    guardar(); pintarHud(); pintarRunas();
  });
  function pintarColeccion() {
    $('coleccion').innerHTML = `<small class="nota">Cada entrada conseguida te da un bono permanente; completar una colección da un bono extra.</small>` +
      COLECCIONES.map(c => { const e = c.entradas(), [ok, tot] = progresoColeccion(c), base = Object.fromEntries(Object.entries(c.porEntrada).map(([a, v]) => [a, v * ok]));
        return `<div class="coleccion"><h3>${c.nombre} · ${ok}/${tot}</h3><small class="nota">${c.desc}</small>
          <div class="bono">Ahora: ${ok ? textoBonos(base) : '—'} (+${Object.values(c.porEntrada)[0]} % ${ATRIBUTOS[Object.keys(c.porEntrada)[0]].toLowerCase()} por entrada)</div>
          <div class="bono${ok >= tot ? ' listo' : ''}">${ok >= tot ? '✔' : '🔒'} Completa: ${textoBonos({}, c.completa)}</div>
          <div class="rejilla" style="margin-top:6px">${e.map(x => `<div class="item${x.ok ? '' : ' bloq'}"><span style="font-size:26px">${x.ok ? x.icono : '❓'}</span><small>${x.ok ? x.nombre : '???'}</small>${x.extra ? `<b>${x.extra}</b>` : ''}</div>`).join('')}</div></div>`;
      }).join('');
  }
  function pintarArena() {
    const a = revisarArena(), l = LIGAS[ligaDe(a.puntos)], st0 = estadisticas(), p = poder(st0);
    $('arenaPvp').innerHTML = `<div class="liga"><span class="ic">${l[2]}</span><div><b>Liga ${l[1]}</b><br>${a.puntos} puntos · ${a.victorias || 0} victorias
        <br><small>Entradas hoy: ${a.entradas}/${ARENA_ENTRADAS} · Temporada: acaba en ${diasFinMes()} días · premio de tu liga: ${textoPremio(PREMIO_LIGA[ligaDe(a.puntos)])}</small></div></div>
      <small class="nota">PvP asíncrono: luchas contra copias de guerreros controladas por la IA, con un poder parecido al tuyo. Sus sprites de guerrero llegarán más adelante.</small>
      ${a.rivales.map((r, i) => `<div class="rival"><span style="font-size:34px">⚔️</span><div class="info"><b>${r.nombre}</b><small>⚔ ${Math.round(p * r.f).toLocaleString('es')} poder · ${r.puntos} pts</small>
        <small>${r.f < .95 ? 'Fácil' : r.f > 1.05 ? 'Difícil' : 'Igualado'} · ganar: +${Math.round(25 * r.f)} pts</small></div>
        <button data-rival="${i}" ${a.entradas > 0 ? '' : 'disabled'}>Desafiar</button></div>`).join('')}
      <div class="fila" style="display:flex;gap:8px;align-items:center"><button data-acc="rivales" ${jugador.oro >= COSTE_RIVALES ? '' : 'disabled'}>Cambiar rivales</button><small>● ${COSTE_RIVALES}</small></div>`;
  }
  $('arenaPvp').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const a = revisarArena();
    if (b.dataset.acc === 'rivales' && jugador.oro >= COSTE_RIVALES) { jugador.oro -= COSTE_RIVALES; generarRivales(); guardar(); pintarHud(); pintarArena(); return; }
    if (b.dataset.rival == null || a.entradas <= 0) return;
    a.entradas--; a.rivalActual = +b.dataset.rival; guardar();
    iniciarCampana(batallaArena(+b.dataset.rival));
  });
  function montarGuerrero(cont) { vistasGuerrero.push(montarCapas(cont)); }
  // capas del guerrero en un contenedor (sin registrarlas: las vistas de aliados se pintan con su propio perfil)
  function montarCapas(cont) {
    const capaDe = {};
    for (const [r, def] of Object.entries(RANURAS)) {
      const d = document.createElement('div');
      d.className = 'capa'; d.style.backgroundImage = `url(${def.tira})`;
      cont.appendChild(d); capaDe[r] = d;
    }
    const sk = document.createElement('img'); sk.className = 'skin'; sk.alt = ''; cont.appendChild(sk);
    const ska = document.createElement('div'); ska.className = 'capa capa-skin'; cont.appendChild(ska);
    capaDe._skin = sk; capaDe._skinAnim = ska; capaDe._cont = cont;
    return capaDe;
  }
  function aplicarEquipo() {
    for (const capaDe of vistasGuerrero) pintarVista(capaDe);
    pintarInventario();
    if (campListo) pintarCampamento();
  }
  // pinta equipo y skin del jugador actual (con conPerfil, de cualquier perfil) en una vista
  function pintarVista(capaDe) {
    for (const r of Object.keys(RANURAS)) {
      if (RANURAS[r].interna) continue;
      const m = modelo[objeto(jugador.equipado[r]).modelo];
      capaDe[r].style.backgroundImage = `url(${m.tira || RANURAS[r].tira})`; capaDe[r].style.filter = m.color;
    }
    const k = skinActual();
    {
      capaDe._cont.classList.toggle('con-skin', !!k);
      capaDe._cont.classList.toggle('con-skin-anim', !!(k && k.tira));
      if (k) capaDe._skin.src = k.img;
      capaDe._skinAnim.style.backgroundImage = k && k.tira ? `url(${k.tira})` : 'none';
      capaDe._skinAnim.style.backgroundSize = '4144px 208px';
      const brilla = k && estrellasSkin(k.id) >= 5;   // ★5: brillo del color de la skin, como un buff
      capaDe._cont.classList.toggle('brillo-skin', !!brilla);
      capaDe._cont.style.setProperty('--brillo', brilla ? k.color : 'transparent');   // tira de 14 cuadros (sea de 185 o de 370 px), a la escala del guerrero
    }
  }
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
      `${etiquetaTitulo(tituloActual())}<div><b>${CLASES[jugador.clase].icono} ${CLASES[jugador.clase].nombre}</b> · Nv ${jugador.nivel}</div><div class="xp"><i style="width:${pct}%"></i></div>
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
    pintarPerfil();
    document.querySelectorAll('.inv-tabs button').forEach(b => b.classList.toggle('on', b.dataset.invtab === invTab));
    $('tabObjetos').hidden = invTab !== 'objetos'; $('tabMascota').hidden = invTab !== 'mascota'; $('tabSkins').hidden = invTab !== 'skins'; $('tabTitulos').hidden = invTab !== 'titulos';
    if (invTab === 'titulos') { pintarTabTitulos(); if (jugador.tituloNuevo) { jugador.tituloNuevo = false; guardar(); } }
    if (invTab === 'mascota') pintarTabMascota();
    if (invTab === 'skins') pintarTabSkins();
    const st = estadisticas();
    $('stats').innerHTML = `<div class="poder">⚔ Poder<b>${poder(st).toLocaleString('es')}</b></div>`
      + Object.entries(ATRIBUTOS).map(([a, n]) => `<div>${n}<b>${st[a]}</b></div>`).join('')
      + Object.entries(SECUNDARIOS).map(([a, n]) => `<div class="sec">${n}<b>${textoEfecto(a)}</b></div>`).join('')
      + Object.entries(OTROS_EFECTOS).filter(([a]) => efecto(a) > 0).map(([a, n]) => `<div class="sec">${n}<b>${textoEfecto(a)}</b></div>`).join('');
    // materiales: cada uno en su propia casilla, solo aquí en el inventario
    $('mats').innerHTML = Object.entries(MATERIALES).map(([k, n]) => { const [ic, ...nom] = n.split(' ');
      return `<div class="item mat-slot" data-material="${k}"><span class="mat-ic">${ic}</span><b>${jugador.mat[k].toLocaleString('es')}</b><small>${nom.join(' ')}</small></div>`; }).join('');
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
  $('estaminaPrueba').onclick = () => { jugador.estamina = ESTAMINA_MAX; guardar(); pintarHud(); avisar('Estamina al máximo'); };
  $('jefePrueba').onclick = () => { jugador.mundiales = {}; delete jugador.mundial; jugador.entradasJefe = ENTRADAS_JEFE; guardar(); avisar('Jefes mundiales y entradas regenerados'); };
  $('resetPrueba').onclick = async () => {   // partida nueva desde cero (conserva el nombre), sin oro ni materiales
    if (!await confirmar('¿Reiniciar el personaje? Vuelve al nivel 1 sin oro, materiales ni progreso. No se puede deshacer.', 'Reiniciar', 'Cancelar')) return;
    const nombre = jugador.nombre; jugador = partidaNueva(); jugador.nombre = nombre; jugador.oro = 0;
    for (const k in jugador.mat) jugador.mat[k] = 0;
    // si el juego está abierto en otra pestaña, se bloquea (si no, volvería a guardar encima la partida vieja)
    if (canalPestanas) canalPestanas.postMessage({ t: 'tomar', id: idPestana });
    pestanaBloqueada = false; guardar(); location.reload();
  };
  $('reyesPrueba').onclick = () => { const R = revisarReyes(); R.entradas = INTENTOS_REYES; R.vencidas = {}; guardar(); pintarCampamento();
    if (pantallaActual === 'pReyes') pintarReyes(); avisar('Torre de reyes reiniciada'); };
  $('arenaPrueba').onclick = () => { const a = revisarArena(); a.entradas = ARENA_ENTRADAS; generarRivales(); guardar(); pintarCampamento();
    if (pantallaActual === 'pArena') pintarArena(); avisar('Arena reiniciada: entradas y rivales nuevos'); };
  function pintarPerfilesPrueba() {
    let hay = false; try { hay = !!localStorage.getItem(CLAVE_RESPALDO); } catch {}
    $('perfilesPrueba').innerHTML = `<small>Jugar con un bot:</small> ${DEF_BOTS.map((d, i) => `<button class="prueba" data-bot="${i}">${CLASES[d.clase].icono} ${d.nombre}</button>`).join('')}
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
  function pintarCampanas() {
    const actual = CAMPANAS.find(c => desbloqueada(c, 'normal') && !superada(c.id, 'normal'));   // el siguiente nivel por jugar
    $('listaCampanas').innerHTML = `<div class="formacion-resumen etapa">${textoFormacion()} <button data-ir-formacion="pCampana">🛡 Formación</button></div>` + ETAPAS.map(e => {
      if (e.bloqueada) return `<div class="campana bloqueada"><h3>${e.nombre}</h3><small>🔒 Próximamente</small></div>`;
      const niveles = CAMPANAS.filter(c => c.etapa === e.id), hechos = niveles.filter(c => superada(c.id, 'normal')).length;
      return `<h3 class="etapa">${e.nombre} <small>${hechos}/${niveles.length}</small></h3>` + niveles.map(c => {
        const abierta = desbloqueada(c, 'normal');
        return `<div class="campana nivel${abierta ? '' : ' bloqueada'}${c === actual ? ' actual' : ''}"><h3>${c.nombre}${c.jefe ? ' <span class="tag-jefe">JEFE</span>' : ''}</h3>
          ${abierta ? `<div class="difs">${ORDEN_DIF.map(d => {
            const ok = desbloqueada(c, d), dif = c.dificultades[d];
            const nota = !ok ? `🔒 ${razonBloqueo(c, d)}` : `⚡ ${ESTAMINA_CAMPANA} · ${dif.enemigos.length} enem.${superada(c.id, d) ? ' · ✔' : ''}`;
            return `<button class="d-${d}" data-campana="${c.id}" data-dif="${d}" ${ok ? '' : 'disabled'}>${DIFICULTADES[d]}<small>${nota}</small></button>`;
          }).join('')}</div>${ORDEN_DIF.some(d => superada(c.id, d)) ? `<div class="difs autos">${ORDEN_DIF.map(d => superada(c.id, d)   // cada Auto debajo de su dificultad
            ? `<button data-auto="${d}" data-campana="${c.id}" aria-label="Auto ${DIFICULTADES[d]}">⚡ Auto</button>` : '<span></span>').join('')}</div>` : ''}` : `<small>🔒 ${razonBloqueo(c, 'normal')}</small>`}</div>`;
      }).join('');
    }).join('');
    if (pantallaActual === 'pCampana') requestAnimationFrame(() => { const a = $('listaCampanas').querySelector('.actual'); if (a) a.scrollIntoView({ block: 'center' }); });
  }
  pintarCampanas();
  $('listaCampanas').addEventListener('click', e => {
    const a = e.target.closest('[data-auto]'); if (a) return barrido(CAMPANAS.find(x => x.id === a.dataset.campana), a.dataset.auto);
    const b = e.target.closest('[data-dif]'); if (!b) return;
    iniciarCampana(batallaCampana(CAMPANAS.find(x => x.id === b.dataset.campana), b.dataset.dif));
  });

  // ---------------- Batalla ----------------
  const slots = [$('s1'), $('s2')];
  const arena = $('arena');
  const btn = $('btn'), btnAuto = $('btnAuto');
  // el ataque es solo un icono: su estado va en la etiqueta (accesibilidad / al mantener pulsado)
  const estadoAtaque = t => { btn.title = t; btn.setAttribute('aria-label', t); };
  $('btnHuir').onclick = () => $('huir').click();
  function ponerVelocidad(v) {
    VELOCIDAD = velElegida = v; document.documentElement.style.setProperty('--vel', v);
    $('btnVel').innerHTML = `⏩<small>x${v}</small>`; $('btnVel').title = `Velocidad x${v}`; $('btnVel').classList.toggle('activo', v > 1);
    try { localStorage.setItem('batalla.velocidad', v); } catch {}
  }
  $('btnVel').onclick = () => ponerVelocidad(VELOCIDADES[(VELOCIDADES.indexOf(VELOCIDAD) + 1) % VELOCIDADES.length]);
  try { const v = +localStorage.getItem('batalla.velocidad'); ponerVelocidad(VELOCIDADES.includes(v) ? v : 1); } catch { ponerVelocidad(1); }
  function ajustarEscala() {
    recorteAvance = SEPARACION - (parseFloat(getComputedStyle(arena).columnGap) || SEPARACION);
    const grande = batalla.enemigo && (batalla.enemigo.jefe || batalla.enemigo.cerbero || batalla.enemigo.asmodeo || batalla.enemigo.minotauro);   // los jefes ocupan más
    const alto = grande ? 470 : 270, ancho = (batalla.enemigo && batalla.enemigo.cerbero ? 1080 : grande ? 960 : 820) - recorteAvance;
    const esc = document.querySelector('.escena'), lienzo = document.body;   // medidas del lienzo (no de la ventana: puede estar ampliado)
    const hueco = esc && esc.clientHeight > 50 ? esc.clientHeight - 34 : lienzo.clientHeight - 220;   // 34: rótulo "Enemigo 1/3"
    const e = Math.min(1, (lienzo.clientWidth - 32) / ancho, hueco / alto);
    arena.style.transform = `scale(${e})`;
    arena.style.marginTop = `${-(1 - e) * 240 + (alto - 270) * e}px`;   // recupera el espacio que deja la escala
  }

  // muestra cuánto se curó alguien (guerrero o enemigo): número verde grande sobre su barra de vida
  function mostrarCura(slot, cantidad, icono = '') {
    fx(slot, 'num-cura', cantidad > 0 ? `${icono}+${cantidad} vida` : `${icono}vida llena`);
    slot.classList.remove('curado'); void slot.offsetWidth; slot.classList.add('curado');
    setTimeout(() => slot.classList.remove('curado'), 900);
  }
  function fx(slot, cls, text) {
    const e = document.createElement('div');
    e.className = 'fx ' + cls;
    e.textContent = text || '';
    e.style.left = (slot.offsetLeft + 40) + 'px';
    e.style.top = (slot.offsetTop + (cls === 'dano' || cls === 'num-cura' ? -10 : 40)) + 'px';
    arena.appendChild(e);
    setTimeout(() => e.remove(), 1500);
  }
  // Personajes animados cuadro a cuadro
  function personaje(slot, ancho) {
    const frames = slot.querySelector('.frames'), pj = slot.querySelector('.pj');
    let capas, cuadro = 0, base = 0;
    const skin = frames.querySelector('.skin');
    const ver = i => {
      cuadro = i; capas.forEach(c => c.style.backgroundPositionX = (-i * ancho) + 'px');
      if (skin) skin.style.transform = 'translateX(-50%) ' + (POSE_SKIN[i] || '');   // la skin es fija: se inclina según el cuadro
    };
    capas = frames.querySelector('.capa') ? [...frames.querySelectorAll('.capa')] : [frames];
    ver(0);   // reposo: cuadro 0 fijo; la respiración la hace el CSS
    // pasos: [cuadro, ms, avance(px) | undefined, accion?]; devuelve promesa que se cumple en el impacto
    return { ver, frames, setAncho: a => { ancho = a; }, setBase: b => { base = b; }, get base() { return base; }, async jugar(pasos) {
      frames.classList.add('quieto');
      let alImpacto;
      const impacto = new Promise(r => alImpacto = r);
      (async () => {
        for (const [c, ms, mov, accion] of pasos) {
          ver(c);
          if (mov !== undefined) pj.style.transform = mov ? `translateX(${avanceReal(mov)}px)` : '';
          if (accion) accion(alImpacto);
          await wait(ms);
        }
        ver(base); frames.classList.remove('quieto');
      })();
      return impacto;
    } };
  }
  const guerrero = personaje(slots[0], 296), parca = personaje(slots[1], 260);
  const sonidoEspada = () => { const a = elegirSonido(espadas); a.currentTime = 0; a.play(); };
  const sonidoGuadana = () => { const a = elegirSonido(guadanas); a.currentTime = 0; a.play(); };
  // Música de batalla en bucle (solo durante la batalla)
  const musica = new Audio('audio/musica/battle.mp3');
  // Jefe mundial: música épica propia, mordiscos al azar y uno de los dos sonidos de lanzallamas
  const musicaEpica = new Audio('audio/musica/epic_battle.mp3');
  musicaEpica.loop = true; musicaEpica.volume = .4;
  const sonidoAzar = lista => () => { const a = elegirSonido(lista); a.currentTime = 0; a.play(); };
  const sonidoMordisco = sonidoAzar([1, 2, 3, 4].map(n => Object.assign(new Audio(`audio/cerbero/cerberus_atack${n}.mp3`), { preload: 'auto' })));
  // Asmodeo: gruñidos al atacar y sonido de curación, al azar
  const sonidoGruñido = sonidoAzar(['behemot_grunt', 'behemot_grunt2', 'behemot_grunt3', 'behemot_grunt4'].map(n => Object.assign(new Audio(`audio/asmodeo/${n}.mp3`), { preload: 'auto' })));
  const sonidoCuracion = sonidoAzar(['behemot_healing', 'behemot_healing2', 'behemot_healing3'].map(n => Object.assign(new Audio(`audio/asmodeo/${n}.mp3`), { preload: 'auto' })));
  const sonidoMinotauro = sonidoAzar(['minotaur', 'minotaur2', 'minotaur3', 'minotaur4'].map(n => Object.assign(new Audio(`audio/minotauro/${n}.mp3`), { preload: 'auto' })));
  const sonidoEspadaMinotauro = sonidoAzar(['minotaur_sword', 'minotaur_sword2', 'minotaur_sword3', 'minotaur_sword4'].map(n => Object.assign(new Audio(`audio/minotauro/${n}.mp3`), { preload: 'auto' })));
  const sonidoLlamas = sonidoAzar(['flame_cerberus', 'flame_cerberus2'].map(n => Object.assign(new Audio(`audio/cerbero/${n}.mp3`), { preload: 'auto' })));
  musica.loop = true; musica.volume = .35;

  // ---------------- Habilidades ----------------
  // Cada habilidad se carga con los turnos del guerrero (cada ataque suma 1 a todas las demás)
  // y al usarla vuelve a cero. 'anim' son los pasos cuadro a cuadro del guerrero.
  const marcoGuerrero = document.querySelector('#s1 .frames');
  function estela() {
    const e = document.createElement('div'); e.className = 'estela';
    e.style.left = (slots[0].offsetLeft + 150) + 'px'; e.style.top = (slots[0].offsetTop + 120) + 'px'; e.style.width = '520px';
    arena.appendChild(e); setTimeout(() => e.remove(), 500);
  }
  function arco() {
    const e = document.createElement('div'); e.className = 'arco';
    e.style.left = (slots[1].offsetLeft + 20) + 'px'; e.style.top = (slots[1].offsetTop + 10) + 'px';
    arena.appendChild(e); setTimeout(() => e.remove(), 450);
  }
  const dibujarHabilidades = () => $('habilidades').innerHTML = HABILIDADES.map(h => `<button class="especial" data-hab="${h.id}"></button>`).join('');
  function montarHabilidades() { prepararHabilidades(); dibujarHabilidades(); }
  montarHabilidades();
  $('pruebas').innerHTML = HAB_TODAS.map(h => `<button class="prueba" data-hab="${h.id}" data-prueba="1">${h.nombre} (prueba, sin espera)</button>`).join('') +
    `<button class="prueba" id="infernalPrueba" hidden>Cerbero a modo infernal (prueba)</button>` +
    `<button class="prueba" id="asmodeoPrueba" hidden>Asmodeo al 50 % de vida (prueba)</button>` +
    `<button class="prueba" id="minoPrueba" hidden>Minotauro al 70 % de vida (prueba)</button>`;
  function pintarEspecial() {
    for (const h of HABILIDADES) {
      const b = document.querySelector(`#habilidades [data-hab="${h.id}"]`), falta = h.turnos - batalla.carga[h.id];
      // botón con el símbolo de la habilidad y los turnos que faltan; el nombre queda como etiqueta (al mantener o pasar el ratón)
      b.innerHTML = `<span class="hab-ic">${h.icono}</span>${falta > 0 ? `<i class="hab-cd">${falta}</i>` : ''}`;
      b.title = h.nombre; b.setAttribute('aria-label', h.nombre);
      b.style.setProperty('--cd', falta > 0 ? falta / h.turnos : 0);
      b.classList.toggle('cargada', falta <= 0);   // 'cargada' (no 'lista': esa clase es la lista de niveles de la campaña)
      b.disabled = falta > 0 || enRonda || auto || batalla.terminada;
    }
    document.querySelectorAll('#pruebas button').forEach(b => b.disabled = enRonda || auto || batalla.terminada);
  }
  document.querySelector('#pBatalla').addEventListener('click', e => {
    const b = e.target.closest('[data-hab]'); if (!b || b.disabled) return;
    const h = HABILIDADES.find(x => x.id === b.dataset.hab) || HAB_TODAS.find(x => x.id === b.dataset.hab);
    if (b.dataset.prueba || batalla.carga[h.id] >= h.turnos) ronda(h);
  });

  const ataques = [
    () => guerrero.jugar([            // avanza agachado, levanta la espada, tajo, impacto, regresa
      [1, 250, 360], [2, 170], [3, 90, , sonidoEspada], [4, 160, , r => r()], [5, 120], [6, 200, 0], [7, 150]]),
    tipo => batalla.enemigo.cerbero ? ataqueCerbero(tipo) : batalla.enemigo.asmodeo ? ataqueAsmodeo(tipo) : batalla.enemigo.minotauro ? ataqueMinotauro(tipo) : parca.jugar([   // dentro del espejo, +X es hacia el guerrero
      [1, 220], [2, 260, batalla.enemigo.avance || 410, sonidoGuadana], [3, 260, , r => r()], [4, 250, 0]]),
  ];
  function pintarEvento() {
    const m = MUNDIALES[mundialSel], max = m.enemigo.vida, v = estadoMundial().vida, pct = v / max * 100, muerto = v <= 0;
    $('eventoCaja').innerHTML = `
      <div class="jefes">${Object.entries(MUNDIALES).map(([id, j]) => `<button data-jefe="${id}" class="${id === mundialSel ? 'on' : ''}">${j.enemigo.nombre}</button>`).join('')}</div>
      <div class="ev-izq">
        <h2>${m.titulo}</h2>
        <div class="retrato" style="${m.retrato(v, max)}"></div>
        <div class="barra"><i style="width:${pct}%"></i></div>
        <small>${muerto ? '¡Derrotado hoy! Vuelve mañana.' : `Vida: ${v} / ${max}`}</small>
        <button id="desafiar" ${muerto || entradasJefe() <= 0 ? 'disabled' : ''}>Desafiar · 🎟 ${entradasJefe()}/${ENTRADAS_JEFE}</button>
        ${!muerto && entradasJefe() <= 0 ? `<small class="falta">Sin entradas de jefe: vuelven mañana (${ENTRADAS_JEFE} al día).</small>` : ''}
      </div>
      <div class="ev-der"><ul>
        <li>Su vida se comparte entre todos tus intentos del día.</li>
        ${m.reglas.map(r => `<li>${r}</li>`).join('')}
        <li>Armadura <b>${m.enemigo.armadura}</b>: la <b>penetración</b> ignora parte de ella y aumenta tu daño.</li>
        <li>Recompensa según el daño que causes; derrotarlo da un premio extra.</li>
        <li>Botín: reliquias y su <b>equipo exclusivo</b> (${MODELOS.filter(x => x.jefe === mundialSel).map(x => x.nombre).join(', ')}), con atributos secundarios al azar.</li>
        <li>Cada intento usa una <b>entrada de jefe</b> (${ENTRADAS_JEFE} al día), no estamina.</li>
        <li><b>Esta semana</b> (cambia cada lunes): ${modsSemana().map(md => `${md.icono} <b>${md.nombre}</b> (${md.desc})`).join(' · ')}. Recompensas +30 %.</li>
      </ul>
      ${pintarRanking()}</div>`;
    $('desafiar').onclick = iniciarMundial;
    $('eventoCaja').querySelectorAll('[data-jefe]').forEach(b => b.onclick = () => { mundialSel = b.dataset.jefe; pintarEvento(); });
  }
  // aspecto del enemigo según su tipo (parca, Cerbero o Asmodeo)
  function modoJefe() {
    const c = !!batalla.enemigo.cerbero, a = !!batalla.enemigo.asmodeo, mi = !!batalla.enemigo.minotauro;
    slots[1].classList.toggle('asmodeo', a);
    slots[1].classList.toggle('minotauro', mi);
    modoCerbero(c);
    $('pBatalla').classList.toggle('mazmorra', c || a || mi);
    if (a) { parca.setAncho(300); parca.setBase(0); parca.ver(0); }
    if (mi) { parca.setAncho(476); parca.setBase(0); parca.ver(0); }
    $('minoPrueba').hidden = !mi;
    $('asmodeoPrueba').hidden = !a;
  }
  function modoCerbero(activo) {
    slots[1].classList.toggle('cerbero', activo);
    $('pBatalla').classList.toggle('mazmorra', activo);
    $('pBatalla').classList.toggle('infernal', activo && batalla.infernal);
    parca.setAncho(activo ? 480 : 260);
    parca.setBase(activo && batalla.infernal ? 12 : 0);
    parca.frames.classList.remove('quieto');   // si murió en la pelea anterior quedaba congelado en el cuadro de muerte
    $('infernalPrueba').hidden = !activo || batalla.infernal;
    parca.ver(parca.base);
  }
  // reposo: un solo cuadro de pie; el movimiento es solo la respiración del CSS
  // ataque a distancia (solo en modo infernal): carga la boca, forma la bola de fuego y la escupe;
  // la bola viaja hasta el guerrero y estalla. Posiciones en px de la arena (el jefe está espejado).
  const verCarga = i => slots[1].querySelector('.carga').style.backgroundPositionX = (-i * 480) + 'px';
  function bolaFuego() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto'); slots[1].classList.add('cargando');
      for (let i = 0; i < 8; i++) { verCarga(i); await wait(i < 4 ? 140 : 120); }
      slots[1].classList.remove('cargando'); parca.frames.classList.remove('quieto');
      sonidoLlamas();
      const b = document.createElement('div'); b.className = 'bola'; arena.appendChild(b);
      const verBola = i => b.style.backgroundPositionX = (-i * 260) + 'px';
      const x0 = slots[1].offsetLeft - 70, y0 = slots[1].offsetTop - 56;   // boca (la fila de la bola se bajó 3 px al apoyar a Cerbero en el suelo)
      const x1 = slots[0].offsetLeft + 18, y1 = slots[0].offsetTop + 20;   // pecho del guerrero
      const mover = t => b.style.transform = `translate(${x0 + (x1 - x0) * t}px, ${y0 + (y1 - y0) * t}px) scaleX(-1)`;
      b.style.transition = 'none'; mover(0); verBola(0); b.offsetWidth; b.style.transition = '';
      for (let i = 0; i < 4; i++) { verBola(i); mover((i + 1) / 4); await wait(110); }   // crece mientras avanza
      alImpacto();
      verBola(4); await wait(160); verBola(5); await wait(160); b.remove();               // estalla
    })();
    return impacto;
  }   // el largo se ajusta a la distancia boca-guerrero
  function lanzallamas() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto');
      parca.ver(16); await wait(260); parca.ver(17); await wait(200);   // abre las fauces (se queda así mientras sopla)
      // la llama nace en la boca y apunta al cuerpo del guerrero: el contenedor gira sobre la boca
      // y la tira (que en la hoja apunta a la derecha) va espejada dentro
      const bocaX = slots[1].offsetLeft + 32, bocaY = slots[1].offsetTop - 32;   // fauces del cuadro 17 (espejado, x2)
      const objX = slots[0].offsetLeft + 150, objY = slots[0].offsetTop + 130;
      const largo = Math.hypot(bocaX - objX, objY - bocaY) + 60, ang = Math.atan2(objY - bocaY, bocaX - objX) * 180 / Math.PI;
      const ll = document.createElement('div'); ll.className = 'llama'; arena.appendChild(ll);
      Object.assign(ll.style, { left: (bocaX - largo) + 'px', top: (bocaY - LLAMA.alto / 2) + 'px', width: largo + 'px', transform: `rotate(${-ang}deg)` });
      const tira = document.createElement('div'); ll.appendChild(tira);
      tira.style.backgroundSize = `${25 * largo}px ${LLAMA.alto}px`;
      const ver = i => tira.style.backgroundPositionX = (-i * largo) + 'px';
      sonidoLlamas();
      for (let i = 0; i < 8; i++) { ver(i); await wait(i < 4 ? 70 : 90); }
      for (let k = 0; k < 24; k++) { ver(8 + k % 17); if (k === 8) alImpacto(); await wait(65); }
      ll.classList.add('apaga'); await wait(220); ll.remove();
      parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  function ataqueCerbero(tipo) {   // tipo: lo que decidió el motor (decidirAtaqueEnemigo)
    if (tipo === 'bola') return bolaFuego();
    if (tipo === 'lanza') return lanzallamas();
    const b = batalla.infernal ? 16 : 4;
    return parca.jugar([[b, 180], [b + 1, 200, batalla.enemigo.avance, sonidoMordisco], [b + 2, 150], [b + 3, 220, , r => r()], [b + 3, 200, 0]]);
  }
  // prueba: deja a Asmodeo en el 50 % (activa curación y escudo); su escudo se carga ya para verlo en su próximo turno
  $('minoPrueba').onclick = () => {
    if (enRonda || batalla.terminada || !batalla.enemigo.minotauro) return;
    const u = enemigoDuelo(); u.vida = Math.min(u.vida, Math.floor(u.vidaMax * FURIA.umbral)); pintarVida(slots[1], u.vida, u.vidaMax);
    batalla.turnoFuria = FURIA.turnos - 1; avisar('Minotauro al 70 %');
  };
  $('asmodeoPrueba').onclick = () => {
    if (enRonda || batalla.terminada || !batalla.enemigo.asmodeo) return;
    const u = enemigoDuelo(); u.vida = Math.min(u.vida, Math.floor(u.vidaMax / 2)); pintarVida(slots[1], u.vida, u.vidaMax);
    batalla.turnoEscudo = ESCUDO.turnos - 1; avisar('Asmodeo al 50 %');
  };
  $('infernalPrueba').onclick = async () => {
    if (enRonda || batalla.terminada || batalla.infernal || !batalla.enemigo.cerbero) return;
    const u = enemigoDuelo(); u.vida = Math.min(u.vida, Math.floor(u.vidaMax / 2)); pintarVida(slots[1], u.vida, u.vidaMax);
    await transformar();
  };
  async function animarTransformacion() {
    const d = document.createElement('div'); d.className = 'destello'; document.body.appendChild(d); setTimeout(() => d.remove(), 1300);
    avisar('¡MODO INFERNAL!');
    arena.classList.add('tiembla');
    $('nombreEnemigo').textContent = 'Cerbero infernal';
    modoJefe();
    await wait(1200);
    arena.classList.remove('tiembla');
  }
  // Asmodeo: barrido o garras (avanza), onda de alas (a distancia) y curación
  function ondaAlas() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto');
      parca.ver(4); await wait(320);
      parca.ver(7); sonidoGruñido();
      const o = document.createElement('div'); o.className = 'onda'; arena.appendChild(o);
      const x0 = slots[1].offsetLeft + 20, y0 = slots[1].offsetTop - 60, x1 = slots[0].offsetLeft + 90, y1 = slots[0].offsetTop + 40;
      o.style.transition = 'none'; o.style.transform = `translate(${x0}px, ${y0}px) scale(.6)`; o.offsetWidth; o.style.transition = '';
      o.style.transform = `translate(${x1}px, ${y1}px) scale(1.2)`;
      await wait(350); alImpacto(); o.style.opacity = 0; await wait(250); o.remove();
      parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  function ataqueAsmodeo(tipo) {
    if (tipo === 'escudo') return escudoAsmodeo();
    if (tipo === 'cura') return curacionAsmodeo();
    if (tipo === 'onda') return ondaAlas();
    const g = tipo === 'garras' ? 6 : 5;   // ráfaga de garras o barrido
    return parca.jugar([[4, 260], [g, 240, batalla.enemigo.avance, sonidoGruñido], [g, 220, , r => r()], [g, 180, 0]]);
  }   // 1-2 son el reposo con restos del suelo: se empieza en el 3
  const verEscudo = i => slots[1].querySelector('.escudo').style.backgroundPositionX = (-i * 520) + 'px';
  function escudoAsmodeo() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto'); slots[1].classList.add('escudando'); sonidoCuracion();
      for (const i of ORDEN_ESCUDO) { verEscudo(i); if (i === 16) alImpacto(); await wait(i >= 16 && i <= 28 ? 75 : 95); }
      slots[1].classList.remove('escudando'); parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  // curación: se concentra, abre un círculo mágico, lo envuelve una onda verde y vuelve al reposo.
  // La vida se recupera con la onda (cuadro 6).
  const verCura = i => slots[1].querySelector('.curacion').style.backgroundPositionX = (-i * 420) + 'px';
  function curacionAsmodeo() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto'); slots[1].classList.add('curando'); sonidoCuracion();
      // cuadros 4-5 (círculo mágico) descartados: la secuencia pasa de concentrarse a la onda verde
      for (const [i, ms] of [[12, 180], [13, 180], [0, 220], [1, 200], [3, 220], [2, 240], [6, 260], [7, 240], [8, 260], [9, 200], [10, 200], [11, 220]]) { verCura(i); if (i === 6) alImpacto(); await wait(ms); }
      slots[1].classList.remove('curando'); parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  // Gran Minotauro: levanta la espada, avanza y barre; furia: ruge, se envuelve en aura y vuelve a su pose
  // brillando en naranja mientras dura.
  function ataqueMinotauro(tipo) {
    if (tipo === 'furia')
      return parca.jugar([[0, 200], [20, 180, , sonidoMinotauro], [21, 180], [22, 200], [23, 300, , r => r()], [24, 260], [0, 120]]);
    if (tipo === 'tajo') return granTajo();
    return parca.jugar([[6, 150], [7, 130], [8, 140], [9, 160, batalla.enemigo.avance, sonidoMinotauro], [10, 110], [11, 120, , r => { sonidoEspadaMinotauro(); r(); }], [12, 180], [12, 140, 0]]);
  }
  // Gran Tajo: alza la espada, salta hacia el guerrero, abre el arco, la estrella contra el suelo (impacto),
  // la explosión de fuego cubre al guerrero, se disipa y vuelve a su sitio.
  const verTajo = i => slots[1].querySelector('.tajo').style.backgroundPositionX = (-i * 1088) + 'px';
  function granTajo() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    const pj = slots[1].querySelector('.pj');
    (async () => {
      parca.frames.classList.add('quieto'); slots[1].classList.add('tajando');
      // orden: 0, 3, 1, 2, 4, 5, 6, (9-11: 6->7), 7, (12-14: 7->8), 8
      for (const [i, ms, mov, acc] of [[0, 170], [3, 130], [1, 150, GRAN_TAJO.avance, sonidoMinotauro], [2, 160],
                                       [4, 170, , () => { sonidoEspadaMinotauro(); alImpacto(); }], [5, 280], [6, 160],
                                       [9, 70], [10, 70], [11, 70], [7, 140], [12, 70], [13, 70], [14, 70], [8, 200, 0]]) {
        verTajo(i);
        if (mov !== undefined) pj.style.transform = mov ? `translateX(${avanceReal(mov)}px)` : '';
        if (acc) acc();
        await wait(ms);
      }
      slots[1].classList.remove('tajando'); parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  async function muerteMinotauro() {
    parca.frames.classList.add('quieto');
    for (const i of [13, 16, 17, 18]) { parca.ver(i); await wait(300); }
    await wait(600);
  }
  async function muerteAsmodeo() {
    parca.frames.classList.add('quieto');
    for (let i = 8; i <= 12; i++) { parca.ver(i); await wait(300); }   // cae y se convierte en cristal
    await wait(600);
  }
  async function muerteCerbero() {
    parca.frames.classList.add('quieto');
    for (let i = 0; i < 4; i++) { parca.ver(parca.base + 8 + i); await wait(260); }
    await wait(500);
  }   // y por batalla: campana, reglas, grupo (unidades), enemigo, iEnemigo, st (estadísticas del jugador) y ganado

  function pintarVida(slot, actual, max) {
    const barra = slot.querySelector('.barra');
    barra.querySelector('i').style.width = Math.max(0, actual / max * 100) + '%';
    barra.classList.toggle('baja', actual / max < .3);
  }

  async function mostrarEnemigo() {
    const i = batalla.iEnemigo;
    for (const u of [heroeYo(), enemigoDuelo()]) pintarEstadosU(u);
    modoJefe();
    $('nombreEnemigo').textContent = batalla.infernal ? 'Cerbero infernal' : batalla.enemigo.nombre;
    $('oleada').textContent = batalla.campana.mundial || batalla.campana.arena || batalla.campana.reyes ? '' : batalla.campana.torre ? `Piso ${batalla.campana.torre} · ${i + 1}/${batalla.campana.enemigos.length}` : `Enemigo ${i + 1} / ${batalla.campana.enemigos.length}`;   // jefe mundial y arena: ya lo dice el título
    parca.frames.style.filter = batalla.enemigo.filtro;
    slots[1].classList.toggle('jefe', !!batalla.enemigo.jefe);
    if (batalla.enemigo.jefe || batalla.enemigo.cerbero || batalla.enemigo.asmodeo || batalla.enemigo.minotauro) avisar(batalla.enemigo.jefe ? '¡Jefe!' : `¡${batalla.enemigo.nombre}!`);
    ajustarEscala();
    pintarVida(slots[1], enemigoDuelo().vida, enemigoDuelo().vidaMax);
    slots[1].classList.remove('muerto');
    slots[1].classList.add('entra');
    await wait(50);
    slots[1].classList.remove('entra');
    await wait(600);
  }
  async function iniciarCampana(c) {
    revisarEstamina();
    const coste = c.arena || c.mundial || c.torre || c.reyes || c.calabozo ? 0 : (c.coste || ESTAMINA_CAMPANA);   // arena y jefes gastan entradas, no estamina
    if (jugador.estamina < coste) { avisar('Sin estamina: vuelve mañana'); return; }
    jugador.estamina -= coste; if (coste) contarMision('estamina', coste); guardar(); pintarHud();
    prepararBatalla(c);
    slots[1].classList.remove('escudado', 'tajando', 'furia'); prepararMascota();
    // por si se salió a mitad de un ataque: ambos vuelven a su sitio
    slots.forEach(s => { s.querySelector('.pj').style.transform = ''; s.classList.remove('golpeado'); });
    marcoGuerrero.classList.remove('carga');
    $('pBatalla').classList.toggle('modo-grupo', c.grupo);
    // el acelerador solo existe en combates sin otros jugadores online; en multijugador, x1 (salvo en modo pruebas)
    const multi = !!(c.reyes || c.calabozo) && !MODO_PRUEBAS;
    $('btnVel').style.display = multi ? 'none' : '';
    if (multi) { VELOCIDAD = 1; document.documentElement.style.setProperty('--vel', 1); } else ponerVelocidad(velElegida);
    dibujarHabilidades(); if (!c.grupo) pintarEstadosU(heroeYo());
    $('tituloBatalla').textContent = c.nombre;
    $('nombreGuerrero').innerHTML = `${etiquetaTitulo(tituloActual())}${jugador.nombre} · ${CLASES[jugador.clase].nombre} Nv ${jugador.nivel}`;
    $('resultado').classList.remove('visible');
    pintarVida(slots[0], heroeYo().vida, heroeYo().vidaMax);
    btn.disabled = false;
    ir('pBatalla');
    const pista = c.mundial ? musicaEpica : musica;
    musica.pause(); musicaEpica.pause(); pista.currentTime = 0; pista.play();
    pintarEspecial();
    if (c.grupo) { await dibujarGrupo(c); iniciarCuentaTurno(); } else await mostrarEnemigo();
  }

  function salirBatalla(destino) {
    if (batalla.campana && batalla.campana.mundial) {
      const e = estadoMundial(batalla.campana.mundial);
      if (!batalla.terminada) { e.mio = (e.mio || 0) + batalla.danoHecho; batalla.danoHecho = 0; }   // abandono: el daño cuenta para el ranking
      e.vida = Math.max(0, enemigoDuelo().vida); guardar(); destino = destino === 'pCampana' ? 'pEvento' : destino; }
    if (batalla.campana && batalla.campana.arena && !batalla.terminada) avisar(resultadoArena(false).replace(/<[^>]+>/g, ' ').trim());   // huir de la arena = derrota
    if (batalla.campana && batalla.campana.arena && destino === 'pCampana') destino = 'pArena';
    if (batalla.campana && batalla.campana.torre && destino === 'pCampana') destino = 'pTorre';
    if (batalla.campana && batalla.campana.reyes && destino === 'pCampana') destino = 'pReyes';
    if (batalla.campana && batalla.campana.calabozo && destino === 'pCampana') destino = 'pCalabozo';
    if (batalla.campana && !batalla.terminada) batalla.campana.abandonada = true;   // la ronda en curso ya no cuenta muertes ni botín
    if (batalla.campana && (batalla.campana.reyes || batalla.campana.calabozo) && sala && !batalla.terminada) { for (const m of sala.miembros.slice(1)) m.listo = false; sala.trasBatalla = true; }   // huyendo también
    batalla.terminada = true; auto = false;
    btnAuto.title = 'Autoataque: OFF'; btnAuto.classList.remove('activo');
    musica.pause(); musicaEpica.pause();
    $('resultado').classList.remove('visible');
    ir(destino);
  }
  // Abandonar: hay que confirmarlo y no se cobra nada de lo ganado en la batalla
  $('huir').onclick = () => {
    if (enRonda) return;   // ataque en curso: se puede salir al terminar la ronda
    if (batalla.terminada) return salirBatalla('pCampana');
    modalFijo = true;
    abrirModal('comun', `<h2>¿Abandonar la batalla?</h2>
      <p>Si sales ahora <b>no recibirás ninguna recompensa</b> (oro, experiencia ni materiales) y la estamina gastada no se devuelve.</p>
      <div class="fila"><button data-acc="seguir">Seguir luchando</button><button data-acc="salir">Abandonar</button></div>`);
    $('detCaja').onclick = e => {
      const acc = e.target.closest('button')?.dataset.acc; if (!acc) return;
      modalFijo = false; cerrarModal();
      if (acc === 'salir') salirBatalla('pCampana');
    };
  };
  $('resSalir').onclick = () => salirBatalla(batalla.campana.mundial ? 'pEvento' : batalla.campana.arena ? 'pArena' : batalla.campana.torre ? 'pTorre' : batalla.campana.reyes ? 'pReyes' : 'pCampana');
  $('resOtra').onclick = () => batalla.campana.mundial ? iniciarMundial() : batalla.campana.torre ? iniciarTorre() : iniciarCampana(batalla.campana);

  $('resTexto').addEventListener('click', e => { const b = e.target.closest('[data-uid]'); if (b) mostrarObjeto(+b.dataset.uid); });   // objetos ganados en la batalla: se muestran como iconos en el resultado
  function mostrarResultado(gano) {
    obtenidos = [];
    batalla.terminada = true; auto = false;
    btnAuto.title = 'Autoataque: OFF'; btnAuto.classList.remove('activo');
    // las recompensas se cobran al terminar (victoria o derrota); abandonando no se cobra nada.
    // Torre: no cuesta estamina, así que el botín de los enemigos solo se cobra si superas el piso (si no, perder a
    // propósito sería farmeo infinito).
    const sinBotin = batalla.campana.torre && !gano;
    if (sinBotin || batalla.campana.ayuda) batalla.ganado = { oro: 0, xp: 0, piedra: 0, polvo: 0, almas: 0, objetos: [] };   // ayuda: sin recompensa
    if (gano && !batalla.campana.ayuda) for (const k in batalla.campana.premio) batalla.ganado[k] = (batalla.ganado[k] || 0) + batalla.campana.premio[k];
    if (batalla.campana.mundial) {   // jefe mundial: recompensa según el daño causado en este intento
      batalla.ganado.oro += Math.round(batalla.danoHecho * .2); batalla.ganado.xp += Math.round(batalla.danoHecho * .1);   // ajustado a la vida actual de los jefes
      batalla.ganado.piedra += Math.floor(batalla.danoHecho / 100); batalla.ganado.polvo += Math.floor(batalla.danoHecho / 375);
      estadoMundial(batalla.campana.mundial).vida = Math.max(0, enemigoDuelo().vida);
    }
    const ev = eventoHoy() || {};   // eventos por calendario
    batalla.ganado.oro = Math.round(batalla.ganado.oro * (1 + efecto('oro')) * (ev.oro || 1) * (batalla.campana.mundial ? 1.3 : 1));   // Áurico solar; los jefes con modificadores pagan +30 %
    batalla.ganado.xp = Math.round(batalla.ganado.xp * (ev.xp || 1));
    batalla.ganado.piedra = Math.round(batalla.ganado.piedra * (ev.mat || 1)); batalla.ganado.polvo = Math.round(batalla.ganado.polvo * (ev.mat || 1));   // Día de la Forja
    if (batalla.campana.mundial && ev.jefes) for (const k of ['oro', 'xp', 'piedra', 'polvo']) batalla.ganado[k] = Math.round(batalla.ganado[k] * ev.jefes);   // Día de Jefes
    batalla.ganado.xp = Math.round(batalla.ganado.xp * (1 + efecto('experiencia')));   // línea secundaria "Experiencia extra"
    let extraRes = '';
    obtenidos = [...batalla.ganado.objetos];
    if (batalla.ganado.objetos.length) jugador.objetos.push(...batalla.ganado.objetos);
    if (batalla.campana.mundial) { extraRes += botinReliquia(batalla.campana.mundial, gano) + botinEquipoJefe(batalla.campana.mundial, gano); sumarMaestria(gano ? 30 : 10); }
    if (batalla.campana.arena) extraRes += resultadoArena(gano);
    if (batalla.campana.torre && gano) extraRes += pisoSuperado(batalla.campana.torre);
    if (batalla.campana.calabozo && gano && !batalla.campana.ayuda) {   // recompensa propia del calabozo: un objeto garantizado, mejor cuanto más difícil
      extraRes += calabozoSuperado(batalla.campana.cal);
      if (difAbierta(batalla.campana.cal, batalla.campana.calabozo)) jugador.calabozosDif[`${batalla.campana.cal}:${batalla.campana.calabozo}`] = true;
      const o = objetoAzar(OBJETO_CALABOZO[batalla.campana.calabozo], efecto('fortuna') / 3); jugador.objetos.push(o);
      obtenidos.push(o);
    }
    if (batalla.campana.reyes && gano) extraRes += reyVencido(batalla.campana.reyes);
    if ((batalla.campana.reyes || batalla.campana.calabozo) && sala) { for (const m of sala.miembros.slice(1)) m.listo = false; sala.trasBatalla = true; }   // de vuelta a la fase previa: todos pulsan Ready otra vez
    if (gano && batalla.campana.idCampana) contarMision('victoria');
    if (batalla.campana.mundial) contarMision('jefe');
    if (batalla.campana.arena) contarMision('arena');
    ganar(batalla.ganado.oro, batalla.ganado.xp, { piedra: batalla.ganado.piedra, polvo: batalla.ganado.polvo, almas: batalla.ganado.almas || 0 });
    if (gano && batalla.campana.mundial) { jugador.logros ||= {}; (jugador.logros.jefes ||= {})[batalla.campana.mundial] = true; guardar(); }
    if (gano && batalla.campana.idCampana) {
      jugador.superadas = jugador.superadas || {};
      const clave = `${batalla.campana.idCampana}:${batalla.campana.dif}`, sig = ORDEN_DIF[ORDEN_DIF.indexOf(batalla.campana.dif) + 1];
      if (!jugador.superadas[clave]) {
        jugador.superadas[clave] = true; guardar();
        const nx = CAMPANAS[CAMPANAS.findIndex(x => x.id === batalla.campana.idCampana) + 1];
        if (batalla.campana.dif === 'normal' && nx) setTimeout(() => avisar(`${nx.id} desbloqueado`), 600);
        if (sig) setTimeout(() => avisar(`${batalla.campana.idCampana} ${DIFICULTADES[sig]} desbloqueado`), batalla.campana.dif === 'normal' && nx ? 2200 : 600);
      }
      pintarCampanas();
    }
    $('resTitulo').textContent = gano ? '¡Victoria!' : 'Derrota';
    $('resTexto').innerHTML = (batalla.campana.mundial ? (gano ? `¡Has derrotado a ${batalla.enemigo.nombre}!<br><br>` : `Daño causado: <b>${batalla.danoHecho}</b>. A ${batalla.enemigo.nombre} le quedan ${Math.max(0, enemigoDuelo().vida)} de vida.<br><br>`) :
      gano ? '' : `Caíste ante ${batalla.enemigo.nombre}.<br><br>`) +
      `<span class="recompensa">Total ganado: ● ${batalla.ganado.oro} oro · ${batalla.ganado.xp} XP<br>🔷 ${batalla.ganado.piedra} piedras · ✨ ${batalla.ganado.polvo} polvo${batalla.ganado.almas ? ` · 💠 ${batalla.ganado.almas} almas` : ''}</span>`;
    $('resTexto').innerHTML += extraRes + (sinBotin ? '<br><small>En la Torre el botín solo se cobra al superar el piso.</small>' : '')
      + (obtenidos.length ? `<div class="obtenidos">Obtenido: ${obtenidos.map(o => `<button class="item r-${modelo[o.modelo].rareza}" data-uid="${o.uid}">${icono(modelo[o.modelo])}</button>`).join('')}</div>` : '');
    $('resOtra').textContent = batalla.campana.torre ? (gano ? `Subir al piso ${batalla.campana.torre + 1}` : 'Reintentar') : gano ? 'Jugar de nuevo' : 'Reintentar';
    $('resOtra').style.display = (batalla.campana.mundial && gano) || batalla.campana.arena || batalla.campana.reyes || batalla.campana.calabozo ? 'none' : '';
    $('resSalir').textContent = batalla.campana.mundial ? 'Volver al evento' : batalla.campana.arena ? 'Volver a la arena' : batalla.campana.torre ? 'Volver a la torre' : batalla.campana.reyes ? 'Volver a la Torre de reyes' : batalla.campana.calabozo ? 'Volver al calabozo' : 'Volver a campaña';
    $('resultado').classList.add('visible');
    if (batalla.campana.mundial) { const e = estadoMundial(batalla.campana.mundial); e.mio = (e.mio || 0) + batalla.danoHecho; batalla.danoHecho = 0; guardar(); }
    if (!gano && batalla.enemigo.minotauro) { parca.frames.classList.add('quieto'); parca.ver(19); }   // rugido de victoria
    if (!gano && batalla.enemigo.asmodeo) { parca.frames.classList.add('quieto'); parca.ver(16); }   // pose de victoria
  }

  // ---- efectos de estado ----
  function pintarEstadosU(u, est = u.estados) {
    u.el.querySelector('.estados').innerHTML = Object.entries(est).map(([id, e]) =>
      `<span title="${ESTADOS[id].nombre}">${ESTADOS[id].icono}${e.pilas > 1 ? '×' + e.pilas : ''} ${e.turnos}</span>`).join('');
  }
  // Mascota: cada N turnos muerde a un enemigo al azar (daño = % de tu ataque) o cura al héroe con menos vida (% de su vida máxima)
  function prepararMascota() { const m = mascotaActual(); $('acompana').innerHTML = m ? dibujoMascota(m, .5) : ''; }

  // ---------------- Pantalla del combate 1 contra 1: dibuja los eventos del motor ----------------
  async function reproducir(lista) {
    const id = batalla.id, regresos = new Map();   // regresos: quién tiene que volver a su casilla tras atacar (en grupo)
    const demorar = (f, retraso) => retraso ? setTimeout(f, retraso) : f();
    for (const [tipo, ...a] of lista) {
      if (batalla.id !== id) return;   // ya se está en otra batalla: lo que quedaba no se dibuja
      if (tipo === 'vidaU') { const [u, actual, max, retraso] = a; demorar(() => pintarVida(u.el, actual, max), retraso); }
      else if (tipo === 'fxU') { const [u, cls, texto, dy, retraso] = a; demorar(() => u.duelo ? fx(u.el, cls, texto) : fxU(u, cls, texto, dy), retraso); }
      else if (tipo === 'curaU') { const [u, c, icono, retraso] = a; demorar(() => u.duelo ? mostrarCura(u.el, c, icono) : fxU(u, 'num-cura', `${icono}+${c}`), retraso); }
      else if (tipo === 'estadosU') pintarEstadosU(a[0], a[1]);
      else if (tipo === 'claseU') a[0].el.classList.toggle(a[1], a[2]);
      else if (tipo === 'espera') await wait(a[0]);
      else if (tipo === 'estadoAtaque') estadoAtaque(a[0]);
      else if (tipo === 'carga') pintarEspecial();
      else if (tipo === 'animHeroe') { const [u, t, hab] = a; if (u.duelo) await animarAtaque(0, hab); else regresos.set(u, await animHeroe(u, t, hab)); }
      else if (tipo === 'animEnemigo') { const [u, t, ataque] = a; if (u.duelo) await animarAtaque(1, ataque); else regresos.set(u, await animEnemigo(u, t)); }
      else if (tipo === 'volver') { const r = regresos.get(a[0]); regresos.delete(a[0]); if (r) await r(); }
      else if (tipo === 'golpe') await dibujarGolpe(...a);
      else if (tipo === 'marcar') marcarObjetivo(a[0]);
      else if (tipo === 'muerteU') { const [u, jefe] = a; if (!u.duelo) { u.el.classList.add('muerto'); if (u.yo) pintarEspecial(); } else if (!u.heroe) await animarMuerte(jefe); }
      else if (tipo === 'mascota') { if (a[0].duelo) $('acompana').style.transform = a[1] ? `translateX(${avanceReal(420)}px) scale(1.2)` : ''; }
      else if (tipo === 'transformar') await animarTransformacion();
      else if (tipo === 'siguiente') await mostrarEnemigo();
      else if (tipo === 'resultado') mostrarResultado(a[0]);
    }
  }
  // el golpe: en 1 contra 1, la animación de impacto; en grupo, la sacudida del objetivo y el número
  async function dibujarGolpe(u, t, hab, critico, dano, jefe) {
    const fuerte = !!hab || critico, cls = fuerte ? 'dano critico' : 'dano';
    if (t.duelo) return animarGolpe(u.heroe ? 0 : 1, !!hab, jefe, cls, (fuerte ? '¡' : '-') + dano + (critico ? ' CRÍTICO!' : hab ? '!' : ''));
    golpeVisual(t); fxU(t, cls, `${hab ? hab.icono + ' ' : ''}-${dano}${critico ? ' CRÍTICO' : ''}`);
  }
  async function animarAtaque(turno, x) {   // x: la habilidad del guerrero, o lo que decidió hacer el enemigo
    slots[turno].style.zIndex = 3; slots[1 - turno].style.zIndex = '';   // quien ataca, delante
    await (turno === 0 ? (x ? x.anim() : ataques[0]()) : ataques[1](x));
  }
  async function animarGolpe(turno, especial, jefe, cls, texto) {
    const d = slots[1 - turno];
    d.classList.add('golpeado');
    arena.classList.add('tiembla');
    if (turno === 0 && jefe.minotauro) {
      parca.frames.classList.add('quieto');
      const pasos = especial ? [[13, 0], [14, 90], [15, 180], [15, 380], [14, 470], [13, 560]] : [[13, 0], [14, 120], [14, 360], [13, 470]];
      pasos.forEach(([c, t]) => setTimeout(() => parca.ver(c), t / VELOCIDAD));
    }
    if (turno === 0 && jefe.asmodeo) { parca.frames.classList.add('quieto'); parca.ver(especial ? 14 : 13); }   // daño, o retroceso si es una habilidad
    else if (turno === 0 && !jefe.cerbero) { parca.frames.classList.add('quieto'); parca.ver(5); setTimeout(() => parca.ver(6), 250); }
    fx(d, cls, texto);
    await wait(650);
    arena.classList.remove('tiembla');
    await wait(150);
    d.classList.remove('golpeado');
    if (turno === 0 && !jefe.cerbero) { parca.ver(0); parca.frames.classList.remove('quieto'); }
    await wait(250);
  }
  async function animarMuerte(jefe) {
    if (jefe.cerbero) await muerteCerbero();
    else if (jefe.asmodeo) await muerteAsmodeo();
    else if (jefe.minotauro) await muerteMinotauro();
    slots[1].classList.add('muerto');
    await wait(900);
  }
  // Durante la ronda (tu ataque y la respuesta del rival) no se puede huir: la ronda pendiente seguiría corriendo
  // sobre la batalla siguiente si se empezara otra enseguida.
  function marcarRonda(v) { enRonda = v; $('huir').disabled = $('btnHuir').disabled = v; }
  async function ronda(hab) {
    if (batalla.terminada || !batalla.grupo) return;
    pararCuentaTurno();
    marcarRonda(true); btn.disabled = true;
    await reproducir(resolverRonda(hab));
    estadoAtaque('Atacar'); btn.disabled = auto || batalla.terminada; marcarRonda(false); pintarEspecial(); iniciarCuentaTurno();   // en grupo, si caíste, tus aliados siguen: Atacar hace avanzar la ronda
  }
  btn.onclick = () => ronda(null);

  // Autoataque: encadena rondas hasta que se desactive o termine la batalla
  btnAuto.onclick = async () => {
    auto = !auto;
    btnAuto.title = auto ? 'Autoataque: ON' : 'Autoataque: OFF';
    btnAuto.classList.toggle('activo', auto);
    btn.disabled = auto || enRonda || batalla.terminada;
    pintarEspecial();
    if (!auto || bucle) return;
    bucle = true;
    while (enRonda) await wait(100);          // si había una ronda manual en curso, espera a que termine
    while (auto && !batalla.terminada) { await ronda(habLista()); if (auto) await wait(500); }
    bucle = false;
    btn.disabled = batalla.terminada;
    if (batalla.campana && batalla.campana.grupo) iniciarCuentaTurno();   // sin autoataque vuelve la cuenta de 10 s del multijugador
  };
  function pintarTorre() {
    const n = jugador.torre.mejor + 1, p = pisoTorre(n), hito = Math.ceil(n / 10) * 10;
    $('torre').innerHTML = `<div class="formacion-resumen">${textoFormacion()} <button data-ir-formacion="pTorre">🛡 Formación</button></div><div class="liga"><span class="ic">🗼</span><div><b>Mejor piso: ${jugador.torre.mejor}</b><br><small>Sin estamina · los pisos se generan sin fin y cada uno es siempre igual</small></div></div>
      <div class="torre-card${p.jefe ? ' jefe' : ''}"><h3>Piso ${n}${p.jefe ? ' · JEFE' : ''}</h3>
        <small>${p.enemigos.map(e => e.nombre).join(' · ')}</small>
        ${p.mods.length ? `<div class="mods">${p.mods.map(md => { const desc = (md.torre || md).desc; return `<span title="${desc}">${md.icono} ${md.nombre}: ${desc}</span>`; }).join('')}</div>` : ''}
        <small>Recompensa: ${textoPremio({ oro: p.premio.oro, piedra: p.premio.piedra, polvo: p.premio.polvo })} · ${p.premio.xp} XP</small>
        <small>Próximo hito (piso ${hito}): ${textoPremio(premioHito(hito))} + objeto</small>
        <button id="subirTorre">Subir al piso ${n}</button></div>`;
    $('subirTorre').onclick = iniciarTorre;
  }
  function pintarCalabozo() {
    if (!calabozoAbierto(calSel)) calSel = 1;
    if (!difAbierta(calSel, difCal)) difCal = 'normal';
    const enSala = sala && sala.modo === 'calabozo';
    $('calabozo').innerHTML = `<div class="liga"><span class="ic">🏰</span><div style="flex:1"><b>Calabozo multijugador</b><br>
        <div class="difs-cab" id="difBtns"></div></div>
        <select id="calSel" class="combo" ${enSala ? 'disabled' : ''}>${CALABOZOS.map(c => `<option value="${c.id}" ${c.id === (enSala ? sala.cal : calSel) ? 'selected' : ''} ${calabozoAbierto(c.id) ? '' : 'disabled'}>${c.icono} ${c.nombre} · Nv ${c.n}${jugador.calabozos[c.id] ? ' ✔' : calabozoAbierto(c.id) ? '' : ` 🔒 supera ${calabozo(c.id - 1).nombre}`}</option>`).join('')}</select></div>
      ${(() => { const sig = CALABOZOS.find(c => !calabozoAbierto(c.id)); return sig ? `<small class="nota">🔒 ${sig.icono} ${sig.nombre}: supera ${calabozo(sig.id - 1).icono} ${calabozo(sig.id - 1).nombre} en cualquier dificultad para desbloquearlo.</small>` : ''; })()}
      <div id="calabozoCont"></div>`;
    $('calSel').onchange = e => { calSel = +e.target.value; pintarCalabozo(); };   // repinta: las dificultades abiertas dependen del calabozo
    pintarSala();
  }
  // dificultades como botones bajo el título (bloqueadas hasta superar la anterior en ese calabozo)
  function pintarDifsCalabozo() {
    const enSala = sala && sala.modo === 'calabozo', id = enSala ? sala.cal : calSel, actual = enSala ? sala.dif : difCal, fijo = enSala && !esDueno(sala, 'yo');
    $('difBtns').innerHTML = ORDEN_DIF.map(d => { const ok = difAbierta(id, d);
      return `<button class="d-${d}${d === actual ? ' on' : ''}" data-difcal="${d}" ${ok && !fijo ? '' : 'disabled'}>${DIFICULTADES[d]}${ok ? '' : ' 🔒'}</button>`; }).join('');
  }
  $('calabozo').addEventListener('click', e => {   // en tu sala cambia su dificultad (todos vuelven a pulsar Ready); fuera, la de la próxima sala
    const b = e.target.closest('[data-difcal]'); if (!b) return clickSala(e);
    if (b.disabled) return;
    if (sala && sala.modo === 'calabozo') { if (esDueno(sala, 'yo') && sala.dif !== b.dataset.difcal) { sala.dif = b.dataset.difcal; reiniciarReady(sala); pintarSala(); } }
    else { difCal = b.dataset.difcal; pintarDifsCalabozo(); }
  });

  function pintarReyes() {
    const R = revisarReyes();
    $('reyes').innerHTML = `<div class="liga"><span class="ic">👑</span><div><b>Torre de reyes</b><br>
        <small>Tu grupo contra los 3 reyes del servidor a la vez · intentos hoy: ${R.entradas}/${INTENTOS_REYES} · se reinicia en ${(8 - ahoraJuego().getDay()) % 7 || 7} días</small></div></div>
      <div id="reyesCont"></div>`;
    pintarSala();
  }
  // ranking del servidor: lista a la izquierda; el jugador elegido, a la derecha
  function pintarRanking() {
    const ranking = rankingServidor(), x = ranking[rankSel] || ranking[0], p = x.yo ? jugador : x.bot, s0 = conPerfil(p, estadisticas);
    $('ranking').innerHTML = `<div class="ranking-vista"><div class="ranking-servidor">${ranking.map((r, i) =>
        `<div class="${r.yo ? 'yo' : ''}${i === rankSel ? ' sel' : ''}" data-rank="${i}"><b>#${i + 1}</b><span>${CLASES[r.clase].icono} ${r.nombre}</span><span class="clase">${CLASES[r.clase].nombre}</span><span>Nv ${r.nivel}</span><b>⚔ ${r.poder.toLocaleString('es')}</b></div>`).join('')}</div>
      <div class="ranking-ficha"><div class="pj-mini grande" data-retrato="${x.yo ? '' : x.nombre}"></div>
        <b>${i18nPuesto(rankSel)} ${x.nombre}</b><small>${CLASES[x.clase].icono} ${CLASES[x.clase].nombre} · Nv ${x.nivel}</small>
        <small>⚔ ${x.poder.toLocaleString('es')} poder</small>
        <small>❤ ${s0.vida.toLocaleString('es')} · 🗡 ${s0.ataque} · 🛡 ${s0.defensa} · ⛨ ${s0.armadura}</small></div></div>`;
    pintarRetratos($('ranking'));
  }
  $('ranking').addEventListener('click', e => { const r = e.target.closest('[data-rank]'); if (r) { rankSel = +r.dataset.rank; pintarRanking(); } });
  // dibuja el personaje (con su equipo y skin) en cada hueco [data-retrato]; vacío = tú
  function pintarRetratos(cont) {
    cont.querySelectorAll('[data-retrato]').forEach(el => {
      const n = el.dataset.retrato, p = n ? perfilBot(n) : jugador; if (!p) return;
      const esc = document.createElement('div'); esc.className = 'escala';
      const fr = document.createElement('div'); fr.className = 'frames guerrero quieto'; esc.appendChild(fr); el.appendChild(esc);
      const capas = montarCapas(fr); conPerfil(p, () => pintarVista(capas));
    });
  }
  $('reyes').addEventListener('click', clickSala);
  const contSala = modo => $(modo === 'calabozo' ? 'calabozoCont' : 'reyesCont');
  function pintarListaSalas(modo, cont) {
    sembrarSalas(modo);
    const lista = modo === 'calabozo' ? salas[modo].filter(s => s.cal === calSel) : salas[modo];
    cont.innerHTML = `<b>Salas abiertas</b><div class="salas-lista">${lista.map(s => {
        const llena = s.miembros.length >= MAX_JUGADORES;
        return `<div class="sala-fila"><b>#${s.id}</b><span>👑 ${nombreDe(s.miembros[0].n)}${s.miembros.slice(1).map(m => ' · ' + nombreDe(m.n)).join('')}</span>
          <span>${nombreDif(modo, s.dif)}</span><span class="cuenta">👥 ${s.miembros.length}/${MAX_JUGADORES}</span>
          <button data-unirse="${s.id}" ${llena ? 'disabled' : ''}>${llena ? 'Llena' : 'Unirse'}</button></div>`; }).join('') || '<small>No hay salas abiertas</small>'}</div>
      <div class="sala-acciones"><button data-crear-sala="1">➕ Crear sala</button></div>`;
  }
  function pintarSala() {
    const modo = modoPantalla(), cont = contSala(modo); if (!cont) return;
    $(modo === 'calabozo' ? 'volverCalabozo' : 'volverReyes').style.visibility = sala ? 'hidden' : '';
    if (modo === 'calabozo' && $('calSel')) { $('calSel').disabled = !!sala; if (sala) $('calSel').value = sala.cal; }
    if (modo === 'calabozo' && $('difBtns')) pintarDifsCalabozo();   // en sala, la única salida es abandonarla
    if (!sala || sala.modo !== modo) return pintarListaSalas(modo, cont);
    if (sala.trasBatalla) { sala.trasBatalla = false; reiniciarReady(sala); }
    const reyes = modo === 'reyes', R = reyes ? revisarReyes() : null, d = reyes ? DIF_REYES[sala.dif] : null, mio = esDueno(sala, 'yo'), puede = puedeJugar(modo);
    const datos = p => `<small>${CLASES[p.clase].icono} ${CLASES[p.clase].nombre} Nv ${p.nivel} · ⚔ ${conPerfil(p, () => poder()).toLocaleString('es')}</small>`;
    const huecos = sala.miembros.map((m, i) => {
      const p = perfilDe(m.n), estado = i === 0 ? '<small>👑 Dueño</small>'
        : !m.llego ? '<small>⏳ Invitación enviada…</small>'
        : m.n === 'yo' ? `<button class="ready${m.listo ? ' on' : ''}" data-ready="1" ${puede ? '' : 'disabled'}>${m.listo ? '✔ READY' : 'Ready'}</button>`
        : `<span class="ready${m.listo ? ' on' : ''}">${m.listo ? '✔ READY' : '⏳ Ready'}</span>`;
      return `<div class="sala-slot ${m.llego ? 'lleno' : 'espera'}"><div class="pj-mini" data-retrato="${m.n === 'yo' ? '' : m.n}"></div><b>${nombreDe(m.n)}</b>${datos(p)}
        ${estado}${mio && i > 0 ? `<button data-expulsar="${m.n}">Expulsar</button>` : ''}</div>`;
    });
    while (huecos.length < MAX_JUGADORES) huecos.push(mio ? `<div class="sala-slot"><button class="pj-mini vacio" data-invitar="1">➕<small>Invitar</small></button></div>`
      : `<div class="sala-slot"><div class="pj-mini vacio">➕</div></div>`);
    const pendientes = sala.miembros.slice(1).some(m => !m.listo);
    const motivo = !puede ? ' (sin intentos hoy)' : pendientes ? ' (esperando ready…)' : '';
    cont.innerHTML = `<b>Sala #${sala.id}</b> <small>· 👥 ${sala.miembros.length}/${MAX_JUGADORES}</small><div class="sala-slots">${huecos.join('')}</div>
      ${sala.invitando ? `<div class="rey"><div class="info"><b>Invitar a un jugador</b>${candidatosSala().map(b =>
          `<small style="display:flex;align-items:center;gap:8px;justify-content:space-between">${CLASES[b.clase].icono} ${b.nombre} · Nv ${b.nivel} · ⚔ ${conPerfil(b, () => poder()).toLocaleString('es')}
           <button data-enviar="${b.nombre}" style="margin:0;min-height:30px;padding:3px 10px">Invitar</button></small>`).join('') || `<small>${MODO_PRUEBAS ? 'No hay más jugadores disponibles' : 'No hay jugadores conectados'}</small>`}</div>
          <button data-cerrar-invitar="1">Cerrar</button></div>` : ''}
      <small><b>Formación</b> · ${mio ? 'toca dos casillas para intercambiarlas' : 'la elige el dueño'}</small>
        <div class="rombo fila">${POSICIONES.map(pos => { const P = posSala(sala), n = Object.keys(P).find(k => P[k] === pos);
          return `<button class="casilla${n ? ' ocupada' : ''}${sala.selPos === pos ? ' sel' : ''}" data-pos-sala="${pos}" data-pos="${pos}" ${mio ? '' : 'disabled'}>${n ? `${CLASES[perfilDe(n).clase].icono} ${nombreDe(n)}` : '—'}<small>${NOMBRE_POS[pos]} · ${PESO_POS[pos]} %</small></button>`; }).join('')}</div>
      ${reyes ? `<div class="sala-difs">${Object.entries(DIF_REYES).map(([id, x]) =>
          `<button data-dif-reyes="${id}" class="${id === sala.dif ? 'on' : ''}" ${mio ? '' : 'disabled'}>${x.nombre}<small>${Math.round(x.pct * 100)} % atributos${R.vencidas[id] ? ' · ✔' : ''}</small></button>`).join('')}</div>
        <div class="sala-rivales">${reyesSemana().map(r => `<span>${i18nPuesto(r.puesto - 1)} ${CLASES[r.clase].icono} ${r.nombre} · ⚔ ${Math.round(r.poder * d.pct).toLocaleString('es')}</span>`).join('')}</div>
        <small class="nota">Premio ${d.nombre}${R.vencidas[sala.dif] ? ' (ya cobrado esta semana)' : ''}: ${textoPremio(d.premio)}. Pesadilla o Infierno: título «Matarreyes».</small>`
      : `<div class="sala-rivales"><span>3 monstruos + 👹 ${TIPOS_ENEMIGO[calabozo(sala.cal).jefe].nombre}</span><span>+${VIDA_POR_ALIADO * 100} % de vida por aliado</span></div>`}
      <div class="sala-acciones"><button data-salir-sala="1">Abandonar sala</button>
        ${!reyes ? `<small>Intentos: ${revisarCalabozo().entradas}/${INTENTOS_CALABOZO}</small>` : ''}
        ${mio ? `<button data-empezar="1" ${puede && !pendientes ? '' : 'disabled'}>⚔ Empezar${motivo}</button>` : `<small>${pendientes ? 'Pulsa Ready: el dueño empezará cuando todos estéis listos' : `${nombreDe(sala.miembros[0].n)} va a empezar…`}</small>`}</div>`;
    pintarRetratos(cont);
  }
  function clickSala(e) {
    const b = e.target.closest('button'); if (!b) return;
    const modo = modoPantalla();
    if (b.dataset.crearSala) { sala = { id: idSala(), modo, dif: modo === 'calabozo' ? difCal : 'normal', cal: calSel, miembros: [{ n: 'yo', llego: true, listo: true }] }; salas[modo].push(sala); return pintarSala(); }
    if (b.dataset.unirse) {
      const s = salas[modo].find(x => x.id === +b.dataset.unirse); if (!s || s.miembros.length >= MAX_JUGADORES) return;
      s.miembros.push({ n: 'yo', llego: true, listo: false }); sala = s; return pintarSala();
    }
    if (!sala) return;
    if (b.dataset.invitar) { sala.invitando = true; }
    else if (b.dataset.cerrarInvitar) { sala.invitando = false; }
    else if (b.dataset.enviar) {
      if (sala.miembros.length >= MAX_JUGADORES) return;
      const n = b.dataset.enviar; for (const s of [...salas[modo]]) if (s !== sala && s.miembros.some(m => m.n === n)) quitarDeSala(s, n);   // deja su sala
      const m = { n, llego: false, listo: false }; sala.miembros.push(m); sala.invitando = false;
      const s0 = sala, sigue = () => s0.miembros.includes(m);
      setTimeout(() => { if (!sigue()) return; m.llego = true; avisar(`${n} se ha unido a la sala`); repintarSala();
        setTimeout(() => { if (sigue()) { m.listo = true; repintarSala(); } }, 1000); }, 900);   // pruebas: el bot pulsa Ready 1 s después de llegar
    }
    else if (b.dataset.ready) {
      const yo = sala.miembros.find(m => m.n === 'yo'); yo.listo = !yo.listo;
      const s0 = sala;   // sala de un bot: empieza él cuando todos están listos (pruebas: 1 s después)
      if (yo.listo && !esDueno(s0, 'yo')) setTimeout(() => { if (sala === s0 && s0.miembros.slice(1).every(m => m.listo) && puedeJugar(s0.modo)) empezarSala(); }, 1000);
    }
    else if (b.dataset.expulsar) { quitarDeSala(sala, b.dataset.expulsar); }
    else if (b.dataset.posSala) {   // intercambia dos casillas de la formación (solo el dueño)
      if (!esDueno(sala, 'yo')) return;
      const pos = b.dataset.posSala, P = posSala(sala);
      if (!sala.selPos) sala.selPos = pos;
      else { const a = Object.keys(P).find(k => P[k] === sala.selPos), c = Object.keys(P).find(k => P[k] === pos);
        if (a) P[a] = pos; if (c) P[c] = sala.selPos; sala.selPos = null; }
    }
    else if (b.dataset.difReyes || b.dataset.difSala) {   // cambiar la dificultad devuelve a todos a la fase previa
      const d = b.dataset.difReyes || b.dataset.difSala;
      if (!esDueno(sala, 'yo') || d === sala.dif) return;
      sala.dif = d; reiniciarReady(sala);
    }
    else if (b.dataset.salirSala) return salirSala();
    else if (b.dataset.empezar) return empezarSala();
    else return;
    pintarSala();
  }
  function abrirLogin() {
    const L = login30(), hecho = L.n >= 30 && loginDisponible() ? 0 : L.n;   // ciclo completo: al día siguiente vuelve al 1
    abrirModal('comun', `<h2>📅 Login diario</h2><small>Un casillero por día que entres. Al completar el 30, vuelve a empezar.</small>
      <div class="login30">${Array.from({ length: 30 }, (_, i) => { const d = i + 1, ok = d <= hecho, hoyD = d === hecho + 1 && loginDisponible();
        return `<button class="dia30${ok ? ' hecho' : ''}${hoyD ? ' hoy' : ''}${d % 7 === 0 || d === 30 ? ' grande' : ''}" ${hoyD ? 'data-login30="1"' : 'disabled'}>
          <b>${d}</b><small>${ok ? '✔' : textoPremio(premioDia(d))}</small></button>`; }).join('')}</div>
      <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.acc === 'cerrar') return cerrarModal();
      if (b.dataset.login30 && loginDisponible()) { const pr = reclamarLogin(); guardar(); pintarHud(); avisar(`📅 Día ${login30().n}: ${textoPremio(pr)}`); abrirLogin(); }
    };
  }
  function pintarMisiones() {
    const M = revisarMisiones(), tabs = { diaria: 'Diarias', semanal: 'Semanales', expedicion: 'Expedición' };   // el login tiene su propio icono (📅)
    const punto = { diaria: misionesReclamables('diaria') || bonusDisponible('diaria'), semanal: misionesReclamables('semanal') || bonusDisponible('semanal'),
                    login: loginDisponible(), expedicion: expedicionLista() };
    let cuerpo = '';
    if (misTab === 'diaria' || misTab === 'semanal') {
      const lista = misionesVisibles(misTab), R = M['r' + misTab], b = BONUS_MISIONES[misTab], hechas = Object.keys(R).filter(k => k !== 'bonus').length;
      cuerpo = `<small class="nota">${misTab === 'diaria' ? 'Se renuevan cada día.' : 'Se renuevan cada lunes.'}</small>` + lista.map(m => {
        const v = Math.min(m.meta, M[misTab][m.ev] || 0), lista_ = v >= m.meta, rec = R[m.id];
        return `<div class="mision${rec ? ' hecha' : lista_ ? ' lista-m' : ''}"><div class="info">${m.txt}<small>${textoPremio(m.premio)}</small>
          <div class="prog"><i style="width:${v / m.meta * 100}%"></i></div></div><small>${v}/${m.meta}</small>
          <button data-reclamar="${m.id}" ${lista_ && !rec ? '' : 'disabled'}>${rec ? '✔' : 'Reclamar'}</button></div>`;
      }).join('') + `<div class="mision${R.bonus ? ' hecha' : hechas >= b.meta ? ' lista-m' : ''}"><div class="info">⭐ Completa ${b.meta} misiones<small>${textoPremio(b.premio)}</small>
          <div class="prog"><i style="width:${Math.min(1, hechas / b.meta) * 100}%"></i></div></div><small>${Math.min(hechas, b.meta)}/${b.meta}</small>
          <button data-reclamar="bonus" ${hechas >= b.meta && !R.bonus ? '' : 'disabled'}>${R.bonus ? '✔' : 'Reclamar'}</button></div>`;
    } else if (misTab === 'login') {
      const L = jugador.login || { dias: 0 }, hoyIdx = L.dias % 7;
      cuerpo = `<small class="nota">Entra cada día para recoger tu recompensa. Cada semana completa las recompensas suben un 25 % (hasta ×3). Llevas ${L.dias} días.</small>
        <div class="login-dias">${LOGIN.map((_, i) => `<div class="login-dia${i < hoyIdx || (i === hoyIdx && !loginDisponible()) ? ' hecho' : i === hoyIdx ? ' hoy' : ''}"><b>Día ${i + 1}</b><br>${textoPremio(LOGIN[i])}</div>`).join('')}</div>
        <button id="reclamarLogin" ${loginDisponible() ? '' : 'disabled'}>${loginDisponible() ? `Recoger: ${textoPremio(premioLogin())}` : 'Vuelve mañana'}</button>`;
    } else {
      const E = jugador.expedicion, propias = MASCOTAS.filter(m => nivelMascota(m) > 0 && m.id !== jugador.mascota);
      if (E) { const m = MASCOTAS.find(x => x.id === E.mascota), falta = Math.max(0, E.fin - Date.now());
        cuerpo = `<div class="torre-card"><h3>${m.cara} ${m.nombre} está de expedición (${E.horas} h)</h3>
          <small>${falta ? `Vuelve en ${Math.floor(falta / 3600000)} h ${Math.ceil(falta % 3600000 / 60000)} min` : '¡Ha vuelto!'}</small>
          <small>Trae: ${textoPremio(premioExpedicion(m, E.horas))}</small>
          <button id="recogerExp" ${falta ? 'disabled' : ''}>Recoger</button></div>`;
      } else if (!propias.length) cuerpo = '<small class="nota">Necesitas una mascota que no lleves puesta. Cómprala en la sección Mascota.</small>';
      else { expMasc = propias.some(m => m.id === expMasc) ? expMasc : propias[0].id; const m = MASCOTAS.find(x => x.id === expMasc);
        cuerpo = `<small class="nota">Manda una mascota que no lleves puesta; al volver trae oro y materiales. Mejores mascotas traen más.</small>
          <div class="tabs">${propias.map(x => `<button data-expm="${x.id}" class="${x.id === expMasc ? 'on' : ''}">${x.cara} ${x.nombre}</button>`).join('')}</div>
          <div class="tabs">${HORAS_EXPEDICION.map(h => `<button data-exph="${h}" class="${h === expHoras ? 'on' : ''}">${h} h</button>`).join('')}</div>
          <small>Trae: ${textoPremio(premioExpedicion(m, expHoras))}</small><button id="mandarExp">Mandar de expedición</button>`; }
    }
    $('misiones').innerHTML = `<div class="tabs">${Object.entries(tabs).map(([k, t]) => `<button data-mtab="${k}" class="${k === misTab ? 'on' : ''}${punto[k] ? ' con-punto' : ''}" style="position:relative">${t}</button>`).join('')}</div>${cuerpo}`;
  }
  $('misiones').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.mtab && !desbloqueado(b.dataset.mtab)) return avisoBloqueo(b.dataset.mtab);
    if (b.dataset.mtab) misTab = b.dataset.mtab;
    if (b.dataset.reclamar) { const pr = reclamarMision(misTab, b.dataset.reclamar); if (pr) avisar(textoPremio(pr)); }
    if (b.dataset.expm) expMasc = b.dataset.expm;
    if (b.dataset.exph) expHoras = +b.dataset.exph;
    if (b.id === 'mandarExp' && !jugador.expedicion) { jugador.expedicion = { mascota: expMasc, horas: expHoras, fin: Date.now() + expHoras * 3600000 }; avisar('🧭 ¡En marcha!'); }
    if (b.id === 'recogerExp' && expedicionLista()) { const E = jugador.expedicion, pr = premioExpedicion(MASCOTAS.find(x => x.id === E.mascota), E.horas); delete jugador.expedicion; darPremio(pr); avisar(textoPremio(pr)); }
    guardar(); pintarHud(); pintarMisiones();
  });
  document.addEventListener('click', e => { const b = e.target.closest('[data-ir-formacion]'); if (b) { volverDeFormacion = b.dataset.irFormacion; ir('pFormacion'); } });
  $('volverFormacion').onclick = () => ir(volverDeFormacion);
  function pintarFormacion() {
    const F = jugador.formacion, quien = pos => F.pos === pos ? 'yo' : (F.aliados.find(a => a.pos === pos) || {}).bot;
    const nombreDe = q => q === 'yo' ? `${CLASES[jugador.clase].icono} Tú` : `${CLASES[DEF_BOTS.find(d => d.nombre === q).clase].icono} ${q}`;
    $('formacion').innerHTML = `<small class="nota">Elige una ficha y toca una casilla. Los golpes normales enemigos caen más en el frente
        (Frente 50 % · Arriba 20 % · Abajo 20 % · Retaguardia 10 %); las habilidades, en cualquiera. En grupo, máximo ${MAX_JUGADORES} jugadores
        (sin servidor, los aliados son los bots del ranking) y los enemigos tienen +${VIDA_POR_ALIADO * 100} % de vida por aliado.</small>
      <div class="fichas"><button data-ficha="yo" class="${fichaSel === 'yo' ? 'on' : ''}">${nombreDe('yo')}</button>
        ${(MODO_PRUEBAS ? DEF_BOTS : []).map(d => `<button data-ficha="${d.nombre}" class="${fichaSel === d.nombre ? 'on' : ''}">${nombreDe(d.nombre)} · ⚔ ${conPerfil(bots().find(b => b.nombre === d.nombre), () => poder()).toLocaleString('es')}</button>`).join('')}
        <button data-ficha="quitar" class="${fichaSel === 'quitar' ? 'on' : ''}">✖ Quitar aliado</button></div>
      <div class="rombo">${POSICIONES.map(pos => { const q = quien(pos);
        return `<button class="casilla${q ? ' ocupada' : ''}" data-pos="${pos}">${q ? nombreDe(q) : '—'}<small>${NOMBRE_POS[pos]} · ${PESO_POS[pos]} %</small></button>`; }).join('')}</div>
      <small class="nota">Jugadores: ${1 + F.aliados.length}/${MAX_JUGADORES}</small>`;
  }
  $('formacion').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const F = jugador.formacion;
    if (b.dataset.ficha) { fichaSel = b.dataset.ficha; return pintarFormacion(); }
    const pos = b.dataset.pos; if (!pos) return;
    const ocupante = F.pos === pos ? 'yo' : (F.aliados.find(a => a.pos === pos) || {}).bot;
    if (fichaSel === 'quitar') { F.aliados = F.aliados.filter(a => a.pos !== pos); }
    else if (fichaSel === 'yo') {   // mover tu personaje (si había un aliado, se intercambian las casillas)
      const al = F.aliados.find(a => a.pos === pos); if (al) al.pos = F.pos; F.pos = pos;
    } else {
      const ya = F.aliados.find(a => a.bot === fichaSel);
      if (ocupante === 'yo') { if (ya) { ya.pos = F.pos; F.pos = pos; } }   // no se pisa tu casilla: solo se intercambia si el aliado ya está
      else if (ya) { const otro = F.aliados.find(a => a.pos === pos); if (otro) otro.pos = ya.pos; ya.pos = pos; }
      else if (1 + F.aliados.length >= MAX_JUGADORES && !ocupante) { avisar(`Máximo ${MAX_JUGADORES} jugadores`); }
      else { F.aliados = F.aliados.filter(a => a.pos !== pos); F.aliados.push({ bot: fichaSel, pos }); }
    }
    guardar(); pintarFormacion();
  });   // { heroes: [...], enemigos: [...], ronda: n }
  const arenaG = $('arenaGrupo');
  function ajustarGrupo() {
    const esc = document.querySelector('.escena'), e = Math.min(1, (esc.clientWidth - 16) / ANCHO_GRUPO, (esc.clientHeight - 30) / ALTO_GRUPO);
    Object.assign(arenaG.style, { width: ANCHO_GRUPO + 'px', height: ALTO_GRUPO + 'px', transform: `scale(${e})`,
      marginLeft: `${-(1 - e) * ANCHO_GRUPO / 2}px`, marginRight: `${-(1 - e) * ANCHO_GRUPO / 2}px`, marginBottom: `${-(1 - e) * ALTO_GRUPO}px` });
  }
  function dibujarUnidad(u) {
    const el = document.createElement('div');
    el.className = `unidad ${u.lado === 0 ? 'heroe' : 'enemigo'}`; Object.assign(el.style, { left: u.x + 'px', top: u.y + 'px', zIndex: 2 + Math.round(u.y / 50) });
    el.innerHTML = `<div class="sombra"></div><div class="vida"><b></b><div class="barra"><i></i></div><div class="estados"></div></div>` +
      (u.lado === 0 ? `<div class="pj"><div class="frames guerrero"></div></div>` : `<div class="espejo"><div class="pj"><div class="frames"></div></div></div>`);
    el.querySelector('.vida b').textContent = u.nombre; arenaG.appendChild(el);
    u.el = el;
  }
  async function dibujarGrupo(c) {
    arenaG.innerHTML = ''; $('oleada').textContent = c.torre ? `Piso ${c.torre}` : '';
    const { heroes, enemigos } = batalla.grupo;
    for (const u of heroes) {
      dibujarUnidad(u);
      if (u.yo) u.el.classList.add('yo');
      const capas = montarCapas(u.el.querySelector('.frames')); conPerfil(u.perfil, () => pintarVista(capas));
      u.pj = personaje(u.el, 296); pintarVida(u.el, u.vida, u.vidaMax);
    }
    const yo = heroes.find(h => h.yo), m = mascotaActual();
    if (m) { const a = document.createElement('div'); a.className = 'acompana'; a.innerHTML = dibujoMascota(m, .4); yo.el.appendChild(a); yo.mascotaEl = a; }
    for (const u of enemigos) {
      dibujarUnidad(u);
      if (u.perfil) {   // un rey: se dibuja como un jugador
        u.el.classList.replace('enemigo', 'unidad-rey');
        const fr = u.el.querySelector('.frames'); fr.classList.add('guerrero');
        const capas = montarCapas(fr); conPerfil(u.perfil, () => pintarVista(capas));
        u.pj = personaje(u.el, 296); pintarVida(u.el, u.vida, u.vidaMax);
        if (u.e.jefe) u.el.classList.add('jefe');
      } else {
        if (u.e.jefe) u.el.classList.add('jefe');
        u.el.querySelector('.frames').style.filter = u.e.filtro || '';
        u.pj = personaje(u.el, 260); pintarVida(u.el, u.vida, u.vidaMax);
      }
    }
    marcarObjetivo(batalla.grupo.objetivo);
    ajustarGrupo();
    if (c.reyes) avisar('¡Los 3 reyes!'); else if (enemigos.some(u => u.e.jefe)) avisar('¡Jefe!');
    await wait(500);
  }

  // ---- dibujo de las unidades ----
  function fxU(u, cls, texto, dy = 0) {
    const e = document.createElement('div'); e.className = `fx-grupo fx ${cls}`; e.textContent = texto;
    e.style.left = (u.x + 70) + 'px'; e.style.top = (u.y + 10 + dy) + 'px'; arenaG.appendChild(e); setTimeout(() => e.remove(), 1500);
  }
  function marcarObjetivo(t) { batalla.grupo.objetivo = t; for (const e of batalla.grupo.enemigos) e.el.classList.toggle('objetivo', e === t); }
  arenaG.addEventListener('click', e => {
    const el = e.target.closest('.unidad'); if (!el || !batalla.grupo) return;
    const t = batalla.grupo.enemigos.find(x => x.el === el); if (t && t.vida > 0) marcarObjetivo(t);
  });

  // ---- animaciones ----
  async function moverA(u, t) {   // se acerca al objetivo (cuerpo a cuerpo)
    const dx = t.x - u.x + (u.lado === 0 ? -170 : 170), dy = t.y - u.y;
    u.el.style.zIndex = 20; u.el.style.transform = `translate(${dx}px, ${dy}px)`; await wait(220);
  }
  async function volver(u) { u.el.style.transform = ''; await wait(220); u.el.style.zIndex = 2 + Math.round(u.y / 50); }
  async function proyectil(u, t, icono) {
    const p = document.createElement('div'); p.className = 'proyectil'; p.textContent = icono;
    p.style.left = (u.x + (u.lado === 0 ? 180 : 40)) + 'px'; p.style.top = (u.y + 80) + 'px'; arenaG.appendChild(p);
    void p.offsetWidth;   // fuerza el layout para que la transición arranque (rAF no corre con la pestaña oculta)
    p.style.left = (t.x + 80) + 'px'; p.style.top = (t.y + 80) + 'px'; await wait(300); p.remove();
  }
  // ataque de un héroe: los guerreros van cuerpo a cuerpo; arqueros y magos disparan desde su casilla
  async function animHeroe(u, t, hab) {
    const lejos = u.clase !== 'guerrero';
    if (hab) { u.el.querySelector('.frames').classList.add('carga'); await wait(250); u.el.querySelector('.frames').classList.remove('carga'); }
    if (!lejos) await moverA(u, t);
    const impacto = u.pj.jugar([[1, 110], [2, 110], [3, 80, , sonidoEspada], [4, 140, , r => r()], [5, 110], [6, 130], [7, 100]]);
    if (lejos) await proyectil(u, t, hab ? hab.icono : u.clase === 'arquero' ? '🏹' : '✨');
    await impacto;
    return lejos ? null : () => volver(u);
  }
  async function animEnemigo(u, t) {
    await moverA(u, t);
    await u.pj.jugar([[1, 150], [2, 170, , sonidoGuadana], [3, 180, , r => r()], [4, 150]]);
    return () => volver(u);
  }
  function golpeVisual(t) { t.el.classList.remove('golpeado'); void t.el.offsetWidth; t.el.classList.add('golpeado'); setTimeout(() => t.el.classList.remove('golpeado'), 600); }
  function pararCuentaTurno() { clearInterval(cuentaTurno); cuentaTurno = null; delete btn.dataset.cuenta; }
  function iniciarCuentaTurno() {
    pararCuentaTurno();
    if (!batalla.campana || !(batalla.campana.reyes || batalla.campana.calabozo) || batalla.terminada || auto) return;
    let t = TIEMPO_TURNO; btn.dataset.cuenta = t;
    cuentaTurno = setInterval(() => {
      if (batalla.terminada || auto || pantallaActual !== 'pBatalla') return pararCuentaTurno();
      if (enRonda) return;
      if (--t > 0) btn.dataset.cuenta = t; else { pararCuentaTurno(); ronda(null); }
    }, 1000);
  }
  function pintarObjetivos() {
    $('campObjetivos').innerHTML = `<b>🎯 Objetivos</b>` + objetivosCercanos().map(o =>
      `<button data-ir="${o.ir}"><span>${o.icono} ${o.txt}</span><span class="barra-obj"><i style="width:${Math.round(o.pct * 100)}%"></i></span></button>`).join('');
  }
  function pintarCampamento() {
    const pct = jugador.xp / xpParaSubir(jugador.nivel) * 100, c = CLASES[jugador.clase], m = mascotaActual(), a = avisosCampamento();
    $('campAvatar').innerHTML = `<span class="cara">${c.icono}<b>${jugador.nivel}</b></span>
      <span><span class="poder">⚔ ${poder().toLocaleString('es')}</span><span class="xp"><i style="width:${pct}%"></i></span></span>`;
    $('campRecursos').innerHTML = `<span class="recurso oro">● ${jugador.oro.toLocaleString('es')}</span><span class="recurso estamina">⚡ ${jugador.estamina}/${ESTAMINA_MAX}</span>`;
    $('campNombre').innerHTML = `${etiquetaTitulo(tituloActual())}${jugador.nombre} · ${c.nombre} Nv ${jugador.nivel}`;
    $('campMascota').innerHTML = m ? dibujoMascota(m, .3) : '';
    pintarObjetivos();
    document.querySelectorAll('#menu [data-ir], #modoBatalla [data-modo-batalla], .heroe-tabs [data-ir], [data-invtab]').forEach(b => {
      const id = b.dataset.ir || b.dataset.modoBatalla || b.dataset.invtab, ok = desbloqueado(id);
      b.classList.toggle('bloqueado', !ok); if (ok) delete b.dataset.nv; else b.dataset.nv = `Nv ${nivelDesbloqueo(id)}`;
    });
    $('campArbol').classList.toggle('con-punto', a.arbol);
    $('campTitulos').classList.toggle('con-punto', a.titulos);
    $('campJefe').classList.toggle('con-punto', a.jefe);
    $('campArena').classList.toggle('con-punto', a.arena);
    $('campMisiones').classList.toggle('con-punto', !!a.misiones);
    $('campReyes').classList.toggle('con-punto', a.reyes);
    $('campLogin').classList.toggle('con-punto', loginDisponible());
    const ev = eventoHoy(), man = eventoDia((ahoraJuego().getDay() + 1) % 7);
    $('campEvento').innerHTML = ev ? `${ev.icono} ${ev.nombre}: ${ev.desc}<small> · mañana: ${man.icono} ${man.nombre}</small>` : '';
    $('navHeroe').classList.toggle('con-punto', a.arbol || a.titulos);
    $('navMascota').classList.toggle('con-punto', a.mascota);
    $('navBatalla').classList.toggle('con-punto', a.batalla);
    document.querySelectorAll('.tab-arbol').forEach(b => b.classList.toggle('con-punto', a.arbol));
  }
  // Escala de las pantallas de menú en móvil horizontal: proporcional a la altura, para que guarden las proporciones
  // del Campamento (320 px de alto → 0,7 · 360 → 0,78 · 450 o más → 1)
  function ajustarUI() {
    const w = document.body.clientWidth, h = document.body.clientHeight;   // tamaño del lienzo
    const z = w > h && h < 560 ? Math.min(1, Math.max(.66, h / 460)) : 1;
    document.documentElement.style.setProperty('--ui', z.toFixed(3));
  }
  addEventListener('resize', ajustarUI); ajustarUI();
  // accesos del campamento: las flechas solo aparecen si hay más iconos a ese lado
  function paginarAccesos() {
    const l = $('campIconos');
    $('campPagAnt').classList.toggle('oculto', l.scrollLeft <= 1);
    $('campPagSig').classList.toggle('oculto', l.scrollLeft + l.clientWidth >= l.scrollWidth - 1);
  }
  $('campPagAnt').onclick = () => $('campIconos').scrollBy({ left: -$('campIconos').clientWidth });
  $('campPagSig').onclick = () => $('campIconos').scrollBy({ left: $('campIconos').clientWidth });
  $('campIconos').addEventListener('scroll', paginarAccesos);
  addEventListener('resize', paginarAccesos); paginarAccesos();
  campListo = true; pintarCampamento();
  $('campVersion').textContent = `v${VERSION_JUEGO}${MODO_PRUEBAS ? ' · pruebas' : ''}`; $('pruebasVersion').textContent = `v${VERSION_JUEGO}`;   // tiempo real (wait() va con la velocidad de batalla)
  function botCerrarMensajes() {   // mensajes de solo OK (desbloqueos...); los de confirmar se dejan
    if ($('dialogo').classList.contains('visible') && $('dialogoNo').hidden) $('dialogoSi').click();
  }
  // siguiente cosa por jugar: { clave, iniciar } o { barrido: [c, d] }
  function botSiguiente() {
    revisarEstamina();
    const pocos = k => (botFallos[k] || 0) < 2;
    if (jugador.estamina >= ESTAMINA_CAMPANA) {
      for (const c of CAMPANAS) for (const d of ORDEN_DIF) {
        const k = `${c.id}:${d}`, b = $('listaCampanas').querySelector(`[data-campana="${c.id}"][data-dif="${d}"]`);
        if (b && !b.disabled && !superada(c.id, d) && pocos(k)) return { clave: k, iniciar: () => b.click() };
      }
    }
    const piso = 'torre' + (jugador.torre.mejor + 1);
    if (desbloqueado('pTorre') && pocos(piso)) return { clave: piso, iniciar: iniciarTorre };
    if (desbloqueado('pArena') && revisarArena().entradas > 0) {
      const a = revisarArena(), i = a.rivales.reduce((m, r, k) => r.f < a.rivales[m].f ? k : m, 0);   // el rival más fácil
      return { clave: 'arena', iniciar: () => { pintarArena(); $('arenaPvp').querySelector(`[data-rival="${i}"]`).click(); } };
    }
    if (desbloqueado('pEvento') && entradasJefe() > 0) {
      const id = Object.keys(MUNDIALES).find(m => estadoMundial(m).vida > 0 && pocos('jefe' + m));
      if (id) return { clave: 'jefe' + id, iniciar: () => { mundialSel = id; iniciarMundial(); } };
    }
    if (jugador.estamina >= ESTAMINA_CAMPANA)   // farmeo: barrido del nivel más alto ya superado
      for (const c of [...CAMPANAS].reverse()) for (const d of [...ORDEN_DIF].reverse()) if (superada(c.id, d)) return { barrido: [c, d] };
    return null;
  }
  // espera a que termine la batalla en curso con el autoataque puesto: true victoria, false derrota, null si no empezó o se paró
  async function botBatalla() {
    if (pantallaActual !== 'pBatalla' || batalla.terminada) return null;
    await esperar(1500);   // que salgan los enemigos antes de atacar
    while (!batalla.terminada) {
      if (!botModo) return null;
      botCerrarMensajes();
      if (!auto && !bucle && !enRonda) btnAuto.click();
      await esperar(300);
    }
    await esperar(300);
    return $('resTitulo').textContent.startsWith('¡Victoria');
  }
  async function botRepetir() {
    while (botModo === 'repetir') {
      botCerrarMensajes();
      if (pantallaActual === 'pBatalla' && !batalla.terminada) { ponerVelocidad(VELOCIDADES.at(-1)); if (await botBatalla() === null) continue; }
      if (pantallaActual === 'pBatalla' && $('resultado').classList.contains('visible')) {
        if ($('resOtra').style.display === 'none') { avisar('Bot: esta batalla no se repite'); break; }
        await esperar(800); if (botModo !== 'repetir') break;
        ponerVelocidad(VELOCIDADES.at(-1)); $('resOtra').click(); await esperar(500);
        if (batalla.terminada) { avisar('Bot: sin estamina'); break; }   // no pudo empezar otra
        continue;
      }
      await esperar(500);   // fuera de batalla: espera a que el jugador entre en una
    }
    botParar();
  }
  async function botJugar() {
    if (pantallaActual === 'pBatalla' && $('resultado').classList.contains('visible')) $('resSalir').click();
    while (botModo === 'jugar') {
      botCerrarMensajes(); botPreparar();
      const acc = botSiguiente();
      if (!acc) { avisar('Bot: nada más que jugar hoy'); break; }
      if (acc.barrido) { barrido(...acc.barrido); await esperar(400); continue; }
      ponerVelocidad(VELOCIDADES.at(-1)); acc.iniciar(); await esperar(100);
      const gano = await botBatalla();
      if (!botModo) break;
      if (!gano) botFallos[acc.clave] = (botFallos[acc.clave] || 0) + 1;   // derrota o no pudo empezar
      if (pantallaActual === 'pBatalla') { await esperar(600); $('resSalir').click(); }
      await esperar(400);
    }
    botParar();
  }
  function botEmpezar(modo) {
    if (!MODO_PRUEBAS || botModo) return;
    botModo = modo; botVel = velElegida;
    $('pruebasMenu').classList.remove('visible'); $('botParar').hidden = false;
    (modo === 'jugar' ? botJugar() : botRepetir()).catch(e => { console.error(e); avisar('Bot: error, ver consola'); botParar(); });
  }
  function botParar() {
    if (!botModo) return;
    botModo = null; $('botParar').hidden = true; ponerVelocidad(botVel);
    if (auto) btnAuto.click();   // quita el autoataque que puso el bot
    avisar('Bot parado');
  }
  $('botRepetir').onclick = () => botEmpezar('repetir');
  $('botJugar').onclick = () => botEmpezar('jugar');
  $('botParar').onclick = botParar;
  $('simPrueba').onclick = () => {
    if (!MODO_PRUEBAS) return;
    const ops = opcionesSimulacion();
    abrirModal('comun', `<h2>Simular 100 batallas</h2><small>Con tu partida y el autoataque; la partida no cambia.</small>
      <div class="sim-lista">${ops.map(([n], i) => `<button data-sim="${i}">${n}</button><small id="sim${i}"></small>`).join('')}</div>
      <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.acc === 'cerrar') return cerrarModal();
      if (b.dataset.sim == null) return;
      const r = simular(ops[+b.dataset.sim][1]());
      $('sim' + b.dataset.sim).textContent = `${r.pctVictoria} % victorias · ${r.rondasMedia} rondas · ${r.vidaMedia} % de vida${r.sinTerminar ? ` · ${r.sinTerminar} sin terminar` : ''}`;
    };
  };
  $('progPrueba').onclick = () => {   // tarda unos segundos: primero se muestra el aviso y luego se simula
    if (!MODO_PRUEBAS) return;
    abrirModal('comun', '<h2>Simulando 90 días…</h2>');
    setTimeout(() => {
      const r = simularProgresion({ dias: 90 }); pintarHud(); pintarCampamento();   // al simular se pintó la partida simulada
      if (!r) return cerrarModal();
      const H = r.hitos, ult = CAMPANAS.at(-1).id, fila = (t, l) => `<p><b>${t}</b><br>${l.join(' · ') || '—'}</p>`;
      abrirModal('comun', `<h2>Partida nueva: 90 días</h2><small>Juega todo lo que puede cada día, como el bot; calabozo y reyes en grupo de 3 de su nivel.</small>
        ${fila('Nivel (día)', [10, 20, 30, 40, 50, 60, 70, 80].filter(n => H.nivel[n]).map(n => `Nv ${n}: ${H.nivel[n]}`))}
        ${fila(`Campaña ${ult} (día)`, ORDEN_DIF.filter(d => H.campana[`${ult} ${d}`]).map(d => `${DIFICULTADES[d]}: ${H.campana[`${ult} ${d}`]}`))}
        ${fila('Torre (día)', Object.entries(H.torre).map(([p, d]) => `${p}: ${d}`))}
        ${fila('Jefes mundiales vencidos (día)', Object.entries(H.jefes).map(([id, d]) => `${NOMBRE_JEFE[id]}: ${d}`))}
        ${fila('Calabozos (día)', CALABOZOS.map(c => { const l = ORDEN_DIF.filter(d => H.calabozo[`${c.id} ${d}`]); return l.length ? `${c.icono} ${DIFICULTADES[l.at(-1)]}: ${H.calabozo[`${c.id} ${l.at(-1)}`]}` : ''; }).filter(Boolean))}
        ${fila('Torre de reyes (día)', Object.entries(H.reyes).map(([d, n]) => `${DIF_REYES[d].nombre}: ${n}`))}
        ${fila('Día 90', [`Nv ${r.final.nivel}`, `⚔ ${r.final.poder.toLocaleString('es')}`, `piso ${r.final.torre}`])}
        <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
      $('detCaja').onclick = e => { if (e.target.closest('[data-acc="cerrar"]')) cerrarModal(); };
    }, 50);
  };
  $('escPrueba').onclick = () => {
    if (!MODO_PRUEBAS) return;
    const res = correrEscenarios(), ok = res.filter(r => r.ok).length;
    abrirModal('comun', `<h2>Escenarios: ${ok}/${res.length}</h2>
      <div class="esc-lista">${res.map(r => `<span>${r.ok ? '✅' : r.pendiente ? '⚠️' : '❌'}</span><div>${r.nombre}${r.ok ? '' : `<br><small>${r.pendiente ? 'Pendiente · ' : ''}${r.detalle}</small>`}</div>`).join('')}</div>
      <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = e => { if (e.target.closest('[data-acc="cerrar"]')) cerrarModal(); };
  };
