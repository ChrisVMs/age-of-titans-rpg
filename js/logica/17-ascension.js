  // ---------------- Ascensión ----------------
  // Al nivel 80 se puede ascender: vuelves al nivel 1 a cambio de +5 % a todo y 2 puntos de habilidad extra por ascensión (máx. 10)
  const ASCENSION_MAX = 10;
  const ascension = () => jugador.ascension || 0;
  function statsAscension() { const a = ascension(); return a ? { ataque: 5 * a, vida: 5 * a, defensa: 5 * a, armadura: 5 * a } : {}; }

  // Estadísticas totales = base por nivel + suma de atributos del equipo
  function estadisticas() {
    const n = jugador.nivel;
    const t = { ataque: 10 + 2 * (n - 1), defensa: 0, vida: 100 + 10 * (n - 1), armadura: 0 };
    for (const uid of Object.values(jugador.equipado)) for (const [a, v] of Object.entries(valores(objeto(uid)))) if (a in t) t[a] += v;
    for (const [a, v] of Object.entries(CLASES[jugador.clase].mod)) t[a] = Math.round(t[a] * (1 + v / 100));   // la clase (identidad: va aparte)
    // Bonos en % de mascota, skin, árbol, runas, maestría, colección, ascensión y título: se SUMAN en un solo bloque y se
    // aplican una vez. Multiplicarlos en cadena hacía crecer el endgame de forma exponencial (cada fuente nueva valía más).
    const pct = { ataque: 0, defensa: 0, vida: 0, armadura: 0 }, sumar = f => { for (const [a, v] of Object.entries(f)) if (a in pct) pct[a] += v; };
    const m = mascotaActual();
    if (m) sumar(Object.fromEntries(Object.entries(m.bono).map(([a, v]) => [a, valorNivel(v, nivelMascota(m))])));
    const k = skinActual();
    if (k) sumar({ [k.base[0]]: bonoSkinBase(k) });
    for (const fuente of [statsArbol(), statsRunas(), statsMaestria(), statsColeccion(), statsAscension(), statsAura()]) sumar(fuente);
    const ti = tituloActual();
    if (ti) sumar(ti.bono);
    for (const a in t) t[a] = Math.round(t[a] * (1 + pct[a] / 100));
    return t;
  }

  // Poder total: suma ponderada de las estadísticas finales. Los pesos son inversos a UNIDAD para que
  // una línea de cualquier atributo (misma rareza y estrellas) aporte el mismo poder (~40).
  const PESO_PODER = { ataque: 10, defensa: 27, vida: 4, armadura: 4 };
  // Efecto especial de la skin: suma valor × peso en % del poder (el peso refleja cuánto se activa en combate)
  const PESO_EFECTO = { habilidad: .5, jefes: .5, reduccion: 1, contra: .6, curacion: .3, oro: 0,
                        critico: .5, remate: .5, robo: .6, resistencia: .3, esquiva: 1, danoCritico: .1, penetracion: .3, fortuna: 0 };
  const textoEfecto = a => a === 'danoCritico' ? `${Math.round((DANO_CRITICO_BASE + efecto(a)) * 100)}%`
    : `${Math.round(efecto(a) * 1000) / 10}%${TOPE_SEC[a] && efecto(a) >= TOPE_SEC[a] ? ' (máx)' : ''}`;
  function poder(st) {
    const anidado = !!memo; memo ||= {};
    try { st ||= estadisticas(); return poderSinMemo(st); } finally { if (!anidado) memo = null; }
  }
  function poderSinMemo(st) {
    let p = Object.entries(PESO_PODER).reduce((s, [a, w]) => s + st[a] * w, 0);
    p *= 1 + Object.entries(PESO_EFECTO).reduce((s, [esp, w]) => s + efecto(esp) * w, 0) + poderArbol()
      + Object.keys(CONJUNTOS).filter(set4).length * .04;   // un set de 4 piezas cambia el combate: +4 % de poder cada uno
    return Math.round(p);
  }
