  // ---------------- Salas multijugador: Torre de reyes y Calabozo (pantalla) ----------------
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
    const datos = p => `<small>${iconoClase(p.clase)}${CLASES[p.clase].nombre} Nv ${p.nivel} · ⚔ ${conPerfil(p, () => poder()).toLocaleString('es')}</small>`;
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
          `<small style="display:flex;align-items:center;gap:8px;justify-content:space-between">${iconoClase(b.clase)}${b.nombre} · Nv ${b.nivel} · ⚔ ${conPerfil(b, () => poder()).toLocaleString('es')}
           <button data-enviar="${b.nombre}" style="margin:0;min-height:30px;padding:3px 10px">Invitar</button></small>`).join('') || `<small>${MODO_PRUEBAS ? 'No hay más jugadores disponibles' : 'No hay jugadores conectados'}</small>`}</div>
          <button data-cerrar-invitar="1">Cerrar</button></div>` : ''}
      <small><b>Formación</b> · ${mio ? 'toca dos casillas para intercambiarlas' : 'la elige el dueño'}</small>
        <div class="rombo fila">${POSICIONES.map(pos => { const P = posSala(sala), n = Object.keys(P).find(k => P[k] === pos);
          return `<button class="casilla${n ? ' ocupada' : ''}${sala.selPos === pos ? ' sel' : ''}" data-pos-sala="${pos}" data-pos="${pos}" ${mio ? '' : 'disabled'}>${n ? `${CLASES[perfilDe(n).clase].icono} ${nombreDe(n)}` : '—'}<small>${NOMBRE_POS[pos]} · ${PESO_POS[pos]} %</small></button>`; }).join('')}</div>
      ${reyes ? `<div class="sala-difs">${Object.entries(DIF_REYES).map(([id, x]) =>
          `<button data-dif-reyes="${id}" class="${id === sala.dif ? 'on' : ''}" ${mio ? '' : 'disabled'}>${x.nombre}<small>${Math.round(x.pct * 100)} % atributos${R.vencidas[id] ? ' · ✔' : ''}</small></button>`).join('')}</div>
        <div class="sala-rivales">${reyesSemana().map(r => `<span>${i18nPuesto(r.puesto - 1)} ${iconoClase(r.clase)}${r.nombre} · ⚔ ${Math.round(r.poder * d.pct).toLocaleString('es')}</span>`).join('')}</div>
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
  $('reyes').addEventListener('click', clickSala);   // (necesita clickSala, de este archivo)
  const modoPantalla = () => pantallaActual === 'pCalabozo' ? 'calabozo' : 'reyes';
  function salirSala() { if (sala) { quitarDeSala(sala, 'yo'); sala = null; } pintarSala(); }
  ui.repintarSala = () => repintarSala();
  const repintarSala = () => { if (pantallaActual === 'pReyes' || pantallaActual === 'pCalabozo') pintarSala(); };
  async function empezarSala() {
    if (sala.modo === 'calabozo' && esDueno(sala, 'yo')) {
      const solo = sala.miembros.length === 1, ayuda = ayudaCalabozo('calabozo');
      const txt = ayuda ? 'Sin intentos restantes; calabozo sin recompensa. ¿Continuar?'
        : solo ? 'Vas solo: el calabozo es difícil y gasta un intento. ¿Continuar?' : '';
      if (txt && !await confirmar(txt, 'Continuar', 'Cancelar')) return;
    }
    const aliados = sala.miembros.filter(m => m.n !== 'yo' && m.llego).map(m => m.n);
    return (sala.modo === 'calabozo' ? iniciarCalabozo : iniciarReyes)(sala.dif, aliados, { ...posSala(sala) }, sala.cal);
  }
