  // ---------------- Atributos, estrellas y rarezas ----------------
  // Un objeto tiene líneas de atributo { a: 'ataque', e: 1..5 estrellas }. Valor de una línea =
  // UNIDAD del atributo x multiplicador de rareza x factor de sus estrellas.
  const ATRIBUTOS = { ataque: 'Ataque', defensa: 'Defensa', vida: 'Vida', armadura: 'Armadura' };
  // Atributos secundarios (en %): salen como líneas extra del equipo y se suman a los efectos de skins y árbol.
  const SECUNDARIOS = { critico: 'Crítico', danoCritico: 'Daño crítico', penetracion: 'Penetración', reduccion: 'Reducción de daño',
                        resistencia: 'Resistencia', habilidad: 'Daño de habilidades', jefes: 'Daño a jefes', experiencia: 'Experiencia extra',
                        tenacidad: 'Tenacidad' };   // tenacidad: reduce la prob. de que te hagan un crítico
  // Otros efectos de combate (solo skins y árbol): se muestran si tienes alguno
  const OTROS_EFECTOS = { esquiva: 'Esquiva', robo: 'Robo de vida', contra: 'Contraataque', remate: 'Remate (<50 %)', curacion: 'Curación', oro: 'Oro extra', fortuna: 'Fortuna (drops)' };
  const BASE_SEC = {};   // sin base común: el crítico de base es del asesino y del arquero (CLASES[..].ef); los demás lo consiguen con equipo, runas…
  const DANO_CRITICO_BASE = 1.5;                           // un crítico hace ×1,5 (+ daño crítico)
  const TOPE_SEC = { tenacidad: .3, experiencia: .5, critico: .4, danoCritico: 1.5, penetracion: .6, reduccion: .6, resistencia: .75, habilidad: 1, jefes: 1, esquiva: .4, fortuna: .3,
                     robo: .25, contra: .35, remate: .5, curacion: 1 };   // sin tope, robo y contraataque apilados volvían inmortal al personaje
  // vida 20 (antes 10): frente a tu vida base (10 por nivel, el ataque 2) una línea de vida rendía la mitad que una de ataque
  const UNIDAD = { ataque: 4, defensa: 1.5, vida: 20, armadura: 10,
                   critico: .8, danoCritico: 3, penetracion: 1.5, reduccion: .6, resistencia: 2, habilidad: 1.5, jefes: 1.5, experiencia: 1, tenacidad: .6 };
  // Líneas extra al azar: los atributos base salen el doble que cada secundario
  const POOL_EXTRAS = ['ataque', 'defensa', 'vida', 'armadura', 'ataque', 'defensa', 'vida', 'armadura', ...Object.keys(SECUNDARIOS)];
  const nombreAtr = a => ATRIBUTOS[a] || SECUNDARIOS[a];
  // Secundarios en PUNTOS (como Wartune): el jugador ve "Crítico 640"; el % es interno. Las fuentes guardan su valor como
  // siempre (1 % de antes = 10 puntos) y efecto() convierte la suma: igual que antes hasta el codo (CODO_SEC del tope) y,
  // desde ahí, rendimientos decrecientes hacia el tope (apilar un atributo rinde cada vez menos). El codo baja con el
  // nivel (el mismo puntaje rinde menos a nivel 80 que a 60). Sin tope (oro): lineal.
  const PUNTOS_SEC = 1000;   // fracción → puntos (0,01 = 10 puntos)
  const CODO_SEC = .5;       // a nivel 60, lineal hasta la mitad del tope
  const escalaNivelSec = n => Math.max(1, (n + 60) / 120);   // hasta el nivel 60 = 1 · nivel 80 = 1,17
  function curvaSec(x, tope, nivel) {
    if (!isFinite(tope) || x <= 0) return x;
    const codo = tope * CODO_SEC / escalaNivelSec(nivel), resto = tope - codo;
    return x <= codo ? x : codo + resto * (x - codo) / (x - codo + resto);
  }
  const puntosDe = pct => Math.round(pct * PUNTOS_SEC / 100);   // un valor en % de los datos → puntos
  const fmtAtr = (a, v) => a in SECUNDARIOS ? puntosDe(v) : v;
  const nombreSec = esp => (SECUNDARIOS[esp] || OTROS_EFECTOS[esp]).toLowerCase();
  const textoPuntos = (esp, pct) => `${pct < 0 ? '−' : '+'}${Math.abs(puntosDe(pct))} ${nombreSec(esp)}`;   // "+20 crítico" (pct: valor de los datos)
  const ESTRELLA = [0, .6, .8, 1, 1.25, 1.6];        // factor por estrellas (1 = escala más baja, 5 = la más alta)
  const PROB_ESTRELLAS = [0, 30, 30, 22, 13, 5];     // % al sortear (cofres y refinamiento)
  const RAREZAS = {
    comun:      { nombre: 'Común',      mult: 1,   extras: 0, venta: 10 },
    rara:       { nombre: 'Rara',       mult: 1.6, extras: 0, venta: 40 },
    epica:      { nombre: 'Épica',      mult: 2.4, extras: 1, venta: 120 },
    legendaria: { nombre: 'Legendaria', mult: 3.5, extras: 2, venta: 350 },
    mitica:     { nombre: 'Mítica',     mult: 5,   extras: 3, venta: 1000 },   // la más rara de los cofres
    ancestral:  { nombre: 'Ancestral',  mult: 7,   extras: 4, venta: 3000, soloContenidoAlto: true },   // no sale en cofres: Etapa 3, calabozos 5-8 y Torre desde el 100
  };
  // Líneas con las que nace cada tipo de pieza (las épicas y legendarias suman líneas extra al azar)
  const LINEAS_RANURA = { espada: ['ataque'], casco: ['defensa', 'vida'], armadura: ['armadura', 'vida'], capa: ['vida', 'defensa'] };
  // Atributo base de cada pieza: el encantamiento le suma un valor fijo por nivel
  const PRINCIPAL = { espada: 'ataque', casco: 'defensa', armadura: 'armadura', capa: 'vida' };
