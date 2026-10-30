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
  };
  // Asesino: cuadros de img/asesino/tira.png, en el orden de sus hojas (tools/hojas/asesino_*.jpg):
  // ataque 0-19 · sombra 20-39 · golpe 40-54 · carrera 55-69 · reposo 70-79. Va cuerpo a cuerpo.
  const ANIM_ASESINO = (() => {
  const A = n => n, S = n => 20 + n, G = n => 40 + n, C = n => 55 + n;
  const tramo = (f, a, b, ms) => Array.from({ length: b - a + 1 }, (_, k) => [f(a + k), ms]);
  const cargaAsesino = on => () => marcoGuerrero.classList.toggle('carga', on);
  return {
    // corre hacia el enemigo, tajo, frena y vuelve a su sitio
    ataque: () => [[C(2), 90, 360], [C(3), 80], [C(4), 80], [C(5), 80], [C(6), 80], [C(7), 80],
      [C(1), 160, , r => { sonidoEspada(); r(); }], [C(8), 120], [C(9), 110, 0], ...tramo(C, 10, 14, 80)],
    // cruza las cuchillas, las carga hasta estallar, salta y barre con el destello
    punalada: () => [...tramo(A, 1, 3, 90), [A(4), 110, , cargaAsesino(true)], ...tramo(A, 5, 9, 80),
      [A(10), 170, , cargaAsesino(false)], [A(11), 100, 360], [A(12), 90], [A(13), 90], [A(14), 110, , sonidoEspada],
      [A(15), 200, , r => r()], [A(16), 140], [A(17), 120, 0], [A(18), 120], [A(19), 150], [A(0), 120]],
    // se envuelve en sombras, se desvanece, se lanza y descarga dos tajos
    paso: () => [...tramo(S, 15, 19, 100), [S(0), 160], [S(1), 150, 360, () => { estela(); sonidoEspada(); }],
      [S(2), 90], [S(3), 90], [S(4), 180, , r => r()], [S(8), 120, 0], [S(9), 130]],
    // aura, tajos con chispa, cruce de cuchillas, se disuelve y reaparece en su sitio
    danza: () => [[S(16), 160, , cargaAsesino(true)], [S(17), 260, , cargaAsesino(false)], [S(5), 110, 360], [S(6), 90],
      [S(7), 150, , sonidoEspada], [S(10), 240, , r => { arco(); sonidoEspada(); r(); }], [S(11), 200, 0],
      [S(12), 120], [S(13), 120], [S(14), 150]],
    golpe: () => [...tramo(G, 1, 4, 110), [G(0), 120]],               // retrocede al recibir el golpe
    derrota: () => [...tramo(G, 5, 9, 130), ...tramo(G, 10, 14, 150)],   // hinca la rodilla y cae
  };
  })();
  const ANIM_CLASE = { asesino: ANIM_ASESINO };   // clases con animaciones propias (las demás usan las del guerrero)
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
      b.innerHTML = `<span class="hab-ic">${h.icono}</span>${falta > 0 ? `<i class="hab-cd">${falta}</i>` : ''}`;
      b.title = h.nombre; b.setAttribute('aria-label', h.nombre);
      b.style.setProperty('--cd', falta > 0 ? falta / h.turnos : 0);
      b.classList.toggle('cargada', falta <= 0);   // 'cargada' (no 'lista': esa clase es la lista de niveles de la campaña)
      b.disabled = falta > 0 || enRonda || auto || batalla.terminada;
    }
    document.querySelectorAll('#pruebas button').forEach(b => b.disabled = enRonda || auto || batalla.terminada);
  }
  document.querySelector('#pBatalla').addEventListener('click', e => {
    const b = e.target.closest('[data-hab]'); if (!b || b.disabled) return;
    const h = HABILIDADES.find(x => x.id === b.dataset.hab) || HAB_TODAS.find(x => x.id === b.dataset.hab);
    if (b.dataset.prueba || batalla.carga[h.id] >= h.turnos) ronda(h);
  });

  const ataques = [
    () => jugador.clase === 'mago' ? lanzarMaga() : animClase() ? guerrero.jugar(animClase().ataque()) : guerrero.jugar([            // avanza agachado, levanta la espada, tajo, impacto, regresa
      [1, 250, 360], [2, 170], [3, 90, , sonidoEspada], [4, 160, , r => r()], [5, 120], [6, 200, 0], [7, 150]]),
    tipo => batalla.enemigo.cerbero ? ataqueCerbero(tipo) : batalla.enemigo.asmodeo ? ataqueAsmodeo(tipo) : batalla.enemigo.minotauro ? ataqueMinotauro(tipo) : parca.jugar([   // dentro del espejo, +X es hacia el guerrero
      [1, 220], [2, 260, batalla.enemigo.avance || 410, sonidoGuadana], [3, 260, , r => r()], [4, 250, 0]]),
  ];
