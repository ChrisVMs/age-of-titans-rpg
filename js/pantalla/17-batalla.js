  // ---------------- Batalla (pantalla) ----------------
  const slots = [$('s1'), $('s2')];
  const arena = $('arena');
  const btn = $('btn'), btnAuto = $('btnAuto');
  // el ataque es solo un icono: su estado va en la etiqueta (accesibilidad / al mantener pulsado)
  const estadoAtaque = t => { btn.title = t; btn.setAttribute('aria-label', t); };
  $('btnHuir').onclick = () => $('huir').click();
  function ponerVelocidad(v) {
    VELOCIDAD = velElegida = v; document.documentElement.style.setProperty('--vel', v);
    $('btnVel').innerHTML = `⏩<small>x${v}</small>`; $('btnVel').title = `Velocidad x${v}`; $('btnVel').classList.toggle('activo', v > 1);
    try { localStorage.setItem('batalla.velocidad', v); } catch {}
  }
  $('btnVel').onclick = () => ponerVelocidad(VELOCIDADES[(VELOCIDADES.indexOf(VELOCIDAD) + 1) % VELOCIDADES.length]);
  try { const v = +localStorage.getItem('batalla.velocidad'); ponerVelocidad(VELOCIDADES.includes(v) ? v : 1); } catch { ponerVelocidad(1); }
  function ajustarEscala() {
    recorteAvance = SEPARACION - (parseFloat(getComputedStyle(arena).columnGap) || SEPARACION);
    const grande = batalla.enemigo && (batalla.enemigo.jefe || batalla.enemigo.cerbero || batalla.enemigo.asmodeo || batalla.enemigo.minotauro);   // los jefes ocupan más
    const alto = grande ? 470 : 270, ancho = (batalla.enemigo && batalla.enemigo.cerbero ? 1080 : grande ? 960 : 820) - recorteAvance;
    const esc = document.querySelector('.escena'), lienzo = document.body;   // medidas del lienzo (no de la ventana: puede estar ampliado)
    const hueco = esc && esc.clientHeight > 50 ? esc.clientHeight - 34 : lienzo.clientHeight - 220;   // 34: rótulo "Enemigo 1/3"
    const e = Math.min(1, (lienzo.clientWidth - 32) / ancho, hueco / alto);
    arena.style.transform = `scale(${e})`;
    arena.style.marginTop = `${-(1 - e) * 240 + (alto - 270) * e}px`;   // recupera el espacio que deja la escala
  }

  // muestra cuánto se curó alguien (guerrero o enemigo): número verde grande sobre su barra de vida
  function mostrarCura(slot, cantidad, icono = '') {
    fx(slot, 'num-cura', cantidad > 0 ? `${icono}+${cantidad} vida` : `${icono}vida llena`);
    slot.classList.remove('curado'); void slot.offsetWidth; slot.classList.add('curado');
    setTimeout(() => slot.classList.remove('curado'), 900);
  }
  function fx(slot, cls, text) {
    const e = document.createElement('div');
    e.className = 'fx ' + cls;
    e.textContent = text || '';
    e.style.left = (slot.offsetLeft + 40) + 'px';
    e.style.top = (slot.offsetTop + (cls === 'dano' || cls === 'num-cura' ? -10 : 40)) + 'px';
    arena.appendChild(e);
    setTimeout(() => e.remove(), 1500);
  }
  // Personajes animados cuadro a cuadro
  // escala(i): tamaño del cuadro i (tiras hechas con hojas de distinto tamaño); reposo(): [cuadro, ms] del reposo animado, si tiene
  const personajeClase = (el, clase) => personaje(el, 296, i => escalaCuadro(i, clase), () => reposoClase(clase));
  function personaje(slot, ancho, escala = () => 1, reposo = () => null) {
    const frames = slot.querySelector('.frames'), pj = slot.querySelector('.pj');
    let capas, cuadro = 0, base = 0;
    const skin = frames.querySelector('.skin');
    const ver = i => {
      cuadro = i; capas.forEach(c => { c.style.backgroundPositionX = (-i * ancho) + 'px'; c.style.scale = escala(i); });
      if (skin) skin.style.transform = 'translateX(-50%) ' + (POSE_SKIN[i] || '');   // la skin es fija: se inclina según el cuadro
    };
    capas = frames.querySelector('.capa') ? [...frames.querySelectorAll('.capa')] : [frames];
    ver(0);   // reposo: cuadro 0 fijo y la respiración del CSS, o el reposo animado de la clase
    let paso = 0;
    (function latido() {   // un cuadro del reposo cada vez, con su propia duración
      const r = reposo(); let ms = 250;
      if (r && base === 0 && !frames.classList.contains('quieto')) { const [c, d] = r[paso++ % r.length]; ver(c); ms = d; }
      setTimeout(latido, ms);
    })();
    // pasos: [cuadro, ms, avance(px) | undefined, accion?]; devuelve promesa que se cumple en el impacto
    return { ver, frames, setAncho: a => { ancho = a; }, setBase: b => { base = b; }, get base() { return base; }, async jugar(pasos) {
      frames.classList.add('quieto');
      let alImpacto;
      const impacto = new Promise(r => alImpacto = r);
      (async () => {
        for (const [c, ms, mov, accion] of pasos) {
          ver(c);
          if (mov !== undefined) pj.style.transform = mov ? `translateX(${avanceReal(mov)}px)` : '';
          if (accion) accion(alImpacto);
          await wait(ms);
        }
        ver(base); frames.classList.remove('quieto');
      })();
      return impacto;
    } };
  }
  const guerrero = personaje(slots[0], 296, i => escalaCuadro(i), () => reposoClase()), parca = personaje(slots[1], 260);
  const sonidoEspada = () => { const a = elegirSonido(espadas); a.currentTime = 0; a.play(); };
  const sonidoGuadana = () => { const a = elegirSonido(guadanas); a.currentTime = 0; a.play(); };
  // Música de batalla en bucle (solo durante la batalla)
  const musica = new Audio('audio/musica/battle.mp3');
  // Jefe mundial: música épica propia, mordiscos al azar y uno de los dos sonidos de lanzallamas
  const musicaEpica = new Audio('audio/musica/epic_battle.mp3');
  musicaEpica.loop = true; musicaEpica.volume = .4;
  const sonidoAzar = lista => () => { const a = elegirSonido(lista); a.currentTime = 0; a.play(); };
  const sonidoMordisco = sonidoAzar([1, 2, 3, 4].map(n => Object.assign(new Audio(`audio/cerbero/cerberus_atack${n}.mp3`), { preload: 'auto' })));
  // Asmodeo: gruñidos al atacar y sonido de curación, al azar
  const sonidoGruñido = sonidoAzar(['behemot_grunt', 'behemot_grunt2', 'behemot_grunt3', 'behemot_grunt4'].map(n => Object.assign(new Audio(`audio/asmodeo/${n}.mp3`), { preload: 'auto' })));
  const sonidoCuracion = sonidoAzar(['behemot_healing', 'behemot_healing2', 'behemot_healing3'].map(n => Object.assign(new Audio(`audio/asmodeo/${n}.mp3`), { preload: 'auto' })));
  const sonidoMinotauro = sonidoAzar(['minotaur', 'minotaur2', 'minotaur3', 'minotaur4'].map(n => Object.assign(new Audio(`audio/minotauro/${n}.mp3`), { preload: 'auto' })));
  const sonidoEspadaMinotauro = sonidoAzar(['minotaur_sword', 'minotaur_sword2', 'minotaur_sword3', 'minotaur_sword4'].map(n => Object.assign(new Audio(`audio/minotauro/${n}.mp3`), { preload: 'auto' })));
  const sonidoLlamas = sonidoAzar(['flame_cerberus', 'flame_cerberus2'].map(n => Object.assign(new Audio(`audio/cerbero/${n}.mp3`), { preload: 'auto' })));
  musica.loop = true; musica.volume = .35;
  // Sonido sí/no (botón 🔊 en el Campamento y en la batalla; se recuerda): todo sonido pasa por play(), que lo silencia
  let silencio = false; try { silencio = localStorage.getItem('batalla.silencio') === '1'; } catch {}
  if (typeof HTMLMediaElement !== 'undefined') {   // (sin navegador, en las pruebas, no existe)
    const playOriginal = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { this.muted = silencio; return playOriginal.call(this); };
  }
  function ponerSilencio(v) {
    silencio = v; musica.muted = musicaEpica.muted = v;
    document.querySelectorAll('.btn-sonido').forEach(b => { b.textContent = v ? '🔇' : '🔊'; b.title = v ? 'Activar sonido' : 'Silenciar'; });
    try { localStorage.setItem('batalla.silencio', v ? '1' : '0'); } catch {}
  }
  document.querySelectorAll('.btn-sonido').forEach(b => b.onclick = () => ponerSilencio(!silencio));
  ponerSilencio(silencio);
  addEventListener('resize', () => batalla.campana && batalla.campana.grupo ? ajustarGrupo() : ajustarEscala());
  // Sonidos reales de espada (separados de sword.mp3); el guerrero usa uno al azar
  const espadas = ['warrior_slash', 'warrior_slash2', 'warrior_slash3', 'warrior_slash4'].map(n => { const a = new Audio(`audio/guerrero/${n}.mp3`); a.preload = 'auto'; return a; });
  // Sonidos de guadaña para la parca, también al azar
  const guadanas = ['schyte', 'schyte2', 'schyte3'].map(n => { const a = new Audio(`audio/parca/${n}.mp3`); a.preload = 'auto'; return a; });
