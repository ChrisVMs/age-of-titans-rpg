  // ---------------- Despertar (pantalla) ----------------
  // Botón para las fichas de mascota, reliquia y skin al máximo: "Despertar D1 · 🌟 30 ● 20 000" o su estado.
  // Lo usan 05-mascotas, 06-skins (fichaSkin) y 09-runas; el toque se recoge aquí para todos.
  function botonDespertar(tipo, id) {
    const d = nivelDespertar(tipo, id), marca = d ? ` <span class="despierto">D${d}</span>` : '';
    if (d >= DESPERTAR_MAX) return `<button disabled>Despertar máx.${marca}</button>`;
    if (!desbloqueado('despertar')) return `<button disabled>Máx. · 🔒 Despertar Nv ${DESBLOQUEOS.despertar[0]}</button>`;
    const c = costeDespertar(tipo, id);
    return `<button data-despertar="${tipo}:${id}" ${tieneCoste(c) ? '' : 'disabled'} title="${d + 1 === D_PASIVA ? 'D3: ' + TIPOS_DESPERTAR[tipo].pasiva : ''}">Despertar D${d + 1} · ${htmlPremio(c)}${marca}</button>`;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-despertar]'); if (!b || b.disabled) return;
    e.stopPropagation();
    const [tipo, id] = b.dataset.despertar.split(':');
    if (!despertar(tipo, id)) return;
    const d = nivelDespertar(tipo, id);
    avisar(`✨ D${d}${d === D_PASIVA ? ' · ' + TIPOS_DESPERTAR[tipo].pasiva : ''}`);
    guardar(); pintarHud();
    ({ mascota: pintarMascotas, reliquia: pintarRunas, skin: pintarTabSkins })[tipo]();
  }, true);
