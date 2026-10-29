  // ---------------- Skins ----------------
  // Una skin solo cambia el aspecto del guerrero: tapa las capas del equipo (casco, armadura, espada, capa)
  // pero los stats siguen siendo los del equipo. Cada skin puede tener un bono propio en % (por definir).
  const VERSION_IMG = 10;   // súbelo al regenerar imágenes de skins: obliga al navegador a no usar la copia vieja
  // Cada skin: bono base por estrella (atributo, % por ★) + efecto especial (siempre activo) + color de su brillo.
  // Se compra en la Tienda (empieza en ★1) y se mejora hasta ★5; a ★5 el guerrero brilla con su color.
  const SKINS = [
    { id: 'egida_tormentosa',    nombre: 'Égida tormentosa',      icono: '⚡', base: ['ataque', 1],   esp: 'habilidad', valor: 5,   txt: 'daño de habilidades', color: '#4fc3ff' },
    { id: 'obsidiana_oscura',    nombre: 'Obsidiana oscura',      icono: '🌑', base: ['ataque', 1.5], esp: 'jefes',     valor: 7.5, txt: 'daño contra jefes',   color: '#8a5cff' },
    { id: 'guardian_espectral',  nombre: 'Guardián espectral',    icono: '👻', base: ['defensa', 1],  esp: 'reduccion', valor: 5,   txt: 'daño recibido', menos: true, color: '#5fe6e0' },
    { id: 'gendarme_mecanico',   nombre: 'Gendarme mecánico',     icono: '🤖', base: ['ataque', 1],   esp: 'contra',    valor: 5,   txt: 'prob. de contraataque', color: '#3fe08a' },
    { id: 'druida_verdial',      nombre: 'Druida verdial',        icono: '🌿', base: ['vida', 2],     esp: 'curacion',  valor: 10,  txt: 'curación recibida',   color: '#8adf3c' },
    { id: 'aurico_solar',        nombre: 'Áurico solar',          icono: '☀️', base: ['vida', 2],     esp: 'oro',       valor: 10,  txt: 'oro obtenido',        color: '#ffd84a' },
    { id: 'cristalino_amaranto', nombre: 'Cristalino amaranto',   icono: '💎', base: ['ataque', 1],   esp: 'critico',   valor: 5,   txt: 'prob. de crítico',    color: '#e05cff' },
    { id: 'infernal',            nombre: 'Infernal',              icono: '🔥', base: ['ataque', 1.5], esp: 'remate',    valor: 7.5, txt: 'daño a enemigos con <50% de vida', color: '#ff7a1a' },
    { id: 'caballero_muerte',    nombre: 'Caballero de la muerte', icono: '💀', base: ['ataque', 1],   esp: 'robo',      valor: 5,   txt: 'robo de vida',        color: '#b06cff' },
    { id: 'necro_guardian',      nombre: 'Necro-guardián',        icono: '☠️', base: ['vida', 2],     esp: 'resistencia', valor: 10, txt: 'resistencia a efectos negativos', color: '#e8dcae' },
  ].map(k => ({ ...k, anim: true, img: `img/skins/${k.id}.png?v=${VERSION_IMG}`, tira: `img/skins/anim/${k.id}.png?v=${VERSION_IMG}` }));
  const PRECIO_SKIN = 5000, COSTE_ESTRELLA = n => 3000 * n;   // compra (★1) y mejora ★n -> ★n+1
  const estrellasSkin = id => (jugador.skinsPropias || {})[id] || 0;
  const skinActual = () => { const k = SKINS.find(x => x.id === jugador.skin); return k && estrellasSkin(k.id) ? k : null; };
  const bonoSkinBase = k => Math.round(k.base[1] * estrellasSkin(k.id) * multDespertar('skin', k.id) * 10) / 10;           // % del atributo base
  // efecto especial de la skin equipada (0 si no lo tiene)
  // El efecto especial crece con las estrellas: ★1 60 %, ★2 70 %, ★3 80 %, ★4 90 %, ★5 100 % (y brillo). Bonos pequeños:
  // dan identidad (Infernal daño, Cristalino crítico, Necro-guardián aguante, Áurico economía, Obsidiana jefes) sin ser obligatorias.
  const valorSkin = (k, n = estrellasSkin(k.id)) => Math.round((k.valor * (.5 + .1 * n) * multDespertar('skin', k.id) + (pasivaDespertar('skin', k.id) ? PASIVA_SKIN.valor : 0)) * 10) / 10;
  const efectoSkin = esp => { const k = skinActual(); return k && k.esp === esp ? valorSkin(k) / 100 : 0; };
  // Efecto total (fracción): base + skin + árbol + líneas secundarias del equipo, con tope
  // Mientras dura un cálculo de poder, lo que no cambia se calcula una vez (poder() pide unos 15 efectos y cada uno volvía a
  // recorrer el equipo y las colecciones): memo guarda esos resultados y se vacía al terminar.
  let memo = null;
  const memoizar = (k, f) => !memo ? f() : k in memo ? memo[k] : (memo[k] = f());
  const secEquipo = () => memoizar('secEquipo', secEquipoSinMemo);
  function secEquipoSinMemo() {
    const t = {};
    for (const uid of Object.values(jugador.equipado)) for (const [a, v] of Object.entries(valores(objeto(uid)))) if (a in SECUNDARIOS) t[a] = (t[a] || 0) + v;
    return t;
  }
  const topeExtraSkin = esp => { const k = skinActual(); return k && k.esp === esp && pasivaDespertar('skin', k.id) ? PASIVA_SKIN.tope : 0; };
  const efecto = esp => Math.min((TOPE_SEC[esp] ?? Infinity) + topeExtraSkin(esp), (BASE_SEC[esp] || 0) + efectoSkin(esp) + efectoArbol(esp) + (secEquipo()[esp] || 0) / 100
    + efectoReliquias(esp) + efectoRunas(esp) + efectoColeccion(esp) + efectoMaestria(esp) + efectoMascota(esp) + (CLASES[jugador.clase].ef[esp] || 0) + efectoConjuntos(esp));
  const skinsDisponibles = () => SKINS.filter(k => estrellasSkin(k.id) > 0);
  let skinSel = null;   // skin seleccionada en la pestaña (tocar una no la equipa)
  const textoEstrellas = n => `<span class="est">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`;
  function fichaSkin(k) {
    const n = estrellasSkin(k.id), puesta = jugador.skin === k.id;
    return `<div class="masc-actual" style="border-color:${k.color}">
      <img src="${k.img}" alt="" style="height:110px;image-rendering:pixelated">
      <h3 style="margin:0;color:${k.color}">${k.icono} ${k.nombre} ${textoEstrellas(n)}</h3>
      <div class="atributos" style="width:100%">
        <div><span>${ATRIBUTOS[k.base[0]]}</span><span>+${bonoSkinBase(k)}%</span></div>
        <div><span>Especial</span><span>${k.menos ? '−' : '+'}${valorSkin(k, Math.max(1, n))}% ${k.txt}</span></div>
        ${n < 5 ? `<div><span>En ★${Math.max(1, n) + 1}</span><span>+${k.base[1]}% ${ATRIBUTOS[k.base[0]].toLowerCase()} · especial ${valorSkin(k, Math.max(1, n) + 1)}%</span></div>` : '<div><span>★5</span><span>Brillo de poder</span></div>'}
      </div>
      <div class="fila">
        ${puesta ? '<button data-acc="quitar">Desequipar</button>' : '<button data-acc="equipar">EQUIPAR</button>'}
        ${n < 5 ? `<button data-acc="mejorar" ${jugador.oro < COSTE_ESTRELLA(n) ? 'disabled' : ''}>Mejorar a ★${n + 1} ● ${COSTE_ESTRELLA(n)}</button>` : botonDespertar('skin', k.id)}
      </div></div>`;
  }
  function mejorarSkin(k) {   // ★n → ★n+1
    const n = estrellasSkin(k.id), c = COSTE_ESTRELLA(n);
    if (n >= 5 || jugador.oro < c) return false;
    jugador.oro -= c; jugador.skinsPropias[k.id] = n + 1; return true;
  }
  function comprarSkin(k) {
    if (estrellasSkin(k.id) || jugador.oro < PRECIO_SKIN) return false;
    jugador.oro -= PRECIO_SKIN; (jugador.skinsPropias ||= {})[k.id] = 1; return true;
  }
