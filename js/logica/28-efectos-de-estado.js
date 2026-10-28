  // ---------------- Efectos de estado ----------------
  // Daño por turno (quemadura, veneno, sangrado) o pérdida del turno (congelación, aturdimiento).
  // Se resuelven al empezar el turno de quien los sufre. El daño por turno se fija al aplicarse:
  // si lo aplica un enemigo es un % de tu vida máxima; si lo aplicas tú, un % de tu ataque.
  const ESTADOS = {
    quemadura:    { icono: '🔥', nombre: 'Quemadura' },
    veneno:       { icono: '☠️', nombre: 'Veneno', acumula: 5 },   // se acumula hasta 5 veces
    sangrado:     { icono: '🩸', nombre: 'Sangrado' },
    congelacion:  { icono: '❄️', nombre: 'Congelación', control: true },
    aturdimiento: { icono: '💫', nombre: 'Aturdimiento', control: true },
  };
