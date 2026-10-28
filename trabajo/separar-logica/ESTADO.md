# Separar la lógica del juego de la pantalla

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-28

## Objetivo
Que las reglas del juego (combate, economía, progresión) sean código que corre sin navegador: las pruebas, el simulador y
un bot futuro las usan directamente con Node, rápido, en paralelo y función por función. Fácil de probar, escalable y
mantenible. La pantalla solo dibuja y llama a esa lógica. Prioridad del usuario: la web, pensada para móvil (será app).

## Próximo paso
**Etapa 5: el simulador y las pruebas a `pruebas/`**: `simularProgresion`, `simular`, los escenarios y el bot de decisiones
(`botEquipar`, `botArbol`, `botCofres`, `sim*`) son herramientas de pruebas, no del juego: pasarlos de `js/logica/` a
`pruebas/` (el menú 🧪 del juego los cargaría solo en modo pruebas). Hecho cuando el juego publicado no cargue código de
pruebas y `node pruebas/*.js` siga en verde.

## Plan
1. ✅ El código del juego sale de `index.html` a `js/juego.js` (sin cambiar nada).
2. ✅ Cargador de Node con el navegador simulado al mínimo; correr los escenarios y `simular` sin Chromium.
3. ✅ Separar por sistemas en `js/logica/` (datos y reglas, sin pantalla) y `js/pantalla/` (dibujar y botones). Cada sistema
   en su paso, con la equivalencia exacta con semilla en verde.
4. ✅ Separar las funciones mixtas (por ejemplo `mostrarResultado`: cobra y además pinta) en una parte de lógica y otra de
   pantalla, para que el simulador no necesite nada del navegador.
5. El simulador de progresión, el de batallas y los escenarios pasan a `pruebas/` y corren con Node, en paralelo
   (`worker_threads`). El navegador solo para la prueba en pantalla.

## Última sesión
**2026-10-28 · Claude**
- Etapa 4: `js/logica/` carga sola, sin navegador ni comodín. Cambios:
  - `ui` (en `logica/01-inicio.js`): la lógica avisa a la pantalla por `ui.avisar`, `ui.pintarHud`, `ui.aplicarEquipo`...
    (vacías sin pantalla); cada archivo de `js/pantalla/` registra las suyas.
  - `cobrarResultado(gano)` (lógica: cobra y devuelve lo que se enseña) sale de `mostrarResultado` (pantalla: pinta).
  - A pantalla: `iniciarTorre`, `iniciarReyes`, `iniciarCalabozo`, `iniciarMundial`, `transformar`, `pintarRanking`,
    `ascender`, `htmlAscension`, `empezarSala`, `salirSala`, `repintarSala`, `modoPantalla`, los sonidos y el `resize`.
  - Habilidades: los datos dicen qué animación usan (`animacion: 'estocada'`); las animaciones, en `ANIM_HAB` (pantalla).
  - Las casillas del 1 contra 1 (`u.el`) las pone la pantalla (`iniciarCampana`, `mostrarEnemigo`).
  - `logicaLista` (`logica/47-lista.js`): la colección ya no espera a la pantalla para contar campañas y jefes.
- Dos fallos encontrados al comparar con y sin pantalla (la pantalla cambiaba el juego):
  - Pintar el Campamento generaba los rivales de arena con el azar del juego: ahora `generarRivales` tiene su propio
    azar (mismo día, puntos y victorias = mismos rivales). Arregla también el pendiente del tema del motor.
  - El simulador revisa al empezar el día lo que se renueva (arena, reyes, calabozo, misiones, jefes), como al abrir el
    juego, en vez de depender de cuándo se pintaba el Campamento.
- `pruebas/sin-pantalla.js`: la misma partida con pantalla y sin ella debe dar lo mismo.
- Verificación: 14/14 escenarios (Node y navegador); equivalencia exacta con semilla salvo la arena (rivales nuevos);
  batallas en pantalla y 19 pantallas sin errores; `sin-pantalla.js` en verde. Escenarios en 0,1 s; progresión
  3 × 90 días en ~15 s.
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
- `js/orden.json`: orden de carga (el de `index.html`). Un archivo nuevo se añade en los dos sitios.
- `pruebas/cargar.js`: carga el juego en Node (`correr(código)`); `pruebas/escenarios.js`, `pruebas/progresion.js`.

## Bitácora
