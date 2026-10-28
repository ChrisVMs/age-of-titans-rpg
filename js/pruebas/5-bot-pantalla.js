  // ---------------- Bot de pruebas (pantalla) ----------------
   // tiempo real (wait() va con la velocidad de batalla)
  function botCerrarMensajes() {   // mensajes de solo OK (desbloqueos...); los de confirmar se dejan
    if ($('dialogo').classList.contains('visible') && $('dialogoNo').hidden) $('dialogoSi').click();
  }
  // siguiente cosa por jugar: { clave, iniciar } o { barrido: [c, d] }
  function botSiguiente() {
    revisarEstamina();
    const pocos = k => (botFallos[k] || 0) < 2;
    if (jugador.estamina >= ESTAMINA_CAMPANA) {
      for (const c of CAMPANAS) for (const d of ORDEN_DIF) {
        const k = `${c.id}:${d}`, b = $('listaCampanas').querySelector(`[data-campana="${c.id}"][data-dif="${d}"]`);
        if (b && !b.disabled && !superada(c.id, d) && pocos(k)) return { clave: k, iniciar: () => b.click() };
      }
    }
    const piso = 'torre' + (jugador.torre.mejor + 1);
    if (desbloqueado('pTorre') && pocos(piso)) return { clave: piso, iniciar: iniciarTorre };
    if (desbloqueado('pArena') && revisarArena().entradas > 0) {
      const a = revisarArena(), i = a.rivales.reduce((m, r, k) => r.f < a.rivales[m].f ? k : m, 0);   // el rival más fácil
      return { clave: 'arena', iniciar: () => { pintarArena(); $('arenaPvp').querySelector(`[data-rival="${i}"]`).click(); } };
    }
    if (desbloqueado('pEvento') && entradasJefe() > 0) {
      const id = Object.keys(MUNDIALES).find(m => estadoMundial(m).vida > 0 && pocos('jefe' + m));
      if (id) return { clave: 'jefe' + id, iniciar: () => { mundialSel = id; iniciarMundial(); } };
    }
    if (jugador.estamina >= ESTAMINA_CAMPANA)   // farmeo: barrido del nivel más alto ya superado
      for (const c of [...CAMPANAS].reverse()) for (const d of [...ORDEN_DIF].reverse()) if (superada(c.id, d)) return { barrido: [c, d] };
    return null;
  }
  // espera a que termine la batalla en curso con el autoataque puesto: true victoria, false derrota, null si no empezó o se paró
  async function botBatalla() {
    if (pantallaActual !== 'pBatalla' || batalla.terminada) return null;
    await esperar(1500);   // que salgan los enemigos antes de atacar
    while (!batalla.terminada) {
      if (!botModo) return null;
      botCerrarMensajes();
      if (!auto && !bucle && !enRonda) btnAuto.click();
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
        await esperar(800); if (botModo !== 'repetir') break;
        ponerVelocidad(VELOCIDADES.at(-1)); $('resOtra').click(); await esperar(500);
        if (batalla.terminada) { avisar('Bot: sin estamina'); break; }   // no pudo empezar otra
        continue;
      }
      await esperar(500);   // fuera de batalla: espera a que el jugador entre en una
    }
    botParar();
  }
  async function botJugar() {
    if (pantallaActual === 'pBatalla' && $('resultado').classList.contains('visible')) $('resSalir').click();
    while (botModo === 'jugar') {
      botCerrarMensajes(); botPreparar();
      const acc = botSiguiente();
      if (!acc) { avisar('Bot: nada más que jugar hoy'); break; }
      if (acc.barrido) { barrido(...acc.barrido); await esperar(400); continue; }
      ponerVelocidad(VELOCIDADES.at(-1)); acc.iniciar(); await esperar(100);
      const gano = await botBatalla();
      if (!botModo) break;
      if (!gano) botFallos[acc.clave] = (botFallos[acc.clave] || 0) + 1;   // derrota o no pudo empezar
      if (pantallaActual === 'pBatalla') { await esperar(600); $('resSalir').click(); }
      await esperar(400);
    }
    botParar();
  }
  function botEmpezar(modo) {
    if (!MODO_PRUEBAS || botModo) return;
    botModo = modo; botVel = velElegida;
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
  $('botParar').onclick = botParar;
