  // ---------------- Vista del guerrero (pantalla) ----------------
  const TIRA_MAGA = `img/maga/tira.png?v=${VERSION_IMG}`, TIRA_ASESINO = `img/asesino/tira.png?v=${VERSION_IMG}`, IMG_BOLA = `img/maga/proyectil.png?v=${VERSION_IMG}`;
  // Clases con sprite propio. La Maga sigue las 14 poses del guerrero; el Asesino tiene su tira de 109 cuadros
  // (celda 325x357) con sus animaciones (ANIM_ASESINO en 18-habilidades) y una escala por hoja fuente, porque
  // cada hoja dibuja al personaje a otro tamaño (se iguala al mostrarlo; la imagen no se reescala).
  const SPRITE_CLASE = {
    mago: { tira: TIRA_MAGA },
    asesino: { tira: TIRA_ASESINO, cuadros: 109, celda: [325, 357],
               escala: i => i < 40 ? .84 : i < 55 ? .74 : i < 70 ? .72 : i < 80 ? .58 : i < 100 ? .82 : i < 108 ? .57 : .88,   // ataque y sombra · derrota · retroceso · reposo · puñalada · preparación (108: intermedio) (tamaño como la Maga)
               // reposo: [cuadro, ms] de ida y vuelta (sin saltar del último al primero); se detiene más en los extremos. 76-78 cambian de postura de golpe
               reposo: [[70, 520], [71, 260], [72, 240], [73, 240], [74, 260], [75, 300], [79, 520], [75, 300], [74, 260], [73, 240], [72, 240], [71, 260]] },
  };
  const spriteClase = (clase = jugador.clase) => SPRITE_CLASE[clase];
  // escala del cuadro i en la tira de la clase (las tiras de 14 poses no la necesitan) y cuadros de su reposo animado
  const escalaCuadro = (i, clase) => { const s = spriteClase(clase); return s && s.escala ? s.escala(i) : 1; };
  const reposoClase = clase => { const s = spriteClase(clase); return s && s.reposo; };
  function montarGuerrero(cont) { vistasGuerrero.push(montarCapas(cont)); }
  // capas del guerrero en un contenedor (sin registrarlas: las vistas de aliados se pintan con su propio perfil)
  function montarCapas(cont) {
    const capaDe = {};
    for (const [r, def] of Object.entries(RANURAS)) {
      const d = document.createElement('div');
      d.className = 'capa'; d.style.backgroundImage = `url(${def.tira})`;
      cont.appendChild(d); capaDe[r] = d;
    }
    const sk = document.createElement('img'); sk.className = 'skin'; sk.alt = ''; cont.appendChild(sk);
    const ska = document.createElement('div'); ska.className = 'capa capa-skin'; cont.appendChild(ska);
    capaDe._skin = sk; capaDe._skinAnim = ska; capaDe._cont = cont;
    return capaDe;
  }
  ui.aplicarEquipo = () => aplicarEquipo();
  // Aura de nivel n bajo el personaje de cont (sin aura con nivel 0)
  function pintarAura(cont, n) {
    if (!cont) return;
    let a = cont.querySelector(':scope > .aura');
    if (!n) { if (a) a.remove(); return; }
    if (!a) { a = document.createElement('div'); a.className = 'aura'; cont.prepend(a); }
    a.style.setProperty('--aura', n); a.classList.toggle('late', n >= 5 && n < AURA_MAX); a.classList.toggle('max', n >= AURA_MAX);
  }
  function aplicarEquipo() {
    for (const capaDe of vistasGuerrero) pintarVista(capaDe);
    pintarInventario();
    if (campListo) pintarCampamento();
  }
  // pinta equipo y skin del jugador actual (con conPerfil, de cualquier perfil) en una vista
  function pintarVista(capaDe) {
    for (const r of Object.keys(RANURAS)) {
      if (RANURAS[r].interna) continue;
      const m = modelo[objeto(jugador.equipado[r]).modelo];
      capaDe[r].style.backgroundImage = `url(${m.tira || RANURAS[r].tira})`; capaDe[r].style.filter = m.color;
    }
    // Maga y Asesino tienen sprite propio: se dibuja como una skin animada (las skins son del guerrero)
    const sp = spriteClase(), propio = !!sp;
    const k = sp ? { tira: sp.tira } : skinActual();
    {
      capaDe._cont.classList.toggle('con-skin', !!k);
      capaDe._cont.classList.toggle('con-skin-anim', !!(k && k.tira));
      capaDe._cont.classList.toggle('reposo-anim', !!(sp && sp.reposo));
      capaDe._cont.classList.toggle('sprite-propio', propio);   // dibujo centrado en su celda (las capas del guerrero no)   // su reposo ya se mueve: sin la respiración del CSS
      if (k && k.img) capaDe._skin.src = k.img;
      capaDe._skinAnim.style.backgroundImage = k && k.tira ? `url(${k.tira})` : 'none';
      // tira larga: cada celda se muestra a 296 px de ancho (lo que avanza cada cuadro) y crece hacia arriba
      const alto = sp && sp.cuadros ? Math.round(296 * sp.celda[1] / sp.celda[0]) : 208;
      capaDe._skinAnim.style.backgroundSize = sp && sp.cuadros ? `${296 * sp.cuadros}px ${alto}px` : '4144px 208px';
      capaDe._skinAnim.style.top = `${208 - alto}px`;
      capaDe._skinAnim.style.transformOrigin = '50% 100%';
      capaDe._skinAnim.style.scale = escalaCuadro(0);
      const brilla = k && !propio && estrellasSkin(k.id) >= 5;   // ★5: brillo del color de la skin, como un buff
      capaDe._cont.classList.toggle('brillo-skin', !!brilla);
      capaDe._cont.style.setProperty('--brillo', brilla ? k.color : 'transparent');   // tira de 14 cuadros (sea de 185 o de 370 px), a la escala del guerrero
    }
  }
