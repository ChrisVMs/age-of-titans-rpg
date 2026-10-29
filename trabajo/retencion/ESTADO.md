# Retención a largo plazo (meses y años)

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-29

## Objetivo
Que el jugador tenga algo que hacer hoy, esta semana y a largo plazo, como Wartune: una rutina diaria corta y gratificante,
un ciclo semanal con premios exclusivos y una progresión que no se termina en semanas.

## Próximo paso
**Paso 2: Eventos semanales rotativos** con premio exclusivo (títulos o skins de colección que solo salen ahí). Ver qué hay
en `eventoHoy` (eventos diarios) y en los títulos; proponer al usuario el formato antes de hacerlo.

## Plan
1. ✅ Barra de actividad diaria y semanal: cofres al completar 2/4/6 misiones del día y 3/5 de la semana (antes un solo
   bonus a las 5).
2. Eventos semanales rotativos con premio exclusivo (colección).
3. Estirar el tramo final para que maximizar lleve meses: va en el paso 6 de `contenido-nivel-alto` (estrellas o
   "despertar" por sistema con coste empinado, aura más cara).
4. Gremios (necesita servidor real): tecnología de gremio, jefe de gremio. Queda para cuando exista el servidor.

## Última sesión
**2026-10-29 · Claude**
- `BONUS_MISIONES` es ahora una lista de cofres por tipo (`{ meta, premio }`); `misionesHechas(R)`; los cofres se cobran
  con `reclamarMision(tipo, 'cofreN')`. Partidas viejas con `R.bonus`: se ignora.
- Pantalla de misiones: barra con los cofres encima (laten al estar listos) y la lista de premios debajo.
- Simulador: cobra los cofres.
- Verificación: 14/14 escenarios, igual con pantalla y sin ella; captura de la pantalla de misiones.

## Decisiones
- 2026-10-29 · Referencia Wartune: hoy / semana / largo plazo + social (usuario pidió hacerlo).

## Cómo verificar
- `node pruebas/escenarios.js`, `node pruebas/sin-pantalla.js`, `node pruebas/progresion.js`.

## Mapa del código
- `js/logica/39-misiones-diarias-semanales-y.js` (`BONUS_MISIONES`, `misionesHechas`, `bonusDisponible`),
  `js/logica/40-expediciones.js` (`reclamarMision`), `js/pantalla/26-expediciones.js` (`pintarMisiones`), CSS `.actividad`.
