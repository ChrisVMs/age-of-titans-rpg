  // ---------------- Jefe mundial: Cerbero ----------------
  // Hoja img/jefes/cerbero/cerbero.png (240x210 por cuadro, fondo recortado): 0-3 reposo, 4-7 ataque, 8-11 muerte; +12 = modo infernal.
  // img/jefes/cerbero/carga.png: 8 cuadros (carga la boca y forma la bola); img/jefes/cerbero/bola_fuego.png: 6 cuadros del proyectil.
  // Su vida es compartida entre intentos y se renueva cada día; al bajar del 50 % entra en modo infernal.
  // Jefes mundiales calibrados para 25-30k de poder: con ese perfil se aguantan ~15-25 rondas y hacen falta 2-3
  // intentos para tumbarlos (su vida es diaria y compartida entre intentos). Con menos poder se aporta menos daño.
  const VIDA_MUNDIAL = 15000, ESTAMINA_MUNDIAL = 20;
  const INFERNAL = { dano: 3, defensa: 3, defensaCritico: 1.5 };   // en infernal los críticos solo se dividen entre 1,5: premia builds de crítico   // modo infernal: triplica sus stats (x3 daño y recibe un tercio del daño)
  const CERBERO = { nombre: 'Cerbero', cerbero: true, armadura: 60, vida: VIDA_MUNDIAL, dano: [250, 350], avance: 300, oro: 0, xp: 0 };
  // Habilidades de Cerbero (solo en modo infernal), cada una con su propia carga de turnos:
  //  bola de fuego: cada 4 turnos, quema el 10 % de la vida máxima del guerrero (ignora armadura y defensa)
  //  lanzallamas largo: cada 2 turnos, daño x1.4. Si coinciden, va primero la bola de fuego.
  const BOLA_FUEGO = { turnos: 4, quemadura: .10 }, LANZALLAMAS = { turnos: 2, mult: 1.4 };
  Object.assign(batalla, { infernal: false, turnoBola: 0, turnoLanza: 0, danoHecho: 0, especialCerbero: null });
