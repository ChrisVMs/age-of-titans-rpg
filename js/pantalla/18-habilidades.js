  // ---------------- Habilidades (pantalla) ----------------
  // Cada habilidad se carga con los turnos del guerrero (cada ataque suma 1 a todas las demás)
  // y al usarla vuelve a cero.
  const marcoGuerrero = document.querySelector('#s1 .frames');
  // Animación de cada habilidad (la habilidad dice cuál usa en h.animacion): pasos cuadro a cuadro del guerrero
  const ANIM_HAB = {
    estocada: () => guerrero.jugar([
        [1, 140, , () => marcoGuerrero.classList.add('carga')], [1, 450],               // se agacha y concentra energía
        [5, 160, 380, () => { marcoGuerrero.classList.remove('carga'); estela(); sonidoEspada(); }],
        [5, 220, , r => r()], [6, 220, 0], [7, 150]]),
    tajo: () => guerrero.jugar([
        [1, 200, 360], [4, 110], [12, 70, , sonidoEspada], [13, 220, , r => { arco(); r(); }], [6, 200, 0], [7, 150]]),
    aplastante: () => guerrero.jugar([
        [1, 140, , () => marcoGuerrero.classList.add('carga')], [1, 350, 360],
        [2, 170, , () => marcoGuerrero.classList.remove('carga')], [3, 90, , sonidoEspada], [4, 220, , r => { arco(); r(); }], [5, 120], [6, 200, 0], [7, 150]]),
    // Maga: lanza desde su sitio; cuanto más fuerte la habilidad, más tiempo conjura
    bola: () => lanzarMaga(300),
    lanza: () => lanzarMaga(150),
    meteoro: () => lanzarMaga(450),
    punalada: () => guerrero.jugar(ANIM_ASESINO.punalada()),
    paso: () => guerrero.jugar(ANIM_ASESINO.paso()),
    danza: () => guerrero.jugar(ANIM_ASESINO.danza()),
    // Arquero: dispara desde su sitio (Disparo certero se dibuja como Doble flecha)
    doble: () => guerrero.jugar(ANIM_ARQUERO.doble(r => flechaArquero(1, r))),
    lluvia: () => guerrero.jugar(ANIM_ARQUERO.lluvia(lluviaFlechas)),
    perforante: () => guerrero.jugar(ANIM_ARQUERO.perforante(r => flechaArquero(0, r))),
  };
  // Asesino: cuadros de img/asesino/tira.png, en el orden de sus hojas (tools/hojas/asesino_*.jpg):
  // ataque 0-19 · sombra 20-39 · derrota 40-54 · retroceso 55-69 · reposo 70-79 · puñalada 80-99 · preparación 100-108 (108: intermedio entre 102 y 103). Va cuerpo a cuerpo.
  const ANIM_ASESINO = (() => {
  const A = n => n, S = n => 20 + n, G = n => 40 + n, C = n => 55 + n, P = n => 80 + n, R = n => 100 + n;
  const tramo = (f, a, b, ms) => Array.from({ length: b - a + 1 }, (_, k) => [f(a + k), ms]);
  const anim = {
    // salta hacia el enemigo, barre con la cuchilla y vuelve a su sitio (cuadros 11-19)
    // con los cuadros intermedios de la tira (sin ellos, en las skins, los mismos 9 cuadros)
    ataque: () => intercalar([[A(11), 110, 360], [A(12), 90], [A(13), 90], [A(14), 110, , sonidoEspada],
      [A(15), 180, , r => r()], [A(16), 130], [A(17), 120, 0], [A(18), 120], [A(19), 130]], 'ataque', spriteClase('asesino')),
    // en su sitio desenvaina y cruza las cuchillas (preparación 0-7), las carga hasta que estallan (ataque 5-10); se lanza (sombra 1), apuñala (sombra 7)
    // y remata (sombra 8). Los cuadros de la hoja de puñalada son los intermedios: carrera, frenada, apuntar y volver al reposo
    punalada: () => [[R(0), 130], [R(1), 130], [R(2), 120], [R(8), 110], [R(3), 140], ...tramo(R, 4, 7, 110), ...tramo(A, 5, 9, 110),
      [A(10), 240], [S(1), 90, 360], ...tramo(P, 9, 12, 60), [P(13), 80], ...tramo(P, 15, 17, 70),
      [P(18), 90, , sonidoEspada], [S(7), 200, , r => r()], [P(1), 110], [S(8), 150], [P(3), 110, 0], [P(4), 110], [P(6), 120], [70, 200]],
    // se envuelve en sombras, se desvanece, se lanza y descarga dos tajos
    paso: () => [...tramo(S, 15, 19, 100), [S(0), 160], [S(1), 150, 360, () => { estela(); sonidoEspada(); }],
      [S(2), 90], [S(3), 90], [S(4), 180, , r => r()], [S(8), 120, 0], [S(9), 130]],
    // buff en su sitio: cruza las cuchillas, le brillan los ojos y se envuelve en su aura de sombras
    danza: () => [[S(15), 130], [S(16), 160], [S(17), 200, , sonidoEspada], [S(19), 180], [S(18), 240, , r => r()], [S(19), 180],
      [S(17), 160], [S(16), 130], [S(15), 130]],
    golpe: () => [[C(1), 160], [C(2), 180], [C(7), 140], [C(9), 120], [C(10), 120]],   // encaja el golpe, se encoge y se recompone
    derrota: () => [...tramo(G, 1, 9, 120), ...tramo(G, 10, 14, 150)],   // recibe el golpe, hinca la rodilla y cae
  };
  // con los cuadros intermedios de la tira (prototipos/interpolar/PROCESO.md); sin ellos (las skins), los cuadros de siempre
  for (const n of ['punalada', 'paso', 'danza', 'golpe', 'derrota']) { const f = anim[n]; anim[n] = () => intercalar(f(), n, spriteClase('asesino')); }
  return anim;
  })();
  // Arquero: cuadros de img/arquero/tira.png (ver SPRITE_CLASE.arquero). Cada animación recibe qué hacer al soltar la
  // flecha (disparo(r): r = el impacto); sin él (en grupo, donde la flecha la dibuja proyectil()), solo marca el impacto.
  // 26 y 32 se saltan: les quedan restos de flechas de la celda vecina.
  const ANIM_ARQUERO = (() => {
    const tramo = (a, b, ms, sin = []) => Array.from({ length: b - a + 1 }, (_, k) => a + k).filter(c => !sin.includes(c)).map(c => [c, ms]);
    const soltar = d => d || (r => r());
    return {
      // saca una flecha, carga, apunta, suelta y baja el arco
      ataque: d => [[10, 90], [11, 100], [12, 100], [13, 100], [14, 120], [15, 180, , sonidoEspada], [16, 90, , soltar(d)], [17, 110], [18, 110], [19, 110]],
      // dos flechas a la vez con brillo verde
      doble: d => [[20, 90], [21, 110], [22, 120], [23, 120], [24, 220, , sonidoEspada], [25, 110, , soltar(d)], [27, 140], [28, 110], [29, 110]],
      // de rodillas, apunta al cielo y suelta una lluvia de flechas
      lluvia: d => [[30, 90], [31, 120], [33, 110], [34, 130], [35, 220, , sonidoEspada], [36, 120, , soltar(d)], [37, 220], [38, 120], [39, 110]],
      // como el ataque, cargando más tiempo con brillo
      perforante: d => [[10, 90], [11, 100], [12, 100], [13, 100], [14, 140, , () => marcoGuerrero.classList.add('carga')],
        [15, 380, , () => sonidoEspada()], [16, 100, , r => { marcoGuerrero.classList.remove('carga'); soltar(d)(r); }], [17, 110], [18, 110], [19, 110]],
      golpe: () => [[41, 90], [42, 110], [43, 100], [45, 110], [48, 90], [49, 80]],   // encaja el golpe y se recompone (pies quietos)
      derrota: () => [...tramo(50, 58, 120), ...tramo(59, 64, 150)],   // recibe el golpe, cae de rodillas, suelta el arco y cae
    };
  })();
  // efectos del arquero (img/arquero/efectos.png): 0 flecha · 1 doble flecha · 2 lluvia · 3 flechas clavadas
  const efectoArquero = (n, cls = '') => `<div class="ef-arquero ${cls}" style="background-position-x:${n * 100 / 3}%"></div>`;
  function flechaArquero(n, alImpacto) {   // la flecha vuela del arquero al enemigo
    const p = document.createElement('div'); p.className = 'proyectil'; p.innerHTML = efectoArquero(n);
    p.style.left = (slots[0].offsetLeft + 180) + 'px'; p.style.top = (slots[0].offsetTop + 90) + 'px'; arena.appendChild(p);
    void p.offsetWidth;
    p.style.left = (slots[1].offsetLeft + 40) + 'px'; p.style.top = (slots[1].offsetTop + 90) + 'px';
    setTimeout(() => { p.remove(); alImpacto(); }, 300);
  }
  // Lluvia de flechas: una volea sube desde el arco y sale por arriba; luego la lluvia cae sobre cada enemigo (x, y) y
  // quedan las flechas clavadas. cont: el escenario (1 contra 1 o grupo). Se cumple cuando caen (el impacto)
  // dir: -1 si dispara hacia la izquierda (el arquero rival: todo se dibuja volteado) · tam: 'grande' (1 contra 1) o 'media' (grupo)
  async function lluviaSobre(cont, x0, y0, blancos, dir = 1, tam = 'grande') {
    const izq = dir < 0 ? ' izq' : '';
    const v = document.createElement('div'); v.className = 'proyectil volea-arq'; v.innerHTML = efectoArquero(1, izq);
    v.style.left = x0 + 'px'; v.style.top = y0 + 'px'; cont.appendChild(v);
    void v.offsetWidth; v.style.top = (y0 - 420) + 'px'; v.style.left = (x0 + 160 * dir) + 'px';
    await wait(300); v.remove();
    const caen = blancos.map(([x, y]) => {
      const p = document.createElement('div'); p.className = 'proyectil'; p.innerHTML = efectoArquero(2, tam + izq);
      p.style.left = (x - 40) + 'px'; p.style.top = (y - 260) + 'px'; cont.appendChild(p); return [p, y];
    });
    void cont.offsetWidth; for (const [p, y] of caen) p.style.top = (y + 10) + 'px';
    await wait(300);
    for (const [p] of caen) { p.innerHTML = efectoArquero(3, tam + izq); setTimeout(() => p.remove(), 450); }
  }
  const lluviaFlechas = alImpacto => lluviaSobre(arena, slots[0].offsetLeft + 200, slots[0].offsetTop + 40,
    [[slots[1].offsetLeft, slots[1].offsetTop]]).then(alImpacto);
  const ANIM_CLASE = { asesino: ANIM_ASESINO, arquero: ANIM_ARQUERO };   // clases con animaciones propias (las demás usan las del guerrero)
  const animClase = () => ANIM_CLASE[jugador.clase];
  function retrocedeHeroe() { const a = animClase(); if (a) guerrero.jugar(a.golpe()); }
  async function caeHeroe() {
    const a = animClase(); if (!a) return;
    const pasos = a.derrota(); guerrero.setBase(pasos[pasos.length - 1][0]);   // queda tendido
    guerrero.jugar(pasos); await wait(pasos.reduce((t, p) => t + p[1], 0));
    guerrero.frames.classList.add('quieto');
  }
  // Maga: prepara el bastón, conjura y suelta la bola de fuego
  function bolaMaga(alImpacto) {
    const p = document.createElement('div'); p.className = 'proyectil';
    p.innerHTML = `<img src="${IMG_BOLA}" alt="" class="bola-maga">`;
    p.style.left = (slots[0].offsetLeft + 200) + 'px'; p.style.top = (slots[0].offsetTop + 80) + 'px'; arena.appendChild(p);
    void p.offsetWidth;
    p.style.left = (slots[1].offsetLeft + 60) + 'px'; p.style.top = (slots[1].offsetTop + 80) + 'px';
    setTimeout(() => { p.remove(); alImpacto(); }, 300);
  }
  const lanzarMaga = (carga = 0) => guerrero.jugar([
    [1, 150 + carga, , () => carga && marcoGuerrero.classList.add('carga')], [2, 120, , () => marcoGuerrero.classList.remove('carga')],
    [3, 110, , sonidoLlamas], [4, 220, , bolaMaga], [5, 200], [6, 130], [7, 120]]);
  function estela() {
    const e = document.createElement('div'); e.className = 'estela';
    e.style.left = (slots[0].offsetLeft + 150) + 'px'; e.style.top = (slots[0].offsetTop + 120) + 'px'; e.style.width = '520px';
    arena.appendChild(e); setTimeout(() => e.remove(), 500);
  }
  function arco() {
    const e = document.createElement('div'); e.className = 'arco';
    e.style.left = (slots[1].offsetLeft + 20) + 'px'; e.style.top = (slots[1].offsetTop + 10) + 'px';
    arena.appendChild(e); setTimeout(() => e.remove(), 450);
  }
  const dibujarHabilidades = () => $('habilidades').innerHTML = HABILIDADES.map(h => `<button class="especial" data-hab="${h.id}"></button>`).join('');
  function montarHabilidades() { prepararHabilidades(); dibujarHabilidades(); }
  montarHabilidades();
  $('pruebas').innerHTML = HAB_TODAS.map(h => `<button class="prueba" data-hab="${h.id}" data-prueba="1">${h.nombre} (prueba, sin espera)</button>`).join('') +
    `<button class="prueba" id="infernalPrueba" hidden>Cerbero a modo infernal (prueba)</button>` +
    `<button class="prueba" id="asmodeoPrueba" hidden>Asmodeo al 50 % de vida (prueba)</button>` +
    `<button class="prueba" id="minoPrueba" hidden>Minotauro al 70 % de vida (prueba)</button>`;
  function pintarEspecial() {
    for (const h of HABILIDADES) {
      const b = document.querySelector(`#habilidades [data-hab="${h.id}"]`), falta = h.turnos - batalla.carga[h.id];
      // botón con el símbolo de la habilidad y los turnos que faltan; el nombre queda como etiqueta (al mantener o pasar el ratón)
      b.innerHTML = `<span class="hab-ic">${iconoDe(h, 'ic-hab')}</span>${falta > 0 ? `<i class="hab-cd">${falta}</i>` : ''}`;
      b.title = h.nombre; b.setAttribute('aria-label', h.nombre);
      b.style.setProperty('--cd', falta > 0 ? falta / h.turnos : 0);
      b.classList.toggle('cargada', falta <= 0);   // 'cargada' (no 'lista': esa clase es la lista de niveles de la campaña)
      b.disabled = falta > 0 || enRonda || auto || batalla.terminada;
    }
    document.querySelectorAll('#pruebas button').forEach(b => b.disabled = enRonda || auto || batalla.terminada);
    pintarTitan();
  }
  // Modo Titán: barra (TITAN, 29-motor-del-combate.js) y botón; en auto o con el bot se activa solo
  ui.titanManual = () => !auto && !simulando && !(typeof botModo !== 'undefined' && botModo);
  function pintarTitan() {
    const b = $('btnTitan'), u = batalla.grupo && !batalla.terminada && nivelTitan() ? heroeYo() : null;
    b.hidden = !u; if (!u) return;
    const T = u.titan || { carga: 0, activo: 0 }, pct = T.activo ? 100 : Math.floor(T.carga), def = definitivaLista(u), D = DEFINITIVAS[jugador.clase];
    // con el Titán activo y la definitiva disponible (Nv 5+), el mismo botón la lanza
    b.firstChild.textContent = def && D ? D.icono : '⚡'; b.title = def && D ? D.nombre : 'Modo Titán';
    b.querySelector('small').textContent = T.activo ? `${T.activo} r` : `${pct} %`; b.style.setProperty('--titan', pct + '%');
    const puede = titanListo(u) || def;
    b.classList.toggle('listo', puede); b.disabled = !puede || enRonda || auto || batalla.terminada || batalla.titanPedido || batalla.definitivaPedida;
  }
  $('btnTitan').onclick = () => {
    const u = heroeYo(); if (enRonda || auto) return;
    if (titanListo(u)) batalla.titanPedido = true; else if (definitivaLista(u)) batalla.definitivaPedida = true; else return;
    ronda(null);
  };
  document.querySelector('#pBatalla').addEventListener('click', e => {
    const b = e.target.closest('[data-hab]'); if (!b || b.disabled) return;
    const h = HABILIDADES.find(x => x.id === b.dataset.hab) || HAB_TODAS.find(x => x.id === b.dataset.hab);
    if (b.dataset.prueba || batalla.carga[h.id] >= h.turnos) ronda(h);
  });

  const ataques = [
    () => jugador.clase === 'mago' ? lanzarMaga() : jugador.clase === 'arquero' ? guerrero.jugar(ANIM_ARQUERO.ataque(r => flechaArquero(0, r))) : animClase() ? guerrero.jugar(animClase().ataque()) : guerrero.jugar([            // avanza agachado, levanta la espada, tajo, impacto, regresa
      [1, 250, 360], [2, 170], [3, 90, , sonidoEspada], [4, 160, , r => r()], [5, 120], [6, 200, 0], [7, 150]]),
    tipo => batalla.enemigo.cerbero ? ataqueCerbero(tipo) : batalla.enemigo.asmodeo ? ataqueAsmodeo(tipo) : batalla.enemigo.minotauro ? ataqueMinotauro(tipo) : parca.jugar([   // dentro del espejo, +X es hacia el guerrero
      [1, 220], [2, 260, batalla.enemigo.avance || 410, sonidoGuadana], [3, 260, , r => r()], [4, 250, 0]]),
  ];
