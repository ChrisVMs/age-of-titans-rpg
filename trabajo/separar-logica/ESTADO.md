# Separar la lógica del juego de la pantalla

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-28

## Objetivo
Que las reglas del juego (combate, economía, progresión) sean código que corre sin navegador: las pruebas, el simulador y
un bot futuro las usan directamente con Node, rápido, en paralelo y función por función. Fácil de probar, escalable y
mantenible. La pantalla solo dibuja y llama a esa lógica. Prioridad del usuario: la web, pensada para móvil (será app).

## Próximo paso
**Etapa 4: separar las funciones mixtas** de `js/pantalla/` que también tienen reglas (sobre todo `mostrarResultado`,
`iniciarCampana`, `salirBatalla`, `barrido`... y lo que el simulador llama), para que la lógica no llame a nada de
pantalla. Hecho cuando `pruebas/cargar.js` pueda cargar solo `js/logica/` (sin `js/pantalla/`) y correr los escenarios y
`simularProgresion`.

## Plan
1. ✅ El código del juego sale de `index.html` a `js/juego.js` (sin cambiar nada).
2. ✅ Cargador de Node con el navegador simulado al mínimo; correr los escenarios y `simular` sin Chromium.
3. ✅ Separar por sistemas en `js/logica/` (datos y reglas, sin pantalla) y `js/pantalla/` (dibujar y botones). Cada sistema
   en su paso, con la equivalencia exacta con semilla en verde.
4. Separar las funciones mixtas (por ejemplo `mostrarResultado`: cobra y además pinta) en una parte de lógica y otra de
   pantalla, para que el simulador no necesite nada del navegador.
5. El simulador de progresión, el de batallas y los escenarios pasan a `pruebas/` y corren con Node, en paralelo
   (`worker_threads`). El navegador solo para la prueba en pantalla.

## Última sesión
**2026-10-28 · Claude**
- Etapa 3: el juego quedó en `js/logica/` (46 archivos, uno por sistema: mascotas, runas, motor del combate, Torre...) y
  `js/pantalla/` (31). `index.html` los carga en el orden de `js/orden.json` (primero toda la lógica); el cargador de Node
  lee esa misma lista. Se hizo con un analizador (acorn): cada instrucción de primer nivel va a pantalla si toca la página
  directamente (`$`, `document`, `innerHTML`, `classList`...) y a lógica si no; algunos casos mixtos, a mano (ver
  **Decisiones**). 18 instrucciones de lógica que pintaban al cargar pasaron a pantalla, y una que usaba una función de un
  archivo posterior se movió a ese archivo (`clickSala`).
- Verificación: 234 batallas idénticas con semilla, 14/14 escenarios (Node y navegador), una batalla de cada modo en
  pantalla y las 19 pantallas con sus pestañas sin errores (`herramientas/navegar.js` en el tema del motor).
- Commit en `qa` (ver `git log`).
- Quedó a medias: nada. Las funciones mixtas siguen en pantalla (etapa 4).

## Decisiones
- 2026-10-28 · Mixtos que quedaron en lógica: `HAB_TODAS` y `animDe` (datos de habilidades con su animación dentro),
  `armarDuelo` y `siguienteEnemigo` (motor; solo apuntan a la casilla donde se dibuja). A pantalla: `montarGuerrero`,
  `montarHabilidades`, `dibujarGolpe`, `animEnemigo`, `pantallaActual`, `aplicarEquipo` (solo repinta).
- 2026-10-28 · Archivos `.js` aparte: la app móvil será una copia de html, css y js para un empaquetador (lo dijo el
  usuario). Por etapas, verificando cada una.

## Cómo verificar
- `node pruebas/escenarios.js`: los escenarios del combate, sin navegador (sale con error si alguno falla).
- `node pruebas/progresion.js [configuraciones.json]`: partidas simuladas en paralelo (ver el comentario del archivo).
- Equivalencia exacta con semilla, escenarios y pantalla: ver `trabajo/refactor-motor-combate/ESTADO.md` → "Cómo verificar".

## Cuidado con
- Los `<script>` clásicos comparten las variables globales: al separar en varios archivos, el orden de carga importa.
  Una función se "eleva" solo dentro de su archivo: una instrucción que se ejecuta al cargar no puede usar una función de
  un archivo posterior.
- Reglas del proyecto en `CLAUDE.md`: web y Android por igual; el navegador solo para cambios fuertes.

## Mapa del código
- `js/logica/NN-sistema.js`: reglas y datos de cada sistema, sin tocar la página al cargar (algunas funciones aún llaman a
  funciones de pantalla al ejecutarse: etapa 4).
- `js/pantalla/NN-sistema.js`: dibujar, animar y botones del sistema.
- `js/orden.json`: orden de carga (el de `index.html`). Un archivo nuevo se añade en los dos sitios.
- `pruebas/cargar.js`: carga el juego en Node (`correr(código)`); `pruebas/escenarios.js`, `pruebas/progresion.js`.

## Bitácora
