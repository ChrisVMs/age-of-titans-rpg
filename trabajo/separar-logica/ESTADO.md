# Separar la lógica del juego de la pantalla

**Estado:** finalizado · **Rama:** `qa` · **Actualizado:** 2026-10-28

## Objetivo
Que las reglas del juego (combate, economía, progresión) sean código que corre sin navegador: las pruebas, el simulador y
un bot futuro las usan directamente con Node, rápido, en paralelo y función por función. Fácil de probar, escalable y
mantenible. La pantalla solo dibuja y llama a esa lógica. Prioridad del usuario: la web, pensada para móvil (será app).

## Próximo paso
Nada pendiente.

## Plan
1. ✅ El código del juego sale de `index.html` a `js/juego.js` (sin cambiar nada).
2. ✅ Cargador de Node con el navegador simulado al mínimo; correr los escenarios y `simular` sin Chromium.
3. ✅ Separar por sistemas en `js/logica/` (datos y reglas, sin pantalla) y `js/pantalla/` (dibujar y botones). Cada sistema
   en su paso, con la equivalencia exacta con semilla en verde.
4. ✅ Separar las funciones mixtas (por ejemplo `mostrarResultado`: cobra y además pinta) en una parte de lógica y otra de
   pantalla, para que el simulador no necesite nada del navegador.
5. ✅ El simulador de progresión, el de batallas y los escenarios pasan a `js/pruebas/` y corren con Node, en paralelo
   (`worker_threads`). El navegador solo para la prueba en pantalla.

## Última sesión
**2026-10-28 · Claude**
- Etapa 5: el bot, los simuladores y los escenarios (lógica y botones) pasaron a `js/pruebas/` (7 archivos). `index.html`
  los carga solo en modo pruebas; el juego publicado no los pide. `js/orden.json` tiene dos listas: `juego` y `pruebas`.
  El aviso de "Árbol reiniciado" (código del juego que estaba al final de los escenarios) pasó a `logica/43-lista.js`.
- Verificación: 14/14 escenarios (Node y navegador), `sin-pantalla.js` en verde, equivalencia con semilla (solo cambia la
  arena, por los rivales nuevos de la etapa 4), batallas en pantalla y 19 pantallas sin errores; en modo publicado no se
  pide ningún archivo de pruebas y no hay errores.
- Commit en `qa` (ver `git log`).

## Decisiones
- 2026-10-28 · Mixtos que quedaron en lógica: `HAB_TODAS` y `animDe` (datos de habilidades con su animación dentro),
  `armarDuelo` y `siguienteEnemigo` (motor; solo apuntan a la casilla donde se dibuja). A pantalla: `montarGuerrero`,
  `montarHabilidades`, `dibujarGolpe`, `animEnemigo`, `pantallaActual`, `aplicarEquipo` (solo repinta).
- 2026-10-28 · Archivos `.js` aparte: la app móvil será una copia de html, css y js para un empaquetador (lo dijo el
  usuario). Por etapas, verificando cada una.

## Cómo verificar
- `node pruebas/escenarios.js`: los escenarios del combate, sin navegador (sale con error si alguno falla).
- `node pruebas/progresion.js [configuraciones.json]`: partidas simuladas en paralelo (ver el comentario del archivo).
- `node pruebas/sin-pantalla.js`: la pantalla no cambia el juego.
- `pruebas/cargar.js` carga solo `js/logica/`; con `{ pantalla: true }`, también la pantalla (con el comodín).
- Equivalencia exacta con semilla, escenarios y pantalla: ver `trabajo/refactor-motor-combate/ESTADO.md` → "Cómo verificar".

## Cuidado con
- La lógica no debe llamar a funciones de pantalla: si necesita avisar, un `ui.algo` (vacío por defecto) que la pantalla
  registra. Y la pantalla no debe gastar `rnd()` ni cambiar el estado al pintar (`pruebas/sin-pantalla.js` lo vigila).
- Los `<script>` clásicos comparten las variables globales: al separar en varios archivos, el orden de carga importa.
  Una función se "eleva" solo dentro de su archivo: una instrucción que se ejecuta al cargar no puede usar una función de
  un archivo posterior.
- Reglas del proyecto en `CLAUDE.md`: web y Android por igual; el navegador solo para cambios fuertes.

## Mapa del código
- `js/logica/NN-sistema.js`: reglas y datos de cada sistema; no usan nada de la página. Avisan a la pantalla por `ui`.
- `js/pantalla/NN-sistema.js`: dibujar, animar y botones del sistema.
- `js/pruebas/`: bot, simuladores y escenarios (1-4 sin pantalla; 5-7, sus botones del menú 🧪). Solo en modo pruebas.
- `js/orden.json`: orden de carga (`juego` y `pruebas`), el de `index.html`. Un archivo nuevo se añade en los dos sitios.
- `pruebas/cargar.js`: carga el juego en Node (`correr(código)`); `pruebas/escenarios.js`, `pruebas/progresion.js`.

## Bitácora
- 2026-10-28 · Claude · Etapas 1-4: juego a `js/`, cargador de Node, lógica y pantalla por sistemas, lógica sin pantalla.
