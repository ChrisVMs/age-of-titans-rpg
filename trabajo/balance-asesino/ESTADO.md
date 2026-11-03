# Balance de clases (Asesino y cadena de clases)

**Estado:** en curso · **Prioridad: ALTA** · **Rama:** qa · **Actualizado:** 2026-11-03

## Objetivo
Verificar con el simulador que el Asesino rinde parecido a las otras clases (daño, supervivencia, progresión por días).

## Próximo paso
Que el usuario lo juegue. Si el Asesino se nota algo rápido contra monstruos (llega antes al Infierno de la Etapa 3),
afinar Puñalada o la Danza vigilando la matriz (`duelosClase`) para no romper la cadena.

## Última sesión
**2026-11-03 · Claude (cadena de clases y balance de las 4)**
- Pedido: guerrero > asesino/arquero (vida y resistencia), maga > guerrero (daño mágico atraviesa la resistencia),
  asesino/arquero > maga (daño físico y críticos); debilidad, no victoria segura.
- `VENTAJA_CLASE` + `BONO_VENTAJA_CLASE` (.2) + `ventajaClase` (09-clases-y-arbol-de.js), aplicado en
  `resolverAccionJugador` (sirve para tus golpes y los de reyes/bots; los monstruos no tienen clase).
- Herramienta de pruebas `duelosClase(a, b)` (2-simulador-de-batallas.js): mismo equipo y nivel, solo cambia la clase,
  mismas semillas con los lados cambiados (empates = medio punto). Matriz inicial: el arquero dominaba y el asesino era
  el más débil entre personajes.
- Ajustes: guerrero `mod` vida +10, defensa +10 · maga vida -15 → -10 y `penetracion` .15 · arquero ataque 10 → 8,
  Disparo ×2,2 → ×2,4, Perforante ×3,2 → ×2,6 · asesino crítico .07, daño crítico .15, Puñalada sangrado .15, Paso sombrío
  ×2,0 que ignora la armadura (`perfora`) y veneno .05.
- Matriz final (fila gana a columna): guerrero 77 % a asesino y 66 % a arquero · maga 71 % a guerrero · asesino 57 % y
  arquero 63 % a maga · asesino-arquero 46/54.
- Contra monstruos (3 semillas, 120 días, Nv 80): guerrero 114-120, arquero 112-118, maga 79-116 (1 no llega), asesino
  84-94 (algo más rápido; único que llega siempre al Infierno de la Etapa 3).
- Prueba nueva: la cadena (sistemas.js). 36/36 sistemas, 15/15 escenarios, igual con pantalla y sin ella.

**2026-11-03 · Claude**
- `simularProgresion` acepta `clase` (y `pruebas/progresion.js`, `"clase"` en la configuración).
- Medición inicial (mismas 3 semillas, 120 días): el Asesino muy por encima (Nv 80 días 54-94 en las 3; Etapa 3 Infierno
  días 6, 36 y 52; Grieta casi siempre 15; Torre 142-173). Guerrero: Nv 80 en 1 de 3 (día 67); Arquero y Maga: 1 de 3 (~116).
  Su poder no era mayor: rinde por las habilidades y la clase, que el poder no cuenta.
- Ajustes: clase `ataque` 12 → 6, `critico` .08 → .05, `danoCritico` .15 → .1 · Puñalada cada 3 turnos (antes 2), sangrado
  .15 → .1 · Paso sombrío veneno .15 → .08 (se apila en monstruos) · `BUFF_DANZA.dano` .5 → .3. El texto del nodo
  "Danza incesante" y la prueba de la Danza usan `BUFF_DANZA`.
- Medición final (6 semillas): Nv 80 días 80-116 (2 no llegan), Etapa 3 Infierno días 29-85 en 3 de 6, Grieta alta (13-15
  desde la semana 5). Guerrero (4 semillas): Nv 80 días 67-116, Grieta 5-15.
- Verificación: 15/15 escenarios, 35/35 sistemas, igual con pantalla y sin ella.

## Decisiones
- 2026-11-03 · Mantener la identidad (críticos y golpes rápidos) bajando números, no quitando mecánicas.

## Cómo verificar
`node pruebas/progresion.js <config>` con `"clase": "asesino"` (y las otras clases con las mismas semillas).

## Mapa del código
- `CLASES.asesino` (09-clases-y-arbol-de.js), `HAB_TODAS` punalada/paso/danza (24-habilidades.js), `BUFF_DANZA`
  (28-efectos-de-estado.js), `ARBOL.asesino`.

## Bitácora
- 2026-11-03 · Claude · Medido contra las otras clases y ajustado.
- 2026-10-31 · Claude · Tema creado.
