  // ---------------- Modo Titán: niveles y definitivas ----------------
  // Se desbloquea en el nivel del jugador DESBLOQUEOS.titan (Nv 1 gratis) y se sube hasta TITAN_MAX con Esencia y oro,
  // como el Aura. Cada nivel: más daño mientras está activo y golpe titánico más fuerte; carga más rápida (Nv 3),
  // habilidad definitiva de la clase (Nv 5), una ronda más (Nv 7) y definitiva más fuerte (Nv 10).
  // Lo tienen todos los jugadores (tú, aliados, reyes, rivales de arena) con el nivel de su partida. El combate: 29-motor-del-combate.js.
  const TITAN_MAX = 10;
  // extra: daño extra mientras está activo (0.8 = +80 %) · golpe: ×daño de un golpe normal · carga: % de barra por ronda
  // dura: rondas activo · definitiva: × de la definitiva (0 = aún no)
  const TITAN_NIVELES = [
    { extra: .8,  golpe: 5,   carga: 20, dura: 3, definitiva: 0 },     // 1
    { extra: .9,  golpe: 5.5, carga: 20, dura: 3, definitiva: 0 },     // 2
    { extra: 1,   golpe: 6,   carga: 25, dura: 3, definitiva: 0 },     // 3: carga más rápida
    { extra: 1.1, golpe: 6.5, carga: 25, dura: 3, definitiva: 0 },     // 4
    { extra: 1.2, golpe: 7,   carga: 25, dura: 3, definitiva: 1 },     // 5: habilidad definitiva
    { extra: 1.3, golpe: 7.5, carga: 25, dura: 3, definitiva: 1 },     // 6
    { extra: 1.4, golpe: 8,   carga: 25, dura: 4, definitiva: 1 },     // 7: una ronda más
    { extra: 1.5, golpe: 8.5, carga: 25, dura: 4, definitiva: 1 },     // 8
    { extra: 1.6, golpe: 9,   carga: 25, dura: 4, definitiva: 1 },     // 9
    { extra: 1.7, golpe: 10,  carga: 25, dura: 4, definitiva: 1.5 },   // 10: definitiva más fuerte
  ];
  // la definitiva de cada clase: una vez por activación, mientras el Titán está activo (mult: ×daño de un golpe normal)
  const DEFINITIVAS = {
    guerrero: { nombre: 'Ira del Titán',   icono: '🗡️', mult: 5 },                   // sin aturdir: con aturdimiento hundía a la maga (0,23)
    asesino:  { nombre: 'Ejecución',       icono: '🔪', mult: 5, ejecuta: .4 },      // ×2 si al rival le queda menos del 40 % de vida
    arquero:  { nombre: 'Lluvia titánica', icono: '🏹', mult: 4, perfora: .3 },     // ignora el 30 % de la armadura (×6 y 50 %: demasiado contra maga y asesino)
    mago:     { nombre: 'Cataclismo',      icono: '☄️', mult: 7, quema: 3 },         // quema 3 rondas
  };
  const costeTitan = n => ({ esencia: 40 * n, oro: 20000 * n });   // de n a n + 1
  // nivel de Titán de una partida: 0 si aún no lo desbloqueó; al desbloquearlo empieza en 1
  const nivelTitan = (p = jugador) => conPerfil(p, () => desbloqueado('titan')) ? Math.max(1, p.titanNv || 1) : 0;
  const datosTitan = n => TITAN_NIVELES[Math.min(TITAN_MAX, n) - 1];
  function subirTitan() {
    const n = nivelTitan();
    if (!n || n >= TITAN_MAX || !tieneCoste(costeTitan(n))) return false;
    pagar(costeTitan(n)); jugador.titanNv = n + 1; return true;
  }
