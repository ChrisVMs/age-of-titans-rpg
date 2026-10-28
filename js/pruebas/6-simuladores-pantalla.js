  // ---------------- Simulador de progresión (pruebas) (pantalla) ----------------
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
