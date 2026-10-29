# Contenido de nivel alto

**Estado:** pausado (espera: arte de las etapas 2-3, Ancestral y calabozos 5-8) · **Rama:** `qa` · **Actualizado:** 2026-10-29

## Objetivo
Que el tramo largo (nivel 30 → 80, ~3,5-4 meses con el balance nuevo) tenga retos y progreso. Hoy el poder del jugador se
estanca hacia el día 24 (~50 k: todo al máximo) y los jefes, reyes y la Torre alta caen mucho antes del nivel 80.

## Próximo paso
**Paso 7: arte.** La lista está en **Arte pendiente**; cuando llegue cada pieza, quitar `arte: false` de su etapa o
calabozo (y el filtro provisional) y comprobar en el navegador. Hasta entonces, nada que programar.

## Plan
1. ✅ Aura: 10 niveles, +2 % a todo por nivel, con Esencia y oro; se ve bajo el personaje (tenue → late desde el 5 →
   muy brillante con destellos en el 10). Desde el nivel 40.
2. ✅ Rareza Ancestral: equipo por encima de mítico, solo del contenido alto.
3. ✅ Etapa 2 «Las ruinas del reino caído» (esqueletos, caballeros espectrales, gárgolas; jefe: Rey Liche) y Etapa 3
   «El Abismo» (diablillos, demonios de fuego, súcubos; jefe: Señor del Abismo). 10 niveles cada una.
4. ✅ Calabozos 5-8.
5. ✅ Torre: hitos desde el piso 100 (Esencia y Ancestral).
6. ✅ Calibrar todo con `node pruebas/progresion.js`: Etapa 2 para los días ~15-45 (poder 35-50 k), Etapa 3 para ~45-110;
   el aura y lo Ancestral deben seguir subiendo el poder hasta el nivel 80. Repartir la Esencia en consecuencia.
   Que maximizar todo lleve meses (hoy ~día 24): estrellas o "despertar" por sistema con coste empinado (ver `retencion`).
7. Arte: enemigos y jefes nuevos e iconos Ancestral (lista en **Arte pendiente**). Hasta entonces, lo nuevo se juega solo en
   modo pruebas con sprites provisionales (parcas con otro color); en el juego publicado sale "Próximamente".

## Última sesión
**2026-10-29 · Claude (estados, curas y mascotas; pedido del usuario)**
- Estados de los monstruos (`28-efectos-de-estado.js`): daño FIJO = % (tope `TOPE_PCT_ESTADO` 2,5 %) de `vidaEsperada(nEq)`
  (vida medida el día en que se supera ese contenido; `nEq` lo guarda `crearDificultad` con la dificultad). Antes: % de la
  vida máxima del héroe, que nunca bajaba al subir de poder. Jefes mundiales, rivales y Ecos: % de tu vida, con el tope.
- Al héroe y a los jefes, el mismo estado reinicia su duración (no se apila; `sinPilas`); distintos sí conviven.
- Curas: mascota = su ataque × `accion.mult`; Segundo aliento = tu ataque × `ALIENTO_MULT` por rango; set 4 de Asmodeo =
  `SET4_CURA` del daño del golpe. Antes, % de la vida máxima.
- Mascotas: fuerza = % de tus estadísticas por calidad y nivel (`STAT_MASCOTA`, `pctStatsMascota`, `ataqueMascota`); golpe,
  cura y estados = su ataque × mult. Los mult se calcularon para igualar el nivel 1 de antes; a nivel 10, el doble (como antes).
- Efecto: el juego es más fácil en lo alto (Etapa 3 Infierno ahora cae en los días 60-105; Torre ~146-149). XP recalibrada
  (`CURVA_XP` 1,094, `XP_BARRIDO` .18): Nv 80 en los días 97-130 (5 semillas, mediana 108).
- Verificación: 26/26 sistemas (2 de estados), 14/14 escenarios, igual con pantalla y sin ella.

**2026-10-29 · Claude (calibración global)**
- Causa del Nv 80 temprano: el barrido de las etapas altas (~10 M de XP en 60 días de los 13,5 M necesarios).
- `XP_BARRIDO` .5 → .2 y `CURVA_XP` 1,07 → 1,091 (barridos: 1,08-1,1 con 3 semillas; muy sensible: 1,092 → 118-134).
- Medición final (3 semillas, 150 días, 300 de estamina): Nv 80 días 100-125 · Etapa 2 Normal 3-9, Etapa 3 Normal 20-38 ·
  calabozos 5-8 Normal 4-48 · Torre 100 días 21-119, final 117-139 · Grieta 5-15 por semana · Ecos 43-80 % · despertar
  y ruinas al máximo hacia los días 90-120 · aura 10 · Códice 22-23 hitos.
- Varianza: una semilla con poder alto (74 k el día 30) va sobrada en Grieta y Ecos; es la suerte del equipo.
- Verificación: 24/24 sistemas, 14/14 escenarios, igual con pantalla y sin ella.

**2026-10-29 · Claude (Torre alta)**
- `js/logica/34-torre-infinita.js`: desde `TORRE_ALTA` (100) los hitos dan Esencia (10 + 1 cada 5 pisos) y cada 50 pisos
  una pieza Ancestral (`hitoAncestral`); desde el 101, enemigos y jefes de las etapas 2-3 (Rey Liche, Señor del Abismo)
  si están disponibles (`contenidoAlto`), con la vida y el daño de sus equivalentes de la Torre (traían los de la campaña).
- El piso 100 era un muro (Bruja con 2 modificadores; el simulador se quedaba en el 99 desde el día ~15 hasta el 150):
  jefes desde el 100 con 1 modificador y curva más suave desde el 90 (`TORRE_SUAVE`: +1 n cada 10 pisos, antes cada 3,5).
- Medición (3 semillas, 150 días): piso 100 los días 17-62; final en el piso 119-137 y subiendo.
- Pisos 1-90: sin cambios.
- Verificación: 24/24 sistemas (2 de la Torre alta), 14/14 escenarios, igual con pantalla y sin ella.

**2026-10-29 · Claude (calabozos)**
- Calabozos 5-8 (Catacumbas del rey, Trono del Liche, Fosa de los demonios, Corazón del Abismo) con los enemigos de las
  etapas 2-3 y `MOD_DIF_ALTO`. Solo en modo pruebas hasta tener arte (`arte: false`). Dan Esencia (`ESENCIA_CALABOZO`)
  y los 7-8 pueden dar Ancestral en Pesadilla/Infierno (`PROB_ANCESTRAL_CAL`).
- Simulador: en el calabozo intenta antes la dificultad más baja sin superar (antes se atascaba en el 3 Infierno y no
  abría el 4 hasta el día ~77). `progresion.js` muestra los días de los calabozos 5-8.
- Medición (3 semillas, grupo de 3, 300 de estamina): Normal días 5-51, Difícil 40-103, Pesadilla 59-150; Infierno no.
- Verificación: 14/14 escenarios, igual con pantalla y sin ella.

**2026-10-29 · Claude (etapas)**
- Etapas 2 y 3 (10 niveles cada una, 10 enemigos nuevos con sprite provisional). Con `arte: false` solo se juegan en modo
  pruebas (`etapaDisponible`); en el juego publicado salen "Próximamente".
- Escalado: `ESCALA_ETAPA` (n equivalente de la Etapa 1: Etapa 2 desde 15 en pasos de 0,55; Etapa 3 desde 19 en pasos de 0,4).
  Dificultades más juntas en las etapas altas (`MOD_DIF_ALTO`): con las de la Etapa 1 la Difícil era un muro.
- Esencia por victoria (`ESENCIA_ETAPA`: 4 y 8, × el premio de la dificultad). La Ancestral sale en el 3-10 (siempre la
  primera vez; después según `PROB_ANCESTRAL`).
- Arreglado: la Esencia no se cobraba (ni en batalla ni en barrido).
- Simulador: compra el aura, barre lo que más rinde y `progresion.js` muestra los días por etapa y dificultad.
- Medición (3 semillas, 300 de estamina): Etapa 2 Normal día 8, Difícil 10-16, Pesadilla 24-33; Etapa 3 Normal 21-28,
  Difícil 55-106. Aura al 10 y Nv 80 hacia el día 46-52. **Pendiente en el paso 6:** el Nv 80 llega rápido con 300 de
  estamina y el aura se llena pronto.
- Verificación: 14/14 escenarios, igual con pantalla y sin ella.

## Decisiones
- 2026-10-28 · Contenido alto: etapas 2 y 3, calabozos 5-8 y hitos de la Torre desde el 100 (usuario). Arte nuevo: se
  espera (usuario); mientras, sprites provisionales solo en modo pruebas.
- 2026-10-28 · Fuentes de poder nuevas: rareza Ancestral (aceptada) y el aura de 10 niveles (idea del usuario: brilla
  ligeramente en el 5 y mucho en el 10).

## Arte pendiente
- Aura: hecha con CSS (no necesita imágenes).
- Equipo Ancestral: casco, armadura, espada y capa "de los Antiguos" (capas del guerrero como las demás piezas; hoy
  usan las de otra pieza con un filtro turquesa, `METAL.ancestral` y `TELA.ancestral`).
- Etapas 2-3: esqueleto, caballero, gárgola, diablillo, demonio y súcubo; jefes Campeón, Liche, Verdugo y Señor del Abismo.
- Calabozos 5-8: fondos/iconos propios (hoy emoji).
- Torre alta: usa los enemigos de las etapas 2-3 (nada nuevo).
- Opcional (hoy CSS/emoji, ya jugables en el juego publicado): edificios de las Ruinas en la escena del Campamento (ruina →
  reconstruido), retratos de los 4 Ecos (hoy el guerrero con un filtro de color), marcos de perfil del Códice, brillo D5.
- Cómo publicar al llegar el arte: quitar `arte: false` en `ETAPAS` (22-campanas) y `CALABOZOS` (37-calabozo); la Torre
  alta y lo Ancestral se activan solos (`contenidoAlto`).

## Cómo verificar
- `node pruebas/equivalencia.js <otra versión>`: mismas batallas que antes (234 casos).
- `node pruebas/escenarios.js`, `node pruebas/sin-pantalla.js`, `node pruebas/progresion.js`.

## Mapa del código
- `js/logica/44-aura.js`, `js/pantalla/29-aura.js`, `pintarAura` (en `pantalla/12-vista-del-guerrero.js`).
- Ancestral: `RAREZAS`, `ENC_MAX`, `ALMAS_DESGUACE`, `MODELOS` (`*_antiguo/a`), `objetoAncestral` (`logica/21-tienda-cofres.js`).

## Bitácora
- 2026-10-28 · Claude · Aura (`6e66f3c`).
