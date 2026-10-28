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
    mitica:     { nombre: 'Mítica',     mult: 5,   extras: 3, venta: 1000 },   // la más rara de los cofres
    ancestral:  { nombre: 'Ancestral',  mult: 7,   extras: 4, venta: 3000, soloContenidoAlto: true },   // no sale en cofres: Etapa 3, calabozos 5-8 y Torre desde el 100
  };
  // Líneas con las que nace cada tipo de pieza (las épicas y legendarias suman líneas extra al azar)
  const LINEAS_RANURA = { espada: ['ataque'], casco: ['defensa', 'vida'], armadura: ['armadura', 'vida'], capa: ['vida', 'defensa'] };
  // Atributo base de cada pieza: el encantamiento le suma un valor fijo por nivel
  const PRINCIPAL = { espada: 'ataque', casco: 'defensa', armadura: 'armadura', capa: 'vida' };
