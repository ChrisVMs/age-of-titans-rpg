  // ---------------- Torre infinita ----------------
  // Pisos generados por fórmula: el piso n equivale al nivel de campaña 1 + (n-1)/3,5 en Normal con +15 % de vida, y
  // modificadores al azar (siempre los mismos para cada piso). Jefe cada 10 pisos. No gasta estamina.
  // Una sola recompensa al superar el piso (los monstruos no sueltan botín) y hito cada 10. Antes el botín por monstruo y
  // premios del doble permitían encadenar muchos pisos, mejorar y volver a encadenar: acortaba demasiado el juego.
  const TIPOS_TORRE = ['parca', 'sombria', 'carmesi', 'maldita', 'pantano', 'escarcha', 'ignea', 'brasas'];
  function pisoTorre(n) {
    const rnd = azarSemilla('torre' + n), nEq = 1 + (n - 1) / 3.5, jefe = n % 10 === 0;
    const tipos = jefe ? [n % 20 === 0 ? 'bruja' : 'ancestral'] : [0, 1].map(() => TIPOS_TORRE[Math.floor(rnd() * TIPOS_TORRE.length)]);
    const d = crearDificultad(nEq, 'normal', tipos);
    const nMods = jefe ? 2 : n >= 30 || n % 5 === 0 ? 1 : 0, mods = elegirMods(rnd, nMods, MODIFICADORES);
    for (const e of d.enemigos) { for (const md of mods) (md.torre || md).ap(e); e.vida = Math.round(e.vida * 1.15); e.oro = 0; e.xp = 0; }   // sin botín por monstruo
    return { enemigos: d.enemigos, mods, jefe,
      premio: { oro: 50 * n, xp: 30 * n, piedra: 1 + Math.floor(n / 6), polvo: n % 5 === 0 ? 2 + Math.floor(n / 20) : 0,
                almas: n % 5 === 0 ? 1 + Math.floor(n / 20) : 0 },   // la Torre es la fuente propia de almas (cada 5 pisos)
      botin: { piedra: [0, 0], polvo: 0 }, cofreHito: cofreDeNivel(Math.ceil(nEq)) };
  }
  const premioHito = n => ({ almas: 3 + Math.floor(n / 10), oro: 250 * n });   // cada 10 pisos
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
      const h = premioHito(n), o = objetoAzar(COFRES.find(k => k.id === pisoTorre(n).cofreHito).probs, .1);
      darPremio(h); jugador.objetos.push(o);
      t += `<br>🏅 Hito: ${textoPremio(h)}`; obtenidos.push(o);
    }
    guardar(); return t;
  }
