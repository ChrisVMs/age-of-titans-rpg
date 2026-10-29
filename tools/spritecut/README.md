# spritecut

Limpia spritesheets de pixel art generadas por IA (Gemini) y produce frames listos para Age of Titans:
fondo transparente con alfa binario, píxel nativo, paleta común y canvas alineado.

## Instalación

```bash
pip install -r tools/spritecut/requirements.txt
```

## Uso

Desde `tools/spritecut/`:

```bash
python -m spritecut hojas/knight.png -o out
python -m spritecut hojas/ -o out                      # lote: todas las PNG/JPG de la carpeta
python -m spritecut hojas/knight.png --anchor feet --colors 12
python -m spritecut hojas/orc.jpg --pixel-size 5 --no-grid --tolerance 45
```

Si existe `knight.json` junto a `knight.png` se usa como **hipótesis** (se verifica contra la imagen; si no cuadra, se avisa y manda lo medido):

```json
{
  "name": "knight",
  "background": "#FF00FF",
  "grid": {"cols": 4, "rows": 2},
  "expected_pixel_size": 4,
  "anchor": "bottom-center",
  "animations": [{"row": 0, "name": "walk", "frames": 4}, {"row": 1, "name": "attack", "frames": 4}]
}
```

Opciones por animación en el JSON: `"cols": [0,1,2]` toma solo esas columnas de la fila y
`"separate": true` le da canvas propio (proyectiles y efectos, para no inflar el del personaje).
Ejemplo real: `hojas/maga.json`.

```bash
python -m spritecut hojas/maga.jpg -o out --colors 32 --min-area 8
```

### Salida (`out/knight/`)

| Archivo | Contenido |
|---|---|
| `knight_walk_00.png` … | frames finales, RGBA, alfa 0/255, sin ICC |
| `knight.json` | metadatos: frames por animación, canvas, anclaje, tamaño de píxel, paleta, avisos |
| `knight_atlas.png` | atlas (rectángulos en `knight.json` → `atlas.frames`) |
| `knight_report.txt` | detectado vs. esperado: frames, tamaño de píxel, colores, descartados, avisos |
| `knight_contact.png` | **verificación**: frames ×4 sobre tablero, caja (verde) y línea base/ancla (rojo) |
| `knight_detect.png` | **verificación**: hoja original sin fondo, cajas, grilla del JSON (azul), manchas descartadas (rojo) |

El código de salida es 1 si alguna hoja tuvo avisos: revisar el reporte y las hojas de contactos.

## Pipeline

1. **Fondo** (`background.py`): flood fill desde los bordes con distancia RGB ≤ `--tolerance`. Un segundo pase compara contra un modelo local del fondo (para gradientes y ruido). Quita bolsas de fondo encerradas ≥ `--hole-min-area`. Halos: píxeles de borde que son mezcla fondo+color interior, o a distancia ≤ `--halo-tolerance` del fondo. Despill: en la franja de borde, los píxeles que son mezcla del color interior con el fondo recuperan el color interior (JPG mete magenta 1–3 px hacia dentro); tras reducir, se quitan del contorno los colores que son mezcla de otro color con el fondo (`--no-despill` lo desactiva). Con fondo de un solo canal (verde o azul puro) además se limita ese canal en el sprite para quitar el tinte del JPG. Las líneas de grilla que dibuja la IA se detectan, se borran (con su difuminado) y se contrastan con la grilla del JSON. Alfa siempre binario.
2. **Frames** (`segment.py`): componentes 8-conexos; los menores de `--min-area` se descartan. Con grilla, cada componente va a su celda; si ocupa varias (frames pegados) se separa erosionando hasta obtener núcleos y repartiendo cada píxel al más cercano. Sin grilla: filas por solape vertical, columnas por X, y los bloques demasiado anchos se separan igual.
3. **Tamaño de píxel** (`pixelsize.py`): mide en qué rejilla caen las transiciones de color/alfa; elige el mayor tamaño con puntuación cercana a la máxima (los divisores puntúan igual, los múltiplos no). La fase se recalcula por frame. Reducción por **moda** de cada bloque. Si no hay rejilla entera (Gemini suele reescalar, p. ej. 3,625 px), se mide el paso fraccionario con el espectro de Fourier de las transiciones y se toma la moda del núcleo de cada celda.
4. **Paleta** (`palette.py`): k-means (k = `--colors`) sobre los píxeles opacos de toda la hoja, fusión de colores casi iguales, asignación al más cercano sin dithering. Se queda solo con los colores usados.
5. **Alineación** (`align.py`): canvas común para toda la hoja. Anclajes: `bottom-center` (centro de la caja), `feet` (centro de los pies; evita saltos cuando un arma alarga la caja), `center`, `bottom-left`, `top-left`.

Sin interpolación bilineal/bicúbica ni IA en ningún paso.

## Tests

```bash
cd tools/spritecut && python -m pytest -q tests
```

`tests/synth.py` genera una hoja buena y una mala (fondo con gradiente y ruido, halos rosados, ruido en los colores, dos frames pegados, una mancha suelta) con verdad conocida.
