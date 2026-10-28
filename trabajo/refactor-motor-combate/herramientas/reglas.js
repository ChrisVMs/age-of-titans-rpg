// Mide cuánto cambia el % de victorias con cada opción de REGLAS. Uso: node correr.js <carpeta del juego> reglas.js
(() => {
  simulando = true;
  const real = jugador, N = 800, out = {};
  const perfiles = DEF_BOTS.map((d, k) => { const b = construirBot(d, 70 + k); b.formacion = { pos: 'frente', aliados: [] }; b.torre = { mejor: 0 }; return b; });
  const duelo = [['arena', () => { sembrar(99); jugador.arena = { puntos: 1000, victorias: 0, temporada: mesActual() }; generarRivales(); return batallaArena(2); }],
    ...Object.keys(MUNDIALES).map(id => [id, () => { estadoMundial(id).vida = Math.round(MUNDIALES[id].enemigo.vida * .45); return batallaMundial(id); }])];
  const grupo = [['camp-inf', () => batallaCampana(CAMPANAS.at(-1), 'infierno')], ['camp-pes', () => batallaCampana(CAMPANAS[Math.floor(CAMPANAS.length * .8)], 'pesadilla')],
    ...[40, 50, 60].map(n => [`torre${n}`, () => batallaTorre(n)])];
  const medir = casos => { let v = 0, n = 0; const det = {};
    for (const pf of perfiles) for (const [nom, armar] of casos) { let w = 0;
      for (let s = 1; s <= N; s++) { jugador = structuredClone(pf); jugador.mundiales = {}; sembrar(1000 + s); const c = armar(); sembrar(5000 + s); if (jugarHastaFin(c, habLista, 400).fin === true) w++; }
      det[pf.nombre + ' ' + nom] = Math.round(w / N * 1000) / 10; v += w; n += N; }
    return { media: Math.round(v / n * 1000) / 10, det }; };
  const prueba = (modo, clave, casos) => { const R = REGLAS[modo], antes = R[clave]; const base = medir(casos); R[clave] = !antes; const cambio = medir(casos); R[clave] = antes;
    const dif = Object.keys(base.det).map(k => [k, base.det[k], cambio.det[k]]).filter(x => Math.abs(x[2] - x[1]) >= 3);
    return { base: base.media, cambiado: cambio.media, mayores: dif }; };
  for (const k of ['contraDefensa', 'regenAntes', 'espinas', 'gastaHabControlado', 'habTrasEsquiva']) {
    out['duelo como grupo · ' + k] = prueba('duelo', k, duelo);
    out['grupo como duelo · ' + k] = prueba('grupo', k, grupo);
  }
  jugador = real; simulando = false; sembrar(null); return out;
})()
