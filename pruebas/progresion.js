// Simula partidas nuevas con simularProgresion, sin navegador y en paralelo (un hilo por núcleo).
// Uso: node pruebas/progresion.js [configuraciones.json]
//   cada configuración: { "nombre": "...", "dias": 90, "semilla": 1, "estaminaExtra": 0, "ajustes": { "XP_BARRIDO": 0.5 } }
//   sin archivo: 90 días con las semillas 1, 2 y 3 y los valores actuales del juego.
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads'), os = require('os'), fs = require('fs');
const resumen = `(r => { const H = r.hitos, f = o => Object.entries(o).map(([k, d]) => k + ':' + d).join(' ');
  return { nivel: [30, 50, 60, 70, 80].map(n => n + ':' + (H.nivel[n] || '-')).join(' '), jefes: f(H.jefes), reyes: f(H.reyes),
    torre: f(Object.fromEntries(Object.entries(H.torre).filter(([p]) => p % 20 === 0))), calabozos: Object.keys(H.calabozo).length,
    campana: [1, 2, 3].map(e => e + ':' + ORDEN_DIF.map(d => H.campana[e + '-10 ' + d] || '-').join('/')).join(' '),
    final: 'Nv ' + r.final.nivel + ' · poder ' + r.final.poder + ' · piso ' + r.final.torre + ' · aura ' + r.final.aura }; })`;

if (isMainThread) {
  const confs = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : [1, 2, 3].map(semilla => ({ nombre: 'semilla ' + semilla, dias: 90, semilla }));
  const cola = [...confs], t0 = Date.now();
  const hilo = () => new Promise(fin => { const sig = () => { const c = cola.shift(); if (!c) return fin();
    const w = new Worker(__filename, { workerData: c }), t = Date.now();
    w.on('message', r => console.log(JSON.stringify({ nombre: c.nombre, s: Math.round((Date.now() - t) / 1000), ...r })));
    w.on('error', e => console.log(JSON.stringify({ nombre: c.nombre, error: e.message })));
    w.on('exit', sig); }; sig(); });
  Promise.all(Array.from({ length: Math.min(os.cpus().length, confs.length) }, hilo)).then(() => console.error(`total: ${Math.round((Date.now() - t0) / 1000)} s`));
} else {
  const c = workerData, juego = require('./cargar')();
  for (const [k, v] of Object.entries(c.ajustes || {})) juego.correr(`${k} = ${JSON.stringify(v)}`);
  if (c.ajustes && c.ajustes.ESCALA_ETAPA) juego.correr('armarCampanas()');
  parentPort.postMessage(juego.correr(`${resumen}(simularProgresion(${JSON.stringify({ dias: c.dias || 90, semilla: c.semilla || 1, estaminaExtra: c.estaminaExtra || 0, grupo: c.grupo || 3 })}))`));
}
