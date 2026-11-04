# Tipos de jugador (simular jugadores reales)

**Estado:** pausado (espera: datos de jugadores reales para ajustar los tipos) · **Rama:** qa · **Actualizado:** 2026-11-03

## Objetivo
Que el simulador y los bots se parezcan a jugadores reales, no solo al "óptimo que juega todo cada día": perfiles
casual / constante / de pago, y más adelante decisiones de batalla y multijugador en el bot de pantalla.

## Próximo paso
Las 4 fases están hechas. Cuando haya datos de jugadores reales (o el usuario diga cómo juega la gente), ajustar los
números de `TIPOS_JUGADOR` (días que juega, gasto, recargas) y de los reintentos (`MEJORA_REINTENTO`, `DERROTA_AJUSTADA`).
Investigar por qué el De pago no supera al Constante (pasa con la regla vieja y con la nueva; muro en el piso 99-100 de la Torre). Antes: que el usuario pruebe el bot de pantalla
(🎭 tipo, habilidades con criterio, calabozo y reyes).

## Última sesión
**2026-11-04 · Claude (bot se paraba al perder)**
- Causa: tras perder, el bot de pantalla llama a `simMejorar`, que fallaba en una partida sin `jugador.mascotas` (la
  pantalla lo crea al abrir Mascotas) → "Bot: error" y se paraba. Arreglo: `simMejorar` crea `mascotas`, `runas` y
  `skinsPropias` si faltan. Prueba nueva en `pruebas/sistemas.js` (47/47).
- Verificado en el navegador (headless, tipo De pago, ataque al 60 % para forzar derrotas, 4,5 min a x10): sigue tras
  cada derrota; nunca pelea un nivel de campaña ya superado (69 Auto). Los calabozos de grupo no tienen Auto.

**2026-11-03 · Claude (reintentos)**
- Pedido del usuario: repetir una batalla perdida sin mejorar es absurdo y gasta estamina.
- `js/pruebas/3-simulador-de-progresion.js` · `MEJORA_REINTENTO` (.05), `REINTENTOS_GRATIS` (2), `DERROTA_AJUSTADA` (.3),
  `esGratis`, `puedeReintentar`, `vidaEnemigos`, `anotarDerrota`. Campaña (gasta estamina): si perdió por poco (a los
  enemigos les queda < 30 % de vida) reintenta hasta 2 veces; si lo aplastaron, mejora y solo vuelve con +5 % de poder.
  Lo demás (Torre, Grieta, Eco, y arena/calabozo/reyes, cuyas entradas se pierden al acabar el día): 2 veces al día.
  Jefes mundiales: siempre. Tras perder, el simulador mejora en el acto. Las derrotas siguen de un día a otro
  (`jugador.simFallos`). Se quita `reintentos` de los tipos.
- `js/pruebas/1-bot.js`, `5-bot-pantalla.js` · el bot de pantalla usa la misma regla y mejora tras perder.
- Verificación: 46/46 sistemas, 15/15 escenarios, igual con pantalla y sin ella.
- Medición (60 días, semillas 1-3, media): regla vieja → nueva: casual Nv 54 / 43 k → Nv 61 / 51 k; constante Nv 75 / 75 k
  → Nv 78 / 90 k; de pago Nv 73 / 77 k → Nv 75 / 79 k. Primer intento (bloquear todo reintento sin +5 % de poder)
  empeoraba: las batallas tienen mucho azar y una derrota ajustada se gana al reintentar.

**2026-11-03 · Claude (fase 4)**
- `js/pruebas/3-simulador-de-progresion.js` · `opcionCalabozoSim` y `opcionReyesSim` (antes dentro de `simularProgresion`,
  sin cambios de comportamiento).
- `js/pruebas/5-bot-pantalla.js` · `botSiguiente` juega calabozo y Torre de reyes (tras jefes, antes del Eco) con
  `iniciarCalabozo` / `iniciarReyes`; `botAliados`: los 2 bots del servidor de poder más parecido.
- Prueba nueva "Bot en grupo". Verificación: 45/45 sistemas, 15/15 escenarios, igual con pantalla y sin ella.
  Sin probar en el navegador.

**2026-11-03 · Claude (fase 3)**
- `js/pruebas/2-simulador-de-batallas.js` · `habCriterio` y `VIDA_REMATE`: contra un jefe la habilidad más fuerte lista;
  si viene un jefe más adelante (1 contra 1), guarda la más fuerte; no gasta habilidades rematando al último enemigo.
- `TIPOS_JUGADOR.habilidades`: casual 'auto', constante y de pago 'criterio'. Lo usan `simularProgresion` y el bot de
  pantalla (`botBatalla` juega cada ronda con `habCriterio` en vez del autoataque).
- Sin tipo, `simularProgresion` sigue con el autoataque (mediciones de balance sin cambios).
- Prueba nueva en `pruebas/sistemas.js`. Verificación: 44/44 sistemas, 15/15 escenarios, igual con pantalla y sin ella.
- Medición (60 días, constante): semilla 1 auto Nv 79 / piso 129 / Pesadillas días 21-33-39 → criterio Nv 80 (día 59) /
  piso 137 / días 18-22-30; semilla 2 piso 95 → 99, Nv 69 → 71.

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
- 2026-11-03 · Tras perder en campaña: reintentar solo si fue ajustada o con +5 % de poder; las entradas diarias y lo gratis, 2 veces al día · usuario (no repetir por repetir) + medición.
- 2026-11-03 · Un solo catálogo de tipos para simulador y bots del servidor · propuesta aceptada por el usuario.
- 2026-11-03 · Sin tipo = comportamiento anterior (autoataque), para no mover las mediciones de balance ya hechas · Claude.

## Hecho
- Fase 1: tipos en el simulador y en los bots del servidor · 232b4bc · sistemas + medición.
- Fase 2: tipo de jugador en el bot de pantalla · f3306af · sistemas, sin-pantalla.
- Fase 3: habilidades con criterio · 64bbd84 · sistemas + medición.
- Fase 4: bot de pantalla en calabozo y Torre de reyes · commit en qa · sistemas.

## Pendiente
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
- 2026-11-04 · Claude · Arreglo: el bot de pantalla se paraba al perder.
- 2026-11-03 · Claude · Reintentos: solo tras derrota ajustada o con más poder.
- 2026-11-03 · Claude · Fase 4: calabozo y reyes en el bot de pantalla.
- 2026-11-03 · Claude · Fase 3: habilidades con criterio.
- 2026-11-03 · Claude · Fase 2: bot de pantalla con tipo.
- 2026-11-03 · Claude · Tema creado; fase 1 (tipos en simulador y bots del servidor).
