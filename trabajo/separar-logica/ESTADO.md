# Separar la lógica del juego de la pantalla

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-28

## Objetivo
Que las reglas del juego (combate, economía, progresión) sean código que corre sin navegador: las pruebas, el simulador y
un bot futuro las usan directamente con Node, rápido, en paralelo y función por función. Fácil de probar, escalable y
mantenible. La pantalla solo dibuja y llama a esa lógica. Prioridad del usuario: la web, pensada para móvil (será app).

## Próximo paso
**Etapa 2: cargador de Node** (`pruebas/cargar.js`): carga `js/juego.js` en un contexto de Node con lo mínimo del
navegador simulado y lista qué partes tocan la pantalla al cargar. Eso da el inventario para la etapa 3. Hecho cuando
`node pruebas/escenarios.js` corre los 14 escenarios sin navegador.

## Plan
1. ✅ El código del juego sale de `index.html` a `js/juego.js` (sin cambiar nada).
2. Cargador de Node con el navegador simulado al mínimo; correr los escenarios y `simular` sin Chromium.
3. Separar por sistemas en `js/logica/` (datos y reglas, sin pantalla) y `js/pantalla/` (dibujar y botones). Cada sistema
   en su paso, con la equivalencia exacta con semilla en verde.
4. Separar las funciones mixtas (por ejemplo `mostrarResultado`: cobra y además pinta) en una parte de lógica y otra de
   pantalla, para que el simulador no necesite nada del navegador.
5. El simulador de progresión, el de batallas y los escenarios pasan a `pruebas/` y corren con Node, en paralelo
   (`worker_threads`). El navegador solo para la prueba en pantalla.

## Última sesión
**2026-10-28 · Claude**
- `index.html`: el código del juego pasó entero a `js/juego.js` (se carga con `<script src>`); `index.html` queda con el
  HTML y el CSS.
- Verificación: 234 batallas idénticas con semilla frente al commit anterior, 14/14 escenarios, una batalla de cada modo
  en pantalla sin errores.
- Commit en `qa` (ver `git log`).
- Quedó a medias: nada.

## Decisiones
- 2026-10-28 · Archivos `.js` aparte: la app móvil será una copia de html, css y js para un empaquetador (lo dijo el
  usuario). Por etapas, verificando cada una.

## Cómo verificar
- Equivalencia exacta con semilla, escenarios y pantalla: ver `trabajo/refactor-motor-combate/ESTADO.md` → "Cómo verificar".

## Cuidado con
- Los `<script>` clásicos comparten las variables globales: al separar en varios archivos, el orden de carga importa.
- Reglas del proyecto en `CLAUDE.md`: web y Android por igual; el navegador solo para cambios fuertes.

## Bitácora
