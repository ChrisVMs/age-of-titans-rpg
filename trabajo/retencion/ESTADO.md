# Retención a largo plazo (meses y años)

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-29

## Objetivo
Que el jugador tenga algo que hacer hoy, esta semana y a largo plazo, como Wartune: una rutina diaria corta y gratificante,
un ciclo semanal con premios exclusivos y una progresión que no se termina en semanas.

## Próximo paso
**Paso 3** va en el paso 6 de `contenido-nivel-alto` (estirar el tramo final). Aquí queda opcional: ranking semanal de
fichas contra los bots, con premio por puesto (pedir visto bueno al usuario).

## Plan
1. ✅ Barra de actividad diaria y semanal: cofres al completar 2/4/6 misiones del día y 3/5 de la semana (antes un solo
   bonus a las 5).
2. ✅ Evento semanal: tema rotativo (6 temas) que da fichas; tienda de fichas con límite semanal y el título exclusivo del tema.
3. Estirar el tramo final para que maximizar lleve meses: va en el paso 6 de `contenido-nivel-alto` (estrellas o
   "despertar" por sistema con coste empinado, aura más cara).
4. Gremios (necesita servidor real): tecnología de gremio, jefe de gremio. Queda para cuando exista el servidor.

## Última sesión
**2026-10-29 · Claude (recargas, cristales y bot)**
- `js/logica/46-recargas-y-cristales.js`: `ANUNCIOS_DIA` × `ESTAMINA_ANUNCIO`, `RECARGA_CRISTALES` (1 al día),
  `cobrarAnuncio`, `recargarConCristales`, `premioCapitulo` (cristales la 1.ª vez que se completa una etapa en cada
  dificultad, `CRISTALES_CAPITULO`). Cristales también en los cofres de misiones. `darPremio` y `textoPremio` los conocen.
- `js/pantalla/30-recargas.js`: tocar ⚡ (HUD o Campamento) abre las recargas. `ui.verAnuncio` da el anuncio por visto:
  **la app Android debe cambiarlo por el anuncio real (SDK).**
- Bot "🤖 Bot: jugar solo": sin nada que jugar → anuncios → cristales → gasta como el simulador y pasa al día siguiente,
  hasta que se pare (`botRecargarOPasarDia`).
- Pendiente: el simulador sigue usando `estaminaExtra` fijo; no gasta cristales.
- Verificación: 7/7 sistemas, 14/14 escenarios, igual con pantalla y sin ella; en navegador, recargas y cambio de día.

**2026-10-29 · Claude (evento semanal)**
- `js/logica/45-evento-semanal.js`: `TEMAS_SEMANA` (datos: evento de misión que cuenta, fichas por unidad, título
  exclusivo), `TIENDA_EVENTO`, `TOPE_FICHAS_SEMANA`, `temaSemana`, `sumarFichas` (desde `contarMision`), `comprarEvento`.
  Desbloqueo `evSemana` en el nivel 10. Títulos `ev_<tema>` añadidos a `TITULOS`.
- Pantalla: pestaña "Evento" en Misiones (punto rojo si alcanza para el título).
- `pruebas/sistemas.js`: pruebas de sistemas fuera del combate (barra de actividad, evento). CLAUDE.md lo pide.
- Simulador: compra el título y luego todo lo de la tienda. El Nv 80 baja a los días 40-46 (la estamina comprada): va
  al paso 6 de `contenido-nivel-alto`.
- Verificación: 4/4 sistemas, 14/14 escenarios, igual con pantalla y sin ella; captura de la pestaña.

**2026-10-29 · Claude (barra de actividad)**
- `BONUS_MISIONES` es ahora una lista de cofres por tipo (`{ meta, premio }`); `misionesHechas(R)`; los cofres se cobran
  con `reclamarMision(tipo, 'cofreN')`. Partidas viejas con `R.bonus`: se ignora.
- Pantalla de misiones: barra con los cofres encima (laten al estar listos) y la lista de premios debajo.
- Simulador: cobra los cofres.
- Verificación: 14/14 escenarios, igual con pantalla y sin ella; captura de la pantalla de misiones.

## Decisiones
- 2026-10-29 · Evento semanal: tema semanal + fichas para la tienda (usuario eligió ambos).
- 2026-10-29 · Referencia Wartune: hoy / semana / largo plazo + social (usuario pidió hacerlo).

## Cómo verificar
- `node pruebas/escenarios.js`, `node pruebas/sin-pantalla.js`, `node pruebas/progresion.js`.

## Mapa del código
- `js/logica/39-misiones-diarias-semanales-y.js` (`BONUS_MISIONES`, `misionesHechas`, `bonusDisponible`),
  `js/logica/45-evento-semanal.js`, `js/logica/40-expediciones.js` (`reclamarMision`), `js/pantalla/26-expediciones.js` (`pintarMisiones`), CSS `.actividad`.
