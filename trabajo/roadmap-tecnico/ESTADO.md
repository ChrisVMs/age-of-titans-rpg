# Roadmap técnico (consolidar antes de añadir)

**Estado:** en curso · **Rama:** `claude/practical-dirac-8mg4et` (PR) · **Actualizado:** 2026-11-04

## Objetivo
Lo rescatable de una revisión externa (hecha sobre una versión anterior del proyecto), de lo más crítico a lo menos:
que el motor sea determinista, que probar sea rápido y que el balance se mida antes de añadir contenido.

## Próximo paso
Fase 3: matriz de clases 4×4 (PvP y PvE) como prueba de `pruebas/` (muchas semillas, victorias, duración, daño), con su
resumen en `todo.js completo`.

## Última sesión
**2026-11-04 · Claude** (Fase 2)
- Cambios: `pruebas/todo.js` · ejecutor único en paralelo: rápido (escenarios, sistemas, sin-pantalla 10 días) ~15 s;
  `completo` (+ sin-pantalla 20 días, métricas, equivalencia con `--contra=<ref>`, por defecto `origin/main`) ~95 s.
- Cambios: `pruebas/metricas.js` · promedios por semilla (un hilo cada una) de nivel, poder, Torre, oro y aura en los días
  7/30/60/90/180 y oro por fuente; compara con `pruebas/referencia.json` (±10 % ⚠) y avisa de fuentes que dan >50 % del oro.
  Opciones: `--dias`, `--semillas`, `--tipo`, `--guardar-referencia`.
- Cambios: `pruebas/equivalencia.js` · la otra versión usa el mismo reloj fijo (si no, arena y jefes salían distintos por fecha).
- Cambios: `CLAUDE.md` · "Al terminar" usa `todo.js`.
- Sin commit: nada. Verificación: `todo.js` 3/3; `todo.js completo` 5/5; equivalencia con `origin/main`: 0 distintos de 234.

## Decisiones
- 2026-11-04 · Se trabaja en ramas con pull request (no directo en `main`) · lo pidió el usuario: "ya implementé pull request".
- 2026-11-04 · Plan aprobado por el usuario: fases 1-5 de abajo. Se descarta por ahora migrar a ES Modules, reorganizar
  en `src/`, registro de sistemas y contratos de backend: mucho riesgo y ningún problema medido que lo pida.
- 2026-11-04 · Hallazgos ya resueltos de la revisión: curación de Asmodeo 4 % (`26-jefe-mundial-asmodeo.js`); la vida de
  los jefes (Asmodeo 28 000) es recalibración intencional del 2026-11-03, no un error; azar centralizado en `rnd`/`sembrar`.

## Hecho
- Fase 1 (determinismo): causa raíz, `revisarDia`, fecha fija en pruebas, sin-pantalla reforzado · rama del PR.
- Fase 2 (ejecutor único): `todo.js`, `metricas.js` + `referencia.json`, equivalencia con el mismo reloj · rama del PR.

## Pendiente
1. Opcional: GitHub Actions con `node pruebas/todo.js` en cada PR.
2. **Fase 3 · Clases:** matriz 4×4 (PvP y PvE), muchas semillas, victorias + duración + daño (cruza con `balance-asesino`).
3. **Fase 4 · Economía:** entradas/salidas por recurso a 30/90/180 días y por tipo de jugador. Hallazgo ya medido: el
   **barrido** da 80-140 M de oro en 90 días (20-40× cualquier otra fuente); con la semilla 2 el jugador llega a Nv 80 hacia
   el día 89 y acumula 65 M sin uso. Y el día de la semana en que se empieza cambia mucho el oro final (1,5-4,6 M).
4. **Fase 5 · Textos vs. valores:** que las reglas y premios mostrados coincidan con el código.
5. Menor: el Minotauro tiene su propio generador (`27-…:41`); pasarlo a `azarSemilla`.

## Cómo verificar
`node pruebas/todo.js` (rápido) · `node pruebas/todo.js completo` (antes de integrar cambios de motor o balance).

## Mapa del código
- `revisarDia()` (`js/logica/42-campamento.js`): renovaciones del día; lo nuevo que se renueve "al consultarlo" va aquí.
- `FECHA_PRUEBAS` (`pruebas/cargar.js`): fecha de todas las pruebas sin navegador.

## Cuidado con
- Lo que se renueva de forma perezosa (`if (X.dia !== hoy())`, `if (E.semana !== semana())`) da resultados distintos según
  quién lo consulte primero: añadirlo a `revisarDia`.
- Cambiar `FECHA_PRUEBAS` cambia los números de progresión (eventos por día de la semana).

## Bitácora
- 2026-11-04 · Claude · Fase 1: causa raíz con/sin pantalla (Ecos), `revisarDia`, fecha fija, sin-pantalla con la partida entera.
