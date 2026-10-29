  // ---------------- Batalla ----------------
   // misma confirmación que la flecha de la cabecera
  // avance rápido: x1 -> x1.5 -> x2.5 (se recuerda entre partidas); en modo pruebas también x5 (lo usa el bot)
  const VELOCIDADES = MODO_PRUEBAS ? [1, 1.5, 2.5, 5] : [1, 1.5, 2.5];
  // Escala el escenario para que quepa en cualquier pantalla (móvil vertical u horizontal)
  // En pantallas bajas los combatientes están más juntos (CSS: gap de .arena) para verse más grandes;
  // los avances de los ataques se acortan en lo mismo para que el golpe siga llegando al rival.
  const SEPARACION = 240;
  let recorteAvance = 0;
  const avanceReal = mov => Math.max(20, mov - recorteAvance);

  // La skin es una sola imagen: para que el ataque se lea, se inclina como el cuadro equivalente del guerrero
  const POSE_SKIN = { 1: 'rotate(-4deg) scale(1.02, .97)', 2: 'rotate(-10deg)', 3: 'rotate(4deg)', 4: 'rotate(12deg) translateX(12px)',
                      5: 'rotate(14deg) translateX(16px)', 6: 'rotate(6deg)', 7: 'rotate(2deg)', 12: 'rotate(-6deg)', 13: 'rotate(-14deg) translateY(-6px)' };

