  // ---------------- Servidor de bots (solo pruebas) ----------------
  // 99 jugadores bot que avanzan solos, un día de juego a la vez, con el mismo simulador que "Simular progresión": cada uno
  // empieza un día distinto y juega a su ritmo (casual, normal o intenso), así que el ranking se parece a un servidor real.
  // Esta parte es pura (sin pantalla, hilos ni guardado): el plan, los días que faltan y avanzar un bot. La pantalla
  // (8-servidor-bots-pantalla.js) reparte el trabajo en hilos y lo guarda. Para quitarlo: borrar los 3 archivos
  // (este, servidor-hilo.js y 8-servidor-bots-pantalla.js) y sus líneas en js/orden.json. El juego no depende de ellos.
  const BOTS_SERVIDOR = 99;
  // ritmo: estamina extra al día (anuncios/cristales) y probabilidad de jugar cada día
  // tipo: cómo juega cada día que juega (TIPOS_JUGADOR: estamina extra, cuánta gasta, rival de arena, habilidades)
  const RITMOS_BOT = { casual: { tipo: 'casual', juega: .7, peso: 3 }, normal: { tipo: 'constante', juega: .95, peso: 5 }, intenso: { tipo: 'pago', juega: 1, peso: 2 } };
  const INICIO_BOT = [-2, 20];   // día del servidor en que empieza cada bot (negativo: ya jugaba antes; como mucho 2 días)
  // Jugadores reales, sin ventajas: empiezan con lo del juego publicado (ORO_INICIAL y MAT_INICIAL fuera del modo pruebas,
  // en 06-progreso-del-jugador.js). Aquí van copiados porque el simulador corre en modo pruebas, que da más.
  const INICIO_REAL_BOT = { oro: 3000, mat: { piedra: 20, polvo: 5, almas: 0, esencia: 0 }, cristales: 0 };
  const SILABAS_BOT = ['ka', 'ri', 'to', 'mor', 'ga', 'na', 'el', 'ric', 'sig', 'lyr', 'tho', 'zan', 'dra', 'vel', 'ku', 'mi', 'ra', 'shen', 'bo', 'lux'];
  // el plan de los bots (fijo para una semilla): nombre, clase, día de inicio, ritmo y semilla propia
  function planServidor(n = BOTS_SERVIDOR, semilla = 1) {
    const r = azarSemilla('servidor ' + semilla), elegirR = l => l[Math.floor(r() * l.length)], clases = Object.keys(CLASES), usados = new Set();
    const ritmos = Object.entries(RITMOS_BOT).flatMap(([k, v]) => Array(v.peso).fill(k));
    return Array.from({ length: n }, (_, i) => {
      let nombre; do { nombre = elegirR(SILABAS_BOT) + elegirR(SILABAS_BOT) + (r() < .4 ? elegirR(SILABAS_BOT) : ''); nombre = nombre[0].toUpperCase() + nombre.slice(1); } while (usados.has(nombre)); usados.add(nombre);
      return { id: i, nombre, clase: elegirR(clases), inicio: Math.round(INICIO_BOT[0] + r() * (INICIO_BOT[1] - INICIO_BOT[0])), ritmo: elegirR(ritmos), semilla: 1000 + i };
    });
  }
  // días que le faltan a un bot (lleva `hechos`) para estar al día en el día `diaServidor`
  const diasPendientesBot = (b, hechos, diaServidor) => Math.max(0, diaServidor - b.inicio + 1 - hechos);
  // ¿juega el bot su día número d? (los casuales se saltan alguno; siempre igual para el mismo bot y día)
  const juegaBot = (b, d) => azarSemilla(`juega ${b.semilla} ${d}`)() < RITMOS_BOT[b.ritmo].juega;
  // Avanza un bot `dias` días desde `hechos`. offset: el día de juego (offsetDias) de su primer día. Devuelve el perfil.
  // Los días que no juega solo pasa el tiempo (no se simula nada).
  function avanzarBot(b, perfil, hechos, dias, offset) {
    let p = perfil || Object.assign(partidaNueva(), { nombre: b.nombre, clase: b.clase, arbol: {}, torre: { mejor: 0 }, calabozos: {}, calabozosDif: {},
      mascotas: {}, runas: [], skinsPropias: {}, formacion: { pos: 'frente', aliados: [] } }, structuredClone(INICIO_REAL_BOT));
    const o0 = offsetDias;
    try {
      for (let d = hechos + 1; d <= hechos + dias; d++) {
        if (!juegaBot(b, d)) continue;
        offsetDias = offset + (d - hechos - 1);
        const r = simularProgresion({ dias: 1, perfil: p, semilla: b.semilla * 1000 + d, expediciones: 2,
          tipo: { ...TIPOS_JUGADOR[RITMOS_BOT[b.ritmo].tipo], juega: 1 } });   // si juega este día ya lo decidió juegaBot
        if (r) p = r.jugador;
      }
    } finally { offsetDias = o0; }
    return Object.assign(p, { nombre: b.nombre, clase: b.clase, bot: true });
  }
