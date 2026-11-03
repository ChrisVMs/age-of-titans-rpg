# Balance del Asesino

**Estado:** en curso · **Prioridad: ALTA** · **Rama:** qa · **Actualizado:** 2026-11-03

## Objetivo
Verificar con el simulador que el Asesino rinde parecido a las otras clases (daño, supervivencia, progresión por días).

## Próximo paso
Asesino ajustado (en el rango del guerrero, algo por encima en la Grieta). Pendiente aparte: el Arquero y la Maga rinden por
debajo del guerrero (Nv 80 en 1 de 3 semillas): proponer al usuario subirlos.

## Última sesión
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
