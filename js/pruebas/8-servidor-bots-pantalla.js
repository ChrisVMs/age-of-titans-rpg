  // ---------------- Servidor de bots: hilos, guardado y estado (solo pruebas) ----------------
  // Arranca solo en modo pruebas. Cada bot guarda su partida (IndexedDB) y cuántos días lleva; al cambiar el día del juego
  // (reloj o "Día +") se simulan solo los días que faltan, en varios hilos (uno por núcleo, hasta 4), pausando mientras
  // estás en batalla. Sin hilos (abriendo el archivo directamente) se hace en el hilo principal, de a un bot y día.
  // Los bots que ya empezaron sustituyen a los del ranking (cacheBots), que usan arena, Ecos, reyes y aliados.
  const DIA_MS = 864e5, DIAS_POR_ENVIO = 3;
  const VERSION_SERVIDOR = 3;   // si cambian las reglas de los bots, el servidor guardado se rehace solo (2: sin ventajas de inicio; 3: tipos de jugador)
  const servidor = { meta: null, plan: [], estado: {}, cola: [], hilos: [], libres: [], ocupados: 0, sinHilos: false, error: null };
  const medianoche = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const diaServidor = () => Math.round((medianoche(ahoraJuego().getTime()) - servidor.meta.inicio) / DIA_MS);
  // offsetDias con el que el primer día pendiente del bot cae en su fecha del servidor
  const offsetBot = (b, hechos) => Math.round((servidor.meta.inicio + (b.inicio + hechos) * DIA_MS - medianoche(Date.now())) / DIA_MS);
  // ---- guardado (IndexedDB: cada bot por separado; 99 partidas no caben en localStorage) ----
  let dbServidor = null;
  const abrirDB = () => new Promise((ok, mal) => { const r = indexedDB.open('batalla-servidor', 1); r.onupgradeneeded = () => r.result.createObjectStore('datos'); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });
  const leerDB = k => new Promise(ok => { const r = dbServidor.transaction('datos').objectStore('datos').get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ok(undefined); });
  const escribirDB = (k, v) => new Promise(ok => { const t = dbServidor.transaction('datos', 'readwrite'); t.objectStore('datos').put(v, k); t.oncomplete = ok; t.onerror = ok; });
  const borrarDB = () => new Promise(ok => { const t = dbServidor.transaction('datos', 'readwrite'); t.objectStore('datos').clear(); t.oncomplete = ok; t.onerror = ok; });
  // ---- los bots que ya empezaron pasan al ranking ----
  function publicarBots() {
    const lista = servidor.plan.map(b => servidor.estado[b.id]).filter(e => e && e.hechos > 0 && e.perfil).map(e => e.perfil);
    if (lista.length) cacheBots = lista;
  }
  // ---- trabajo: cola de bots con días pendientes; los más atrasados primero ----
  function llenarCola() {
    const D = diaServidor();
    servidor.cola = servidor.plan.filter(b => !servidor.enCurso?.has(b.id) && diasPendientesBot(b, (servidor.estado[b.id] || {}).hechos || 0, D) > 0)
      .sort((a, b) => ((servidor.estado[a.id] || {}).hechos || 0) - ((servidor.estado[b.id] || {}).hechos || 0));
  }
  function encargo(b) {
    const e = servidor.estado[b.id] || { hechos: 0, perfil: null }, D = diaServidor();
    return { b, perfil: e.perfil, hechos: e.hechos, dias: Math.min(DIAS_POR_ENVIO, diasPendientesBot(b, e.hechos, D)), offset: offsetBot(b, e.hechos) };
  }
  async function terminado({ id, perfil, hechos }) {
    servidor.enCurso.delete(id);
    servidor.estado[id] = { perfil, hechos }; await escribirDB('bot:' + id, servidor.estado[id]);
    publicarBots(); pintarEstadoServidor();
  }
  function repartir() {
    if (ui.enBatalla()) return setTimeout(repartir, 3000);   // no quitarle fluidez a tu batalla
    if (!servidor.cola.length) llenarCola();
    if (servidor.sinHilos) {   // sin hilos: un bot y un día cada vez, en ratos libres
      const b = servidor.cola.shift(); if (!b) return;
      const t = { ...encargo(b), dias: 1 }; servidor.enCurso.add(b.id);
      setTimeout(async () => { await terminado({ id: b.id, perfil: avanzarBot(t.b, t.perfil, t.hechos, 1, t.offset), hechos: t.hechos + 1 }); repartir(); }, 300);
      return;
    }
    while (servidor.libres.length && servidor.cola.length) {
      const h = servidor.libres.pop(), b = servidor.cola.shift(); servidor.enCurso.add(b.id); h.postMessage(encargo(b));
    }
  }
  async function crearHilos() {
    const orden = await (await fetch('js/orden.json')).json();
    const archivos = [...orden.juego, ...orden.pruebas].filter(f => f.startsWith('js/logica/') || /^js\/pruebas\/[1-4]-/.test(f));
    const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
    for (let i = 0; i < n; i++) await new Promise((ok, mal) => {
      const h = new Worker('js/pruebas/servidor-hilo.js');
      h.onmessage = e => {
        if (e.data.listo) { servidor.libres.push(h); return ok(); }
        if (e.data.error) { servidor.error = e.data.error; console.warn('Servidor de bots:', e.data.error); servidor.enCurso.delete(e.data.id); }
        else terminado(e.data);
        servidor.libres.push(h); repartir();
      };
      h.onerror = ev => mal(ev.message || 'hilo');
      h.postMessage({ archivos }); servidor.hilos.push(h);
    });
  }
  async function iniciarServidor() {
    if (!MODO_PRUEBAS || typeof indexedDB === 'undefined') return;
    servidor.enCurso = new Set();
    try { dbServidor = await abrirDB(); } catch { return; }
    servidor.meta = await leerDB('meta');
    if (servidor.meta && servidor.meta.version !== VERSION_SERVIDOR) { await borrarDB(); servidor.meta = null; }
    if (!servidor.meta) { servidor.meta = { inicio: medianoche(ahoraJuego().getTime()), semilla: 1, version: VERSION_SERVIDOR }; await escribirDB('meta', servidor.meta); }
    servidor.plan = planServidor(BOTS_SERVIDOR, servidor.meta.semilla);
    for (const b of servidor.plan) { const e = await leerDB('bot:' + b.id); if (e) servidor.estado[b.id] = e; }
    publicarBots();
    try { await crearHilos(); } catch (err) { servidor.sinHilos = true; console.info('Servidor de bots sin hilos (archivo local):', err); }
    repartir(); pintarEstadoServidor();
    setInterval(() => { llenarCola(); repartir(); }, 60000);   // el día puede cambiar con el reloj
  }
  async function reiniciarServidor() {
    if (!await confirmar('¿Reiniciar el servidor? Los 99 bots empiezan de cero desde hoy.')) return;
    for (const h of servidor.hilos) h.terminate();
    Object.assign(servidor, { estado: {}, cola: [], hilos: [], libres: [] }); servidor.enCurso = new Set();
    await borrarDB(); cacheBots = null;
    servidor.meta = null; dbServidor.close(); dbServidor = null; await iniciarServidor();
  }
  // ---- estado en el menú de pruebas ----
  function textoServidor() {
    if (!servidor.meta) return '🌐 Servidor de bots: iniciando…';
    const D = diaServidor(), activos = servidor.plan.filter(b => b.inicio <= D).length;
    const faltan = servidor.plan.reduce((s, b) => s + diasPendientesBot(b, (servidor.estado[b.id] || {}).hechos || 0, D), 0);
    return `🌐 Servidor día ${D + 1} · ${activos}/${BOTS_SERVIDOR} bots · ${faltan ? `simulando (${faltan} días de bot por hacer${servidor.sinHilos ? ', sin hilos' : ''})` : 'al día'}`;
  }
  function pintarEstadoServidor() {
    let el = document.getElementById('servidorEstado');
    if (!el) {
      const grupo = document.querySelector('#pruebasMenu .pruebas-grupo:nth-of-type(2)'); if (!grupo) return;
      el = document.createElement('div'); el.className = 'prueba-check'; el.id = 'servidorEstado'; grupo.after(el);
      el.addEventListener('click', e => { if (e.target.closest('#reiniciarServidor')) reiniciarServidor(); });
    }
    el.innerHTML = `<small>${textoServidor()}</small><button class="prueba" id="reiniciarServidor">Reiniciar servidor</button>`;
  }
  iniciarServidor();
