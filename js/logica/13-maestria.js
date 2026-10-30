  // ---------------- Maestría (por clase) ----------------
  // Progreso independiente del nivel: se gana combatiendo (1 por enemigo, 5 por jefe, más por jefes mundiales).
  // Cada nivel: +0,5 % a ataque, vida, defensa y armadura; cada 10 niveles, +2 % de daño de habilidades.
  const MAESTRIA_MAX = 50, xpMaestria = n => 20 + 10 * n;   // xp para pasar del nivel n al n+1
  function maestria() {
    let xp = (jugador.maestria || {})[jugador.clase] || 0, n = 0;
    while (n < MAESTRIA_MAX && xp >= xpMaestria(n)) { xp -= xpMaestria(n); n++; }
    return { n, xp, falta: xpMaestria(n) };
  }
  function sumarMaestria(x) {
    x = Math.round(x * ((eventoHoy() || {}).xp || 1));   // Viernes de experiencia: también maestría
    const antes = maestria().n; jugador.maestria ||= {};
    jugador.maestria[jugador.clase] = (jugador.maestria[jugador.clase] || 0) + x;
    const n = maestria().n; if (n > antes && !simulando) setTimeout(() => ui.avisar(`🏅 Maestría Nv ${n}`), 1200);
  }
  function statsMaestria() { const n = maestria().n; return n ? { ataque: n * .5, vida: n * .5, defensa: n * .5, armadura: n * .5 } : {}; }
  // Especialización (una por clase, desde maestría Nv 10): marca el estilo de la build. Crece ×1,5 en Nv 30 y ×2 en Nv 50.
  // La primera elección es gratis; cambiarla cuesta oro.
  const ESPECIALIDADES = {
    destructor: { nombre: 'Destructor', img: 'esp_destructor', icono: '💥', desc: 'daño puro', ef: { habilidad: .08, penetracion: .06 } },
    bastion:    { nombre: 'Bastión',    img: 'esp_bastion', icono: '🛡️', desc: 'supervivencia', ef: { reduccion: .05, curacion: .10 } },
    gladiador:  { nombre: 'Gladiador',  img: 'esp_gladiador', icono: '⚔️', desc: 'crítico y contraataque', ef: { critico: .04, contra: .06 } },
  };
  const MAESTRIA_ESPECIAL = 10, COSTE_ESPECIAL = 3000;
  const especialidad = () => { const id = (jugador.especialidad || {})[jugador.clase]; return maestria().n >= MAESTRIA_ESPECIAL && ESPECIALIDADES[id] ? id : null; };
  const factorEspecial = () => maestria().n >= 50 ? 2 : maestria().n >= 30 ? 1.5 : 1;
  function efectoMaestria(esp) {
    const e = especialidad();
    return (esp === 'habilidad' ? Math.floor(maestria().n / 10) * .02 : 0) + (e ? (ESPECIALIDADES[e].ef[esp] || 0) * factorEspecial() : 0);
  }
  function htmlMaestria() {
    const m = maestria(), c = CLASES[jugador.clase];
    return `<div class="maestria"><img class="ic-txt" src="img/iconos/maestria.png" alt="">Maestría del ${c.nombre.toLowerCase()}: <b>Nv ${m.n}/${MAESTRIA_MAX}</b>
      ${m.n < MAESTRIA_MAX ? `<div class="xp"><i style="width:${m.xp / m.falta * 100}%"></i></div><small>${m.xp} / ${m.falta} · se gana combatiendo</small>` : ''}
      <br><small>${m.n ? textoBonos(statsMaestria(), Math.floor(m.n / 10) ? { habilidad: Math.floor(m.n / 10) * 2 } : {}) : 'Sin bonos todavía'}</small>
      <div class="especialidades">${m.n < MAESTRIA_ESPECIAL ? `<small>🔒 Especialización en maestría Nv ${MAESTRIA_ESPECIAL}</small>`
        : Object.entries(ESPECIALIDADES).map(([id, x]) => { const on = especialidad() === id;
            return `<button data-especial="${id}" class="${on ? 'on' : ''}">${iconoDe(x)} ${x.nombre}<small>${textoBonos({}, Object.fromEntries(Object.entries(x.ef).map(([a, v]) => [a, Math.round(v * factorEspecial() * 100)])))}</small>${!on && especialidad() ? `<small>● ${COSTE_ESPECIAL}</small>` : ''}</button>`; }).join('')}</div></div>`;
  }
