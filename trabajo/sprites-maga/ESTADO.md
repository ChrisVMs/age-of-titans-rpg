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
**2026-11-08 · Claude (intermedios RIFE, prototipo)**
- `prototipos/interpolar/interpolar.py --clase maga`: las 6 animaciones de `ANIM_MAGA` (sin reposo: es el cuadro quieto) en
  `salida/maga_*`; el visor muestra todas las clases (`datos.js` lee todo `salida/*.json`). Hojas de contactos sin manchas.
- Falta: que el usuario las revise en `prototipos/interpolar/index.html`; para el juego, generalizar `intermedios_asesino.py`
  y `verificar_intermedios.py` a la maga (PROCESO.md, paso 5).

**2026-11-08 · Claude (punta del arma y cuerpo a cuerpo)**
- Hechizos y flechas salen de la punta del arma: `punta` en `SPRITE_CLASE.mago/arquero` (medida en la tira) y
  `puntaDisparo()` (18-habilidades.js), en duelo y en grupo. Comprobado en el navegador (punto en la gema del báculo).
- Cuerpo a cuerpo en grupo: con sprites propios (más pequeños) el atacante se acerca a 110 px en vez de 170 (`DIST_CUERPO_SPRITE`).

**2026-11-08 · Claude (tamaño estándar)**
- Medido de pie en pantalla: asesino (y skins), arquero y maga ~158 px; guerrero 125 px. Usuario: bajar a los demás.
  `ESCALA_SPRITES` = .786 en `escalaDe` (12-vista-del-guerrero.js) para toda clase con sprite propio; la vitrina ya no
  los achica aparte (`scale:.82` quitado). `animaciones.html` sigue mostrando cada sprite a su escala propia.

**2026-11-08 · Claude (arena y reposo estándar)**
- Rivales en grupo (arena, reyes) con su propio sprite: antes usaban el tuyo (tu skin y tus escalas). Un asesino rival con
  Espectro recibía cuadros de intermedios que su tira no tiene (aparecía y desaparecía) y la escala de tu asesino (más pequeño).
  `dibujarJugadorU` usa `spriteClase` y `escalaDe` con su perfil; sus animaciones, golpe y derrota se arman con `conPerfil`.
- Reposo estándar (pedido del usuario): el personaje quieto (cuadro 0) con la respiración del CSS, sin cambiar de tamaño.
  Arquero y Maga ya no usan sus cuadros de reposo (Gemini los dibujó a alturas distintas).

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
- 2026-11-08 · Usuario: el reposo de toda clase nueva es el personaje quieto que solo respira (CSS), sin cambiar de tamaño.

- 2026-11-08 · Usuario: los 3 diseños llamativos son skins; la base es la aprendiz, sin capucha.
- 2026-11-08 · Usuario: habilidades sin cambios (ya están listas); retroceso no exagerado.

## Pendiente
- Pruebas del usuario.
- Skins de la Maga (3 diseños).

## Cómo verificar
`node pruebas/todo.js`; `animaciones.html` (Maga) y una batalla con la Maga.

## Bitácora
- 2026-11-08 · Claude · Diseño, hojas e integración.
