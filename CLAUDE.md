# Batalla

## Pruebas en navegador
- Las pruebas en el navegador las hace el usuario. No abrir el navegador para verificar cambios normales.
- Solo probar en el navegador cuando el cambio sea muy fuerte (motor de batalla, reescrituras grandes, cambios que puedan romper la carga del juego), para optimizar tiempo y uso.

## Web y Android
- Todo el desarrollo debe funcionar igual en web y en la app Android (`C:\PROYECTOS\BATALLA-MOBILE`). Pensar siempre en ambos lados.
- No usar diálogos nativos del navegador (`alert`, `confirm`, `prompt`): en Android no funcionan igual. Usar el diálogo propio del juego (`confirmar()` en `index.html`) o avisos (`avisar()`).
- Evitar lo que solo existe en escritorio: hover como única forma de ver algo, atajos de teclado obligatorios, clic derecho, `window.open`, descargas de archivos. Todo debe poder hacerse con toques.

## Textos del juego
- Mensajes, avisos y botones: cortos y sin redundancia. No repetir en varios sitios lo que ya se dijo una vez (ni en botón, ni en aviso previo, ni en el resultado).

## Sprites
- Para dividir hojas de sprites usar solo `tools/split_sheet.py`; para unir frames en una hoja, `tools/build_sheet.py`. No usar otras herramientas ni reescalar o interpolar.
- Guardar la hoja fuente en `tools/hojas/` y los frames en `img/<personaje>/`.
