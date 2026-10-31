  // ---------------- Misiones diarias, semanales y login (pantalla) ----------------
  function abrirLogin() {
    const L = login30(), hecho = L.n >= 30 && loginDisponible() ? 0 : L.n;   // ciclo completo: al día siguiente vuelve al 1
    abrirModal('comun', `<h2>📅 Login diario</h2><small>Un casillero por día que entres. Al completar el 30, vuelve a empezar.</small>
      <div class="login30">${Array.from({ length: 30 }, (_, i) => { const d = i + 1, ok = d <= hecho, hoyD = d === hecho + 1 && loginDisponible();
        return `<button class="dia30${ok ? ' hecho' : ''}${hoyD ? ' hoy' : ''}${d % 7 === 0 || d === 30 ? ' grande' : ''}" ${hoyD ? 'data-login30="1"' : 'disabled'}>
          <b>${d}</b><small>${ok ? '<img class="ic-txt" src="img/iconos/hecho.png" alt="">' : htmlPremio(premioDia(d))}</small></button>`; }).join('')}</div>
      <div class="fila"><button data-acc="cerrar">Cerrar</button></div>`);
    $('detCaja').onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.acc === 'cerrar') return cerrarModal();
      if (b.dataset.login30 && loginDisponible()) { const pr = reclamarLogin(); guardar(); pintarHud(); avisar(`📅 Día ${login30().n}: ${textoPremio(pr)}`); abrirLogin(); }
    };
  }
