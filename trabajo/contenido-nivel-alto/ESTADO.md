# Contenido de nivel alto

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-28

## Objetivo
Que el tramo largo (nivel 30 → 80, ~3,5-4 meses con el balance nuevo) tenga retos y progreso. Hoy el poder del jugador se
estanca hacia el día 24 (~50 k: todo al máximo) y los jefes, reyes y la Torre alta caen mucho antes del nivel 80.

## Próximo paso
**Paso 2: rareza Ancestral** (por encima de mítica): modelos de equipo, su máximo de encantamiento y valores, y de dónde
sale (Etapa 3, calabozos 5-8, hitos de la Torre desde el 100). Con iconos provisionales hasta que llegue el arte.

## Plan
1. ✅ Aura: 10 niveles, +2 % a todo por nivel, con Esencia y oro; se ve bajo el personaje (tenue → late desde el 5 →
   muy brillante con destellos en el 10). Desde el nivel 40.
2. Rareza Ancestral: equipo por encima de mítico, solo del contenido alto.
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
- Aura: `js/logica/44-aura.js` (`nivelAura`, `costeAura`, `subirAura`, `statsAura`, en `estadisticas`), material
  `esencia` (`MATERIALES`, partidas viejas con 0), desbloqueo `aura` en Nv 40. Pantalla: `pintarAura` en
  `pantalla/12-vista-del-guerrero.js` (Campamento, vitrina del Héroe, batalla 1 contra 1 y unidades de grupo con el aura
  de cada jugador), pestaña "Aura" del Héroe (`pantalla/29-aura.js`), CSS `.aura` en `index.html`.
- `js/logica/43-lista.js` pasó a `99-lista.js` (siempre la última de la lógica).
- Verificación: 14/14 escenarios, `sin-pantalla.js` en verde, capturas del aura en los niveles 3, 5 y 10 (Campamento,
  pestaña, batalla) sin errores. Coste provisional (10 × nivel de Esencia y 15 000 × nivel de oro): se ajusta en el paso 6.
- Commit en `qa` (ver `git log`).

## Decisiones
- 2026-10-28 · Contenido alto: etapas 2 y 3, calabozos 5-8 y hitos de la Torre desde el 100 (usuario). Arte nuevo: se
  espera (usuario); mientras, sprites provisionales solo en modo pruebas.
- 2026-10-28 · Fuentes de poder nuevas: rareza Ancestral (aceptada) y el aura de 10 niveles (idea del usuario: brilla
  ligeramente en el 5 y mucho en el 10).

## Arte pendiente
- Aura: hecha con CSS (no necesita imágenes).
- (se completa en los pasos 2-5)

## Cómo verificar
- `node pruebas/escenarios.js`, `node pruebas/sin-pantalla.js`, `node pruebas/progresion.js`.

## Mapa del código
- `js/logica/44-aura.js`, `js/pantalla/29-aura.js`, `pintarAura` (en `pantalla/12-vista-del-guerrero.js`).

## Bitácora
