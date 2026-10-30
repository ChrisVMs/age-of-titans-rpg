  // ---------------- Clases y árbol de habilidades (pantalla) ----------------
  function pintarArbol() {
    claseVista = jugador.clase;   // solo se muestra el árbol de tu clase
    const ramas = ARBOL[claseVista] || [], propia = claseVista === jugador.clase, A = arbolVista(), pend = puntosSinGuardar();
    const sel = ramas.flatMap(r => r.nodos.map((n, i) => ({ n, i, rama: r }))).find(x => x.n.id === arbolSel);
    let ficha = '<small>Toca un nodo para ver qué hace.</small>';
    if (sel) {
      const { n, i, rama } = sel, r = rango(n.id, A), abierto = nodoAbierto(rama, i, A);
      const req = i > 0 && !abierto ? `<p class="req">Requiere ${3 * i} puntos en ${rama.nombre} y aprender ${rama.nodos[i - 1].nombre}</p>` : '';
      ficha = `<h2>${iconoDe(n)} ${n.nombre}</h2>
        <p>Rango <b>${r}/${n.max}</b>${r > rango(n.id) ? ` <span class="pend">(+${r - rango(n.id)} sin guardar)</span>` : ''}</p>
        ${r ? `<p>Actual: ${n.d(r)}</p>` : ''}
        ${r < n.max ? `<p>${r ? 'Siguiente' : 'Efecto'}: ${n.d(r + 1)}</p>` : '<p>Rango máximo</p>'}${req}`;
    }
    $('arbol').innerHTML = `${htmlMaestria()}${htmlAscension()}
      ${propia ? `<div class="arbol-puntos">Puntos libres: <b>${puntosLibres(A)}</b> · gastados ${puntosGastados(A)}
        <button id="reiniciarArbol" ${puntosGastados() || pend ? '' : 'disabled'}>Reiniciar ● ${costeReinicio()}</button></div>
        ${pend ? `<div class="arbol-guardar"><span><img class="ic-txt" src="img/iconos/editar.png" alt="">${pend} punto${pend > 1 ? 's' : ''} sin guardar</span>
          <button id="descartarArbol">Descartar</button><button id="guardarArbol"><img class="ic-txt" src="img/iconos/guardar.png" alt="">Guardar</button></div>` : ''}` : ''}
      <div class="ramas">${ramas.map(rama => `<div class="rama"><h3>${iconoDe(rama)} ${rama.nombre}<small>${puntosRama(rama, A)} pts</small></h3>
        ${rama.nodos.map((n, i) => {
          const r = rango(n.id, A), abierto = nodoAbierto(rama, i, A), nuevo = r > rango(n.id);
          const cls = r >= n.max ? 'aprendido max' : r ? 'aprendido' : abierto && puntosLibres(A) > 0 ? 'disponible' : abierto ? '' : 'bloqueado';
          const elegido = n.id === arbolSel && propia;
          return `<div class="nodo-wrap${r ? ' aprendido' : ''}">
            ${elegido ? `<button class="nodo-pm menos" data-pm="-1" ${puedeQuitar(rama, i) ? '' : 'disabled'} aria-label="Quitar punto">−</button>` : ''}
            <button class="nodo ${cls}${nuevo ? ' pendiente' : ''}${n.id === arbolSel ? ' sel' : ''}" data-nodo="${n.id}" aria-label="${n.nombre}">${iconoDe(n, 'ic-nodo')}<i>${r}/${n.max}</i></button>
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
