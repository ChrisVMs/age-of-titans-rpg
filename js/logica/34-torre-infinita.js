  // ---------------- Torre infinita ----------------
  // Pisos generados por fórmula: el piso n equivale al nivel de campaña 1 + (n-1)/3,5 en Normal con +15 % de vida, y
  // modificadores al azar (siempre los mismos para cada piso). Jefe cada 10 pisos. No gasta estamina.
  // Una sola recompensa al superar el piso (los monstruos no sueltan botín) y hito cada 10. Antes el botín por monstruo y
  // premios del doble permitían encadenar muchos pisos, mejorar y volver a encadenar: acortaba demasiado el juego.
  const TIPOS_TORRE = ['parca', 'sombria', 'carmesi', 'maldita', 'pantano', 'escarcha', 'ignea', 'brasas'];
  // Desde el piso TORRE_ALTA: enemigos y jefes de las etapas 2-3 (si están disponibles), Esencia en los hitos y una pieza
  // Ancestral cada 50 pisos. Sin el contenido alto publicado, la Torre sigue igual (solo la Esencia).
  const TORRE_ALTA = 100, TIPOS_TORRE_ALTA = ['esqueleto', 'caballero', 'gargola', 'diablillo', 'demonio', 'sucubo'];
  const contenidoAlto = () => ETAPAS.some(e => e.id > 1 && etapaDisponible(e));
  // dificultad (n equivalente de la campaña): +1 cada 3,5 pisos; desde TORRE_SUAVE.desde, +1 cada TORRE_SUAVE.pisos (el poder
  // del jugador se estanca y la curva de antes hacía de cada 10 pisos el doble de duros)
  let TORRE_SUAVE = { desde: 90, pisos: 8 };
  const nEqTorre = n => n <= TORRE_SUAVE.desde ? 1 + (n - 1) / 3.5 : 1 + (TORRE_SUAVE.desde - 1) / 3.5 + (n - TORRE_SUAVE.desde) / TORRE_SUAVE.pisos;
  function pisoTorre(n) {
    const rnd = azarSemilla('torre' + n), nEq = nEqTorre(n), jefe = n % 10 === 0, alta = n > TORRE_ALTA && contenidoAlto();
    const pool = alta ? TIPOS_TORRE_ALTA : TIPOS_TORRE;
    const tipos = jefe ? [alta ? (n % 20 === 0 ? 'senor' : 'liche') : n % 20 === 0 ? 'bruja' : 'ancestral'] : [0, 1].map(() => pool[Math.floor(rnd() * pool.length)]);
    const d = crearDificultad(nEq, 'normal', tipos);
    if (alta) {   // los tipos altos traen la fuerza de la campaña: vida y daño como sus equivalentes de la Torre (parca / bruja)
      const ref = crearDificultad(nEq, 'normal', tipos.map(() => jefe ? 'bruja' : 'parca')).enemigos;
      d.enemigos.forEach((e, i) => { e.vida = ref[i].vida; e.dano = [...ref[i].dano]; });
    }
    const nMods = jefe ? (n >= TORRE_ALTA ? 1 : 2) : n >= 30 || n % 5 === 0 ? 1 : 0, mods = elegirMods(rnd, nMods, MODIFICADORES);   // jefes desde el 100: 1 modificador (con 2, el 100 era un muro)
    for (const e of d.enemigos) { for (const md of mods) (md.torre || md).ap(e); e.vida = Math.round(e.vida * 1.15); e.oro = 0; e.xp = 0; }   // sin botín por monstruo
    return { enemigos: d.enemigos, mods, jefe,
      premio: { oro: 50 * n, xp: 30 * n, piedra: 1 + Math.floor(n / 6), polvo: n % 5 === 0 ? 2 + Math.floor(n / 20) : 0,
                almas: n % 5 === 0 ? 1 + Math.floor(n / 20) : 0 },   // la Torre es la fuente propia de almas (cada 5 pisos)
      botin: { piedra: [0, 0], polvo: 0 }, cofreHito: cofreDeNivel(Math.ceil(nEq)) };
  }
  const premioHito = n => ({ almas: 3 + Math.floor(n / 10), oro: 250 * n, ...(n >= TORRE_ALTA ? { esencia: 10 + Math.floor((n - TORRE_ALTA) / 5) } : {}) });   // cada 10 pisos
  const hitoAncestral = n => n >= TORRE_ALTA && n % 50 === 0 && contenidoAlto();
  jugador.torre ||= { mejor: 0 };
  function batallaTorre(n = jugador.torre.mejor + 1) {
    const p = pisoTorre(n);
    return { nombre: `Torre · Piso ${n}`, torre: n, premio: p.premio, botin: p.botin, enemigos: p.enemigos };
  }
  function pisoSuperado(n) {
    if (n <= jugador.torre.mejor) return '';
    jugador.torre.mejor = n; contarMision('torre'); sumarPuntosEco(PUNTOS_ECO.torre);
    let t = `<br><b>🗼 Piso ${n} superado</b>`;
    if (n % 10 === 0) {   // hito: almas, oro y un objeto del cofre de ese tramo
      const h = premioHito(n), o = hitoAncestral(n) ? objetoAncestral() : objetoAzar(COFRES.find(k => k.id === pisoTorre(n).cofreHito).probs, .1);
      darPremio(h); jugador.objetos.push(o);
      t += `<br>🏅 Hito: ${textoPremio(h)}`; obtenidos.push(o);
    }
    guardar(); return t;
  }
