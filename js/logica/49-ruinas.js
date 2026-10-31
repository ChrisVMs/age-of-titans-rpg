  // ---------------- Ruinas del campamento ----------------
  // Edificios que se reconstruyen con oro y piedra (sin esperas): producen por hora aunque no juegues, hasta llenar el
  // almacén (HORAS_ALMACEN, más con el Almacén), y dan un bono pequeño. El tiempo es el del juego (ahoraJuego), así que
  // las pruebas lo adelantan sin esperar; si el reloj va hacia atrás no se produce nada. Añadir un edificio = una entrada.
  const EDIFICIO_MAX = 10, HORAS_ALMACEN = 8;
  // prod: por hora y nivel (oro escala con tu nivel) · bono: { st: atributo } o { oro } o { encantar } o { almacen }, por nivel
  const EDIFICIOS = [
    { id: 'tesoreria', img: 'oro', icono: '💰', nombre: 'Tesorería',         nivel: 5,  prod: { oro: n => 3 * jugador.nivel * n }, bono: { oro: .005 }, txt: 'oro de las batallas' },
    { id: 'almacen', img: 'inventario',   icono: '📦', nombre: 'Almacén',           nivel: 10, prod: {}, bono: { almacen: .8 }, txt: 'horas de almacén' },
    { id: 'forja', img: 'herreria',     icono: '🔨', nombre: 'Forja',             nivel: 8,  prod: { piedra: n => .5 * n }, bono: { encantar: .01 }, txt: 'menos oro al encantar' },
    { id: 'alquimia', img: 'mat_polvo',  icono: '⚗️', nombre: 'Laboratorio',       nivel: 15, prod: { polvo: n => .1 * n }, bono: { st: 'defensa', pct: .3 }, txt: 'defensa' },
    { id: 'altar', img: 'mat_almas',     icono: '🕯️', nombre: 'Altar de almas',    nivel: 25, prod: { almas: n => .04 * n }, bono: { st: 'vida', pct: .3 }, txt: 'vida' },
    { id: 'pozo', img: 'mat_esencia',      icono: '🌟', nombre: 'Pozo de Esencia',   nivel: 50, prod: { esencia: n => .02 * n }, bono: {}, txt: '' },
  ];
  const costeEdificio = n => ({ oro: 20000 * (n + 1) ** 2, piedra: 20 * (n + 1) });   // de n a n + 1
  const ruinas = () => jugador.ruinas ||= { niveles: {}, ultimo: ahoraJuego().getTime(), resto: {} };
  const nivelEdificio = id => ruinas().niveles[id] || 0;
  const edificioAbierto = e => jugador.nivel >= e.nivel || (jugador.ascension || 0) > 0;
  const horasAlmacen = () => HORAS_ALMACEN + nivelEdificio('almacen') * EDIFICIOS.find(e => e.id === 'almacen').bono.almacen;
  // bonos: % de atributos (para estadisticas), oro de batalla y descuento al encantar (fracciones)
  function statsRuinas() { const t = {}; for (const e of EDIFICIOS) if (e.bono.st && nivelEdificio(e.id)) t[e.bono.st] = (t[e.bono.st] || 0) + e.bono.pct * nivelEdificio(e.id); return t; }
  const bonoRuinas = k => EDIFICIOS.reduce((s, e) => s + (e.bono[k] || 0) * nivelEdificio(e.id), 0);
  const horasProducidas = () => { const R = ruinas(), ahora = ahoraJuego().getTime(); if (ahora < R.ultimo) R.ultimo = ahora; return Math.min(horasAlmacen(), (ahora - R.ultimo) / 36e5); };
  // lo acumulado (con decimales) desde la última recogida
  function produccionRuinas(h = horasProducidas()) {
    const t = {}; for (const e of EDIFICIOS) { const n = nivelEdificio(e.id); if (n) for (const [k, f] of Object.entries(e.prod)) t[k] = (t[k] || 0) + f(n) * h; } return t;
  }
  const llenadoRuinas = () => horasProducidas() / horasAlmacen();   // 0..1
  function recogerRuinas() {   // cobra lo entero y guarda los decimales; devuelve lo cobrado
    const R = ruinas(), p = produccionRuinas(), pr = {};
    for (const [k, v] of Object.entries(p)) { const x = v + (R.resto[k] || 0); pr[k] = Math.floor(x); R.resto[k] = x - pr[k]; }
    R.ultimo = ahoraJuego().getTime(); darPremio(pr); return pr;
  }
  function mejorarEdificio(id) {
    const e = EDIFICIOS.find(x => x.id === id), n = nivelEdificio(id), c = costeEdificio(n);
    if (!e || !edificioAbierto(e) || n >= EDIFICIO_MAX || !tieneCoste(c)) return false;
    recogerRuinas(); pagar(c); ruinas().niveles[id] = n + 1; return true;   // recoge antes: lo producido iba al ritmo anterior
  }
