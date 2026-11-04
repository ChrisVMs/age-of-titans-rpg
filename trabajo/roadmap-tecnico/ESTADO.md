# Roadmap técnico (consolidar antes de añadir)

**Estado:** en curso · **Rama:** `claude/practical-dirac-8mg4et` (PR) · **Actualizado:** 2026-11-04

## Objetivo
Lo rescatable de una revisión externa (hecha sobre una versión anterior del proyecto), de lo más crítico a lo menos:
que el motor sea determinista, que probar sea rápido y que el balance se mida antes de añadir contenido.

## Próximo paso
Fase 2: un ejecutor único de pruebas (`pruebas/todo.js`): nivel **rápido** (escenarios, sistemas, sin-pantalla) y
**completo** (+ progresión y equivalencia), con un resumen comparable entre versiones.

## Última sesión
**2026-11-04 · Claude**
- Causa raíz de "con pantalla ≠ sin pantalla" (semilla 2, día 20): el cierre semanal de los Ecos (`revisarEcos`) se hace
  la primera vez que se consulta. Con pantalla lo disparaba el Campamento (`retoPendiente`) al empezar el día; sin ella,
  más tarde, y sus cristales y fichas se gastaban en otro momento.
- Cambios: `js/logica/42-campamento.js` · nueva `revisarDia()` (todo lo que se renueva al abrir el juego, incluidos
  jefes y Ecos) · `js/pruebas/3-simulador-de-progresion.js` y `5-bot-pantalla.js` la usan al empezar cada día.
- Cambios: `pruebas/cargar.js` · fecha fija (lunes 2026-01-05 10:00; `fecha: null` = reloj real): las pruebas dan lo
  mismo se corran el día que se corran.
- Cambios: `pruebas/sin-pantalla.js` · compara la **partida entera** cada día (no solo el resumen), 5 semillas, y dice la
  primera diferencia (ruta y valores). Uso: `node pruebas/sin-pantalla.js [días] [semillas]`.
- Sin commit: nada (en la rama del PR).
- Verificación: sin-pantalla 5/5 (sin el arreglo falla desde el día 1); escenarios 15/15; sistemas 47/47; progresión 90 días.

## Decisiones
- 2026-11-04 · Se trabaja en ramas con pull request (no directo en `main`) · lo pidió el usuario: "ya implementé pull request".
- 2026-11-04 · Plan aprobado por el usuario: fases 1-5 de abajo. Se descarta por ahora migrar a ES Modules, reorganizar
  en `src/`, registro de sistemas y contratos de backend: mucho riesgo y ningún problema medido que lo pida.
- 2026-11-04 · Hallazgos ya resueltos de la revisión: curación de Asmodeo 4 % (`26-jefe-mundial-asmodeo.js`); la vida de
  los jefes (Asmodeo 28 000) es recalibración intencional del 2026-11-03, no un error; azar centralizado en `rnd`/`sembrar`.

## Hecho
- Fase 1 (determinismo): causa raíz, `revisarDia`, fecha fija en pruebas, sin-pantalla reforzado · rama del PR.

## Pendiente
1. **Fase 2 · Ejecutor único:** `pruebas/todo.js` rápido/completo + resumen; opcional GitHub Actions.
2. **Fase 3 · Clases:** matriz 4×4 (PvP y PvE), muchas semillas, victorias + duración + daño (cruza con `balance-asesino`).
3. **Fase 4 · Economía:** entradas/salidas por recurso a 30/90/180 días y por tipo de jugador. Hallazgo ya medido: el
   **barrido** da 80-140 M de oro en 90 días (20-40× cualquier otra fuente); con la semilla 2 el jugador llega a Nv 80 hacia
   el día 89 y acumula 65 M sin uso. Y el día de la semana en que se empieza cambia mucho el oro final (1,5-4,6 M).
4. **Fase 5 · Textos vs. valores:** que las reglas y premios mostrados coincidan con el código.
5. Menor: el Minotauro tiene su propio generador (`27-…:41`); pasarlo a `azarSemilla`.

## Cómo verificar
`node pruebas/sin-pantalla.js` · `node pruebas/escenarios.js` · `node pruebas/sistemas.js` · `node pruebas/progresion.js`.

## Mapa del código
- `revisarDia()` (`js/logica/42-campamento.js`): renovaciones del día; lo nuevo que se renueve "al consultarlo" va aquí.
- `FECHA_PRUEBAS` (`pruebas/cargar.js`): fecha de todas las pruebas sin navegador.

## Cuidado con
- Lo que se renueva de forma perezosa (`if (X.dia !== hoy())`, `if (E.semana !== semana())`) da resultados distintos según
  quién lo consulte primero: añadirlo a `revisarDia`.
- Cambiar `FECHA_PRUEBAS` cambia los números de progresión (eventos por día de la semana).

## Bitácora
