  // ---------------- Jefe mundial: Asmodeo ----------------
  // Hoja img/jefes/asmodeo/asmodeo.png (150x200 por cuadro): 0 reposo, 4 preparar, 5 barrido, 6 garras, 7 onda de alas,
  // 8-12 muerte (acaba en cristal), 13 daño, 14 retroceso, 15 curación, 16 victoria.
  // Habilidades: onda de alas cada 3 turnos (a distancia, x1.5); por debajo del 50 % se cura un 4 % cada 5 turnos.
  const ASMODEO = { nombre: 'Asmodeo', asmodeo: true, armadura: 80, vida: 28000, dano: [370, 495],   // 2026-11-03: con 20 000 / 320-430 era el más fácil (caía antes que los otros, también en Pesadilla)
                    avance: 330, oro: 0, xp: 0 };
  const ONDA_ALAS = { turnos: 3, mult: 1.5 }, CURACION = { turnos: 5, pct: .04, conEstado: .5 };   // conEstado: parte que se cura si está quemado, envenenado o sangrando   // 4 % (el 10 % anterior anulaba casi todo el daño con su vida actual)
  // escudo: solo por debajo del 50 %, cada 5 turnos suyos; reduce un 80 % el daño recibido durante 3 golpes del guerrero
  const ESCUDO = { turnos: 5, reduce: .8, dura: 3, rompe: .7 };   // rompe: daño del golpe de habilidad que lo rompe
  Object.assign(batalla, { turnoOnda: 0, turnoCura: 0, turnoEscudo: 0, escudoRestante: 0, especialAsmodeo: null });

  // Jefes mundiales: cada uno con su vida diaria (compartida entre intentos), su premio y su ranking
  const MUNDIALES = {
    cerbero: { enemigo: CERBERO, titulo: 'Cerbero, guardián del inframundo', estamina: ESTAMINA_MUNDIAL,
      premio: { oro: 3000, xp: 1500, piedra: 30, polvo: 12 },
      retrato: (v, max) => `background-position-x:${v <= max / 2 ? '-2880px' : '0'}`,
      reglas: [`Al bajar del 50 % entra en <b>modo infernal</b>: daño ×${INFERNAL.dano} y recibe el daño ÷${INFERNAL.defensa}, salvo los <b>críticos</b>, que atraviesan su piel de lava (÷${String(INFERNAL.defensaCritico).replace('.', ',')}). Cada ${LANZALLAMAS.turnos} turnos lanzallamas largo y cada ${BOLA_FUEGO.turnos} una bola de fuego que quema el ${Math.round(BOLA_FUEGO.quemadura * 100)} % de tu vida.`, 'Prueba de build: <b>crítico, daño crítico y daño a jefes</b>.'] },
    asmodeo: { enemigo: ASMODEO, titulo: 'Asmodeo, señor de los demonios', estamina: 20,
      premio: { oro: 4000, xp: 2000, piedra: 40, polvo: 15 },
      retrato: () => 'background:url(img/jefes/asmodeo/asmodeo.png) 0 0 / 2550px 200px no-repeat; width:150px; height:200px',
      reglas: [`Alterna barridos y ráfagas de garras; cada ${ONDA_ALAS.turnos} turnos lanza una <b>onda de alas</b> a distancia (daño ×${String(ONDA_ALAS.mult).replace('.', ',')}).`,
               `Por debajo del 50 % se <b>cura</b> un ${Math.round(CURACION.pct * 100)} % de su vida cada ${CURACION.turnos} turnos (${CURACION.conEstado === .5 ? 'la mitad' : `el ${Math.round(CURACION.conEstado * 100)} %`} si está quemado, envenenado o sangrando) y levanta un <b>escudo</b> que reduce un ${Math.round(ESCUDO.reduce * 100)} % el daño durante ${ESCUDO.dura} golpes; una <b>habilidad</b> lo rompe (ese golpe hace el ${Math.round(ESCUDO.rompe * 100)} %).`,
               'Prueba de build: <b>daño sostenido, habilidades y supervivencia</b>.'] },
  };
