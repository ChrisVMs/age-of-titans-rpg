  // ---------------- Navegación entre pantallas (pantalla) ----------------
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
  Object.assign(ui, { mensaje, enBatalla: () => pantallaActual === 'pBatalla' });
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
