# Roadmap técnico (consolidar antes de añadir)

**Estado:** en curso · **Rama:** `claude/practical-dirac-8mg4et` (PR) · **Actualizado:** 2026-11-04

## Objetivo
Lo rescatable de una revisión externa (hecha sobre una versión anterior del proyecto), de lo más crítico a lo menos:
que el motor sea determinista, que probar sea rápido y que el balance se mida antes de añadir contenido.

## Próximo paso
Fases 1-5 hechas. Que el usuario juegue las ramas nuevas y decida lo pendiente: asesino en PvP (40 %), Asmodeo frente al
guerrero y las propuestas de economía (`economia.md`).

## Última sesión
**2026-11-05 · Claude** (crítico solo de asesino y arquero; pedido del usuario)
- Usuario (2026-11-04): "critico deberia ser parte de la faceta de asesino - arquero, NO de mago - guerrero […] Deberia
  poder adquirir critico? si pero por otros medios: atributos en el equipamiento […] tendria costo".
- Antes (nivel 60, mismo equipo): crítico guerrero 22 %, maga 21 % (5 % base de todos + 9-10 % del árbol + equipo y runa).
- Cambios: `04-atributos-estrellas-y-rarezas.js` · `BASE_SEC` sin crítico · `09-clases-y-arbol-de.js` · arquero 5 → 10 % y
  asesino 7 → 12 % de crítico de clase (el 5 % base pasa a ellos) · Golpe certero (guerrero): crítico → +3 % de penetración
  por rango · Combustión (maga): crítico → +4 % de daño de habilidades por rango.
- Ahora: guerrero y maga 7 % (solo su línea de equipo y su runa de crítico); asesino 29 %, arquero 27 %, igual que antes.
- Efecto: PvP casi igual (la ventaja del guerrero es la cadena y la resistencia). Jefes: guerrero 74 → 67 % a Cerbero y
  97 → 85 % a Asmodeo. Progresión del simulado (guerrero) a 90 días: poder y Torre -8 %; oro de jefes -63 %.
  `pruebas/referencia.json` actualizada.
- Prueba nueva en `sistemas.js`: ni la base, ni la clase, ni el árbol dan crítico al guerrero o a la maga.
- Sin commit: nada. Verificación: `todo.js completo` 6/6 (sistemas 49/49).

## Hallazgos de clases (2026-11-04, nivel 60, 1000 duelos por lado)
- Cadena PvP correcta: guerrero 82 % a asesino y 81 % a arquero; mago 85 % a guerrero; asesino 60 % y arquero 62 % a mago.
  Fuera de la cadena: arquero 58 % a asesino. Media: guerrero 59 %, mago 54 %, arquero 46 %, **asesino 40 %** (el más flojo).
- **Arquetipos poco viables**: la primera rama gana casi siempre (furia 58 %, precisión 46 %, fuego 54 %, frente a
  baluarte 35 %, cacería 20 %, venenos 26 %, hielo 36 %, arcano 33 %). En el asesino la mejor es sombras (49 %), no filo.
  Los bots usan la primera rama por defecto.
- **Causa (2026-11-04):** la última habilidad de la primera rama es una **habilidad nueva** (golpe aplastante, flecha
  perforante, meteoro; en el asesino, Danza incesante). Sin ella (`--probar` con `max = 0`) las ramas del guerrero quedan
  en 48-57 % y las del mago en 42-48 %. Subir nodos pasivos de las ramas 2 y 3 (~+30 %) solo mueve 3-6 puntos.
  Cacería y venenos son flojas incluso así (27 % y 42 %), y cacería rinde peor que precisión contra jefes.
- PvE parejo en Torre (asesino 69, el resto 72-74). **Asmodeo favorece al guerrero**: le quita un 93 % por intento
  (24 rondas), frente al 50-63 % de las demás clases.

## Decisiones
- 2026-11-04 · Se trabaja en ramas con pull request (no directo en `main`) · lo pidió el usuario: "ya implementé pull request".
- 2026-11-04 · Plan aprobado por el usuario: fases 1-5 de abajo. Se descarta por ahora migrar a ES Modules, reorganizar
  en `src/`, registro de sistemas y contratos de backend: mucho riesgo y ningún problema medido que lo pida.
- 2026-11-04 · Hallazgos ya resueltos de la revisión: curación de Asmodeo 4 % (`26-jefe-mundial-asmodeo.js`); la vida de
  los jefes (Asmodeo 28 000) es recalibración intencional del 2026-11-03, no un error; azar centralizado en `rnd`/`sembrar`.

## Hecho
- Fase 1 (determinismo): causa raíz, `revisarDia`, fecha fija en pruebas, sin-pantalla reforzado · rama del PR.
- Fase 2 (ejecutor único): `todo.js`, `metricas.js` + `referencia.json`, equivalencia con el mismo reloj · rama del PR.
- Fase 3 (clases): `pruebas/clases.js` y ajuste de las ramas 2 y 3 · rama del PR.
- Fase 4 (medición de economía): `pruebas/economia.js` + `economia.md` · rama del PR. Falta decidir ajustes.
- Fase 5 (textos vs valores): 5 textos corregidos, textos generados desde constantes y prueba automática · rama del PR.

## Pendiente
1. Opcional: GitHub Actions con `node pruebas/todo.js` en cada PR.
2. **Fase 3 · Resto** (decide el usuario): asesino en PvP (40 %), Asmodeo frente al guerrero (le quita 97 % por intento).
3. **Fase 4 · Ajustes de economía** (decide el usuario): ver propuestas en `economia.md` (polvo, piedra, oro tras Nv 80,
   cristales en el simulador). El día de la semana en que se empieza cambia mucho el oro final (1,5-4,6 M a 90 días).
4. Textos aún escritos a mano con números (sin prueba): descripciones sueltas en `js/pantalla/`; revisar si aparecen fallos.
5. Menor: el Minotauro tiene su propio generador (`27-…:41`); pasarlo a `azarSemilla`.

## Cómo verificar
`node pruebas/todo.js` (rápido) · `node pruebas/todo.js completo` (antes de integrar cambios de motor o balance) ·
`node pruebas/economia.js` (tras tocar premios o costes).

## Mapa del código
- `revisarDia()` (`js/logica/42-campamento.js`): renovaciones del día; lo nuevo que se renueve "al consultarlo" va aquí.
- `FECHA_PRUEBAS` (`pruebas/cargar.js`): fecha de todas las pruebas sin navegador.

## Cuidado con
- Lo que se renueva de forma perezosa (`if (X.dia !== hoy())`, `if (E.semana !== semana())`) da resultados distintos según
  quién lo consulte primero: añadirlo a `revisarDia`.
- Cambiar `FECHA_PRUEBAS` cambia los números de progresión (eventos por día de la semana).

## Bitácora
- 2026-11-04 · Claude · Fase 5: 5 textos corregidos; reglas de jefes, sets y nodos de habilidad desde constantes.
- 2026-11-04 · Claude · Fase 3: ramas 2 y 3 competitivas (bono en nodos finales); referencia actualizada.
- 2026-11-04 · Claude · Fase 4: `pruebas/economia.js` + `economia.md` (180 días, 3 tipos); sin aplicar.
- 2026-11-04 · Claude · Fase 3: `--probar` en clases.js; causa: habilidad nueva al final de la primera rama.
- 2026-11-04 · Claude · Fase 3: `pruebas/clases.js` (matriz PvP, arquetipos, PvE); hallazgos sin aplicar.
- 2026-11-04 · Claude · Fase 2: `todo.js` rápido/completo, `metricas.js` + `referencia.json`, equivalencia con el mismo reloj.
- 2026-11-04 · Claude · Fase 1: causa raíz con/sin pantalla (Ecos), `revisarDia`, fecha fija, sin-pantalla con la partida entera.
