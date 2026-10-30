  // ---------------- Habilidades ----------------
  // animacion: cuál de las del guerrero se dibuja (ANIM_HAB, en la pantalla)
  const HAB_TODAS = [
    { id: 'estocada', clase: 'guerrero', nombre: 'Estocada', icono: '🗡️', turnos: 4, mult: 2.5,   // dos manos al frente, espada apuntando al enemigo
      animacion: 'estocada' },
    { id: 'tajo', clase: 'guerrero', nombre: 'Tajo ascendente', icono: '🌙', turnos: 3, mult: 1.8,   // cuadros 12-13 generados: la espada sube
      animacion: 'tajo' },
    { id: 'aplastante', clase: 'guerrero', nombre: 'Golpe aplastante', icono: '🔨', turnos: 5, mult: 3, aturde: true, nodo: 'aplastante',   // se aprende en el árbol
      animacion: 'aplastante' },
  ];
  // Arquero: mismas animaciones del guerrero hasta tener su sprite; la Maga lanza desde su sitio. aplica: estado que puede dejar el golpe.
  HAB_TODAS.push(
    { id: 'disparo', clase: 'arquero', nombre: 'Disparo certero', icono: '🏹', turnos: 3, mult: 2.2, animacion: 'estocada' },
    { id: 'lluvia', clase: 'arquero', nombre: 'Lluvia de flechas', icono: '🌧️', turnos: 4, mult: 1.6, animacion: 'tajo',
      aplica: { estado: 'sangrado', prob: .5, turnos: 3, pct: .15 } },
    { id: 'perforante', clase: 'arquero', nombre: 'Flecha perforante', icono: '🗡️', turnos: 5, mult: 3.2, perfora: true, nodo: 'perforante', animacion: 'aplastante' },
    { id: 'bola', clase: 'mago', nombre: 'Bola de fuego', icono: '🔥', turnos: 3, mult: 2, animacion: 'bola',
      aplica: { estado: 'quemadura', prob: .5, turnos: 2, pct: .2 } },
    { id: 'lanza', clase: 'mago', nombre: 'Lanza de hielo', icono: '❄️', turnos: 4, mult: 1.7, animacion: 'lanza',
      aplica: { estado: 'congelacion', prob: .3, turnos: 1 } },
    { id: 'meteoro', clase: 'mago', nombre: 'Meteoro', icono: '☄️', turnos: 6, mult: 4, nodo: 'meteoro', animacion: 'meteoro',
      aplica: { estado: 'quemadura', prob: .8, turnos: 3, pct: .3 } },
    { id: 'punalada', clase: 'asesino', nombre: 'Puñalada', icono: '🔪', turnos: 2, mult: 1.6, animacion: 'punalada',
      aplica: { estado: 'sangrado', prob: .5, turnos: 3, pct: .15 } },
    { id: 'paso', clase: 'asesino', nombre: 'Paso sombrío', icono: '🌑', turnos: 4, mult: 2.4, animacion: 'paso',
      aplica: { estado: 'veneno', prob: .6, turnos: 3, pct: .15 } },
    { id: 'danza', clase: 'asesino', nombre: 'Danza de cuchillas', icono: '✖️', turnos: 6, mult: 0, buff: 'danza', animacion: 'danza' },   // buff: no golpea
  );
  // Habilidades de la batalla: las de la clase (las de nodo, si están aprendidas), con las mejoras del árbol
  let HABILIDADES = [];
  let sinRecarga = false;   // pruebas: las habilidades del jugador siempre cargadas
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
    HABILIDADES.forEach(h => batalla.carga[h.id] = llenas || sinRecarga ? h.turnos : 0);
  }
  const habLista = () => HABILIDADES.find(h => batalla.carga[h.id] >= h.turnos) || null;
