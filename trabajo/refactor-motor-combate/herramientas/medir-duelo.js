// Se evalúa dentro del juego (modo pruebas): estadísticas de 1500 batallas de 1 contra 1 por caso (% de victorias,
// rondas, % de vida al final, daño causado). Para comparar cambios que alteran el orden del azar. Lo usa equivalencia.js.
(() => {
  simulando = true;
  const real = jugador, out = {}, N = 1500;
  const P = (nivel, rareza, enc, est, runas, nivRuna, mascota, nivMasc, clase = 'guerrero', pr = ['baluarte', 'furia', 'tactica']) => ({ nombre: 'Nv' + nivel + clase, clase, nivel, rareza, enc, est,
    extras: { casco: ['vida'], armadura: ['defensa'], espada: ['ataque'], capa: ['vida'] }, runas, nivRuna, mascota, nivMasc, titulo: null, skin: [null, 0], reliquias: {}, maestria: 0, prioridad: pr });
  const defs = [P(12, 'rara', 4, 2, [], 1, 'rata', 3), P(25, 'epica', 8, 2, ['ataque', 'vida'], 2, 'grifo', 3, 'arquero', ['precision', 'caceria', 'supervivencia']), ...DEF_BOTS];
  const perfiles = defs.map((d, k) => { const b = construirBot(d, 70 + k); b.formacion = { pos: 'frente', aliados: [] }; b.torre = { mejor: 0 }; return b; });
  const yoVida = () => batalla.grupo && batalla.grupo.duelo ? [batalla.grupo.heroes[0].vida, batalla.grupo.heroes[0].vidaMax] : [batalla.vidaG, batalla.vidaMaxG];
  for (const pf of perfiles) {
    const casos = [];
    for (const i of [0, 1, 2]) casos.push([`arena${i}`, () => { sembrar(99); jugador.arena = { puntos: 1000, victorias: 0, temporada: mesActual() }; generarRivales(); return batallaArena(i); }]);
    for (const id of Object.keys(MUNDIALES)) casos.push([`jefe-${id}`, () => batallaMundial(id)]);
    for (const id of Object.keys(MUNDIALES)) casos.push([`jefe-${id}-medio`, () => { estadoMundial(id).vida = Math.round(MUNDIALES[id].enemigo.vida * .45); return batallaMundial(id); }]);
    casos.push(['duelo3', () => ({ nombre: 'd3', premio: {}, botin: { piedra: [1, 3], polvo: .3 }, enemigos: crearDificultad(Math.max(3, Math.round(pf.nivel / 5)), 'dificil', ['parca', 'ignea', 'escarcha']).enemigos })]);
    for (const [nombre, armar] of casos) {
      let v = 0, ron = 0, vida = 0, dano = 0;
      for (let s = 1; s <= N; s++) {
        jugador = structuredClone(pf); jugador.mundiales = {}; sembrar(1000 + s);
        const c = armar(); sembrar(77777 + s);
        const r = jugarHastaFin(c, habLista, 400), [a, b] = yoVida();
        if (r.fin === true) v++; ron += r.rondas; vida += Math.max(0, a / b); dano += batalla.danoHecho;
      }
      out[pf.nombre + ' · ' + nombre] = [Math.round(v / N * 1000) / 10, Math.round(ron / N * 10) / 10, Math.round(vida / N * 1000) / 10, Math.round(dano / N)];
    }
  }
  jugador = real; simulando = false; sembrar(null);
  return out;
})()
