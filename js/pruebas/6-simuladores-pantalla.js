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
  // Simular progresión: eliges los días (DIAS_SIM_MAX como mucho) y desde dónde (partida nueva o tu personaje); se simula en
  // un hilo aparte con barra de avance. Al terminar puedes simular más días sobre el mismo personaje (se suman los hitos) o
  // quedarte con él (reemplaza tu partida de pruebas). sim: la simulación en curso { inicio, dias, hitos, r, desde }.
  const DIAS_SIM_MAX = 180;
  let hiloSim = null, cancelarSim = null, sim = null;
  const diasPedidos = def => Math.max(1, Math.min(DIAS_SIM_MAX, Math.round(+$('simDias').value || def)));
  const campoDias = def => `<label class="prueba-check">Días <input id="simDias" type="number" min="1" max="${DIAS_SIM_MAX}" value="${def}" style="width:70px"></label>`;
  $('progPrueba').onclick = () => {
    if (!MODO_PRUEBAS) return;
    abrirModal('comun', `<h2>Simular progresión</h2><small>Juega todo lo que puede cada día (300 de estamina con anuncios).</small>
      ${campoDias(90)}
      <div class="fila"><button data-acc="nueva">Partida nueva</button><button data-acc="yo">Mi personaje (Nv ${jugador.nivel})</button></div>
      <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = e => {
      const acc = e.target.closest('[data-acc]')?.dataset.acc;
      if (acc === 'cerrar') cerrarModal();
      if (acc === 'nueva' || acc === 'yo') simularConAvance(diasPedidos(90), { inicio: offsetDias + (acc === 'yo' ? 1 : 0), previos: 0, perfil: acc === 'yo' ? structuredClone(jugador) : null, desde: acc });
    };
  };
  // hitos de un tramo sumados a los anteriores: los días se corren lo ya simulado y se queda el primero
  function sumarHitos(H0, H, previos) {
    if (!H0) return H;
    const R = structuredClone(H0);
    for (const cat of ['nivel', 'campana', 'torre', 'jefes', 'calabozo', 'reyes']) for (const [k, d] of Object.entries(H[cat] || {})) R[cat][k] ??= d + previos;
    for (const [k, v] of Object.entries(H.grieta || {})) R.grieta[+k + Math.floor(previos / 7)] = v;
    for (const cat of ['ecos', 'ecosJugados']) for (const [k, v] of Object.entries(H[cat] || {})) R[cat][k] = (R[cat][k] || 0) + v;
    return R;
  }
  // tramo: { inicio (día de juego del primer día simulado; con tu personaje, mañana), previos (días ya simulados), perfil, desde }
  async function simularConAvance(dias, tramo) {
    const total = tramo.previos + dias, opciones = { dias, semilla: 1 + tramo.previos, estaminaExtra: 150, perfil: tramo.perfil }, avance = d => {
      const pct = Math.round(d / dias * 100);
      abrirModal('comun', `<h2>Simulando ${dias} días… ${pct} %</h2><div class="grieta-vida"><div class="prog"><i style="width:${pct}%"></i></div><small>día ${tramo.previos + d}</small></div>
        <div class="fila"><button data-acc="cancelar">Cancelar</button></div>`);
      $('detCaja').onclick = e => { if (e.target.closest('[data-acc="cancelar"]')) { hiloSim?.terminate(); cancelarSim?.('cancelada'); cerrarModal(); } };
    };
    avance(0);
    const offset = tramo.inicio + tramo.previos;
    let r;
    try {   // hilo aparte (no existe abriendo el archivo directamente: ahí se simula de una vez, sin avance)
      const orden = await (await fetch('js/orden.json')).json();
      const archivos = [...orden.juego, ...orden.pruebas].filter(f => f.startsWith('js/logica/') || /^js\/pruebas\/[1-4]-/.test(f));
      r = await new Promise((ok, mal) => {
        cancelarSim = mal; hiloSim = new Worker('js/pruebas/simulador-hilo.js');
        hiloSim.onmessage = e => { if (e.data.dia) avance(e.data.dia); else if (e.data.error) mal(e.data.error); else ok(e.data.fin); };
        hiloSim.onerror = ev => mal(ev.message);
        hiloSim.postMessage({ archivos, offset, ...opciones });
      });
      hiloSim.terminate(); hiloSim = null;
    } catch (err) {
      hiloSim = null;
      if (err === 'cancelada') return;
      console.warn('Simulación sin hilo:', err);
      await new Promise(f => setTimeout(f, 50));
      const o0 = offsetDias; offsetDias = offset;
      try { r = simularProgresion(opciones); }
      catch (e) { console.error(e); cerrarModal(); avisar('La simulación falló: ' + e.message); return; }
      finally { offsetDias = o0; }
      pintarHud(); pintarCampamento();
    }
    if (!r) return;
    sim = { inicio: tramo.inicio, dias: total, desde: tramo.desde, r, hitos: sumarHitos(tramo.previos ? sim?.hitos : null, r.hitos, tramo.previos) };
    mostrarSimulacion();
  }
  function mostrarSimulacion() {
    const { r, dias } = sim, H = sim.hitos, fila = (t, l) => `<p><b>${t}</b><br>${l.join(' · ') || '—'}</p>`;
    abrirModal('comun', `<h2>${sim.desde === 'yo' ? 'Tu personaje' : 'Partida nueva'}: ${dias} días</h2><small>Juega todo lo que puede cada día, como el bot; calabozo y reyes en grupo de 3 de su nivel.</small>
      ${fila('Nivel (día)', [10, 20, 30, 40, 50, 60, 70, 80].filter(n => H.nivel[n]).map(n => `Nv ${n}: ${H.nivel[n]}`))}
      ${fila('Campaña: último nivel de cada etapa (día)', ETAPAS.filter(e => CAMPANAS.some(c => c.etapa === e.id)).map(e => { const id = `${e.id}-10`, l = ORDEN_DIF.filter(d => H.campana[`${id} ${d}`]);
        return l.length ? `${id} ${DIFICULTADES[l.at(-1)]}: ${H.campana[`${id} ${l.at(-1)}`]}` : ''; }).filter(Boolean))}
      ${fila('Torre (día)', Object.entries(H.torre).map(([p, d]) => `${p}: ${d}`))}
      ${fila('Jefes mundiales vencidos (día)', Object.entries(H.jefes).map(([id, d]) => `${NOMBRE_JEFE[id]}: ${d}`))}
      ${fila('Calabozos (día)', CALABOZOS.map(c => { const l = ORDEN_DIF.filter(d => H.calabozo[`${c.id} ${d}`]); return l.length ? `${c.icono} ${DIFICULTADES[l.at(-1)]}: ${H.calabozo[`${c.id} ${l.at(-1)}`]}` : ''; }).filter(Boolean))}
      ${fila('Torre de reyes (día)', Object.entries(H.reyes).map(([d, n]) => `${DIF_REYES[d].nombre}: ${n}`))}
      ${fila(`Día ${dias}`, [`Nv ${r.final.nivel}`, `⚔ ${r.final.poder.toLocaleString('es')}`, `piso ${r.final.torre}`, `aura ${r.final.aura}`])}
      ${campoDias(30)}
      <div class="fila"><button data-acc="mas">Simular más días</button><button data-acc="usar">Usar este personaje</button></div>
      <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = async e => {
      const acc = e.target.closest('[data-acc]')?.dataset.acc;
      if (acc === 'cerrar') cerrarModal();
      if (acc === 'mas') simularConAvance(diasPedidos(30), { inicio: sim.inicio, previos: sim.dias, perfil: sim.r.jugador, desde: sim.desde });
      if (acc === 'usar' && await confirmar('¿Reemplazar tu partida de pruebas por la simulada?')) usarSimulado();
    };
  }
  // la partida simulada pasa a ser la tuya (con tu nombre) y el día de pruebas avanza lo simulado, para que las fechas cuadren.
  // Después, "Mi personaje" sigue simulando desde ella.
  function usarSimulado() {
    jugador = Object.assign(sim.r.jugador, { nombre: jugador.nombre }); sigUid = sim.r.jugador.sigUid;
    try { localStorage.setItem(DIA_PRUEBA, sim.inicio + sim.dias - 1); } catch {}
    guardar(); location.reload();
  }
