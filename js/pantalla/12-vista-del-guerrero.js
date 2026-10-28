  // ---------------- Vista del guerrero (pantalla) ----------------
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
    const k = skinActual();
    {
      capaDe._cont.classList.toggle('con-skin', !!k);
      capaDe._cont.classList.toggle('con-skin-anim', !!(k && k.tira));
      if (k) capaDe._skin.src = k.img;
      capaDe._skinAnim.style.backgroundImage = k && k.tira ? `url(${k.tira})` : 'none';
      capaDe._skinAnim.style.backgroundSize = '4144px 208px';
      const brilla = k && estrellasSkin(k.id) >= 5;   // ★5: brillo del color de la skin, como un buff
      capaDe._cont.classList.toggle('brillo-skin', !!brilla);
      capaDe._cont.style.setProperty('--brillo', brilla ? k.color : 'transparent');   // tira de 14 cuadros (sea de 185 o de 370 px), a la escala del guerrero
    }
  }
