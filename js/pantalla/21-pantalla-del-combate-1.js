  // ---------------- Pantalla del combate 1 contra 1: dibuja los eventos del motor (pantalla) ----------------
  async function reproducir(lista) {
    const id = batalla.id, regresos = new Map();   // regresos: quién tiene que volver a su casilla tras atacar (en grupo)
    const demorar = (f, retraso) => retraso ? setTimeout(f, retraso) : f();
    for (const [tipo, ...a] of lista) {
      if (batalla.id !== id) return;   // ya se está en otra batalla: lo que quedaba no se dibuja
      if (tipo === 'vidaU') { const [u, actual, max, retraso] = a; demorar(() => pintarVida(u.el, actual, max), retraso); }
      else if (tipo === 'fxU') { const [u, cls, texto, dy, retraso] = a; demorar(() => u.duelo ? fx(u.el, cls, texto) : fxU(u, cls, texto, dy), retraso); }
      else if (tipo === 'curaU') { const [u, c, icono, retraso] = a; demorar(() => u.duelo ? mostrarCura(u.el, c, icono) : fxU(u, 'num-cura', `${icono}+${c}`), retraso); }
      else if (tipo === 'estadosU') pintarEstadosU(a[0], a[1]);
      else if (tipo === 'claseU') a[0].el.classList.toggle(a[1], a[2]);
      else if (tipo === 'espera') await wait(a[0]);
      else if (tipo === 'estadoAtaque') estadoAtaque(a[0]);
      else if (tipo === 'carga') pintarEspecial();
      else if (tipo === 'animHeroe') { const [u, t, hab] = a; if (u.duelo) await animarAtaque(0, hab); else regresos.set(u, await animHeroe(u, t, hab)); }
      else if (tipo === 'animEnemigo') { const [u, t, ataque] = a; if (u.duelo) await animarAtaque(1, ataque); else regresos.set(u, await animEnemigo(u, t)); }
      else if (tipo === 'volver') { const r = regresos.get(a[0]); regresos.delete(a[0]); if (r) await r(); }
      else if (tipo === 'golpe') await dibujarGolpe(...a);
      else if (tipo === 'marcar') marcarObjetivo(a[0]);
      else if (tipo === 'muerteU') { const [u, jefe] = a; if (!u.duelo) { await caeU(u); u.el.classList.add('muerto'); if (u.yo) pintarEspecial(); } else if (!u.heroe) await animarMuerte(jefe); else await caeHeroe(); }
      else if (tipo === 'mascota') { if (a[0].duelo) $('acompana').style.transform = a[1] ? `translateX(${avanceReal(420)}px) scale(1.2)` : ''; }
      else if (tipo === 'transformar') await animarTransformacion();
      else if (tipo === 'siguiente') await mostrarEnemigo();
      else if (tipo === 'resultado') mostrarResultado(a[0]);
    }
  }
  // el golpe: en 1 contra 1, la animación de impacto; en grupo, la sacudida del objetivo y el número
  async function dibujarGolpe(u, t, hab, critico, dano, jefe) {
    const fuerte = !!hab || critico, cls = fuerte ? 'dano critico' : 'dano';
    if (t.duelo) return animarGolpe(u.heroe ? 0 : 1, !!hab, jefe, cls, (fuerte ? '¡' : '-') + dano + (critico ? ' CRÍTICO!' : hab ? '!' : ''));
    golpeVisual(t); retrocedeU(t); fxU(t, cls, `${hab ? hab.icono + ' ' : ''}-${dano}${critico ? ' CRÍTICO' : ''}`);
  }
  async function animarAtaque(turno, x) {   // x: la habilidad del guerrero, o lo que decidió hacer el enemigo
    slots[turno].style.zIndex = 3; slots[1 - turno].style.zIndex = '';   // quien ataca, delante
    await (turno === 0 ? (x ? ANIM_HAB[x.animacion]() : ataques[0]()) : ataques[1](x));
  }
  async function animarGolpe(turno, especial, jefe, cls, texto) {
    const d = slots[1 - turno];
    d.classList.add('golpeado');
    arena.classList.add('tiembla');
    if (turno === 0 && jefe.minotauro) {
      parca.frames.classList.add('quieto');
      const pasos = especial ? [[13, 0], [14, 90], [15, 180], [15, 380], [14, 470], [13, 560]] : [[13, 0], [14, 120], [14, 360], [13, 470]];
      pasos.forEach(([c, t]) => setTimeout(() => parca.ver(c), t / VELOCIDAD));
    }
    if (turno === 0 && jefe.asmodeo) { parca.frames.classList.add('quieto'); parca.ver(especial ? 14 : 13); }   // daño, o retroceso si es una habilidad
    else if (turno === 0 && !jefe.cerbero) { parca.frames.classList.add('quieto'); parca.ver(5); setTimeout(() => parca.ver(6), 250); }
    if (turno === 1) retrocedeHeroe();
    fx(d, cls, texto);
    await wait(650);
    arena.classList.remove('tiembla');
    await wait(150);
    d.classList.remove('golpeado');
    if (turno === 0 && !jefe.cerbero) { parca.ver(0); parca.frames.classList.remove('quieto'); }
    await wait(250);
  }
  async function animarMuerte(jefe) {
    if (jefe.cerbero) await muerteCerbero();
    else if (jefe.asmodeo) await muerteAsmodeo();
    else if (jefe.minotauro) await muerteMinotauro();
    slots[1].classList.add('muerto');
    await wait(900);
  }
  // Durante la ronda (tu ataque y la respuesta del rival) no se puede huir: la ronda pendiente seguiría corriendo
  // sobre la batalla siguiente si se empezara otra enseguida.
  function marcarRonda(v) { enRonda = v; $('huir').disabled = $('btnHuir').disabled = v; }
  async function ronda(hab) {
    if (batalla.terminada || !batalla.grupo) return;
    pararCuentaTurno();
    marcarRonda(true); btn.disabled = true;
    await reproducir(resolverRonda(hab));
    estadoAtaque('Atacar'); btn.disabled = auto || batalla.terminada; marcarRonda(false); pintarEspecial(); iniciarCuentaTurno();   // en grupo, si caíste, tus aliados siguen: Atacar hace avanzar la ronda
  }
  btn.onclick = () => ronda(null);

  // Autoataque: encadena rondas hasta que se desactive o termine la batalla
  btnAuto.onclick = async () => {
    auto = !auto;
    btnAuto.title = auto ? 'Autoataque: ON' : 'Autoataque: OFF';
    btnAuto.classList.toggle('activo', auto);
    btn.disabled = auto || enRonda || batalla.terminada;
    pintarEspecial();
    if (!auto || bucle) return;
    bucle = true;
    while (enRonda) await wait(100);          // si había una ronda manual en curso, espera a que termine
    while (auto && !batalla.terminada) { await ronda(habLista()); if (auto) await wait(500); }
    bucle = false;
    btn.disabled = batalla.terminada;
    if (batalla.campana && batalla.campana.grupo) iniciarCuentaTurno();   // sin autoataque vuelve la cuenta de 10 s del multijugador
  };
