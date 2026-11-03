  // ---------------- Recargas de estamina y cristales ----------------
  // Al día: la estamina gratis (ESTAMINA_MAX), hasta ANUNCIOS_DIA anuncios de ESTAMINA_ANUNCIO cada uno y una recarga
  // con cristales (RECARGA_CRISTALES). Los cristales 💎 salen en pocas cantidades: cofres de misiones y la primera vez que
  // se completa un capítulo (los 10 niveles de una etapa) en cada dificultad.
  const ANUNCIOS_DIA = 3, ESTAMINA_ANUNCIO = 50;
  const RECARGA_CRISTALES = { estamina: 150, coste: 50 };   // una vez al día
  const CRISTALES_CAPITULO = { normal: 20, dificil: 30, pesadilla: 40, infierno: 60 };
  jugador.cristales ||= 0;
  function revisarRecargas() { const R = jugador.recargas ||= {}; if (R.dia !== hoy()) { R.dia = hoy(); R.anuncios = 0; R.cristales = false; } return R; }
  const anunciosQuedan = () => ANUNCIOS_DIA - revisarRecargas().anuncios;
  const puedeRecargaCristales = () => !revisarRecargas().cristales && jugador.cristales >= RECARGA_CRISTALES.coste;
  // El anuncio en sí lo pone la pantalla (ui.verAnuncio: promesa true si se vio entero); esto solo cobra.
  function cobrarAnuncio() {
    if (anunciosQuedan() <= 0) return false;
    revisarRecargas().anuncios++; jugador.estamina += ESTAMINA_ANUNCIO; return true;
  }
  function recargarConCristales() {
    if (!puedeRecargaCristales()) return false;
    jugador.cristales -= RECARGA_CRISTALES.coste; revisarRecargas().cristales = true; jugador.estamina += RECARGA_CRISTALES.estamina; return true;
  }
  // Capítulo completo: tras superar un nivel de campaña, si ya están los 10 de su etapa en esa dificultad (una vez)
  function premioCapitulo(idCampana, dif) {
    const etapa = idCampana.split('-')[0], C = jugador.capitulos ||= {}, k = `${etapa}:${dif}`;
    if (C[k] || !CAMPANAS.filter(c => c.id.startsWith(etapa + '-')).every(c => superada(c.id, dif))) return null;
    C[k] = true; jugador.cristales += CRISTALES_CAPITULO[dif]; return { cristales: CRISTALES_CAPITULO[dif] };
  }

  // Cambio de cristales por oro (tocar el oro del HUD). El oro crece con el nivel para que siga valiendo la pena.
  const CAMBIO_ORO = [{ cristales: 20, oroNivel: 300 }, { cristales: 100, oroNivel: 1700 }, { cristales: 300, oroNivel: 5500 }];
  const oroDeCambio = c => c.oroNivel * Math.max(1, jugador.nivel);
  function cambiarOro(i) {
    const c = CAMBIO_ORO[i]; if (!c || (jugador.cristales || 0) < c.cristales) return false;
    jugador.cristales -= c.cristales; jugador.oro += oroDeCambio(c); return true;
  }
  // Paquetes de cristales con dinero real: aún sin pagos en la app (se muestran como próximamente)
  const PAQUETES_CRISTALES = [{ cristales: 100, precio: '0,99 €' }, { cristales: 550, precio: '4,99 €' }, { cristales: 1200, precio: '9,99 €' }];
  // El pago lo pone la pantalla (ui.comprarPaquete: promesa true si se pagó); esto solo entrega los cristales.
  function cobrarPaquete(i) { const p = PAQUETES_CRISTALES[i]; if (!p) return false; jugador.cristales = (jugador.cristales || 0) + p.cristales; return true; }
