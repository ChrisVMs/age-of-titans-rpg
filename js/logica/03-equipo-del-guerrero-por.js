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
