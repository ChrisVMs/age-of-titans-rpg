  // ---------------- Escenarios de prueba (pantalla) ----------------
  $('escPrueba').onclick = () => {
    if (!MODO_PRUEBAS) return;
    const res = correrEscenarios(), ok = res.filter(r => r.ok).length;
    abrirModal('comun', `<h2>Escenarios: ${ok}/${res.length}</h2>
      <div class="esc-lista">${res.map(r => `<span>${r.ok ? '✅' : r.pendiente ? '⚠️' : '❌'}</span><div>${r.nombre}${r.ok ? '' : `<br><small>${r.pendiente ? 'Pendiente · ' : ''}${r.detalle}</small>`}</div>`).join('')}</div>
      <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = e => { if (e.target.closest('[data-acc="cerrar"]')) cerrarModal(); };
  };
