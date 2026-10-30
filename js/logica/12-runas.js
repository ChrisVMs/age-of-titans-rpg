  // ---------------- Runas ----------------
  // Se crean al azar con oro y polvo y suben de nivel (hasta Nv 10) mejorándolas con oro y polvo o fusionando gratis
  // 3 iguales del mismo nivel. Las que no sirven se funden para recuperar polvo.
  // 4 ranuras. v = % por nivel (base: a un atributo base; si no, a un efecto).
  const RUNAS = {
    ataque:      { nombre: 'Runa de furia',     icono: '🔴', base: true, v: 1.5 },
    vida:        { nombre: 'Runa vital',        icono: '🟢', base: true, v: 2 },
    defensa:     { nombre: 'Runa de piedra',    icono: '🟤', base: true, v: 2 },
    armadura:    { nombre: 'Runa férrea',       icono: '⚪', base: true, v: 2 },
    critico:     { nombre: 'Runa precisa',      icono: '🟡', v: .6 },
    danoCritico: { nombre: 'Runa letal',        icono: '🟠', v: 3 },
    penetracion: { nombre: 'Runa perforante',   icono: '🔵', v: 1.5 },
    reduccion:   { nombre: 'Runa protectora',   icono: '🟣', v: .6 },
    resistencia: { nombre: 'Runa pura',         icono: '⚫', v: 1.5 },
    habilidad:   { nombre: 'Runa arcana',       icono: '💠', v: 1.5 },
    jefes:       { nombre: 'Runa cazadora',     icono: '🔺', v: 1.5 },
    fortuna:     { nombre: 'Runa de fortuna',   icono: '🍀', v: 2 },
  };
  for (const [k, r] of Object.entries(RUNAS)) r.img = 'runa_' + k;   // icono HD: img/iconos/runa_<tipo>.png
  const RUNA_MAX = 10, RANURAS_RUNA = 4, COSTE_RUNA = { oro: 500, polvo: 5 };
  // Calidad de runa (r.cal): 0 normal, 1 rara, 2 perfecta. Las raras y perfectas añaden un efecto secundario (r.extra)
  // a 1/3 o 2/3 del valor de su propia runa por nivel. Al crear: 15 % rara, 3 % perfecta. Fusionar conserva la mejor
  // calidad (y 10 % de subirla). Pulir sortea otra vez el secundario y puede subir la calidad, con garantía (r.pul).
  const CAL_RUNA = [{ nombre: '', f: 0 }, { nombre: 'rara', f: 1 / 3, color: '#4fc3ff' }, { nombre: 'perfecta', f: 2 / 3, color: '#ffb02e' }];
  const COSTE_PULIR_RUNA = { oro: 1000, polvo: 10 }, GARANTIA_PULIR = [4, 12];   // pulidos hasta rara / hasta perfecta
  const extrasRuna = r => Object.keys(RUNAS).filter(k => !RUNAS[k].base && k !== 'fortuna' && k !== r.tipo);
  function calidadNueva(r, cal) { r.cal = cal; if (cal && (!r.extra || r.extra === r.tipo)) r.extra = elegir(extrasRuna(r)); return r; }
  const sortearCalRuna = () => { const t = rnd(); return t < .03 ? 2 : t < .18 ? 1 : 0; };
  const costeMejoraRuna = n => ({ oro: 400 * n, polvo: 2 * n });
  // fundir devuelve la mitad del polvo invertido (creación + mejoras hasta su nivel)
  const polvoFundir = r => Math.max(2, Math.floor((COSTE_RUNA.polvo + r.nivel * (r.nivel - 1)) / 2));
  const runasPuestas = () => (jugador.runasPuestas || []).map(uid => (jugador.runas || []).find(r => r.uid === uid)).filter(Boolean);
  function statsRunas() {
    const t = {};
    for (const r of runasPuestas()) if (RUNAS[r.tipo].base) t[r.tipo] = (t[r.tipo] || 0) + RUNAS[r.tipo].v * r.nivel;
    return t;
  }
  const valorExtra = r => r.cal && r.extra ? RUNAS[r.extra].v * r.nivel * CAL_RUNA[r.cal].f : 0;
  function efectoRunas(esp) { return runasPuestas().reduce((s, r) => s + (r.tipo === esp && !RUNAS[r.tipo].base ? RUNAS[r.tipo].v * r.nivel / 100 : 0) + (r.extra === esp ? valorExtra(r) / 100 : 0), 0); }
  const textoRuna = r => `+${r1(RUNAS[r.tipo].v * r.nivel)} % ${(RUNAS[r.tipo].base ? ATRIBUTOS[r.tipo] : nombreEf(r.tipo)).toLowerCase()}`
    + (r.cal && r.extra ? `<br><span style="color:${CAL_RUNA[r.cal].color}">+${r1(valorExtra(r))} % ${nombreEf(r.extra).toLowerCase()}</span>` : '');
  function crearRuna() {   // paga y crea una runa de tipo al azar (sin equipar)
    jugador.runas ||= []; pagar(COSTE_RUNA);
    const nueva = calidadNueva({ uid: sigUid++, tipo: elegir(Object.keys(RUNAS)), nivel: 1 }, sortearCalRuna());
    jugador.runas.push(nueva); return nueva;
  }
  function mejorarRuna(r) {
    if (r.nivel >= RUNA_MAX || !tieneCoste(costeMejoraRuna(r.nivel))) return false;
    pagar(costeMejoraRuna(r.nivel)); r.nivel++; return true;
  }
  function fusionarRuna(r) {   // con 2 iguales sin equipar (mismo tipo y nivel): sube un nivel y conserva la mejor calidad
    const puestas = jugador.runasPuestas || [];
    const otras = jugador.runas.filter(x => x !== r && !puestas.includes(x.uid) && x.tipo === r.tipo && x.nivel === r.nivel).slice(0, 2);
    if (otras.length < 2 || r.nivel >= RUNA_MAX) return false;
    const mejor = [r, ...otras].sort((a, b) => (b.cal || 0) - (a.cal || 0))[0], cal = Math.min(2, (mejor.cal || 0) + (rnd() < .1 ? 1 : 0));
    if (mejor !== r && mejor.extra) r.extra = mejor.extra;   // la fusión conserva la mejor calidad y su secundario
    jugador.runas = jugador.runas.filter(x => !otras.includes(x)); r.nivel++; calidadNueva(r, cal); return true;
  }
