// Se evalúa dentro del juego (modo pruebas): por batalla y semilla, el resultado, la vida final de cada unidad, el botín
// y el siguiente número del azar (si coincide, se tiró el azar las mismas veces). Lo usa equivalencia.js.
(() => {
  simulando = true;
  const real = jugador, out = {};
  const P = (nivel, rareza, enc, est, runas, nivRuna, mascota, nivMasc, clase = 'guerrero', pr = ['baluarte', 'furia', 'tactica']) => ({ nombre: 'Nv' + nivel + clase, clase, nivel, rareza, enc, est,
    extras: { casco: ['vida'], armadura: ['defensa'], espada: ['ataque'], capa: ['vida'] }, runas, nivRuna, mascota, nivMasc, titulo: null, skin: [null, 0], reliquias: {}, maestria: 0, prioridad: pr });
  const defs = [P(5, 'comun', 2, 1, [], 1, null, 0), P(12, 'rara', 4, 2, [], 1, 'rata', 3), P(25, 'epica', 8, 2, ['ataque', 'vida'], 2, 'grifo', 3, 'arquero', ['precision', 'caceria', 'supervivencia']),
    ...DEF_BOTS];
  const perfiles = defs.map((d, k) => { const b = construirBot(d, 70 + k); b.formacion = { pos: 'frente', aliados: [] }; b.torre = { mejor: 0 }; return b; });
  const unidades = () => batalla.grupo && batalla.grupo.heroes ? [batalla.grupo.heroes.map(u => [u.vida, u.bastionUsado || 0, u.alientoUsado || 0]), batalla.grupo.enemigos.map(u => u.vida)] : null;
  const duelo = () => batalla.campana.grupo ? null : (batalla.vidaG !== undefined && !(batalla.grupo && batalla.grupo.duelo) ? [batalla.vidaG, batalla.vidaE, batalla.iEnemigo] :
    [batalla.grupo.heroes[0].vida, batalla.grupo.enemigos[0].vida, batalla.iEnemigo]);
  const casos = pf => {
    const otros = DEF_BOTS.map(d => d.nombre).filter(n => n !== pf.nombre);
    const L = [];
    for (const [i, d] of [[0, "normal"], [3, "dificil"], [5, "normal"], [7, "pesadilla"], [8, "infierno"], [CAMPANAS.length - 1, "normal"]]) L.push([`camp${i}${d}`, () => batallaCampana(CAMPANAS[i], d)]);
    L.push(['camp+2', () => ({ ...batallaCampana(CAMPANAS[6], 'dificil'), aliados: otros.slice(0, 2) })]);
    for (const n of [1, 10, 20, 35, 60]) L.push([`torre${n}`, () => batallaTorre(n)]);
    L.push(['torre+1', () => ({ ...batallaTorre(30), aliados: otros.slice(2, 3), posiciones: { yo: 'atras', [otros[2]]: 'frente' } })]);
    L.push(['calabozo', () => { const c = calabozo(2), d = crearDificultad(c.n, 'dificil', [c.jefe, ...c.tipos]);
      for (const e of d.enemigos) { e.vida = Math.round(e.vida * MULT_CALABOZO.vida); e.dano = e.dano.map(x => Math.round(x * MULT_CALABOZO.dano)); }
      return { nombre: 'cal', calabozo: 'dificil', cal: 2, aliados: otros.slice(0, 2), premio: {}, botin: d.botin, enemigos: d.enemigos }; }]);
    for (const dif of ['normal', 'pesadilla']) L.push([`reyes${dif}`, () => ({ nombre: 'reyes', reyes: dif, aliados: otros.slice(1, 3), premio: {}, botin: { piedra: [0, 0], polvo: 0 },
      enemigos: reyesSemana().map(rey => ({ nombre: rey.nombre, rey: true, rival: true, jefe: rey.puesto === 1, perfil: rey.perfil, pct: DIF_REYES[dif].pct, oro: 0, xp: 0 })) })]);
    for (const i of [0, 1, 2]) L.push([`arena${i}`, () => { sembrar(99); jugador.arena = { puntos: 1000, victorias: 0, temporada: mesActual() }; generarRivales(); return batallaArena(i); }]);
    for (const id of Object.keys(MUNDIALES)) L.push([`jefe-${id}`, () => batallaMundial(id)]);
    for (const id of Object.keys(MUNDIALES)) L.push([`jefe-${id}-medio`, () => { estadoMundial(id).vida = Math.round(MUNDIALES[id].enemigo.vida * .45); return batallaMundial(id); }]);
    L.push(['duelo3', () => ({ nombre: 'd3', premio: {}, botin: { piedra: [1, 3], polvo: .3, cofre: 'madera' }, enemigos: crearDificultad(8, 'dificil', ['parca', 'ignea', 'escarcha']).enemigos })]);
    return L;
  };
  for (const pf of perfiles) for (const [nombre, armar] of casos(pf)) {
    const filas = [];
    for (let s = 1; s <= 6; s++) {
      jugador = structuredClone(pf); jugador.mundiales = {}; sembrar(1000 + s);
      const c = armar(); sembrar(s);
      let r; try { r = jugarHastaFin(c, habLista, 400); } catch (e) { r = 'ERROR ' + e.message; }
      const g = batalla.ganado || {};
      filas.push(JSON.stringify([r, c.grupo ? unidades() : duelo(), [g.oro, g.xp, g.piedra, g.polvo, (g.objetos || []).length], c.grupo ? 0 : batalla.danoHecho, rnd()]));
    }
    out[pf.nombre + ' · ' + nombre] = filas;
  }
  jugador = real; simulando = false; sembrar(null);
  out.__escenarios = correrEscenarios().map(r => r.nombre + ': ' + (r.ok ? 'ok' : r.detalle));
  return out;
})()
