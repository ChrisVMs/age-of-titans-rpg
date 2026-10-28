  // ---------------- inicio ----------------
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
