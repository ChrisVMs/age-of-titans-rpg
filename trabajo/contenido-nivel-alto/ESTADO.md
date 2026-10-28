# Contenido de nivel alto

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-28

## Objetivo
Que el tramo largo (nivel 30 → 80, ~3,5-4 meses con el balance nuevo) tenga retos y progreso. Hoy el poder del jugador se
estanca hacia el día 24 (~50 k: todo al máximo) y los jefes, reyes y la Torre alta caen mucho antes del nivel 80.

## Próximo paso
**Paso 3: Etapa 2 y Etapa 3 de la campaña.** El escalado actual (+23 % de vida y daño por nivel, `crearDificultad`) no
sirve para 20 niveles más: definir el escalado de las etapas 2-3 con el poder del jugador por día (ver **Mediciones**),
los 6 tipos de enemigo y 2 jefes nuevos (sprite provisional: parca con color), y que en el juego publicado salgan como
"Próximamente" hasta tener el arte (`etapa.arte`). Hecho cuando se jueguen en modo pruebas y el simulador las recorra.

## Plan
1. ✅ Aura: 10 niveles, +2 % a todo por nivel, con Esencia y oro; se ve bajo el personaje (tenue → late desde el 5 →
   muy brillante con destellos en el 10). Desde el nivel 40.
2. ✅ Rareza Ancestral: equipo por encima de mítico, solo del contenido alto.
3. Etapa 2 «Las ruinas del reino caído» (esqueletos, caballeros espectrales, gárgolas; jefe: Rey Liche) y Etapa 3
   «El Abismo» (diablillos, demonios de fuego, súcubos; jefe: Señor del Abismo). 10 niveles cada una.
4. Calabozos 5-8.
5. Torre: hitos desde el piso 100 (Esencia y Ancestral).
6. Calibrar todo con `node pruebas/progresion.js`: Etapa 2 para los días ~15-45 (poder 35-50 k), Etapa 3 para ~45-110;
   el aura y lo Ancestral deben seguir subiendo el poder hasta el nivel 80. Repartir la Esencia en consecuencia.
7. Arte: enemigos y jefes nuevos e iconos Ancestral (lista en **Arte pendiente**). Hasta entonces, lo nuevo se juega solo en
   modo pruebas con sprites provisionales (parcas con otro color); en el juego publicado sale "Próximamente".

## Última sesión
**2026-10-28 · Claude**
- Rareza Ancestral (`RAREZAS.ancestral`: ×7, 4 líneas extra, venta 3000, `soloContenidoAlto`), encantamiento hasta +30
  (+21..+30 al 10 %), desguace 50 almas, color turquesa (`.r-ancestral`). 4 piezas "de los Antiguos" (`casco_antiguo`,
  `arm_antiguo`, `esp_antigua`, `capa_antigua`) con color provisional. `objetoAncestral(ranura)` para los premios.
  La Fortuna ya no puede subir un objeto de cofre a Ancestral (`objetoAzar`).
- Arreglado: los perfiles sin Esencia (bots, perfiles de prueba cargados desde el menú 🧪) rompían el inventario y la barra
  de la herrería; la herrería ya no muestra la Esencia (no se usa ahí).
- `pruebas/equivalencia.js`: compara dos versiones del juego con las mismas 234 batallas, sin navegador (otra versión en
  un `git worktree`).
- Verificación: 234 batallas idénticas al commit anterior, 14/14 escenarios; Ancestral encanta hasta +30, 0 en 3000 cofres
  míticos con Fortuna alta; inventario y herrería sin errores.
- Commit en `qa` (ver `git log`).

## Decisiones
- 2026-10-28 · Contenido alto: etapas 2 y 3, calabozos 5-8 y hitos de la Torre desde el 100 (usuario). Arte nuevo: se
  espera (usuario); mientras, sprites provisionales solo en modo pruebas.
- 2026-10-28 · Fuentes de poder nuevas: rareza Ancestral (aceptada) y el aura de 10 niveles (idea del usuario: brilla
  ligeramente en el 5 y mucho en el 10).

## Arte pendiente
- Aura: hecha con CSS (no necesita imágenes).
- Equipo Ancestral: casco, armadura, espada y capa "de los Antiguos" (capas del guerrero como las demás piezas; hoy
  usan las de otra pieza con un filtro turquesa, `METAL.ancestral` y `TELA.ancestral`).
- (se completa en los pasos 2-5)

## Cómo verificar
- `node pruebas/equivalencia.js <otra versión>`: mismas batallas que antes (234 casos).
- `node pruebas/escenarios.js`, `node pruebas/sin-pantalla.js`, `node pruebas/progresion.js`.

## Mapa del código
- `js/logica/44-aura.js`, `js/pantalla/29-aura.js`, `pintarAura` (en `pantalla/12-vista-del-guerrero.js`).
- Ancestral: `RAREZAS`, `ENC_MAX`, `ALMAS_DESGUACE`, `MODELOS` (`*_antiguo/a`), `objetoAncestral` (`logica/21-tienda-cofres.js`).

## Bitácora
- 2026-10-28 · Claude · Aura (`6e66f3c`).
