  // ---------------- Progreso del jugador (se guarda en el navegador) (pantalla) ----------------
  function bloquearPestana() {
    if (pestanaBloqueada) return; pestanaBloqueada = true; auto = false;
    try { musica.pause(); musicaEpica.pause(); musicaMenu.pause(); } catch {}
    document.getElementById('otraPestana').classList.add('visible');
  }
  if (canalPestanas) {
    canalPestanas.onmessage = e => {
      const m = e.data || {}; if (m.id === idPestana) return;
      if (m.t === 'hola' && !pestanaBloqueada) canalPestanas.postMessage({ t: 'ocupada', id: idPestana });   // ya hay una abierta: esta
      else if (m.t === 'ocupada' || m.t === 'tomar') bloquearPestana();
    };
    canalPestanas.postMessage({ t: 'hola', id: idPestana });
    document.getElementById('usarAqui').onclick = () => { canalPestanas.postMessage({ t: 'tomar', id: idPestana }); location.reload(); };
  }
  Object.assign(ui, { avisar, pintarHud });
  function avisar(texto) {
    if (simulando) return;
    const a = document.createElement('div'); a.className = 'aviso'; a.textContent = texto;
    document.body.appendChild(a); setTimeout(() => a.remove(), 2000);
  }
  function pintarHud() {
    const pct = jugador.nivel >= NIVEL_MAX ? 100 : jugador.xp / xpParaSubir(jugador.nivel) * 100;
    document.querySelectorAll('.hud').forEach(h => h.innerHTML =
      `<span>Nv ${jugador.nivel}${jugador.nivel >= NIVEL_MAX ? ' MAX' : ''}</span><span class="xp" title="${jugador.xp}/${xpParaSubir(jugador.nivel)} XP"><i style="width:${pct}%"></i></span><span class="oro"><img class="ic-txt" src="img/iconos/oro.png" alt="">${jugador.oro}</span><span class="cristales"><img class="ic-txt" src="img/iconos/cristales.png" alt="">${jugador.cristales || 0}</span><span class="estamina" title="Estamina: toca para recargar"><img class="ic-txt" src="img/iconos/estamina.png" alt="">${jugador.estamina}/${ESTAMINA_MAX} ＋</span>`
      + (h.closest('#pHerreria') || h.closest('#pRunas') ? (h.closest('#pRunas') ? ['polvo'] : ['piedra', 'polvo', 'almas']).map(k => `<span class="mat-hud" data-material="${k}">${icPremio(k)}${(jugador.mat[k] || 0).toLocaleString('es')}</span>`).join('') : ''));   // en la herrería, también sus materiales
    if (campListo) pintarCampamento();
  }
