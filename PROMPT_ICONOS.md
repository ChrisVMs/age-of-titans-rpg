# Prompts de iconos y fondos (HD)

Prompts usados para generar el arte HD del juego (iconos de interfaz, árboles, fondos). Para un icono o fondo nuevo:
**partir de aquí**, mantener el mismo estilo y añadir la hoja a `tools/iconos_menu.py`.
Los sprites de personajes animados tienen su propia plantilla: `PROMPT_SPRITE.md`.

## Cómo se procesan

- Hoja fuente en `tools/hojas/<hoja>`; `python3 tools/iconos_menu.py` recorta cada hoja (con `tools/split_sheet.py`) y guarda
  cada icono en `img/iconos/<nombre>.png`. Cada hoja es una entrada de `HOJAS` (hoja, columnas, filas, nombres, modo);
  `'-'` en los nombres = celda vacía.
- Modos según lo que devuelva el generador:
  - `False`: verde plano, sin baldosas (lo ideal).
  - `True`: baldosa verde oscuro alrededor de cada icono (`iconos_menu.jpg`).
  - `'insignia'`: la baldosa es parte del dibujo y se conserva (`iconos_calabozo.jpg`).
  - `'marco'`: baldosa verde media con contorno oscuro (`iconos_arbol_asesino.jpg`).
  - `'marco_texto'`: como `'marco'` pero con el nombre escrito debajo, que se recorta (`iconos_batalla.jpg`).
  - `'oscura'`: baldosa gris/azul oscura con borde negro (`iconos_runas.jpg`).
  - `'gris_texto'`: fondo gris oscuro liso y nombre escrito debajo (árboles de Guerrero, Arquero y Maga).
- En el código, un icono HD se pinta con `<img class="ic-txt" src="img/iconos/<nombre>.png" alt="">` (en línea con texto),
  `iconoDe(x)` (si el dato tiene `img`) o `htmlPremio`/`icPremio` (recursos). Avisos y diálogos son solo texto: ahí, emoji.

## Consejos (aprendidos generando)

- El generador **escribe los nombres** que vea entre comillas aunque se pida "no text": describir solo el dibujo
  (`a sword with red flames`, no `Branch "Fury"`).
- A veces ignora el fondo verde o añade baldosas: no hace falta regenerar, se elige el modo adecuado en `iconos_menu.py`.
- Evitar verde puro dentro de los iconos (el recorte apaga los verdes intensos); pedir teal/esmeralda.
- Una sola hoja por tema, para que todos los iconos salgan con el mismo estilo.

## Bloque común (pegar al final de cada prompt de iconos)

```
CANVAS AND GRID (strict): Output image of exactly [W]x[H] px, [C] columns x [R] rows, each cell exactly 256x256 px. Each icon centered in its cell, filling about 65% of it, with empty margin; nothing touches another cell or the cell edges. No grid lines, no labels, no numbers, no text, no watermark.
BACKGROUND (strict): Perfectly flat solid green #00FF00 across the whole image, directly behind each icon. NO tiles, NO rounded squares, NO circles, NO badges, NO frames, NO dark panels behind the icons. No shadows or glow on the background. Do not use pure green (#00FF00) inside the icons (use teal or emerald instead).
ART STYLE: Cartoon 2D fantasy game style, clean hand-painted look, thick dark outlines, slightly stylized shapes, soft shading; same style as a set of RPG menu icons with dark navy, charcoal and leather-brown bases and accents of gold, light-blue steel glow and deep purple. Consistent top-left lighting, same line weight and detail. Readable at 28x28 px: bold silhouettes, no thin lines.
```

## Hojas generadas

| Hoja (`tools/hojas/`) | Rejilla | Contenido | Nombres en `img/iconos/` |
|---|---|---|---|
| `iconos_menu.jpg` | 5×5 | accesos del menú, barra inferior, recursos | `jefe` … `misiones`, `heroe`, `mascota`, `batalla`, `herreria`, `tienda`, `oro`, `cristales`, `estamina`, `poder` |
| `iconos_clases.jpg` | 4×2 | emblemas de clase y estadísticas | `clase_<clase>`, `vida`, `ataque`, `defensa`, `armadura` |
| `iconos_calabozo.jpg` | 4×3 | candado, más, calabozo, hoguera, 8 calabozos | `candado`, `mas`, `calabozo`, `hoguera`, `cal_1`…`cal_8` |
| `iconos_arbol_asesino.jpg` | 5×5 | árbol del Asesino, maestría, especializaciones | `rama_<id>`, `nodo_<id>`, `maestria`, `esp_<id>` |
| `iconos_arbol_guerrero.jpg`, `_arquero`, `_mago` | 5×4 | árboles de las otras clases | `rama_<id>`, `nodo_<id>` |
| `iconos_runas.jpg` | 6×5 | runas, reliquias, materiales, pestaña Runas, pulir | `runa_<tipo>`, `rel_<id>`, `mat_<material>`, `runas`, `pulir` |
| `iconos_batalla.jpg` | 5×5 | habilidades y estados | `hab_<id>`, `est_<estado>` |
| `iconos_interfaz.jpg` | 5×5 | símbolos de interfaz | `hecho`, `estrella`, `ficha`, `regalo`, `reciclar`, `guardar`, `cambiar`, `volver`, `anuncio`, `editar`, `auto`, `desconocido`, `ranura_vacia`, `oro_1`, `plata_2`, `bronce_3`, `tienda_campana`, `hoguera_hd` |

### Menú principal — `iconos_menu.jpg` (1280×1280, 5×5)
```
Row 1: 1 horned demon skull (world boss), 2 open spell book with a glowing rune (skills), 3 rolled parchment scroll with a wax seal (titles), 4 golden trophy cup with crossed blades (arena), 5 calendar page with a small star (daily login)
Row 2: 6 leather backpack with straps (inventory), 7 medal with ribbon (ranking), 8 stack of three old books (collection), 9 tall dark stone tower with a lit window (tower), 10 swirling purple portal (rift)
Row 3: 11 ruined stone house with a broken roof (ruins), 12 golden crown with red gems (kings), 13 quest board with pinned notes (missions), 14 hooded assassin head with mask, front view (hero), 15 paw print with a small glowing claw mark (pet)
Row 4: 16 two crossed curved daggers with a light-blue glow (battle), 17 blacksmith hammer over an anvil (forge), 18 merchant cart with a small awning (shop), 19 stack of gold coins (gold), 20 blue diamond crystal (gems)
Row 5: 21 lightning bolt (stamina), 22 crossed sword and dagger with a small spark (power), 23-25 empty
```

### Clases y estadísticas — `iconos_clases.jpg` (1024×512, 4×2)
```
Row 1: 1 steel knight helmet with a red plume over a straight sword · 2 green hooded ranger head over a drawn wooden bow · 3 purple witch hat over a crystal-topped staff with a small blue glow · 4 dark navy hood with black face mask over two crossed curved light-blue daggers
Row 2: 5 a red heart with a soft highlight · 6 a single straight sword pointing up, steel blade with gold guard · 7 a round wooden shield with an iron rim · 8 a steel chest plate (breastplate)
```

### Calabozo e interfaz — `iconos_calabozo.jpg` (1024×768, 4×3)
```
Row 1: 1 a closed iron padlock with a dark keyhole · 2 a bold golden plus sign with a dark outline · 3 an arched stone dungeon door with iron bars and two torches · 4 a small campfire with logs and bright orange flames
Row 2: 5 a small stone crypt entrance with a wooden coffin in front · 6 a stone mausoleum with columns and a triangular roof · 7 a twisted dead tree over a misty bog with a small bubbling cauldron · 8 a volcano crater glowing with lava and embers
Row 3: 9 a skull wearing a broken iron crown over crossed bones · 10 a dark stone throne with a glowing blue crystal on top · 11 a fiery pit with demonic horns rising from the flames · 12 a dark swirling void with a glowing red core
```

### Árboles de habilidades (1280×1024, 5×4; filas = ramas y nodos en el orden de `ARBOL.<clase>`)
Asesino (5×5, con maestría y especializaciones): ramas daga curva / luna con humo morado / calavera sobre frasco de veneno;
nodos de Filo, Sombras y Venenos; medalla de bronce (maestría); explosión roja, escudo azul, espada y escudo con laurel (especializaciones).
```
WARRIOR (steel plate, red cape): a sword with red flames · a large steel tower shield · a rolled battle map with a sword · a flexed armored arm · a sword hitting a red target / a sword thrusting with a speed line · a sword dripping red · a heavy war hammer smashing the ground · a red heart covered by an iron plate · a steel breastplate / a shield with a curved arrow bouncing back · a swirl of white wind around a small heart · a cracked shield with a golden glow · an open book with a sword emblem · a blurred dodging silhouette / a sword with a crescent arc and a small clock · a dragon skull with a sword through it · a glowing red heart with yellow sparks
ARCHER (green hood, longbow): a drawn bow with a small target ring · a green leaf over a leather quiver · a wolf head with a paw print · an arrow nocked and glowing gold · a hawk eye inside a crosshair / an arrow in the center of a target · a skull pierced by an arrow · an arrow breaking through a steel plate · a green cloak with motion lines · a leather vest with a small shield / a steel bear trap with a red drop · an open eye with a green glow · a bush hiding a hood · animal tracks in the mud · a dripping green poison arrow / three arrows falling from a cloud · an iron arrowhead with a bolt · a hunter's medal with a wolf emblem
MAGE (purple hat, crystal staff): a big orange fireball · a blue ice crystal · an open spellbook with a glowing rune · a glowing purple arcane orb · a flame on a wand tip / a sun-like fireball · a red explosion burst · a flaming meteor · a frost armor chest plate · a hand covered in ice with a small shield / a sharp ice spear · a snowy mountain peak · a swirling blizzard · an open book with a glowing eye · a glowing purple brain / a red drop drained into a purple swirl · a crystal ball focusing a beam · a blue wave of mana from a vial
```

### Runas, reliquias y materiales — `iconos_runas.jpg` (1536×1280, 6×5)
```
RUNES (same rounded stone tablet, only glow color and symbol change): red flame · emerald heart · brown shield · silver armor plate · yellow target · orange skull / blue arrow · purple wall · black stone white star · cyan spiral · crimson horned skull · teal four-leaf clover
RELICS: big ivory fang with a small flame · bead necklace with a red demon eye · dark bronze urn with embers · black and purple feather · black iron crown with red gems and horns · purple wax seal with a hexagram / large curved horn with a bronze ring · broken double-headed axe · bronze minotaur hoof
MATERIALS: blue faceted crystal shard (enchanting stone) · leather pouch spilling golden dust (refining dust) · glass vial with cyan ghostly mist (soul dust) / glowing golden sun orb (essence) · three stacked rune stones (runes tab) · whetstone with a polishing cloth (polish)
```

### Batalla — `iconos_batalla.jpg` (2048×512, 8×2)
```
Row 1: a straight sword stabbing forward with a speed line · a sword swinging upward leaving a white crescent · a heavy war hammer hitting the ground · a single arrow with a target ring · several arrows falling from a dark cloud · a blazing fireball · a sharp light-blue ice spear · a flaming rock with a fiery tail
Row 2: a curved dagger with a red spark at the tip · a dark hooded silhouette dashing with purple smoke · two crossed curved daggers with a blue aura · a small flame · a teal poison drop with a tiny skull · a red blood drop · a blue ice crystal · three yellow stars spinning in a circle
```

### Interfaz — `iconos_interfaz.jpg` (1536×768, 6×3)
```
Row 1: a bold teal check mark · a golden star · a golden event ticket · a red gift box with a gold ribbon · a broken sword with a circular arrow (salvage) · a quill pen
Row 2: a closed leather journal with a gold clasp (save) · two curved arrows forming a circle (swap) · a curved arrow pointing left (back) · a small scroll screen with a play triangle (ad) · a brass gear with a play triangle (auto) · a dark stone with a glowing question mark
Row 3: an empty dark socket ring · gold medal · silver medal · bronze medal · a small canvas camp tent · logs with bright orange flames (no stones)
```

## Pendientes (prompt listo, aún sin generar)

### Tienda — cofres (1024×256, 4×1) + bloque común
```
Four treasure chests for the shop of a dark fantasy RPG, matching an existing set of hand-painted cartoon menu icons (trophy, backpack, crown, gift box, anvil). All four have exactly the same chest shape, size and angle: front three-quarter view, lid closed, a keyhole plate in front. Only the material changes. Absolutely no text, no letters.
1 a worn brown wooden chest with dark iron bands and rivets · 2 a grey iron chest with steel bands, heavy rivets and a dark lock plate · 3 a golden chest with ornate gold trim and small blue and red gems · 4 a crimson mythic chest with black iron trim, glowing red runes on the lid and a soft red glow around it
```
Destino: `cofre_madera`, `cofre_hierro`, `cofre_dorado`, `cofre_mitico` (imagen de cada cofre en la Tienda; hoy son SVG).

### Skins, modificadores, bendiciones y Ecos — `iconos_resto.jpg` — GENERADA (salió irregular: filas 1-2 de 5 columnas y texto en celdas; se procesa aparte al final de `iconos_menu.py`)
Sustituye al de skins de abajo. Nombres: `skin_<id>`, `mod_<id>` (33-modificadores), `bend_<id>` (47-grieta), `eco_<id>` (50-ecos).
```
28 icons for a dark fantasy RPG. Absolutely no text, no letters, no labels.
Rows 1-2, ten armored knight helmet portraits, same helmet shape and size, front three-quarter view: blue steel helmet crackling with lightning · glossy black obsidian helmet with purple sheen · translucent pale-blue ghostly helmet with glowing eyes · brass helmet with gears and rivets · wooden helmet covered in leaves and vines · shining golden helmet with a sun crest · helmet made of pink-magenta crystals · black and red horned helmet with flames · dark iron helmet with a skull visor and blue glow · bone-white helmet with teal necrotic runes
Row 3, enemy modifiers: an angry red face with steam (frenzy) · a thick iron shell plate (armored) · a bulging muscular arm (robust) · a spiky cactus (thorns) · an emerald heart with a plus sign (regeneration) · a flame
Row 4: a snowflake with ice shards (frozen) · a skull dripping teal poison (venomous) · BLESSINGS: a sword with a golden aura (fury) · a stone wall with a shield (bulwark) · a big red heart with a golden glow (vigor) · a mechanical steel arm (armor)
Row 5: a small emerald leaf with a breeze swirl (respite) · a flame rising from a heart (second wind) · ECHO RIVALS, hooded portraits: a swift rogue with twin daggers · a stout shieldmaiden with a round shield · a shadow assassin with a dark crescent · an old veteran knight with a crown
```

### Skins (1280×512, 5×2) + bloque común
```
Ten armored knight helmet portraits (head and shoulders, front three-quarter view), same helmet shape and size, each a different themed armor. Absolutely no text.
Row 1: 1 storm aegis: blue steel helmet crackling with lightning · 2 dark obsidian: glossy black volcanic-glass helmet with purple sheen · 3 spectral guardian: translucent pale-blue ghostly helmet with glowing eyes · 4 clockwork gendarme: brass helmet with gears and rivets · 5 verdant druid: wooden helmet covered in leaves and vines
Row 2: 6 solar gold: shining golden helmet with a sun crest · 7 amaranth crystal: helmet made of pink-magenta crystals · 8 infernal: black and red helmet with horns and flames · 9 death knight: dark iron helmet with a skull visor and blue glow · 10 necro guardian: bone-white helmet with green necrotic runes
```
Destino: `skin_<id>` (ids en `js/logica/08-skins.js`: egida_tormentosa, obsidiana_oscura, guardian_espectral, gendarme_mecanico, druida_verdial, aurico_solar, cristalino_amaranto, infernal, caballero_muerte, necro_guardian).

### Mascotas — `iconos_mascotas.jpg` (1280×768, 5×3) — GENERADA: `masc_<id>` (por ahora solo en la Colección)
```
15 cute companion pet portraits, head and shoulders, front three-quarter view: rat · frog · owl · wolf · turtle / bat · phoenix · panther · stone golem · dragon / lion · unicorn · serpent · whale · dog
```

## Fondos

Pantalla completa, sin personajes; recorte con `background-size:cover` anclado abajo.
- **Menú** (`img/fondos/menu.jpg`): claro de bosque nocturno con pinos y montañas (dado por el usuario).
- **Etapa 1** (`img/fondos/etapa1.jpg`, campo `fondo` de la etapa en `js/logica/22-campanas-etapas-de-10.js`). Lo que funcionó:
```
A wide 2D background for a turn-based RPG battle screen: a cursed graveyard at night. No characters. Canvas 2048x918 px.
LAYOUT IN HORIZONTAL BANDS (from the top): 0-280 px night sky and distant scenery; 280-300 px horizon with low fog; 300-918 px ONE continuous, flat, open ground of packed dirt and short dead grass across the entire width.
CAMERA: high three-quarter view looking down about 35 degrees (tactics/arena game), NOT a side view.
GROUND MUST BE EMPTY: only flat textures; nothing standing on it, nothing in the foreground or corners.
DISTANT GRAVEYARD only between 150 and 300 px, small and far away, sitting on the horizon line.
STYLE: cartoon 2D game background, hand-painted, soft dark outlines; desaturated purples, cold blues, muted greens; lightest area is the ground.
```
  Clave: horizonte alto (~30-35 %) y suelo vacío, porque la fila de enemigos de arriba pisa a ~40 % de la altura.
- **Vitrina del héroe** (`img/fondos/perfil.jpg`): patio de entrenamiento con arco rúnico y suelo de losas (dado por el usuario);
  el centro del suelo queda bajo los pies (`background-position:50% 88%`).
