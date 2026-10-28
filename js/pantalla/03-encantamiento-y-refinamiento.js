  // ---------------- Encantamiento (+1 ... +20) y refinamiento (pantalla) ----------------
  document.addEventListener('click', e => { const m = e.target.closest('[data-material]'); if (m) infoMaterial(m.dataset.material); });
