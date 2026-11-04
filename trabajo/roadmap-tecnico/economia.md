# Auditoría de economía (2026-11-04)

Medido con `node pruebas/economia.js --detalle` (180 días, semillas 1 y 2, tipos casual / constante / pago; fecha de
pruebas fija). Cada cambio de un recurso se anota con la función del juego que lo hizo. Las cifras son promedios.

## Respuestas a la revisión
| Recurso | Pregunta | Respuesta medida |
|---|---|---|
| Oro | ¿Entra más de lo que sale? | Hasta el día 60, equilibrado (saldo <5 % de lo que entra). Desde el 61, constante y pago **acumulan**: +26-36 M en los días 61-90 y +160-177 M en los 91-180 (llegan a Nv 80 hacia el día 90 y se acaba en qué gastar). El casual sigue equilibrado. |
| Cristales | ¿Cuántos consigue un jugador gratis? | 25-40 por semana (misiones 65-70 %, capítulos 18-21 %, hitos 7-8 %). Una recarga cuesta 50: menos de 1 por semana. El simulador **no gasta cristales** (las recargas se simulan con `estaminaExtra`). |
| Materiales | ¿Alguno bloquea la progresión? | Ninguno bloquea. Al revés: **piedra** sobra 4-8 veces lo que se gasta (el encantamiento tiene tope) y el **polvo** deja de gastarse desde el día 8 (refinar cuesta 1 de polvo y entran ~3 000 por día; las runas se llenan pronto). **Almas**: todo lo que entra (desguace) se gasta en encantar: es el recurso que de verdad limita el encantamiento. |
| Esencia | | Equilibrada hasta el día 90 (aura y despertar). En los días 91-180 sobra (constante +2 000, pago +2 800): aura y despertar al máximo. |
| Estamina | ¿Permite jugar sin trivializar? | Se gasta toda, cada día, en todos los tipos (el 72-95 % en barrido). Es el límite real del ritmo, que es lo correcto. |
| Fuentes | | El **barrido** da el 85-92 % del oro y el 74-79 % de piedra y polvo: es el bucle principal (paga lo mismo que ganar la batalla). No es un fallo por sí solo, pero cualquier cambio de balance de oro pasa por él. |
| Gasto de oro | | Cofres 71-79 %, Ruinas 12-22 %, encantar 7-8 %. Los cofres son el único sumidero que escala. |

## Propuestas (decide el usuario)
1. **Polvo:** subir `COSTE_REFINAR.polvo` (1 → 10-20) o hacer que refinar busque ★5 y no solo ★4; si no, el polvo no vale nada.
2. **Piedra:** un sumidero tardío (p. ej. encantar más allá de +20 con almas y piedra, o un intercambio piedra → almas).
3. **Oro tras el Nv 80:** un sumidero de final (mejoras de prestigio, cosméticos, más niveles de Ruinas) o bajar el oro del
   barrido en las etapas que ya se superan con mucho margen.
4. **Simulador:** que el jugador de pago (y el constante) gaste cristales en recargas y cambio de oro, para medir su valor real.
