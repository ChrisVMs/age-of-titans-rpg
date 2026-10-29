  // ---------------- Expediciones ----------------
  // Mandas una mascota (que no lleves puesta) 2, 4 u 8 horas y al volver recoges oro y materiales. No gasta estamina.
  const HORAS_EXPEDICION = [2, 4, 8];
  function premioExpedicion(m, h) {
    const ci = Object.keys(CAT_MASCOTA).indexOf(m.cat);
    return { oro: jugador.nivel * 30 * h * (1 + ci * .25), piedra: h * 2 * (1 + ci * .2), polvo: Math.floor(h / 2) + ci, almas: h >= 8 ? 1 + ci : 0 };
  }
  const expedicionLista = () => jugador.expedicion && Date.now() >= jugador.expedicion.fin;

  let misTab = 'diaria', expMasc = null, expHoras = 4;
  // Cobra una misión (o el bonus) si está hecha y sin cobrar; devuelve el premio o null. Se revalida con el estado actual:
  // un botón viejo (p. ej. tras cambiar de día) no cobra dos veces.
  function reclamarMision(tipo, id) {
    const M = revisarMisiones(), R = M['r' + tipo], m = MISIONES[tipo].find(x => x.id === id);
    const cofre = id.startsWith('cofre') && BONUS_MISIONES[tipo][+id.slice(5)];
    const hecha = cofre ? misionesHechas(R) >= cofre.meta : m && (M[tipo][m.ev] || 0) >= m.meta;
    if (R[id] || !hecha) return null;
    const pr = cofre ? cofre.premio : m.premio; R[id] = true; darPremio(pr); return pr;
  }
