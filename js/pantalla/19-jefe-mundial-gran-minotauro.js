  // ---------------- Jefe mundial: Gran Minotauro (pantalla) ----------------
  function pintarEvento() {
    const m = MUNDIALES[mundialSel], max = m.enemigo.vida, v = estadoMundial().vida, pct = v / max * 100, muerto = v <= 0;
    $('eventoCaja').innerHTML = `
      <div class="jefes">${Object.entries(MUNDIALES).map(([id, j]) => `<button data-jefe="${id}" class="${id === mundialSel ? 'on' : ''}">${j.enemigo.nombre}</button>`).join('')}</div>
      <div class="ev-izq">
        <h2>${m.titulo}</h2>
        <div class="retrato" style="${m.retrato(v, max)}"></div>
        <div class="barra"><i style="width:${pct}%"></i></div>
        <small>${muerto ? '¡Derrotado hoy! Vuelve mañana.' : `Vida: ${v} / ${max}`}</small>
        <button id="desafiar" ${muerto || entradasJefe() <= 0 ? 'disabled' : ''}>Desafiar · 🎟 ${entradasJefe()}/${ENTRADAS_JEFE}</button>
        ${!muerto && entradasJefe() <= 0 ? `<small class="falta">Sin entradas de jefe: vuelven mañana (${ENTRADAS_JEFE} al día).</small>` : ''}
      </div>
      <div class="ev-der"><ul>
        <li>Su vida se comparte entre todos tus intentos del día.</li>
        ${m.reglas.map(r => `<li>${r}</li>`).join('')}
        <li>Armadura <b>${m.enemigo.armadura}</b>: la <b>penetración</b> ignora parte de ella y aumenta tu daño.</li>
        <li>Recompensa según el daño que causes; derrotarlo da un premio extra.</li>
        <li>Botín: reliquias y su <b>equipo exclusivo</b> (${MODELOS.filter(x => x.jefe === mundialSel).map(x => x.nombre).join(', ')}), con atributos secundarios al azar.</li>
        <li>Cada intento usa una <b>entrada de jefe</b> (${ENTRADAS_JEFE} al día), no estamina.</li>
        <li><b>Esta semana</b> (cambia cada lunes): ${modsSemana().map(md => `${md.icono} <b>${md.nombre}</b> (${md.desc})`).join(' · ')}. Recompensas +30 %.</li>
      </ul>
      ${pintarRanking()}</div>`;
    $('desafiar').onclick = iniciarMundial;
    $('eventoCaja').querySelectorAll('[data-jefe]').forEach(b => b.onclick = () => { mundialSel = b.dataset.jefe; pintarEvento(); });
  }
  // aspecto del enemigo según su tipo (parca, Cerbero o Asmodeo)
  function modoJefe() {
    const c = !!batalla.enemigo.cerbero, a = !!batalla.enemigo.asmodeo, mi = !!batalla.enemigo.minotauro;
    slots[1].classList.toggle('asmodeo', a);
    slots[1].classList.toggle('minotauro', mi);
    modoCerbero(c);
    $('pBatalla').classList.toggle('mazmorra', c || a || mi);
    if (a) { parca.setAncho(300); parca.setBase(0); parca.ver(0); }
    if (mi) { parca.setAncho(476); parca.setBase(0); parca.ver(0); }
    $('minoPrueba').hidden = !mi;
    $('asmodeoPrueba').hidden = !a;
  }
  function modoCerbero(activo) {
    slots[1].classList.toggle('cerbero', activo);
    $('pBatalla').classList.toggle('mazmorra', activo);
    $('pBatalla').classList.toggle('infernal', activo && batalla.infernal);
    parca.setAncho(activo ? 480 : 260);
    parca.setBase(activo && batalla.infernal ? 12 : 0);
    parca.frames.classList.remove('quieto');   // si murió en la pelea anterior quedaba congelado en el cuadro de muerte
    $('infernalPrueba').hidden = !activo || batalla.infernal;
    parca.ver(parca.base);
  }
  // reposo: un solo cuadro de pie; el movimiento es solo la respiración del CSS
  // ataque a distancia (solo en modo infernal): carga la boca, forma la bola de fuego y la escupe;
  // la bola viaja hasta el guerrero y estalla. Posiciones en px de la arena (el jefe está espejado).
  const verCarga = i => slots[1].querySelector('.carga').style.backgroundPositionX = (-i * 480) + 'px';
  function bolaFuego() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto'); slots[1].classList.add('cargando');
      for (let i = 0; i < 8; i++) { verCarga(i); await wait(i < 4 ? 140 : 120); }
      slots[1].classList.remove('cargando'); parca.frames.classList.remove('quieto');
      sonidoLlamas();
      const b = document.createElement('div'); b.className = 'bola'; arena.appendChild(b);
      const verBola = i => b.style.backgroundPositionX = (-i * 260) + 'px';
      const x0 = slots[1].offsetLeft - 70, y0 = slots[1].offsetTop - 56;   // boca (la fila de la bola se bajó 3 px al apoyar a Cerbero en el suelo)
      const x1 = slots[0].offsetLeft + 18, y1 = slots[0].offsetTop + 20;   // pecho del guerrero
      const mover = t => b.style.transform = `translate(${x0 + (x1 - x0) * t}px, ${y0 + (y1 - y0) * t}px) scaleX(-1)`;
      b.style.transition = 'none'; mover(0); verBola(0); b.offsetWidth; b.style.transition = '';
      for (let i = 0; i < 4; i++) { verBola(i); mover((i + 1) / 4); await wait(110); }   // crece mientras avanza
      alImpacto();
      verBola(4); await wait(160); verBola(5); await wait(160); b.remove();               // estalla
    })();
    return impacto;
  }   // el largo se ajusta a la distancia boca-guerrero
  function lanzallamas() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto');
      parca.ver(16); await wait(260); parca.ver(17); await wait(200);   // abre las fauces (se queda así mientras sopla)
      // la llama nace en la boca y apunta al cuerpo del guerrero: el contenedor gira sobre la boca
      // y la tira (que en la hoja apunta a la derecha) va espejada dentro
      const bocaX = slots[1].offsetLeft + 32, bocaY = slots[1].offsetTop - 32;   // fauces del cuadro 17 (espejado, x2)
      const objX = slots[0].offsetLeft + 150, objY = slots[0].offsetTop + 130;
      const largo = Math.hypot(bocaX - objX, objY - bocaY) + 60, ang = Math.atan2(objY - bocaY, bocaX - objX) * 180 / Math.PI;
      const ll = document.createElement('div'); ll.className = 'llama'; arena.appendChild(ll);
      Object.assign(ll.style, { left: (bocaX - largo) + 'px', top: (bocaY - LLAMA.alto / 2) + 'px', width: largo + 'px', transform: `rotate(${-ang}deg)` });
      const tira = document.createElement('div'); ll.appendChild(tira);
      tira.style.backgroundSize = `${25 * largo}px ${LLAMA.alto}px`;
      const ver = i => tira.style.backgroundPositionX = (-i * largo) + 'px';
      sonidoLlamas();
      for (let i = 0; i < 8; i++) { ver(i); await wait(i < 4 ? 70 : 90); }
      for (let k = 0; k < 24; k++) { ver(8 + k % 17); if (k === 8) alImpacto(); await wait(65); }
      ll.classList.add('apaga'); await wait(220); ll.remove();
      parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  function ataqueCerbero(tipo) {   // tipo: lo que decidió el motor (decidirAtaqueEnemigo)
    if (tipo === 'bola') return bolaFuego();
    if (tipo === 'lanza') return lanzallamas();
    const b = batalla.infernal ? 16 : 4;
    return parca.jugar([[b, 180], [b + 1, 200, batalla.enemigo.avance, sonidoMordisco], [b + 2, 150], [b + 3, 220, , r => r()], [b + 3, 200, 0]]);
  }
  // prueba: deja a Asmodeo en el 50 % (activa curación y escudo); su escudo se carga ya para verlo en su próximo turno
  $('minoPrueba').onclick = () => {
    if (enRonda || batalla.terminada || !batalla.enemigo.minotauro) return;
    const u = enemigoDuelo(); u.vida = Math.min(u.vida, Math.floor(u.vidaMax * FURIA.umbral)); pintarVida(slots[1], u.vida, u.vidaMax);
    batalla.turnoFuria = FURIA.turnos - 1; avisar('Minotauro al 70 %');
  };
  $('asmodeoPrueba').onclick = () => {
    if (enRonda || batalla.terminada || !batalla.enemigo.asmodeo) return;
    const u = enemigoDuelo(); u.vida = Math.min(u.vida, Math.floor(u.vidaMax / 2)); pintarVida(slots[1], u.vida, u.vidaMax);
    batalla.turnoEscudo = ESCUDO.turnos - 1; avisar('Asmodeo al 50 %');
  };
  $('infernalPrueba').onclick = async () => {
    if (enRonda || batalla.terminada || batalla.infernal || !batalla.enemigo.cerbero) return;
    const u = enemigoDuelo(); u.vida = Math.min(u.vida, Math.floor(u.vidaMax / 2)); pintarVida(slots[1], u.vida, u.vidaMax);
    await transformar();
  };
  async function animarTransformacion() {
    const d = document.createElement('div'); d.className = 'destello'; document.body.appendChild(d); setTimeout(() => d.remove(), 1300);
    avisar('¡MODO INFERNAL!');
    arena.classList.add('tiembla');
    $('nombreEnemigo').textContent = 'Cerbero infernal';
    modoJefe();
    await wait(1200);
    arena.classList.remove('tiembla');
  }
  // Asmodeo: barrido o garras (avanza), onda de alas (a distancia) y curación
  function ondaAlas() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto');
      parca.ver(4); await wait(320);
      parca.ver(7); sonidoGruñido();
      const o = document.createElement('div'); o.className = 'onda'; arena.appendChild(o);
      const x0 = slots[1].offsetLeft + 20, y0 = slots[1].offsetTop - 60, x1 = slots[0].offsetLeft + 90, y1 = slots[0].offsetTop + 40;
      o.style.transition = 'none'; o.style.transform = `translate(${x0}px, ${y0}px) scale(.6)`; o.offsetWidth; o.style.transition = '';
      o.style.transform = `translate(${x1}px, ${y1}px) scale(1.2)`;
      await wait(350); alImpacto(); o.style.opacity = 0; await wait(250); o.remove();
      parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  function ataqueAsmodeo(tipo) {
    if (tipo === 'escudo') return escudoAsmodeo();
    if (tipo === 'cura') return curacionAsmodeo();
    if (tipo === 'onda') return ondaAlas();
    const g = tipo === 'garras' ? 6 : 5;   // ráfaga de garras o barrido
    return parca.jugar([[4, 260], [g, 240, batalla.enemigo.avance, sonidoGruñido], [g, 220, , r => r()], [g, 180, 0]]);
  }   // 1-2 son el reposo con restos del suelo: se empieza en el 3
  const verEscudo = i => slots[1].querySelector('.escudo').style.backgroundPositionX = (-i * 520) + 'px';
  function escudoAsmodeo() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto'); slots[1].classList.add('escudando'); sonidoCuracion();
      for (const i of ORDEN_ESCUDO) { verEscudo(i); if (i === 16) alImpacto(); await wait(i >= 16 && i <= 28 ? 75 : 95); }
      slots[1].classList.remove('escudando'); parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  // curación: se concentra, abre un círculo mágico, lo envuelve una onda verde y vuelve al reposo.
  // La vida se recupera con la onda (cuadro 6).
  const verCura = i => slots[1].querySelector('.curacion').style.backgroundPositionX = (-i * 420) + 'px';
  function curacionAsmodeo() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    (async () => {
      parca.frames.classList.add('quieto'); slots[1].classList.add('curando'); sonidoCuracion();
      // cuadros 4-5 (círculo mágico) descartados: la secuencia pasa de concentrarse a la onda verde
      for (const [i, ms] of [[12, 180], [13, 180], [0, 220], [1, 200], [3, 220], [2, 240], [6, 260], [7, 240], [8, 260], [9, 200], [10, 200], [11, 220]]) { verCura(i); if (i === 6) alImpacto(); await wait(ms); }
      slots[1].classList.remove('curando'); parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  // Gran Minotauro: levanta la espada, avanza y barre; furia: ruge, se envuelve en aura y vuelve a su pose
  // brillando en naranja mientras dura.
  function ataqueMinotauro(tipo) {
    if (tipo === 'furia')
      return parca.jugar([[0, 200], [20, 180, , sonidoMinotauro], [21, 180], [22, 200], [23, 300, , r => r()], [24, 260], [0, 120]]);
    if (tipo === 'tajo') return granTajo();
    return parca.jugar([[6, 150], [7, 130], [8, 140], [9, 160, batalla.enemigo.avance, sonidoMinotauro], [10, 110], [11, 120, , r => { sonidoEspadaMinotauro(); r(); }], [12, 180], [12, 140, 0]]);
  }
  // Gran Tajo: alza la espada, salta hacia el guerrero, abre el arco, la estrella contra el suelo (impacto),
  // la explosión de fuego cubre al guerrero, se disipa y vuelve a su sitio.
  const verTajo = i => slots[1].querySelector('.tajo').style.backgroundPositionX = (-i * 1088) + 'px';
  function granTajo() {
    let alImpacto; const impacto = new Promise(r => alImpacto = r);
    const pj = slots[1].querySelector('.pj');
    (async () => {
      parca.frames.classList.add('quieto'); slots[1].classList.add('tajando');
      // orden: 0, 3, 1, 2, 4, 5, 6, (9-11: 6->7), 7, (12-14: 7->8), 8
      for (const [i, ms, mov, acc] of [[0, 170], [3, 130], [1, 150, GRAN_TAJO.avance, sonidoMinotauro], [2, 160],
                                       [4, 170, , () => { sonidoEspadaMinotauro(); alImpacto(); }], [5, 280], [6, 160],
                                       [9, 70], [10, 70], [11, 70], [7, 140], [12, 70], [13, 70], [14, 70], [8, 200, 0]]) {
        verTajo(i);
        if (mov !== undefined) pj.style.transform = mov ? `translateX(${avanceReal(mov)}px)` : '';
        if (acc) acc();
        await wait(ms);
      }
      slots[1].classList.remove('tajando'); parca.ver(parca.base); parca.frames.classList.remove('quieto');
    })();
    return impacto;
  }
  async function muerteMinotauro() {
    parca.frames.classList.add('quieto');
    for (const i of [13, 16, 17, 18]) { parca.ver(i); await wait(300); }
    await wait(600);
  }
  async function muerteAsmodeo() {
    parca.frames.classList.add('quieto');
    for (let i = 8; i <= 12; i++) { parca.ver(i); await wait(300); }   // cae y se convierte en cristal
    await wait(600);
  }
  async function muerteCerbero() {
    parca.frames.classList.add('quieto');
    for (let i = 0; i < 4; i++) { parca.ver(parca.base + 8 + i); await wait(260); }
    await wait(500);
  }   // y por batalla: campana, reglas, grupo (unidades), enemigo, iEnemigo, st (estadísticas del jugador) y ganado

  function pintarVida(slot, actual, max) {
    const barra = slot.querySelector('.barra');
    barra.querySelector('i').style.width = Math.max(0, actual / max * 100) + '%';
    barra.classList.toggle('baja', actual / max < .3);
  }

  async function mostrarEnemigo() {
    enemigoDuelo().el = slots[1];
    const i = batalla.iEnemigo;
    for (const u of [heroeYo(), enemigoDuelo()]) pintarEstadosU(u);
    modoJefe();
    $('nombreEnemigo').textContent = batalla.infernal ? 'Cerbero infernal' : batalla.enemigo.nombre;
    $('oleada').textContent = batalla.campana.mundial || batalla.campana.arena || batalla.campana.reyes ? '' : batalla.campana.torre ? `Piso ${batalla.campana.torre} · ${i + 1}/${batalla.campana.enemigos.length}` : `Enemigo ${i + 1} / ${batalla.campana.enemigos.length}`;   // jefe mundial y arena: ya lo dice el título
    parca.frames.style.filter = batalla.enemigo.filtro;
    slots[1].classList.toggle('jefe', !!batalla.enemigo.jefe);
    if (batalla.enemigo.jefe || batalla.enemigo.cerbero || batalla.enemigo.asmodeo || batalla.enemigo.minotauro) avisar(batalla.enemigo.jefe ? '¡Jefe!' : `¡${batalla.enemigo.nombre}!`);
    ajustarEscala();
    pintarVida(slots[1], enemigoDuelo().vida, enemigoDuelo().vidaMax);
    slots[1].classList.remove('muerto');
    if (heroeYo().vida > 0) { guerrero.setBase(0); guerrero.frames.classList.remove('quieto'); guerrero.ver(0); }   // de pie tras una derrota anterior
    slots[1].classList.add('entra');
    await wait(50);
    slots[1].classList.remove('entra');
    await wait(600);
  }
  async function iniciarCampana(c) {
    revisarEstamina();
    const coste = c.arena || c.mundial || c.torre || c.reyes || c.calabozo || c.grieta ? 0 : (c.coste || ESTAMINA_CAMPANA);   // arena y jefes gastan entradas, no estamina
    if (jugador.estamina < coste) { avisar('Sin estamina: vuelve mañana'); return; }
    jugador.estamina -= coste; if (coste) contarMision('estamina', coste); guardar(); pintarHud();
    prepararBatalla(c);
    if (!c.grupo) heroeYo().el = slots[0];   // 1 contra 1: cada unidad se dibuja en su lado de la escena
    pintarAura(slots[0].querySelector('.sombra'), c.grupo ? 0 : nivelAura());
    slots[1].classList.remove('escudado', 'tajando', 'furia'); prepararMascota();
    // por si se salió a mitad de un ataque: ambos vuelven a su sitio
    slots.forEach(s => { s.querySelector('.pj').style.transform = ''; s.classList.remove('golpeado'); });
    marcoGuerrero.classList.remove('carga');
    $('pBatalla').classList.toggle('modo-grupo', c.grupo);
    const fondo = fondoBatalla(c); $('pBatalla').classList.toggle('con-fondo', !!fondo);
    $('pBatalla').style.backgroundImage = fondo ? `url(${fondo.img})` : '';
    $('pBatalla').style.setProperty('--zoom-fondo', fondo ? fondo.zoom : 1);
    // el acelerador solo existe en combates sin otros jugadores online; en multijugador, x1 (salvo en modo pruebas)
    const multi = !!(c.reyes || c.calabozo) && !MODO_PRUEBAS;
    $('btnVel').style.display = multi ? 'none' : '';
    if (multi) { VELOCIDAD = 1; document.documentElement.style.setProperty('--vel', 1); } else ponerVelocidad(velElegida);
    dibujarHabilidades(); if (!c.grupo) pintarEstadosU(heroeYo());
    $('tituloBatalla').textContent = c.nombre;
    $('nombreGuerrero').innerHTML = `${etiquetaTitulo(tituloActual())}${jugador.nombre} · ${CLASES[jugador.clase].nombre} Nv ${jugador.nivel}`;
    $('resultado').classList.remove('visible');
    pintarVida(slots[0], heroeYo().vida, heroeYo().vidaMax);
    btn.disabled = false;
    ir('pBatalla');
    const pista = c.mundial ? musicaEpica : musica;
    musicaMenu.pause(); musica.pause(); musicaEpica.pause(); pista.currentTime = 0; pista.play();
    pintarEspecial();
    if (c.grupo) { await dibujarGrupo(c); iniciarCuentaTurno(); } else await mostrarEnemigo();
  }

  function salirBatalla(destino) {
    secEquipoBatalla = null;   // sin esto, al abandonar quedaba el equipo de la batalla guardado
    if (batalla.campana && batalla.campana.mundial) {
      const e = estadoMundial(batalla.campana.mundial);
      if (!batalla.terminada) { e.mio = (e.mio || 0) + batalla.danoHecho; batalla.danoHecho = 0; }   // abandono: el daño cuenta para el ranking
      e.vida = Math.max(0, enemigoDuelo().vida); guardar(); destino = destino === 'pCampana' ? 'pEvento' : destino; }
    if (batalla.campana && batalla.campana.arena && !batalla.terminada) avisar((batalla.campana.eco ? resultadoEco : resultadoArena)(false).replace(/<[^>]+>/g, ' ').trim());   // huir de la arena (o de un Eco) = derrota
    if (batalla.campana && batalla.campana.arena && destino === 'pCampana') destino = batalla.campana.eco ? 'pRanking' : 'pArena';
    if (batalla.campana && batalla.campana.torre && destino === 'pCampana') destino = 'pTorre';
    if (batalla.campana && batalla.campana.reyes && destino === 'pCampana') destino = 'pReyes';
    if (batalla.campana && batalla.campana.calabozo && destino === 'pCampana') destino = 'pCalabozo';
    if (batalla.campana && !batalla.terminada) batalla.campana.abandonada = true;   // la ronda en curso ya no cuenta muertes ni botín
    if (batalla.campana && (batalla.campana.reyes || batalla.campana.calabozo) && sala && !batalla.terminada) { for (const m of sala.miembros.slice(1)) m.listo = false; sala.trasBatalla = true; }   // huyendo también
    batalla.terminada = true; auto = false;
    btnAuto.title = 'Autoataque: OFF'; btnAuto.classList.remove('activo');
    musica.pause(); musicaEpica.pause();
    $('resultado').classList.remove('visible');
    ir(destino);
    sonarMusicaMenu();
  }
  // Abandonar: hay que confirmarlo y no se cobra nada de lo ganado en la batalla
  $('huir').onclick = () => {
    if (enRonda) return;   // ataque en curso: se puede salir al terminar la ronda
    if (batalla.terminada) return salirBatalla(batalla.campana.grieta ? 'pGrieta' : 'pCampana');
    modalFijo = true;
    abrirModal('comun', `<h2>¿Abandonar la batalla?</h2>
      <p>Si sales ahora <b>no recibirás ninguna recompensa</b> (oro, experiencia ni materiales) y la estamina gastada no se devuelve.</p>
      <div class="fila"><button data-acc="seguir">Seguir luchando</button><button data-acc="salir">Abandonar</button></div>`);
    $('detCaja').onclick = e => {
      const acc = e.target.closest('button')?.dataset.acc; if (!acc) return;
      modalFijo = false; cerrarModal();
      if (acc === 'salir') salirBatalla(batalla.campana.grieta ? 'pGrieta' : 'pCampana');
    };
  };
  $('resSalir').onclick = () => salirBatalla(batalla.campana.mundial ? 'pEvento' : batalla.campana.eco ? 'pRanking' : batalla.campana.arena ? 'pArena' : batalla.campana.torre ? 'pTorre' : batalla.campana.grieta ? 'pGrieta' : batalla.campana.reyes ? 'pReyes' : 'pCampana');
  $('resOtra').onclick = () => batalla.campana.mundial ? iniciarMundial() : batalla.campana.torre ? iniciarTorre() : iniciarCampana(batalla.campana);

  $('resTexto').addEventListener('click', e => { const b = e.target.closest('[data-uid]'); if (b) mostrarObjeto(+b.dataset.uid); });   // objetos ganados en la batalla: se muestran como iconos en el resultado
  function mostrarResultado(gano) {
    auto = false;
    btnAuto.title = 'Autoataque: OFF'; btnAuto.classList.remove('activo');
    const { extra: extraRes, sinBotin, danoHecho } = cobrarResultado(gano);
    $('resTitulo').textContent = gano ? '¡Victoria!' : 'Derrota';
    $('resTexto').innerHTML = (batalla.campana.mundial ? (gano ? `¡Has derrotado a ${batalla.enemigo.nombre}!<br><br>` : `Daño causado: <b>${danoHecho}</b>. A ${batalla.enemigo.nombre} le quedan ${Math.max(0, enemigoDuelo().vida)} de vida.<br><br>`) :
      gano ? '' : `Caíste ante ${batalla.enemigo.nombre}.<br><br>`) +
      `<span class="recompensa">Total ganado: <img class="ic-txt" src="img/iconos/oro.png" alt="">${batalla.ganado.oro} oro · ${batalla.ganado.xp} XP<br><img class="ic-txt" src="img/iconos/mat_piedra.png" alt="">${batalla.ganado.piedra} piedras · <img class="ic-txt" src="img/iconos/mat_polvo.png" alt="">${batalla.ganado.polvo} polvo${batalla.ganado.almas ? ` · 💠 ${batalla.ganado.almas} almas` : ''}</span>`;
    $('resTexto').innerHTML += extraRes + (sinBotin ? '<br><small>En la Torre el botín solo se cobra al superar el piso.</small>' : '')
      + (obtenidos.length ? `<div class="obtenidos">Obtenido: ${obtenidos.map(o => `<button class="item r-${modelo[o.modelo].rareza}" data-uid="${o.uid}">${icono(modelo[o.modelo])}</button>`).join('')}</div>` : '');
    $('resOtra').textContent = batalla.campana.torre ? (gano ? `Subir al piso ${batalla.campana.torre + 1}` : 'Reintentar') : gano ? 'Jugar de nuevo' : 'Reintentar';
    $('resOtra').style.display = (batalla.campana.mundial && gano) || batalla.campana.arena || batalla.campana.reyes || batalla.campana.calabozo || batalla.campana.grieta ? 'none' : '';
    $('resSalir').textContent = batalla.campana.mundial ? 'Volver al evento' : batalla.campana.eco ? 'Volver a los Ecos' : batalla.campana.arena ? 'Volver a la arena' : batalla.campana.torre ? 'Volver a la torre' : batalla.campana.reyes ? 'Volver a la Torre de reyes' : batalla.campana.calabozo ? 'Volver al calabozo' : batalla.campana.grieta ? 'Volver a la Grieta' : 'Volver a campaña';
    $('resultado').classList.add('visible');
    if (!gano && batalla.enemigo.minotauro) { parca.frames.classList.add('quieto'); parca.ver(19); }   // rugido de victoria
    if (!gano && batalla.enemigo.asmodeo) { parca.frames.classList.add('quieto'); parca.ver(16); }   // pose de victoria
  }
  function pintarRanking() {
    const lista = ranking(), puesto = lista.findIndex(j => j.yo) + 1;
    return `<div class="ranking"><h3>Top 5 · % de daño hoy</h3>${lista.slice(0, 5).map((j, i) =>
      `<div class="${j.yo ? 'yo' : ''}"><span>#${i + 1} ${j.nombre}</span><span class="pct"><i style="width:${Math.min(100, j.pct * 4)}%"></i></span><b>${j.pct}%</b></div>`).join('')}
      ${puesto > 5 ? `<div class="yo"><span>#${puesto} ${jugador.nombre} (tú)</span><span class="pct"><i style="width:${Math.min(100, lista[puesto - 1].pct * 4)}%"></i></span><b>${lista[puesto - 1].pct}%</b></div>` : ''}</div>`;
  }
  function iniciarMundial() {
    if (estadoMundial().vida <= 0 || entradasJefe() <= 0) return;
    jugador.entradasJefe--; guardar();
    iniciarCampana(batallaMundial(mundialSel));
  }
  async function transformar() { batalla.infernal = true; await animarTransformacion(); }
