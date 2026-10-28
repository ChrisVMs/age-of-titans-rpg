# Separar la lógica del juego de la pantalla

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-28

## Objetivo
Que las reglas del juego (combate, economía, progresión) sean código que corre sin navegador: las pruebas, el simulador y
un bot futuro las usan directamente con Node, rápido, en paralelo y función por función. Fácil de probar, escalable y
mantenible. La pantalla solo dibuja y llama a esa lógica. Prioridad del usuario: la web, pensada para móvil (será app).

## Próximo paso
**Etapa 3: separar por sistemas** en `js/logica/` (sin pantalla) y `js/pantalla/`. Empezar por lo que más usa el motor:
estadísticas y efectos (equipo, mascotas, skins, árbol, runas, reliquias, maestría, colección, conjuntos, ascensión) y el
motor de combate. Cada paso: `node pruebas/escenarios.js` y la equivalencia exacta con semilla en verde. Hecho cuando
`pruebas/cargar.js` cargue solo `js/logica/` sin el comodín de `document`.

## Plan
1. ✅ El código del juego sale de `index.html` a `js/juego.js` (sin cambiar nada).
2. ✅ Cargador de Node con el navegador simulado al mínimo; correr los escenarios y `simular` sin Chromium.
3. Separar por sistemas en `js/logica/` (datos y reglas, sin pantalla) y `js/pantalla/` (dibujar y botones). Cada sistema
   en su paso, con la equivalencia exacta con semilla en verde.
4. Separar las funciones mixtas (por ejemplo `mostrarResultado`: cobra y además pinta) en una parte de lógica y otra de
   pantalla, para que el simulador no necesite nada del navegador.
5. El simulador de progresión, el de batallas y los escenarios pasan a `pruebas/` y corren con Node, en paralelo
   (`worker_threads`). El navegador solo para la prueba en pantalla.

## Última sesión
**2026-10-28 · Claude**
- Etapa 1: el código del juego pasó entero de `index.html` a `js/juego.js` (sin cambios). Equivalencia exacta con el commit
  anterior (234 batallas), 14/14 escenarios, pantalla sin errores.
- Etapa 2: `pruebas/cargar.js` carga el juego en Node; lo que pide del navegador lo recibe un "comodín" (acepta cualquier
  propiedad o llamada). `pruebas/escenarios.js`: los 14 escenarios en ~170 ms. `pruebas/progresion.js`: partidas en
  paralelo con `worker_threads` (3 × 90 días en 20 s; antes, más de 1 min cada una en Chromium).
- Verificación: las 234 batallas con semilla dan lo mismo en Node que en el navegador.
- Commit en `qa` (ver `git log`).
- Quedó a medias: nada.

## Decisiones
- 2026-10-28 · Archivos `.js` aparte: la app móvil será una copia de html, css y js para un empaquetador (lo dijo el
  usuario). Por etapas, verificando cada una.

## Cómo verificar
- `node pruebas/escenarios.js`: los escenarios del combate, sin navegador (sale con error si alguno falla).
- `node pruebas/progresion.js [configuraciones.json]`: partidas simuladas en paralelo (ver el comentario del archivo).
- Equivalencia exacta con semilla, escenarios y pantalla: ver `trabajo/refactor-motor-combate/ESTADO.md` → "Cómo verificar".

## Cuidado con
- Los `<script>` clásicos comparten las variables globales: al separar en varios archivos, el orden de carga importa.
- Reglas del proyecto en `CLAUDE.md`: web y Android por igual; el navegador solo para cambios fuertes.

## Mapa del código
- `js/juego.js`: todo el juego (lógica y pantalla, por ahora). `index.html`: HTML y CSS.
- `pruebas/cargar.js`: carga el juego en Node (`correr(código)`); `pruebas/escenarios.js`, `pruebas/progresion.js`.

## Bitácora
