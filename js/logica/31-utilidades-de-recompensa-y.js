  // ---------------- Utilidades de recompensa y calendario ----------------
  const ICONO_PREMIO = { oro: '●', xp: 'XP', piedra: '🔷', polvo: '✨', almas: '💠', estamina: '⚡', esencia: '🌟', cristales: '💎', fichas: '🎟️' };
  // en pantallas HTML: icono HD del recurso (textoPremio queda para avisos y diálogos, que son solo texto)
  const IMG_PREMIO = { oro: 'oro', piedra: 'mat_piedra', polvo: 'mat_polvo', almas: 'mat_almas', esencia: 'mat_esencia', cristales: 'cristales', estamina: 'estamina', fichas: 'ficha' };
  const icPremio = k => IMG_PREMIO[k] ? `<img class="ic-txt" src="img/iconos/${IMG_PREMIO[k]}.png" alt="">` : ICONO_PREMIO[k] + ' ';
  const htmlPremio = pr => Object.entries(pr).filter(([, v]) => v).map(([k, v]) => `${icPremio(k)}${Math.round(v).toLocaleString('es')}`).join(' · ');
  const textoPremio = pr => Object.entries(pr).filter(([, v]) => v).map(([k, v]) => `${ICONO_PREMIO[k]} ${Math.round(v).toLocaleString('es')}`).join(' · ');
  function darPremio(pr) {
    for (const [k, v] of Object.entries(pr)) {
      if (k === 'oro') jugador.oro += Math.round(v);
      else if (k === 'cristales') jugador.cristales = (jugador.cristales || 0) + Math.round(v);
      else if (k === 'estamina') jugador.estamina = Math.min(ESTAMINA_MAX * 2, jugador.estamina + v);   // puede pasar del máximo (hasta el doble)
      else jugador.mat[k] = (jugador.mat[k] || 0) + Math.round(v);
    }
  }
  // lunes de la semana actual (clave de misiones semanales y modificadores de jefe)
  function semana() { const d = ahoraJuego(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function azarSemilla(semilla) {   // generador reproducible (mismo piso / misma semana = mismo resultado)
    let t = [...String(semilla)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703);
    return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; };
  }
