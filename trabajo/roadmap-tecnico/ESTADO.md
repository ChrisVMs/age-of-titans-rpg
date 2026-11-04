# Roadmap técnico (consolidar antes de añadir)

**Estado:** en curso · **Rama:** `claude/practical-dirac-8mg4et` (PR) · **Actualizado:** 2026-11-04

## Objetivo
Lo rescatable de una revisión externa (hecha sobre una versión anterior del proyecto), de lo más crítico a lo menos:
que el motor sea determinista, que probar sea rápido y que el balance se mida antes de añadir contenido.

## Próximo paso
El usuario decide qué propuestas aplicar: clases (Fase 3, "Hallazgos de clases") y economía (Fase 4, `economia.md`).
Luego Fase 5: textos y valores mostrados frente al código.

## Última sesión
**2026-11-04 · Claude** (Fase 4, medición)
- Cambios: `pruebas/economia.js` · entradas/salidas/saldo de oro, cristales, estamina y cada material por periodo (1-7,
  8-30, 31-60, 61-90, 91-180) y por tipo de jugador. Cada cambio se anota con la función del juego que lo hizo (propiedades
  vigiladas instaladas desde `revisarDia`; el juego no se toca). ⚠ si algo se acumula (>3× lo gastado) o casi no entra.
  Opciones: `--dias`, `--tipos`, `--semillas`, `--detalle` (de dónde entra y en qué se gasta). ~3 min con 180 días.
- Cambios: `trabajo/roadmap-tecnico/economia.md` · respuestas por recurso y propuestas.
- Sin commit: nada. Verificación: corrida de 180 días × 3 tipos × 2 semillas. No se tocó el balance.

## Hallazgos de clases (2026-11-04, nivel 60, 1000 duelos por lado)
- Cadena PvP correcta: guerrero 82 % a asesino y 81 % a arquero; mago 85 % a guerrero; asesino 60 % y arquero 62 % a mago.
  Fuera de la cadena: arquero 58 % a asesino. Media: guerrero 59 %, mago 54 %, arquero 46 %, **asesino 40 %** (el más flojo).
- **Arquetipos poco viables**: la primera rama gana casi siempre (furia 58 %, precisión 46 %, fuego 54 %, frente a
  baluarte 35 %, cacería 20 %, venenos 26 %, hielo 36 %, arcano 33 %). En el asesino la mejor es sombras (49 %), no filo.
  Los bots usan la primera rama por defecto.
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
- Fase 3 (medición de clases): `pruebas/clases.js` · rama del PR. Falta decidir ajustes.
- Fase 4 (medición de economía): `pruebas/economia.js` + `economia.md` · rama del PR. Falta decidir ajustes.

## Pendiente
1. Opcional: GitHub Actions con `node pruebas/todo.js` en cada PR.
2. **Fase 3 · Ajustes de clases** (decide el usuario): ramas 2 y 3 de cada árbol, asesino en PvP, Asmodeo y guerrero.
3. **Fase 4 · Ajustes de economía** (decide el usuario): ver propuestas en `economia.md` (polvo, piedra, oro tras Nv 80,
   cristales en el simulador). El día de la semana en que se empieza cambia mucho el oro final (1,5-4,6 M a 90 días).
4. **Fase 5 · Textos vs. valores:** que las reglas y premios mostrados coincidan con el código.
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
- 2026-11-04 · Claude · Fase 3: `pruebas/clases.js` (matriz PvP, arquetipos, PvE); hallazgos sin aplicar.
- 2026-11-04 · Claude · Fase 2: `todo.js` rápido/completo, `metricas.js` + `referencia.json`, equivalencia con el mismo reloj.
- 2026-11-04 · Claude · Fase 1: causa raíz con/sin pantalla (Ecos), `revisarDia`, fecha fija, sin-pantalla con la partida entera.
