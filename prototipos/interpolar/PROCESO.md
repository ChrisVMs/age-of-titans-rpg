# Cuadros intermedios (RIFE): proceso por defecto

Al pasar una animación existente a cuadros intermedios, todo esto se aplica **siempre, sin que haya que pedirlo**.
Son las correcciones que salieron de revisar el reposo y el ataque del Asesino (2026-11-07).

## 1. Secuencia: copia exacta del juego
- Las casillas y los ms se copian de la secuencia real del juego (`ANIM_ASESINO` en `js/pantalla/18-habilidades.js`, o `reposo`
  en `SPRITE_CLASE`), sin redondear ni cambiar nada. **También el último cuadro**: si el juego termina en el reposo (70) con
  200 ms, el prototipo lleva `[70, 200]`. Solo se añade `[70, 600]` al final cuando el juego NO termina en el reposo, para
  ver la vuelta en el visor (el juego no usa ese cuadro).
- Los ciclos (reposo) van en `EN_BUCLE`: el último cuadro se interpola hacia el primero.

## 2. Colocación como en el juego
- Cada casilla se escala con la escala de su hoja (`esc` en `interpolar.py` = `escala` de `SPRITE_CLASE`) respecto a la del
  ataque (.84), pies abajo y centrada. Así no salta de tamaño entre hojas.
- Color premultiplicado e interpolado aparte del alfa (`partes`/`juntar`): sin bordes sucios ni velos.

## 3. Efectos y saltos grandes
- Pares con efectos (tajo, destello, brillo azul): se quita el efecto, se rellena el cuerpo que tapaba con el traje oscuro, se
  interpola solo el personaje y el efecto va encima con un fundido (`separar`/`fundir`). Evita contorno negro y efectos deformados.
- Si lo azul claro son las dagas y no un efecto (el reposo), la secuencia va en `SIN_EFECTOS`: las dagas se mueven, no se funden.
- Intermedios por par según la coincidencia de siluetas: 2 si ≥ 62 %, 1 si 50-62 %, 0 si menos (la daga que salta de
  sitio se emborrona). Un par con el mismo cuadro no lleva intermedios.
- Si aun así un par sale mal, se fija a mano en `A_MANO` (p. ej. `(16, 17): 0`).

## 4. Revisión antes de enseñarlo
- Hoja de contactos de `salida/<nombre>/*.png` (`NN_0` = original, `NN_j` = intermedio): sin manchas, contornos ni caras dobles.
- `python tools/verificar_intermedios.py`: casillas y tiempos iguales al juego, cuadros originales idénticos a la tira.
  Cualquier «distintos» se corrige antes de seguir.
- Primero se ve en `prototipos/interpolar/index.html`; al juego solo cuando el usuario lo pida.

## 5. Al pasarlo al juego
- Añadir la secuencia a `SECUENCIAS` de `tools/intermedios_asesino.py` y correrlo: añade casillas desde la 109 (las
  originales quedan idénticas; solo copia píxeles con `build_sheet.py`) y regenera `js/pantalla/12a-asesino-intermedios.js`.
- En el juego, la secuencia se envuelve con `intercalar(lista, '<nombre>', sprite)`: los cuadros originales conservan avance,
  sonido y golpe; los intermedios reparten el tiempo (misma duración total). Las skins sin esas casillas siguen igual.
- Casillas nuevas: escala .84 (la del ataque). Subir `VERSION_IMG` (`js/logica/08-skins.js`) y el `?v=` de `animaciones.html`.
- `animaciones.html`: la misma secuencia con `conIntermedios(...)` y el `total` de cuadros nuevo.
- `tools/tira_asesino.py` llama a `intermedios_asesino.py` al final: rehacer la tira no pierde los intermedios.
- Volver a correr `tools/verificar_intermedios.py` (casillas 109+ idénticas a los intermedios, mismos tiempos) y
  `node pruebas/todo.js`. Probar web y Android lo hace el usuario.
