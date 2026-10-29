  // ---------------- Conjuntos de equipo de jefe ----------------
  // 2 piezas del mismo jefe equipadas activan su bono (en fracción, como los efectos)
  // Sets de equipo de jefe: 2 piezas bono pequeño, 3 piezas bono importante, 4 piezas efecto que cambia el combate
  // (pensado contra la mecánica de su jefe: Cerbero premia críticos, Asmodeo habilidades y aguante, Minotauro aguantar golpes).
  const CONJUNTOS = {
    cerbero:   { nombre: 'Furia del inframundo', 2: { critico: .06 }, 3: { danoCritico: .25, jefes: .08 },
                 especial: 'Tus críticos aplican Quemadura (2 turnos, 30 % de tu ataque por turno)' },
    asmodeo:   { nombre: 'Pacto demoníaco',      2: { habilidad: .12 }, 3: { robo: .04, curacion: .15 },
                 especial: 'Cada habilidad que usas te cura un 6 % de tu vida máxima' },
    minotauro: { nombre: 'Fuerza del laberinto', 2: { reduccion: .05 }, 3: { penetracion: .12, resistencia: .1 },
                 especial: 'Un golpe que te quite más del 15 % de tu vida máxima se reduce un 35 %' },
  };
  function piezasConjunto() { return memoizar('conjuntos', piezasConjuntoSinMemo); }
  function piezasConjuntoSinMemo() {
    const n = {};
    for (const uid of Object.values(jugador.equipado)) { const j = modelo[objeto(uid).modelo].jefe; if (j) n[j] = (n[j] || 0) + 1; }
    return n;
  }
  const conjuntosActivos = () => { const n = piezasConjunto(); return Object.keys(n).filter(j => n[j] >= 2); };
  const set4 = j => (piezasConjunto()[j] || 0) >= 4;
  const efectoConjuntos = esp => Object.entries(piezasConjunto()).reduce((s, [j, n]) => s + (n >= 2 ? CONJUNTOS[j][2][esp] || 0 : 0) + (n >= 3 ? CONJUNTOS[j][3][esp] || 0 : 0), 0);
  const textoNivelSet = ef => textoBonos({}, Object.fromEntries(Object.entries(ef).map(([a, v]) => [a, Math.round(v * 100)])));
  const SET4_GOLPE = .15, SET4_REDUCE = .35, SET4_CURA = .12;   // SET4_CURA: del daño del golpe con habilidad (antes 6 % de la vida máxima)
  const ALIENTO_MULT = .5;   // Segundo aliento: cura tu ataque × esto por rango (antes 10 % de la vida máxima)
