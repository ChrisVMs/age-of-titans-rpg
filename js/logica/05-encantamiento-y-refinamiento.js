  // ---------------- Encantamiento (+1 ... +20) y refinamiento ----------------
  // Tope de encantamiento según rareza
  const ENC_MAX = { comun: 12, rara: 15, epica: 20, legendaria: 20, mitica: 25, ancestral: 30 };
  const encMax = o => ENC_MAX[modelo[o.modelo].rareza];
  const ENC_PRINCIPAL = { ataque: 1.5, defensa: .6, vida: 5, armadura: 4 };   // por nivel, x rareza: fortalece el atributo base
  const ENC_PORCENTAJE = .04;                                                // por nivel: +4 % a todas las líneas
  // Éxito según el nivel al que se sube: hasta +9 siempre; +10..+12 60 %; +13..+15 35 %; +16..+20 22 %; +21..+30 10 %.
  // Estando en +15 o más, fallar tiene un 50 % de bajar el objeto un nivel. Desde +10 también cuesta Polvo de almas.
  // Bendición: +10 % de éxito y evita la degradación, a cambio de oro (400 × nivel) y almas extra (nivel − 9, mín. 2).
  // Coste esperado a +18: sin bendición ~97 intentos, ~70k oro y ~1 100 almas; con bendición ~29 intentos, ~155k oro y
  // ~320 almas. Es una elección real: arriesgar ahorra oro, bendecir ahorra almas (el recurso escaso).
  const probEncantar = enc => { const t = enc + 1; return t <= 9 ? 100 : t <= 12 ? 60 : t <= 15 ? 35 : t <= 20 ? 22 : 10; };
  const degradaAl = enc => enc >= 15;   // estando en +15 o más, fallar puede bajar un nivel
  const PROB_DEGRADAR = .5;
  const BENDICION = 10;
  // Protección contra la mala suerte: cada fallo seguido en un objeto (o.fallos) suma probabilidad hasta una garantía.
  // Con éxito base del 60/35/22/10 % la garantía llega tras 3/5/8/15 fallos seguidos; hasta entonces cada fallo suma la
  // mitad del tramo lineal. No regala mejoras: solo corta las rachas absurdas. Un éxito reinicia el contador.
  const garantiaEnc = base => base >= 60 ? 3 : base >= 35 ? 5 : base >= 22 ? 8 : 15;
  const bonoProteccion = (base, fallos) => !fallos || base >= 100 ? 0 : fallos >= garantiaEnc(base) ? 100 : Math.round(fallos * (100 - base) / (2 * garantiaEnc(base)));
  const costeEncantar = (o, bendecir) => {
    const enc = o.enc, t = enc + 1, base = probEncantar(enc), c = { piedra: t, oro: 50 * t, prob: Math.min(100, base + bonoProteccion(base, o.fallos || 0)) };
    if (t >= 10) c.almas = (t - 9) * 2;
    const forja = (eventoHoy() || {}).forja || 0;   // Día de la Forja
    if (forja) c.oro = Math.round(c.oro * (1 - forja));
    if (bendecir) { c.oro += Math.round(400 * t * (1 - forja)); c.almas = (c.almas || 0) + Math.max(2, t - 9); c.prob = Math.min(100, c.prob + BENDICION); }
    return c;
  };
  // Encantar (paga el coste): 'exito', 'baja' (falló y bajó un nivel) o 'falla'
  function encantar(o, bendecir) {
    const c = costeEncantar(o, bendecir); pagar(c); contarMision('encantar');
    if (rnd() * 100 < c.prob) { o.enc++; o.fallos = 0; return 'exito'; }
    o.fallos = (o.fallos || 0) + 1;   // la racha sigue aunque baje de nivel: la protección no se pierde
    if (degradaAl(o.enc) && !bendecir && rnd() < PROB_DEGRADAR) { o.enc--; return 'baja'; }
    return 'falla';
  }
  // Desguace: el equipo que no sirve se convierte en Polvo de almas (las comunes dan oro)
  const ALMAS_DESGUACE = { comun: 0, rara: 1, epica: 3, legendaria: 8, mitica: 20, ancestral: 50 };
  const almasDe = o => ALMAS_DESGUACE[modelo[o.modelo].rareza] + Math.floor((o.enc || 0) / 3);
  function desguazar(lista) {
    let almas = 0, oro = 0;
    for (const o of lista) { const a = almasDe(o); if (a) almas += a; else oro += RAREZAS[modelo[o.modelo].rareza].venta; }
    const ids = new Set(lista.map(o => o.uid));
    jugador.objetos = jugador.objetos.filter(o => !ids.has(o.uid));
    jugador.mat.almas = (jugador.mat.almas || 0) + almas; jugador.oro += oro;
    return { almas, oro };
  }
  const COSTE_REFINAR = { polvo: 1, oro: 100 };
  // Conversión: las piedras sobran en el juego medio-tardío y las almas escasean. 40 piedras + 500 oro → 1 alma (a propósito
  // cara: es la red de seguridad cuando no sale equipo para desguazar, no la vía principal).
  const CONVERTIR_ALMA = { piedra: 40, oro: 500 };
  // Refinar y pulir pagan y devuelven la línea candidata; el jugador decide si la acepta (o.lineas[i] = candidata)
  const refinar = o => { pagar(COSTE_REFINAR); return { a: elegir(modelo[o.modelo].jefe ? Object.keys(SECUNDARIOS) : POOL_EXTRAS), e: estrellasRefino(o) }; };   // equipo de jefe: secundarios, como al crearse
  const pulirLinea = (o, i) => { pagar(COSTE_PULIR); return { a: o.lineas[i].a, e: estrellasRefino(o) }; };
  // Pulir: vuelve a sortear solo las estrellas de una línea (mismo atributo); para terminar una pieza casi perfecta.
  const COSTE_PULIR = { polvo: 3, oro: 300 };
  // Garantía: tras 9 sorteos (refinar o pulir) sin sacar ★4 o más en un objeto, el siguiente sale ★4 o ★5.
  const GARANTIA_REFINAR = 10;
  function estrellasRefino(o) {
    o.sinBuena = (o.sinBuena || 0) + 1;
    const e = o.sinBuena >= GARANTIA_REFINAR ? (rnd() < .28 ? 5 : 4) : sortearEstrellas();
    if (e >= 4) o.sinBuena = 0;
    return e;
  }
  const MATERIALES = { piedra: '🔷 Piedra de encantamiento', polvo: '✨ Polvo de refinamiento', almas: '💠 Polvo de almas', esencia: '🌟 Esencia' };
  // Qué es cada material, para qué sirve y dónde conseguirlo (se ve al tocar su icono en la barra o en el inventario)
  const INFO_MATERIALES = {
    piedra: { uso: 'Encantar equipo.', fuente: 'Campaña, Calabozo, Torre, misiones y login.' },
    polvo:  { uso: 'Refinar líneas de equipo, mejorar runas.', fuente: 'Arena, botín de campaña, Torre, jefes mundiales, misiones y login.' },
    almas:  { uso: 'Encantar desde +10 y bendecir.', fuente: 'Torre, desguace, misiones, Torre de reyes, login y piedras convertidas.' },
    esencia: { uso: 'Subir el aura.', fuente: 'Etapas 2 y 3 de la campaña, calabozos 5-8 y la Torre desde el piso 100.' },
  };
  const infoMaterial = k => ui.mensaje(`${MATERIALES[k]}

Uso: ${INFO_MATERIALES[k].uso}
Fuente: ${INFO_MATERIALES[k].fuente}`);

  // Catálogo de modelos (forma + color + rareza). Un objeto del inventario es un modelo con atributos sorteados.
  const MODELOS = [
    { id: 'casco_hierro',  nombre: 'Casco de hierro',    ranura: 'casco',    color: METAL.hierro,    rareza: 'comun' },
    { id: 'casco_rojo',    nombre: 'Casco carmesí',      ranura: 'casco',    color: METAL.rojo,      rareza: 'rara' },
    { id: 'casco_oro',     nombre: 'Casco dorado',       ranura: 'casco',    color: METAL.oro,       rareza: 'epica' },
    { id: 'casco_obs',     nombre: 'Casco de obsidiana', ranura: 'casco',    color: METAL.obsidiana, rareza: 'legendaria' },
    { id: 'arm_hierro',    nombre: 'Armadura de hierro', ranura: 'armadura', color: METAL.hierro,    rareza: 'comun' },
    { id: 'arm_azul',      nombre: 'Armadura azur',      ranura: 'armadura', color: METAL.azul,      rareza: 'rara' },
    { id: 'arm_oro',       nombre: 'Armadura dorada',    ranura: 'armadura', color: METAL.oro,       rareza: 'epica' },
    { id: 'arm_obs',       nombre: 'Armadura obsidiana', ranura: 'armadura', color: METAL.obsidiana, rareza: 'legendaria' },
    { id: 'esp_acero',     nombre: 'Espada de acero',    ranura: 'espada',   color: METAL.hierro,    rareza: 'comun' },
    { id: 'esp_esmeralda', nombre: 'Espada esmeralda',   ranura: 'espada',   color: METAL.esmeralda, rareza: 'rara' },
    { id: 'esp_oro',       nombre: 'Espada dorada',      ranura: 'espada',   color: METAL.oro,       rareza: 'epica' },
    { id: 'esp_sangre',    nombre: 'Espada sangrienta',  ranura: 'espada',   color: METAL.rojo,      rareza: 'legendaria' },
    { id: 'capa_roja',     nombre: 'Capa roja',          ranura: 'capa',     color: TELA.roja,       rareza: 'comun' },
    { id: 'capa_azul',     nombre: 'Capa azul',          ranura: 'capa',     color: TELA.azul,       rareza: 'rara' },
    { id: 'capa_verde',    nombre: 'Capa verde',         ranura: 'capa',     color: TELA.verde,      rareza: 'rara' },
    { id: 'capa_purpura',  nombre: 'Capa púrpura',       ranura: 'capa',     color: TELA.purpura,    rareza: 'epica' },
    { id: 'capa_negra',    nombre: 'Capa negra',         ranura: 'capa',     color: TELA.negra,      rareza: 'epica' },
    { id: 'capa_blanca',   nombre: 'Capa blanca',        ranura: 'capa',     color: TELA.blanca,     rareza: 'legendaria' },
    { id: 'casco_antiguo', nombre: 'Yelmo de los Antiguos',  ranura: 'casco',    color: METAL.ancestral, rareza: 'ancestral' },
    { id: 'arm_antiguo',   nombre: 'Coraza de los Antiguos', ranura: 'armadura', color: METAL.ancestral, rareza: 'ancestral' },
    { id: 'esp_antigua',   nombre: 'Hoja de los Antiguos',   ranura: 'espada',   color: METAL.ancestral, rareza: 'ancestral' },
    { id: 'capa_antigua',  nombre: 'Manto de los Antiguos',  ranura: 'capa',     color: TELA.ancestral,  rareza: 'ancestral' },
    { id: 'casco_abismo',  nombre: 'Yelmo del abismo',   ranura: 'casco',    color: METAL.abismo,    rareza: 'mitica' },
    { id: 'arm_abismo',    nombre: 'Coraza del abismo',  ranura: 'armadura', color: METAL.abismo,    rareza: 'mitica' },
    { id: 'esp_caos',      nombre: 'Espada del caos',    ranura: 'espada',   color: METAL.abismo,    rareza: 'mitica' },
    { id: 'capa_abismo',   nombre: 'Manto del abismo',   ranura: 'capa',     color: TELA.abismo,     rareza: 'mitica' },
    // Equipo exclusivo de jefes mundiales (no sale en cofres): mítico, con 3 líneas extra solo de atributos secundarios
    { id: 'esp_cerbero',   nombre: 'Colmillo ardiente',      ranura: 'espada',   color: 'sepia(1) saturate(6) hue-rotate(-30deg)',  rareza: 'mitica', jefe: 'cerbero' },
    { id: 'capa_cerbero',  nombre: 'Manto del inframundo',   ranura: 'capa',     color: 'sepia(1) saturate(5) hue-rotate(-40deg) brightness(.7)', rareza: 'mitica', jefe: 'cerbero' },
    { id: 'casco_asmodeo', nombre: 'Cuernos del pacto',      ranura: 'casco',    color: 'sepia(1) saturate(4) hue-rotate(230deg)', rareza: 'mitica', jefe: 'asmodeo' },
    { id: 'capa_asmodeo',  nombre: 'Alas demoníacas',        ranura: 'capa',     color: 'sepia(1) saturate(4) hue-rotate(250deg) brightness(.75)', rareza: 'mitica', jefe: 'asmodeo' },
    { id: 'esp_minotauro', nombre: 'Hacha del Minotauro',    ranura: 'espada',   color: 'sepia(1) saturate(2.5) hue-rotate(-10deg) brightness(.9)', rareza: 'mitica', jefe: 'minotauro' },
    { id: 'arm_minotauro', nombre: 'Coraza del laberinto',   ranura: 'armadura', color: 'sepia(1) saturate(2) hue-rotate(-15deg) brightness(.8)', rareza: 'mitica', jefe: 'minotauro' },
    // piezas para completar cada set de 4 (casco, armadura, espada y capa por jefe)
    { id: 'casco_cerbero', nombre: 'Yelmo de tres fauces',   ranura: 'casco',    color: 'sepia(1) saturate(6) hue-rotate(-30deg) brightness(.85)', rareza: 'mitica', jefe: 'cerbero' },
    { id: 'arm_cerbero',   nombre: 'Peto de ceniza',         ranura: 'armadura', color: 'sepia(1) saturate(5) hue-rotate(-35deg) brightness(.75)', rareza: 'mitica', jefe: 'cerbero' },
    { id: 'esp_asmodeo',   nombre: 'Hoja del pacto',         ranura: 'espada',   color: 'sepia(1) saturate(4) hue-rotate(240deg)', rareza: 'mitica', jefe: 'asmodeo' },
    { id: 'arm_asmodeo',   nombre: 'Coraza infernal',        ranura: 'armadura', color: 'sepia(1) saturate(4) hue-rotate(235deg) brightness(.7)', rareza: 'mitica', jefe: 'asmodeo' },
    { id: 'casco_minotauro', nombre: 'Astas de bronce',      ranura: 'casco',    color: 'sepia(1) saturate(2.5) hue-rotate(-10deg) brightness(.85)', rareza: 'mitica', jefe: 'minotauro' },
    { id: 'capa_minotauro',  nombre: 'Manto del laberinto',  ranura: 'capa',     color: 'sepia(1) saturate(2) hue-rotate(-15deg) brightness(.7)', rareza: 'mitica', jefe: 'minotauro' },
  ];
  const modelo = Object.fromEntries(MODELOS.map(m => [m.id, m]));

  // Crea un objeto con líneas de atributo y estrellas sorteadas según su ranura y rareza
  let sigUid = 1;
  function sortearEstrellas() {
    let t = rnd() * 100;
    for (let e = 1; e <= 5; e++) { if (t < PROB_ESTRELLAS[e]) return e; t -= PROB_ESTRELLAS[e]; }
    return 1;
  }
  function crearObjeto(idModelo, basico) {
    const m = modelo[idModelo], r = RAREZAS[m.rareza];
    const lineas = LINEAS_RANURA[m.ranura].map(a => ({ a, e: basico ? 2 : sortearEstrellas() }));
    const pool = m.jefe ? Object.keys(SECUNDARIOS) : POOL_EXTRAS;   // equipo de jefe: todas sus líneas extra son secundarias
    for (let i = 0; i < r.extras; i++) lineas.push({ a: elegir(pool), e: sortearEstrellas() });
    return { uid: sigUid++, modelo: idModelo, enc: 0, lineas };
  }
  // Valor de una línea y totales del objeto (incluye el encantamiento)
  const valorLinea = (o, l, enc = o.enc) => {
    const v = UNIDAD[l.a] * RAREZAS[modelo[o.modelo].rareza].mult * ESTRELLA[l.e] * (l.a in SECUNDARIOS ? 1 : 1 + ENC_PORCENTAJE * enc);   // el encantamiento solo sube los atributos base
    return l.a in SECUNDARIOS ? Math.max(.1, Math.round(v * 10) / 10) : Math.max(1, Math.round(v));   // secundarios: % con un decimal
  };
  function valores(o, enc = o.enc) {
    const m = modelo[o.modelo], t = {};
    for (const l of o.lineas) t[l.a] = (t[l.a] || 0) + valorLinea(o, l, enc);
    const pr = PRINCIPAL[m.ranura];
    if (enc) t[pr] = (t[pr] || 0) + Math.round(ENC_PRINCIPAL[pr] * RAREZAS[m.rareza].mult * enc);
    return t;
  }
  // Calidad de un objeto según las estrellas de todas sus líneas (1★ = 0 %, 5★ = 100 %). Le da sentido a refinar
  // una pieza "casi perfecta" aunque otra tenga más Poder bruto.
  const CALIDADES = [[100, 'Perfecta', '#ff5ce1'], [85, 'Casi perfecta', '#ffb02e'], [65, 'Excelente', '#a970ff'], [45, 'Buena', '#4fc3ff'], [25, 'Decente', '#8adf3c'], [0, 'Mala', '#999']];
  const pctCalidad = o => Math.round(o.lineas.reduce((t, l) => t + l.e - 1, 0) / (4 * o.lineas.length) * 100);
  const calidadObj = o => { const p = pctCalidad(o); return CALIDADES.find(([min]) => p >= min); };
  const etiquetaCalidad = o => { const [, n, c] = calidadObj(o); return `<span class="calidad" style="color:${c}">${n} · ${pctCalidad(o)} %</span>`; };
  const estrellas = e => `<span class="est">${'★'.repeat(e)}<i>${'★'.repeat(5 - e)}</i></span>`;
  const nombreObj = o => modelo[o.modelo].nombre + (o.enc ? ` <span class="enc">+${o.enc}</span>` : '');
