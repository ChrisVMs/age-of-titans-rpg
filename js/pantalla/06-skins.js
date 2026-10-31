  // ---------------- Skins (pantalla) ----------------
  function pintarTabSkins() {
    const k = skinActual(), propias = skinsDisponibles();
    if (!skinSel || !propias.some(x => x.id === skinSel)) skinSel = k ? k.id : null;
    const sel = SKINS.find(x => x.id === skinSel);
    $('tabSkins').innerHTML = (sel ? fichaSkin(sel) : `<div class="masc-actual"><i>${propias.length ? 'Toca una skin para ver su ficha' : 'No tienes skins: cómpralas en la Tienda'}</i></div>`) +
      `<small>Equipada: <b>${k ? k.nombre : 'ninguna (se ve tu equipo)'}</b>. La skin cambia tu aspecto y suma su bono; el resto de stats sigue siendo el del equipo.</small>
      <div class="skins-lista" style="margin-top:8px">
        ${propias.map(x => `<button class="item${x.id === skinSel ? ' sel-her' : ''}${skinPuesta() === x.id ? ' puesto' : ''}" data-skin="${x.id}"><img src="${x.img}" alt=""><small>${x.nombre}<br>${textoEstrellas(estrellasSkin(x.id))}</small></button>`).join('')}
      </div>`;
  }
  $('tabSkins').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.skin) { skinSel = b.dataset.skin; return pintarTabSkins(); }   // seleccionar, no equipar
    const acc = b.dataset.acc, k = SKINS.find(x => x.id === skinSel); if (!k) return;
    if (acc === 'equipar') { ponerSkin(k.id); avisar(`${k.nombre} equipada`); }
    if (acc === 'quitar') ponerSkin(null);
    if (acc === 'mejorar') { if (!mejorarSkin(k)) return; avisar(`${k.nombre} ★${estrellasSkin(k.id)}`); pintarHud(); }
    guardar(); aplicarEquipo();
  });
