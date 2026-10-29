  // ---------------- Runas (pantalla) ----------------
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
        return `<div class="item${n ? '' : ' bloq'}${activa ? ' puesto' : ''}${nivelDespertar('reliquia', r.id) >= D_VISUAL ? ' marco-d5' : ''}"><span style="font-size:28px">${r.icono}</span><small>${r.nombre}${n ? ` · Nv ${n}/${RELIQUIA_MAX}` : ''}</small>
          <b>${n ? textoReliquia(r) : `🔒 ${NOMBRE_JEFE[r.jefe]}`}</b>
          ${n ? (activa ? `<button data-acc="quitarRel" data-rel="${r.id}">Quitar</button>` : `<button data-acc="ponerRel" data-rel="${r.id}" ${reliquiasActivas().length < RANURAS_RELIQUIA ? '' : 'disabled'}>ACTIVAR</button>`) : ''}
          ${n >= RELIQUIA_MAX ? botonDespertar('reliquia', r.id) : ''}</div>`; }).join('')}</div>`;
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
