  // ---------------- Evento semanal: tema y tienda de fichas ----------------
  // Cada semana (lunes a domingo) hay un tema: una actividad que da fichas (contarMision avisa con su evento). Las fichas
  // no caducan y se gastan en la tienda del evento: consumibles con límite por semana y el título exclusivo del tema, que
  // solo se puede comprar esa semana (vuelve cuando el tema rota otra vez). Añadir un tema = añadir una entrada.
  const TEMAS_SEMANA = [
    { id: 'torre',   icono: '🗼', nombre: 'Semana de la Torre',   ev: 'torre',    fichas: 12,  unidad: 'piso superado',
      titulo: ['Escalador incansable', { vida: 3, defensa: 3 }] },
    { id: 'jefes',   icono: '👹', nombre: 'Semana de los jefes',  ev: 'jefe',     fichas: 25,  unidad: 'entrada de jefe',
      titulo: ['Cazajefes', { ataque: 4, vida: 2 }] },
    { id: 'arena',   icono: '⚔️', nombre: 'Semana de la Arena',   ev: 'arena',    fichas: 15,  unidad: 'combate de Arena',
      titulo: ['Gladiador', { ataque: 3, defensa: 3 }] },
    { id: 'caceria', icono: '🏹', nombre: 'Semana de cacería',    ev: 'enemigos', fichas: 1,   unidad: 'enemigo derrotado',
      titulo: ['Cazador de bestias', { ataque: 3, armadura: 3 }] },
    { id: 'forja',   icono: '🔨', nombre: 'Semana de la forja',   ev: 'encantar', fichas: 10,  unidad: 'encantamiento',
      titulo: ['Maestro forjador', { defensa: 3, armadura: 3 }] },
    { id: 'campana', icono: '🗺️', nombre: 'Semana de campaña',    ev: 'estamina', fichas: 0.4, unidad: 'estamina gastada',
      titulo: ['Trotamundos', { vida: 4, defensa: 2 }] },
  ];
  const TOPE_FICHAS_SEMANA = 1500;   // fichas que se pueden ganar por semana
  const PRECIO_TITULO_EVENTO = 1000;
  // Tienda: { id, premio, coste, max (por semana) }
  const TIENDA_EVENTO = [
    { id: 'estamina', premio: { estamina: 50 }, coste: 60,  max: 3 },
    { id: 'piedra',   premio: { piedra: 40 },   coste: 50,  max: 5 },
    { id: 'polvo',    premio: { polvo: 10 },    coste: 70,  max: 3 },
    { id: 'almas',    premio: { almas: 10 },    coste: 90,  max: 3 },
    { id: 'esencia',  premio: { esencia: 8 },   coste: 150, max: 2 },
  ];
  const idTituloTema = t => 'ev_' + t.id;
  TITULOS.push(...TEMAS_SEMANA.map(t => T(idTituloTema(t), t.titulo[0], 'epico', `Tienda del evento: ${t.nombre}`,
    () => [(jugador.titulos || {})[idTituloTema(t)] ? 1 : 0, 1], t.titulo[1])));
  // n.º de semana desde una fecha fija: el tema rota en orden
  const numSemana = () => { const [a, m, d] = semana().split('-').map(Number); return Math.round((new Date(a, m - 1, d) - new Date(2024, 0, 1)) / 6048e5); };
  const temaSemana = () => TEMAS_SEMANA[((numSemana() % TEMAS_SEMANA.length) + TEMAS_SEMANA.length) % TEMAS_SEMANA.length];
  function revisarEvento() {
    const E = jugador.evento ||= { fichas: 0 };
    if (E.semana !== semana()) { E.semana = semana(); E.ganadas = 0; E.compras = {}; E.resto = 0; }
    return E;
  }
  function sumarFichas(ev, n) {   // la llama contarMision
    if (!desbloqueado('evSemana')) return;
    const t = temaSemana(); if (ev !== t.ev) return;
    const E = revisarEvento(), crudo = n * t.fichas + E.resto, f = Math.min(Math.floor(crudo), TOPE_FICHAS_SEMANA - E.ganadas);
    E.resto = crudo - Math.floor(crudo); if (f <= 0) return;
    E.fichas += f; E.ganadas += f;
  }
  const compradosEvento = id => revisarEvento().compras[id] || 0;
  function puedeComprarEvento(id) {
    const E = revisarEvento();
    if (id === 'titulo') return !(jugador.titulos || {})[idTituloTema(temaSemana())] && E.fichas >= PRECIO_TITULO_EVENTO;
    const it = TIENDA_EVENTO.find(x => x.id === id); return !!it && compradosEvento(id) < it.max && E.fichas >= it.coste;
  }
  function comprarEvento(id) {   // devuelve lo comprado (premio o el título) o null
    if (!puedeComprarEvento(id)) return null;
    const E = revisarEvento();
    if (id === 'titulo') { const t = temaSemana(); E.fichas -= PRECIO_TITULO_EVENTO; (jugador.titulos ||= {})[idTituloTema(t)] = true; return { titulo: t.titulo[0] }; }
    const it = TIENDA_EVENTO.find(x => x.id === id); E.fichas -= it.coste; E.compras[id] = compradosEvento(id) + 1; darPremio(it.premio); return it.premio;
  }
  const eventoReclamable = () => desbloqueado('evSemana') && puedeComprarEvento('titulo');
