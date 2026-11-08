# Sprites HD de la Maga

**Estado:** en curso · **Rama:** main · **Actualizado:** 2026-11-08

## Objetivo
Sprite HD propio de la Maga (antes: 14 poses del guerrero), estilo cartoon del Asesino, con sus habilidades actuales (Bola de
fuego, Lanza de hielo, Meteoro) y los hechizos dibujados.

## Próximo paso
Que el usuario la pruebe (duelo, grupo, campamento, Android). Ajustes posibles: `escala` de `SPRITE_CLASE.mago`, tiempos de
`ANIM_MAGA`, posición de `hechizoMaga` / `meteoroSobre`. Luego, las skins (`tools/hojas/maga_disenos.jpg`) con el prompt de
reemplazo de `PROMPT_SPRITE.md`.

## Última sesión
**2026-11-08 · Claude**
- Diseños: 3 propuestas (quedan como skins: `tools/hojas/maga_disenos.jpg`) y la base elegida, aprendiz sin capucha
  (`tools/hojas/maga_base_referencia.jpg`). Conversación de Gemini: `gemini.google.com/app/eaacaa78d419232d`.
- Hojas `tools/hojas/maga_{reposo,ataque,bola,lanza,meteoro,golpe,derrota,efectos}.jpg`. Bola corregida una vez (el báculo
  desaparecía; al 2.º intento sigue faltando en algunos cuadros: aceptada por el criterio de 2 intentos).
- `tools/tira_arquero.py` → `tools/tira_clase.py <clase>` (config por clase en `CLASES`); limpia separadores en todas las
  hojas y restos a la espalda del personaje. Arquero rehecho con la misma herramienta.
- Juego: `SPRITE_CLASE.mago` (75 cuadros), `ANIM_MAGA`, `hechizoMaga` (rayo, bola, lanza), `meteoroSobre` (cae y estalla);
  en grupo `proyectil()` y el meteoro usan los efectos nuevos. Golpe sutil (pies quietos). Se saltan 16-17, 36 y 68-70.
  `animaciones.html` con todas. `VERSION_IMG` 25.
- Verificación: `node pruebas/todo.js` como antes (solo «Clases: cadena…», previo); juego y `animaciones.html` sin errores.

## Decisiones
- 2026-11-08 · Usuario: los 3 diseños llamativos son skins; la base es la aprendiz, sin capucha.
- 2026-11-08 · Usuario: habilidades sin cambios (ya están listas); retroceso no exagerado.

## Pendiente
- Pruebas del usuario.
- Skins de la Maga (3 diseños).

## Cómo verificar
`node pruebas/todo.js`; `animaciones.html` (Maga) y una batalla con la Maga.

## Bitácora
- 2026-11-08 · Claude · Diseño, hojas e integración.
