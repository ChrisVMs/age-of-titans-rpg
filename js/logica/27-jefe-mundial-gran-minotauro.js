  // ---------------- Jefe mundial: Gran Minotauro ----------------
  // img/jefes/minotauro/minotauro.png (280x230 por cuadro): 0-5 reposo, 6-12 ataque, 13-15 daño, 16-18 muerte, 19 victoria,
  // 20-24 furia (cuadros 31-35 de minotaur_buff.jpg).
  // Furia: por debajo del 70 % de vida, cada 10 turnos suyos (la primera en cuanto baja del 70 %);
  // triplica su daño durante sus 5 ataques siguientes. Usa su turno para activarla.
  const MINOTAURO = { nombre: 'Gran Minotauro', minotauro: true, armadura: 100, vida: 25000, dano: [300, 400], avance: 540, oro: 0, xp: 0 };
  const FURIA = { umbral: .7, turnos: 10, mult: 3, dura: 5 };
  // Gran Tajo: cada 5 turnos suyos (sin importar su vida) salta, abre un arco de fuego y lo estrella contra el suelo:
  // golpe al 300 % y además quita el 10 % de la vida máxima del guerrero (ignora armadura y defensa).
  const GRAN_TAJO = { turnos: 5, mult: 3, quema: .10, avance: 240 };
  Object.assign(batalla, { turnoFuria: FURIA.turnos, furiaRestante: 0, especialMinotauro: null, turnoTajo: 0 });
  MUNDIALES.minotauro = { enemigo: MINOTAURO, titulo: 'Gran Minotauro, coloso del laberinto', estamina: 20,
    premio: { oro: 5000, xp: 2500, piedra: 50, polvo: 18 },
    retrato: () => 'background:url(img/jefes/minotauro/minotauro.png) 0 0 / 7000px 230px no-repeat; width:280px; height:230px',
    reglas: ['Barre con su espada de fuego; cada 5 turnos usa el <b>Gran Tajo</b>: golpe al 300 % que además te quita un 10 % de vida.',
             'Por debajo del 70 % entra en <b>furia</b>: <b>triplica su daño</b> durante 5 turnos, cada 10 turnos.',
             'Prueba de build: <b>vida, defensa y reducción de daño</b> (la reducción frena el doble la parte del Gran Tajo que va por tu vida).'] };
  let mundialSel = 'cerbero';
  function estadoMundial(id = mundialSel) {
    if (jugador.mundial && !jugador.mundiales) { jugador.mundiales = { cerbero: jugador.mundial }; delete jugador.mundial; }   // partidas anteriores
    jugador.mundiales = jugador.mundiales || {};
    const e = jugador.mundiales[id];
    if (!e || e.dia !== hoy()) { jugador.mundiales[id] = { dia: hoy(), vida: MUNDIALES[id].enemigo.vida, mio: 0 }; guardar(); }
    return jugador.mundiales[id];
  }
  // Ranking de daño del día. Sin servidor, los demás jugadores se simulan con una semilla por fecha
  // (siempre los mismos valores el mismo día); cuando haya backend se sustituye por la lista real.
  const RIVALES = ['Ragnar', 'Lyra', 'Kaito', 'Morgana', 'Thorin', 'Selene', 'Draven'];
  function ranking() {
    let semilla = [...hoy() + mundialSel].reduce((h, c) => h * 31 + c.charCodeAt(0) >>> 0, 7);
    const rnd = () => (semilla = (semilla * 1664525 + 1013904223) >>> 0) / 2 ** 32;
    const lista = RIVALES.map(n => ({ nombre: n, pct: Math.round((2 + rnd() * 14) * 10) / 10 }));
    lista.push({ nombre: `${jugador.nombre} (tú)`, yo: true, pct: Math.round((estadoMundial().mio || 0) / MUNDIALES[mundialSel].enemigo.vida * 1000) / 10 });
    return lista.sort((a, b) => b.pct - a.pct);
  }
  function pintarRanking() {
    const lista = ranking(), puesto = lista.findIndex(j => j.yo) + 1;
    return `<div class="ranking"><h3>Top 5 · % de daño hoy</h3>${lista.slice(0, 5).map((j, i) =>
      `<div class="${j.yo ? 'yo' : ''}"><span>#${i + 1} ${j.nombre}</span><span class="pct"><i style="width:${Math.min(100, j.pct * 4)}%"></i></span><b>${j.pct}%</b></div>`).join('')}
      ${puesto > 5 ? `<div class="yo"><span>#${puesto} ${jugador.nombre} (tú)</span><span class="pct"><i style="width:${Math.min(100, lista[puesto - 1].pct * 4)}%"></i></span><b>${lista[puesto - 1].pct}%</b></div>` : ''}</div>`;
  }
  // Entradas de jefe: 3 al día para todos los jefes mundiales; no gastan estamina (la estamina queda para la campaña)
  const ENTRADAS_JEFE = 3;
  function entradasJefe() {
    if (jugador.diaJefes !== hoy()) { jugador.diaJefes = hoy(); jugador.entradasJefe = ENTRADAS_JEFE; }
    return jugador.entradasJefe;
  }
  function batallaMundial(id) {
    const m = MUNDIALES[id], e = { ...m.enemigo, dano: [...m.enemigo.dano], aplica: [...(m.enemigo.aplica || [])] };   // copia con los modificadores de la semana
    for (const md of modsSemana()) md.ap(e);
    return { nombre: 'Jefe mundial: ' + m.enemigo.nombre, mundial: id, coste: 0, premio: m.premio, botin: { piedra: [0, 0], polvo: 0 }, enemigos: [e] };
  }
  function iniciarMundial() {
    if (estadoMundial().vida <= 0 || entradasJefe() <= 0) return;
    jugador.entradasJefe--; guardar();
    iniciarCampana(batallaMundial(mundialSel));
  }
  // lanzallamas largo: carga la boca (cuadros 0-3 de la carga), enciende (llamita azul), el chorro se alarga
  // y sopla en continuo un rato sobre el guerrero. img/jefes/cerbero/lanzallamas.png: 0-3 encendido, 4-7 emisión, 8-24 continuo.
  const LLAMA = { alto: 96 * 1.9 };
  async function transformar() { batalla.infernal = true; await animarTransformacion(); }
  // escudo: mueve los brazos, genera el aura y el círculo, el aura se desvanece y vuelve a su pose;
  // después queda un brillo del color del aura mientras el escudo esté activo.
  // img/jefes/asmodeo/escudo.png: 36 cuadros de 260x220 (x2); orden: 3-30 (brazos, aura, círculo), 32-36 (el aura se deshace) y 31 (limpio).
  const ORDEN_ESCUDO = [...Array(28).keys()].map(i => i + 2).concat([31, 32, 33, 34, 35, 30]);

  // Daño: el ataque del guerrero varía ±15 %. Al recibir: la armadura y la defensa reducen cada una un %
  // con rendimiento decreciente (armadura / (armadura + 400), defensa / (defensa + 300)); cada golpe hace al menos el 15 % de su daño bruto.
  const danoGuerrero = st => Math.max(1, Math.round(st.ataque * (0.85 + rnd() * 0.3)));
  // (antes la defensa restaba un valor fijo y con equipo medio todo golpe quedaba en 1)
  const K_ARMADURA = 400, K_DEFENSA = 300, DANO_MINIMO = .15;
  const factorDefensa = st => Math.max(DANO_MINIMO, K_ARMADURA / (K_ARMADURA + st.armadura) * K_DEFENSA / (K_DEFENSA + st.defensa));
  // Orden del cálculo de un golpe (igual en 1 contra 1 y en grupo):
  //   bruto → × (1 + daño de habilidades [solo habilidades] + daño a jefes [solo jefes] + remate [<50 %]) → × crítico
  //   → × factorDefensa(armadura × (1 − penetración), defensa) → × (1 − reducción de daño del objetivo) → escudos y fases
  // Los efectos de estado por turno (quemadura, veneno, sangrado) no pasan por armadura: los frena la resistencia.
  const multGolpe = (ef, hab, jefe, remate) => (hab ? hab.mult : 1) * (1 + (hab ? ef('habilidad') : 0) + (jefe ? ef('jefes') : 0) + (remate ? ef('remate') : 0));
  const armaduraEfectiva = (A, pen, perfora) => perfora ? 0 : A * (1 - pen);
  // Resistencia (a estados negativos): una parte evita el estado y otra reduce su daño. Una sola tirada, sin doble cuenta:
  // al tope (75 %) se evita el 45 % de las veces y el resto hace un 30 % menos de daño.
  const resistir = res => ({ evita: rnd() < res * .6, factor: 1 - res * .4 });
  const danoRecibido = (bruto, st) => Math.max(1, Math.round(bruto * factorDefensa(st)));

  // Estado de la batalla
  batalla.terminada = true;

  // Motor: deja `batalla` lista para empezar la batalla c, sin dibujar nada ni gastar estamina
  function prepararBatalla(c) {
    batalla.id = (batalla.id || 0) + 1;   // identifica la batalla: lo que quede por dibujar de otra anterior se descarta
    batalla.danoHecho = 0; batalla.especialCerbero = null; batalla.turnoBola = 0; batalla.turnoLanza = 0; batalla.turnoOnda = 0; batalla.turnoCura = 0; batalla.turnoEscudo = 0; batalla.escudoRestante = 0; batalla.turnoFuria = FURIA.turnos - 1; batalla.furiaRestante = 0; batalla.especialMinotauro = null; batalla.turnoTajo = 0; batalla.especialAsmodeo = null;
    c.grupo = !!(c.idCampana || c.torre || c.reyes || c.calabozo);   // campaña, Torre y Torre de reyes: batalla por grupos en rombo
    batalla.campana = c; batalla.reglas = c.grupo ? REGLAS.grupo : REGLAS.duelo;
    prepararHabilidades(); batalla.st = estadisticas(); batalla.ganado = { oro: 0, xp: 0, piedra: 0, polvo: 0, almas: 0, objetos: [] }; batalla.terminada = false;
    if (c.grupo) armarGrupo(c); else armarDuelo();
  }
  let obtenidos = [];
