  // ---------------- Aura ----------------
  // Brillo bajo los pies del personaje, 10 niveles: cada nivel da +AURA_PCT % a todo (ataque, defensa, vida y armadura).
  // Se sube con Esencia (solo la da el contenido de nivel alto) y oro: es el progreso del tramo final, cuando el equipo,
  // las mascotas y las runas ya están al máximo. En la pantalla brilla más cuanto más nivel (fuerte desde el 5).
  const AURA_MAX = 10, AURA_PCT = 2;
  const nivelAura = (p = jugador) => p.aura || 0;
  const costeAura = n => ({ esencia: 30 * (n + 1), oro: 15000 * (n + 1) });   // 2026-11-03: con 10 se llenaba hacia el día 20-35   // de n a n + 1
  function subirAura() {
    const n = nivelAura();
    if (!desbloqueado('aura') || n >= AURA_MAX || !tieneCoste(costeAura(n))) return false;
    pagar(costeAura(n)); jugador.aura = n + 1; return true;
  }
  function statsAura() { const p = nivelAura() * AURA_PCT; return p ? { ataque: p, defensa: p, vida: p, armadura: p } : {}; }
