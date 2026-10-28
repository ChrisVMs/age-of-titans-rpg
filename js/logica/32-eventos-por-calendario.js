  // ---------------- Eventos por calendario ----------------
  // Se repiten solos cada semana: fin de semana doble botín, miércoles de oro, viernes de experiencia
  // Eventos rotativos: cada día favorece un tipo de farmeo ("hoy conviene farmear esto"). No regalan nada: cambian
  // qué rinde más. drop: prob. de equipo · caza: prob. de subir rareza · mat: piedras y polvo · forja: descuento de oro al
  // encantar · jefes: recompensas y piezas de jefes mundiales · oro / xp: multiplicadores.
  const EVENTOS = [
    { icono: '🎁', nombre: 'Fin de semana de botín', desc: 'doble prob. de equipo y polvo', drop: 2 },   // domingo
    { icono: '🔨', nombre: 'Día de la Forja', desc: '+50 % piedras y polvo · encantar cuesta −25 % de oro', mat: 1.5, forja: .25 },
    { icono: '🏹', nombre: 'Día de Cacería', desc: '+50 % prob. de equipo y +15 % de que suba de rareza', drop: 1.5, caza: .15 },
    { icono: '💰', nombre: 'Miércoles de oro', desc: '+50 % de oro', oro: 1.5 },
    { icono: '👹', nombre: 'Día de Jefes', desc: 'jefes mundiales: +50 % de recompensas y de prob. de pieza de set', jefes: 1.5 },
    { icono: '📈', nombre: 'Viernes de experiencia', desc: '+50 % de experiencia y maestría', xp: 1.5 },
    { icono: '🎁', nombre: 'Fin de semana de botín', desc: 'doble prob. de equipo y polvo', drop: 2 },   // sábado
  ];
  const eventoDia = d => EVENTOS[d];
  function eventoHoy() { return eventoDia(ahoraJuego().getDay()); }
