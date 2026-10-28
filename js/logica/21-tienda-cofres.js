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
