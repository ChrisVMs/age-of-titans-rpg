// Balance de clases y arquetipos, sin navegador y en paralelo (un hilo por tarea).
//  · PvP: matriz 4×4 de duelos 1 contra 1 (mismo equipo y nivel; solo cambia la clase), cada uno atacando primero la
//    mitad de las veces. Victorias, rondas, daño hecho y recibido (en % de la vida del rival / propia) y habilidades por duelo.
//  · Arquetipos: cada clase con el árbol volcado en una rama (las 3 de ARBOL[clase]) contra las otras clases.
//  · PvE: cada clase y arquetipo en la Torre (piso más alto que gana la mayoría de semillas) y contra cada jefe mundial
//    (daño medio por intento, en % de su vida).
// Uso: node pruebas/clases.js [--veces=200] [--nivel=60] [--solo=pvp|arquetipos|pve]
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

const CLASES = ['guerrero', 'asesino', 'arquero', 'mago'];
const SEMILLA0 = 500;          // semillas de los duelos: SEMILLA0, SEMILLA0 + 1…
const SEMILLAS_PVE = 5;        // semillas por piso de la Torre y por jefe
const DESEQUILIBRIO = 0.65;    // un enfrentamiento por encima de esto (o de 1 - esto) se señala si no está en la cadena
const ARQUETIPO_FUERTE = 0.10; // un arquetipo que se separa más de esto de la media de su clase se señala

// Código que corre dentro del juego: perfiles por clase/arquetipo y una pelea medida (daño ronda a ronda)
const EN_JUEGO = `
  globalThis.__perfil = (clase, nivel, rama) => {
    const ramas = ARBOL[clase].map(r => r.id), prioridad = rama ? [rama, ...ramas.filter(r => r !== rama)] : ramas;
    return Object.assign(construirBot({ ...DEF_BOTS[0], nombre: 'Clase ' + clase, clase, nivel, prioridad }, 0), { formacion: { pos: 'frente', aliados: [] } });
  };
  globalThis.__pelea = (c, maxRondas = 300) => {   // como jugarHastaFin, midiendo el daño hecho y recibido
    prepararBatalla(c);
    const vistos = new Map(), d = { hecho: 0, recibido: 0, vidaRival: 0, habs: 0 };
    const mirar = () => { const G = batalla.grupo;
      for (const [lado, l] of [['e', G.enemigos], ['h', G.heroes]]) for (const u of l || []) {
        const v = vistos.get(u);
        if (v == null) { if (lado === 'e') d.vidaRival += u.vidaMax; }
        else if (u.vida < v) d[lado === 'e' ? 'hecho' : 'recibido'] += v - u.vida;
        vistos.set(u, u.vida);
      } };
    mirar();
    for (let n = 1; n <= maxRondas; n++) {
      const h = habLista(); if (h) d.habs++;
      const ev = resolverRonda(h); mirar();
      const e = ev.find(x => x[0] === 'resultado'); if (e) return { fin: e[1], rondas: n, ...d };
    }
    return { fin: null, rondas: maxRondas, ...d };
  };`;

if (!isMainThread) {
  const juego = require('./cargar')(); juego.correr(EN_JUEGO);
  const T = workerData, J = x => JSON.stringify(x);
  let r;
  if (T.tipo === 'duelo') r = juego.correr(`aislado(() => {   // a contra b, la mitad atacando cada uno
    const res = { pts: 0, rondas: 0, hecho: 0, recibido: 0, habs: 0, veces: 0 };
    const una = (x, rx, y, ry, s, yoA) => { sembrar(s); jugador = __perfil(x, ${T.nivel}, rx);
      const c = { nombre: 'Duelo', reyes: 'pvp', aliados: [], premio: {}, botin: { piedra: [0, 0], polvo: 0 },
        enemigos: [{ nombre: 'Rival', rey: true, rival: true, perfil: __perfil(y, ${T.nivel}, ry), pct: 1, oro: 0, xp: 0 }] };
      const p = __pelea(c), vidaYo = heroeYo().vidaMax, pts = p.fin === true ? 1 : p.fin === false ? 0 : .5;
      res.veces++; res.rondas += p.rondas;
      if (yoA) { res.pts += pts; res.hecho += p.hecho / p.vidaRival; res.recibido += p.recibido / vidaYo; res.habs += p.habs; }
      else { res.pts += 1 - pts; res.hecho += p.recibido / vidaYo; res.recibido += p.hecho / p.vidaRival; }
    };
    for (let i = 0; i < ${T.veces}; i++) { una(${J(T.a)}, ${J(T.ra)}, ${J(T.b)}, ${J(T.rb)}, ${SEMILLA0} + i, true); una(${J(T.b)}, ${J(T.rb)}, ${J(T.a)}, ${J(T.ra)}, ${SEMILLA0} + i, false); }
    const n = res.veces;
    return JSON.stringify({ victoria: res.pts / n, rondas: res.rondas / n, hecho: res.hecho / n, recibido: res.recibido / n, habs: res.habs / (n / 2) });
  })`);
  else r = juego.correr(`aislado(() => {   // PvE: piso más alto de la Torre y daño a cada jefe
    const gana = n => { let v = 0; for (let s = 0; s < ${SEMILLAS_PVE}; s++) { sembrar(900 + s); jugador = __perfil(${J(T.a)}, ${T.nivel}, ${J(T.ra)});
      if (__pelea(batallaTorre(n)).fin === true) v++; } return v * 2 > ${SEMILLAS_PVE}; };
    let lo = 1, hi = 400; while (lo < hi) { const m = Math.ceil((lo + hi) / 2); if (gana(m)) lo = m; else hi = m - 1; }   // búsqueda binaria
    const jefes = {};
    for (const id of Object.keys(MUNDIALES)) { let dano = 0, rondas = 0;
      for (let s = 0; s < ${SEMILLAS_PVE}; s++) { sembrar(950 + s); jugador = __perfil(${J(T.a)}, ${T.nivel}, ${J(T.ra)});
        const p = __pelea(batallaMundial(id, 'normal')); dano += p.hecho / p.vidaRival; rondas += p.rondas; }
      jefes[id] = { dano: dano / ${SEMILLAS_PVE}, rondas: rondas / ${SEMILLAS_PVE} }; }
    return JSON.stringify({ torre: lo, jefes });
  })`);
  parentPort.postMessage({ ...T, ...JSON.parse(r) });
  return;
}

const opcion = (n, def) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : def; };
const pct = x => `${Math.round(x * 100)} %`.padStart(5);

async function enHilos(tareas) {
  const pend = [...tareas], res = [];
  const hilo = () => new Promise((ok, mal) => { const t = pend.shift(); if (!t) return ok();
    const w = new Worker(__filename, { workerData: t }); w.on('message', r => res.push(r)); w.on('error', mal); w.on('exit', () => hilo().then(ok, mal)); });
  await Promise.all(Array.from({ length: Math.min(os.cpus().length, tareas.length) }, hilo));
  return res;
}

(async () => {
  const t0 = Date.now(), veces = +opcion('veces', 200), nivel = +opcion('nivel', 60), solo = opcion('solo', null), avisos = [];
  const juego = require('./cargar')(), ramas = JSON.parse(juego.correr('JSON.stringify(Object.fromEntries(Object.entries(ARBOL).map(([k, v]) => [k, v.map(r => r.id)])))'));
  const cadena = JSON.parse(juego.correr('JSON.stringify(typeof VENTAJA_CLASE === "undefined" ? {} : VENTAJA_CLASE)'));
  const enCadena = (a, b) => [].concat(cadena[a] || []).includes(b) || [].concat(cadena[b] || []).includes(a);
  const tareas = [];
  if (!solo || solo === 'pvp') for (let i = 0; i < CLASES.length; i++) for (let j = i + 1; j < CLASES.length; j++)
    tareas.push({ tipo: 'duelo', grupo: 'pvp', a: CLASES[i], b: CLASES[j], ra: null, rb: null, veces, nivel });
  if (!solo || solo === 'arquetipos') for (const a of CLASES) for (const ra of ramas[a]) for (const b of CLASES.filter(x => x !== a))
    tareas.push({ tipo: 'duelo', grupo: 'arq', a, b, ra, rb: null, veces: Math.ceil(veces / 4), nivel });
  if (!solo || solo === 'pve') for (const a of CLASES) for (const ra of [null, ...ramas[a]]) tareas.push({ tipo: 'pve', a, ra, nivel });
  console.log(`Clases · nivel ${nivel} · ${veces} duelos por lado · ${tareas.length} tareas en ${Math.min(os.cpus().length, tareas.length)} hilos`);
  const R = await enHilos(tareas);

  const pvp = R.filter(r => r.grupo === 'pvp');
  if (pvp.length) {
    const celda = (a, b) => { const r = pvp.find(x => x.a === a && x.b === b), s = pvp.find(x => x.a === b && x.b === a);
      return r ? r : s ? { victoria: 1 - s.victoria, rondas: s.rondas, hecho: s.recibido, recibido: s.hecho } : null; };
    console.log('\nPvP · % de victorias (fila contra columna)');
    console.log(''.padEnd(10) + CLASES.map(c => c.padStart(10)).join('') + '   media');
    for (const a of CLASES) { const v = CLASES.filter(b => b !== a).map(b => celda(a, b).victoria);
      console.log(a.padEnd(10) + CLASES.map(b => (b === a ? '—' : pct(celda(a, b).victoria)).padStart(10)).join('') + pct(v.reduce((x, y) => x + y) / v.length).padStart(8)); }
    console.log('\nPvP · por enfrentamiento: rondas · daño hecho / recibido (% de vida) · habilidades por duelo (de la fila)');
    for (const r of pvp) {
      console.log(`  ${(r.a + ' vs ' + r.b).padEnd(20)} ${pct(r.victoria)} · ${r.rondas.toFixed(1).padStart(5)} rondas · ${pct(r.hecho)} / ${pct(r.recibido)} · ${r.habs.toFixed(1)} hab`);
      const fuerte = Math.max(r.victoria, 1 - r.victoria);
      if (fuerte > DESEQUILIBRIO && !enCadena(r.a, r.b)) avisos.push(`${r.a} vs ${r.b}: ${pct(r.victoria)} y no está en la cadena de ventajas`);
    }
  }
  const arq = R.filter(r => r.grupo === 'arq');
  if (arq.length) {
    console.log('\nArquetipos · % de victorias contra las otras clases (build balanceada de rival)');
    for (const a of CLASES) {
      const filas = ramas[a].map(ra => { const l = arq.filter(r => r.a === a && r.ra === ra); return { ra, v: l.reduce((s, r) => s + r.victoria, 0) / l.length, l }; });
      const media = filas.reduce((s, f) => s + f.v, 0) / filas.length;
      console.log(`  ${a.padEnd(9)} ` + filas.map(f => `${f.ra} ${pct(f.v).trim()} (${f.l.map(r => r.b.slice(0, 3) + ' ' + pct(r.victoria).trim()).join(', ')})`).join(' · '));
      for (const f of filas) if (Math.abs(f.v - media) > ARQUETIPO_FUERTE) avisos.push(`${a}/${f.ra}: ${pct(f.v).trim()} frente a la media de su clase ${pct(media).trim()}`);
    }
  }
  const pve = R.filter(r => r.tipo === 'pve');
  if (pve.length) {
    const ids = Object.keys(pve[0].jefes);
    console.log(`\nPvE · piso de la Torre ganado por la mayoría de ${SEMILLAS_PVE} semillas · daño a cada jefe (% de su vida por intento)`);
    for (const a of CLASES) for (const r of pve.filter(x => x.a === a).sort((x, y) => (x.ra || '').localeCompare(y.ra || '')))
      console.log(`  ${(a + (r.ra ? '/' + r.ra : '')).padEnd(22)} Torre ${String(r.torre).padStart(3)} · ` + ids.map(id => `${id} ${pct(r.jefes[id].dano).trim()} en ${r.jefes[id].rondas.toFixed(0)} r`).join(' · '));
    const torres = CLASES.map(a => pve.find(r => r.a === a && !r.ra).torre), m = torres.reduce((x, y) => x + y) / torres.length;
    CLASES.forEach((a, i) => { if (Math.abs(torres[i] - m) / m > ARQUETIPO_FUERTE) avisos.push(`PvE ${a}: Torre ${torres[i]} frente a la media ${Math.round(m)}`); });
  }
  if (avisos.length) console.log('\n' + avisos.map(a => '⚠ ' + a).join('\n'));
  console.log(`\nen ${Math.round((Date.now() - t0) / 1000)} s`);
})();
