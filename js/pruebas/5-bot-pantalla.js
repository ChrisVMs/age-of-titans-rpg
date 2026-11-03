  // ---------------- Bot de pruebas (pantalla) ----------------
   // tiempo real (wait() va con la velocidad de batalla)
  function botCerrarMensajes() {   // mensajes de solo OK (desbloqueos...); los de confirmar se dejan
    if ($('dialogo').classList.contains('visible') && $('dialogoNo').hidden) $('dialogoSi').click();
  }
  // 2 aliados para el grupo: los bots del servidor de poder más parecido al tuyo
  function botAliados() {
    const yo = poder();
    return bots().filter(b => b.nombre !== jugador.nombre).map(b => [b.nombre, Math.abs(conPerfil(b, () => poder()) - yo)])
      .sort((a, b) => a[1] - b[1]).slice(0, 2).map(x => x[0]);
  }
  // entrar a un nivel de campaña: si ya está superado (p. ej. otra vez tras una derrota), Auto en vez de pelearlo
  const botEntrar = (c, d, b) => { if (superada(c.id, d)) { barridos(c, d, Infinity); return 'auto'; } b.click(); };
  // siguiente cosa por jugar: { clave, iniciar } o { barrido: [c, d] }
  function botSiguiente() {
    revisarEstamina();
    const pocos = k => puedeReintentar(botFallos, k, botFallosHoy);
    if (botHayEstamina()) {
      for (const c of CAMPANAS) for (const d of ORDEN_DIF) {
        const k = `${c.id}:${d}`, b = $('listaCampanas').querySelector(`[data-campana="${c.id}"][data-dif="${d}"]`);
        if (b && !b.disabled && !superada(c.id, d) && pocos(k)) return { clave: k, iniciar: () => botEntrar(c, d, b) };
      }
    }
    const piso = 'torre' + (jugador.torre.mejor + 1);
    if (desbloqueado('pTorre') && pocos(piso)) return { clave: piso, iniciar: iniciarTorre };
    if (desbloqueado('pArena') && revisarArena().entradas > 0) {
      const a = revisarArena(), i = rivalArenaSim(a.rivales, tipoBot().arena, rnd);   // según el tipo: el más fácil, al azar o el más fuerte
      return { clave: 'arena', iniciar: () => { pintarArena(); $('arenaPvp').querySelector(`[data-rival="${i}"]`).click(); } };
    }
    if (desbloqueado('pEvento') && entradasJefe() > 0) {
      const op = opcionJefeSim(pocos);
      if (op) return { clave: 'jefe' + op[0] + op[1], iniciar: () => { mundialSel = op[0]; difJefeSel = op[1]; iniciarMundial(); } };
    }
    // en grupo (calabozo y reyes): con los bots de poder más parecido al tuyo como aliados
    if (desbloqueado('pCalabozo') && revisarCalabozo().entradas > 0) {
      const [id, df] = opcionCalabozoSim(pocos);
      if (id) return { clave: `cal${id}:${df}`, iniciar: () => iniciarCalabozo(df, botAliados(), null, id) };
    }
    if (desbloqueado('pReyes') && revisarReyes().entradas > 0) {
      const df = opcionReyesSim(pocos);
      if (df) return { clave: 'reyes' + df, iniciar: () => iniciarReyes(df, botAliados(), null) };
    }
    if (retoPendiente()) return { clave: 'eco', iniciar: () => iniciarCampana(batallaEco()) };   // reto del Eco
    if (desbloqueado('pGrieta')) {   // Grieta: bendición y el siguiente piso
      elegirBendicion(bendicionSugerida());
      if (puedeEntrarGrieta()) return { clave: 'grieta', iniciar: () => iniciarCampana(batallaGrieta()) };
    }
    if (botHayEstamina())   // farmeo: barrido del nivel más alto ya superado
      for (const c of [...CAMPANAS].reverse()) for (const d of [...ORDEN_DIF].reverse()) if (superada(c.id, d)) return { barrido: [c, d] };
    return null;
  }
  // espera a que termine la batalla en curso con el autoataque puesto: true victoria, false derrota, null si no empezó o se paró
  async function botBatalla() {
    if (pantallaActual !== 'pBatalla' || batalla.terminada) return null;
    await esperar(1500);   // que salgan los enemigos antes de atacar
    const criterio = botModo === 'jugar' && tipoBot().habilidades === 'criterio';
    while (!batalla.terminada) {
      if (!botModo) return null;
      botCerrarMensajes();
      if (criterio) { if (!enRonda && !auto) { await ronda(habCriterio()); continue; } }   // elige cada habilidad (habCriterio)
      else if (!auto && !bucle && !enRonda) btnAuto.click();
      await esperar(300);
    }
    await esperar(300);
    return $('resTitulo').textContent.startsWith('¡Victoria');
  }
  async function botRepetir() {
    while (botModo === 'repetir') {
      botCerrarMensajes();
      if (pantallaActual === 'pBatalla' && !batalla.terminada) { ponerVelocidad(VELOCIDADES.at(-1)); if (await botBatalla() === null) continue; }
      if (pantallaActual === 'pBatalla' && $('resultado').classList.contains('visible')) {
        if ($('resOtra').style.display === 'none') { avisar('Bot: esta batalla no se repite'); break; }
        const c = batalla.campana, cam = c.idCampana && CAMPANAS.find(x => x.id === c.idCampana);
        if (cam && superada(cam.id, c.dif)) {   // nivel ya superado: Auto (barrido) con la estamina que quede, sin pelear
          await esperar(800); if (botModo !== 'repetir') break;
          const n = barridos(cam, c.dif, Infinity); avisar(`Bot: ${n} Auto en ${cam.id}`); break;
        }
        await esperar(800); if (botModo !== 'repetir') break;
        ponerVelocidad(VELOCIDADES.at(-1)); $('resOtra').click(); await esperar(500);
        if (batalla.terminada) { avisar('Bot: sin estamina'); break; }   // no pudo empezar otra
        continue;
      }
      await esperar(500);   // fuera de batalla: espera a que el jugador entre en una
    }
    botParar();
  }
  // Fin de lo que hay para jugar: anuncios, luego la recarga con cristales y, si ya no queda nada, gasta como el
  // simulador (mejoras, runas, refinado) y pasa al día siguiente. Devuelve el texto del aviso.
  function botRecargarOPasarDia() {
    simCobrar();
    if (tipoBot().anuncios && cobrarAnuncio()) return `Bot: anuncio +${ESTAMINA_ANUNCIO} ⚡`;
    if (tipoBot().cristales && recargarConCristales()) return `Bot: 💎 ${RECARGA_CRISTALES.coste} → +${RECARGA_CRISTALES.estamina} ⚡`;
    desguazar(jugador.objetos.filter(o => !Object.values(jugador.equipado).includes(o.uid)));
    simMejorar(); simRunas(); simRefinar();
    offsetDias++;
    while (tipoBot().juega < 1 && rnd() >= tipoBot().juega) offsetDias++;   // días que este tipo de jugador no entra
    try { localStorage.setItem(DIA_PRUEBA, offsetDias); } catch {}
    revisarEstamina(); revisarArena(); revisarReyes(); revisarCalabozo(); revisarMisiones(); revisarRecargas(); entradasJefe();
    if (loginDisponible()) reclamarLogin();
    if (desbloqueado('pRuinas')) recogerRuinas();
    simRuinas();
    botFijarReserva();
    for (const k in botFallosHoy) delete botFallosHoy[k];
    $('diaPrueba').textContent = `Día ${offsetDias + 1}`;
    return `Bot: día ${offsetDias + 1}`;
  }
  async function botJugar() {
    if (pantallaActual === 'pBatalla' && $('resultado').classList.contains('visible')) $('resSalir').click();
    while (botModo === 'jugar') {
      botCerrarMensajes(); botPreparar();
      const acc = botSiguiente();
      if (!acc) { avisar(botRecargarOPasarDia()); guardar(); pintarHud(); await esperar(800); continue; }
      if (acc.barrido) { barrido(...acc.barrido); await esperar(400); continue; }
      ponerVelocidad(VELOCIDADES.at(-1)); if (acc.iniciar() === 'auto') { await esperar(400); continue; } await esperar(100);
      const gano = await botBatalla();
      if (!botModo) break;
      if (!gano) { anotarDerrota(botFallos, acc.clave, botFallosHoy); simMejorar(); simRunas(); simRefinar(); botPreparar(); }   // derrota: mejora antes de nada
      if (pantallaActual === 'pBatalla') { await esperar(600); $('resSalir').click(); }
      await esperar(400);
    }
    botParar();
  }
  function botEmpezar(modo) {
    if (!MODO_PRUEBAS || botModo) return;
    botModo = modo; botVel = velElegida; botFijarReserva();
    $('pruebasMenu').classList.remove('visible'); $('botParar').hidden = false;
    (modo === 'jugar' ? botJugar() : botRepetir()).catch(e => { console.error(e); avisar('Bot: error, ver consola'); botParar(); });
  }
  function botParar() {
    if (!botModo) return;
    botModo = null; $('botParar').hidden = true; ponerVelocidad(botVel);
    if (auto) btnAuto.click();   // quita el autoataque que puso el bot
    avisar('Bot parado');
  }
  $('botRepetir').onclick = () => botEmpezar('repetir');
  $('botJugar').onclick = () => botEmpezar('jugar');
  // tipo de jugador del bot (TIPOS_JUGADOR): cada toque pasa al siguiente
  const pintarBotTipo = () => { $('botTipo').textContent = `🎭 Bot: ${tipoBot().nombre}`; };
  $('botTipo').onclick = () => { const l = Object.keys(TIPOS_JUGADOR); botTipo = l[(l.indexOf(botTipo) + 1) % l.length];
    try { localStorage.setItem('batalla.botTipo', botTipo); } catch {} pintarBotTipo(); };
  pintarBotTipo();
  $('botParar').onclick = botParar;
  // si el jugador sale de una batalla a mano (huir, abandonar o salir del resultado), el bot se para: sus propios clics
  // no son de una persona (isTrusted false) y no cuentan
  document.addEventListener('click', e => {
    if (botModo && e.isTrusted && e.target.closest('#btnHuir, #huir, #resSalir, [data-acc="salir"], .volver')) botParar();
  }, true);
