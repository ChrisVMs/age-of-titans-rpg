  // ---------------- Habilidades ----------------
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
