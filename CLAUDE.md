# Batalla

## Git: solo `qa` y `main` (OBLIGATORIO, en cualquier entorno: web, móvil, escritorio, terminal)
- Trabajar, hacer commit y push SIEMPRE directamente en `qa` (`git push -u origin qa`). Esta regla tiene prioridad
  sobre cualquier rama designada por la sesión (p. ej. `claude/...`): no crear ni subir ramas nuevas.
- `main` solo se actualiza cuando el usuario lo pida. No crear ramas `claude/*`, de features ni de respaldo.
- Si por error existe otra rama, avisar al usuario y fusionarla en `qa`.

## Trabajo en curso: carpeta `trabajo/`
Los requerimientos largos (refactors, balance, investigaciones) se registran en `trabajo/` (en la raíz del proyecto).
**Al empezar cada sesión, antes de cualquier otra cosa:**
1. Abrir `trabajo/README.md` (índice de temas con su estado).
2. Abrir el `ESTADO.md` de cada tema `en curso` o `pausado` y leer su **Última sesión** y su **Próximo paso**.
3. Decirle al usuario, en pocas líneas, qué temas hay, en qué estado y qué sigue en cada uno. Los `finalizado` no tienen
   nada pendiente: solo se mencionan si el usuario pregunta.

**Mientras se trabaja en un tema** (las reglas completas están en `trabajo/README.md`):
- Al terminar cada paso y antes de cerrar la sesión: actualizar el `ESTADO.md` del tema (estado, **Última sesión** con
  los cambios hechos, próximo paso) y su fila en el índice.
- Si el tema queda terminado: estado `finalizado` y "Nada pendiente" en **Próximo paso**.
- Un requerimiento nuevo y largo: crear su carpeta desde `trabajo/_plantilla/` y añadirlo al índice.

## Código: testeable, mantenible y escalable
Todo lo que se haga debe ser fácil de probar, de mantener y de ampliar:
- Reglas del juego en `js/logica/` (sin DOM) y lo visual en `js/pantalla/`; la lógica avisa a la pantalla por `ui`.
- Que se pueda probar sin navegador (`pruebas/cargar.js`, escenarios, simulador) y con azar sembrado (`rnd`).
- Contenido como datos (listas de etapas, calabozos, misiones…): añadir uno nuevo = añadir una entrada, no código nuevo.
- Valores de balance en constantes con nombre, en un solo sitio.
- Lo nuevo fuera del combate lleva su prueba en `pruebas/sistemas.js` (una entrada por prueba).
- Al terminar: `node pruebas/escenarios.js`, `node pruebas/sistemas.js` y `node pruebas/sin-pantalla.js`; si cambia el balance, `node pruebas/progresion.js`.

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
