  // ---------------- Ascensión (pantalla del árbol) (pantalla) ----------------
  document.addEventListener('click', e => { const b = e.target.closest('[data-ir-formacion]'); if (b) { volverDeFormacion = b.dataset.irFormacion; ir('pFormacion'); } });
  $('volverFormacion').onclick = () => ir(volverDeFormacion);
  function pintarFormacion() {
    const F = jugador.formacion, quien = pos => F.pos === pos ? 'yo' : (F.aliados.find(a => a.pos === pos) || {}).bot;
    const nombreDe = q => q === 'yo' ? `${CLASES[jugador.clase].icono} Tú` : `${CLASES[DEF_BOTS.find(d => d.nombre === q).clase].icono} ${q}`;
    $('formacion').innerHTML = `<small class="nota">Elige una ficha y toca una casilla. Los golpes normales enemigos caen más en el frente
        (Frente 50 % · Arriba 20 % · Abajo 20 % · Retaguardia 10 %); las habilidades, en cualquiera. En grupo, máximo ${MAX_JUGADORES} jugadores
        (sin servidor, los aliados son los bots del ranking) y los enemigos tienen +${VIDA_POR_ALIADO * 100} % de vida por aliado.</small>
      <div class="fichas"><button data-ficha="yo" class="${fichaSel === 'yo' ? 'on' : ''}">${nombreDe('yo')}</button>
        ${(MODO_PRUEBAS ? DEF_BOTS : []).map(d => `<button data-ficha="${d.nombre}" class="${fichaSel === d.nombre ? 'on' : ''}">${nombreDe(d.nombre)} · ⚔ ${conPerfil(bots().find(b => b.nombre === d.nombre), () => poder()).toLocaleString('es')}</button>`).join('')}
        <button data-ficha="quitar" class="${fichaSel === 'quitar' ? 'on' : ''}">✖ Quitar aliado</button></div>
      <div class="rombo">${POSICIONES.map(pos => { const q = quien(pos);
        return `<button class="casilla${q ? ' ocupada' : ''}" data-pos="${pos}">${q ? nombreDe(q) : '—'}<small>${NOMBRE_POS[pos]} · ${PESO_POS[pos]} %</small></button>`; }).join('')}</div>
      <small class="nota">Jugadores: ${1 + F.aliados.length}/${MAX_JUGADORES}</small>`;
  }
  $('formacion').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const F = jugador.formacion;
    if (b.dataset.ficha) { fichaSel = b.dataset.ficha; return pintarFormacion(); }
    const pos = b.dataset.pos; if (!pos) return;
    const ocupante = F.pos === pos ? 'yo' : (F.aliados.find(a => a.pos === pos) || {}).bot;
    if (fichaSel === 'quitar') { F.aliados = F.aliados.filter(a => a.pos !== pos); }
    else if (fichaSel === 'yo') {   // mover tu personaje (si había un aliado, se intercambian las casillas)
      const al = F.aliados.find(a => a.pos === pos); if (al) al.pos = F.pos; F.pos = pos;
    } else {
      const ya = F.aliados.find(a => a.bot === fichaSel);
      if (ocupante === 'yo') { if (ya) { ya.pos = F.pos; F.pos = pos; } }   // no se pisa tu casilla: solo se intercambia si el aliado ya está
      else if (ya) { const otro = F.aliados.find(a => a.pos === pos); if (otro) otro.pos = ya.pos; ya.pos = pos; }
      else if (1 + F.aliados.length >= MAX_JUGADORES && !ocupante) { avisar(`Máximo ${MAX_JUGADORES} jugadores`); }
      else { F.aliados = F.aliados.filter(a => a.pos !== pos); F.aliados.push({ bot: fichaSel, pos }); }
    }
    guardar(); pintarFormacion();
  });   // { heroes: [...], enemigos: [...], ronda: n }
  const arenaG = $('arenaGrupo');
  // En vertical (pantalla más alta que ancha) la formación va en diagonal: tu grupo abajo a la izquierda y los enemigos
  // arriba a la derecha. Así la escena llena el móvil (en horizontal salía a ~1/3 de tamaño). Solo cambia dónde se dibuja
  // cada uno: los ataques se animan con la distancia entre los dos, sirva la posición que sirva.
  const XY_HEROE_V = { atras: [135, 680], arriba: [20, 565], abajo: [250, 565], frente: [135, 450] };   // +50 arriba: sus barras de vida
  const XY_ENEMIGO_V = { frente: [275, 280], arriba: [160, 165], abajo: [390, 165], atras: [275, 50] };
  const ANCHO_GRUPO_V = 686, ALTO_GRUPO_V = 910;
  const enVertical = () => document.body.clientHeight > document.body.clientWidth;   // el lienzo (puede estar girado)
  let grupoVertical = null;
  function colocarGrupo() {   // posición de cada unidad según la orientación (y la vuelve a poner si cambió)
    if (!batalla.grupo) return;
    grupoVertical = enVertical();
    for (const u of [...batalla.grupo.heroes, ...batalla.grupo.enemigos]) {
      [u.x, u.y] = (grupoVertical ? (u.lado === 0 ? XY_HEROE_V : XY_ENEMIGO_V) : (u.lado === 0 ? XY_HEROE : XY_ENEMIGO))[u.pos];
      if (u.el) Object.assign(u.el.style, { left: u.x + 'px', top: u.y + 'px', zIndex: 2 + Math.round(u.y / 50) });
    }
  }
  function ajustarGrupo() {
    if (batalla.grupo && grupoVertical !== enVertical()) colocarGrupo();
    const ancho = grupoVertical ? ANCHO_GRUPO_V : ANCHO_GRUPO, alto = grupoVertical ? ALTO_GRUPO_V : ALTO_GRUPO;
    const esc = document.querySelector('.escena'), e = Math.min(1, (esc.clientWidth - 16) / ancho, (esc.clientHeight - 30) / alto);
    Object.assign(arenaG.style, { width: ancho + 'px', height: alto + 'px', transform: `scale(${e})`,
      marginLeft: `${-(1 - e) * ancho / 2}px`, marginRight: `${-(1 - e) * ancho / 2}px`, marginBottom: `${-(1 - e) * alto}px` });
  }
  function dibujarUnidad(u) {
    const el = document.createElement('div');
    el.className = `unidad ${u.lado === 0 ? 'heroe' : 'enemigo'}`; Object.assign(el.style, { left: u.x + 'px', top: u.y + 'px', zIndex: 2 + Math.round(u.y / 50) });
    el.innerHTML = `<div class="sombra"></div><div class="vida"><b></b><div class="barra"><i></i></div><div class="estados"></div></div>` +
      (u.lado === 0 ? `<div class="pj"><div class="frames guerrero"></div></div>` : `<div class="espejo"><div class="pj"><div class="frames"></div></div></div>`);
    el.querySelector('.vida b').textContent = u.nombre; arenaG.appendChild(el);
    u.el = el;
  }
  async function dibujarGrupo(c) {
    arenaG.innerHTML = ''; $('oleada').textContent = c.torre ? `Piso ${c.torre}` : '';
    const { heroes, enemigos } = batalla.grupo; colocarGrupo();
    for (const u of heroes) {
      dibujarUnidad(u);
      if (u.yo) u.el.classList.add('yo');
      const capas = montarCapas(u.el.querySelector('.frames')); conPerfil(u.perfil, () => pintarVista(capas));
      u.pj = personajeClase(u.el, u.clase); pintarVida(u.el, u.vida, u.vidaMax);
      pintarAura(u.el.querySelector('.sombra'), nivelAura(u.perfil));
    }
    const yo = heroes.find(h => h.yo), m = mascotaActual();
    if (m) { const a = document.createElement('div'); a.className = 'acompana'; a.innerHTML = dibujoMascota(m, .4); yo.el.appendChild(a); yo.mascotaEl = a; }
    for (const u of enemigos) {
      dibujarUnidad(u);
      if (u.perfil) {   // un rey: se dibuja como un jugador
        u.el.classList.replace('enemigo', 'unidad-rey');
        const fr = u.el.querySelector('.frames'); fr.classList.add('guerrero');
        const capas = montarCapas(fr); conPerfil(u.perfil, () => pintarVista(capas));
        u.pj = personaje(u.el, 296); pintarVida(u.el, u.vida, u.vidaMax);
        if (u.e.jefe) u.el.classList.add('jefe');
      } else {
        if (u.e.jefe) u.el.classList.add('jefe');
        u.el.querySelector('.frames').style.filter = u.e.filtro || '';
        u.pj = personaje(u.el, 260); pintarVida(u.el, u.vida, u.vidaMax);
      }
    }
    marcarObjetivo(batalla.grupo.objetivo);
    ajustarGrupo();
    if (c.reyes) avisar('¡Los 3 reyes!'); else if (enemigos.some(u => u.e.jefe)) avisar('¡Jefe!');
    await wait(500);
  }

  // ---- dibujo de las unidades ----
  function fxU(u, cls, texto, dy = 0) {
    const e = document.createElement('div'); e.className = `fx-grupo fx ${cls}`; e.textContent = texto;
    e.style.left = (u.x + 70) + 'px'; e.style.top = (u.y + 10 + dy) + 'px'; arenaG.appendChild(e); setTimeout(() => e.remove(), 1500);
  }
  function marcarObjetivo(t) { batalla.grupo.objetivo = t; for (const e of batalla.grupo.enemigos) e.el.classList.toggle('objetivo', e === t); }
  arenaG.addEventListener('click', e => {
    const el = e.target.closest('.unidad'); if (!el || !batalla.grupo) return;
    const t = batalla.grupo.enemigos.find(x => x.el === el); if (t && t.vida > 0) marcarObjetivo(t);
  });

  // ---- animaciones ----
  async function moverA(u, t) {   // se acerca al objetivo (cuerpo a cuerpo)
    const dx = t.x - u.x + (u.lado === 0 ? -170 : 170), dy = t.y - u.y;
    u.el.style.zIndex = 20; u.el.style.transform = `translate(${dx}px, ${dy}px)`; await wait(220);
  }
  async function volver(u) { u.el.style.transform = ''; await wait(220); u.el.style.zIndex = 2 + Math.round(u.y / 50); }
  async function proyectil(u, t, icono) {
    const p = document.createElement('div'); p.className = 'proyectil';
    if (u.clase === 'mago') p.innerHTML = `<img src="${IMG_BOLA}" alt="" class="bola-maga${u.lado === 0 ? '' : ' izq'}">`; else p.textContent = icono;
    p.style.left = (u.x + (u.lado === 0 ? 180 : 40)) + 'px'; p.style.top = (u.y + 80) + 'px'; arenaG.appendChild(p);
    void p.offsetWidth;   // fuerza el layout para que la transición arranque (rAF no corre con la pestaña oculta)
    p.style.left = (t.x + 80) + 'px'; p.style.top = (t.y + 80) + 'px'; await wait(300); p.remove();
  }
  // ataque de un héroe: los guerreros van cuerpo a cuerpo; arqueros y magos disparan desde su casilla
  async function animHeroe(u, t, hab) {
    const lejos = !!CLASES[u.clase].distancia;
    if (hab) { u.el.querySelector('.frames').classList.add('carga'); await wait(250); u.el.querySelector('.frames').classList.remove('carga'); }
    const anim = ANIM_CLASE[u.clase];   // animación propia: se acerca en el paso que avanza (la preparación, en su casilla)
    if (!lejos && !anim) await moverA(u, t);
    const impacto = u.pj.jugar(anim ? enGrupo((hab && anim[hab.animacion] || anim.ataque)(), u, t)
      : [[1, 110], [2, 110], [3, 80, , sonidoEspada], [4, 140, , r => r()], [5, 110], [6, 130], [7, 100]]);
    if (lejos) await proyectil(u, t, hab ? hab.icono : u.clase === 'arquero' ? '🏹' : '✨');
    await impacto;
    return lejos ? null : () => volver(u);
  }
  async function animEnemigo(u, t) {
    await moverA(u, t);
    await u.pj.jugar([[1, 150], [2, 170, , sonidoGuadana], [3, 180, , r => r()], [4, 150]]);
    return () => volver(u);
  }
  // pasos de una animación propia en grupo: el paso que avanza llama a moverA; el regreso lo hace 'volver' al final
  const enGrupo = (pasos, u, t) => pasos.map(([c, ms, mov, accion]) =>
    [c, ms, undefined, mov ? r => { moverA(u, t); if (accion) accion(r); } : accion]);
  // héroe con animaciones propias: retrocede al recibir el golpe; al caer, se ve la derrota antes de desaparecer
  function retrocedeU(t) { const a = t.lado === 0 && ANIM_CLASE[t.clase]; if (a) t.pj.jugar(a.golpe()); }
  async function caeU(u) {
    const a = u.lado === 0 && ANIM_CLASE[u.clase]; if (!a) return;
    const pasos = a.derrota(); u.pj.setBase(pasos[pasos.length - 1][0]); u.pj.jugar(pasos);
    await wait(pasos.reduce((t, p) => t + p[1], 0) + 400);
  }
  function golpeVisual(t) { t.el.classList.remove('golpeado'); void t.el.offsetWidth; t.el.classList.add('golpeado'); setTimeout(() => t.el.classList.remove('golpeado'), 600); }
  function pararCuentaTurno() { clearInterval(cuentaTurno); cuentaTurno = null; delete btn.dataset.cuenta; }
  function iniciarCuentaTurno() {
    pararCuentaTurno();
    if (!batalla.campana || !(batalla.campana.reyes || batalla.campana.calabozo) || batalla.terminada || auto) return;
    let t = TIEMPO_TURNO; btn.dataset.cuenta = t;
    cuentaTurno = setInterval(() => {
      if (batalla.terminada || auto || pantallaActual !== 'pBatalla') return pararCuentaTurno();
      if (enRonda) return;
      if (--t > 0) btn.dataset.cuenta = t; else { pararCuentaTurno(); ronda(null); }
    }, 1000);
  }
  function htmlAscension() {
    const a = ascension();
    if (jugador.nivel < 80 && !a) return '';
    return `<div class="maestria">⭐ Ascensión <b>${a}/${ASCENSION_MAX}</b>${a ? ` · +${5 * a} % a todo · +${2 * a} puntos de habilidad` : ''}
      ${jugador.nivel >= 80 && a < ASCENSION_MAX ? `<br><small>Vuelves al nivel 1 y se reinician los árboles; ganas +5 % a todo y 2 puntos de habilidad más.</small><br><button id="ascender">Ascender</button>` : ''}</div>`;
  }
  async function ascender() {
    if (jugador.nivel < 80 || ascension() >= ASCENSION_MAX) return;
    if (!await confirmar('¿Ascender? Vuelves al nivel 1 y se reinician los árboles de habilidades, a cambio de +5 % a todo y 2 puntos de habilidad extra para siempre.')) return;
    jugador.ascension = ascension() + 1; jugador.nivel = 1; jugador.xp = 0; jugador.arbol = {}; borrador = null;
    guardar(); montarHabilidades(); aplicarEquipo(); pintarHud(); avisar(`⭐ Ascensión ${jugador.ascension}`); pintarArbol();
  }
