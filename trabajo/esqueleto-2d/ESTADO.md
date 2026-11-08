# Animación por esqueleto 2D (MVP)

**Estado:** en curso · **prioridad alta** · **Rama:** main · **Actualizado:** 2026-11-07 · **Todo sin commit** (`prototipos/` entero está sin seguimiento en git)

## Objetivo
Animar personajes con piezas y huesos en lugar de hojas de 109 cuadros: movimiento fluido, sin saltos entre cuadros, y
una skin nueva = otro juego de piezas sobre el mismo esqueleto (sin una hoja de Gemini por animación).
El MVP es el Asesino base, en un visor aparte (`prototipos/esqueleto/index.html`), **fuera del juego** (no toca `js/`).

## Próximo paso
1. Que el usuario compare el ataque (pierna de atrás y rodillas) en `prototipos/esqueleto/index.html`.
2. Si lo aprueba: piezas de recambio para cambios de perspectiva (pie en punta de perfil, puño girado), más animaciones
   (golpe, derrota…) y decidir cómo entra al juego.

## Última sesión
**2026-11-07 · Claude**
- Documentación completa para retomar (este archivo) y fila del índice con prioridad alta.
- `modelo.py` · 4a: piernas y pies solo dentro de una cápsula de su hueso (antes se llevaban cuadros de tela de la capa
  que se movían con la rodilla: lo que marcó el usuario); el relleno del interior de la capa toma color solo de la tela.
- `index.html` · `MALLA`/`prepararMalla`/`dibujarMalla`: brazos, piernas y pies como malla (rejilla de 12 px); cerca de
  codo, rodilla y tobillo cada vértice se reparte entre los dos huesos (`pesoHijo`, radio en `RADIO`): la unión se curva.
- Verificado en el navegador, cuadro del ataque que marcó el usuario ampliado: sin trozos sueltos, rodilla continua. Sin commit.

## Cómo funciona (pipeline actual)
Todo en `prototipos/esqueleto/`. Orden para regenerar desde cero (desde la raíz del repo):

1. **Dibujo base** `tools/hojas/asesino_rig_base.jpg` (Gemini, cuenta `/u/1/`, chat «Assassin Character Rig Redraw»):
   el reposo del sprite (`asesino_reposo.png` = casilla 70 de `img/asesino/tira.png`) redibujado en pose neutra
   (brazos y piernas separados, puños vacíos, capa detrás, fondo verde). Prompt: ver «Bitácora» 2026-11-07.
2. `python prototipos/esqueleto/despiezar.py` · (viejo, solo hace falta por las **dagas**) corta la casilla 70 →
   `piezas/dagaD.png`, `piezas/dagaI.png` + `piezas.js`.
3. `python prototipos/esqueleto/rotoscopia.py` · poses viejas del ataque (`poses_ajustadas.json`) + efectos (tajo y
   destello de las casillas 14-16 → `efectos/`) → `poses.js`.
4. `python prototipos/esqueleto/modelo.py` · despieza el dibujo base → `modelo/*.png` + `modelo.js` (`MODELO`).
5. `python prototipos/esqueleto/poses_modelo.py` · pasa reposo y ataque al modelo nuevo → `poses_modelo.js` (`POSES`).
   Si existe `poses_modelo_ajustadas.json` (casillas 11-19), esas poses mandan en el ataque.
6. Reajuste a la silueta del sprite (opcional, en el navegador): abrir el visor, consola → `await ajustarTodo()`
   (`ajustar.js`), copiar el JSON devuelto a `poses_modelo_ajustadas.json` y repetir el paso 5.

### `modelo.py` (despiece)
- Espacio: el del cuadro del juego (325x357, pies abajo al centro) **al doble** (650x714); el visor lo dibuja a ×0,5.
- `J`: articulaciones marcadas a mano sobre `modelo/base.png` con rejilla (coronilla, cuello, cadera, hombro/codo/mano,
  cadera/rodilla/tobillo/punta/talón de cada lado, capaA/capaB). Lado `I` = el de atrás, `D` = el de delante.
- `HUESOS`: nombre → (articulación inicio = punto de giro, fin, padre, grosor). Raíces: torso, piernaI, piernaD.
- Reparto: cada píxel al hueso con menor distancia-al-segmento / grosor. La capa solo coge tela azul o lo que está lejos
  de todo hueso del cuerpo; la cabeza no baja del cuello.
- Lo oculto: lo tapado por los brazos se rellena por difusión (colores de alrededor); la **capa entera** (todo lo opaco
  a la izquierda de `CAPA_LINEA`, menos las botas) se completa con su tela.
- Cada pieza: su zona + disco en la articulación con el padre + 3 px de solape; sin islas < 400 px (`sin_islas`).
- Dagas: las del sprite viejo (`piezas/daga*.png`) llevadas a la mano nueva con el mismo giro relativo al antebrazo.
- `ORDEN` de dibujo (atrás → delante): capa, brazo y antebrazo de atrás, piernas y pies, torso, daga de atrás, cabeza,
  brazo de delante, daga de delante.

### `poses_modelo.py` (poses)
- Las poses viejas son ángulos relativos al reposo viejo (casilla 70). Se pasan a giro absoluto y se restan las
  direcciones de reposo del modelo nuevo (la cabeza no: sus puntos marcados no son los mismos).
- Raíz: x como en el sprite (×2); y para que la punta más baja toque el suelo.
- Claves: `t` (0-1), giro de cada hueso en grados (relativo al padre), `raiz: [x, y]`, `alfa_<pieza>` (visibilidad),
  `suelo<I|D>` (giro del pie respecto al suelo; 0 = plano como en el dibujo).

### `index.html` (visor)
- Izquierda: sprite actual con los tiempos del juego (`SPRITE`); derecha: el modelo. Botones Reposo/Ataque,
  velocidad, Ver huesos, Calco (sprite semitransparente encima del esqueleto).
- `pose()` interpola claves (suave), `pisar()` clava los pies (cinemática inversa de 2 huesos: el tobillo queda en la x
  de la pose y sube/baja hasta que la suela toca el suelo; la rodilla se dobla hacia el mismo lado que en la pose; el pie
  = `suelo` menos lo que ya giró la espinilla), `matriz()` encadena huesos, efectos del sprite encima en su tramo.
- Brazos, piernas y pies se dibujan como malla (`dibujarMalla`): codos, rodillas y tobillos se curvan (pesos suaves entre
  hueso padre e hijo cerca del giro). Torso, cabeza, capa y dagas son recortes rígidos.
- `ajustar.js` mide la silueta con los recortes rígidos (sin malla): basta para ajustar, la diferencia es mínima.

### `ajustar.js` (solo consola)
- Compara silueta del modelo (con `pisar`) y del cuadro del sprite (sin brillos de efectos ni dagas) e intenta raíz y
  cada hueso (`PARAMS`, incluye `sueloI/D`) con pasos 12→1,5°, ±40° de la pose de partida y castigo por alejarse.
- Última corrida: coincidencia de silueta 63-90 % según cuadro (antes del ajuste 50-65 %).

## Decisiones
- 2026-11-07 · Usuario: piezas dibujadas aparte por Gemini (modo «Hoja») → «espantoso», «se ven demasiado diferentes».
  **La referencia es el sprite**: comparar siempre lado a lado con él antes de decir que algo está bien.
- 2026-11-07 · Usuario: rehacer el asesino «orientado a esqueleto» (dibujo base en pose neutra) y despiezarlo nosotros;
  se quitaron del visor las alternativas viejas (Malla, Hoja, Piezas).
- 2026-11-07 · Usuario: a la animación le falta movilidad porque se reutiliza un recorte fijo → pies aparte + pies
  clavados al suelo (hecho), luego rodillas/codos que se doblen (siguiente).
- 2026-11-07 · Motor propio (canvas, sin dependencias) en vez de Spine (licencia) o DragonBones (abandonado): igual en
  web y Android.

## Hecho
- Modelo nuevo despiezado (15 piezas), capa entera sin huecos ni migas, dagas, reposo y ataque coincidiendo con el
  sprite; pies separados y clavados al suelo; codos, rodillas y tobillos que se curvan.

## Pendiente
- Hueco pequeño del torso en el hombro de atrás si ese brazo sube mucho.
- El modelo es algo más delgado que el sprite.
- Cambios de perspectiva imposibles con recortes (pie de perfil, puño girado): piezas de recambio.
- Solo hay reposo y ataque; no está en el juego.
- Choca con el pixel art pendiente (`trabajo/pixel-art/`): rotar piezas pixeladas las deforma (dibujar en HD y pixelar
  al final, o aceptar algo menos de nitidez).

## Cómo verificar
- Servidor: `.claude/launch.json` → «juego» (`python -m http.server 8123`), abrir
  `http://localhost:8123/prototipos/esqueleto/index.html`. Abrirlo como archivo también funciona (todo va en `.js`).
- Comparar lado a lado con el sprite en Reposo y Ataque (y con Calco). El usuario prueba en su navegador.
- Captura sin ventana visible: en la consola, dibujar `dibujarSprite`/`dibujarEsqueleto` en canvases fuera de pantalla
  con tiempos fijos y pegarlos en un canvas fijo encima de la página; luego captura/zoom.

## Cuidado con
- **Caché del navegador**: las piezas se llaman igual al regenerarlas; recargar con `?r=<algo>` y forzar las imágenes
  (`imgs[n].src += '?v=' + Date.now()`) o se ven las viejas.
- **Gemini no despieza su propio dibujo fielmente**: lo redibuja (antebrazos en «L», ángulos distintos). Las piezas
  hay que sacarlas del dibujo nosotros. Gemini sí sirve para el dibujo base entero.
- Las articulaciones `J` dependen de dónde se coloca el dibujo (`ALTO`, `CENTRO_X`, `cadera_x`): si cambia eso, volver a
  marcarlas con la rejilla.
- `poses_modelo_ajustadas.json` se hizo con estas piezas y huesos: si cambian, volver a correr `ajustarTodo()`.
- Lado `I` = atrás (izquierda en pantalla), `D` = delante.

## Bitácora
- 2026-11-07 · Documentación para retomar; piernas sin trozos de capa; codos/rodillas/tobillos en malla.
- 2026-11-07 · Pies aparte (`pieI/pieD`, tobillo/punta/talón) y `pisar()` (cinemática inversa); reajuste con `suelo*` → 63-90 %.
- 2026-11-07 · Modelo nuevo: `modelo.py`, `poses_modelo.py`, `ajustar.js`; visor solo con el modelo; capa entera rellena.
- 2026-11-07 · Dibujo base con Gemini (prompt: «Redraw this exact character (same assassin, same art style, same colors, same outfit, same 3/4 view facing right, same body proportions: slim, not bulky) as a base model for 2D skeletal cutout animation. Full body, neutral standing rig pose: legs slightly apart and straight, both arms hanging slightly away from the body so no limb overlaps the torso or the other limb, elbows and knees almost straight, fists closed and EMPTY (no daggers in the hands). The cape hangs behind the body and must not cover the arms or legs. Plain flat pure green background (#00FF00), one character only, centered, whole body visible with margin, no shadow, no text.», con `asesino_reposo.png` adjunto). Su despiece por Gemini (`asesino_rig_piezas.jpg`) no sirve.
- 2026-11-07 · Modo «Hoja» con piezas de Gemini (`asesino_piezas_2/3.jpg`): descartado y borrado.
- 2026-11-07 · Malla deformable sobre la casilla 70 (`despiezar.py`), ataque rotoscopiado y ajuste a la silueta (67-79 %): sustituido por el modelo nuevo.
- 2026-11-07 · MVP inicial: 7 piezas de la casilla 70, reposo «se ve EXCELENTE» (usuario).
