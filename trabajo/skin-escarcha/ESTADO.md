# Skin Escarcha del Asesino (hojas con Gemini en Chrome)

**Estado:** en curso (espera: prueba del usuario en el juego) · **Rama:** main · **Actualizado:** 2026-11-07

## Objetivo
Segunda skin del Asesino (Escarcha, hielo), con las mismas animaciones que la base, generando las hojas con Gemini desde
el Chrome del usuario (extensión Claude in Chrome) y revisando cada una antes de usarla. Sirve de prueba del flujo para
futuras skins.

## Próximo paso
Que el usuario la pruebe (Tienda → skins del Asesino, batalla y `animaciones.html` → "Asesino · skin Escarcha") y ajustar lo que vea.

## Última sesión
**2026-11-07 · Claude**
- Cambios: `tools/hoja_base_asesino.py` (nuevo) · exporta las hojas base desde `img/asesino/tira.png` con `build_sheet.py`.
- `tools/asesino_grupos.py` (nuevo) · GRUPOS (casillas por animación) y HOJAS (cuadros y columnas por hoja); `tira_skin_asesino.py` lo importa.
- `tools/comparar_hoja.py` (nuevo) · revisa hoja generada vs base: cuadros, tamaño coherente, bordes, movimiento.
- Hojas generadas en `tools/hojas/asesino_escarcha_*.jpg`: reposo, ataque, retroceso, punalada_1, punalada_2, punalada_3.
- Sin commit: todo lo anterior.
- Verificación: `comparar_hoja.py` y revisión visual lado a lado de cada hoja.
- Quedó a medias: paso y derrota sin generar (cupo agotado); nada dividido ni en el juego.

## Decisiones
- 2026-11-07 · Casillas 21 y 28 compartidas por Puñalada y Paso: `tira_skin_asesino.py` se quedaba con la última (el Paso) y en mitad de la Puñalada cambiaba la pose de brazos; ahora elige el cuadro más parecido a la casilla base. Cuadro 3 de la Puñalada (casilla 102, tajo grande de Gemini) = copia del 2. VERSION_IMG 20.
- 2026-11-07 · Casillas 0-2 de Escarcha = cuadros de reposo (copias de reposo_00-02), como Espectro: el juego muestra la casilla 0 fuera de las animaciones y entre acciones (ataque 19 → 0 → 70); antes era una pose agachada y grande. Reposo igual que Espectro. `tira_skin_asesino.py` (POR_CUADRO) da a 0-2 la escala del reposo. VERSION_IMG 19.
- 2026-11-07 · Escarcha con escala POR CUADRO (`POR_CUADRO=1 python tools/tira_skin_asesino.py escarcha`): Gemini copió los tamaños de la hoja base (casilla 108 y 5-7 dibujadas pequeñas) y una escala por hoja los dejaba encogidos en la Puñalada. Reposo = el del asesino base (sus casillas 0-2 son poses agachadas). Pendiente menor: tajo grande añadido en el cuadro 3 de la Puñalada.
- 2026-11-07 · Usuario: aceptar detalles menores (ondeo de capa). Al menos 2 intentos por igualar la base; si no sale,
  aceptar si el movimiento es coherente con la animación. Regenerar si se pierde la animación.
- 2026-11-07 · Usuario: retroceso aceptado con los cuadros 4-5 de pie (en la base, agachado).
- 2026-11-07 · Retroceso en rejilla 3×2 (no 5×1): con hojas muy alargadas Gemini agranda al personaje y lo corta.

## Hecho
- 2026-11-07 · 2.ª cuenta de Gemini (/u/1/): paso (2 intentos), derrota_1 (cuadro 5 = copia del 4 tras 2 intentos), derrota_2, punalada_2 rehecha (OK).
- Dividida (84 cuadros), tira armada (celda 299×333), icono `img/iconos/skin_escarcha.png` (cuadro de reposo recortado), en SKINS (vida + reducción de daño 5 %/★) y en `animaciones.html`. Sin commit.
- reposo (13) · OK al primer intento.
- ataque (9) · 3 intentos; la celda 10 sobrante se vació a mano (verde).
- retroceso (5) · aceptado por el usuario (cuadros 4-5 de pie).
- punalada_1 (12) · 2 intentos (se quitaron tajos grandes añadidos).
- punalada_3 (7) · 2 intentos.

## Pendiente
- Dividir: `python tools/skin_asesino.py escarcha <anim> tools/hojas/asesino_escarcha_<anim>.jpg COLS FILAS` (por hoja; la
  puñalada y la derrota van en varias hojas: revisar cómo las une skin_asesino.py antes).
- Armar la tira: `python tools/tira_skin_asesino.py escarcha`; añadir la skin a SKINS (`js/logica/08-skins.js`) con sus
  escalas, icono y atributos; añadirla a `animaciones.html`; prompt usado a `PROMPT_SPRITE.md`.

## Cómo verificar
`python tools/comparar_hoja.py tools/hojas/asesino_base_<anim>.png tools/hojas/asesino_escarcha_<anim>.jpg COLS FILAS N [lado.png]`

## Mapa del código
- `tools/asesino_grupos.py` · casillas de la tira por animación y reparto en hojas.
- `tools/hoja_base_asesino.py` · hojas base para el generador.
- `tools/comparar_hoja.py` · control de calidad de la hoja generada.
- `tools/skin_asesino.py` / `tools/tira_skin_asesino.py` · dividir y armar la tira de la skin.

## Cuidado con
- Gemini tiende a agrandar al personaje y a "enderezar" poses agachadas; corregir en la misma conversación funciona mejor.
- Descargas: tomar solo la imagen nueva (`find Downloads -newer marca`), no la última Gemini_Generated_Image_* (hay del usuario).
- En Gemini, un salto de línea envía el mensaje: el prompt va en un solo párrafo.

## Bitácora
