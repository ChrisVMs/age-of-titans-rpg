  // ---------------- Campamento (menú principal) ----------------
  // Avisos rojos: algo que el jugador puede hacer ahora mismo
  function avisosCampamento() {
    const masc = MASCOTAS.some(m => { const n = nivelMascota(m); return n > 0 && n < MASCOTA_MAX && jugador.oro >= costeMejora(m, n); });
    const jefe = entradasJefe() > 0 && Object.keys(MUNDIALES).some(id => estadoMundial(id).vida > 0);
    const mis = misionesReclamables('diaria') || misionesReclamables('semanal') || bonusDisponible('diaria') || bonusDisponible('semanal') || eventoReclamable() || expedicionLista();   // el login avisa en su propio icono
    const R = revisarReyes();
    return { reyes: R.entradas > 0 && Object.keys(R.vencidas).length < 4, misiones: mis, arena: revisarArena().entradas > 0, arbol: puntosLibres() > 0, titulos: !!jugador.tituloNuevo, mascota: masc, batalla: jugador.estamina >= ESTAMINA_MAX, jefe };
  }
  // Objetivos cercanos ("me falta poco"): de todo lo que el jugador puede perseguir, se muestran los 3 más avanzados.
  // Tocar uno lleva a su pantalla.
  function objetivosCercanos() {
    const L = [], add = (icono, txt, pct, ir) => { if (pct < 1 && desbloqueado(ir)) L.push({ icono, txt, pct: Math.max(0, pct), ir }); };
    if (jugador.nivel < NIVEL_MAX) add('⭐', `Nivel ${jugador.nivel + 1}`, jugador.xp / xpParaSubir(jugador.nivel), 'pInventario');
    const ma = maestria(); if (ma.n < MAESTRIA_MAX) add('🏅', ma.n < MAESTRIA_ESPECIAL ? `Maestría Nv ${MAESTRIA_ESPECIAL}: especialización` : `Maestría Nv ${ma.n + 1}`, ma.n < MAESTRIA_ESPECIAL ? (ma.n + ma.xp / ma.falta) / MAESTRIA_ESPECIAL : ma.xp / ma.falta, 'pArbol');
    const k = skinActual(); if (k && estrellasSkin(k.id) < 5) add('✨', `${k.nombre} ★${estrellasSkin(k.id) + 1}`, jugador.oro / COSTE_ESTRELLA(estrellasSkin(k.id)), 'pInventario');
    const m = mascotaActual(); if (m && nivelMascota(m) < MASCOTA_MAX) add('🐾', `${m.nombre} Nv ${nivelMascota(m) + 1}`, jugador.oro / costeMejora(m, nivelMascota(m)), 'pMascota');
    for (const [j, n] of Object.entries(piezasConjunto())) if (n < 4) add('⚔', `Set «${CONJUNTOS[j].nombre}» ${n}/4`, n / 4, 'pEvento');
    for (const uid of Object.values(jugador.equipado)) { const o = objeto(uid), q = pctCalidad(o);
      if (q >= 65 && q < 100) add('💎', `${modelo[o.modelo].nombre}: ${calidadObj(o)[1].toLowerCase()} (${q} %)`, q / 100, 'pHerreria');
      if (o.enc < encMax(o)) add('🔨', `${modelo[o.modelo].nombre} +${o.enc + 1}`, Math.min(jugador.mat.piedra / (o.enc + 1), jugador.oro / costeEncantar(o).oro, 1) * .99, 'pHerreria'); }
    const mejor = (jugador.torre || {}).mejor || 0;   // partidas sin Torre ni Calabozo todavía: no debe romper el campamento
    add('🗼', `Torre: piso ${mejor + 1}`, (mejor % 10) / 10, 'pTorre');
    const cal = CALABOZOS.find(c => !(jugador.calabozos || {})[c.id]); if (cal && calabozoAbierto(cal.id)) add('🏰', `Supera ${cal.nombre}`, (cal.id - 1) / CALABOZOS.length, 'pCalabozo');
    const sig = Object.entries(DESBLOQUEOS).filter(([id]) => !desbloqueado(id)).sort((a, b) => a[1][0] - b[1][0])[0];
    if (sig && sig[1][0] - jugador.nivel <= 3) add('🔓', `${sig[1][1]} en Nv ${sig[1][0]}`, (jugador.nivel + jugador.xp / xpParaSubir(jugador.nivel)) / sig[1][0], 'menu');
    const vistos = new Set();   // uno por tipo, para que no salgan tres encantamientos
    return L.sort((a, b) => b.pct - a.pct).filter(o => !vistos.has(o.icono) && vistos.add(o.icono)).slice(0, 3);
  }
