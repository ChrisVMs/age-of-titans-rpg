  // ---------------- Mascotas (pantalla) ----------------
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
          <span class="ic">${dibujoMascota(x, .16)}</span><small>${x.nombre}</small><b>${n ? 'Nv ' + n : '<img class="ic-txt" src="img/iconos/candado.png" alt="">'}</b></button>`; }).join('')}</div></div>`).join('');
    const c = CAT_MASCOTA[m.cat], n = nivelMascota(m), tiene = n > 0, puesta = jugador.mascota === m.id, nv = Math.max(1, n);
    const bonos = bonosMascota(m, nv).map(t => `<li>${t}</li>`).join('');
    const boton = !tiene ? `<button data-masc="${m.id}" data-acc="comprar" ${jugador.oro < m.precio ? 'disabled' : ''}>Comprar ● ${m.precio}</button>`
      : `<div class="fila-cofre">${puesta ? '<button disabled>Acompañando</button>' : `<button data-masc="${m.id}" data-acc="equipar">Llevar</button>`}
         ${n < MASCOTA_MAX ? `<button data-masc="${m.id}" data-acc="mejorar" ${jugador.oro < costeMejora(m, n) ? 'disabled' : ''}>Mejorar ● ${costeMejora(m, n)}</button>` : botonDespertar('mascota', m.id)}</div>`;
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
