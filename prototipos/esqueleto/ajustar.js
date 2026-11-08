// ajustar.js - herramienta de consola (no se usa al animar): ajusta una pose del modelo a la silueta de un cuadro del
// sprite. Compara siluetas (sin los brillos de los efectos) y prueba la raíz y el giro de cada hueso con pasos cada vez
// más finos, sin alejarse más de MAX_DESVIO de la pose de partida. Uso: await ajustarTodo() -> {casilla: pose}
const lienzo = Object.assign(document.createElement('canvas'), { width: CW, height: CH }), lc = lienzo.getContext('2d', { willReadFrequently: true });
function mascaraSprite(c) {
  lc.clearRect(0, 0, CW, CH); lc.save(); const f = esc(c) / esc(70);   // al tamaño del reposo, pies abajo al centro
  lc.translate(CW / 2, CH); lc.scale(f, f); lc.drawImage(tira, c * CW, 0, CW, CH, -CW / 2, -CH, CW, CH); lc.restore();
  const d = lc.getImageData(0, 0, CW, CH).data, m = new Uint8Array(CW * CH);
  for (let i = 0; i < m.length; i++) { const r = d[4 * i], g = d[4 * i + 1], b = d[4 * i + 2];
    m[i] = d[4 * i + 3] > 60 && !(r + g + b > 590 || (b > 215 && g > 195 && b - r > 25)) ? 1 : 0; }
  return m;
}
function mascaraModelo(p0) {
  const p = pisar(structuredClone(p0)); lc.clearRect(0, 0, CW, CH); lc.save(); lc.scale(.5, .5);
  for (const n of MODELO.orden) { const P = MODELO.piezas[n]; if ((p['alfa_' + n] ?? 1) <= .01) continue;
    const m = matriz(n, p); lc.save(); lc.transform(m.a, m.b, m.c, m.d, m.e, m.f); lc.transform(...P.m); lc.drawImage(imgs[n], 0, 0); lc.restore(); }
  lc.restore(); const d = lc.getImageData(0, 0, CW, CH).data, m = new Uint8Array(CW * CH);
  for (let i = 0; i < m.length; i++) { const r = d[4 * i], g = d[4 * i + 1], b = d[4 * i + 2];
    m[i] = d[4 * i + 3] > 60 && !(r + g + b > 590 || (b > 215 && g > 195 && b - r > 25)) ? 1 : 0; }   // las dagas tampoco cuentan
  return m;
}
const coincide = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) { i += a[k] & b[k]; u += a[k] | b[k]; } return i / (u || 1); };
const PARAMS = ['torso', 'cabeza', 'brazoI', 'antebrazoI', 'brazoD', 'antebrazoD', 'piernaI', 'espinillaI', 'piernaD', 'espinillaD', 'capa', 'sueloI', 'sueloD'];   // suelo*: giro del pie (los pies los clava pisar)
const MAX_DESVIO = 40, CASTIGO = .02;   // ±grados desde la pose de partida y penalización por alejarse
async function ajustar(c, p0) {
  const obj = mascaraSprite(c), p = structuredClone(p0);
  const ok = h => Math.abs(p[h] - (p0[h] ?? 0)) <= MAX_DESVIO;
  const nota = () => coincide(mascaraModelo(p), obj) - CASTIGO * PARAMS.reduce((s, h) => s + (((p[h] ?? 0) - (p0[h] ?? 0)) / 30) ** 2, 0);
  let mejor = nota();
  const probar = (fija, quita, h) => { fija(); if (h && !ok(h)) { quita(); return false; } const v = nota(); if (v > mejor) { mejor = v; return true; } quita(); return false; };
  for (const paso of [12, 6, 3, 1.5]) for (let vuelta = 0; vuelta < 2; vuelta++) {
    for (const eje of [0, 1]) for (const s of [1, -1]) { const d = paso * 3 * s;   // raíz en px del modelo (x2)
      while (probar(() => { p.raiz[eje] += d; }, () => { p.raiz[eje] -= d; })); p.raiz[eje] = +p.raiz[eje].toFixed(1); }
    for (const h of PARAMS) for (const s of [1, -1]) { p[h] ??= 0;
      while (probar(() => { p[h] += paso * s; }, () => { p[h] -= paso * s; }, h)); p[h] = +p[h].toFixed(1); }
    await new Promise(r => setTimeout(r));
  }
  return { pose: p, coincidencia: +coincide(mascaraModelo(p), obj).toFixed(3), antes: +coincide(mascaraModelo(p0), obj).toFixed(3) };
}
// las claves 1-9 del ataque son las casillas 11-19 (poses_modelo.py)
async function ajustarTodo() {
  const out = {}, cl = ANIM.ataque.claves;
  for (let c = 11; c <= 19; c++) { const { t, ...p0 } = cl[c - 10]; const r = await ajustar(c, p0); out[c] = r.pose; console.log(c, r.antes, '->', r.coincidencia); }
  return out;
}
