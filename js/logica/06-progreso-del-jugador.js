  // ---------------- Progreso del jugador (se guarda en el navegador) ----------------
  const CLAVE = 'batalla.partida.v3' + (pruebasGesto ? '.pruebas' : '');   // v3: objetos con líneas, estrellas y encantamiento
  const ORO_INICIAL = MODO_PRUEBAS ? 10000 : 3000;   // da para abrir los primeros cofres y pasar el bache de 1-4
  const ESTAMINA_MAX = 150, ESTAMINA_CAMPANA = 10;   // se recarga entera cada día
  const MAT_INICIAL = MODO_PRUEBAS ? { piedra: 300, polvo: 100, almas: 50, esencia: 50 } : { piedra: 20, polvo: 5, almas: 0, esencia: 0 };
  let jugador, titulosListos = false;   // titulosListos: hasta que se definan los títulos, guardar no los revisa
  function partidaNueva() {
    const basicos = ['casco_hierro', 'arm_hierro', 'esp_acero', 'capa_roja'].map(id => crearObjeto(id, true));
    return { nivel: 1, xp: 0, oro: ORO_INICIAL, mat: { ...MAT_INICIAL }, estamina: ESTAMINA_MAX, diaEstamina: hoy(), sigUid, objetos: basicos,
             equipado: Object.fromEntries(basicos.map(o => [modelo[o.modelo].ranura, o.uid])) };
  }
  function cargar() {
    try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.objetos) { jugador = g; sigUid = g.sigUid; return; } } catch {}
    jugador = partidaNueva();
  }
  // Una sola pestaña a la vez: la que se abre avisa por un canal compartido; si ya había otra, esta queda bloqueada
  // (sin guardar nada) hasta que el jugador elige "Jugar aquí", que bloquea la otra y recarga esta con la partida al día.
  let pestanaBloqueada = false;
  const idPestana = Math.random().toString(36).slice(2);
  const canalPestanas = 'BroadcastChannel' in window ? new BroadcastChannel('batalla-pestanas') : null;
  function guardar() {
    if (pestanaBloqueada || simulando) return;   // la pestaña duplicada nunca escribe la partida
    jugador.sigUid = sigUid; jugador.version = VERSION_JUEGO;   // la partida recuerda con qué versión se guardó (para migraciones)
    if (titulosListos) revisarTitulos();
    try { localStorage.setItem(CLAVE, JSON.stringify(jugador)); }
    catch { if (!guardar.aviso) { guardar.aviso = true; setTimeout(() => ui.avisar('⚠ No se pudo guardar la partida: almacenamiento lleno'), 0); } }
  }
  // Fecha local: al cambiar de día la estamina vuelve al máximo
  // Fecha del juego. En modo pruebas, el botón "Día X +" adelanta días (offset guardado aparte de la partida) para probar
  // reinicios diarios y semanales: misiones, login, estamina, entradas, eventos…
  const DIA_PRUEBA = 'batalla.diaPrueba';
  let offsetDias = 0; try { offsetDias = MODO_PRUEBAS ? +localStorage.getItem(DIA_PRUEBA) || 0 : 0; } catch {}
  const ahoraJuego = () => new Date(Date.now() + offsetDias * 86400000);
  function hoy() { const d = ahoraJuego(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function revisarEstamina() {
    const ahora = Date.now();
    if (jugador.vistoMax && ahora < jugador.vistoMax - 10 * 60 * 1000) return;   // reloj atrasado: no recarga (adelantarlo solo se evita con servidor)
    jugador.vistoMax = Math.max(jugador.vistoMax || 0, ahora);
    if (jugador.diaEstamina !== hoy()) { jugador.estamina = ESTAMINA_MAX; jugador.diaEstamina = hoy(); guardar(); }
  }
  cargar();
  jugador.mat.almas ||= 0; jugador.mat.esencia ||= 0;   // partidas anteriores al Polvo de almas y a la Esencia
  revisarEstamina();
  const objeto = uid => jugador.objetos.find(o => o.uid === uid);

  // Nivel y experiencia
  // Curva: rápida hasta el 30 (desbloqueos y primera semana); desde ahí ×CURVA_XP por nivel para que el nivel siga siendo un
  // objetivo durante meses. Con 1,07 bastaba antes de las etapas 2-3 (2026-10-28); con ellas el Nv 80 llegaba hacia el día
  // 40. Con 1,091 y XP_BARRIDO .2, simulado con anuncios (300 de estamina al día): Nv 80 entre los días 100 y 125 (2026-10-29).
  let CURVA_XP = 1.091;   // crecimiento por nivel desde el 30 (let: el simulador de progresión prueba otros valores)
  const xpParaSubir = n => Math.round(60 * Math.pow(n, 1.5) * (n > 30 ? CURVA_XP ** (n - 30) : 1));
  const NIVEL_MAX = 80;   // al llegar, la experiencia deja de acumularse
  jugador.nivel = Math.min(jugador.nivel, NIVEL_MAX);
  function ganar(oro, xp, mat = {}) {
    jugador.oro += oro; jugador.xp += xp;
    for (const k in mat) jugador.mat[k] += mat[k];
    while (jugador.nivel < NIVEL_MAX && jugador.xp >= xpParaSubir(jugador.nivel)) {
      jugador.xp -= xpParaSubir(jugador.nivel); jugador.nivel++;
      ui.avisar(`¡Nivel ${jugador.nivel}!${jugador.nivel % 2 === 0 ? ' +1 punto de habilidad' : ''}`);
      const nuevos = [...new Set(Object.values(DESBLOQUEOS).filter(([n]) => n === jugador.nivel).map(([, t]) => t))];
      if (nuevos.length) setTimeout(() => ui.mensaje(`🔓 ¡Nuevo desbloqueado!
${nuevos.join(' · ')}`), 1200);
    }
    if (jugador.nivel >= NIVEL_MAX) jugador.xp = 0;
    guardar(); ui.pintarHud();
  }
  // Contadores de logros (para los títulos)
  function sumarLogro(k, n = 1) { jugador.logros ||= {}; jugador.logros[k] = (jugador.logros[k] || 0) + n; }
