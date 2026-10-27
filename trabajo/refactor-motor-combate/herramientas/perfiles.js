// Mide la dificultad con perfiles de referencia (pegar en la consola del juego en modo pruebas).
// Seis guerreros que juegan solos, de nivel 5 a 57 (el último es el bot Kaito); el equipo de cada nivel es una
// suposición de progresión, así que lo útil es comparar antes/después de un cambio, no los números absolutos.
// Deja en window.__med, por perfil, el % de victorias en los 40 niveles de campaña (Normal, Difícil, Pesadilla,
// Infierno) y en 14 pisos de Torre. Tarda unos segundos; se consulta window.__avance mientras corre.
window.__med = null; window.__avance = 0;
(async () => {
  const lineas = { casco: ['vida'], armadura: ['defensa'], espada: ['ataque'], capa: ['vida'] };
  const P = (nivel, rareza, enc, est, runas, nivRuna, mascota, nivMasc) => ({ nombre: 'Nv' + nivel, clase: 'guerrero', nivel, rareza, enc, est,
    extras: lineas, runas, nivRuna, mascota, nivMasc, titulo: null, skin: [null, 0], reliquias: {}, maestria: 0, prioridad: ['baluarte', 'furia', 'tactica'] });
  const perfiles = [P(5, 'comun', 2, 1, [], 1, null, 0), P(10, 'rara', 4, 2, [], 1, 'rata', 3), P(20, 'epica', 7, 2, ['ataque', 'vida'], 2, 'rata', 6),
    P(30, 'epica', 10, 3, ['ataque', 'vida', 'defensa'], 3, 'grifo', 2), P(40, 'legendaria', 13, 3, ['ataque', 'vida', 'defensa', 'critico'], 4, 'grifo', 4), DEF_BOTS[0]]
    .map((d, k) => { const b = construirBot(d, 50 + k); b.formacion = { pos: 'frente', aliados: [] }; b.torre = { mejor: 0 }; return b; });
  const PISOS = [1, 3, 5, 8, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100];
  const res = {}, real = jugador;
  for (const pf of perfiles) {
    const fila = [];
    for (const d of ORDEN_DIF) { jugador = pf; for (const c of CAMPANAS) fila.push(simular(batallaCampana(c, d), { veces: 100, semilla: 5 }).pctVictoria); jugador = real; await new Promise(r => setTimeout(r, 0)); }
    jugador = pf; for (const n of PISOS) fila.push(simular(batallaTorre(n), { veces: 100, semilla: 5 }).pctVictoria); jugador = real;
    res[pf.nombre] = fila; window.__avance = Object.keys(res).length; await new Promise(r => setTimeout(r, 0));
  }
  window.__med = res;
})().catch(e => { window.__med = { error: String(e.stack || e) }; });
