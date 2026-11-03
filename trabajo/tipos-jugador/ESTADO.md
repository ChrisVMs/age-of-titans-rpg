# Tipos de jugador (simular jugadores reales)

**Estado:** en curso · **Rama:** qa · **Actualizado:** 2026-11-03

## Objetivo
Que el simulador y los bots se parezcan a jugadores reales, no solo al "óptimo que juega todo cada día": perfiles
casual / constante / de pago, y más adelante decisiones de batalla y multijugador en el bot de pantalla.

## Próximo paso
Fase 3: habilidades con criterio en el combate simulado (hoy `habLista` usa la primera lista). Dónde: la función que elige
habilidad en `jugarHastaFin` / autoataque; guardar la más fuerte para el jefe o el último enemigo. Hecho cuando el tipo
lo pueda activar y una prueba muestre que la reserva para el jefe.

## Última sesión
**2026-11-03 · Claude (fase 2)**
- `js/pruebas/1-bot.js` · `botTipo` (guardado en `batalla.botTipo`), `tipoBot`, `botReserva`, `botHayEstamina`, `botFijarReserva`.
- `js/pruebas/5-bot-pantalla.js` · el bot de pantalla respeta el tipo: reintentos, rival de arena, estamina sin gastar,
  anuncios y cristales solo si el tipo los usa, y salta los días que ese tipo no juega. Botón "🎭 Bot: <tipo>" en el menú 🧪.
- `TIPOS_JUGADOR` · campos `anuncios` y `cristales` (los usa el bot de pantalla).
- Verificación: 43/43 sistemas, 15/15 escenarios, igual con pantalla y sin ella. Falta que el usuario lo pruebe en pantalla.

**2026-11-03 · Claude**
- Cambios: `js/pruebas/3-simulador-de-progresion.js` · `TIPOS_JUGADOR` (casual, constante, pago) y `rivalArenaSim`;
  `simularProgresion({ tipo })`: días sin jugar (azar sembrado por día), reserva de estamina sin gastar (`gasto`),
  `reintentos`, rival de arena. Sin tipo se comporta igual que antes.
- `js/pruebas/4-servidor-bots.js` · `RITMOS_BOT` usa los tipos (casual→casual, normal→constante, intenso→pago);
  `VERSION_SERVIDOR` 3 en `8-servidor-bots-pantalla.js` (el servidor guardado se rehace).
- `js/pruebas/6-simuladores-pantalla.js` + `simulador-hilo.js` · elegir el tipo en "Simular progresión".
- `pruebas/progresion.js` · campo `tipo` en cada configuración.
- Prueba nueva en `pruebas/sistemas.js` (sin tipo = bot de siempre; casual se salta días y juega menos).
- Verificación: 43/43 sistemas, 15/15 escenarios, igual con pantalla y sin ella; medición de abajo.
- Quedó a medias: fases 2-4 (ver Pendiente).

## Decisiones
- 2026-11-03 · Un solo catálogo de tipos para simulador y bots del servidor · propuesta aceptada por el usuario.
- 2026-11-03 · 'constante' = comportamiento anterior, para no mover las mediciones de balance ya hechas · Claude.

## Hecho
- Fase 1: tipos en el simulador y en los bots del servidor · 232b4bc · sistemas + medición.
- Fase 2: tipo de jugador en el bot de pantalla · commit en qa · sistemas, sin-pantalla.

## Pendiente
- Fase 3: habilidades con criterio (guardar la fuerte para el jefe o el último enemigo) en vez de `habLista`.
- Fase 4: el bot de pantalla entra en calabozo y Torre de reyes (en modo pruebas los aliados son bots).
- Ajustar los números de cada tipo con datos reales cuando los haya.

## Medición (60 días, semilla 1, partida nueva, guerrero)
| Tipo | Nv final | Poder día 30 / 60 | Nv 50 | Piso Torre |
|---|---|---|---|---|
| Casual | 55 | 37 k / 43 k | día 32 | 83 |
| Constante | 79 | 69 k / 85 k | día 9 | 129 |
| De pago | 80 (día 51) | 91 k / 107 k | día 6 | 136 |

## Cómo verificar
- `node pruebas/sistemas.js` (prueba "Tipos de jugador").
- `node pruebas/progresion.js conf.json` con `"tipo": "casual"` / `"constante"` / `"pago"`.
- Menú 🧪 → Simular progresión → elegir tipo.

## Mapa del código
- `TIPOS_JUGADOR`, `rivalArenaSim`, `simularProgresion` en `js/pruebas/3-simulador-de-progresion.js`.
- `RITMOS_BOT`, `avanzarBot` en `js/pruebas/4-servidor-bots.js`.

## Cuidado con
- Los bots del servidor deciden si juegan con `juegaBot` (su propio `juega`); por eso a `simularProgresion` le pasan
  el tipo con `juega: 1`.
- Cambiar los tipos cambia los bots del servidor: subir `VERSION_SERVIDOR`.

## Bitácora
- 2026-11-03 · Claude · Fase 2: bot de pantalla con tipo.
- 2026-11-03 · Claude · Tema creado; fase 1 (tipos en simulador y bots del servidor).
