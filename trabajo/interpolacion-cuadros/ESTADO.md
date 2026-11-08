# Cuadros intermedios con IA (RIFE)

**Estado:** en curso · **Rama:** main · **Actualizado:** 2026-11-07

## Objetivo
Quitar los saltos bruscos entre cuadros de los sprites sin cambiar su arte: generar cuadros intermedios entre cada par
de cuadros con IA (RIFE). Alternativa al esqueleto 2D (`trabajo/esqueleto-2d/`), que nunca iguala los cuadros exactos.

## Próximo paso
Que el usuario revise en `prototipos/interpolar/index.html` puñalada, paso sombrío, danza, golpe y derrota. Si convencen:
añadir sus nombres a `SECUENCIAS` de `tools/intermedios_asesino.py`, correrlo y envolver cada secuencia de `ANIM_ASESINO`
(`18-habilidades.js`) con `intercalar(..., '<nombre>', spriteClase('asesino'))`, como el ataque; lo mismo en `animaciones.html`.

## Cómo retomar desde cero (otro agente)
- Proyecto: `C:\PROYECTOS\AGE-OF-TITANS\age-of-titans-rpg`, rama `main`. Nada de esto tiene commit.
- RIFE: `tools/rife/rife-ncnn-vulkan-20221029-windows/rife-ncnn-vulkan.exe` (+ `rife-v4.6/`), ignorado por git. Si falta,
  bajar `rife-ncnn-vulkan-20221029-windows.zip` de GitHub `nihui/rife-ncnn-vulkan` (pedir permiso al usuario: 431 MB) y
  dejar solo el `.exe`, `vcomp140.dll` y `rife-v4.6/`. El usuario ya dio permiso para ejecutarlo (2026-11-07).
- Generar: `python prototipos/interpolar/interpolar.py 2 [ataque|reposo]` (desde la raíz; la cifra = intermedios por par; sin nombre, todas). Tarda ~1 min por secuencia.
- Ver: servidor «juego» de `.claude/launch.json` (`python -m http.server 8123`) →
  `http://localhost:8123/prototipos/interpolar/index.html`, o abrir el archivo directamente.
- Para revisar sin el navegador: hacer una hoja de contactos con PIL de `prototipos/interpolar/salida/ataque/*.png`
  (`NN_0` = cuadro original, `NN_1..` = intermedios).

## Última sesión
**2026-11-07 · Claude (todas en el juego)**
- Puñalada, paso, danza, golpe y derrota en el juego con `intercalar` (casillas 144-248); `animaciones.html` igual;
  `VERSION_IMG` 22. Verificación: todo idéntico. Ojo: la tira pasa a 80 925 px de ancho (13 MB, ~115 MB en memoria):
  probar en Android; si falla, partir la tira en dos imágenes.

**2026-11-07 · Claude (verificación)**
- `tools/verificar_intermedios.py` (nuevo): casillas y tiempos de las 7 secuencias iguales al juego; cuadros originales y
  casillas 109-143 idénticos píxel a píxel. Corregido: la puñalada termina en el reposo 200 ms (el prototipo ponía 600).

**2026-11-07 · Claude (resto de animaciones y campamento)**
- `interpolar.py`: secuencias puñalada, paso, danza, golpe y derrota (las del juego, con la vuelta al reposo para verlas);
  un par con el mismo cuadro no lleva intermedios. Generadas: 13 / 26 / 28 / 33 / 80 cuadros. Revisadas en hoja de
  contactos: sin manchas visibles. Aún no están en el juego.
- `12-vista-del-guerrero.js`: `reposoVistas()` anima el reposo (con intermedios) en el campamento y la vitrina.

**2026-11-07 · Claude (en el juego)**
- `tools/intermedios_asesino.py` (nuevo): añade los intermedios de `prototipos/interpolar/salida/` a `img/asesino/tira.png`
  como casillas 109-143 (35 cuadros, solo copia píxeles con `build_sheet.py`; las 0-108 quedan idénticas) y escribe
  `js/pantalla/12a-asesino-intermedios.js`. `tools/tira_asesino.py` lo llama al final.
- `intercalar()` en `12-vista-del-guerrero.js`: el reposo y el ataque del asesino usan los intermedios (escala .84); las
  skins, con tiras de 109 casillas, siguen igual. `animaciones.html` con los mismos tiempos. `VERSION_IMG` 21.
- Pruebas: escenarios y sin-pantalla bien; en sistemas falla «Clases: cadena…», que ya fallaba en `main` sin estos cambios.
- Commit a8ba5be en `main` (subido).

**2026-11-07 · Claude (reposo)**
- `interpolar.py` · secuencia `reposo` (ida y vuelta 70-75-79), `EN_BUCLE` (el último cuadro se interpola hacia el
  primero), `SIN_EFECTOS` (en el reposo lo azul claro son las dagas: se interpolan, no se funden), caché de pares repetidos
  al revés (`hechos`) y argumento para rehacer solo una secuencia (`interpolar.py 2 reposo`).
- `index.html` · botones Reposo / Ataque; imágenes con `?v=` contra la caché.
- Revisado en hoja de contactos: 24 intermedios, coincidencia de siluetas 81-92 %, sin manchas. Sin commit.

**2026-11-07 · Claude (afinado 2)**
- `interpolar.py` · `A_MANO = {(11, 12): 1, (16, 17): 0}` (rastro de la daga de atrás); en `separar`: encima va solo el
  efecto sin el margen ensanchado (`solo`), el relleno toma color solo del traje oscuro y el cierre del cuerpo pasa de 31
  a 71 px (el destello dejaba un hueco claro en el pecho). Probado y descartado: meter el halo del destello en el efecto
  (se llevaba la piel de la cara: cara doble).
- Revisado ampliado: sin contorno negro, sin parche en el pecho, cara normal. Sin commit.

**2026-11-07 · Claude (afinado tras la revisión del usuario)**
- Usuario: «se ve bien», pero marcó 5 cuadros: tajo con contorno negro, efectos deformados, dagas emborronadas en saltos
  grandes, puño levantado manchado.
- `interpolar.py` · `separar`/`fundir`: en pares con efectos (y hojas de daga, mismo azul claro) se quita el efecto, se
  rellena el cuerpo que tapaba, se interpola solo el personaje y el efecto se funde encima (sin contorno negro; la daga
  que salta de sitio se funde en vez de emborronarse). `intermedios`: 2 si la silueta coincide ≥ 62 %, 1 si 50-62 %,
  0 si menos; `A_MANO = {(16, 17): 0}` (el puño se manchaba).
- `index.html` · botón Pausa (antes «Paso a paso»).
- Revisado en hoja de contactos. Sin commit.

**2026-11-07 · Claude (primera prueba)**
**2026-11-07 · Claude**
- `tools/rife/` · `rife-ncnn-vulkan` 20221029 (GitHub `nihui/rife-ncnn-vulkan`), solo el `.exe`, `vcomp140.dll` y el modelo
  `rife-v4.6`; en `.gitignore` (431 MB el zip original, borrado). Corre en la GPU (MX450, Vulkan). El usuario dio permiso
  para ejecutarlo.
- `prototipos/interpolar/interpolar.py` (nuevo) · casillas del ataque del asesino colocadas como en el juego (escala por
  casilla, pies abajo) → N intermedios por par. Color premultiplicado e interpolado aparte del alfa → sin bordes sucios.
  Escribe `salida/ataque/*.png`, `salida/ataque.json`, `datos.js`. 2 intermedios: 18 cuadros nuevos en 52 s.
- `prototipos/interpolar/index.html` (nuevo) · visor lado a lado con el mismo tiempo total; botones Pausa (congela ambos), Siguiente (un cuadro) y Velocidad.
- Revisado en hoja de contactos: el cuerpo y la capa quedan fluidos y fieles. Fallan los saltos grandes: la daga que
  cambia de mano/posición de golpe se ve como un borrón; el tajo y el destello se deforman y dejan un contorno oscuro.

## Decisiones
- 2026-11-07 · Usuario: probar la opción 1 (interpolar cuadros) para que se vea exactamente como los cuadros sin saltos.
- 2026-11-07 · RIFE ncnn-vulkan (ejecutable, sin PyTorch) por funcionar en la GPU del equipo sin instalar varios GB.

## Pendiente
- Ajustar dónde interpolar (pares con salto grande: mejor sin intermedios o con 1).
- Los efectos (tajo, destello) quizá deban quitarse antes de interpolar y volver a ponerse encima.
- Llevarlo al juego: hojas con más cuadros y tiempos nuevos en `SPRITE`/habilidades; probar web y Android.

## Cómo verificar
`python prototipos/interpolar/interpolar.py 2` y abrir `prototipos/interpolar/index.html` (servidor «juego» de
`.claude/launch.json` o como archivo).

## Cuidado con
- RIFE trabaja en RGB: por eso color y alfa van por separado (`partes`/`juntar`).
- Las casillas tienen escalas distintas en el juego (`esc`): se interpolan ya escaladas como se ven.

## Bitácora
- 2026-11-07 · Claude · integrado en el juego (reposo y ataque del asesino), rama asesino-intermedios.
- 2026-11-07 · Claude · primera prueba con el ataque del asesino.
