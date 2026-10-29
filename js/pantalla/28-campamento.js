  // ---------------- Campamento (menú principal) (pantalla) ----------------
  function pintarObjetivos() {
    $('campObjetivos').innerHTML = `<b>🎯 Objetivos</b>` + objetivosCercanos().map(o =>
      `<button data-ir="${o.ir}"><span>${o.icono} ${o.txt}</span><span class="barra-obj"><i style="width:${Math.round(o.pct * 100)}%"></i></span></button>`).join('');
  }
  function pintarCampamento() {
    pintarAura(document.querySelector('.camp-guerrero'), nivelAura());
    const pct = jugador.xp / xpParaSubir(jugador.nivel) * 100, c = CLASES[jugador.clase], m = mascotaActual(), a = avisosCampamento();
    $('campAvatar').className = 'camp-avatar' + (marcoActual() ? ' marco-' + marcoActual() : '');
    $('campAvatar').innerHTML = `<span class="cara">${c.icono}<b>${jugador.nivel}</b></span>
      <span><span class="poder">⚔ ${poder().toLocaleString('es')}</span><span class="xp"><i style="width:${pct}%"></i></span></span>`;
    $('campRecursos').innerHTML = `<span class="recurso oro">● ${jugador.oro.toLocaleString('es')}</span><span class="recurso cristales">💎 ${jugador.cristales || 0}</span><span class="recurso estamina">⚡ ${jugador.estamina}/${ESTAMINA_MAX} ＋</span>`;
    $('campNombre').innerHTML = `${etiquetaTitulo(tituloActual())}${jugador.nombre} · ${c.nombre} Nv ${jugador.nivel}`;
    $('campMascota').innerHTML = m ? dibujoMascota(m, .3) : '';
    pintarObjetivos();
    document.querySelectorAll('#menu [data-ir], #modoBatalla [data-modo-batalla], .heroe-tabs [data-ir], [data-invtab]').forEach(b => {
      const id = b.dataset.ir || b.dataset.modoBatalla || b.dataset.invtab, ok = desbloqueado(id);
      b.classList.toggle('bloqueado', !ok); if (ok) delete b.dataset.nv; else b.dataset.nv = `Nv ${nivelDesbloqueo(id)}`;
    });
    $('campArbol').classList.toggle('con-punto', a.arbol);
    $('campTitulos').classList.toggle('con-punto', a.titulos);
    $('campJefe').classList.toggle('con-punto', a.jefe);
    $('campArena').classList.toggle('con-punto', a.arena);
    $('campMisiones').classList.toggle('con-punto', !!a.misiones);
    $('campReyes').classList.toggle('con-punto', a.reyes);
    $('campRanking').classList.toggle('con-punto', retoPendiente());
    $('campColeccion').classList.toggle('con-punto', hitosPendientes().length > 0);
    $('campRuinas').classList.toggle('con-punto', desbloqueado('pRuinas') && EDIFICIOS.some(e => nivelEdificio(e.id)) && llenadoRuinas() > .5);
    $('campLogin').classList.toggle('con-punto', loginDisponible());
    const ev = eventoHoy(), man = eventoDia((ahoraJuego().getDay() + 1) % 7);
    $('campEvento').innerHTML = ev ? `${ev.icono} ${ev.nombre}: ${ev.desc}<small> · mañana: ${man.icono} ${man.nombre}</small>` : '';
    $('navHeroe').classList.toggle('con-punto', a.arbol || a.titulos);
    $('navMascota').classList.toggle('con-punto', a.mascota);
    $('navBatalla').classList.toggle('con-punto', a.batalla);
    document.querySelectorAll('.tab-arbol').forEach(b => b.classList.toggle('con-punto', a.arbol));
  }
  // Escala de las pantallas de menú en móvil horizontal: proporcional a la altura, para que guarden las proporciones
  // del Campamento (320 px de alto → 0,7 · 360 → 0,78 · 450 o más → 1)
  function ajustarUI() {
    const w = document.body.clientWidth, h = document.body.clientHeight;   // tamaño del lienzo
    const z = w > h && h < 560 ? Math.min(1, Math.max(.66, h / 460)) : 1;
    document.documentElement.style.setProperty('--ui', z.toFixed(3));
  }
  addEventListener('resize', ajustarUI); ajustarUI();
  // accesos del campamento: las flechas solo aparecen si hay más iconos a ese lado
  function paginarAccesos() {
    const l = $('campIconos');
    $('campPagAnt').classList.toggle('oculto', l.scrollLeft <= 1);
    $('campPagSig').classList.toggle('oculto', l.scrollLeft + l.clientWidth >= l.scrollWidth - 1);
  }
  $('campPagAnt').onclick = () => $('campIconos').scrollBy({ left: -$('campIconos').clientWidth });
  $('campPagSig').onclick = () => $('campIconos').scrollBy({ left: $('campIconos').clientWidth });
  $('campIconos').addEventListener('scroll', paginarAccesos);
  addEventListener('resize', paginarAccesos); paginarAccesos();
  campListo = true; pintarCampamento();
  $('campVersion').textContent = `v${VERSION_JUEGO}${MODO_PRUEBAS ? ' · pruebas' : ''}`;
  let toquesVersion = 0, tVersion = 0;   // 7 toques seguidos en la versión: activa o quita el modo pruebas
  $('campVersion').onclick = async () => {
    toquesVersion = Date.now() - tVersion < 1500 ? toquesVersion + 1 : 1; tVersion = Date.now();
    if (toquesVersion < 7) return;
    toquesVersion = 0;
    if (!await confirmar(pruebasGesto ? '¿Salir del modo pruebas?' : '¿Activar el modo pruebas? Usa una partida aparte.')) return;
    try { pruebasGesto ? localStorage.removeItem(PRUEBAS_GESTO) : localStorage.setItem(PRUEBAS_GESTO, '1'); } catch {}
    location.reload();
  }; $('pruebasVersion').textContent = `v${VERSION_JUEGO}`;
