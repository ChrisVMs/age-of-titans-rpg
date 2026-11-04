// Economía: entradas y salidas de cada recurso por periodo y tipo de jugador, sin navegador (un hilo por partida).
// Cada cambio de oro, cristales, estamina o un material se anota con la función del juego que lo hizo (entrada si sube,
// salida si baja), así que no hace falta tocar el juego para medir algo nuevo: basta con que pase por la partida.
// Uso: node pruebas/economia.js [--dias=180] [--tipos=casual,constante,pago] [--semillas=1,2] [--detalle]
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

const PERIODOS = [[1, 7], [8, 30], [31, 60], [61, 90], [91, 180]];
const ACUMULA = 3;   // se señala un recurso cuyo saldo de un periodo es más de ACUMULA veces lo que se gastó en él
const ATASCO = .05;  // y uno del que casi no entra nada (menos del 5 % de lo que se gasta) mientras se gasta: bloquea

// Código dentro del juego: convierte los recursos de la partida en propiedades que anotan cada cambio
const EN_JUEGO = `
  globalThis.__flujo = {};   // flujo[dia][recurso][entrada|salida][función] = cantidad
  globalThis.__dia = 1;
  const NO_CUENTA = /^(set|get|ganar|darPremio|pagar|Object\\.|Array\\.|aislado|medir|__|eval|<anonymous>)/;
  const quien = () => { for (const l of new Error().stack.split('\\n').slice(3)) {
    const m = l.trim().match(/^at (?:Object\\.)?([\\w$.]+) /); if (m && !NO_CUENTA.test(m[1])) return m[1]; } return '(simulador)'; };
  const anotar = (rec, d) => { if (!d) return; const F = ((__flujo[__dia] ||= {})[rec] ||= { entrada: {}, salida: {} })[d > 0 ? 'entrada' : 'salida'], k = quien();
    F[k] = (F[k] || 0) + Math.abs(d); };
  const vigilar = (obj, k, rec) => { let v = obj[k] || 0;
    Object.defineProperty(obj, k, { enumerable: true, configurable: true, get: () => v, set: n => { anotar(rec, n - v); v = n; } }); };
  globalThis.__instalado = null;
  const rd = revisarDia;
  revisarDia = function () {   // primera cosa de cada día del simulador: vigila la partida (una vez por partida)
    if (__instalado !== jugador) { __instalado = jugador;
      for (const k of ['oro', 'cristales', 'estamina']) vigilar(jugador, k, k);
      for (const k of Object.keys(jugador.mat)) vigilar(jugador.mat, k, k); }
    return rd.apply(this, arguments);
  };`;

if (!isMainThread) {
  const { dias, semilla, tipo } = workerData, juego = require('./cargar')();
  juego.correr(EN_JUEGO);
  const r = juego.correr(`(() => { const r = simularProgresion({ dias: ${dias}, semilla: ${semilla}, tipo: ${JSON.stringify(tipo)}, alDia: d => { __dia = d + 1; } });
    return JSON.stringify({ flujo: __flujo, fin: r.dia.map(x => ({ nivel: x.nivel, oro: x.oro })) }); })()`);
  parentPort.postMessage({ ...workerData, ...JSON.parse(r) });
  return;
}

const opcion = (n, def) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : def; };
const corto = n => { const a = Math.abs(n); return (a >= 1e6 ? (n / 1e6).toFixed(1) + ' M' : a >= 1e4 ? Math.round(n / 1e3) + ' k' : String(Math.round(n))); };

async function enHilos(tareas) {
  const pend = [...tareas], res = [];
  const hilo = () => new Promise((ok, mal) => { const t = pend.shift(); if (!t) return ok();
    const w = new Worker(__filename, { workerData: t }); w.on('message', r => res.push(r)); w.on('error', mal); w.on('exit', () => hilo().then(ok, mal)); });
  await Promise.all(Array.from({ length: Math.min(os.cpus().length, tareas.length) }, hilo));
  return res;
}

(async () => {
  const t0 = Date.now(), dias = +opcion('dias', 180), tipos = opcion('tipos', 'casual,constante,pago').split(','), semillas = opcion('semillas', '1,2').split(',').map(Number);
  const detalle = process.argv.includes('--detalle'), avisos = [];
  const R = await enHilos(tipos.flatMap(tipo => semillas.map(semilla => ({ dias, semilla, tipo }))));
  console.log(`Economía · ${dias} días · semillas ${semillas.join(',')} (promedio) · entradas / salidas / saldo por periodo`);
  for (const tipo of tipos) {
    const P = R.filter(r => r.tipo === tipo), n = P.length;
    console.log(`\n■ ${tipo} · nivel ${[7, 30, 90, 180].filter(d => d <= dias).map(d => `d${d} ${Math.round(P.reduce((s, p) => s + p.fin[d - 1].nivel, 0) / n)}`).join(' · ')}`);
    const recursos = [...new Set(P.flatMap(p => Object.values(p.flujo).flatMap(Object.keys)))];
    const periodos = PERIODOS.filter(([a]) => a <= dias).map(([a, b]) => [a, Math.min(b, dias)]);
    console.log('  ' + 'recurso'.padEnd(11) + periodos.map(([a, b]) => `días ${a}-${b}`.padStart(26)).join(''));
    for (const rec of recursos) {
      const celdas = [], quien = { entrada: {}, salida: {} };
      for (const [a, b] of periodos) {
        let e = 0, s = 0;
        for (const p of P) for (let d = a; d <= b; d++) { const F = (p.flujo[d] || {})[rec]; if (!F) continue;
          for (const lado of ['entrada', 'salida']) for (const [k, v] of Object.entries(F[lado])) { if (lado === 'entrada') e += v; else s += v; quien[lado][k] = (quien[lado][k] || 0) + v / n; } }
        e /= n; s /= n; celdas.push(`${corto(e)} / ${corto(s)} / ${corto(e - s)}`.padStart(26));
        if (s > 0 && e - s > ACUMULA * s && rec !== 'estamina') avisos.push(`${tipo} · ${rec} días ${a}-${b}: se acumula (entra ${corto(e)}, se gasta ${corto(s)})`);
        if (s > 0 && e < ATASCO * s) avisos.push(`${tipo} · ${rec} días ${a}-${b}: casi no entra (${corto(e)}) y se gasta ${corto(s)}`);
      }
      console.log('  ' + rec.padEnd(11) + celdas.join(''));
      if (detalle) for (const lado of ['entrada', 'salida']) {
        const l = Object.entries(quien[lado]).sort((x, y) => y[1] - x[1]), tot = l.reduce((s, x) => s + x[1], 0);
        if (l.length) console.log(`     ${lado === 'entrada' ? '↑' : '↓'} ` + l.slice(0, 6).map(([k, v]) => `${k} ${Math.round(v / tot * 100)} %`).join(' · '));
      }
    }
  }
  if (avisos.length) console.log('\n' + avisos.map(a => '⚠ ' + a).join('\n'));
  console.log(`\nen ${Math.round((Date.now() - t0) / 1000)} s`);
})();
