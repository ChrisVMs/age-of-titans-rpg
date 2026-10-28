  // Estado de la batalla en curso (vidas, estados, contadores de habilidades de jefes, botín...). Todo junto en un objeto
  // para poder reiniciarlo, guardarlo o simular batallas aparte de la pantalla. Cada parte define sus campos donde se usa.
  const batalla = {};
  let simulando = false;   // el simulador juega sobre una copia de la partida: mientras tanto no se guarda ni se avisa nada
  let campListo = false;   // el campamento se pinta cuando todo el juego está definido
  // Modo pruebas: solo en el equipo de desarrollo. Abriendo el archivo directamente (file://), o en un servidor local
  // en 127.0.0.1 con ?pruebas. En la web desplegada (https://dominio) y en la app Android (https://localhost) nunca se
  // activa, aunque alguien añada ?pruebas a la URL: no hay botones de prueba y la partida empieza con valores reales.
  const MODO_PRUEBAS = location.protocol === 'file:' || (location.hostname === '127.0.0.1' && new URLSearchParams(location.search).has('pruebas'));
  // Pantallas grandes en horizontal (escritorio, tablet): el juego se dibuja a ALTO_DISENO px de alto, como en un móvil
  // en horizontal, y se amplía entero para llenar la ventana; así se ve igual que en el móvil pero grande, no diminuto.
  const ALTO_DISENO = 412;
  // Orientación elegida por el jugador (botón del Campamento): auto, horizontal o vertical. Se pide al sistema que gire
  // la pantalla (screen.orientation.lock); si no se deja (navegador de escritorio, WebView con la orientación fija),
  // el lienzo se adapta: en vertical con la ventana horizontal se dibuja un móvil vertical centrado, y en horizontal
  // con la ventana vertical el juego se gira 90° para jugar con el móvil de lado.
  const ORIENTACIONES = ['auto', 'horizontal', 'vertical'];
  let orientacion = 'auto';
  try { const o = localStorage.getItem('batalla.orientacion'); if (ORIENTACIONES.includes(o)) orientacion = o; } catch {}
  function bloquearOrientacion() {
    const so = screen.orientation;
    if (!so) return;
    if (orientacion === 'auto') { try { so.unlock(); } catch {} return; }
    if (so.lock) so.lock(orientacion === 'vertical' ? 'portrait' : 'landscape').catch(() => {});
  }
  // Versión del juego: subirla en cada entrega (y la misma en BATALLA-MOBILE: package.json y android/app/build.gradle)
  const VERSION_JUEGO = '0.2.1';
  let VELOCIDAD = 1, velElegida = 1;   // avance rápido en batalla: divide todas las esperas (velElegida: la del jugador)
  const wait = ms => new Promise(r => setTimeout(r, ms / VELOCIDAD));
  // Azar del juego: todo pasa por rnd(). Por defecto es Math.random; con sembrar(n) la secuencia se repite igual (misma
  // semilla → misma batalla), para reproducir un fallo o comparar antes y después de un cambio. sembrar() vuelve al normal.
  // Los sonidos sortean aparte (elegirSonido) para no mover la secuencia del juego.
  let rnd = Math.random;
  function sembrar(semilla) {
    if (semilla == null) { rnd = Math.random; return; }
    let s = semilla >>> 0;
    rnd = () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const azar = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const elegir = lista => lista[Math.floor(rnd() * lista.length)];
  const elegirSonido = lista => lista[Math.floor(Math.random() * lista.length)];
  // Desbloqueo por nivel: el juego se abre poco a poco ("¡Arena desbloqueada!") en vez de enseñar todo de golpe.
  // Claves: pantallas (data-ir) y partes de pantalla. Quien ya pasó el nivel (o ascendió) lo tiene abierto (también en pruebas).
  const DESBLOQUEOS = {
    pHerreria: [3, 'Herrería'], pMascota: [5, 'Mascotas'], mascota: [5, 'Mascotas'], pArbol: [8, 'Habilidades'], pTorre: [10, 'Torre'],
    refinar: [12, 'Refinar y pulir'], pArena: [15, 'Arena'], pRunas: [18, 'Runas y reliquias'], expedicion: [18, 'Expediciones'],
    skins: [20, 'Skins'], titulos: [20, 'Títulos'], pColeccion: [20, 'Colección'], pCalabozo: [25, 'Calabozo multijugador'],
    pEvento: [30, 'Jefes mundiales'], pReyes: [35, 'Torre de reyes'],
  };
  const nivelDesbloqueo = id => (DESBLOQUEOS[id] || [0])[0];
  const desbloqueado = id => !DESBLOQUEOS[id] || jugador.nivel >= DESBLOQUEOS[id][0] || (jugador.ascension || 0) > 0;
  const avisoBloqueo = id => avisar(`🔒 ${DESBLOQUEOS[id][1]}: se desbloquea en el nivel ${DESBLOQUEOS[id][0]}`);
  // Mensaje que solo se cierra con OK (mismo diálogo que confirmar, sin botón de cancelar). Se encadenan si llegan varios.
  let colaMensaje = Promise.resolve();

  // ---------------- Equipo del guerrero por capas ----------------
  // Cada ranura es una tira de 12 cuadros que encaja sobre las demás. Un objeto = ranura + tira + color.
  // El color es un filtro CSS (lo calcula la GPU, barato en móvil), así que la mayoría de objetos
  // nuevos son solo una línea de datos. Un objeto con otra forma solo necesita su propia tira.
  const G = 'img/guerrero/';
  const RANURAS = {   // orden de dibujo = orden aquí. Toda ranura lleva siempre un objeto
    capa:     { nombre: 'Capa',     tira: G + 'tela.png',     icono: 'img/iconos/capa.svg' },
    armadura: { nombre: 'Armadura', tira: G + 'armadura.png', icono: 'img/iconos/armadura.svg' },
    adornos:  { nombre: '',         tira: G + 'adornos.png', interna: true },   // ribetes: siempre visibles
    casco:    { nombre: 'Casco',    tira: G + 'casco.png',    icono: 'img/iconos/casco.svg' },
    espada:   { nombre: 'Espada',   tira: G + 'espada.png',   icono: 'img/iconos/espada.svg' },
  };
  // filtros de objetos por ranura: solo el icono (el nombre va en el title)
  const iconoFiltro = r => r === 'todos' ? '<span class="ic-filtro">🎒</span>' : `<img class="ic-filtro" src="${RANURAS[r].icono}" alt="${RANURAS[r].nombre}">`;
  const METAL = {
    hierro: '', oro: 'sepia(1) saturate(2.6) hue-rotate(-5deg) brightness(1.15)',
    rojo: 'sepia(1) saturate(4) hue-rotate(-45deg) brightness(.95)', azul: 'sepia(1) saturate(3) hue-rotate(180deg) brightness(.95)',
    obsidiana: 'brightness(.5) contrast(1.25)', esmeralda: 'sepia(1) saturate(3) hue-rotate(85deg)',
    abismo: 'sepia(1) saturate(7) hue-rotate(-40deg) brightness(.75) contrast(1.4)',
  };
  const TELA = {
    roja: '', azul: 'hue-rotate(225deg)', verde: 'hue-rotate(120deg)', purpura: 'hue-rotate(275deg)',
    negra: 'grayscale(1) brightness(.55)', blanca: 'grayscale(1) brightness(1.9)', abismo: 'saturate(2.4) brightness(.7) contrast(1.3)',
  };

  // ---------------- Atributos, estrellas y rarezas ----------------
  // Un objeto tiene líneas de atributo { a: 'ataque', e: 1..5 estrellas }. Valor de una línea =
  // UNIDAD del atributo x multiplicador de rareza x factor de sus estrellas.
  const ATRIBUTOS = { ataque: 'Ataque', defensa: 'Defensa', vida: 'Vida', armadura: 'Armadura' };
  // Atributos secundarios (en %): salen como líneas extra del equipo y se suman a los efectos de skins y árbol.
  const SECUNDARIOS = { critico: 'Prob. crítico', danoCritico: 'Daño crítico', penetracion: 'Penetración', reduccion: 'Reducción de daño',
                        resistencia: 'Resistencia', habilidad: 'Daño de habilidades', jefes: 'Daño a jefes', experiencia: 'Experiencia extra' };
  // Otros efectos de combate (solo skins y árbol): se muestran si tienes alguno
  const OTROS_EFECTOS = { esquiva: 'Esquiva', robo: 'Robo de vida', contra: 'Contraataque', remate: 'Remate (<50 %)', curacion: 'Curación', oro: 'Oro extra', fortuna: 'Fortuna (drops)' };
  const BASE_SEC = { critico: .05 };                       // todo guerrero tiene un 5 % de crítico
  const DANO_CRITICO_BASE = 1.5;                           // un crítico hace ×1,5 (+ daño crítico)
  const TOPE_SEC = { experiencia: .5, critico: .5, danoCritico: 1.5, penetracion: .6, reduccion: .6, resistencia: .75, habilidad: 1, jefes: 1, esquiva: .4, fortuna: .3,
                     robo: .25, contra: .35, remate: .5, curacion: 1 };   // sin tope, robo y contraataque apilados volvían inmortal al personaje
  const UNIDAD = { ataque: 4, defensa: 1.5, vida: 10, armadura: 10,
                   critico: .8, danoCritico: 3, penetracion: 1.5, reduccion: .6, resistencia: 2, habilidad: 1.5, jefes: 1.5, experiencia: 1 };
  // Líneas extra al azar: los atributos base salen el doble que cada secundario
  const POOL_EXTRAS = ['ataque', 'defensa', 'vida', 'armadura', 'ataque', 'defensa', 'vida', 'armadura', ...Object.keys(SECUNDARIOS)];
  const nombreAtr = a => ATRIBUTOS[a] || SECUNDARIOS[a];
  const fmtAtr = (a, v) => a in SECUNDARIOS ? `${Math.round(v * 10) / 10}%` : v;
  const ESTRELLA = [0, .6, .8, 1, 1.25, 1.6];        // factor por estrellas (1 = escala más baja, 5 = la más alta)
  const PROB_ESTRELLAS = [0, 30, 30, 22, 13, 5];     // % al sortear (cofres y refinamiento)
  const RAREZAS = {
    comun:      { nombre: 'Común',      mult: 1,   extras: 0, venta: 10 },
    rara:       { nombre: 'Rara',       mult: 1.6, extras: 0, venta: 40 },
    epica:      { nombre: 'Épica',      mult: 2.4, extras: 1, venta: 120 },
    legendaria: { nombre: 'Legendaria', mult: 3.5, extras: 2, venta: 350 },
    mitica:     { nombre: 'Mítica',     mult: 5,   extras: 3, venta: 1000 },   // la más rara (solo en cofres de hierro y dorados)
  };
  // Líneas con las que nace cada tipo de pieza (las épicas y legendarias suman líneas extra al azar)
  const LINEAS_RANURA = { espada: ['ataque'], casco: ['defensa', 'vida'], armadura: ['armadura', 'vida'], capa: ['vida', 'defensa'] };
  // Atributo base de cada pieza: el encantamiento le suma un valor fijo por nivel
  const PRINCIPAL = { espada: 'ataque', casco: 'defensa', armadura: 'armadura', capa: 'vida' };

  // ---------------- Encantamiento (+1 ... +20) y refinamiento ----------------
  // Tope de encantamiento según rareza
  const ENC_MAX = { comun: 12, rara: 15, epica: 20, legendaria: 20, mitica: 25 };
  const encMax = o => ENC_MAX[modelo[o.modelo].rareza];
  const ENC_PRINCIPAL = { ataque: 1.5, defensa: .6, vida: 5, armadura: 4 };   // por nivel, x rareza: fortalece el atributo base
  const ENC_PORCENTAJE = .04;                                                // por nivel: +4 % a todas las líneas
  // Éxito según el nivel al que se sube: hasta +9 siempre; +10..+12 60 %; +13..+15 35 %; +16..+20 22 %; +21..+25 10 %.
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
  const ALMAS_DESGUACE = { comun: 0, rara: 1, epica: 3, legendaria: 8, mitica: 20 };
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
  const MATERIALES = { piedra: '🔷 Piedra de encantamiento', polvo: '✨ Polvo de refinamiento', almas: '💠 Polvo de almas' };
  // Qué es cada material, para qué sirve y dónde conseguirlo (se ve al tocar su icono en la barra o en el inventario)
  const INFO_MATERIALES = {
    piedra: { uso: 'Encantar equipo.', fuente: 'Campaña, Calabozo, Torre, misiones y login.' },
    polvo:  { uso: 'Refinar líneas de equipo, mejorar runas.', fuente: 'Arena, botín de campaña, Torre, jefes mundiales, misiones y login.' },
    almas:  { uso: 'Encantar desde +10 y bendecir.', fuente: 'Torre, desguace, misiones, Torre de reyes, login y piedras convertidas.' },
  };
  const infoMaterial = k => mensaje(`${MATERIALES[k]}

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

  // ---------------- Progreso del jugador (se guarda en el navegador) ----------------
  const CLAVE = 'batalla.partida.v3';   // v3: objetos con líneas, estrellas y encantamiento
  const ORO_INICIAL = MODO_PRUEBAS ? 10000 : 3000;   // da para abrir los primeros cofres y pasar el bache de 1-4
  const ESTAMINA_MAX = 150, ESTAMINA_CAMPANA = 10;   // se recarga entera cada día
  const MAT_INICIAL = MODO_PRUEBAS ? { piedra: 300, polvo: 100, almas: 50 } : { piedra: 20, polvo: 5, almas: 0 };
  let jugador, titulosListos = false;   // titulosListos: hasta que se definan los títulos, guardar no los revisa
  function partidaNueva() {
    const basicos = ['casco_hierro', 'arm_hierro', 'esp_acero', 'capa_roja'].map(id => crearObjeto(id, true));
    return { nivel: 1, xp: 0, oro: ORO_INICIAL, mat: { ...MAT_INICIAL }, estamina: ESTAMINA_MAX, diaEstamina: hoy(), sigUid, objetos: basicos,
             equipado: Object.fromEntries(basicos.map(o => [modelo[o.modelo].ranura, o.uid])) };
  }
  function cargar() {
    try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.objetos) { jugador = g; sigUid = g.sigUid; return; } } catch {}
    jugador = partidaNueva();
  }
  // Una sola pestaña a la vez: la que se abre avisa por un canal compartido; si ya había otra, esta queda bloqueada
  // (sin guardar nada) hasta que el jugador elige "Jugar aquí", que bloquea la otra y recarga esta con la partida al día.
  let pestanaBloqueada = false;
  const idPestana = Math.random().toString(36).slice(2);
  const canalPestanas = 'BroadcastChannel' in window ? new BroadcastChannel('batalla-pestanas') : null;
  function guardar() {
    if (pestanaBloqueada || simulando) return;   // la pestaña duplicada nunca escribe la partida
    jugador.sigUid = sigUid; jugador.version = VERSION_JUEGO;   // la partida recuerda con qué versión se guardó (para migraciones)
    if (titulosListos) revisarTitulos();
    try { localStorage.setItem(CLAVE, JSON.stringify(jugador)); }
    catch { if (!guardar.aviso) { guardar.aviso = true; setTimeout(() => avisar('⚠ No se pudo guardar la partida: almacenamiento lleno'), 0); } }
  }
  // Fecha local: al cambiar de día la estamina vuelve al máximo
  // Fecha del juego. En modo pruebas, el botón "Día X +" adelanta días (offset guardado aparte de la partida) para probar
  // reinicios diarios y semanales: misiones, login, estamina, entradas, eventos…
  const DIA_PRUEBA = 'batalla.diaPrueba';
  let offsetDias = 0; try { offsetDias = MODO_PRUEBAS ? +localStorage.getItem(DIA_PRUEBA) || 0 : 0; } catch {}
  const ahoraJuego = () => new Date(Date.now() + offsetDias * 86400000);
  function hoy() { const d = ahoraJuego(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function revisarEstamina() {
    const ahora = Date.now();
    if (jugador.vistoMax && ahora < jugador.vistoMax - 10 * 60 * 1000) return;   // reloj atrasado: no recarga (adelantarlo solo se evita con servidor)
    jugador.vistoMax = Math.max(jugador.vistoMax || 0, ahora);
    if (jugador.diaEstamina !== hoy()) { jugador.estamina = ESTAMINA_MAX; jugador.diaEstamina = hoy(); guardar(); }
  }
  cargar();
  jugador.mat.almas ||= 0;   // partidas anteriores al Polvo de almas
  revisarEstamina();
  const objeto = uid => jugador.objetos.find(o => o.uid === uid);

  // Nivel y experiencia
  // Curva: rápida hasta el 30 (desbloqueos y primera semana); desde ahí ×1,03 por nivel para que el nivel siga siendo un
  // objetivo durante meses. Total a Nv 80: ~3,4 M de XP (antes 1,35 M, que se alcanzaba en 2-3 semanas).
  let CURVA_XP = 1.03;   // crecimiento por nivel desde el 30 (let: el simulador de progresión prueba otros valores)
  const xpParaSubir = n => Math.round(60 * Math.pow(n, 1.5) * (n > 30 ? CURVA_XP ** (n - 30) : 1));
  const NIVEL_MAX = 80;   // al llegar, la experiencia deja de acumularse
  jugador.nivel = Math.min(jugador.nivel, NIVEL_MAX);
  function ganar(oro, xp, mat = {}) {
    jugador.oro += oro; jugador.xp += xp;
    for (const k in mat) jugador.mat[k] += mat[k];
    while (jugador.nivel < NIVEL_MAX && jugador.xp >= xpParaSubir(jugador.nivel)) {
      jugador.xp -= xpParaSubir(jugador.nivel); jugador.nivel++;
      avisar(`¡Nivel ${jugador.nivel}!${jugador.nivel % 2 === 0 ? ' +1 punto de habilidad' : ''}`);
      const nuevos = [...new Set(Object.values(DESBLOQUEOS).filter(([n]) => n === jugador.nivel).map(([, t]) => t))];
      if (nuevos.length) setTimeout(() => mensaje(`🔓 ¡Nuevo desbloqueado!
${nuevos.join(' · ')}`), 1200);
    }
    if (jugador.nivel >= NIVEL_MAX) jugador.xp = 0;
    guardar(); pintarHud();
  }
  // Contadores de logros (para los títulos)
  function sumarLogro(k, n = 1) { jugador.logros ||= {}; jugador.logros[k] = (jugador.logros[k] || 0) + n; }

  // ---------------- Mascotas ----------------
  // Cada mascota da un bono pasivo (% sobre tus estadísticas) y una acción en batalla cada N turnos.
  // Se compra una vez con oro y se mejora hasta el nivel 10; solo una acompaña al guerrero.
  // Categorías de mascota, de la más común a la más rara. El precio sale de la categoría.
  const CAT_MASCOTA = {
    verde:   { nombre: 'Común',      color: '#4fd16a', precio: 1000 },
    azul:    { nombre: 'Rara',       color: '#4aa3ff', precio: 2500 },
    morado:  { nombre: 'Épica',      color: '#b45cff', precio: 5000 },
    naranja: { nombre: 'Legendaria', color: '#ff9f1a', precio: 9000 },
    rojo:    { nombre: 'Mítica',     color: '#ff3b3b', precio: 15000 },
  };
  // Cada mascota da un bono pasivo y una acción en batalla cada N turnos. Valores [nivel 1, +por nivel] (nivel máx. 10).
  //   bono: % a atributos base · ef: % a efectos (crítico, robo, reducción...) · accion: golpe (% de tu ataque) o cura (% de tu vida)
  //   accion.aplica: además del golpe, prob. de aplicar un estado (daño por turno = % de tu ataque)
  // Presupuesto aproximado por categoría (nivel 1): verde ~10 %, azul ~15 %, morado ~21 %, naranja ~28 %, rojo ~36 % en bonos,
  // y acciones más fuertes o más frecuentes. Sin hoja de sprites se dibuja el emoji.
  const MASCOTAS = [
    { id: 'rata', cat: 'verde', nombre: 'Rata de cripta', cara: '🐀', bono: { ataque: [4, 1] },
      accion: { tipo: 'golpe', turnos: 3, pct: [25, 3] }, desc: 'Mordisquea al enemigo' },
    { id: 'sapo', cat: 'verde', nombre: 'Sapo del pantano', cara: '🐸', bono: { vida: [5, 1.5] },
      accion: { tipo: 'golpe', turnos: 3, pct: [15, 2], aplica: { estado: 'veneno', prob: .4, turnos: 3, pct: .1 } }, desc: 'Escupe veneno' },
    { id: 'buho', cat: 'verde', nombre: 'Búho nocturno', cara: '🦉', bono: { defensa: [5, 1.5] },
      accion: { tipo: 'cura', turnos: 4, pct: [3, .5] }, desc: 'Te cura' },

    { id: 'lobo', cat: 'azul', nombre: 'Lobo sombrío', cara: '🐺', bono: { ataque: [8, 2] },
      accion: { tipo: 'golpe', turnos: 3, pct: [40, 5] }, desc: 'Muerde al enemigo' },
    { id: 'tortuga', cat: 'azul', nombre: 'Tortuga de piedra', cara: '🐢', bono: { armadura: [10, 2.5], vida: [5, 1] }, ef: { reduccion: [2, .4] },
      accion: { tipo: 'cura', turnos: 4, pct: [4, .5] }, desc: 'Te protege y cura' },
    { id: 'murcielago', cat: 'azul', nombre: 'Murciélago vampiro', cara: '🦇', bono: { ataque: [5, 1.5] }, ef: { robo: [2, .4] },
      accion: { tipo: 'golpe', turnos: 3, pct: [30, 4], aplica: { estado: 'sangrado', prob: .3, turnos: 3, pct: .15 } }, desc: 'Muerde y desangra' },

    { id: 'fenix', cat: 'morado', nombre: 'Fénix', cara: '🦅', hoja: { img: 'img/mascotas/fenix.png', ancho: 272, alto: 232, total: 26, ms: 59 },
      bono: { vida: [10, 3] },   // hoja: 26 cuadros del vídeo (sin repetidos, bucle sin salto)
      accion: { tipo: 'cura', turnos: 4, pct: [6, 1] }, desc: 'Te cura' },
    { id: 'pantera', cat: 'morado', nombre: 'Pantera sombría', cara: '🐆', bono: { ataque: [8, 2] }, ef: { critico: [3, .5] },
      accion: { tipo: 'golpe', turnos: 3, pct: [45, 5] }, desc: 'Zarpazo' },
    { id: 'golem', cat: 'morado', nombre: 'Gólem de hielo', cara: '🗿', bono: { defensa: [8, 2], armadura: [8, 2] },
      accion: { tipo: 'golpe', turnos: 4, pct: [30, 4], aplica: { estado: 'congelacion', prob: .35, turnos: 1 } }, desc: 'Golpe helado' },

    { id: 'dragon', cat: 'naranja', nombre: 'Dragón joven', cara: '🐉', bono: { ataque: [7, 1.8], vida: [7, 1.8] },
      accion: { tipo: 'golpe', turnos: 2, pct: [30, 4], aplica: { estado: 'quemadura', prob: .3, turnos: 2, pct: .2 } }, desc: 'Escupe fuego al enemigo' },
    { id: 'grifo', cat: 'naranja', nombre: 'Grifo real', cara: '🦁', bono: { ataque: [8, 2], vida: [8, 2] }, ef: { jefes: [5, 1] },
      accion: { tipo: 'golpe', turnos: 3, pct: [50, 6] }, desc: 'Embestida en picado' },
    { id: 'unicornio', cat: 'naranja', nombre: 'Unicornio celeste', cara: '🦄', bono: { vida: [12, 3] }, ef: { resistencia: [5, 1] },
      accion: { tipo: 'cura', turnos: 3, pct: [8, 1] }, desc: 'Te cura con su cuerno' },

    { id: 'hidra', cat: 'rojo', nombre: 'Hidra de tres cabezas', cara: '🐍', bono: { ataque: [12, 3], vida: [8, 2] },
      accion: { tipo: 'golpe', turnos: 2, pct: [40, 5], aplica: { estado: 'veneno', prob: .5, turnos: 3, pct: .15 } }, desc: 'Muerde con sus tres cabezas' },
    { id: 'leviatan', cat: 'rojo', nombre: 'Leviatán abisal', cara: '🐋', bono: { vida: [15, 3.5], armadura: [10, 2.5] }, ef: { reduccion: [5, 1] },
      accion: { tipo: 'cura', turnos: 3, pct: [8, 1] }, desc: 'Te envuelve en agua sanadora' },
    { id: 'can', cat: 'rojo', nombre: 'Can infernal', cara: '🐕', bono: { ataque: [12, 3] }, ef: { critico: [4, .6], danoCritico: [10, 2] },
      accion: { tipo: 'golpe', turnos: 2, pct: [55, 6], aplica: { estado: 'quemadura', prob: .4, turnos: 2, pct: .25 } }, desc: 'Muerde con llamas' },
  ].map(m => ({ ...m, precio: CAT_MASCOTA[m.cat].precio }));
  const MASCOTA_MAX = 10;
  const valorNivel = ([base, porNivel], n) => Math.round((base + porNivel * (n - 1)) * 10) / 10;   // [base, +por nivel]
  const costeMejora = (m, n) => Math.round(m.precio * .5 * n);
  // sprite animado (bucle de vuelo) o emoji si la mascota aún no tiene hoja
  function dibujoMascota(m, escala) {
    if (!m.hoja) return m.cara;
    const h = m.hoja;
    return `<div class="sprite-mascota" data-seq="${(h.secuencia || [...Array(h.total).keys()]).join(',')}" data-ancho="${h.ancho * escala}" style="width:${h.ancho * escala}px;height:${h.alto * escala}px;background:url(${h.img}) 0 0 / ${h.total * h.ancho * escala}px ${h.alto * escala}px no-repeat"></div>`;
  }
  let pasoMascota = 0;
  const mascotaActual = () => { const id = jugador.mascota; return id && MASCOTAS.find(m => m.id === id); };
  const nivelMascota = m => (jugador.mascotas || {})[m.id] || 0;
  function efectoMascota(esp) { const m = mascotaActual(); return m && m.ef && m.ef[esp] ? valorNivel(m.ef[esp], nivelMascota(m)) / 100 : 0; }
  // textos de bonos y efectos de una mascota a cierto nivel
  const bonosMascota = (m, n) => [...Object.entries(m.bono).map(([a, v]) => `+${valorNivel(v, n)}% ${ATRIBUTOS[a]}`),
    ...Object.entries(m.ef || {}).map(([a, v]) => `+${valorNivel(v, n)}% ${nombreEf(a)}`)];
  // Pantalla de mascotas: rejilla de iconos por categoría (todas a la vista) + ficha de la elegida al lado
  let mascSel = null;
  // comprar solo si no la tienes (antes reiniciaba su nivel a 1); mejorar solo si es tuya (sin dueño el coste era 0)
  function comprarMascota(m) {
    if (nivelMascota(m) > 0 || jugador.oro < m.precio) return false;
    jugador.oro -= m.precio; jugador.mascotas[m.id] = 1; jugador.mascota = jugador.mascota || m.id; return true;
  }
  function mejorarMascota(m) {
    const n = nivelMascota(m); if (!(n > 0 && n < MASCOTA_MAX && jugador.oro >= costeMejora(m, n))) return false;
    jugador.oro -= costeMejora(m, n); jugador.mascotas[m.id] = n + 1; return true;
  }

  // ---------------- Skins ----------------
  // Una skin solo cambia el aspecto del guerrero: tapa las capas del equipo (casco, armadura, espada, capa)
  // pero los stats siguen siendo los del equipo. Cada skin puede tener un bono propio en % (por definir).
  const VERSION_IMG = 10;   // súbelo al regenerar imágenes de skins: obliga al navegador a no usar la copia vieja
  // Cada skin: bono base por estrella (atributo, % por ★) + efecto especial (siempre activo) + color de su brillo.
  // Se compra en la Tienda (empieza en ★1) y se mejora hasta ★5; a ★5 el guerrero brilla con su color.
  const SKINS = [
    { id: 'egida_tormentosa',    nombre: 'Égida tormentosa',      icono: '⚡', base: ['ataque', 1],   esp: 'habilidad', valor: 5,   txt: 'daño de habilidades', color: '#4fc3ff' },
    { id: 'obsidiana_oscura',    nombre: 'Obsidiana oscura',      icono: '🌑', base: ['ataque', 1.5], esp: 'jefes',     valor: 7.5, txt: 'daño contra jefes',   color: '#8a5cff' },
    { id: 'guardian_espectral',  nombre: 'Guardián espectral',    icono: '👻', base: ['defensa', 1],  esp: 'reduccion', valor: 5,   txt: 'daño recibido', menos: true, color: '#5fe6e0' },
    { id: 'gendarme_mecanico',   nombre: 'Gendarme mecánico',     icono: '🤖', base: ['ataque', 1],   esp: 'contra',    valor: 5,   txt: 'prob. de contraataque', color: '#3fe08a' },
    { id: 'druida_verdial',      nombre: 'Druida verdial',        icono: '🌿', base: ['vida', 2],     esp: 'curacion',  valor: 10,  txt: 'curación recibida',   color: '#8adf3c' },
    { id: 'aurico_solar',        nombre: 'Áurico solar',          icono: '☀️', base: ['vida', 2],     esp: 'oro',       valor: 10,  txt: 'oro obtenido',        color: '#ffd84a' },
    { id: 'cristalino_amaranto', nombre: 'Cristalino amaranto',   icono: '💎', base: ['ataque', 1],   esp: 'critico',   valor: 5,   txt: 'prob. de crítico',    color: '#e05cff' },
    { id: 'infernal',            nombre: 'Infernal',              icono: '🔥', base: ['ataque', 1.5], esp: 'remate',    valor: 7.5, txt: 'daño a enemigos con <50% de vida', color: '#ff7a1a' },
    { id: 'caballero_muerte',    nombre: 'Caballero de la muerte', icono: '💀', base: ['ataque', 1],   esp: 'robo',      valor: 5,   txt: 'robo de vida',        color: '#b06cff' },
    { id: 'necro_guardian',      nombre: 'Necro-guardián',        icono: '☠️', base: ['vida', 2],     esp: 'resistencia', valor: 10, txt: 'resistencia a efectos negativos', color: '#e8dcae' },
  ].map(k => ({ ...k, anim: true, img: `img/skins/${k.id}.png?v=${VERSION_IMG}`, tira: `img/skins/anim/${k.id}.png?v=${VERSION_IMG}` }));
  const PRECIO_SKIN = 5000, COSTE_ESTRELLA = n => 3000 * n;   // compra (★1) y mejora ★n -> ★n+1
  const estrellasSkin = id => (jugador.skinsPropias || {})[id] || 0;
  const skinActual = () => { const k = SKINS.find(x => x.id === jugador.skin); return k && estrellasSkin(k.id) ? k : null; };
  const bonoSkinBase = k => k.base[1] * estrellasSkin(k.id);           // % del atributo base
  // efecto especial de la skin equipada (0 si no lo tiene)
  // El efecto especial crece con las estrellas: ★1 60 %, ★2 70 %, ★3 80 %, ★4 90 %, ★5 100 % (y brillo). Bonos pequeños:
  // dan identidad (Infernal daño, Cristalino crítico, Necro-guardián aguante, Áurico economía, Obsidiana jefes) sin ser obligatorias.
  const valorSkin = (k, n = estrellasSkin(k.id)) => Math.round(k.valor * (.5 + .1 * n) * 10) / 10;
  const efectoSkin = esp => { const k = skinActual(); return k && k.esp === esp ? valorSkin(k) / 100 : 0; };
  // Efecto total (fracción): base + skin + árbol + líneas secundarias del equipo, con tope
  // Mientras dura un cálculo de poder, lo que no cambia se calcula una vez (poder() pide unos 15 efectos y cada uno volvía a
  // recorrer el equipo y las colecciones): memo guarda esos resultados y se vacía al terminar.
  let memo = null;
  const memoizar = (k, f) => !memo ? f() : k in memo ? memo[k] : (memo[k] = f());
  const secEquipo = () => memoizar('secEquipo', secEquipoSinMemo);
  function secEquipoSinMemo() {
    const t = {};
    for (const uid of Object.values(jugador.equipado)) for (const [a, v] of Object.entries(valores(objeto(uid)))) if (a in SECUNDARIOS) t[a] = (t[a] || 0) + v;
    return t;
  }
  const efecto = esp => Math.min(TOPE_SEC[esp] ?? Infinity, (BASE_SEC[esp] || 0) + efectoSkin(esp) + efectoArbol(esp) + (secEquipo()[esp] || 0) / 100
    + efectoReliquias(esp) + efectoRunas(esp) + efectoColeccion(esp) + efectoMaestria(esp) + efectoMascota(esp) + (CLASES[jugador.clase].ef[esp] || 0) + efectoConjuntos(esp));
  const skinsDisponibles = () => SKINS.filter(k => estrellasSkin(k.id) > 0);
  let skinSel = null;   // skin seleccionada en la pestaña (tocar una no la equipa)
  const textoEstrellas = n => `<span class="est">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  function fichaSkin(k) {
    const n = estrellasSkin(k.id), puesta = jugador.skin === k.id;
    return `<div class="masc-actual" style="border-color:${k.color}">
      <img src="${k.img}" alt="" style="height:110px;image-rendering:pixelated">
      <h3 style="margin:0;color:${k.color}">${k.icono} ${k.nombre} ${textoEstrellas(n)}</h3>
      <div class="atributos" style="width:100%">
        <div><span>${ATRIBUTOS[k.base[0]]}</span><span>+${bonoSkinBase(k)}%</span></div>
        <div><span>Especial</span><span>${k.menos ? '−' : '+'}${valorSkin(k, Math.max(1, n))}% ${k.txt}</span></div>
        ${n < 5 ? `<div><span>En ★${Math.max(1, n) + 1}</span><span>+${k.base[1]}% ${ATRIBUTOS[k.base[0]].toLowerCase()} · especial ${valorSkin(k, Math.max(1, n) + 1)}%</span></div>` : '<div><span>★5</span><span>Brillo de poder</span></div>'}
      </div>
      <div class="fila">
        ${puesta ? '<button data-acc="quitar">Desequipar</button>' : '<button data-acc="equipar">EQUIPAR</button>'}
        ${n < 5 ? `<button data-acc="mejorar" ${jugador.oro < COSTE_ESTRELLA(n) ? 'disabled' : ''}>Mejorar a ★${n + 1} ● ${COSTE_ESTRELLA(n)}</button>` : '<button disabled>★ máx.</button>'}
      </div></div>`;
  }
  function mejorarSkin(k) {   // ★n → ★n+1
    const n = estrellasSkin(k.id), c = COSTE_ESTRELLA(n);
    if (n >= 5 || jugador.oro < c) return false;
    jugador.oro -= c; jugador.skinsPropias[k.id] = n + 1; return true;
  }
  function comprarSkin(k) {
    if (estrellasSkin(k.id) || jugador.oro < PRECIO_SKIN) return false;
    jugador.oro -= PRECIO_SKIN; (jugador.skinsPropias ||= {})[k.id] = 1; return true;
  }

  // ---------------- Clases y árbol de habilidades ----------------
  // Cada clase tiene 3 ramas de 5 nodos. Un punto cada 2 niveles (40 al nivel 80, de 51 posibles). Para abrir el nodo N de una rama
  // hacen falta 3·(N-1) puntos gastados en esa rama y al menos 1 rango en el nodo anterior.
  //   stat: % a estadísticas por rango · ef: % a efectos de combate por rango (se suman a los de la skin)
  //   poder: % de poder por rango para nodos especiales que no son estadísticas ni efectos
  //   habMult: [habilidad, +x por rango] · habRecarga: [habilidad, -turnos por rango] · golpe: estado al golpear (prob. % por rango)
  //   cargaInicial: las habilidades empiezan la batalla cargadas
  // Clases: cada una cambia los atributos base (mod, en %), da un efecto propio (ef) y tiene sus habilidades y su árbol.
  // Se puede cambiar de clase gratis fuera de batalla; los puntos del árbol y la maestría son de cada clase.
  // Arquero y Mago usan por ahora el sprite del guerrero (sprites propios pendientes).
  const CLASES = {
    guerrero: { nombre: 'Guerrero', icono: '⚔️', desc: 'Resistente y equilibrado. Aguanta golpes y remata con fuerza.', mod: {}, ef: {} },
    arquero:  { nombre: 'Arquero',  icono: '🏹', desc: 'Daño alto y críticos; menos vida y defensa. Hace sangrar y envenena.',
                mod: { ataque: 10, vida: -12, defensa: -20 }, ef: { critico: .05, esquiva: .04 } },
    mago:     { nombre: 'Mago',     icono: '🔮', desc: 'Habilidades muy fuertes que queman y congelan; frágil cuerpo a cuerpo.',
                mod: { ataque: 6, vida: -15, armadura: -25 }, ef: { habilidad: .15, resistencia: .05 } },
  };
  const ARBOL = {
    guerrero: [
      { id: 'furia', nombre: 'Furia', icono: '🗡️', nodos: [
        { id: 'fuerza',      nombre: 'Fuerza bruta',      icono: '💪', max: 5, stat: { ataque: 2 }, d: r => `+${2 * r} % de ataque` },
        { id: 'certero',     nombre: 'Golpe certero',     icono: '🎯', max: 5, ef: { critico: 2 }, d: r => `${2 * r} % de prob. de crítico` },
        { id: 'estocada_m',  nombre: 'Estocada feroz',    icono: '⚡', max: 3, poder: 1.5, habMult: ['estocada', .2], d: r => `Estocada hace +${20 * r} % de daño` },
        { id: 'sed',         nombre: 'Sed de sangre',     icono: '🩸', max: 3, ef: { robo: 2 }, d: r => `${2 * r} % de robo de vida` },
        { id: 'aplastante',  nombre: 'Golpe aplastante',  icono: '🔨', max: 1, poder: 4, d: () => 'Nueva habilidad: golpe ×3 que aturde al enemigo 1 turno (recarga 5)' },
      ] },
      { id: 'baluarte', nombre: 'Baluarte', icono: '🛡️', nodos: [
        { id: 'piel',        nombre: 'Piel de hierro',    icono: '❤️', max: 5, stat: { vida: 3 }, d: r => `+${3 * r} % de vida` },
        { id: 'coraza',      nombre: 'Coraza',            icono: '🧱', max: 5, stat: { defensa: 3, armadura: 3 }, d: r => `+${3 * r} % de defensa y armadura` },
        { id: 'represalia',  nombre: 'Represalia',        icono: '↩️', max: 3, ef: { contra: 3 }, d: r => `${3 * r} % de prob. de contraatacar al recibir un golpe` },
        { id: 'aliento',     nombre: 'Segundo aliento',   icono: '🌬️', max: 3, poder: 1, d: r => `Al bajar del 30 % de vida te curas un ${10 * r} % (una vez por batalla)` },
        { id: 'bastion',     nombre: 'Último bastión',    icono: '🏰', max: 1, poder: 3, d: () => 'Sobrevives a un golpe mortal con 1 de vida (una vez por batalla)' },
      ] },
      { id: 'tactica', nombre: 'Táctica', icono: '📜', nodos: [
        { id: 'maestria',    nombre: 'Maestría',          icono: '📖', max: 5, ef: { habilidad: 4 }, d: r => `+${4 * r} % de daño de habilidades` },
        { id: 'reflejos',    nombre: 'Reflejos',          icono: '💨', max: 5, ef: { esquiva: 2 }, d: r => `${2 * r} % de prob. de esquivar ataques normales` },
        { id: 'tajo_veloz',  nombre: 'Tajo veloz',        icono: '🌀', max: 1, poder: 2, habRecarga: ['tajo', 1], d: () => 'Tajo ascendente se recarga 1 turno antes' },
        { id: 'cazador',     nombre: 'Cazador de bestias', icono: '🐲', max: 3, ef: { jefes: 5 }, d: r => `+${5 * r} % de daño contra jefes` },
        { id: 'adrenalina',  nombre: 'Adrenalina',        icono: '🔥', max: 1, poder: 2, cargaInicial: true, d: () => 'Empiezas cada batalla con las habilidades cargadas' },
      ] },
    ],
    arquero: [
      { id: 'precision', nombre: 'Precisión', icono: '🎯', nodos: [
        { id: 'punteria',    nombre: 'Puntería',          icono: '🏹', max: 5, stat: { ataque: 2 }, d: r => `+${2 * r} % de ataque` },
        { id: 'ojo_halcon',  nombre: 'Ojo de halcón',     icono: '🦅', max: 5, ef: { critico: 2 }, d: r => `${2 * r} % de prob. de crítico` },
        { id: 'disparo_m',   nombre: 'Disparo afinado',   icono: '🎯', max: 3, poder: 1.5, habMult: ['disparo', .2], d: r => `Disparo certero hace +${20 * r} % de daño` },
        { id: 'letal',       nombre: 'Punta letal',       icono: '💀', max: 3, ef: { danoCritico: 8 }, d: r => `+${8 * r} % de daño crítico` },
        { id: 'perforante',  nombre: 'Flecha perforante', icono: '🗡️', max: 1, poder: 4, d: () => 'Nueva habilidad: flecha ×3,2 que atraviesa la armadura (recarga 5)' },
      ] },
      { id: 'supervivencia', nombre: 'Supervivencia', icono: '🍃', nodos: [
        { id: 'agilidad',    nombre: 'Agilidad',          icono: '💨', max: 5, ef: { esquiva: 2 }, d: r => `${2 * r} % de prob. de esquivar` },
        { id: 'cuero',       nombre: 'Cuero curtido',     icono: '🧥', max: 5, stat: { vida: 3, defensa: 2 }, d: r => `+${3 * r} % de vida y +${2 * r} % de defensa` },
        { id: 'trampas',     nombre: 'Trampas',           icono: '🪤', max: 3, golpe: { estado: 'sangrado', prob: 5, turnos: 3, pct: .2 }, poder: 1, d: r => `${5 * r} % de hacer sangrar al golpear (3 turnos, 20 % de tu ataque)` },
        { id: 'instinto',    nombre: 'Instinto',          icono: '👁️', max: 3, ef: { reduccion: 3 }, d: r => `-${3 * r} % de daño recibido` },
        { id: 'camuflaje',   nombre: 'Camuflaje',         icono: '🌿', max: 1, ef: { esquiva: 6 }, poder: 1, d: () => '+6 % de prob. de esquivar' },
      ] },
      { id: 'caceria', nombre: 'Cacería', icono: '🐺', nodos: [
        { id: 'rastreo',     nombre: 'Rastreo',           icono: '🐾', max: 5, ef: { jefes: 4 }, d: r => `+${4 * r} % de daño contra jefes` },
        { id: 'flecha_ven',  nombre: 'Flechas venenosas', icono: '☠️', max: 5, golpe: { estado: 'veneno', prob: 4, turnos: 3, pct: .12 }, poder: 1, d: r => `${4 * r} % de envenenar al golpear (acumulable)` },
        { id: 'lluvia_r',    nombre: 'Lluvia rápida',     icono: '🌧️', max: 1, poder: 2, habRecarga: ['lluvia', 1], d: () => 'Lluvia de flechas se recarga 1 turno antes' },
        { id: 'penetrante',  nombre: 'Puntas de acero',   icono: '🔩', max: 3, ef: { penetracion: 5 }, d: r => `+${5 * r} % de penetración` },
        { id: 'marca',       nombre: 'Marca del cazador', icono: '🎖️', max: 1, ef: { remate: 12 }, d: () => '+12 % de daño a enemigos por debajo del 50 % de vida' },
      ] },
    ],
    mago: [
      { id: 'fuego', nombre: 'Fuego', icono: '🔥', nodos: [
        { id: 'poder_arc',   nombre: 'Poder arcano',      icono: '✨', max: 5, stat: { ataque: 2 }, d: r => `+${2 * r} % de ataque` },
        { id: 'ignicion',    nombre: 'Ignición',          icono: '🔥', max: 5, golpe: { estado: 'quemadura', prob: 5, turnos: 2, pct: .25 }, poder: 1, d: r => `${5 * r} % de quemar al golpear (2 turnos, 25 % de tu ataque)` },
        { id: 'bola_m',      nombre: 'Bola mayor',        icono: '☀️', max: 3, poder: 1.5, habMult: ['bola', .25], d: r => `Bola de fuego hace +${25 * r} % de daño` },
        { id: 'combustion',  nombre: 'Combustión',        icono: '💥', max: 3, ef: { critico: 3 }, d: r => `${3 * r} % de prob. de crítico` },
        { id: 'meteoro',     nombre: 'Meteoro',           icono: '☄️', max: 1, poder: 4, d: () => 'Nueva habilidad: meteoro ×4 que quema (recarga 6)' },
      ] },
      { id: 'hielo', nombre: 'Hielo', icono: '❄️', nodos: [
        { id: 'escarcha',    nombre: 'Armadura de escarcha', icono: '🧊', max: 5, stat: { armadura: 5, vida: 2 }, d: r => `+${5 * r} % de armadura y +${2 * r} % de vida` },
        { id: 'piel_hielo',  nombre: 'Piel de hielo',     icono: '🛡️', max: 5, ef: { reduccion: 2 }, d: r => `-${2 * r} % de daño recibido` },
        { id: 'lanza_m',     nombre: 'Lanza afilada',     icono: '❄️', max: 3, poder: 1.5, habMult: ['lanza', .2], d: r => `Lanza de hielo hace +${20 * r} % de daño` },
        { id: 'hielo_et',    nombre: 'Hielo eterno',      icono: '🏔️', max: 3, ef: { resistencia: 5 }, d: r => `+${5 * r} % de resistencia` },
        { id: 'ventisca',    nombre: 'Ventisca',          icono: '🌨️', max: 1, poder: 2, habRecarga: ['lanza', 1], d: () => 'Lanza de hielo se recarga 1 turno antes' },
      ] },
      { id: 'arcano', nombre: 'Arcano', icono: '📘', nodos: [
        { id: 'sabiduria',   nombre: 'Sabiduría',         icono: '📖', max: 5, ef: { habilidad: 4 }, d: r => `+${4 * r} % de daño de habilidades` },
        { id: 'mente',       nombre: 'Mente firme',       icono: '🧠', max: 5, stat: { vida: 3 }, d: r => `+${3 * r} % de vida` },
        { id: 'drenaje',     nombre: 'Drenaje',           icono: '🩸', max: 3, ef: { robo: 2 }, d: r => `${2 * r} % de robo de vida` },
        { id: 'concentra',   nombre: 'Concentración',     icono: '🔮', max: 3, ef: { danoCritico: 8 }, d: r => `+${8 * r} % de daño crítico` },
        { id: 'torrente',    nombre: 'Torrente de maná',  icono: '🌊', max: 1, poder: 2, cargaInicial: true, d: () => 'Empiezas cada batalla con las habilidades cargadas' },
      ] },
    ],
  };
  const costeReinicio = () => Math.max(500, 100 * jugador.nivel);   // crece con el nivel (8 000 al nivel 80)
  jugador.clase ||= 'guerrero'; jugador.arbol ||= {};
  const ramasClase = () => ARBOL[jugador.clase] || [];
  const nodosClase = () => ramasClase().flatMap(r => r.nodos);
  // 'a' = el árbol a consultar: por defecto el guardado (el que cuenta en combate); la pantalla pasa el borrador
  const rango = (id, a = jugador.arbol) => a[id] || 0;
  const rangoClase = id => nodosClase().some(n => n.id === id) ? rango(id) : 0;   // solo cuenta si el nodo es de la clase actual
  const puntosRama = (rama, a = jugador.arbol) => rama.nodos.reduce((s, n) => s + rango(n.id, a), 0);
  const puntosGastados = (a = jugador.arbol) => nodosClase().reduce((s, n) => s + rango(n.id, a), 0);
  // Tope de 45 puntos: el árbol entero cuesta 51, así que incluso con todas las ascensiones hay que elegir qué dejar fuera.
  const PUNTOS_ARBOL_MAX = 45;
  const puntosTotales = () => Math.min(PUNTOS_ARBOL_MAX, Math.floor(jugador.nivel / 2) + (jugador.puntosExtra || 0) + (jugador.ascension || 0) * 2);   // +2 por ascensión
  const puntosLibres = (a = jugador.arbol) => puntosTotales() - puntosGastados(a);
  // partidas del reparto anterior (1 punto por nivel): si gastó más de lo que ahora tiene, se le devuelven
  if (puntosLibres() < 0) { jugador.arbol = {}; jugador.arbolDevuelto = true; }
  function nodoAbierto(rama, i, a = jugador.arbol) {   // requisitos de rama y nodo anterior
    return puntosRama(rama, a) >= 3 * i && (i === 0 || rango(rama.nodos[i - 1].id, a) > 0);
  }
  // Borrador: los + y − se aplican aquí y solo cuentan al pulsar Guardar. El − solo deshace puntos aún sin guardar
  // (lo guardado solo se quita con Reiniciar) y no puede dejar nodos superiores sin sus requisitos.
  let borrador = null;
  const arbolVista = () => borrador || jugador.arbol;
  const puntosSinGuardar = () => borrador ? puntosGastados(borrador) - puntosGastados() : 0;
  function puedeQuitar(rama, i) {
    const id = rama.nodos[i].id;
    if (!borrador || rango(id, borrador) <= rango(id)) return false;
    const prueba = { ...borrador, [id]: borrador[id] - 1 };
    return rama.nodos.every((n, k) => !rango(n.id, prueba) || nodoAbierto(rama, k, prueba));
  }
  function guardarArbol() {
    if (!borrador) return;
    jugador.arbol = Object.fromEntries(Object.entries(borrador).filter(([, v]) => v > 0));
    borrador = null; guardar(); avisar('Árbol guardado');
  }
  function statsArbol() {
    const t = {};
    for (const n of nodosClase()) if (n.stat) for (const [a, v] of Object.entries(n.stat)) t[a] = (t[a] || 0) + v * rango(n.id);
    return t;
  }
  const efectoArbol = esp => nodosClase().reduce((s, n) => s + (n.ef && n.ef[esp] ? n.ef[esp] * rango(n.id) / 100 : 0), 0);
  const poderArbol = () => nodosClase().reduce((s, n) => s + (n.poder || 0) * rango(n.id) / 100, 0);

  let claseVista = jugador.clase, arbolSel = null;
  // texto de lo que da una clase (modificadores y efecto propio)
  const textoClase = id => { const c = CLASES[id];
    return [...Object.entries(c.mod).map(([a, v]) => `${v > 0 ? '+' : ''}${v} % ${ATRIBUTOS[a].toLowerCase()}`),
            ...Object.entries(c.ef).map(([a, v]) => `+${r1(v * 100)} % ${nombreEf(a).toLowerCase()}`)].join(', ') || 'Sin modificadores'; };

  // ---------------- Títulos ----------------
  // Se desbloquean con logros y quedan para siempre. Solo el título equipado da su bono (en %).
  const RAREZA_TITULO = { comun: '#cfcfcf', raro: '#5cf', epico: '#b48cff', legendario: '#ffb02e', mitico: '#ff4d6d' };
  const logro = k => (jugador.logros || {})[k] || 0;
  const jefeVencido = id => ((jugador.logros || {}).jefes || {})[id] ? 1 : 0;
  const nSuperadas = () => Object.keys(jugador.superadas || {}).length;
  const T = (id, nombre, rareza, desc, prog, bono = {}) => ({ id, nombre, rareza, desc, prog, bono });
  const TITULOS = [
    T('recluta',        'Recluta',             'comun',      'Empieza tu aventura',                () => [1, 1]),
    T('cazador',        'Cazador',             'comun',      'Derrota 100 enemigos',               () => [logro('enemigos'), 100], { ataque: 2 }),
    T('afortunado',     'Afortunado',          'raro',       'Abre 100 cofres',                    () => [logro('cofres'), 100], { armadura: 4 }),
    T('veterano',       'Veterano',            'raro',       'Alcanza el nivel 20',                () => [jugador.nivel, 20], { vida: 4 }),
    T('conquistador',   'Conquistador',        'raro',       'Supera 10 niveles de campaña (cualquier dificultad)', () => [nSuperadas(), 10], { defensa: 4 }),
    T('coleccionista',  'Coleccionista',       'raro',       'Consigue 5 skins',                   () => [Object.keys(jugador.skinsPropias || {}).length, 5], { vida: 3 }),
    T('verdugo',        'Verdugo',             'epico',      'Derrota 1000 enemigos',              () => [logro('enemigos'), 1000], { ataque: 5 }),
    T('domador',        'Domador de Cerbero',  'epico',      'Derrota a Cerbero',                  () => [jefeVencido('cerbero'), 1], { vida: 5 }),
    T('exorcista',      'Exorcista',           'epico',      'Derrota a Asmodeo',                  () => [jefeVencido('asmodeo'), 1], { defensa: 5 }),
    T('matatoros',      'Matatoros',           'epico',      'Derrota al Gran Minotauro',          () => [jefeVencido('minotauro'), 1], { ataque: 5 }),
    T('herrero',        'Maestro herrero',     'epico',      'Encanta un objeto a +15',            () => [Math.max(0, ...jugador.objetos.map(o => o.enc || 0)), 15], { defensa: 3, armadura: 5 }),
    T('pesadilla',      'Pesadilla encarnada', 'legendario', 'Supera un nivel en Pesadilla',       () => [Object.keys(jugador.superadas || {}).some(k => k.endsWith(':pesadilla')) ? 1 : 0, 1], { ataque: 6 }),
    T('infierno',       'Señor del infierno',  'mitico',     'Supera la Etapa 1 completa en Infierno', () => [Object.keys(jugador.superadas || {}).filter(k => /^1-\d+:infierno$/.test(k)).length, 10], { vida: 6, defensa: 6 }),
    T('resplandeciente','Resplandeciente',     'legendario', 'Sube una skin a ★5',                 () => [Math.max(0, ...Object.values(jugador.skinsPropias || {})), 5], { ataque: 4, defensa: 4 }),
    T('leyenda',        'Leyenda viviente',    'legendario', 'Alcanza el nivel 50',                () => [jugador.nivel, 50], { ataque: 5, vida: 5, defensa: 5, armadura: 5 }),
    T('matarreyes',     'Matarreyes',          'mitico',     'Vence a los 3 reyes en Pesadilla o Infierno', () => [logro('reyes1') ? 1 : 0, 1], { ataque: 6, vida: 6 }),
    T('azote',          'Azote de los dioses', 'mitico',     'Derrota a los tres jefes mundiales', () => [jefeVencido('cerbero') + jefeVencido('asmodeo') + jefeVencido('minotauro'), 3], { ataque: 8, vida: 8 }),
    T('senor',          'Señor de la guerra',  'mitico',     'Gasta 40 puntos de habilidad (todos los del nivel 80)', () => [puntosGastados(), Math.floor(NIVEL_MAX / 2)], { ataque: 6, defensa: 6 }),
  ];
  const tituloActual = () => (jugador.titulos || {})[jugador.titulo] ? TITULOS.find(t => t.id === jugador.titulo) : null;
  const textoBono = b => Object.entries(b).map(([a, v]) => `+${v} % ${ATRIBUTOS[a].toLowerCase()}`).join(', ');
  const etiquetaTitulo = t => t ? `<span class="titulo-tag" style="--tc:${RAREZA_TITULO[t.rareza]}">«${t.nombre}»</span>` : '';
  function revisarTitulos(avisos = true) {   // desbloquea los títulos cuyos logros ya se cumplen
    jugador.titulos ||= {};
    for (const t of TITULOS) {
      if (jugador.titulos[t.id]) continue;
      const [a, m] = t.prog();
      if (a >= m) { jugador.titulos[t.id] = true; if (avisos) jugador.tituloNuevo = true; if (avisos) setTimeout(() => avisar(`Nuevo título: «${t.nombre}»`), 900); }
    }
  }
  revisarTitulos(false); titulosListos = true;

  const nombreEf = esp => SECUNDARIOS[esp] || OTROS_EFECTOS[esp];
  const r1 = v => Math.round(v * 10) / 10;
  // texto de bonos: base = % a atributos base, ef = % a efectos
  const textoBonos = (base = {}, ef = {}) => [...Object.entries(base).map(([a, v]) => `+${r1(v)} % ${ATRIBUTOS[a].toLowerCase()}`),
    ...Object.entries(ef).map(([a, v]) => `+${r1(v)} % ${nombreEf(a).toLowerCase()}`)].join(', ');

  // ---------------- Reliquias ----------------
  // Botín de los jefes mundiales. Todas las que tienes están activas; repetirla sube su nivel (máx. 5).
  //   ef: % a un efecto por nivel · golpe: prob. (% por nivel) de aplicar un estado al golpear
  const RELIQUIAS = [
    { id: 'colmillo', jefe: 'cerbero',   nombre: 'Colmillo de Cerbero',  icono: '🦷', golpe: { estado: 'quemadura', prob: 4, turnos: 2, pct: .3 } },
    { id: 'collar',   jefe: 'cerbero',   nombre: 'Collar infernal',      icono: '📿', ef: { resistencia: 4 } },
    { id: 'ceniza',   jefe: 'cerbero',   nombre: 'Ceniza del Hades',     icono: '⚱️', ef: { jefes: 5 } },
    { id: 'ala',      jefe: 'asmodeo',   nombre: 'Ala de Asmodeo',       icono: '🪶', ef: { esquiva: 3 } },
    { id: 'corona',   jefe: 'asmodeo',   nombre: 'Corona demoníaca',     icono: '👑', ef: { habilidad: 5 } },
    { id: 'sello',    jefe: 'asmodeo',   nombre: 'Sello del pacto',      icono: '🔯', golpe: { estado: 'veneno', prob: 5, turnos: 3, pct: .15 } },
    { id: 'cuerno',   jefe: 'minotauro', nombre: 'Cuerno del Minotauro', icono: '🐂', ef: { penetracion: 4 } },
    { id: 'hacha',    jefe: 'minotauro', nombre: 'Hacha rota',           icono: '🪓', golpe: { estado: 'sangrado', prob: 5, turnos: 3, pct: .25 } },
    { id: 'pezuna',   jefe: 'minotauro', nombre: 'Pezuña de bronce',     icono: '🔔', ef: { danoCritico: 8 } },
  ];
  // Solo 3 reliquias activas a la vez (elegidas por el jugador): son una decisión de build, no una suma de todo.
  // Por eso cada una vale más por nivel que cuando estaban todas activas. Sin elección guardada, se usan las 3 de más nivel.
  const RANURAS_RELIQUIA = 3;
  function reliquiasActivas() {
    const tiene = RELIQUIAS.filter(r => (jugador.reliquias || {})[r.id]);
    if (jugador.reliquiasPuestas) return tiene.filter(r => jugador.reliquiasPuestas.includes(r.id)).slice(0, RANURAS_RELIQUIA);
    return tiene.sort((a, b) => jugador.reliquias[b.id] - jugador.reliquias[a.id]).slice(0, RANURAS_RELIQUIA);
  }
  const RELIQUIA_MAX = 5, NOMBRE_JEFE = { cerbero: 'Cerbero', asmodeo: 'Asmodeo', minotauro: 'Gran Minotauro' };
  const nivelReliquia = id => (jugador.reliquias || {})[id] || 0;
  function efectoReliquias(esp) { return reliquiasActivas().reduce((s, r) => s + (r.ef && r.ef[esp] ? r.ef[esp] * nivelReliquia(r.id) / 100 : 0), 0); }
  function golpesEstado() {   // reliquias + nodos del árbol de la clase actual
    return [...reliquiasActivas().filter(r => r.golpe).map(r => ({ ...r.golpe, prob: r.golpe.prob * nivelReliquia(r.id) / 100 })),
            ...nodosClase().filter(n => n.golpe && rango(n.id)).map(n => ({ ...n.golpe, prob: n.golpe.prob * rango(n.id) / 100 }))];
  }
  function textoReliquia(r, n = Math.max(1, nivelReliquia(r.id))) {
    if (r.ef) return textoBonos({}, Object.fromEntries(Object.entries(r.ef).map(([a, v]) => [a, v * n])));
    const g = r.golpe, e = ESTADOS[g.estado];
    return `${g.prob * n} % de ${e.nombre.toLowerCase()} ${e.icono} al golpear (${g.turnos} turnos, ${g.pct * 100} % de tu ataque por turno)`;
  }
  // Al terminar un intento contra un jefe mundial: reliquia segura si lo derrotas; si no, probabilidad según el daño
  function botinReliquia(jefe, gano) {
    const prob = gano ? 1 : Math.min(.6, .15 + batalla.danoHecho / MUNDIALES[jefe].enemigo.vida * 3);
    if (rnd() >= prob) return '';
    const r = elegir(RELIQUIAS.filter(x => x.jefe === jefe)); jugador.reliquias ||= {};
    if (nivelReliquia(r.id) >= RELIQUIA_MAX) { jugador.mat.polvo += 30; return `<br>${r.icono} ${r.nombre} (ya al máximo): ✨ +30 polvo`; }
    jugador.reliquias[r.id] = nivelReliquia(r.id) + 1;
    return `<br><b>${r.icono} Reliquia: ${r.nombre} ${nivelReliquia(r.id) > 1 ? 'Nv ' + nivelReliquia(r.id) : '¡nueva!'}</b>`;
  }

  // Equipo exclusivo del jefe: 35 % si lo derrotas; si no, hasta un 10 % según el daño causado
  // Equipo de jefe (piezas de su set). Garantía: 8 intentos seguidos sin pieza de ese jefe dan una segura, y la garantía
  // prefiere una pieza que aún no tengas (para que completar el set de 4 no dependa solo de la suerte).
  const GARANTIA_JEFE = 8;
  function botinEquipoJefe(jefe, gano) {
    const P = jugador.pityJefe ||= {}; P[jefe] = (P[jefe] || 0) + 1;
    const prob = (gano ? .35 : Math.min(.1, batalla.danoHecho / MUNDIALES[jefe].enemigo.vida * .5)) * ((eventoHoy() || {}).jefes || 1);
    if (rnd() >= prob && P[jefe] < GARANTIA_JEFE) return `<br><small class="proteccion">🍀 Pieza de set garantizada en ${GARANTIA_JEFE - P[jefe]} intento${GARANTIA_JEFE - P[jefe] > 1 ? 's' : ''}</small>`;
    const garantia = P[jefe] >= GARANTIA_JEFE; P[jefe] = 0;
    const todas = MODELOS.filter(m => m.jefe === jefe), faltan = todas.filter(m => !jugador.objetos.some(o => o.modelo === m.id));
    const o = crearObjeto(elegir(garantia && faltan.length ? faltan : todas).id); jugador.objetos.push(o);
    obtenidos.push(o); return '';
  }

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

  // ---------------- Maestría (por clase) ----------------
  // Progreso independiente del nivel: se gana combatiendo (1 por enemigo, 5 por jefe, más por jefes mundiales).
  // Cada nivel: +0,5 % a ataque, vida, defensa y armadura; cada 10 niveles, +2 % de daño de habilidades.
  const MAESTRIA_MAX = 50, xpMaestria = n => 20 + 10 * n;   // xp para pasar del nivel n al n+1
  function maestria() {
    let xp = (jugador.maestria || {})[jugador.clase] || 0, n = 0;
    while (n < MAESTRIA_MAX && xp >= xpMaestria(n)) { xp -= xpMaestria(n); n++; }
    return { n, xp, falta: xpMaestria(n) };
  }
  function sumarMaestria(x) {
    x = Math.round(x * ((eventoHoy() || {}).xp || 1));   // Viernes de experiencia: también maestría
    const antes = maestria().n; jugador.maestria ||= {};
    jugador.maestria[jugador.clase] = (jugador.maestria[jugador.clase] || 0) + x;
    const n = maestria().n; if (n > antes && !simulando) setTimeout(() => avisar(`🏅 Maestría Nv ${n}`), 1200);
  }
  function statsMaestria() { const n = maestria().n; return n ? { ataque: n * .5, vida: n * .5, defensa: n * .5, armadura: n * .5 } : {}; }
  // Especialización (una por clase, desde maestría Nv 10): marca el estilo de la build. Crece ×1,5 en Nv 30 y ×2 en Nv 50.
  // La primera elección es gratis; cambiarla cuesta oro.
  const ESPECIALIDADES = {
    destructor: { nombre: 'Destructor', icono: '💥', desc: 'daño puro', ef: { habilidad: .08, penetracion: .06 } },
    bastion:    { nombre: 'Bastión',    icono: '🛡️', desc: 'supervivencia', ef: { reduccion: .05, curacion: .10 } },
    gladiador:  { nombre: 'Gladiador',  icono: '⚔️', desc: 'crítico y contraataque', ef: { critico: .04, contra: .06 } },
  };
  const MAESTRIA_ESPECIAL = 10, COSTE_ESPECIAL = 3000;
  const especialidad = () => { const id = (jugador.especialidad || {})[jugador.clase]; return maestria().n >= MAESTRIA_ESPECIAL && ESPECIALIDADES[id] ? id : null; };
  const factorEspecial = () => maestria().n >= 50 ? 2 : maestria().n >= 30 ? 1.5 : 1;
  function efectoMaestria(esp) {
    const e = especialidad();
    return (esp === 'habilidad' ? Math.floor(maestria().n / 10) * .02 : 0) + (e ? (ESPECIALIDADES[e].ef[esp] || 0) * factorEspecial() : 0);
  }
  function htmlMaestria() {
    const m = maestria(), c = CLASES[jugador.clase];
    return `<div class="maestria">🏅 Maestría del ${c.nombre.toLowerCase()}: <b>Nv ${m.n}/${MAESTRIA_MAX}</b>
      ${m.n < MAESTRIA_MAX ? `<div class="xp"><i style="width:${m.xp / m.falta * 100}%"></i></div><small>${m.xp} / ${m.falta} · se gana combatiendo</small>` : ''}
      <br><small>${m.n ? textoBonos(statsMaestria(), Math.floor(m.n / 10) ? { habilidad: Math.floor(m.n / 10) * 2 } : {}) : 'Sin bonos todavía'}</small>
      <div class="especialidades">${m.n < MAESTRIA_ESPECIAL ? `<small>🔒 Especialización en maestría Nv ${MAESTRIA_ESPECIAL}</small>`
        : Object.entries(ESPECIALIDADES).map(([id, x]) => { const on = especialidad() === id;
            return `<button data-especial="${id}" class="${on ? 'on' : ''}">${x.icono} ${x.nombre}<small>${textoBonos({}, Object.fromEntries(Object.entries(x.ef).map(([a, v]) => [a, Math.round(v * factorEspecial() * 100)])))}</small>${!on && especialidad() ? `<small>● ${COSTE_ESPECIAL}</small>` : ''}</button>`; }).join('')}</div></div>`;
  }

  // ---------------- Colección ----------------
  // Cada entrada conseguida da un pequeño % a un atributo base; completar la colección da un efecto extra.
  const COLECCIONES = [
    { id: 'bestiario', nombre: 'Bestiario', desc: 'Enemigos derrotados', porEntrada: { ataque: .3 }, completa: { jefes: 3 },
      entradas: () => enemigosColeccion().map(n => ({ nombre: n, icono: '💀', ok: !!(jugador.bestiario || {})[n], extra: (jugador.bestiario || {})[n] ? `×${jugador.bestiario[n]}` : '' })) },
    { id: 'mascotas', nombre: 'Mascotas', desc: 'Mascotas compradas', porEntrada: { vida: 1 }, completa: { resistencia: 3 },
      entradas: () => MASCOTAS.map(m => ({ nombre: m.nombre, icono: m.cara, ok: nivelMascota(m) > 0 })) },
    { id: 'skins', nombre: 'Skins', desc: 'Skins compradas', porEntrada: { defensa: .5 }, completa: { critico: 2 },
      entradas: () => SKINS.map(k => ({ nombre: k.nombre, icono: k.icono, ok: estrellasSkin(k.id) > 0 })) },
    { id: 'reliquias', nombre: 'Reliquias', desc: 'Reliquias de jefes mundiales', porEntrada: { armadura: .5 }, completa: { penetracion: 5 },
      entradas: () => RELIQUIAS.map(r => ({ nombre: r.nombre, icono: r.icono, ok: nivelReliquia(r.id) > 0 })) },
  ];
  // todos los enemigos distintos de las campañas + los jefes mundiales (se definen más abajo: solo cuando el juego ya cargó)
  function enemigosColeccion() {
    if (!campListo) return Object.keys(jugador.bestiario || {});
    const n = new Set();
    for (const c of CAMPANAS) for (const d of Object.values(c.dificultades || {})) for (const e of d.enemigos || []) n.add(e.nombre);
    for (const m of Object.values(MUNDIALES)) n.add(m.enemigo.nombre);
    return [...n];
  }
  const progresoColeccion = c => { const e = c.entradas(); return [e.filter(x => x.ok).length, e.length]; };
  function statsColeccion() {
    const t = {};
    for (const c of COLECCIONES) { const [ok] = progresoColeccion(c);
      for (const [a, v] of Object.entries(c.porEntrada)) t[a] = (t[a] || 0) + v * ok; }
    return t;
  }
  function efectoColeccion(esp) {
    if (!campListo) return 0;
    const prog = memoizar('colecciones', () => COLECCIONES.map(progresoColeccion));
    return COLECCIONES.reduce((s, c, i) => { const [ok, tot] = prog[i]; return s + (ok >= tot && c.completa[esp] ? c.completa[esp] / 100 : 0); }, 0);
  }

  // ---------------- Arena (PvP asíncrono) ----------------
  // Rivales controlados por la IA, creados como copias de un guerrero con un poder parecido al tuyo.
  // 5 entradas al día; ganar da puntos de arena (más contra rivales fuertes) y perder los resta.
  const ARENA_ENTRADAS = 5, COSTE_RIVALES = 200;
  const LIGAS = [[0, 'Bronce', '🥉'], [1100, 'Plata', '🥈'], [1300, 'Oro', '🥇'], [1600, 'Diamante', '💎'], [2000, 'Leyenda', '👑']];
  const NOMBRES_RIVAL = ['Aldric', 'Brunhilda', 'Kael', 'Morgana', 'Thorin', 'Isolde', 'Ragnar', 'Seraphine', 'Darius', 'Lyra', 'Gorak', 'Elowen'];
  const FILTROS_RIVAL = ['hue-rotate(90deg) saturate(2)', 'hue-rotate(200deg) saturate(2)', 'sepia(1) saturate(4) hue-rotate(10deg)', 'grayscale(1) brightness(1.4)'];
  const diasFinMes = () => { const d = ahoraJuego(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate() + 1; };
  const ligaDe = pts => { let i = 0; LIGAS.forEach((l, k) => { if (pts >= l[0]) i = k; }); return i; };
  function generarRivales() {
    const pts = jugador.arena.puntos;
    jugador.arena.rivales = [.85, 1, 1.15].map(f => ({ nombre: elegir(NOMBRES_RIVAL), f: Math.round((f + (rnd() - .5) * .04) * 100) / 100,
      puntos: Math.max(0, pts + Math.round((f - 1) * 300) + azar(-25, 25)), filtro: elegir(FILTROS_RIVAL) }));
  }
  // Temporadas mensuales: al cambiar de mes se entrega el premio de la liga alcanzada y los puntos se reinician a medias
  const PREMIO_LIGA = [{ oro: 1000 }, { oro: 3000, almas: 5 }, { oro: 6000, almas: 12 }, { oro: 12000, almas: 25 }, { oro: 20000, almas: 45 }];
  const mesActual = () => { const d = ahoraJuego(); return `${d.getFullYear()}-${d.getMonth() + 1}`; };
  function revisarArena() {
    jugador.arena ||= { puntos: 1000, victorias: 0 };
    const A = jugador.arena;
    if (!A.temporada) A.temporada = mesActual();
    else if (A.temporada !== mesActual()) {
      const li = ligaDe(A.puntos), pr = PREMIO_LIGA[li]; darPremio(pr);
      setTimeout(() => avisar(`🏆 Fin de temporada (${LIGAS[li][1]}): ${textoPremio(pr)}`), 1500);
      A.puntos = A.puntos > 1000 ? 1000 + Math.floor((A.puntos - 1000) / 2) : A.puntos; A.temporada = mesActual(); guardar();
    }
    if (jugador.arena.dia !== hoy()) { jugador.arena.dia = hoy(); jugador.arena.entradas = ARENA_ENTRADAS; generarRivales(); }
    return jugador.arena;
  }
  function batallaArena(i) {   // la batalla contra el rival i (sin gastar la entrada)
    const a = revisarArena(), r = a.rivales[i], s0 = estadisticas(), li = ligaDe(a.puntos);
    return ({ nombre: `Arena: ${r.nombre}`, arena: true, premio: { oro: 300 + 150 * li, xp: 60, piedra: 4, polvo: 5 + li },   // la Arena es la fuente propia de polvo (refinar y pulir)
      botin: { piedra: [0, 0], polvo: 0 }, enemigos: [{ nombre: r.nombre, rival: true, vida: Math.round(s0.vida * Math.sqrt(r.f) * 1.12), armadura: Math.round(s0.armadura * r.f), defensa: Math.round(s0.defensa * r.f), ef: efectosDefensa(efecto),
        dano: [Math.round(s0.ataque * Math.sqrt(r.f) * .9), Math.round(s0.ataque * Math.sqrt(r.f) * 1.1)], oro: 0, xp: 0, filtro: r.filtro,
        critico: efecto('critico'), danoCritico: DANO_CRITICO_BASE + efecto('danoCritico'), habilidad: { nombre: 'Estocada', turnos: 4, mult: 2.5 },
        aplica: [{ estado: 'sangrado', prob: .15, turnos: 2, pct: .03 }] }] });
  }
  function resultadoArena(gano) {
    const a = revisarArena(), r = a.rivales[a.rivalActual] || { f: 1 }, d = gano ? Math.round(25 * r.f) : -12, antes = ligaDe(a.puntos);
    a.puntos = Math.max(0, a.puntos + d); if (gano) { a.victorias = (a.victorias || 0) + 1; sumarMaestria(3); contarMision('arenaVict'); }
    generarRivales();
    const l = LIGAS[ligaDe(a.puntos)];
    return `<br><b>🏆 Arena: ${d > 0 ? '+' : ''}${d} pts (${a.puntos})</b>${ligaDe(a.puntos) > antes ? `<br>¡Ascenso a liga ${l[2]} ${l[1]}!` : ''}`;
  }

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
  const SET4_GOLPE = .15, SET4_REDUCE = .35, SET4_CURA = .06;

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
    for (const fuente of [statsArbol(), statsRunas(), statsMaestria(), statsColeccion(), statsAscension()]) sumar(fuente);
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

  // ---------------- Vista del guerrero ----------------
  // El guerrero aparece en la vitrina del inventario y en la batalla: ambos usan las mismas capas
  const vistasGuerrero = [];

  // ---------------- Inventario ----------------
  // Ícono estándar por tipo de objeto, teñido con el mismo color que la pieza
  const icono = m => `<span class="icono" style="background-image:url(${m.icono || RANURAS[m.ranura].icono});filter:${m.color || 'none'}"></span>`;
  const ORDEN_RAREZA = Object.keys(RAREZAS);
  let invTab = 'objetos';
  function textoAccionMascota(m, n) {
    const p = valorNivel(m.accion.pct, n), a = m.accion.aplica;
    const extra = a ? ` · ${Math.round(a.prob * 100)}% de ${ESTADOS[a.estado].nombre.toLowerCase()} ${ESTADOS[a.estado].icono}` : '';
    return m.accion.tipo === 'golpe' ? `${m.desc}: ${p}% de tu ataque cada ${m.accion.turnos} turnos${extra}` : `${m.desc}: ${p}% de tu vida cada ${m.accion.turnos} turnos`;
  }
  // Nombre del jugador: se ve en el campamento, la batalla, las salas y el ranking; se edita desde el perfil (Héroe).
  // 3-14 caracteres; no puede coincidir con un jugador del ranking (los bots).
  jugador.nombre ||= `Héroe${1000 + Math.floor(Math.random() * 9000)}`;   // partidas sin nombre: uno provisional
  let editandoNombre = false;
  function validarNombre(n) {
    if (n.length < 3 || n.length > 14) return 'El nombre debe tener entre 3 y 14 caracteres';
    if (!/^[\p{L}\p{N} _-]+$/u.test(n)) return 'Solo letras, números, espacios, - y _';
    if (DEF_BOTS.some(d => d.nombre.toLowerCase() === n.toLowerCase())) return 'Ese nombre ya lo usa otro jugador';
    return '';
  }
  const CATEGORIAS_BOLSA = ['espada', 'casco', 'armadura', 'capa'];
  let filtroBolsa = 'todos';

  // Ventana de detalle de objeto y utilidades de costes
  function filasTotales(t, comparar) {
    return [...Object.keys(ATRIBUTOS), ...Object.keys(SECUNDARIOS)].filter(a => t[a] || (comparar && comparar[a])).map(a => {
      const v = t[a] || 0, d = comparar ? Math.round((v - (comparar[a] || 0)) * 10) / 10 : 0;
      const dif = comparar && d ? ` <span class="${d > 0 ? 'mas' : 'menos'}">(${d > 0 ? '+' : ''}${fmtAtr(a, d)})</span>` : '';
      return `<div><span>${nombreAtr(a)}</span><span>+${fmtAtr(a, v)}${dif}</span></div>`;
    }).join('');
  }
  const tieneCoste = c => Object.entries(c).every(([k, v]) => k === 'prob' || (k === 'oro' ? jugador.oro >= v : jugador.mat[k] >= v));
  const textoCoste = c => Object.entries(c).filter(([k]) => k !== 'prob').map(([k, v]) => {
    const tengo = k === 'oro' ? jugador.oro : jugador.mat[k], ic = k === 'oro' ? '●' : MATERIALES[k].split(' ')[0];
    return `<span class="${tengo < v ? 'falta' : ''}">${ic} <b>${v}</b></span>`;   // en rojo si no alcanza (sin "tienes": ocupaba espacio)
  }).join(' · ');
  const faltaCoste = c => Object.entries(c).filter(([k]) => k !== 'prob').map(([k, v]) => {
    const tengo = k === 'oro' ? jugador.oro : jugador.mat[k]; return tengo < v ? `${v - tengo} ${k === 'oro' ? '● oro' : MATERIALES[k]}` : '';
  }).filter(Boolean).join(' · ');
  let modalFijo = false;   // true: solo se cierra con sus botones

  // Ficha del objeto en el inventario: atributos, comparación con lo equipado y acciones
  function lineasHtml(o) {
    const m = modelo[o.modelo], r = RAREZAS[m.rareza];
    return o.lineas.map(l => `<div><span>${nombreAtr(l.a)} ${estrellas(l.e)}</span><span>+${fmtAtr(l.a, valorLinea(o, l))}</span></div>`).join('') +
      (o.enc ? `<div><span class="enc">Encantamiento +${o.enc}/${encMax(o)}</span><span class="enc">+${Math.round(ENC_PRINCIPAL[PRINCIPAL[m.ranura]] * r.mult * o.enc)} ${ATRIBUTOS[PRINCIPAL[m.ranura]]}</span></div>` : '') +
      (m.jefe ? (() => { const C = CONJUNTOS[m.jefe], n = piezasConjunto()[m.jefe] || 0;
        return `<div><span class="enc">Set «${C.nombre}» · ${n}/4 equipadas</span></div>` + [2, 3].map(k =>
          `<div><span class="enc" style="opacity:${n >= k ? 1 : .5}">${k} piezas${n >= k ? ' ✔' : ''}</span><span class="enc" style="opacity:${n >= k ? 1 : .5}">${textoNivelSet(C[k])}</span></div>`).join('')
          + `<div><span class="enc" style="opacity:${n >= 4 ? 1 : .5}">4 piezas${n >= 4 ? ' ✔' : ''}</span><span class="enc" style="opacity:${n >= 4 ? 1 : .5}">${C.especial}</span></div>`; })() : '');
  }

  // ---------------- Herrería ----------------
  let herSel = null, herTab = 'encantar', lineaSel = 0, candidato = null, bendecir = false;
  const pagar = c => { for (const [k, v] of Object.entries(c)) if (k === 'oro') jugador.oro -= v; else if (k !== 'prob') jugador.mat[k] -= v; };
  let filtroHer = 'todos';

  // ---------------- Tienda: cofres ----------------
  const COFRES = [
    { id: 'madera', nombre: 'Cofre de madera', precio: 100, filtro: '',
      probs: { comun: 70, rara: 25, epica: 5, legendaria: 0 } },
    { id: 'hierro', nombre: 'Cofre de hierro', precio: 300, filtro: 'grayscale(1) brightness(1.15)',
      probs: { comun: 30, rara: 50, epica: 16.5, legendaria: 3, mitica: .5 } },
    { id: 'dorado', nombre: 'Cofre dorado', precio: 800, filtro: 'sepia(1) saturate(3) hue-rotate(5deg) brightness(1.2)',
      probs: { comun: 0, rara: 40, epica: 43, legendaria: 15, mitica: 2 } },
    { id: 'mitico', nombre: 'Cofre mítico', precio: 4000, filtro: 'sepia(1) saturate(5) hue-rotate(-50deg) brightness(.95)',
      probs: { comun: 0, rara: 0, epica: 45, legendaria: 43, mitica: 12 } },
  ];
  // Tienda en dos pestañas: cofres y skins (cada una con su propio scroll a toda la altura)
  let tiendaTab = 'cofres';
  // sorteo de rareza según las probabilidades del cofre, y luego un modelo al azar de esa rareza
  // Objeto al azar según probabilidades de rareza; 'mejora' = prob. de subir una rareza (Fortuna)
  function objetoAzar(probs, mejora = 0) {
    let tirada = rnd() * 100, rareza = 'comun';
    for (const [r, p] of Object.entries(probs)) { if (tirada < p) { rareza = r; break; } tirada -= p; }
    const sig = ORDEN_RAREZA[ORDEN_RAREZA.indexOf(rareza) + 1];
    if (sig && rnd() < mejora && MODELOS.some(m => m.rareza === sig)) rareza = sig;
    return crearObjeto(elegir(MODELOS.filter(m => m.rareza === rareza && !m.jefe)).id);   // el equipo de jefe no sale en cofres
  }
  function abrirCofre(c) {
    const o = objetoAzar(c.probs);
    jugador.objetos.push(o);
    return o;
  }
  // Perfiles de prueba: carga un bot como partida (tu partida se guarda aparte y se puede recuperar)
  const CLAVE_RESPALDO = 'batalla.partida.respaldo';
  // botón de orientación del Campamento: cambia entre auto, horizontal y vertical (se recuerda)
  const ICONO_ORIENTACION = { auto: '🔄', horizontal: '▭', vertical: '▯' };

  // ---------------- Campañas: etapas de 10 niveles (1-1 ... 1-10) ----------------
  // Cada nivel tiene 4 dificultades. Normal del nivel siguiente se abre al superar Normal del anterior;
  // cada dificultad de un nivel se abre al superar la anterior de ese mismo nivel.
  // Los enemigos usan la hoja de la parca recoloreada (sprites propios pendientes).
  // jefe: true -> hoja sin pies, doble de tamaño y flotando. 'avance' = cuánto se acerca al atacar.
  // botin: materiales por enemigo (piedras [min, max], prob. de polvo, cofre del que salen los drops); el jefe da el triple.
  const DIFICULTADES = { normal: 'Normal', dificil: 'Difícil', pesadilla: 'Pesadilla', infierno: 'Infierno' };
  const ORDEN_DIF = Object.keys(DIFICULTADES);
  // multiplicadores de cada dificultad sobre la base del nivel
  const MOD_DIF = {
    // dano: calibrado para que, con el equipo propio de esa dificultad, un golpe normal quite ~5-8 % de la vida
    // oro: crece más despacio que el resto del premio · drop: multiplica la prob. de soltar equipo
    normal:    { vida: 1,   dano: 1,   armadura: 0,  estados: .7,  premio: 1, oro: 1,   drop: 1 },
    dificil:   { vida: 1.8, dano: 2.3, armadura: 10, estados: .85, premio: 2, oro: 1.5, drop: 1.25 },
    pesadilla: { vida: 3.2, dano: 3.2, armadura: 30, estados: 1,   premio: 4, oro: 2.2, drop: 1.5 },
    infierno:  { vida: 6,   dano: 7.2, armadura: 60, estados: 1.3, premio: 8, oro: 3.2, drop: 2 },
  };
  // tipos de enemigo: multiplicadores sobre la base del nivel y estados que aplican
  const TIPOS_ENEMIGO = {
    parca:     { nombre: 'Parca',             vida: 1,    dano: 1,    filtro: '' },
    sombria:   { nombre: 'Parca sombría',     vida: 1.15, dano: 1.1,  filtro: 'brightness(.55) contrast(1.2)' },
    carmesi:   { nombre: 'Parca carmesí',     vida: 1.25, dano: 1.15, filtro: 'sepia(1) saturate(4) hue-rotate(-40deg) brightness(.85)',
                 aplica: [{ estado: 'sangrado', prob: .25, turnos: 3, pct: .03 }] },
    maldita:   { nombre: 'Parca maldita',     vida: 1.3,  dano: 1.2,  armadura: 10, filtro: 'grayscale(1) brightness(.4) contrast(1.6)',
                 aplica: [{ estado: 'sangrado', prob: .3, turnos: 3, pct: .03 }] },
    pantano:   { nombre: 'Parca del pantano', vida: 1.1,  dano: 1,    armadura: 10, filtro: 'sepia(1) saturate(5) hue-rotate(50deg) brightness(.8)',
                 aplica: [{ estado: 'veneno', prob: .35, turnos: 3, pct: .025 }] },
    escarcha:  { nombre: 'Parca de escarcha', vida: 1.2,  dano: 1,    armadura: 15, filtro: 'sepia(1) saturate(3) hue-rotate(160deg) brightness(1.15)',
                 aplica: [{ estado: 'congelacion', prob: .18, turnos: 1 }] },
    ignea:     { nombre: 'Parca ígnea',       vida: 1.2,  dano: 1.1,  armadura: 15, filtro: 'sepia(1) saturate(6) hue-rotate(-20deg)',
                 aplica: [{ estado: 'quemadura', prob: .3, turnos: 2, pct: .04 }] },
    brasas:    { nombre: 'Parca de brasas',   vida: 1.3,  dano: 1.15, armadura: 20, filtro: 'sepia(1) saturate(7) hue-rotate(-25deg) brightness(.9)',
                 aplica: [{ estado: 'quemadura', prob: .35, turnos: 2, pct: .04 }] },
    ancestral: { nombre: 'Parca Ancestral',   vida: 3.5,  dano: 1.6,  armadura: 30, jefe: true, avance: 170,
                 filtro: 'brightness(.7) sepia(.4) hue-rotate(220deg) saturate(1.6)', aplica: [{ estado: 'sangrado', prob: .3, turnos: 3, pct: .03 }] },
    bruja:     { nombre: 'Bruja del pantano', vida: 3.8,  dano: 1.6,  armadura: 50, jefe: true, avance: 170,
                 filtro: 'sepia(1) saturate(4) hue-rotate(70deg) brightness(.7)',
                 aplica: [{ estado: 'veneno', prob: .4, turnos: 3, pct: .03 }, { estado: 'congelacion', prob: .12, turnos: 1 }] },
  };
  // Etapas: cada nivel = [nombre, enemigos en orden]
  const ETAPAS = [
    { id: 1, nombre: 'Etapa 1: El cementerio maldito', niveles: [
      ['Puertas del cementerio',  ['parca', 'parca', 'sombria']],
      ['Tumbas olvidadas',        ['parca', 'sombria', 'sombria']],
      ['Cripta sombría',          ['sombria', 'carmesi', 'sombria']],
      ['Osario sangriento',       ['carmesi', 'maldita', 'carmesi']],
      ['Mausoleo ancestral',      ['maldita', 'carmesi', 'ancestral']],
      ['Ciénaga podrida',         ['pantano', 'pantano', 'maldita']],
      ['Lago helado',             ['escarcha', 'pantano', 'escarcha']],
      ['Pantano en llamas',       ['ignea', 'brasas', 'ignea']],
      ['Bosque de los ahorcados', ['escarcha', 'ignea', 'pantano']],
      ['Guarida de la bruja',     ['pantano', 'escarcha', 'ignea', 'bruja']],
    ] },
    { id: 2, nombre: 'Etapa 2', bloqueada: true },
    { id: 3, nombre: 'Etapa 3', bloqueada: true },
  ];
  // n = número de nivel en toda la campaña (1-1 = 1, 2-1 = 11...): la base crece ~23 % de vida y de daño por nivel
  // Daño base 3-5: estos enemigos luchan siempre en grupo (todos golpean en la misma ronda), así que pegan la mitad que
  // un enemigo en solitario. Lo que dicen sus datos es lo que pegan: el combate no aplica ningún multiplicador aparte.
  // El cofre de los drops depende del nivel (no de la dificultad): farmear 1-1 en Infierno no da cofres dorados.
  const cofreDeNivel = n => n <= 3 ? 'madera' : n <= 7 ? 'hierro' : n <= 10 ? 'dorado' : 'mitico';
  function crearDificultad(n, d, tipos) {
    const m = MOD_DIF[d], vidaBase = 45 * 1.23 ** (n - 1), danoBase = 1.23 ** (n - 1), k = m.premio, g = 1.25 ** (n - 1);
    const enemigos = tipos.map(t => {
      const T = TIPOS_ENEMIGO[t], vida = Math.round(vidaBase * T.vida * m.vida);
      return { nombre: T.nombre, jefe: T.jefe, avance: T.avance, filtro: T.filtro, vida, armadura: (T.armadura || 0) + m.armadura,
        dano: [Math.round(3 * danoBase * T.dano * m.dano), Math.round(5 * danoBase * T.dano * m.dano)],
        oro: Math.round(vidaBase * T.vida * .4 * m.oro), xp: Math.round(vida * .33),
        aplica: (T.aplica || []).map(a => ({ ...a, prob: Math.min(.6, a.prob * m.estados) })) };
    });
    return { premio: { oro: Math.round(60 * g * m.oro), xp: Math.round(40 * g * k), piedra: Math.round((3 + n) * k), polvo: Math.round((1 + n / 3) * k) },
      botin: { piedra: [Math.round((1 + n / 4) * Math.sqrt(k)), Math.round((2 + n / 3) * Math.sqrt(k))],
               polvo: Math.min(.9, (.2 + .03 * n) * (1 + (k - 1) / 6)), cofre: cofreDeNivel(n), drop: m.drop }, enemigos };
  }
  // Lista plana de niveles: { id: '1-3', etapa, nombre, jefe, dificultades }
  const CAMPANAS = ETAPAS.filter(e => e.niveles).flatMap(e => e.niveles.map(([nombre, tipos], i) => {
    const n = (e.id - 1) * 10 + i + 1;
    return { id: `${e.id}-${i + 1}`, etapa: e.id, nombre: `${e.id}-${i + 1} ${nombre}`, jefe: tipos.some(t => TIPOS_ENEMIGO[t].jefe),
             dificultades: Object.fromEntries(ORDEN_DIF.map(d => [d, crearDificultad(n, d, tipos)])) };
  }));
  // Partidas del sistema anterior (claves '1:normal', '2:dificil'...): ese progreso ya no corresponde a ningún nivel
  if (jugador.superadas) for (const k of Object.keys(jugador.superadas)) if (!/^\d+-\d+:/.test(k)) delete jugador.superadas[k];
  const superada = (id, d) => !!(jugador.superadas || {})[`${id}:${d}`];
  function desbloqueada(c, d) {
    const i = ORDEN_DIF.indexOf(d);
    if (i > 0) return superada(c.id, ORDEN_DIF[i - 1]);
    const k = CAMPANAS.indexOf(c); return k === 0 || superada(CAMPANAS[k - 1].id, 'normal');
  }
  function razonBloqueo(c, d) {
    const i = ORDEN_DIF.indexOf(d);
    return i > 0 ? `Supera ${DIFICULTADES[ORDEN_DIF[i - 1]]}` : `Supera ${CAMPANAS[CAMPANAS.indexOf(c) - 1].id}`;
  }
  // Auto (barrido): en un nivel ya superado en esa dificultad, cobra sus recompensas sin pelear gastando la misma estamina.
  // Da lo mismo que ganar la batalla: premio, oro/XP y botín de cada enemigo (con eventos y efectos), misiones y maestría.
  let XP_BARRIDO = 1;   // parte de la XP de la batalla que da el barrido (let: lo ajusta el simulador de progresión)
  function barrido(c, d) {
    revisarEstamina();
    if (!superada(c.id, d)) return;
    if (jugador.estamina < ESTAMINA_CAMPANA) return avisar('Sin estamina: vuelve mañana');
    jugador.estamina -= ESTAMINA_CAMPANA; contarMision('estamina', ESTAMINA_CAMPANA); contarMision('victoria');
    const dif = c.dificultades[d], b = dif.botin, ev = eventoHoy() || {}, dropEv = ev.drop || 1, g = { ...dif.premio, almas: 0 }, objetos = [];
    for (const k of ['oro', 'xp', 'piedra', 'polvo']) g[k] = g[k] || 0;
    for (const e of dif.enemigos) {
      const x = e.jefe ? 3 : 1;
      sumarLogro('enemigos'); contarMision('enemigos'); (jugador.bestiario ||= {})[e.nombre] = (jugador.bestiario[e.nombre] || 0) + 1; sumarMaestria(e.jefe ? 5 : 1);
      g.oro += e.oro; g.xp += e.xp; g.piedra += azar(...b.piedra) * x; g.polvo += (rnd() < b.polvo * (1 + efecto('fortuna')) * dropEv ? 1 : 0) * x;
      if (b.cofre && rnd() < (e.jefe ? .3 : .06) * (b.drop || 1) * (1 + efecto('fortuna')) * dropEv)
        objetos.push(objetoAzar(COFRES.find(k => k.id === b.cofre).probs, efecto('fortuna') / 3 + (ev.caza || 0)));
    }
    g.oro = Math.round(g.oro * (1 + efecto('oro')) * (ev.oro || 1)); g.xp = Math.round(g.xp * XP_BARRIDO * (ev.xp || 1) * (1 + efecto('experiencia')));
    g.piedra = Math.round(g.piedra * (ev.mat || 1)); g.polvo = Math.round(g.polvo * (ev.mat || 1));
    jugador.objetos.push(...objetos);
    ganar(g.oro, g.xp, { piedra: g.piedra, polvo: g.polvo });
    avisar(`⚡ ${c.id} ${DIFICULTADES[d]}: ● ${g.oro} · ${g.xp} XP · 🔷 ${g.piedra}${g.polvo ? ' · ✨ ' + g.polvo : ''}${objetos.length ? ' · 🎁 ' + objetos.map(o => modelo[o.modelo].nombre).join(', ') : ''}`);
    pintarCampanas();
  }
  function batallaCampana(c, d) { return { nombre: `${c.nombre} · ${DIFICULTADES[d]}`, idCampana: c.id, dif: d, ...c.dificultades[d] }; }   // misma confirmación que la flecha de la cabecera
  // avance rápido: x1 -> x1.5 -> x2.5 (se recuerda entre partidas)
  const VELOCIDADES = [1, 1.5, 2.5];
  // Escala el escenario para que quepa en cualquier pantalla (móvil vertical u horizontal)
  // En pantallas bajas los combatientes están más juntos (CSS: gap de .arena) para verse más grandes;
  // los avances de los ataques se acortan en lo mismo para que el golpe siga llegando al rival.
  const SEPARACION = 240;
  let recorteAvance = 0;
  const avanceReal = mov => Math.max(20, mov - recorteAvance);
  addEventListener('resize', () => batalla.campana && batalla.campana.grupo ? ajustarGrupo() : ajustarEscala());

  // La skin es una sola imagen: para que el ataque se lea, se inclina como el cuadro equivalente del guerrero
  const POSE_SKIN = { 1: 'rotate(-4deg) scale(1.02, .97)', 2: 'rotate(-10deg)', 3: 'rotate(4deg)', 4: 'rotate(12deg) translateX(12px)',
                      5: 'rotate(14deg) translateX(16px)', 6: 'rotate(6deg)', 7: 'rotate(2deg)', 12: 'rotate(-6deg)', 13: 'rotate(-14deg) translateY(-6px)' };

  // Sonidos reales de espada (separados de sword.mp3); el guerrero usa uno al azar
  const espadas = ['warrior_slash', 'warrior_slash2', 'warrior_slash3', 'warrior_slash4'].map(n => { const a = new Audio(`audio/guerrero/${n}.mp3`); a.preload = 'auto'; return a; });
  // Sonidos de guadaña para la parca, también al azar
  const guadanas = ['schyte', 'schyte2', 'schyte3'].map(n => { const a = new Audio(`audio/parca/${n}.mp3`); a.preload = 'auto'; return a; });
  const HAB_TODAS = [
    { id: 'estocada', clase: 'guerrero', nombre: 'Estocada', icono: '🗡️', turnos: 4, mult: 2.5,   // dos manos al frente, espada apuntando al enemigo
      anim: () => guerrero.jugar([
        [1, 140, , () => marcoGuerrero.classList.add('carga')], [1, 450],               // se agacha y concentra energía
        [5, 160, 380, () => { marcoGuerrero.classList.remove('carga'); estela(); sonidoEspada(); }],
        [5, 220, , r => r()], [6, 220, 0], [7, 150]]) },
    { id: 'tajo', clase: 'guerrero', nombre: 'Tajo ascendente', icono: '🌙', turnos: 3, mult: 1.8,   // cuadros 12-13 generados: la espada sube
      anim: () => guerrero.jugar([
        [1, 200, 360], [4, 110], [12, 70, , sonidoEspada], [13, 220, , r => { arco(); r(); }], [6, 200, 0], [7, 150]]) },
    { id: 'aplastante', clase: 'guerrero', nombre: 'Golpe aplastante', icono: '🔨', turnos: 5, mult: 3, aturde: true, nodo: 'aplastante',   // se aprende en el árbol
      anim: () => guerrero.jugar([
        [1, 140, , () => marcoGuerrero.classList.add('carga')], [1, 350, 360],
        [2, 170, , () => marcoGuerrero.classList.remove('carga')], [3, 90, , sonidoEspada], [4, 220, , r => { arco(); r(); }], [5, 120], [6, 200, 0], [7, 150]]) },
  ];
  // Arquero y Mago: mismas animaciones del guerrero hasta tener sus sprites. aplica: estado que puede dejar el golpe.
  const animDe = id => () => HAB_TODAS.find(h => h.id === id).anim();
  HAB_TODAS.push(
    { id: 'disparo', clase: 'arquero', nombre: 'Disparo certero', icono: '🏹', turnos: 3, mult: 2.2, anim: animDe('estocada') },
    { id: 'lluvia', clase: 'arquero', nombre: 'Lluvia de flechas', icono: '🌧️', turnos: 4, mult: 1.6, anim: animDe('tajo'),
      aplica: { estado: 'sangrado', prob: .5, turnos: 3, pct: .15 } },
    { id: 'perforante', clase: 'arquero', nombre: 'Flecha perforante', icono: '🗡️', turnos: 5, mult: 3.2, perfora: true, nodo: 'perforante', anim: animDe('aplastante') },
    { id: 'bola', clase: 'mago', nombre: 'Bola de fuego', icono: '🔥', turnos: 3, mult: 2, anim: animDe('estocada'),
      aplica: { estado: 'quemadura', prob: .5, turnos: 2, pct: .2 } },
    { id: 'lanza', clase: 'mago', nombre: 'Lanza de hielo', icono: '❄️', turnos: 4, mult: 1.7, anim: animDe('tajo'),
      aplica: { estado: 'congelacion', prob: .3, turnos: 1 } },
    { id: 'meteoro', clase: 'mago', nombre: 'Meteoro', icono: '☄️', turnos: 6, mult: 4, nodo: 'meteoro', anim: animDe('aplastante'),
      aplica: { estado: 'quemadura', prob: .8, turnos: 3, pct: .3 } },
  );
  // Habilidades de la batalla: las de la clase (las de nodo, si están aprendidas), con las mejoras del árbol
  let HABILIDADES = [];
  batalla.carga = {};
  // habilidades de la clase del jugador actual (con conPerfil, de cualquier perfil) con las mejoras de su árbol
  function calcularHabilidades() {
    const aprendidos = nodosClase().filter(n => rango(n.id));
    const habs = HAB_TODAS.filter(h => h.clase === jugador.clase && (!h.nodo || rango(h.nodo))).map(h => {
      let mult = h.mult, turnos = h.turnos;
      for (const n of aprendidos) {
        if (n.habMult && n.habMult[0] === h.id) mult *= 1 + n.habMult[1] * rango(n.id);
        if (n.habRecarga && n.habRecarga[0] === h.id) turnos -= n.habRecarga[1] * rango(n.id);
      }
      return { ...h, mult, turnos: Math.max(1, turnos) };
    });
    return { habs, llenas: aprendidos.some(n => n.cargaInicial) };
  }
  function prepararHabilidades() {   // motor: habilidades de la clase y su carga inicial
    const { habs, llenas } = calcularHabilidades(); HABILIDADES = habs;
    for (const id in batalla.carga) delete batalla.carga[id];
    HABILIDADES.forEach(h => batalla.carga[h.id] = llenas ? h.turnos : 0);
  }
  const habLista = () => HABILIDADES.find(h => batalla.carga[h.id] >= h.turnos) || null;

  // ---------------- Jefe mundial: Cerbero ----------------
  // Hoja img/jefes/cerbero/cerbero.png (240x210 por cuadro, fondo recortado): 0-3 reposo, 4-7 ataque, 8-11 muerte; +12 = modo infernal.
  // img/jefes/cerbero/carga.png: 8 cuadros (carga la boca y forma la bola); img/jefes/cerbero/bola_fuego.png: 6 cuadros del proyectil.
  // Su vida es compartida entre intentos y se renueva cada día; al bajar del 50 % entra en modo infernal.
  // Jefes mundiales calibrados para 25-30k de poder: con ese perfil se aguantan ~15-25 rondas y hacen falta 2-3
  // intentos para tumbarlos (su vida es diaria y compartida entre intentos). Con menos poder se aporta menos daño.
  const VIDA_MUNDIAL = 15000, ESTAMINA_MUNDIAL = 20;
  const INFERNAL = { dano: 3, defensa: 3, defensaCritico: 1.5 };   // en infernal los críticos solo se dividen entre 1,5: premia builds de crítico   // modo infernal: triplica sus stats (x3 daño y recibe un tercio del daño)
  const CERBERO = { nombre: 'Cerbero', cerbero: true, armadura: 60, vida: VIDA_MUNDIAL, dano: [250, 350], avance: 300, oro: 0, xp: 0 };
  // Habilidades de Cerbero (solo en modo infernal), cada una con su propia carga de turnos:
  //  bola de fuego: cada 4 turnos, quema el 10 % de la vida máxima del guerrero (ignora armadura y defensa)
  //  lanzallamas largo: cada 2 turnos, daño x1.4. Si coinciden, va primero la bola de fuego.
  const BOLA_FUEGO = { turnos: 4, quemadura: .10 }, LANZALLAMAS = { turnos: 2, mult: 1.4 };
  Object.assign(batalla, { infernal: false, turnoBola: 0, turnoLanza: 0, danoHecho: 0, especialCerbero: null });
  // ---------------- Jefe mundial: Asmodeo ----------------
  // Hoja img/jefes/asmodeo/asmodeo.png (150x200 por cuadro): 0 reposo, 4 preparar, 5 barrido, 6 garras, 7 onda de alas,
  // 8-12 muerte (acaba en cristal), 13 daño, 14 retroceso, 15 curación, 16 victoria.
  // Habilidades: onda de alas cada 3 turnos (a distancia, x1.5); por debajo del 50 % se cura un 4 % cada 5 turnos.
  const ASMODEO = { nombre: 'Asmodeo', asmodeo: true, armadura: 80, vida: 20000, dano: [320, 430], avance: 330, oro: 0, xp: 0 };
  const ONDA_ALAS = { turnos: 3, mult: 1.5 }, CURACION = { turnos: 5, pct: .04 };   // 4 % (el 10 % anterior anulaba casi todo el daño con su vida actual)
  // escudo: solo por debajo del 50 %, cada 5 turnos suyos; reduce un 80 % el daño recibido durante 3 golpes del guerrero
  const ESCUDO = { turnos: 5, reduce: .8, dura: 3 };
  Object.assign(batalla, { turnoOnda: 0, turnoCura: 0, turnoEscudo: 0, escudoRestante: 0, especialAsmodeo: null });

  // Jefes mundiales: cada uno con su vida diaria (compartida entre intentos), su premio y su ranking
  const MUNDIALES = {
    cerbero: { enemigo: CERBERO, titulo: 'Cerbero, guardián del inframundo', estamina: ESTAMINA_MUNDIAL,
      premio: { oro: 3000, xp: 1500, piedra: 30, polvo: 12 },
      retrato: (v, max) => `background-position-x:${v <= max / 2 ? '-2880px' : '0'}`,
      reglas: ['Al bajar del 50 % entra en <b>modo infernal</b>: daño ×3 y recibe un tercio del daño, salvo los <b>críticos</b>, que atraviesan su piel de lava (÷1,5). Cada 2 turnos lanzallamas largo y cada 4 una bola de fuego que quema el 10 % de tu vida.', 'Prueba de build: <b>crítico, daño crítico y daño a jefes</b>.'] },
    asmodeo: { enemigo: ASMODEO, titulo: 'Asmodeo, señor de los demonios', estamina: 20,
      premio: { oro: 4000, xp: 2000, piedra: 40, polvo: 15 },
      retrato: () => 'background:url(img/jefes/asmodeo/asmodeo.png) 0 0 / 2550px 200px no-repeat; width:150px; height:200px',
      reglas: ['Alterna barridos y ráfagas de garras; cada 3 turnos lanza una <b>onda de alas</b> a distancia (daño x1.5).',
               'Por debajo del 50 % se <b>cura</b> un 4 % de su vida cada 5 turnos (la mitad si está quemado, envenenado o sangrando) y levanta un <b>escudo</b> que reduce un 80 % el daño durante 3 golpes; una <b>habilidad</b> lo rompe.',
               'Prueba de build: <b>daño sostenido, habilidades y supervivencia</b>.'] },
  };
  // ---------------- Jefe mundial: Gran Minotauro ----------------
  // img/jefes/minotauro/minotauro.png (280x230 por cuadro): 0-5 reposo, 6-12 ataque, 13-15 daño, 16-18 muerte, 19 victoria,
  // 20-24 furia (cuadros 31-35 de minotaur_buff.jpg).
  // Furia: por debajo del 70 % de vida, cada 10 turnos suyos (la primera en cuanto baja del 70 %);
  // triplica su daño durante sus 5 ataques siguientes. Usa su turno para activarla.
  const MINOTAURO = { nombre: 'Gran Minotauro', minotauro: true, armadura: 100, vida: 25000, dano: [300, 400], avance: 540, oro: 0, xp: 0 };
  const FURIA = { umbral: .7, turnos: 10, mult: 3, dura: 5 };
  // Gran Tajo: cada 5 turnos suyos (sin importar su vida) salta, abre un arco de fuego y lo estrella contra el suelo:
  // golpe al 300 % y además quita el 10 % de la vida máxima del guerrero (ignora armadura y defensa).
  const GRAN_TAJO = { turnos: 5, mult: 3, quema: .10, avance: 240 };
  Object.assign(batalla, { turnoFuria: FURIA.turnos, furiaRestante: 0, especialMinotauro: null, turnoTajo: 0 });
  MUNDIALES.minotauro = { enemigo: MINOTAURO, titulo: 'Gran Minotauro, coloso del laberinto', estamina: 20,
    premio: { oro: 5000, xp: 2500, piedra: 50, polvo: 18 },
    retrato: () => 'background:url(img/jefes/minotauro/minotauro.png) 0 0 / 7000px 230px no-repeat; width:280px; height:230px',
    reglas: ['Barre con su espada de fuego; cada 5 turnos usa el <b>Gran Tajo</b>: golpe al 300 % que además te quita un 10 % de vida.',
             'Por debajo del 70 % entra en <b>furia</b>: <b>triplica su daño</b> durante 5 turnos, cada 10 turnos.',
             'Prueba de build: <b>vida, defensa y reducción de daño</b> (la reducción frena el doble la parte del Gran Tajo que va por tu vida).'] };
  let mundialSel = 'cerbero';
  function estadoMundial(id = mundialSel) {
    if (jugador.mundial && !jugador.mundiales) { jugador.mundiales = { cerbero: jugador.mundial }; delete jugador.mundial; }   // partidas anteriores
    jugador.mundiales = jugador.mundiales || {};
    const e = jugador.mundiales[id];
    if (!e || e.dia !== hoy()) { jugador.mundiales[id] = { dia: hoy(), vida: MUNDIALES[id].enemigo.vida, mio: 0 }; guardar(); }
    return jugador.mundiales[id];
  }
  // Ranking de daño del día. Sin servidor, los demás jugadores se simulan con una semilla por fecha
  // (siempre los mismos valores el mismo día); cuando haya backend se sustituye por la lista real.
  const RIVALES = ['Ragnar', 'Lyra', 'Kaito', 'Morgana', 'Thorin', 'Selene', 'Draven'];
  function ranking() {
    let semilla = [...hoy() + mundialSel].reduce((h, c) => h * 31 + c.charCodeAt(0) >>> 0, 7);
    const rnd = () => (semilla = (semilla * 1664525 + 1013904223) >>> 0) / 2 ** 32;
    const lista = RIVALES.map(n => ({ nombre: n, pct: Math.round((2 + rnd() * 14) * 10) / 10 }));
    lista.push({ nombre: `${jugador.nombre} (tú)`, yo: true, pct: Math.round((estadoMundial().mio || 0) / MUNDIALES[mundialSel].enemigo.vida * 1000) / 10 });
    return lista.sort((a, b) => b.pct - a.pct);
  }
  function pintarRanking() {
    const lista = ranking(), puesto = lista.findIndex(j => j.yo) + 1;
    return `<div class="ranking"><h3>Top 5 · % de daño hoy</h3>${lista.slice(0, 5).map((j, i) =>
      `<div class="${j.yo ? 'yo' : ''}"><span>#${i + 1} ${j.nombre}</span><span class="pct"><i style="width:${Math.min(100, j.pct * 4)}%"></i></span><b>${j.pct}%</b></div>`).join('')}
      ${puesto > 5 ? `<div class="yo"><span>#${puesto} ${jugador.nombre} (tú)</span><span class="pct"><i style="width:${Math.min(100, lista[puesto - 1].pct * 4)}%"></i></span><b>${lista[puesto - 1].pct}%</b></div>` : ''}</div>`;
  }
  // Entradas de jefe: 3 al día para todos los jefes mundiales; no gastan estamina (la estamina queda para la campaña)
  const ENTRADAS_JEFE = 3;
  function entradasJefe() {
    if (jugador.diaJefes !== hoy()) { jugador.diaJefes = hoy(); jugador.entradasJefe = ENTRADAS_JEFE; }
    return jugador.entradasJefe;
  }
  function batallaMundial(id) {
    const m = MUNDIALES[id], e = { ...m.enemigo, dano: [...m.enemigo.dano], aplica: [...(m.enemigo.aplica || [])] };   // copia con los modificadores de la semana
    for (const md of modsSemana()) md.ap(e);
    return { nombre: 'Jefe mundial: ' + m.enemigo.nombre, mundial: id, coste: 0, premio: m.premio, botin: { piedra: [0, 0], polvo: 0 }, enemigos: [e] };
  }
  function iniciarMundial() {
    if (estadoMundial().vida <= 0 || entradasJefe() <= 0) return;
    jugador.entradasJefe--; guardar();
    iniciarCampana(batallaMundial(mundialSel));
  }
  // lanzallamas largo: carga la boca (cuadros 0-3 de la carga), enciende (llamita azul), el chorro se alarga
  // y sopla en continuo un rato sobre el guerrero. img/jefes/cerbero/lanzallamas.png: 0-3 encendido, 4-7 emisión, 8-24 continuo.
  const LLAMA = { alto: 96 * 1.9 };
  async function transformar() { batalla.infernal = true; await animarTransformacion(); }
  // escudo: mueve los brazos, genera el aura y el círculo, el aura se desvanece y vuelve a su pose;
  // después queda un brillo del color del aura mientras el escudo esté activo.
  // img/jefes/asmodeo/escudo.png: 36 cuadros de 260x220 (x2); orden: 3-30 (brazos, aura, círculo), 32-36 (el aura se deshace) y 31 (limpio).
  const ORDEN_ESCUDO = [...Array(28).keys()].map(i => i + 2).concat([31, 32, 33, 34, 35, 30]);

  // Daño: el ataque del guerrero varía ±15 %. Al recibir: la armadura y la defensa reducen cada una un %
  // con rendimiento decreciente (armadura / (armadura + 400), defensa / (defensa + 300)); cada golpe hace al menos el 15 % de su daño bruto.
  const danoGuerrero = st => Math.max(1, Math.round(st.ataque * (0.85 + rnd() * 0.3)));
  // (antes la defensa restaba un valor fijo y con equipo medio todo golpe quedaba en 1)
  const K_ARMADURA = 400, K_DEFENSA = 300, DANO_MINIMO = .15;
  const factorDefensa = st => Math.max(DANO_MINIMO, K_ARMADURA / (K_ARMADURA + st.armadura) * K_DEFENSA / (K_DEFENSA + st.defensa));
  // Orden del cálculo de un golpe (igual en 1 contra 1 y en grupo):
  //   bruto → × (1 + daño de habilidades [solo habilidades] + daño a jefes [solo jefes] + remate [<50 %]) → × crítico
  //   → × factorDefensa(armadura × (1 − penetración), defensa) → × (1 − reducción de daño del objetivo) → escudos y fases
  // Los efectos de estado por turno (quemadura, veneno, sangrado) no pasan por armadura: los frena la resistencia.
  const multGolpe = (ef, hab, jefe, remate) => (hab ? hab.mult : 1) * (1 + (hab ? ef('habilidad') : 0) + (jefe ? ef('jefes') : 0) + (remate ? ef('remate') : 0));
  const armaduraEfectiva = (A, pen, perfora) => perfora ? 0 : A * (1 - pen);
  // Resistencia (a estados negativos): una parte evita el estado y otra reduce su daño. Una sola tirada, sin doble cuenta:
  // al tope (75 %) se evita el 45 % de las veces y el resto hace un 30 % menos de daño.
  const resistir = res => ({ evita: rnd() < res * .6, factor: 1 - res * .4 });
  const danoRecibido = (bruto, st) => Math.max(1, Math.round(bruto * factorDefensa(st)));

  // Estado de la batalla
  batalla.terminada = true;

  // Motor: deja `batalla` lista para empezar la batalla c, sin dibujar nada ni gastar estamina
  function prepararBatalla(c) {
    batalla.id = (batalla.id || 0) + 1;   // identifica la batalla: lo que quede por dibujar de otra anterior se descarta
    batalla.danoHecho = 0; batalla.especialCerbero = null; batalla.turnoBola = 0; batalla.turnoLanza = 0; batalla.turnoOnda = 0; batalla.turnoCura = 0; batalla.turnoEscudo = 0; batalla.escudoRestante = 0; batalla.turnoFuria = FURIA.turnos - 1; batalla.furiaRestante = 0; batalla.especialMinotauro = null; batalla.turnoTajo = 0; batalla.especialAsmodeo = null;
    c.grupo = !!(c.idCampana || c.torre || c.reyes || c.calabozo);   // campaña, Torre y Torre de reyes: batalla por grupos en rombo
    batalla.campana = c; batalla.reglas = c.grupo ? REGLAS.grupo : REGLAS.duelo;
    prepararHabilidades(); batalla.st = estadisticas(); batalla.ganado = { oro: 0, xp: 0, piedra: 0, polvo: 0, almas: 0, objetos: [] }; batalla.terminada = false;
    if (c.grupo) armarGrupo(c); else armarDuelo();
  }
  let obtenidos = [];

  // ---------------- Efectos de estado ----------------
  // Daño por turno (quemadura, veneno, sangrado) o pérdida del turno (congelación, aturdimiento).
  // Se resuelven al empezar el turno de quien los sufre. El daño por turno se fija al aplicarse:
  // si lo aplica un enemigo es un % de tu vida máxima; si lo aplicas tú, un % de tu ataque.
  const ESTADOS = {
    quemadura:    { icono: '🔥', nombre: 'Quemadura' },
    veneno:       { icono: '☠️', nombre: 'Veneno', acumula: 5 },   // se acumula hasta 5 veces
    sangrado:     { icono: '🩸', nombre: 'Sangrado' },
    congelacion:  { icono: '❄️', nombre: 'Congelación', control: true },
    aturdimiento: { icono: '💫', nombre: 'Aturdimiento', control: true },
  };
  // ---------------- Motor del combate (todos los modos) ----------------
  // Un solo motor para todas las batallas: el 1 contra 1 (arena y jefes mundiales) es un grupo de 1 héroe contra 1 enemigo.
  // Resuelve la ronda entera de una vez, sin tocar la pantalla ni esperar animaciones: cambia el estado de las unidades
  // (vida, estados, cargas) y deja en una lista los eventos que la interfaz reproduce después. Así el resultado de la ronda
  // no depende de lo que tarde la animación, y la misma ronda se puede simular sin dibujar nada.
  //   [tipo, ...datos] → 'vidaU' u, actual, max, retraso · 'fxU' u, clase, texto, dy, retraso · 'curaU' u, cantidad, icono, retraso
  //   'estadosU' u, copia · 'claseU' u, nombre, on · 'animHeroe' u, objetivo, hab · 'animEnemigo' u, objetivo, ataque · 'volver' u
  //   'golpe' atacante, objetivo, hab, crítico, daño, jefe · 'muerteU' u, jefe · 'marcar' u · 'mascota' yo, avanza · 'espera' ms
  //   'estadoAtaque' texto · 'carga' · 'transformar' · 'siguiente' · 'resultado' gano
  let eventos = [];
  const emitir = (...e) => eventos.push(e);
  const verVida = (u, retraso = 0) => emitir('vidaU', u, u.vida, u.vidaMax, retraso);
  const verFx = (u, cls, texto, retraso = 0, dy = 0) => emitir('fxU', u, cls, texto, dy, retraso);
  const verEstados = u => emitir('estadosU', u, JSON.parse(JSON.stringify(u.estados)));   // copia: luego siguen cambiando
  function curar(u, c, icono = '', retraso = 0) { u.vida = Math.min(u.vidaMax, u.vida + c); verVida(u, retraso); emitir('curaU', u, c, icono, retraso); }
  const esJefe = e => !!(e && (e.jefe || e.cerbero || e.asmodeo || e.minotauro));
  const tipoJefe = (e = batalla.enemigo) => ({ cerbero: !!e.cerbero, asmodeo: !!e.asmodeo, minotauro: !!e.minotauro });
  const heroeYo = () => batalla.grupo.heroes.find(h => h.yo);
  const enemigoDuelo = () => batalla.grupo.enemigos[0];   // 1 contra 1: el enemigo que está luchando

  // Lo único que cambia entre el 1 contra 1 (duelo) y el grupo: el ritmo de la animación de cada escena (ms)
  const REGLAS = {
    duelo: { duelo: true, esperas: { estados: 600, control: 700, esquiva: 700, contra: 600, turnoEnemigo: 600, mascotaIda: 220, mascotaVuelta: 450, curaMascota: 600 } },
    grupo: { duelo: false, esperas: { estados: 450, control: 500, esquiva: 250, contra: 300, turnoEnemigo: 250, mascotaIda: 0, mascotaVuelta: 400, curaMascota: 400 } },
  };
  const reglas = () => batalla.reglas || REGLAS.grupo;

  // ---- unidades ----
  // Cada combatiente es una unidad: { lado (0 héroes, 1 enemigos), pos, nombre, vida, vidaMax, st, estados, inmune, ... }.
  // Los jugadores (tú, aliados y reyes) llevan perfil, ef (sus efectos), golpes, s4 (sets), habs y carga; los monstruos, e
  // (sus datos). conEfectos: tiene efectos defensivos propios (esquiva, resistencia, contraataque...): jugadores y rivales de arena.
  // duelo: es del 1 contra 1 (los dos en la casilla del frente), se dibuja en su lado de la escena (slots) en vez de en el rombo.
  function crearUnidad(lado, pos, nombre) {   // motor: datos de la unidad (dibujarUnidad le pone su elemento)
    const [x, y] = pos ? (lado === 0 ? XY_HEROE : XY_ENEMIGO)[pos] : [];
    return { lado, pos, nombre, x, y, estados: {}, inmune: 0 };
  }
  function unidadJugador(m) {   // tú o un aliado: m = { yo, pos, perfil }
    const u = crearUnidad(0, m.pos, m.yo ? `${jugador.nombre} Nv ${jugador.nivel}` : `${m.perfil.nombre} Nv ${m.perfil.nivel}`);
    u.heroe = true; u.yo = !!m.yo; u.perfil = m.perfil; u.clase = m.perfil.clase; u.conEfectos = true;
    u.st = u.yo ? batalla.st : conPerfil(m.perfil, estadisticas);
    u.ef = u.yo ? efecto : k => conPerfil(m.perfil, () => efecto(k));
    u.golpes = u.yo ? golpesEstado() : conPerfil(m.perfil, golpesEstado);
    u.s4 = u.yo ? set4 : j => conPerfil(m.perfil, () => set4(j));   // sets de 4 piezas de cada jugador
    if (u.yo) { u.habs = HABILIDADES; u.carga = batalla.carga; }
    else { const h = conPerfil(m.perfil, calcularHabilidades); u.habs = h.habs; u.carga = Object.fromEntries(h.habs.map(x => [x.id, h.llenas ? x.turnos : 0])); }
    u.vida = u.vidaMax = u.st.vida;
    return u;
  }
  function unidadMonstruo(e, pos) {   // un monstruo, un jefe o un rival de la arena (sus efectos defensivos van en e.ef)
    const u = crearUnidad(1, pos, e.nombre);
    u.e = e; u.st = { ataque: 0, defensa: 0, vida: e.vida, armadura: e.armadura || 0 }; u.vida = u.vidaMax = e.vida;
    u.ef = k => e.ef ? e.ef[k] || 0 : 0; u.conEfectos = !!e.ef; u.turnoRival = 0;
    return u;
  }
  // 1 contra 1: tú contra los enemigos de la batalla, de uno en uno
  function armarDuelo() {
    const yo = unidadJugador({ yo: true, pos: 'frente', perfil: jugador }); yo.duelo = true; yo.el = slots[0];
    batalla.grupo = { heroes: [yo], enemigos: [], turnoMascota: 0, objetivo: null, duelo: true };
    siguienteEnemigo(0);
  }
  function siguienteEnemigo(i) {   // motor: el enemigo i entra en combate (1 contra 1)
    const e = batalla.campana.enemigos[i], u = unidadMonstruo(e, 'frente');
    batalla.enemigo = e; batalla.iEnemigo = i; u.duelo = true; u.el = slots[1];
    if (batalla.campana.mundial) u.vida = estadoMundial(batalla.campana.mundial).vida;   // el jefe mundial conserva el daño de otros intentos
    batalla.infernal = !!e.cerbero && u.vida <= e.vida / 2;
    batalla.grupo.enemigos = [u]; batalla.grupo.objetivo = u;
  }
  // Quien tiene efectos defensivos puede resistirlo (lo evita o le hace menos daño). Los jefes mundiales no se pueden
  // controlar (aturdir, congelar); los demás jefes, rivales y reyes, no dos veces seguidas (inmunidad unos turnos).
  function aplicarEstado(u, id, turnos, dano = 0) {
    const def = ESTADOS[id];
    if (u.conEfectos) { const rs = resistir(u.ef('resistencia')); if (rs.evita) { verFx(u, 'num-cura', '🛡 Resistido', 250, -30); return; } dano = Math.round(dano * rs.factor); }
    if (!u.heroe && def.control) {
      const e = u.e;
      if (e.cerbero || e.asmodeo || e.minotauro) { verFx(u, 'num-cura', '🛡 Inmune', 250, -30); return; }
      if (e.jefe || e.rival || e.rey) { if (u.inmune > 0) { verFx(u, 'num-cura', '🛡 Inmune', 250, -30); return; } u.inmune = turnos + 2; }
    }
    const e = u.estados[id];
    if (e && def.acumula) { e.pilas = Math.min(def.acumula, e.pilas + 1); e.turnos = Math.max(e.turnos, turnos); e.dano = Math.max(e.dano, dano); }
    else u.estados[id] = { turnos, dano, pilas: 1 };
    verFx(u, 'dano', `${def.icono} ${def.nombre}`, 250, -30); verEstados(u);
  }
  function regenerar(u) {   // modificador Regeneración
    if (u.e && u.e.regen && u.vida > 0 && u.vida < u.vidaMax) curar(u, Math.min(u.vidaMax - u.vida, Math.round(u.vidaMax * u.e.regen)), '💚 ');
  }
  // Al empezar su turno: daño de sus estados y un turno menos de cada uno. Devuelve true si no actúa (pierde el turno o cae).
  function resolverTick(u) {
    const R = reglas(); let total = 0, iconos = '', control = null;
    if (u.inmune > 0) u.inmune--;
    for (const [id, e] of Object.entries(u.estados)) {
      if (ESTADOS[id].control) control = ESTADOS[id]; else { total += e.dano * e.pilas; iconos += ESTADOS[id].icono; }
      if (--e.turnos <= 0) delete u.estados[id];
    }
    verEstados(u);
    if (total > 0) {
      total = Math.min(total, Math.max(0, u.vida)); u.vida -= total; if (!u.heroe) batalla.danoHecho += total;
      verVida(u); verFx(u, 'dano', `${iconos} -${total}`); emitir('espera', R.esperas.estados);
    }
    if (u.vida <= 0) { morir(u); return true; }
    if (control) { verFx(u, 'num-cura', `${control.icono} Pierde el turno`); emitir('espera', R.esperas.control); }
    return !!control;
  }

  // ---- objetivos ----
  const vivos = l => l.filter(u => u.vida > 0);
  function objetivoPorPosicion(l) {   // golpe normal: más probable al frente
    const v = vivos(l), tot = v.reduce((t, u) => t + PESO_POS[u.pos], 0); let r = rnd() * tot;
    for (const u of v) { r -= PESO_POS[u.pos]; if (r < 0) return u; } return v[0];
  }
  const objetivoAlAzar = l => elegir(vivos(l));
  // Objetivo del jugador: el enemigo que toque (golpes y habilidades van a él). Si no eligió o cayó, el más adelantado
  // (frente, arriba, abajo, retaguardia); también en autoataque. Aliados y enemigos siguen eligiendo por posición.
  function elegirObjetivo() {   // motor
    let t = batalla.grupo.objetivo && batalla.grupo.objetivo.vida > 0 ? batalla.grupo.objetivo : null;
    if (!t) t = POSICIONES.map(p => batalla.grupo.enemigos.find(e => e.pos === p && e.vida > 0)).find(Boolean) || vivos(batalla.grupo.enemigos)[0];
    batalla.grupo.objetivo = t; return t;
  }
  // set 4 del Minotauro: un golpe de más del 15 % de la vida máxima se reduce un 35 %
  function aguanteSet4(t, dano) {
    if (!(t.s4 && t.s4('minotauro') && dano > t.vidaMax * SET4_GOLPE)) return dano;
    verFx(t, 'num-cura', '🐂 Aguante', 200, -30); return Math.max(1, Math.round(dano * (1 - SET4_REDUCE)));
  }
  // aliados y reyes eligen solos: su mejor habilidad lista (las demás siguen cargando)
  function habAuto(u) {
    const h = u.habs.filter(x => u.carga[x.id] >= x.turnos).sort((a, b) => b.mult - a.mult)[0] || null;
    for (const x of u.habs) u.carga[x.id] = x === h ? 0 : Math.min(x.turnos, u.carga[x.id] + 1);
    return h;
  }

  // ---- acciones ----
  // Último bastión y Segundo aliento de un héroe tras recibir un golpe: una vez por batalla cada uno
  function nodosVida(t) {
    if (!t.heroe) return;
    const r = id => t.yo ? rangoClase(id) : conPerfil(t.perfil, () => rangoClase(id));
    if (t.vida <= 0 && r('bastion') && !t.bastionUsado) {
      t.bastionUsado = true; t.vida = 1; verVida(t); verFx(t, 'num-cura', '🏰 Último bastión', 400, -30);
    }
    if (t.vida > 0 && t.vida < t.vidaMax * .3 && r('aliento') && !t.alientoUsado) {
      t.alientoUsado = true; curar(t, Math.min(t.vidaMax - t.vida, Math.round(t.vidaMax * .1 * r('aliento'))), '🌬️ ', 500);
    }
  }
  // Efectos de la habilidad sobre el objetivo: aturdimiento y su estado (quemadura, congelación, sangrado...)
  function efectosHab(u, t, hab) {
    if (!hab || t.vida <= 0) return;
    if (hab.aturde) aplicarEstado(t, 'aturdimiento', 1);
    if (hab.aplica && rnd() < hab.aplica.prob) aplicarEstado(t, hab.aplica.estado, hab.aplica.turnos, Math.max(1, Math.round(u.st.ataque * (hab.aplica.pct || 0))));
  }
  // Un jugador actúa: tú, un aliado (héroes contra enemigos) o un rey (contra los héroes). hab: la que eligió el jugador.
  function resolverAccionJugador(u, hab, rivales) {
    const R = reglas(), pierde = resolverTick(u);
    if (u.yo) {   // cada turno carga las demás habilidades
      for (const x of u.habs) u.carga[x.id] = x === hab ? 0 : Math.min(x.turnos, u.carga[x.id] + 1);
      emitir('carga');
    } else hab = habAuto(u);
    if (pierde || !vivos(rivales).length) return;
    let t;
    if (u.yo && rivales === batalla.grupo.enemigos) { t = elegirObjetivo(); if (!t.duelo) emitir('marcar', t); }
    else t = hab ? objetivoAlAzar(rivales) : objetivoPorPosicion(rivales);
    emitir('animHeroe', u, t, hab);
    if (t.conEfectos && rnd() < t.ef('esquiva')) {
      verFx(t, 'num-cura', '💨 Esquiva'); emitir('espera', R.esperas.esquiva); emitir('volver', u);
      return;
    }
    // daño: bruto → × habilidad, jefes y remate → × crítico → × defensa del objetivo → × su reducción → fases de jefe
    let dano = danoGuerrero(u.st), critico = false;
    let m = multGolpe(u.ef, hab, esJefe(t.e), t.vida < t.vidaMax / 2);
    if (rnd() < u.ef('critico')) { critico = true; m *= DANO_CRITICO_BASE + u.ef('danoCritico'); }
    const def = t.perfil ? t.st : { armadura: t.e.armadura || 0, defensa: t.e.defensa || 0 };   // misma defensa para todos
    m *= factorDefensa({ armadura: armaduraEfectiva(def.armadura, u.ef('penetracion'), hab && hab.perfora), defensa: def.defensa }) * (1 - t.ef('reduccion'));
    dano = Math.max(1, Math.round(dano * m));
    if (batalla.infernal && t.e && t.e.cerbero) dano = Math.max(1, Math.round(dano / (critico ? INFERNAL.defensaCritico : INFERNAL.defensa)));
    if (batalla.escudoRestante > 0 && t.e && t.e.asmodeo) {   // escudo de Asmodeo: absorbe el 80 % y gasta un turno; una habilidad lo rompe
      if (hab) { dano = Math.max(1, Math.round(dano * .7)); batalla.escudoRestante = 0; emitir('claseU', t, 'escudado', false); verFx(t, 'num-cura', '💥 Escudo roto', 300); }
      else { dano = Math.max(1, Math.round(dano * (1 - ESCUDO.reduce))); if (--batalla.escudoRestante === 0) emitir('claseU', t, 'escudado', false); }
    }
    dano = Math.min(t.vida, aguanteSet4(t, dano));
    t.vida -= dano; if (!t.heroe) batalla.danoHecho += dano; verVida(t);
    nodosVida(t);
    if (t.e && t.e.espinas && dano > 0 && u.vida > 1) {   // modificador Espinas: devuelve parte del daño
      const r = Math.max(1, Math.round(dano * t.e.espinas)); u.vida = Math.max(1, u.vida - r); verVida(u); verFx(u, 'dano', `🌵 -${r}`, 300);
    }
    const robo = Math.round(dano * u.ef('robo')); if (robo > 0 && u.vida < u.vidaMax) curar(u, Math.min(robo, u.vidaMax - u.vida), '💀 ', 300);
    if (hab && u.s4('asmodeo') && u.vida < u.vidaMax) curar(u, Math.min(u.vidaMax - u.vida, Math.round(u.vidaMax * SET4_CURA)), '🔯 ', 300);   // set 4 de Asmodeo
    if (t.vida > 0) {
      for (const g of u.golpes) if (rnd() < g.prob) aplicarEstado(t, g.estado, g.turnos, Math.max(1, Math.round(u.st.ataque * g.pct)));
      if (critico && u.s4('cerbero')) aplicarEstado(t, 'quemadura', 2, Math.max(1, Math.round(u.st.ataque * .3)));   // set 4 de Cerbero
      efectosHab(u, t, hab);
    }
    emitir('golpe', u, t, hab, critico, dano, t.duelo ? tipoJefe() : null);
    if (t.e && t.e.cerbero && !batalla.infernal && t.vida > 0 && t.vida <= t.vidaMax / 2) { batalla.infernal = true; emitir('transformar'); }
    emitir('espera', 250); emitir('volver', u);
    if (t.vida <= 0) { morir(t); return; }
    if (t.conEfectos && rnd() < t.ef('contra')) {   // contraataque del objetivo
      const c = t.perfil ? danoGuerrero(t.st) * .6 * factorDefensa(u.st) * (1 - u.ef('reduccion'))   // un rey: como cualquier jugador
        : danoRecibido(azar(...t.e.dano) * .6, u.st) * (1 - u.ef('reduccion'));   // el rival de la arena
      contraatacar(t, u, c);
    }
  }
  function contraatacar(de, a, c) {
    c = Math.max(1, Math.min(a.vida, Math.round(c))); a.vida -= c; if (!a.heroe) batalla.danoHecho += c;
    verVida(a); verFx(a, 'dano critico', `⚙ Contra -${c}`); emitir('espera', reglas().esperas.contra);
    if (a.vida <= 0) morir(a);
  }
  // Qué hace un enemigo en su turno: los jefes mundiales, su especial según sus contadores (la animación solo lo dibuja)
  function decidirAtaqueEnemigo(u) {
    const e = u.e;
    if (e.cerbero) {
      batalla.turnoBola++; batalla.turnoLanza++;
      batalla.especialCerbero = !batalla.infernal ? null : batalla.turnoBola >= BOLA_FUEGO.turnos ? 'bola' : batalla.turnoLanza >= LANZALLAMAS.turnos ? 'lanza' : null;
      if (batalla.especialCerbero === 'bola') batalla.turnoBola = 0;
      if (batalla.especialCerbero === 'lanza') batalla.turnoLanza = 0;
      return batalla.especialCerbero || 'normal';
    }
    if (e.asmodeo) {
      batalla.turnoOnda++; batalla.turnoCura++;
      const herido = u.vida <= u.vidaMax / 2;
      if (herido) batalla.turnoEscudo++;
      if (herido && !batalla.escudoRestante && batalla.turnoEscudo >= ESCUDO.turnos) { batalla.turnoEscudo = 0; return batalla.especialAsmodeo = 'escudo'; }   // el escudo usa su turno, como la curación
      if (herido && batalla.turnoCura >= CURACION.turnos) { batalla.turnoCura = 0; return batalla.especialAsmodeo = 'cura'; }
      if (batalla.turnoOnda >= ONDA_ALAS.turnos) { batalla.turnoOnda = 0; return batalla.especialAsmodeo = 'onda'; }
      batalla.especialAsmodeo = null;
      return rnd() < .5 ? 'garras' : 'barrido';
    }
    if (e.minotauro) {
      if (u.vida <= u.vidaMax * FURIA.umbral && !batalla.furiaRestante && ++batalla.turnoFuria >= FURIA.turnos) { batalla.turnoFuria = 0; return batalla.especialMinotauro = 'furia'; }
      if (++batalla.turnoTajo >= GRAN_TAJO.turnos) { batalla.turnoTajo = 0; return batalla.especialMinotauro = 'tajo'; }
      batalla.especialMinotauro = batalla.furiaRestante > 0 ? 'golpe-furia' : null;
    }
    return 'normal';
  }
  // Especiales de jefe que no son un golpe (entrar en furia, levantar el escudo, curarse): true si gastó así su turno
  function especialSinGolpe(u) {
    if (batalla.especialMinotauro === 'furia') {
      batalla.furiaRestante = FURIA.dura; emitir('claseU', u, 'furia', true); verFx(u, 'num-cura', '🔥 ¡Furia! x3');
      batalla.especialMinotauro = null; emitir('espera', 700); return true;
    }
    if (batalla.especialAsmodeo === 'escudo') {
      batalla.escudoRestante = ESCUDO.dura; emitir('claseU', u, 'escudado', true); verFx(u, 'num-cura', '🛡 Escudo');
      batalla.especialAsmodeo = null; emitir('espera', 700); return true;
    }
    if (batalla.especialAsmodeo === 'cura') {   // quemado, envenenado o sangrando: cura la mitad
      const herido = ['quemadura', 'veneno', 'sangrado'].some(k => u.estados[k]);
      if (herido) verFx(u, 'num-cura', '☠ Curación a la mitad', 300);
      curar(u, Math.min(u.vidaMax - u.vida, Math.round(u.vidaMax * CURACION.pct * (herido ? .5 : 1))));
      batalla.especialAsmodeo = null; emitir('espera', 900); return true;
    }
    return false;
  }
  // Golpe especial de jefe: multiplica el daño y añade el daño fijo de la bola de fuego o del Gran Tajo
  function golpeEspecial(t, dano) {
    if (batalla.especialCerbero === 'lanza') dano = Math.round(dano * LANZALLAMAS.mult);
    if (batalla.especialAsmodeo === 'onda') { dano = Math.round(dano * ONDA_ALAS.mult); batalla.especialAsmodeo = null; }
    if (batalla.especialMinotauro === 'tajo') {   // Gran Tajo: x3 (y x3 más si está en furia) + 10 % de la vida máxima
      dano *= GRAN_TAJO.mult * (batalla.furiaRestante > 0 ? FURIA.mult : 1);
      if (batalla.furiaRestante > 0 && --batalla.furiaRestante === 0) emitir('claseU', enemigoDuelo(), 'furia', false);
      const corte = Math.max(1, Math.round(t.vidaMax * GRAN_TAJO.quema * resistir(t.ef('resistencia')).factor * Math.max(.2, 1 - 2 * t.ef('reduccion'))));   // la reducción cuenta doble aquí
      dano += corte; verFx(t, 'dano critico', `🪓 -${corte}`, 350); batalla.especialMinotauro = null;
    }
    if (batalla.especialMinotauro === 'golpe-furia') {   // furia: daño x3, gasta un turno de duración
      dano *= FURIA.mult; batalla.especialMinotauro = null;
      if (--batalla.furiaRestante === 0) emitir('claseU', enemigoDuelo(), 'furia', false);
    }
    if (batalla.especialCerbero === 'bola') {   // quemadura de la bola de fuego: daño extra fijo, ignora armadura y defensa
      const quema = Math.max(1, Math.round(t.vidaMax * BOLA_FUEGO.quemadura * resistir(t.ef('resistencia')).factor));
      dano += quema; verFx(t, 'dano critico', `🔥 -${quema}`, 350);
    }
    batalla.especialCerbero = null;
    return dano;
  }
  // Un monstruo, jefe o rival de la arena ataca a un héroe
  function resolverAccionEnemigo(u) {
    const R = reglas();
    if (resolverTick(u)) return;
    regenerar(u);
    if (!vivos(batalla.grupo.heroes).length) return;
    const ataque = decidirAtaqueEnemigo(u), t = objetivoPorPosicion(batalla.grupo.heroes);
    emitir('animEnemigo', u, t, ataque);
    if (especialSinGolpe(u)) { emitir('volver', u); return; }
    const especial = !!(batalla.especialCerbero || batalla.especialAsmodeo || batalla.especialMinotauro);   // no se esquivan
    if (!especial && rnd() < t.ef('esquiva')) { verFx(t, 'num-cura', '💨 Esquiva'); emitir('espera', R.esperas.esquiva); emitir('volver', u); return; }
    const e = u.e; let dano = danoRecibido(azar(...e.dano), t.st), critico = false;
    if (e.rival) {   // el rival de la arena: su Estocada cada N turnos y sus críticos
      if (++u.turnoRival % e.habilidad.turnos === 0) { dano = Math.round(dano * e.habilidad.mult); verFx(u, 'num-cura', `⚔ ${e.habilidad.nombre}`); }
      if (rnd() < e.critico) { critico = true; dano = Math.round(dano * e.danoCritico); }
    }
    dano = Math.max(1, Math.round(dano * (1 - t.ef('reduccion'))));
    if (batalla.infernal) dano = Math.round(dano * INFERNAL.dano);
    if (especial) dano = golpeEspecial(t, dano);
    dano = Math.min(t.vida, aguanteSet4(t, dano));
    t.vida -= dano; verVida(t);
    const roboR = Math.min(Math.round(dano * u.ef('robo')), u.vidaMax - u.vida);   // robo de vida del rival
    if (roboR > 0) curar(u, roboR, '💀 ', 300);
    nodosVida(t);
    if (t.vida > 0) for (const a of e.aplica || []) if (rnd() < a.prob) aplicarEstado(t, a.estado, a.turnos, Math.max(1, Math.round(t.vidaMax * (a.pct || 0))));
    emitir('golpe', u, t, null, critico, dano, t.duelo ? tipoJefe() : null);
    emitir('espera', 250); emitir('volver', u);
    if (t.vida <= 0) { morir(t); return; }
    if (rnd() < t.ef('contra')) {   // contraataque de tu skin
      contraatacar(t, u, danoGuerrero(t.st) * .6);
    }
  }
  function resolverMascota() {
    const R = reglas(), m = mascotaActual(), yo = heroeYo(); if (!m || !yo || yo.vida <= 0) return;
    if (++batalla.grupo.turnoMascota < m.accion.turnos) return; batalla.grupo.turnoMascota = 0;
    const pct = valorNivel(m.accion.pct, nivelMascota(m)) / 100;
    if (m.accion.tipo === 'cura') {
      const t = vivos(batalla.grupo.heroes).sort((a, b) => a.vida / a.vidaMax - b.vida / b.vidaMax)[0];
      curar(t, Math.min(t.vidaMax - t.vida, Math.round(t.vidaMax * pct * (1 + efecto('curacion')))), '🐾 '); emitir('espera', R.esperas.curaMascota); return;
    }
    const t = objetivoAlAzar(batalla.grupo.enemigos); if (!t) return;
    emitir('mascota', yo, true); emitir('espera', R.esperas.mascotaIda);
    const dt = t.perfil ? t.st : { armadura: t.e.armadura || 0, defensa: t.e.defensa || 0 };
    const def = factorDefensa({ armadura: armaduraEfectiva(dt.armadura, efecto('penetracion')), defensa: dt.defensa }) * (1 - t.ef('reduccion'));
    const d = Math.max(1, Math.min(t.vida, Math.round(batalla.st.ataque * pct * def * (batalla.infernal ? 1 / INFERNAL.defensa : 1))));
    t.vida -= d; batalla.danoHecho += d; verVida(t); verFx(t, 'dano', `🐾 -${d}`);
    const ap = m.accion.aplica; if (ap && t.vida > 0 && rnd() < ap.prob) aplicarEstado(t, ap.estado, ap.turnos, Math.max(1, Math.round(batalla.st.ataque * (ap.pct || 0))));
    emitir('mascota', yo, false); emitir('espera', R.esperas.mascotaVuelta);
    if (t.vida <= 0) morir(t);
  }
  function morir(u) {
    if (!u.heroe && !u.e.rey) cobrar(u);   // los reyes no dan botín: el premio es el de la dificultad
    emitir('muerteU', u, u.duelo && !u.heroe ? tipoJefe(u.e) : null);
  }
  // botín de un enemigo vencido: se acumula y se cobra al terminar la batalla
  function cobrar(u) {
    if (batalla.campana.abandonada) return;   // la ronda en curso ya no cuenta muertes ni botín
    const e = u.e, b = batalla.campana.botin, x = e.jefe ? 3 : 1, dropEv = (eventoHoy() || {}).drop || 1;   // fin de semana: doble botín
    sumarLogro('enemigos'); contarMision('enemigos');
    const mat = { piedra: azar(...b.piedra) * x, polvo: (rnd() < b.polvo * (1 + efecto('fortuna')) * dropEv ? 1 : 0) * x };
    if (b.cofre && rnd() < (e.jefe ? .3 : .06) * (b.drop || 1) * (1 + efecto('fortuna')) * dropEv) {   // objeto de equipo
      const o = objetoAzar(COFRES.find(k => k.id === b.cofre).probs, efecto('fortuna') / 3 + ((eventoHoy() || {}).caza || 0));   // Fortuna: 1/3 de prob. de subir rareza; Cacería: +15 %
      batalla.ganado.objetos.push(o); verFx(u, 'premio', `🎁 ${modelo[o.modelo].nombre}`, 700, 30);
    }
    if (!e.rival) { jugador.bestiario ||= {}; jugador.bestiario[e.nombre] = (jugador.bestiario[e.nombre] || 0) + 1; }
    sumarMaestria(esJefe(e) ? 5 : 1);
    batalla.ganado.oro += e.oro; batalla.ganado.xp += e.xp; batalla.ganado.piedra += mat.piedra; batalla.ganado.polvo += mat.polvo;
    verFx(u, 'premio', u.duelo ? `+${e.oro} oro  +${e.xp} XP  🔷${mat.piedra}${mat.polvo ? ' ✨' + mat.polvo : ''}` : `+${e.oro} oro +${e.xp} XP`);
  }

  // ---- ronda ----
  // Actúan los héroes (de delante atrás), la mascota y luego los enemigos. Devuelve los eventos para dibujarla.
  function resolverRonda(hab) {
    eventos = [];
    const G = batalla.grupo, R = reglas(), orden = l => POSICIONES.flatMap(p => l.filter(u => u.pos === p));
    emitir('estadoAtaque', 'Atacando...');
    for (const u of orden(G.heroes)) if (u.vida > 0 && vivos(G.enemigos).length) resolverAccionJugador(u, hab, G.enemigos);
    if (vivos(G.enemigos).length) resolverMascota();
    if (vivos(G.enemigos).length && vivos(G.heroes).length) {
      emitir('estadoAtaque', 'Esperando...'); emitir('espera', R.esperas.turnoEnemigo);
      for (const u of orden(G.enemigos)) {
        if (u.vida <= 0 || !vivos(G.heroes).length) continue;
        if (u.perfil) resolverAccionJugador(u, null, G.heroes); else resolverAccionEnemigo(u);
      }
    }
    if (!vivos(G.enemigos).length) {
      if (R.duelo && batalla.iEnemigo + 1 < batalla.campana.enemigos.length) { siguienteEnemigo(batalla.iEnemigo + 1); emitir('siguiente'); }
      else { emitir('espera', 400); emitir('resultado', true); }
    }
    else if (!vivos(G.heroes).length) emitir('resultado', false);
    return eventos;
  }

  let enRonda = false, auto = false, bucle = false;

  // ---------------- Utilidades de recompensa y calendario ----------------
  const ICONO_PREMIO = { oro: '●', xp: 'XP', piedra: '🔷', polvo: '✨', almas: '💠', estamina: '⚡' };
  const textoPremio = pr => Object.entries(pr).filter(([, v]) => v).map(([k, v]) => `${ICONO_PREMIO[k]} ${Math.round(v).toLocaleString('es')}`).join(' · ');
  function darPremio(pr) {
    for (const [k, v] of Object.entries(pr)) {
      if (k === 'oro') jugador.oro += Math.round(v);
      else if (k === 'estamina') jugador.estamina = Math.min(ESTAMINA_MAX * 2, jugador.estamina + v);   // puede pasar del máximo (hasta el doble)
      else jugador.mat[k] = (jugador.mat[k] || 0) + Math.round(v);
    }
  }
  // lunes de la semana actual (clave de misiones semanales y modificadores de jefe)
  function semana() { const d = ahoraJuego(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function azarSemilla(semilla) {   // generador reproducible (mismo piso / misma semana = mismo resultado)
    let t = [...String(semilla)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703);
    return () => { t += 0x6D2B79F5; let r = Math.imul(t ^ t >>> 15, 1 | t); r ^= r + Math.imul(r ^ r >>> 7, 61 | r); return ((r ^ r >>> 14) >>> 0) / 4294967296; };
  }

  // ---------------- Eventos por calendario ----------------
  // Se repiten solos cada semana: fin de semana doble botín, miércoles de oro, viernes de experiencia
  // Eventos rotativos: cada día favorece un tipo de farmeo ("hoy conviene farmear esto"). No regalan nada: cambian
  // qué rinde más. drop: prob. de equipo · caza: prob. de subir rareza · mat: piedras y polvo · forja: descuento de oro al
  // encantar · jefes: recompensas y piezas de jefes mundiales · oro / xp: multiplicadores.
  const EVENTOS = [
    { icono: '🎁', nombre: 'Fin de semana de botín', desc: 'doble prob. de equipo y polvo', drop: 2 },   // domingo
    { icono: '🔨', nombre: 'Día de la Forja', desc: '+50 % piedras y polvo · encantar cuesta −25 % de oro', mat: 1.5, forja: .25 },
    { icono: '🏹', nombre: 'Día de Cacería', desc: '+50 % prob. de equipo y +15 % de que suba de rareza', drop: 1.5, caza: .15 },
    { icono: '💰', nombre: 'Miércoles de oro', desc: '+50 % de oro', oro: 1.5 },
    { icono: '👹', nombre: 'Día de Jefes', desc: 'jefes mundiales: +50 % de recompensas y de prob. de pieza de set', jefes: 1.5 },
    { icono: '📈', nombre: 'Viernes de experiencia', desc: '+50 % de experiencia y maestría', xp: 1.5 },
    { icono: '🎁', nombre: 'Fin de semana de botín', desc: 'doble prob. de equipo y polvo', drop: 2 },   // sábado
  ];
  const eventoDia = d => EVENTOS[d];
  function eventoHoy() { return eventoDia(ahoraJuego().getDay()); }


  // ---------------- Modificadores (jefes semanales y Torre) ----------------
  const MODIFICADORES = [
    { id: 'frenesi',  icono: '😡', nombre: 'Frenesí',      desc: '+25 % de daño',                ap: e => { e.dano = e.dano.map(x => Math.round(x * 1.25)); } },
    { id: 'coraza',   icono: '🛡️', nombre: 'Coraza',       desc: '+60 de armadura',              ap: e => { e.armadura = (e.armadura || 0) + 60; } },
    { id: 'robusto',  icono: '💪', nombre: 'Robusto',      desc: '+40 % de vida',                ap: e => { e.vida = Math.round(e.vida * 1.4); }, soloTorre: true },
    { id: 'espinas',  icono: '🌵', nombre: 'Espinas',      desc: 'te devuelve el 10 % del daño',  ap: e => { e.espinas = .1; }, torre: { desc: 'te devuelve el 5 % del daño', ap: e => { e.espinas = .05; } } },   // en la Torre, al 10 % los pisos de jefe eran un muro
    { id: 'regen',    icono: '💚', nombre: 'Regeneración', desc: 'recupera el 2 % de vida por turno', ap: e => { e.regen = .02; }, soloTorre: true },   // en jefes mundiales curaba ~300-500 por turno
    { id: 'igneo',    icono: '🔥', nombre: 'Ígneo',        desc: 'sus golpes queman',            ap: e => { e.aplica = [...(e.aplica || []), { estado: 'quemadura', prob: .3, turnos: 2, pct: .04 }]; } },
    { id: 'gelido',   icono: '❄️', nombre: 'Gélido',       desc: 'sus golpes congelan',          ap: e => { e.aplica = [...(e.aplica || []), { estado: 'congelacion', prob: .15, turnos: 1 }]; } },
    { id: 'venenoso', icono: '☠️', nombre: 'Venenoso',     desc: 'sus golpes envenenan',         ap: e => { e.aplica = [...(e.aplica || []), { estado: 'veneno', prob: .35, turnos: 3, pct: .025 }]; } },
  ];
  function elegirMods(rnd, n, pool) { const p = [...pool], r = []; while (r.length < n && p.length) r.push(p.splice(Math.floor(rnd() * p.length), 1)[0]); return r; }
  // jefes mundiales: 2 modificadores por semana (la vida máxima no cambia: se comparte entre intentos)
  const modsSemana = () => elegirMods(azarSemilla('jefes' + semana()), 2, MODIFICADORES.filter(md => !md.soloTorre));

  // ---------------- Torre infinita ----------------
  // Pisos generados por fórmula: el piso n equivale al nivel de campaña 1 + (n-1)/3,5 en Normal con +15 % de vida, y
  // modificadores al azar (siempre los mismos para cada piso). Jefe cada 10 pisos. No gasta estamina.
  // Una sola recompensa al superar el piso (los monstruos no sueltan botín) y hito cada 10. Antes el botín por monstruo y
  // premios del doble permitían encadenar muchos pisos, mejorar y volver a encadenar: acortaba demasiado el juego.
  const TIPOS_TORRE = ['parca', 'sombria', 'carmesi', 'maldita', 'pantano', 'escarcha', 'ignea', 'brasas'];
  function pisoTorre(n) {
    const rnd = azarSemilla('torre' + n), nEq = 1 + (n - 1) / 3.5, jefe = n % 10 === 0;
    const tipos = jefe ? [n % 20 === 0 ? 'bruja' : 'ancestral'] : [0, 1].map(() => TIPOS_TORRE[Math.floor(rnd() * TIPOS_TORRE.length)]);
    const d = crearDificultad(nEq, 'normal', tipos);
    const nMods = jefe ? 2 : n >= 30 || n % 5 === 0 ? 1 : 0, mods = elegirMods(rnd, nMods, MODIFICADORES);
    for (const e of d.enemigos) { for (const md of mods) (md.torre || md).ap(e); e.vida = Math.round(e.vida * 1.15); e.oro = 0; e.xp = 0; }   // sin botín por monstruo
    return { enemigos: d.enemigos, mods, jefe,
      premio: { oro: 50 * n, xp: 30 * n, piedra: 1 + Math.floor(n / 6), polvo: n % 5 === 0 ? 2 + Math.floor(n / 20) : 0,
                almas: n % 5 === 0 ? 1 + Math.floor(n / 20) : 0 },   // la Torre es la fuente propia de almas (cada 5 pisos)
      botin: { piedra: [0, 0], polvo: 0 }, cofreHito: cofreDeNivel(Math.ceil(nEq)) };
  }
  const premioHito = n => ({ almas: 3 + Math.floor(n / 10), oro: 250 * n });   // cada 10 pisos
  jugador.torre ||= { mejor: 0 };
  function batallaTorre(n = jugador.torre.mejor + 1) {
    const p = pisoTorre(n);
    return { nombre: `Torre · Piso ${n}`, torre: n, premio: p.premio, botin: p.botin, enemigos: p.enemigos };
  }
  function iniciarTorre() { iniciarCampana(batallaTorre()); }
  function pisoSuperado(n) {
    if (n <= jugador.torre.mejor) return '';
    jugador.torre.mejor = n; contarMision('torre');
    let t = `<br><b>🗼 Piso ${n} superado</b>`;
    if (n % 10 === 0) {   // hito: almas, oro y un objeto del cofre de ese tramo
      const h = premioHito(n), o = objetoAzar(COFRES.find(k => k.id === pisoTorre(n).cofreHito).probs, .1);
      darPremio(h); jugador.objetos.push(o);
      t += `<br>🏅 Hito: ${textoPremio(h)}`; obtenidos.push(o);
    }
    guardar(); return t;
  }

  // ---------------- Bots del servidor (perfiles de prueba) ----------------
  // 4 perfiles completos construidos con las piezas reales del juego (equipo, encantamiento, runas, mascota, árbol,
  // reliquias, maestría, título, skin). Su Poder lo calcula la misma función poder() que el tuyo: no hay cifras inventadas.
  // Forman el ranking del servidor; los 3 primeros son los reyes de la Torre de reyes. Se pueden cargar como partida de pruebas.
  const DEF_BOTS = [
    { nombre: 'Kaito',   clase: 'guerrero', nivel: 57, rareza: 'legendaria', enc: 18, est: 4,   // ⚔ 27 054
      extras: { casco: ['vida', 'critico'], armadura: ['defensa', 'reduccion'], espada: ['ataque', 'danoCritico'], capa: ['vida', 'jefes'] },
      runas: ['ataque', 'vida', 'critico', 'defensa'], nivRuna: 6, mascota: 'grifo', nivMasc: 6, titulo: 'veterano', skin: ['obsidiana_oscura', 3],
      reliquias: { colmillo: 2, ceniza: 2, collar: 1 }, maestria: 2300, prioridad: ['furia', 'baluarte', 'tactica'] },
    { nombre: 'Lyra',    clase: 'arquero',  nivel: 56, rareza: 'mitica',     enc: 13, est: 4,   // ⚔ 25 870
      extras: { casco: ['critico', 'vida', 'defensa'], armadura: ['vida', 'esquiva', 'armadura'], espada: ['ataque', 'penetracion', 'critico'], capa: ['danoCritico', 'critico', 'vida'] },
      runas: ['critico', 'danoCritico', 'ataque', 'penetracion'], nivRuna: 7, mascota: 'pantera', nivMasc: 7, titulo: 'cazador', skin: ['cristalino_amaranto', 2],
      reliquias: { cuerno: 2, hacha: 1 }, maestria: 1900, prioridad: ['precision', 'caceria', 'supervivencia'] },
    { nombre: 'Thorin',  clase: 'mago',     nivel: 60, rareza: 'mitica',     enc: 13, est: 3,   // ⚔ 29 294
      extras: { casco: ['habilidad', 'vida', 'resistencia'], armadura: ['vida', 'reduccion', 'armadura'], espada: ['ataque', 'habilidad', 'critico'], capa: ['vida', 'defensa', 'jefes'] },
      runas: ['habilidad', 'ataque', 'vida', 'armadura'], nivRuna: 5, mascota: 'dragon', nivMasc: 5, titulo: 'veterano', skin: ['egida_tormentosa', 2],
      reliquias: { corona: 2, sello: 1, ala: 1 }, maestria: 2600, prioridad: ['fuego', 'arcano', 'hielo'] },
    { nombre: 'Morgana', clase: 'guerrero', nivel: 54, rareza: 'legendaria', enc: 18, est: 4,   // ⚔ 25 273
      extras: { casco: ['defensa', 'vida'], armadura: ['armadura', 'reduccion'], espada: ['ataque', 'critico'], capa: ['vida', 'resistencia'] },
      runas: ['defensa', 'vida', 'armadura', 'reduccion'], nivRuna: 6, mascota: 'tortuga', nivMasc: 9, titulo: 'conquistador', skin: ['guardian_espectral', 3],
      reliquias: { collar: 2, ala: 1 }, maestria: 1700, prioridad: ['baluarte', 'furia', 'tactica'] },
    { nombre: 'Sigrid',  clase: 'arquero',  nivel: 46, rareza: 'legendaria', enc: 15, est: 3,
      extras: { casco: ['critico', 'vida'], armadura: ['vida', 'esquiva'], espada: ['ataque', 'critico'], capa: ['danoCritico', 'vida'] },
      runas: ['critico', 'ataque', 'vida', 'danoCritico'], nivRuna: 5, mascota: 'pantera', nivMasc: 5, titulo: 'cazador', skin: ['cristalino_amaranto', 1],
      reliquias: { cuerno: 1 }, maestria: 1200, prioridad: ['precision', 'caceria', 'supervivencia'] },
    { nombre: 'Elric',   clase: 'mago',     nivel: 44, rareza: 'legendaria', enc: 14, est: 3,
      extras: { casco: ['habilidad', 'vida'], armadura: ['vida', 'armadura'], espada: ['ataque', 'habilidad'], capa: ['vida', 'defensa'] },
      runas: ['habilidad', 'ataque', 'vida', 'defensa'], nivRuna: 5, mascota: 'grifo', nivMasc: 5, titulo: 'veterano', skin: ['egida_tormentosa', 1],
      reliquias: { sello: 1 }, maestria: 1000, prioridad: ['fuego', 'arcano', 'hielo'] },
  ];
  // reparte los puntos del árbol en el orden de ramas indicado, respetando los requisitos de cada nodo
  function arbolAuto(clase, puntos, prioridad) {
    const a = {};
    for (const idRama of prioridad) { const rama = ARBOL[clase].find(r => r.id === idRama);
      rama.nodos.forEach((n, i) => { while (puntos > 0 && (a[n.id] || 0) < n.max && nodoAbierto(rama, i, a)) { a[n.id] = (a[n.id] || 0) + 1; puntos--; } }); }
    return a;
  }
  function construirBot(d, k) {
    const b = { nombre: d.nombre, bot: true, nivel: d.nivel, xp: 0, clase: d.clase, oro: 50000, mat: { piedra: 500, polvo: 200, almas: 60 },
      estamina: ESTAMINA_MAX, diaEstamina: hoy(), objetos: [], equipado: {} };
    for (const ranura of ['casco', 'armadura', 'espada', 'capa']) {
      const m = MODELOS.find(x => x.ranura === ranura && x.rareza === d.rareza && !x.jefe);
      const o = { uid: 900000 + k * 100 + b.objetos.length, modelo: m.id, enc: d.enc,
                  lineas: [...LINEAS_RANURA[ranura], ...d.extras[ranura]].map(a => ({ a, e: d.est })) };
      b.objetos.push(o); b.equipado[ranura] = o.uid;
    }
    b.runas = d.runas.map((tipo, i) => ({ uid: 950000 + k * 10 + i, tipo, nivel: d.nivRuna })); b.runasPuestas = b.runas.map(r => r.uid);
    b.mascotas = { [d.mascota]: d.nivMasc }; b.mascota = d.mascota;
    b.skinsPropias = { [d.skin[0]]: d.skin[1] }; b.skin = d.skin[0];
    b.reliquias = { ...d.reliquias }; b.maestria = { [d.clase]: d.maestria };
    b.titulos = { [d.titulo]: true }; b.titulo = d.titulo;
    b.arbol = arbolAuto(d.clase, Math.floor(d.nivel / 2), d.prioridad);
    return b;
  }
  let cacheBots = null;
  const bots = () => cacheBots ||= DEF_BOTS.map(construirBot);
  // evalúa cualquier función del juego "como si" el perfil fuera el jugador (estadísticas, efectos, poder)
  function conPerfil(perfil, fn) { const yo = jugador; jugador = perfil; try { return fn(); } finally { jugador = yo; } }
  function rankingServidor() {
    // si estás jugando con un bot, ese bot eres tú (no aparece dos veces ni puede tocarte como rey)
    return [...bots().filter(b => b.nombre !== jugador.nombre).map(b => ({ nombre: b.nombre, clase: b.clase, nivel: b.nivel, poder: conPerfil(b, () => poder()), bot: b })),
            { nombre: `${jugador.nombre} (tú)`, clase: jugador.clase, nivel: jugador.nivel, poder: poder(), yo: true }].sort((x, y) => y.poder - x.poder);
  }

  // ---------------- Torre de reyes ----------------
  // Evento semanal multijugador: tu grupo (hasta 3, desde la sala) contra los 3 "reyes" a la vez, 3 contra 3 en el rombo.
  // Los reyes son el top 3 del ranking del servidor (sin contarte a ti) y luchan con un % de sus atributos reales según la
  // dificultad (ataque, defensa, vida y armadura), con sus efectos, golpes de estado y habilidades de clase.
  // 3 intentos al día; cada dificultad da su premio la primera vez que se gana en la semana (se reinicia cada lunes).
  const DIF_REYES = {
    normal:    { nombre: 'Normal',    pct: .6,  premio: { oro: 5000, almas: 10 } },
    dificil:   { nombre: 'Difícil',   pct: .8,  premio: { oro: 10000, almas: 20, polvo: 5 } },
    pesadilla: { nombre: 'Pesadilla', pct: 1,   premio: { oro: 20000, almas: 40, polvo: 15 } },
    infierno:  { nombre: 'Infierno',  pct: 1.3, premio: { oro: 35000, almas: 70, polvo: 30 } },
  };
  const INTENTOS_REYES = 3;
  // efectos defensivos de un perfil (arena y reyes los usan como los usarías tú)
  function efectosDefensa(ef) { return Object.fromEntries(['esquiva', 'reduccion', 'resistencia', 'robo', 'contra'].map(k => [k, ef(k)])); }
  function revisarReyes() {
    const R = jugador.reyes ||= {};
    if (R.semana !== semana()) { R.semana = semana(); R.vencidas = {}; }
    R.vencidas ||= {};
    if (R.dia !== hoy()) { R.dia = hoy(); R.entradas = INTENTOS_REYES; }
    return R;
  }
  // los reyes: los 3 mejores bots del ranking (puesto 1 = el de más poder)
  function reyesSemana() {
    return rankingServidor().filter(x => !x.yo).slice(0, 3).map((t, i) =>
      ({ puesto: i + 1, nombre: t.nombre, clase: t.clase, nivel: t.nivel, poder: t.poder, perfil: t.bot }));
  }
  function iniciarReyes(dif, aliados, posiciones) {
    const R = revisarReyes(), d = DIF_REYES[dif];
    if (R.entradas <= 0) return;
    R.entradas--; guardar();
    iniciarCampana(batallaReyes(dif, aliados, posiciones));
  }
  function batallaReyes(dif, aliados, posiciones) {   // la batalla contra los 3 reyes (sin gastar el intento)
    const d = DIF_REYES[dif];
    return { nombre: `👑 Torre de reyes · ${d.nombre}`, reyes: dif, aliados, posiciones, premio: { xp: 150 * (Object.keys(DIF_REYES).indexOf(dif) + 1) },
      botin: { piedra: [0, 0], polvo: 0 },
      enemigos: reyesSemana().map(rey => ({ nombre: `${CLASES[rey.clase].icono} ${rey.nombre}`, rey: true, rival: true, jefe: rey.puesto === 1,
        perfil: rey.perfil, pct: d.pct, oro: 0, xp: 0 })) };
  }
  function reyVencido(dif) {
    const R = revisarReyes(), d = DIF_REYES[dif];
    if (R.vencidas[dif]) return `<br>👑 Ya ganaste ${d.nombre} esta semana: sin premio extra.`;
    R.vencidas[dif] = true; darPremio(d.premio);
    if (dif === 'pesadilla' || dif === 'infierno') sumarLogro('reyes1');
    guardar();
    return `<br><b>👑 ¡Has vencido a los 3 reyes en ${d.nombre}!</b> ${textoPremio(d.premio)}`;
  }
  // La pantalla de la Torre de reyes ES la sala previa (grupo, dificultad, empezar). El ranking tiene su propia pantalla.
  let rankSel = 0;
  // ---------------- Calabozo multijugador ----------------
  // Mazmorra en grupo (hasta 3, desde una sala) contra 3 monstruos y un jefe a la vez, en el rombo. El dueño elige el
  // calabozo y la dificultad; cada uno se desbloquea al superar el anterior. Niveles 10/12/14/16, calibrados con un perfil
  // de ~5,7k de poder (lo normal al desbloquearlo en Nv 25): la Cripta en Normal se pierde por poco yendo solo y se gana
  // con 3 jugadores con ~50-75 % de vida.
  // No gasta estamina (2 intentos al día) y paga 1,5 veces su premio (más el botín de cada enemigo): compensa ir en grupo sin
  // dejar la campaña sin sentido. Los enemigos tienen +70 % de vida por aliado.
  const CALABOZOS = [
    { id: 1, nombre: 'Cripta del cementerio', icono: '⚰️', n: 10,  tipos: ['parca', 'sombria', 'carmesi'],  jefe: 'ancestral' },
    { id: 2, nombre: 'Mausoleo ancestral',    icono: '🏛️', n: 12,  tipos: ['carmesi', 'maldita', 'sombria'], jefe: 'ancestral' },
    { id: 3, nombre: 'Ciénaga de la bruja',   icono: '🌫️', n: 14,  tipos: ['pantano', 'escarcha', 'ignea'],  jefe: 'bruja' },
    { id: 4, nombre: 'Abismo de brasas',      icono: '🌋', n: 16, tipos: ['ignea', 'brasas', 'maldita'],    jefe: 'bruja' },
  ];
  jugador.calabozos ||= {};
  const calabozo = id => CALABOZOS.find(c => c.id === id) || CALABOZOS[0];
  const calabozoAbierto = id => id === 1 || !!jugador.calabozos[id - 1];
  // Dificultades: Normal abierta; cada una se desbloquea al superar la anterior en ese calabozo
  jugador.calabozosDif ||= {};
  const difAbierta = (id, d) => d === 'normal' || !!jugador.calabozosDif[`${id}:${ORDEN_DIF[ORDEN_DIF.indexOf(d) - 1]}`];
  const premioCalabozo = (id, dif) => Object.fromEntries(Object.entries(crearDificultad(calabozo(id).n, dif, []).premio).map(([k, v]) => [k, Math.round(v * 1.5)]));
  // Sin estamina: 2 intentos al día
  const INTENTOS_CALABOZO = 2;
  function revisarCalabozo() { const C = jugador.calabozoDia ||= {}; if (C.dia !== hoy()) { C.dia = hoy(); C.entradas = INTENTOS_CALABOZO; } return C; }
  function iniciarCalabozo(dif, aliados, posiciones, id) {
    const C = revisarCalabozo(), ayuda = C.entradas <= 0;   // sin intentos: puedes ayudar al grupo, pero no recibes recompensa
    if (!ayuda) { C.entradas--; guardar(); }
    iniciarCampana(batallaCalabozo(dif, aliados, posiciones, id, ayuda));
  }
  function batallaCalabozo(dif, aliados, posiciones, id, ayuda = false) {   // la batalla del calabozo id (sin gastar el intento)
    const c = calabozo(id), tipos = [0, 1, 2].map(() => elegir(c.tipos)), d = crearDificultad(c.n, dif, [c.jefe, ...tipos]);
    for (const e of d.enemigos) { e.vida = Math.round(e.vida * MULT_CALABOZO.vida); e.dano = e.dano.map(x => Math.round(x * MULT_CALABOZO.dano)); }
    return { nombre: `${c.icono} ${c.nombre} · ${DIFICULTADES[dif]}`, calabozo: dif, cal: c.id, ayuda, aliados, posiciones, premio: premioCalabozo(c.id, dif), botin: d.botin, enemigos: d.enemigos };
  }
  const MULT_CALABOZO = { vida: 2.3, dano: 1.5 };   // un free player de ~5,8k lo pasaba solo: ahora pide grupo
  const OBJETO_CALABOZO = { normal: { epica: 100 }, dificil: { epica: 70, legendaria: 30 }, pesadilla: { legendaria: 90, mitica: 10 }, infierno: { legendaria: 75, mitica: 25 } };
  function calabozoSuperado(id) {
    if (jugador.calabozos[id] || !calabozoAbierto(id)) return '';   // en la sala de otro no te saltas el anterior
    jugador.calabozos[id] = true; guardar(); const sig = CALABOZOS.find(c => c.id === id + 1);
    return sig ? `<br>🔓 ${sig.icono} ${sig.nombre}` : '';
  }
  // el calabozo se elige arriba (combo): la lista muestra sus salas y "Crear sala" abre una para ese calabozo
  let calSel = 1, difCal = 'normal';
  const i18nPuesto = i => i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

  // ---------------- Salas multijugador: Torre de reyes y Calabozo ----------------
  // Sin estar en una sala se ve la lista de salas del modo (con cuántos jugadores tiene cada una) y se puede crear otra.
  // En la sala hay 3 huecos que se llenan de izquierda a derecha: el dueño (quien la creó) y luego los que llegan.
  // Los invitados pulsan Ready desde su lado; el dueño empieza cuando todos están listos. Si el dueño sale, el
  // jugador 2 pasa a ser el dueño. Sin servidor, los demás son bots: aceptan invitaciones, pulsan Ready 1 s después
  // de llegar y, si la sala es de un bot, la empieza él cuando estás listo. Pruebas: si sales de tu sala, salen todos.
  // Los reyes son réplicas de los 3 primeros: esos jugadores también pueden entrar e invitarse (si no, el top 3 no podría jugar). Dentro de una sala no hay flecha de volver: solo se sale abandonándola.
  const salas = { reyes: [], calabozo: [] };   // { id, modo, miembros: [{ n: 'yo' | bot, llego, listo }], dif, invitando }
  let sala = null;   // la sala en la que estás
  const modoPantalla = () => pantallaActual === 'pCalabozo' ? 'calabozo' : 'reyes';
  const nombreDif = (modo, d) => modo === 'reyes' ? DIF_REYES[d].nombre : DIFICULTADES[d];
  // vuelta a la fase previa (tras una batalla o al cambiar la dificultad): los invitados pulsan Ready otra vez
  function reiniciarReady(s) {
    for (const m of s.miembros.slice(1)) m.listo = false;
    setTimeout(() => { for (const m of s.miembros.slice(1)) if (m.n !== 'yo' && m.llego) m.listo = true; if (sala === s) repintarSala(); }, 1000);   // pruebas: los bots, 1 s después
  }
  const perfilBot = n => bots().find(b => b.nombre === n);
  const perfilDe = n => n === 'yo' ? jugador : perfilBot(n);
  const nombreDe = n => n === 'yo' ? `${jugador.nombre} (tú)` : n;
  const esDueno = (s, n) => s.miembros[0] && s.miembros[0].n === n;
  const idSala = () => 1000 + Math.floor(Math.random() * 9000);
  // salas de otros jugadores (bots) para la lista, una vez por sesión
  function sembrarSalas(modo) {
    if (salas[modo].sembrada) return; salas[modo].sembrada = true;
    if (!MODO_PRUEBAS) return;   // los bots son solo para pruebas: sin servidor no hay salas de otros jugadores
    const libres = bots().filter(b => b.nombre !== jugador.nombre).map(b => b.nombre);
    const listo = n => ({ n, llego: true, listo: true });
    if (libres[0]) salas[modo].push({ id: idSala(), modo, dif: 'normal', cal: 1, miembros: [listo(libres[0])] });
    if (libres[2]) salas[modo].push({ id: idSala(), modo, dif: 'dificil', cal: 2, miembros: [listo(libres[1]), listo(libres[2])] });
  }
  function quitarDeSala(s, n) {
    const dueno = esDueno(s, n);
    s.miembros = s.miembros.filter(m => m.n !== n);   // si era el dueño, el siguiente (jugador 2) pasa a serlo
    if (n === 'yo' && dueno) s.miembros = [];   // pruebas: si sales de tu sala, salen todos
    if (!s.miembros.length) salas[s.modo].splice(salas[s.modo].indexOf(s), 1);   // en el sitio: la lista conserva su marca de sembrada
  }
  // formación de la sala (rombo): la elige el dueño; quien llega ocupa la primera casilla libre
  function posSala(s) {
    const P = s.pos ||= {};
    for (const n of Object.keys(P)) if (!s.miembros.some(m => m.n === n)) delete P[n];
    for (const m of s.miembros) if (!P[m.n]) {
      const usadas = Object.values(P), pref = m.n === 'yo' ? jugador.formacion.pos : 'frente';
      P[m.n] = usadas.includes(pref) ? POSICIONES.find(x => !usadas.includes(x)) : pref;
    }
    return P;
  }
  function salirSala() { if (sala) { quitarDeSala(sala, 'yo'); sala = null; } pintarSala(); }
  function candidatosSala() {
    if (!MODO_PRUEBAS) return [];   // sin servidor no hay jugadores online a los que invitar (los bots, solo en pruebas)
    const fuera = new Set([jugador.nombre, ...sala.miembros.map(m => m.n)]);
    return bots().filter(b => !fuera.has(b.nombre));
  }
  const repintarSala = () => { if (pantallaActual === 'pReyes' || pantallaActual === 'pCalabozo') pintarSala(); };
  const puedeJugar = modo => modo === 'calabozo' ? true : revisarReyes().entradas > 0;   // calabozo sin intentos: entra como ayuda
  const ayudaCalabozo = modo => modo === 'calabozo' && revisarCalabozo().entradas <= 0;
  async function empezarSala() {
    if (sala.modo === 'calabozo' && esDueno(sala, 'yo')) {
      const solo = sala.miembros.length === 1, ayuda = ayudaCalabozo('calabozo');
      const txt = ayuda ? 'Sin intentos restantes; calabozo sin recompensa. ¿Continuar?'
        : solo ? 'Vas solo: el calabozo es difícil y gasta un intento. ¿Continuar?' : '';
      if (txt && !await confirmar(txt, 'Continuar', 'Cancelar')) return;
    }
    const aliados = sala.miembros.filter(m => m.n !== 'yo' && m.llego).map(m => m.n);
    return (sala.modo === 'calabozo' ? iniciarCalabozo : iniciarReyes)(sala.dif, aliados, { ...posSala(sala) }, sala.cal);
  }

  // ---------------- Misiones diarias, semanales y login ----------------
  const MISIONES = {
    diaria: [
      { id: 'd_enem',  txt: 'Derrota 30 enemigos',          ev: 'enemigos',  meta: 30,  premio: { oro: 1500 } },
      { id: 'd_vict',  txt: 'Gana 5 batallas de campaña',   ev: 'victoria',  meta: 5,   premio: { piedra: 15 } },
      { id: 'd_est',   txt: 'Gasta 100 de estamina',        ev: 'estamina',  meta: 100, premio: { polvo: 4 } },
      { id: 'd_jefe',  txt: 'Usa 2 entradas de jefe',       ev: 'jefe',      meta: 2,   premio: { almas: 3 } },
      { id: 'd_arena', txt: 'Lucha 3 veces en la Arena',    ev: 'arena',     meta: 3,   premio: { oro: 1000 } },
      { id: 'd_torre', txt: 'Supera 2 pisos de la Torre',   ev: 'torre',     meta: 2,   premio: { almas: 2 } },
      { id: 'd_enc',   txt: 'Encanta 3 veces',              ev: 'encantar',  meta: 3,   premio: { piedra: 10 } },
    ],
    semanal: [
      { id: 's_enem',  txt: 'Derrota 300 enemigos',         ev: 'enemigos',  meta: 300, premio: { almas: 15 } },
      { id: 's_vict',  txt: 'Gana 30 batallas de campaña',  ev: 'victoria',  meta: 30,  premio: { oro: 10000 } },
      { id: 's_jefe',  txt: 'Usa 12 entradas de jefe',      ev: 'jefe',      meta: 12,  premio: { almas: 20 } },
      { id: 's_torre', txt: 'Supera 10 pisos de la Torre',  ev: 'torre',     meta: 10,  premio: { polvo: 20 } },
      { id: 's_arena', txt: 'Gana 10 combates de Arena',    ev: 'arenaVict', meta: 10,  premio: { oro: 8000 } },
      { id: 's_cofre', txt: 'Abre 20 cofres',               ev: 'cofres',    meta: 20,  premio: { piedra: 60 } },
    ],
  };
  const BONUS_MISIONES = { diaria: { meta: 5, premio: { almas: 5, estamina: 30 } }, semanal: { meta: 5, premio: { almas: 30, oro: 15000 } } };
  // login: ciclo de 7 días; cada semana completa sube las recompensas un 25 % (hasta ×3)
  const LOGIN = [{ oro: 1000 }, { piedra: 20 }, { polvo: 5 }, { estamina: 50 }, { almas: 5 }, { oro: 3000, piedra: 20 }, { almas: 10, polvo: 10 }];
  function revisarMisiones() {
    const M = jugador.misiones ||= {};
    if (M.dia !== hoy()) { M.dia = hoy(); M.diaria = {}; M.rdiaria = {}; }
    if (M.semana !== semana()) { M.semana = semana(); M.semanal = {}; M.rsemanal = {}; }
    return M;
  }
  function contarMision(ev, n = 1) { const M = revisarMisiones(); M.diaria[ev] = (M.diaria[ev] || 0) + n; M.semanal[ev] = (M.semanal[ev] || 0) + n; }
  // Login de 30 días: un casillero por día (se reclama desde el icono 📅 del Campamento); al completar el 30 vuelve al 1.
  // No hace falta entrar días seguidos: cada día que entras reclamas el siguiente casillero.
  function premioDia(d) {
    if (d === 30) return { oro: 10000, almas: 30, polvo: 30 };
    if (d % 7 === 0) return { oro: 1000 * d / 7, almas: 5 + 3 * d / 7 };
    if (d % 5 === 0) return { polvo: 5 + d / 5, piedra: 15 };
    return d % 2 ? { oro: 300 + 50 * d } : { piedra: 5 + d, estamina: d % 4 === 0 ? 30 : 0 };
  }
  const login30 = () => jugador.login30 ||= { n: 0, ultimo: null };
  const loginDisponible = () => login30().ultimo !== hoy();
  function reclamarLogin() {   // el casillero del día; tras el 30 vuelve al 1
    const L = login30(); if (L.n >= 30) L.n = 0;
    L.n++; L.ultimo = hoy(); const pr = premioDia(L.n); darPremio(pr); return pr;
  }
  const premioLogin = () => premioDia(login30().n % 30 + 1); const premioLoginViejo = () => { const L = jugador.login || { dias: 0 }, k = Math.min(3, 1 + Math.floor(L.dias / 7) * .25);
    return Object.fromEntries(Object.entries(LOGIN[L.dias % 7]).map(([a, v]) => [a, Math.round(v * k)])); };
  // las misiones de un modo aún bloqueado no aparecen (serían imposibles)
  const MODO_MISION = { jefe: 'pEvento', arena: 'pArena', arenaVict: 'pArena', torre: 'pTorre', encantar: 'pHerreria' };
  const misionesVisibles = tipo => MISIONES[tipo].filter(m => desbloqueado(MODO_MISION[m.ev]));
  function misionesReclamables(tipo) { const M = revisarMisiones(); return misionesVisibles(tipo).filter(m => (M[tipo][m.ev] || 0) >= m.meta && !M['r' + tipo][m.id]).length; }
  function bonusDisponible(tipo) { const M = revisarMisiones(); return !M['r' + tipo].bonus && Object.keys(M['r' + tipo]).length >= BONUS_MISIONES[tipo].meta; }

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
    const hecha = id === 'bonus' ? Object.keys(R).filter(k => k !== 'bonus').length >= BONUS_MISIONES[tipo].meta : m && (M[tipo][m.ev] || 0) >= m.meta;
    if (R[id] || !hecha) return null;
    const pr = id === 'bonus' ? BONUS_MISIONES[tipo].premio : m.premio; R[id] = true; darPremio(pr); return pr;
  }

  // ---------------- Ascensión (pantalla del árbol) ----------------
  function htmlAscension() {
    const a = ascension();
    if (jugador.nivel < 80 && !a) return '';
    return `<div class="maestria">⭐ Ascensión <b>${a}/${ASCENSION_MAX}</b>${a ? ` · +${5 * a} % a todo · +${2 * a} puntos de habilidad` : ''}
      ${jugador.nivel >= 80 && a < ASCENSION_MAX ? `<br><small>Vuelves al nivel 1 y se reinician los árboles; ganas +5 % a todo y 2 puntos de habilidad más.</small><br><button id="ascender">Ascender</button>` : ''}</div>`;
  }
  async function ascender() {
    if (jugador.nivel < 80 || ascension() >= ASCENSION_MAX) return;
    if (!await confirmar('¿Ascender? Vuelves al nivel 1 y se reinician los árboles de habilidades, a cambio de +5 % a todo y 2 puntos de habilidad extra para siempre.')) return;
    jugador.ascension = ascension() + 1; jugador.nivel = 1; jugador.xp = 0; jugador.arbol = {}; borrador = null;
    guardar(); montarHabilidades(); aplicarEquipo(); pintarHud(); avisar(`⭐ Ascensión ${jugador.ascension}`); pintarArbol();
  }

  // ================= Batalla por grupos: formación en rombo 1-2-1 =================
  // Cada lado tiene 4 casillas: retaguardia | arriba y abajo | frente. En solitario ocupas una (a elegir); en grupo sois hasta
  // 3 jugadores (sin servidor, los aliados son los bots). Los golpes normales eligen objetivo por casilla (frente 50 %,
  // arriba 20 %, abajo 20 %, retaguardia 10 %, repartido entre las ocupadas); las habilidades caen sobre cualquiera.
  // Cada ronda atacan todas las unidades: tú eliges tus habilidades, los aliados usan las suyas solos.
  // Se usa en Campaña, Torre y Torre de reyes (3 contra 3: los reyes luchan como jugadores); jefes mundiales y Arena siguen 1 contra 1.
  const POSICIONES = ['frente', 'arriba', 'abajo', 'atras'];
  const NOMBRE_POS = { frente: 'Frente', arriba: 'Arriba', abajo: 'Abajo', atras: 'Retaguardia' };
  const PESO_POS = { frente: 50, arriba: 20, abajo: 20, atras: 10 };
  const MAX_JUGADORES = 3;
  const XY_HEROE = { atras: [0, 125], arriba: [170, 30], abajo: [170, 220], frente: [340, 125] };   // coordenadas en la escena
  const XY_ENEMIGO = { frente: [640, 125], arriba: [810, 30], abajo: [810, 220], atras: [980, 125] };
  const ANCHO_GRUPO = 1276, ALTO_GRUPO = 450;
  let CALABOZO_SOLO = 1;   // vida de los enemigos del calabozo si vas solo (let: lo ajusta el simulador de progresión)
  const VIDA_POR_ALIADO = .7;   // con aliados los enemigos tienen más vida (+70 % por aliado)
  jugador.formacion ||= { pos: 'frente', aliados: [] };
  // (función declarada: la Campaña la usa al dibujarse en el arranque, antes de llegar a este bloque)
  function textoFormacion() {
    const F = jugador.formacion || { pos: 'frente', aliados: [] }, N = { frente: 'Frente', arriba: 'Arriba', abajo: 'Abajo', atras: 'Retaguardia' };
    return `Formación: <b>Tú</b> (${N[F.pos]})${(MODO_PRUEBAS ? F.aliados : []).map(a => ` + ${a.bot} (${N[a.pos]})`).join('')}`;
  }

  // ---- pantalla de formación ----
  let volverDeFormacion = 'pCampana', fichaSel = 'yo';

  // ---- montaje de la escena ----
  batalla.grupo = null;
  function armarGrupo(c) {   // motor: héroes y enemigos de la batalla en grupo
    const F = jugador.formacion, P = c.posiciones, miPos = P ? P.yo : F.pos, heroes = [], libres = POSICIONES.filter(p => p !== miPos);
    const aliados = c.aliados ? c.aliados.map((bot, i) => ({ bot, pos: (P && P[bot]) || libres[i] })) : MODO_PRUEBAS ? F.aliados : [];   // formación de la sala; los bots, solo en pruebas
    const miembros = [{ yo: true, pos: miPos, perfil: jugador }, ...aliados.map(a => ({ pos: a.pos, perfil: bots().find(b => b.nombre === a.bot) })).filter(m => m.perfil)];
    for (const m of miembros) heroes.push(unidadJugador(m));
    // enemigos: jefe al frente, el resto en las demás casillas; más vida si vienes en grupo
    // monstruos: el jefe siempre en la retaguardia y el resto delante (frente, arriba, abajo); los reyes, n.º 1 al frente
    const reyes = c.enemigos.some(e => e.perfil);
    const lista = reyes ? c.enemigos.slice(0, 4) : [...c.enemigos.filter(e => !e.jefe), ...c.enemigos.filter(e => e.jefe)].slice(0, 4);
    const nJefes = reyes ? 0 : lista.filter(e => e.jefe).length, delante = POSICIONES.filter(p => p !== 'atras');
    const posDe = (e0, i) => reyes ? POSICIONES[i] : e0.jefe && nJefes === 1 ? 'atras' : (nJefes === 1 ? delante : POSICIONES)[i];
    const enemigos = lista.map((e0, i) => {
      if (e0.perfil) return unidadRey(e0, POSICIONES[i]);
      const solo = c.calabozo && heroes.length === 1 ? CALABOZO_SOLO : 1;   // el calabozo está pensado para ir en grupo
      return unidadMonstruo({ ...e0, vida: Math.round(e0.vida * (1 + VIDA_POR_ALIADO * (heroes.length - 1)) * solo) }, posDe(e0, i));
    });
    batalla.grupo = { heroes, enemigos, turnoMascota: 0, objetivo: null };
    elegirObjetivo();   // se marca el frontal desde el inicio
    batalla.enemigo = enemigos[0].e;   // para los textos del resultado
  }

  // un rey de la Torre de reyes: lucha como un jugador, con un % de sus atributos reales (dificultad)
  function unidadRey(e, pos) {
    const u = crearUnidad(1, pos, e.nombre), p = e.perfil, s0 = conPerfil(p, estadisticas);
    u.e = e; u.perfil = p; u.clase = p.clase;
    u.st = Object.fromEntries(Object.entries(s0).map(([k, v]) => [k, Math.round(v * e.pct)]));
    u.ef = k => conPerfil(p, () => efecto(k)); u.conEfectos = true; u.golpes = conPerfil(p, golpesEstado); u.s4 = j => conPerfil(p, () => set4(j));
    const h = conPerfil(p, calcularHabilidades); u.habs = h.habs; u.carga = Object.fromEntries(h.habs.map(x => [x.id, 0]));
    u.vida = u.vidaMax = u.st.vida;
    return u;
  }

  // Multijugador (Torre de reyes y calabozo): tienes 10 s para elegir tu ataque; si no pulsas nada, se lanza un ataque
  // normal para no retrasar a los demás jugadores. La cuenta se ve sobre el botón de atacar.
  const TIEMPO_TURNO = 10;
  let cuentaTurno = null;


  // ---------------- Campamento (menú principal) ----------------
  // Avisos rojos: algo que el jugador puede hacer ahora mismo
  function avisosCampamento() {
    const masc = MASCOTAS.some(m => { const n = nivelMascota(m); return n > 0 && n < MASCOTA_MAX && jugador.oro >= costeMejora(m, n); });
    const jefe = entradasJefe() > 0 && Object.keys(MUNDIALES).some(id => estadoMundial(id).vida > 0);
    const mis = misionesReclamables('diaria') || misionesReclamables('semanal') || bonusDisponible('diaria') || bonusDisponible('semanal') || expedicionLista();   // el login avisa en su propio icono
    const R = revisarReyes();
    return { reyes: R.entradas > 0 && Object.keys(R.vencidas).length < 4, misiones: mis, arena: revisarArena().entradas > 0, arbol: puntosLibres() > 0, titulos: !!jugador.tituloNuevo, mascota: masc, batalla: jugador.estamina >= ESTAMINA_MAX, jefe };
  }
  // Objetivos cercanos ("me falta poco"): de todo lo que el jugador puede perseguir, se muestran los 3 más avanzados.
  // Tocar uno lleva a su pantalla.
  function objetivosCercanos() {
    const L = [], add = (icono, txt, pct, ir) => { if (pct < 1 && desbloqueado(ir)) L.push({ icono, txt, pct: Math.max(0, pct), ir }); };
    if (jugador.nivel < NIVEL_MAX) add('⭐', `Nivel ${jugador.nivel + 1}`, jugador.xp / xpParaSubir(jugador.nivel), 'pInventario');
    const ma = maestria(); if (ma.n < MAESTRIA_MAX) add('🏅', ma.n < MAESTRIA_ESPECIAL ? `Maestría Nv ${MAESTRIA_ESPECIAL}: especialización` : `Maestría Nv ${ma.n + 1}`, ma.n < MAESTRIA_ESPECIAL ? (ma.n + ma.xp / ma.falta) / MAESTRIA_ESPECIAL : ma.xp / ma.falta, 'pArbol');
    const k = skinActual(); if (k && estrellasSkin(k.id) < 5) add('✨', `${k.nombre} ★${estrellasSkin(k.id) + 1}`, jugador.oro / COSTE_ESTRELLA(estrellasSkin(k.id)), 'pInventario');
    const m = mascotaActual(); if (m && nivelMascota(m) < MASCOTA_MAX) add('🐾', `${m.nombre} Nv ${nivelMascota(m) + 1}`, jugador.oro / costeMejora(m, nivelMascota(m)), 'pMascota');
    for (const [j, n] of Object.entries(piezasConjunto())) if (n < 4) add('⚔', `Set «${CONJUNTOS[j].nombre}» ${n}/4`, n / 4, 'pEvento');
    for (const uid of Object.values(jugador.equipado)) { const o = objeto(uid), q = pctCalidad(o);
      if (q >= 65 && q < 100) add('💎', `${modelo[o.modelo].nombre}: ${calidadObj(o)[1].toLowerCase()} (${q} %)`, q / 100, 'pHerreria');
      if (o.enc < encMax(o)) add('🔨', `${modelo[o.modelo].nombre} +${o.enc + 1}`, Math.min(jugador.mat.piedra / (o.enc + 1), jugador.oro / costeEncantar(o).oro, 1) * .99, 'pHerreria'); }
    const mejor = (jugador.torre || {}).mejor || 0;   // partidas sin Torre ni Calabozo todavía: no debe romper el campamento
    add('🗼', `Torre: piso ${mejor + 1}`, (mejor % 10) / 10, 'pTorre');
    const cal = CALABOZOS.find(c => !(jugador.calabozos || {})[c.id]); if (cal && calabozoAbierto(cal.id)) add('🏰', `Supera ${cal.nombre}`, (cal.id - 1) / CALABOZOS.length, 'pCalabozo');
    const sig = Object.entries(DESBLOQUEOS).filter(([id]) => !desbloqueado(id)).sort((a, b) => a[1][0] - b[1][0])[0];
    if (sig && sig[1][0] - jugador.nivel <= 3) add('🔓', `${sig[1][1]} en Nv ${sig[1][0]}`, (jugador.nivel + jugador.xp / xpParaSubir(jugador.nivel)) / sig[1][0], 'menu');
    const vistos = new Set();   // uno por tipo, para que no salgan tres encantamientos
    return L.sort((a, b) => b.pct - a.pct).filter(o => !vistos.has(o.icono) && vistos.add(o.icono)).slice(0, 3);
  }
  // ---------------- Bot de pruebas ----------------
  // "repetir": en batalla activa el autoataque y, al terminar, pulsa Jugar de nuevo / Reintentar / Subir piso.
  // "jugar": además elige qué jugar (campaña, Torre, Arena, jefes mundiales; nada multijugador), se equipa lo de más
  // poder, reparte los puntos de habilidad y compra cofres con el oro que sobra. Para cuando no queda nada que jugar hoy.
  let botModo = null, botVel = 1;
  const botFallos = {};   // derrotas por batalla (clave): a las 2 el bot deja de intentarla
  const esperar = ms => new Promise(r => setTimeout(r, ms));
  function botEquipar() {
    for (const r of Object.keys(RANURAS)) {
      let mejor = jugador.equipado[r], pMejor = poder();
      for (const o of jugador.objetos) {
        if (modelo[o.modelo].ranura !== r || o.uid === mejor) continue;
        jugador.equipado[r] = o.uid; const p = poder();
        if (p > pMejor) { pMejor = p; mejor = o.uid; }
      }
      if (mejor) jugador.equipado[r] = mejor; else delete jugador.equipado[r];   // ranura que estaba vacía
    }
    aplicarEquipo();
  }
  function botArbol() {
    if (!desbloqueado('pArbol')) return;
    while (puntosLibres() > 0) {
      let mejor = null, pMejor = -1;
      for (const rama of ramasClase()) rama.nodos.forEach((n, i) => {
        if (rango(n.id) >= n.max || !nodoAbierto(rama, i)) return;
        jugador.arbol[n.id] = rango(n.id) + 1; const p = poder();
        if (--jugador.arbol[n.id] <= 0) delete jugador.arbol[n.id];
        if (p > pMejor) { pMejor = p; mejor = n; }
      });
      if (!mejor) break;
      jugador.arbol[mejor.id] = rango(mejor.id) + 1;
    }
  }
  function botCofres() {   // el mejor cofre x10 que se pueda pagar dejando 2000 de oro
    const c = [...COFRES].reverse().find(k => k.precio && jugador.oro >= k.precio * 10 + 2000);
    if (!c) return;
    jugador.oro -= c.precio * 10; sumarLogro('cofres', 10); contarMision('cofres', 10);
    for (let i = 0; i < 10; i++) abrirCofre(c);
  }
  function botPreparar() { botCofres(); botEquipar(); botArbol(); guardar(); pintarHud(); }
  // ---------------- Simulador de batallas (pruebas) ----------------
  // Juega batallas enteras con el motor, sin dibujar ni esperar. En cada ronda decide `decidir` (por defecto, como el
  // autoataque: la primera habilidad cargada). Trabaja sobre una copia de la partida: botín, misiones o vida de los jefes
  // mundiales no llegan a la partida real, y mientras simula no se guarda ni se avisa nada.
  // Corre fn(partidaReal) sobre una copia de la partida: lo que haga (botín, misiones, vida de jefes mundiales) no llega
  // a la partida real, no se guarda ni se avisa nada, y al terminar la batalla y el azar vuelven a como estaban.
  function aislado(fn) {
    if (pantallaActual === 'pBatalla') return null;   // la batalla en curso usa el mismo estado
    const real = jugador, uid = sigUid, antes = { ...batalla }, carga = { ...batalla.carga }, habs = HABILIDADES;
    simulando = true; jugador = structuredClone(real);
    try { return fn(real); }
    finally {
      jugador = real; sigUid = uid; simulando = false; HABILIDADES = habs; sembrar(null);
      for (const k in batalla) delete batalla[k];
      Object.assign(batalla, antes);
      for (const k in batalla.carga) delete batalla.carga[k];
      Object.assign(batalla.carga, carga);
    }
  }
  // Juega la batalla c hasta el final con el motor; devuelve true (victoria), false (derrota) o null (sin terminar)
  function jugarHastaFin(c, decidir = habLista, maxRondas = 300) {
    prepararBatalla(c);
    let n = 0;
    while (n < maxRondas) {
      const ev = resolverRonda(decidir()); n++;
      const e = ev.find(x => x[0] === 'resultado'); if (e) return { fin: e[1], rondas: n };
    }
    return { fin: null, rondas: n };
  }
  function simular(c, { veces = 100, decidir = habLista, maxRondas = 300, semilla = null } = {}) {
    return aislado(real => {
      sembrar(semilla);
      const r = { victorias: 0, derrotas: 0, sinTerminar: 0, rondas: 0, vida: 0 };
      for (let i = 0; i < veces; i++) {
        jugador = structuredClone(real);
        const { fin, rondas } = jugarHastaFin(c, decidir, maxRondas);
        if (fin === true) r.victorias++; else if (fin === false) r.derrotas++; else r.sinTerminar++;
        const yo = heroeYo();
        r.rondas += rondas; r.vida += Math.max(0, yo.vida / yo.vidaMax);
      }
      return { ...r, veces, pctVictoria: Math.round(r.victorias / veces * 100), rondasMedia: Math.round(r.rondas / veces * 10) / 10, vidaMedia: Math.round(r.vida / veces * 100) };
    });
  }
  // ---------------- Simulador de progresión (pruebas) ----------------
  // simMejor, simRunas, simMejorar, simRefinar y simCobrar: las decisiones del jugador simulado (simularProgresion, abajo).
  // No llaman a aplicarEquipo(): solo repinta la pantalla, y repintar en cada prueba hacía el simulador varias veces más lento.
  function simMejor(lista, poner) {   // pone la opción de lista que más poder da
    let mejor = null, p0 = -1;
    for (const x of lista) { poner(x); const p = poder(); if (p > p0) { p0 = p; mejor = x; } }
    poner(mejor);
  }
  function simRunas() {   // fusiona las repetidas y llena las ranuras con las que más poder dan
    if (!desbloqueado('pRunas') || !jugador.runas) return;
    jugador.runasPuestas ||= Array(RANURAS_RUNA).fill(null);
    for (let otra = true; otra;) { otra = false; for (const r of jugador.runas) if (!jugador.runasPuestas.includes(r.uid) && fusionarRuna(r)) { otra = true; break; } }
    for (let i = 0; i < RANURAS_RUNA; i++) {
      const libres = jugador.runas.filter(r => !jugador.runasPuestas.includes(r.uid) || jugador.runasPuestas[i] === r.uid);
      simMejor([null, ...libres], r => { jugador.runasPuestas[i] = r ? r.uid : null; });
    }
  }
  // Greedy perezoso: cada mejora posible (encantar una pieza puesta, comprar o subir una mascota o una skin, subir una runa
  // puesta, crear una runa si hay ranura libre) se valora en poder por oro; se toma la de más valor recalculándola, y si
  // sigue siendo la mejor se compra. Solo se recalcula la de arriba: decide como el greedy completo con muchos menos cálculos.
  // El encantamiento cuenta su probabilidad; la runa nueva, la ganancia media de los tipos.
  function simMejorar() {
    const ponerMascota = () => simMejor(MASCOTAS.filter(m => nivelMascota(m) > 0).map(m => m.id), id => { jugador.mascota = id; });
    const ponerSkin = () => simMejor([null, ...SKINS.filter(k => estrellasSkin(k.id) > 0).map(k => k.id)], id => { jugador.skin = id; });
    const prueba = (cambiar, deshacer) => { const base = poder(); cambiar(); const g = poder() - base; deshacer(); return g; };
    const cands = [];   // { valor(): poder por oro (0 si no se puede), hacer(): true si compró }
    for (const uid of Object.values(jugador.equipado)) { const o = objeto(uid);
      cands.push({ valor: () => { const c = costeEncantar(o); return o.enc >= encMax(o) || !tieneCoste(c) ? 0 : prueba(() => o.enc++, () => o.enc--) * c.prob / 100 / c.oro; },
                   hacer: () => tieneCoste(costeEncantar(o)) && o.enc < encMax(o) && !!encantar(o) }); }
    if (desbloqueado('mascota')) for (const m of MASCOTAS) cands.push({
      valor: () => { const n = nivelMascota(m), oro = n ? costeMejora(m, n) : m.precio, puesta = jugador.mascota;
        if ((n && n >= MASCOTA_MAX) || jugador.oro < oro) return 0;
        return prueba(() => { jugador.mascotas[m.id] = n + 1; jugador.mascota = m.id; }, () => { if (n) jugador.mascotas[m.id] = n; else delete jugador.mascotas[m.id]; jugador.mascota = puesta; }) / oro; },
      hacer: () => { const ok = nivelMascota(m) ? mejorarMascota(m) : comprarMascota(m); if (ok) ponerMascota(); return ok; } });
    if (desbloqueado('skins')) for (const k of SKINS) cands.push({
      valor: () => { const n = estrellasSkin(k.id), oro = n ? COSTE_ESTRELLA(n) : PRECIO_SKIN, puesta = jugador.skin;
        if (n >= 5 || jugador.oro < oro) return 0;
        return prueba(() => { (jugador.skinsPropias ||= {})[k.id] = n + 1; jugador.skin = k.id; }, () => { if (n) jugador.skinsPropias[k.id] = n; else delete jugador.skinsPropias[k.id]; jugador.skin = puesta; }) / oro; },
      hacer: () => { const ok = estrellasSkin(k.id) ? mejorarSkin(k) : comprarSkin(k); if (ok) ponerSkin(); return ok; } });
    if (desbloqueado('pRunas')) {
      const puestas = (jugador.runasPuestas ||= Array(RANURAS_RUNA).fill(null));
      for (let i = 0; i < RANURAS_RUNA; i++) cands.push({   // la runa de la ranura i: subirla, o crear una si está vacía
        valor: () => { const r = (jugador.runas || []).find(x => x.uid === puestas[i]);
          if (r) { const c = costeMejoraRuna(r.nivel); return r.nivel >= RUNA_MAX || !tieneCoste(c) ? 0 : prueba(() => r.nivel++, () => r.nivel--) / c.oro; }
          if (!tieneCoste(COSTE_RUNA)) return 0;
          const tipos = Object.keys(RUNAS);
          return tipos.reduce((t, tipo) => t + prueba(() => { jugador.runas.push({ uid: -1, tipo, nivel: 1 }); puestas[i] = -1; }, () => { jugador.runas.pop(); puestas[i] = null; }), 0) / tipos.length / COSTE_RUNA.oro; },
        hacer: () => { const r = (jugador.runas || []).find(x => x.uid === puestas[i]);
          if (r) return mejorarRuna(r);
          if (!tieneCoste(COSTE_RUNA)) return false; crearRuna(); simRunas(); return true; } });
    }
    let lista = cands.map(c => ({ c, v: c.valor() })).filter(x => x.v > 0);
    for (let i = 0; i < 400 && lista.length; i++) {
      lista.sort((a, b) => b.v - a.v);
      const x = lista[0]; x.v = x.c.valor();
      if (x.v <= 0) { lista.shift(); continue; }
      if (lista[1] && x.v < lista[1].v) continue;   // ya no es la mejor: vuelve a su sitio con su valor nuevo
      if (!x.c.hacer()) { lista.shift(); continue; }
      x.v = x.c.valor(); if (x.v <= 0) lista.shift();
    }
  }
  // Refinar con el polvo que sobra (deja 20 para las runas): sortea la peor línea (menos de ★4) de cada pieza puesta y se
  // queda con lo que dé más poder.
  function simRefinar() {
    if (!desbloqueado('refinar')) return;
    for (let i = 0; i < 40 && jugador.mat.polvo >= 20 + COSTE_REFINAR.polvo && jugador.oro >= COSTE_REFINAR.oro; i++) {
      const o = Object.values(jugador.equipado).map(objeto).find((x, j) => j >= i % 4 && x.lineas.some(l => l.e < 4)) || Object.values(jugador.equipado).map(objeto).find(x => x.lineas.some(l => l.e < 4));
      if (!o) return;
      const linea = o.lineas.reduce((m, l, j) => l.e < o.lineas[m].e ? j : m, 0), vieja = o.lineas[linea], base = poder();
      const nueva = refinar(o); o.lineas[linea] = nueva;
      if (poder() <= base) o.lineas[linea] = vieja;
    }
  }
  function simCobrar() {   // misiones y bonus hechos
    for (const tipo of ['diaria', 'semanal']) { for (const m of misionesVisibles(tipo)) reclamarMision(tipo, m.id); reclamarMision(tipo, 'bonus'); }
  }
  // Un jugador gratuito juega días seguidos sin pantalla, con las decisiones del bot: cada día recoge el login y las
  // expediciones, gasta la estamina, sube la Torre, usa las entradas de arena, jefes, calabozo y Torre de reyes, cobra las
  // misiones, abre cofres, se equipa lo mejor (y desguaza el resto), reparte el árbol, refina y gasta el oro en lo que más
  // poder le da (simMejorar). Las batallas se resuelven con el motor (autoataque). Devuelve el día de cada hito.
  // Corre sobre una copia de la partida (aislado).
  //   perfil: partida de la que parte (por defecto, una nueva) · dias · semilla: azar reproducible · expediciones: de 8 h al
  //   día · grupo: jugadores en calabozo y reyes (los aliados son copias del simulado: gente de su mismo nivel) ·
  //   estaminaExtra: recargas al día además de la gratis (anuncios, diamantes)
  function simularProgresion({ dias = 60, perfil = null, semilla = 1, expediciones = 2, grupo = 3, estaminaExtra = 0 } = {}) {
    const offset0 = offsetDias, temporizador = window.setTimeout, botsAntes = [...bots()];
    window.setTimeout = () => 0;   // los avisos diferidos (desbloqueos, títulos) no deben salir al terminar
    try {
      return aislado(() => {
        sembrar(semilla);
        jugador = perfil ? structuredClone(perfil) : Object.assign(partidaNueva(), { nombre: 'Simulado', clase: 'guerrero', arbol: {}, torre: { mejor: 0 },
          calabozos: {}, calabozosDif: {}, mascotas: {}, runas: [], skinsPropias: {}, formacion: { pos: 'frente', aliados: [] } });   // los campos que el juego rellena al cargar
        const hitos = { nivel: {}, campana: {}, torre: {}, jefes: {}, calabozo: {}, reyes: {} }, dia = [], fuentes = {};
        const xpTotal = () => { let t = jugador.xp; for (let n = 1; n < jugador.nivel; n++) t += xpParaSubir(n); return t; };
        const medir = (fuente, f) => { const x = xpTotal(), o = jugador.oro, r = f(), F = fuentes[fuente] ||= { xp: 0, oro: 0, veces: 0 };
          F.xp += xpTotal() - x; F.oro += jugador.oro - o; F.veces++; return r; };   // XP y oro de cada fuente (el oro gastado en mejoras no cuenta: se mide aparte)
        const aliados = () => {   // copias del simulado como aliados (los bots se buscan por nombre)
          const nombres = Array.from({ length: grupo - 1 }, (_, i) => `Aliado ${i + 1}`);
          cacheBots.splice(botsAntes.length, Infinity, ...nombres.map(nombre => Object.assign(structuredClone(jugador), { nombre })));
          return nombres;
        };
        const jugar = c => {   // como iniciarCampana, sin pantalla: cobra la entrada, pelea y cobra el resultado
          const coste = c.arena || c.mundial || c.torre || c.reyes || c.calabozo ? 0 : (c.coste || ESTAMINA_CAMPANA);
          if (jugador.estamina < coste) return null;
          jugador.estamina -= coste; if (coste) contarMision('estamina', coste);
          if (c.aliados) c.aliados = aliados();
          const { fin } = jugarHastaFin(c, habLista, 400);
          cacheBots.splice(botsAntes.length);
          mostrarResultado(fin === true); return fin === true;
        };
        for (let d = 1; d <= dias; d++) {
          offsetDias = offset0 + d - 1; revisarEstamina(); jugador.estamina += estaminaExtra;   // recargas extra del día (anuncios, diamantes)
          if (loginDisponible()) medir('login', reclamarLogin);
          if (desbloqueado('expedicion')) {   // expediciones de 8 h al día (las que da tiempo a mandar y recoger)
            const m = MASCOTAS.filter(x => nivelMascota(x) > 0 && x.id !== jugador.mascota).sort((a, b) => Object.keys(CAT_MASCOTA).indexOf(b.cat) - Object.keys(CAT_MASCOTA).indexOf(a.cat))[0];
            if (m) for (let i = 0; i < expediciones; i++) medir('expedición', () => darPremio(premioExpedicion(m, 8)));
          }
          const fallos = {}, pocos = k => (fallos[k] || 0) < 2;   // como el bot: tras 2 derrotas, eso se deja para otro día
          let batallas = 0;
          while (batallas < 200) {
            medir('misiones', simCobrar);
            if (batallas % 5 === 0) {   // cada 5 batallas (y al empezar el día) organiza el equipo y gasta
              botCofres(); botEquipar(); botArbol();
              desguazar(jugador.objetos.filter(o => !Object.values(jugador.equipado).includes(o.uid)));   // lo que no lleva puesto, a almas
              simMejorar(); simRunas(); simRefinar();
            }
            let k = null, c = null;
            if (jugador.estamina >= ESTAMINA_CAMPANA)
              for (const x of CAMPANAS) { for (const df of ORDEN_DIF) if (desbloqueada(x, df) && !superada(x.id, df) && pocos(`${x.id}:${df}`)) { k = `${x.id}:${df}`; c = batallaCampana(x, df); break; } if (c) break; }
            if (!c && desbloqueado('pTorre') && pocos('torre')) { k = 'torre'; c = batallaTorre(); }
            if (!c && desbloqueado('pArena') && revisarArena().entradas > 0) {
              const a = revisarArena(), i = a.rivales.reduce((m, r, j) => r.f < a.rivales[m].f ? j : m, 0);
              a.entradas--; a.rivalActual = i; k = 'arena'; c = batallaArena(i);
            }
            if (!c && desbloqueado('pEvento') && entradasJefe() > 0) {
              const id = Object.keys(MUNDIALES).find(m => estadoMundial(m).vida > 0 && pocos('jefe' + m));
              if (id) { jugador.entradasJefe--; k = 'jefe' + id; c = batallaMundial(id); }
            }
            if (!c && desbloqueado('pCalabozo') && revisarCalabozo().entradas > 0) {   // el siguiente sin superar; si no, el mejor superado
              const abiertos = CALABOZOS.filter(x => calabozoAbierto(x.id)).flatMap(x => ORDEN_DIF.filter(df => difAbierta(x.id, df)).map(df => [x.id, df]));
              const [id, df] = abiertos.find(([id, df]) => !jugador.calabozosDif[`${id}:${df}`] && pocos(`cal${id}:${df}`)) || abiertos.filter(([id, df]) => jugador.calabozosDif[`${id}:${df}`]).at(-1) || [];
              if (id) { revisarCalabozo().entradas--; k = `cal${id}:${df}`; c = batallaCalabozo(df, ['x'], null, id); }
            }
            if (!c && desbloqueado('pReyes') && revisarReyes().entradas > 0) {
              const df = Object.keys(DIF_REYES).find(x => !revisarReyes().vencidas[x] && pocos('reyes' + x));
              if (df) { revisarReyes().entradas--; k = 'reyes' + df; c = batallaReyes(df, ['x'], null); }
            }
            if (!c) {   // farmeo: barrido del nivel más alto ya superado
              const x = jugador.estamina >= ESTAMINA_CAMPANA && [...CAMPANAS].reverse().flatMap(y => [...ORDEN_DIF].reverse().map(df => [y, df])).find(([y, df]) => superada(y.id, df));
              if (!x) break;
              medir('barrido', () => barrido(...x)); batallas++; continue;
            }
            const fuente = c.idCampana ? 'campaña' : c.torre ? 'torre' : c.arena ? 'arena' : c.mundial ? 'jefes' : c.calabozo ? 'calabozo' : 'reyes';
            const gano = medir(fuente, () => jugar(c)); batallas++;
            if (gano === null) break;
            if (!gano) fallos[k] = (fallos[k] || 0) + 1;
            else {
              if (c.idCampana) hitos.campana[`${c.idCampana} ${c.dif}`] ||= d;
              if (c.torre && c.torre % 10 === 0) hitos.torre[c.torre] ||= d;
              if (c.mundial) hitos.jefes[c.mundial] ||= d;
              if (c.calabozo) hitos.calabozo[`${c.cal} ${c.calabozo}`] ||= d;
              if (c.reyes) hitos.reyes[c.reyes] ||= d;
            }
          }
          for (let n = 2; n <= jugador.nivel; n++) hitos.nivel[n] ||= d;
          dia.push({ dia: d, nivel: jugador.nivel, poder: poder(), torre: jugador.torre.mejor, oro: jugador.oro, batallas });
        }
        return { hitos, dia, fuentes, final: dia.at(-1) };
      });
    } finally { window.setTimeout = temporizador; offsetDias = offset0; cacheBots.splice(botsAntes.length); }
  }
  function opcionesSimulacion() {   // batallas que se pueden simular desde el menú de pruebas
    const sig = CAMPANAS.find(c => !superada(c.id, 'normal')) || CAMPANAS.at(-1);
    return [
      [`Campaña ${sig.id}`, () => batallaCampana(sig, 'normal')],
      [`Torre · piso ${jugador.torre.mejor + 1}`, () => batallaTorre()],
      ...revisarArena().rivales.map((r, i) => [`Arena: ${r.nombre}`, () => batallaArena(i)]),
      ...Object.keys(MUNDIALES).map(id => [`Jefe: ${MUNDIALES[id].enemigo.nombre}`, () => batallaMundial(id)]),
    ];
  }
  // ---------------- Escenarios de prueba ----------------
  // Reglas del combate comprobadas con el motor, sin pantalla: cada escenario corre aislado (copia de la partida, semilla
  // fija) y devuelve true si se cumple o un texto con lo que falló. Los "pendiente" documentan algo que todavía no está.
  // Jugador de prueba: partida nueva (equipo básico, sin esquiva ni efectos), guerrero del nivel y árbol indicados.
  function jugadorPrueba(nivel = 30, arbol = {}) {
    return Object.assign(partidaNueva(), { nombre: 'Prueba', clase: 'guerrero', nivel, arbol, formacion: { pos: 'frente', aliados: [] }, torre: { mejor: 0 } });
  }
  // batalla de prueba: 1 contra 1 (o en grupo con grupo: true) contra muñecos con mucha vida que pegan `dano`
  function batallaPrueba({ dano = [1, 1], vida = 1e6, n = 1, grupo = false } = {}) {
    const enemigos = Array.from({ length: n }, (_, i) => ({ nombre: `Muñeco ${i + 1}`, vida, dano: [...dano], armadura: 0, defensa: 0, oro: 0, xp: 0 }));
    return { nombre: 'Prueba', torre: grupo ? 1 : undefined, premio: {}, botin: { piedra: [0, 0], polvo: 0 }, enemigos };
  }
  const huboResultado = (ev, gano) => ev.some(e => e[0] === 'resultado' && e[1] === gano);
  const ESCENARIOS = [
    ['Misma semilla, misma batalla', () => {
      const una = s => { sembrar(s); jugador = jugadorPrueba(20); const r = jugarHastaFin(batallaCampana(CAMPANAS[2], 'normal')); return JSON.stringify([r, batalla.grupo.heroes.map(u => u.vida), batalla.grupo.enemigos.map(u => u.vida)]); };
      const a = una(7), b = una(7);
      return a === b || `distintas: ${a} / ${b}`;
    }],
    ['El veneno se acumula hasta 5 pilas', () => {
      prepararBatalla(batallaPrueba());
      for (let i = 0; i < 7; i++) aplicarEstado(enemigoDuelo(), 'veneno', 3, 10);
      const v = enemigoDuelo().estados.veneno;
      return v && v.pilas === 5 || `pilas: ${v && v.pilas}`;
    }],
    ['Los jefes mundiales no se pueden aturdir', () => {
      prepararBatalla(batallaMundial('cerbero'));
      aplicarEstado(enemigoDuelo(), 'aturdimiento', 2);
      return !enemigoDuelo().estados.aturdimiento || 'Cerbero quedó aturdido';
    }],
    ['Último bastión salva de un golpe mortal (1 contra 1)', () => {
      jugador = jugadorPrueba(30, { bastion: 1 });
      prepararBatalla(batallaPrueba({ dano: [1e7, 1e7] }));
      resolverRonda(null);
      const yo = heroeYo();
      if (yo.vida !== 1 || !yo.bastionUsado) return `vida tras el golpe: ${yo.vida}`;
      return huboResultado(resolverRonda(null), false) || 'el segundo golpe mortal no lo derrotó';
    }],
    ['Segundo aliento cura al bajar del 30 % (1 contra 1)', () => {
      jugador = jugadorPrueba(30, { aliento: 3 });
      prepararBatalla(batallaPrueba());
      const yo = heroeYo(); yo.vida = Math.floor(yo.vidaMax * .3);
      resolverRonda(null);
      return yo.alientoUsado && yo.vida > yo.vidaMax * .5 || `vida: ${yo.vida} de ${yo.vidaMax}`;
    }],
    ['Cerbero pasa a modo infernal al bajar del 50 %', () => {
      prepararBatalla(batallaMundial('cerbero'));
      const e = enemigoDuelo(), yo = heroeYo();
      batalla.infernal = false; e.vida = Math.floor(e.vidaMax / 2) + 1; yo.vida = yo.vidaMax = 1e9;
      resolverRonda(null);
      return batalla.infernal || `vida de Cerbero: ${e.vida} de ${e.vidaMax}`;
    }],
    ['Asmodeo herido levanta el escudo', () => {
      prepararBatalla(batallaMundial('asmodeo'));
      const e = enemigoDuelo(), yo = heroeYo();
      e.vida = Math.floor(e.vidaMax * .4); batalla.turnoEscudo = ESCUDO.turnos - 1; yo.vida = yo.vidaMax = 1e9;
      resolverRonda(null);
      return batalla.escudoRestante === ESCUDO.dura || `escudo: ${batalla.escudoRestante}`;
    }],
    ['Un golpe mortal remata a Asmodeo aunque tenga el escudo', () => {
      jugador = jugadorPrueba(30);
      prepararBatalla(batallaMundial('asmodeo'));
      const e = enemigoDuelo(), yo = heroeYo();
      e.vida = 10; batalla.escudoRestante = ESCUDO.dura; yo.vida = yo.vidaMax = 1e9;
      resolverRonda(null);
      return e.vida <= 0 || `vida de Asmodeo: ${e.vida}`;
    }],
    ['El Minotauro entra en furia bajo el umbral', () => {
      prepararBatalla(batallaMundial('minotauro'));
      const e = enemigoDuelo(), yo = heroeYo();
      e.vida = Math.floor(e.vidaMax * FURIA.umbral * .85);   // con margen por si esta semana regenera
      batalla.turnoFuria = FURIA.turnos - 1; yo.vida = yo.vidaMax = 1e9;
      resolverRonda(null);
      return batalla.furiaRestante === FURIA.dura || `furia: ${batalla.furiaRestante}`;
    }],
    ['En grupo, tu golpe va al objetivo marcado', () => {
      jugador = jugadorPrueba(30);
      prepararBatalla(batallaPrueba({ n: 4, grupo: true }));
      const t = batalla.grupo.enemigos.find(u => u.pos === 'atras'); batalla.grupo.objetivo = t;
      resolverRonda(null);
      const otros = batalla.grupo.enemigos.filter(u => u !== t && u.vida < u.vidaMax);
      return t.vida < t.vidaMax && !otros.length || `objetivo ${t.vida}/${t.vidaMax}, otros golpeados: ${otros.length}`;
    }],
    ['El simulador no cambia la partida', () => {
      const antes = JSON.stringify(jugador), guardado = localStorage.getItem(CLAVE), uid = sigUid;
      simular(batallaPrueba({ dano: [5, 9], vida: 300 }), { veces: 20 });
      return JSON.stringify(jugador) === antes && localStorage.getItem(CLAVE) === guardado && sigUid === uid || 'la partida o lo guardado cambió';
    }, { libre: true }],
    ['Espinas devuelve daño también en grupo', () => {
      jugador = jugadorPrueba(30);
      const c = batallaPrueba({ dano: [0, 0], grupo: true }); c.enemigos[0].espinas = .1;
      prepararBatalla(c);
      const yo = heroeYo(), e = batalla.grupo.enemigos[0]; batalla.grupo.objetivo = e;
      resolverRonda(null);
      return yo.vidaMax - yo.vida >= 2 || `daño recibido: ${yo.vidaMax - yo.vida} (el muñeco pega 1; las espinas, al menos 1 más)`;
    }],
    ['Último bastión también en grupo', () => {
      jugador = jugadorPrueba(30, { bastion: 1 });
      prepararBatalla(batallaPrueba({ dano: [1e7, 1e7], grupo: true }));
      resolverRonda(null);
      const yo = batalla.grupo.heroes.find(h => h.yo);
      if (yo.vida !== 1) return `vida tras el golpe: ${yo.vida}`;
      return huboResultado(resolverRonda(null), false) || 'el segundo golpe mortal no lo derrotó';
    }],
    ['Segundo aliento también en grupo', () => {
      jugador = jugadorPrueba(30, { aliento: 3 });
      prepararBatalla(batallaPrueba({ grupo: true }));
      const yo = batalla.grupo.heroes.find(h => h.yo); yo.vida = Math.floor(yo.vidaMax * .3);
      resolverRonda(null);
      return yo.alientoUsado && yo.vida > yo.vidaMax * .5 || `vida: ${yo.vida} de ${yo.vidaMax}`;
    }],
  ];
  // Corre todos los escenarios: [{ nombre, ok, detalle, pendiente }]
  function correrEscenarios() {
    return ESCENARIOS.map(([nombre, fn, { libre = false, pendiente = false } = {}]) => {
      let r;
      try { r = libre ? fn() : aislado(() => { sembrar(1); return fn(); }); }
      catch (e) { r = `error: ${e.message}`; }
      return { nombre, ok: r === true, detalle: r === true ? '' : String(r), pendiente };
    });
  }
  if (jugador.arbolDevuelto) { delete jugador.arbolDevuelto; guardar(); setTimeout(() => avisar(`Árbol reiniciado: ahora el máximo es ${PUNTOS_ARBOL_MAX} puntos`), 800); }

