// Carga el juego (js/juego.js) en Node, sin navegador, para correr el motor, los escenarios y los simuladores.
// Mientras la lógica y la pantalla sigan mezcladas (ver trabajo/separar-logica), lo que el juego pide del navegador
// (document, elementos, audio...) lo recibe un "comodín": acepta cualquier propiedad o llamada y no hace nada.
// Uso: const juego = require('./cargar')(); juego.correr('correrEscenarios()')
const fs = require('fs'), path = require('path'), vm = require('vm');

function comodin() {
  const f = function () {};
  const p = new Proxy(f, {
    get: (t, k) => k === Symbol.toPrimitive ? () => '' : k === Symbol.iterator ? function* () {} : k === 'then' ? undefined
      : k === 'length' ? 0 : k === 'classList' || k === 'style' || k === 'dataset' ? (t[k] ||= comodin()) : k in t && k !== 'call' && k !== 'apply' ? t[k] : p,
    set: (t, k, v) => { t[k] = v; return true; },
    apply: () => p, construct: () => p,
  });
  return p;
}

module.exports = function cargar({ archivos = ['js/juego.js'], pruebas = true } = {}) {
  const raiz = path.join(__dirname, '..'), guardado = {};
  const ventana = {
    console, Math, Date, JSON, Promise, performance, structuredClone, Intl, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, innerWidth: 900, innerHeight: 420,
    localStorage: { getItem: k => guardado[k] ?? null, setItem: (k, v) => { guardado[k] = String(v); }, removeItem: k => { delete guardado[k]; } },
    location: { protocol: pruebas ? 'file:' : 'https:', hostname: 'localhost', search: '', href: '' },   // file: = modo pruebas
    screen: {}, navigator: {}, document: comodin(), Audio: function () { return comodin(); }, Image: function () { return comodin(); },
    getComputedStyle: () => comodin(),
  };
  ventana.window = ventana; ventana.self = ventana; ventana.globalThis = ventana; delete ventana.BroadcastChannel;
  const ctx = vm.createContext(ventana);
  for (const a of archivos) vm.runInContext(fs.readFileSync(path.join(raiz, a), 'utf8'), ctx, { filename: a });
  return { ctx, correr: codigo => vm.runInContext(codigo, ctx) };
};
