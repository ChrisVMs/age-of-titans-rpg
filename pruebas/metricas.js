// Métricas de progresión comparables entre versiones: simula partidas nuevas (sin navegador, un hilo por semilla) y
// da la mediana de nivel, poder, Torre, oro y aura en días clave, y el oro de cada fuente. Compara con pruebas/referencia.json
// y señala lo que se movió más de lo tolerado y las fuentes de oro que dominan la economía.
// Uso: node pruebas/metricas.js [--dias=90] [--semillas=1,...,8] [--tipo=casual] [--guardar-referencia]
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs'), path = require('path'), os = require('os');

const DIAS_CLAVE = [7, 30, 60, 90, 180];
const CAMPOS = ['nivel', 'poder', 'torre', 'oro', 'aura'];
const TOLERANCIA = 0.10;        // cambio relativo a partir del cual se marca una métrica (±10 %)
const FUENTE_DOMINANTE = 0.5;   // una fuente que da más de la mitad del oro ganado se señala
const REFERENCIA = path.join(__dirname, 'referencia.json');

if (!isMainThread) {
  const { dias, semilla, tipo } = workerData, juego = require('./cargar')();
  const r = juego.correr(`JSON.stringify((r => ({ dia: r.dia, fuentes: r.fuentes }))(simularProgresion(${JSON.stringify({ dias, semilla, tipo })})))`);
  parentPort.postMessage(JSON.parse(r));
  return;
}

const opcion = (n, def) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : def; };
const promedio = l => l.reduce((a, b) => a + b, 0) / l.length;
// mediana: una semilla que entra en bola de nieve (el simulador es muy sensible al azar) no arrastra el resultado
const mediana = l => { const o = [...l].sort((a, b) => a - b), m = o.length >> 1; return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2; };

// Simula y resume: { config, dias: { 30: { nivel, ... } }, oroFuentes: { fuente: oro medio } }
async function medir({ dias = 90, semillas = [1, 2, 3, 4], tipo = null } = {}) {
  const pendientes = [...semillas], partidas = [];
  const hilo = () => new Promise((ok, mal) => {
    const s = pendientes.shift(); if (s == null) return ok();
    const w = new Worker(__filename, { workerData: { dias, semilla: s, tipo } });
    w.on('message', r => partidas.push(r)); w.on('error', mal); w.on('exit', () => hilo().then(ok, mal));
  });
  await Promise.all(Array.from({ length: Math.min(os.cpus().length, semillas.length) }, hilo));
  const res = { config: { dias, semillas, tipo, medida: 'mediana' }, dias: {}, oroFuentes: {} };
  for (const d of DIAS_CLAVE.filter(d => d <= dias)) {
    res.dias[d] = {};
    for (const c of CAMPOS) res.dias[d][c] = Math.round(mediana(partidas.map(p => p.dia[d - 1][c])));
  }
  const fuentes = new Set(partidas.flatMap(p => Object.keys(p.fuentes)));
  for (const f of fuentes) res.oroFuentes[f] = Math.round(promedio(partidas.map(p => (p.fuentes[f] || {}).oro || 0)));
  return res;
}

// Texto del informe; con referencia, la columna anterior, el cambio y ⚠ si pasa la tolerancia. Devuelve { texto, avisos }
function informe(nuevo, ref) {
  const L = [], avisos = [], misma = ref && JSON.stringify(ref.config) === JSON.stringify(nuevo.config);
  const n = v => v == null ? '—' : v.toLocaleString('es');
  const fila = (nombre, a, b) => {
    const cambio = a != null && b != null && a !== 0 ? (b - a) / Math.abs(a) : null, fuera = cambio != null && Math.abs(cambio) > TOLERANCIA;
    if (fuera) avisos.push(`${nombre}: ${n(a)} → ${n(b)}`);
    L.push(`  ${nombre.padEnd(26)} ${misma ? n(a).padStart(12) : ''} ${n(b).padStart(12)} ${cambio == null || !misma ? '' : `${cambio >= 0 ? '+' : ''}${(cambio * 100).toFixed(1)} %`}${fuera ? ' ⚠' : ''}`);
  };
  L.push(`Progresión · ${nuevo.config.dias} días · semillas ${nuevo.config.semillas.join(',')}${nuevo.config.tipo ? ' · ' + nuevo.config.tipo : ''} (medianas)`);
  if (ref && !misma) L.push('  (la referencia es de otra configuración: no se compara)');
  L.push(`  ${''.padEnd(26)} ${misma ? 'referencia'.padStart(12) : ''} ${'ahora'.padStart(12)}`);
  for (const d of Object.keys(nuevo.dias)) for (const c of CAMPOS) fila(`día ${d} · ${c}`, misma ? ref.dias[d]?.[c] : null, nuevo.dias[d][c]);
  L.push('  Oro ganado por fuente:');
  const total = Object.values(nuevo.oroFuentes).reduce((a, b) => a + b, 0);
  for (const [f, v] of Object.entries(nuevo.oroFuentes).sort((a, b) => b[1] - a[1])) {
    fila(`  ${f} (${Math.round(v / total * 100)} %)`, misma ? ref.oroFuentes[f] : null, v);
    if (v / total > FUENTE_DOMINANTE) avisos.push(`fuente dominante: ${f} da el ${Math.round(v / total * 100)} % del oro`);
  }
  return { texto: L.join('\n'), avisos };
}

module.exports = { medir, informe, REFERENCIA };

if (require.main === module) (async () => {
  const conf = { dias: +opcion('dias', 90), semillas: opcion('semillas', '1,2,3,4,5,6,7,8').split(',').map(Number), tipo: opcion('tipo', null) };
  const t0 = Date.now(), r = await medir(conf), ref = fs.existsSync(REFERENCIA) ? JSON.parse(fs.readFileSync(REFERENCIA, 'utf8')) : null;
  const { texto, avisos } = informe(r, ref);
  console.log(texto);
  for (const a of avisos) console.log('⚠', a);
  if (process.argv.includes('--guardar-referencia')) { fs.writeFileSync(REFERENCIA, JSON.stringify(r, null, 1) + '\n'); console.log('Referencia guardada en pruebas/referencia.json'); }
  console.log(`en ${Math.round((Date.now() - t0) / 1000)} s`);
})();
