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
  };
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
    () => guerrero.jugar([            // avanza agachado, levanta la espada, tajo, impacto, regresa
      [1, 250, 360], [2, 170], [3, 90, , sonidoEspada], [4, 160, , r => r()], [5, 120], [6, 200, 0], [7, 150]]),
    tipo => batalla.enemigo.cerbero ? ataqueCerbero(tipo) : batalla.enemigo.asmodeo ? ataqueAsmodeo(tipo) : batalla.enemigo.minotauro ? ataqueMinotauro(tipo) : parca.jugar([   // dentro del espejo, +X es hacia el guerrero
      [1, 220], [2, 260, batalla.enemigo.avance || 410, sonidoGuadana], [3, 260, , r => r()], [4, 250, 0]]),
  ];
