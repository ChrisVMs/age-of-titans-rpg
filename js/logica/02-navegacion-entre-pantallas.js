  // ---------------- Navegación entre pantallas ----------------
  // Desbloqueo por nivel: el juego se abre poco a poco ("¡Arena desbloqueada!") en vez de enseñar todo de golpe.
  // Claves: pantallas (data-ir) y partes de pantalla. Quien ya pasó el nivel (o ascendió) lo tiene abierto (también en pruebas).
  const DESBLOQUEOS = {
    pHerreria: [3, 'Herrería'], pMascota: [5, 'Mascotas'], mascota: [5, 'Mascotas'], pArbol: [8, 'Habilidades'], pTorre: [10, 'Torre'],
    refinar: [12, 'Refinar y pulir'], pArena: [15, 'Arena'], pRunas: [18, 'Runas y reliquias'], expedicion: [18, 'Expediciones'],
    skins: [20, 'Skins'], titulos: [20, 'Títulos'], pColeccion: [20, 'Colección'], pCalabozo: [25, 'Calabozo multijugador'],
    pEvento: [30, 'Jefes mundiales'], pReyes: [35, 'Torre de reyes'], aura: [40, 'Aura'], evSemana: [10, 'Evento semanal'], pGrieta: [25, 'Grieta'],
  };
  const nivelDesbloqueo = id => (DESBLOQUEOS[id] || [0])[0];
  const desbloqueado = id => !DESBLOQUEOS[id] || jugador.nivel >= DESBLOQUEOS[id][0] || (jugador.ascension || 0) > 0;
  const avisoBloqueo = id => ui.avisar(`🔒 ${DESBLOQUEOS[id][1]}: se desbloquea en el nivel ${DESBLOQUEOS[id][0]}`);
  // Mensaje que solo se cierra con OK (mismo diálogo que confirmar, sin botón de cancelar). Se encadenan si llegan varios.
  let colaMensaje = Promise.resolve();
