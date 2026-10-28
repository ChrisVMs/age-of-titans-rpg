  // ---------------- Jefe mundial: Asmodeo ----------------
  // Hoja img/jefes/asmodeo/asmodeo.png (150x200 por cuadro): 0 reposo, 4 preparar, 5 barrido, 6 garras, 7 onda de alas,
  // 8-12 muerte (acaba en cristal), 13 daño, 14 retroceso, 15 curación, 16 victoria.
  // Habilidades: onda de alas cada 3 turnos (a distancia, x1.5); por debajo del 50 % se cura un 4 % cada 5 turnos.
  const ASMODEO = { nombre: 'Asmodeo', asmodeo: true, armadura: 80, vida: 20000, dano: [320, 430], avance: 330, oro: 0, xp: 0 };
  const ONDA_ALAS = { turnos: 3, mult: 1.5 }, CURACION = { turnos: 5, pct: .04 };   // 4 % (el 10 % anterior anulaba casi todo el daño con su vida actual)
  // escudo: solo por debajo del 50 %, cada 5 turnos suyos; reduce un 80 % el daño recibido durante 3 golpes del guerrero
  const ESCUDO = { turnos: 5, reduce: .8, dura: 3 };
  Object.assign(batalla, { turnoOnda: 0, turnoCura: 0, turnoEscudo: 0, escudoRestante: 0, especialAsmodeo: null });

  // Jefes mundiales: cada uno con su vida diaria (compartida entre intentos), su premio y su ranking
  const MUNDIALES = {
    cerbero: { enemigo: CERBERO, titulo: 'Cerbero, guardián del inframundo', estamina: ESTAMINA_MUNDIAL,
      premio: { oro: 3000, xp: 1500, piedra: 30, polvo: 12 },
      retrato: (v, max) => `background-position-x:${v <= max / 2 ? '-2880px' : '0'}`,
      reglas: ['Al bajar del 50 % entra en <b>modo infernal</b>: daño ×3 y recibe un tercio del daño, salvo los <b>críticos</b>, que atraviesan su piel de lava (÷1,5). Cada 2 turnos lanzallamas largo y cada 4 una bola de fuego que quema el 10 % de tu vida.', 'Prueba de build: <b>crítico, daño crítico y daño a jefes</b>.'] },
    asmodeo: { enemigo: ASMODEO, titulo: 'Asmodeo, señor de los demonios', estamina: 20,
      premio: { oro: 4000, xp: 2000, piedra: 40, polvo: 15 },
      retrato: () => 'background:url(img/jefes/asmodeo/asmodeo.png) 0 0 / 2550px 200px no-repeat; width:150px; height:200px',
      reglas: ['Alterna barridos y ráfagas de garras; cada 3 turnos lanza una <b>onda de alas</b> a distancia (daño x1.5).',
               'Por debajo del 50 % se <b>cura</b> un 4 % de su vida cada 5 turnos (la mitad si está quemado, envenenado o sangrando) y levanta un <b>escudo</b> que reduce un 80 % el daño durante 3 golpes; una <b>habilidad</b> lo rompe.',
               'Prueba de build: <b>daño sostenido, habilidades y supervivencia</b>.'] },
  };
