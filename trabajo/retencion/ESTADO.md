# Retención a largo plazo (meses y años)

**Estado:** pausado (espera: servidor real para el Pacto y las Invasiones) · **Rama:** `qa` · **Actualizado:** 2026-10-29

## Objetivo
Que el jugador tenga algo que hacer hoy, esta semana y a largo plazo, como Wartune: una rutina diaria corta y gratificante,
un ciclo semanal con premios exclusivos y una progresión que no se termina en semanas.

## Próximo paso
Lo que queda (Pacto de compañeros e Invasiones) necesita servidor real y notificaciones: preguntar al usuario cuando
exista. Estirar el tramo final sigue en el paso 6 de `contenido-nivel-alto`.

## Plan
Referencia Wartune (mismas intenciones, mecánicas propias). Orden acordado: Grieta → Despertar → Campamento → Ecos → Pacto e
invasiones cuando haya servidor.
1. ✅ Barra de actividad diaria y semanal (cofres a 2/4/6 y 3/5 misiones).
2. ✅ Evento semanal: tema rotativo que da fichas; tienda con límite semanal y título exclusivo del tema.
3. ✅ Recargas de estamina (3 anuncios + 1 con cristales al día) y cristales (misiones y capítulos completos).
4. Estirar el tramo final (maximizar en meses, no en ~24 días): ver paso 6 de `contenido-nivel-alto` y el paso 6 aquí.
5. ✅ **La Grieta**: 15 pisos semanales sembrados, la vida no se recupera, 1 de 3 bendiciones tras cada piso,
   2 intentos por semana, se cobra solo lo nuevo. Dificultad según lo más difícil superado en la campaña.
6. ✅ **Despertar**: al máximo, mascota/runa/reliquia se "despierta" (efecto visual + pasiva única) con Esencia.
7. ✅ **Ruinas del campamento**: edificios que dan un bono pequeño y producen recursos mientras no juegas (con tope).
8. ✅ **Ecos**: 3-5 bots rivales con memoria que suben contigo; te retan en la arena; ranking semanal contra ellos.
9. ✅ **Códice de colección**: sets completos (bestiario por etapa, títulos por rareza) dan bono permanente y marco.
10. **Pacto de compañeros** (gremio sin servidor: 3 héroes, tecnologías comunes, jefe semanal). Cuando haya servidor.
11. **Invasiones** del campamento a horas fijas (oleada con los bots; 30 min). Necesita notificaciones en móvil.

No copiar de Wartune: VIP agresivo / pago para ganar, decenas de monedas, pantallas llenas de puntos rojos.

## Última sesión
**2026-10-29 · Claude (Códice)**
- Ampliada la Colección (`js/logica/14-coleccion.js`), no un sistema aparte: 5 colecciones nuevas (Títulos, Piezas de
  set, Bestiario Etapa 2 y 3, Cazador veterano: 100 derrotas por enemigo), `HITOS_COLECCION` (25/50/75/100 %: 💎 y 🎟️,
  una vez; `reclamarHito`, `hitosPendientes`), `MARCOS` de perfil (al 100 %; `marcoActual`, `ponerMarco`), título
  Exterminador. Las piezas de set se anotan al desguazar (`anotarPiezas`). Las colecciones vacías (etapas sin publicar)
  no se muestran ni cuentan.
- Pantalla: hitos en cada colección, selector de marco; marco en el avatar del Campamento y en tu ficha del Ranking (CSS);
  punto rojo en Colección con hitos por cobrar. `textoPremio` conoce las fichas (🎟️).
- Simulador cobra los hitos. Medición: ~20 de 36 hitos el día 30, 22-23 el día 150 (lo demás es muy largo).
- Verificación: 22/22 sistemas (3 del Códice), 14/14 escenarios, igual con pantalla y sin ella; capturas.

**2026-10-29 · Claude (Ecos)**
- `js/logica/50-ecos.js`: `ECOS` (datos: curva de fuerza, estilo, frases, título), `ECO_BASE` (1,7), venganza
  (`VENGANZA_PASO`/`VENGANZA_MAX`), reto del día sembrado (`revisarEcos`), `batallaEco` (motor de arena, gratis),
  `resultadoEco` (desde `cobrarResultado`), `puntosEco`/`rankingEcos` (sin estado: sembrados por semana y día),
  premio el lunes (`PREMIO_RANKING_ECOS`: 💎 y 🎟️), títulos `eco_<id>` a las 10 victorias. Puntos tuyos: retos,
  pisos de la Torre y de la Grieta. Desbloqueo con la Arena (Nv 15).
- Pantalla: pestaña "Ecos" en 🏅 Ranking (reto, historial, ranking); punto rojo en Ranking con el reto pendiente.
  Huir del reto = derrota (como la arena).
- Simulador y bot visual aceptan el reto cada día. Medición (3 semillas, 90 días): ganas el 32-86 % según el Eco
  (media ~62 %); con `ECO_BASE` 1 era el 97-100 %.
- Verificación: 19/19 sistemas (3 de los Ecos), 14/14 escenarios, igual con pantalla y sin ella; captura y reto en navegador.

**2026-10-29 · Claude (Ruinas del campamento)**
- `js/logica/49-ruinas.js`: `EDIFICIOS` (datos: producción por hora y nivel, bono), `costeEdificio`, `produccionRuinas`,
  `recogerRuinas` (guarda decimales), `mejorarEdificio` (recoge antes), `statsRuinas`, `bonoRuinas`, `horasAlmacen`.
  Tiempo del juego (`ahoraJuego`); reloj hacia atrás = nada. Sin esperas. Desbloqueo `pRuinas` en el nivel 5.
- Bonos enchufados: `estadisticas` (vida/defensa), oro de batalla (`cobrarResultado`), `costeEncantar` (Forja).
  Cambio sobre la propuesta: el Laboratorio da +defensa (el refinado no tiene un sitio limpio para "mejor prob.").
- Pantalla `js/pantalla/33-ruinas.js` (filas, producción por día) e icono 🏚️ con punto rojo al pasar del 50 %.
- Simulador: recoge cada día y mejora el edificio más barato con oro de sobra (3× el coste); el bot visual también.
- Coste ×10 tras medir (con el primero se completaban en ~30 días): ahora 60 niveles hacia los días 90-150.
  Producción: ~3 % del oro total; Pozo ~2,5 🌟/día.
- Verificación: 16/16 sistemas (3 de ruinas), 14/14 escenarios, igual con pantalla y sin ella; captura del panel.

**2026-10-29 · Claude (Despertar)**
- `js/logica/06b-despertar.js` (carga antes de mascotas/skins/reliquias): `TIPOS_DESPERTAR` (mascota, reliquia, skin),
  `COSTE_DESPERTAR` (5 niveles, 560 🌟 por objeto), `PCT_DESPERTAR` (+10 % del bono por nivel), pasivas en D3
  (`PASIVA_MASCOTA` repetir acción, `PASIVA_RELIQUIA` 50 % a aliados, `PASIVA_SKIN` +5 al efecto y +3 al tope), visual en D5.
  Desbloqueo `despertar` en el nivel 50.
- Aplicado en `efectoMascota`, `estadisticas` (bono de mascota), `resolverMascota`, `bonoSkinBase`/`valorSkin`, `efecto`
  (tope), `efectoReliquias`, `golpesEstado`, `efectoReliquiasAliados` (aliados en `unidadJugador`) y los textos.
- Pantalla `js/pantalla/32-despertar.js`: `botonDespertar` en las fichas de mascota, skin y reliquia al máximo. CSS D5.
- Esencia (la llenaba en un mes): `ESENCIA_ETAPA` 2/3, `ESENCIA_BARRIDO` .04 con decimales acumulados
  (`jugador.restoEsencia`), `ESENCIA_CALABOZO` 5/10. El simulador mide la Esencia por fuente.
- Medición (3 semillas): despertar total D9-D12 el día 30, D20-D23 hacia el día 90-120; el poder sube hasta entonces.
  El Nv 80 sigue llegando rápido (días 35-52): va al paso 6 de `contenido-nivel-alto`.
- Verificación: 13/13 sistemas (3 del despertar), 14/14 escenarios, igual con pantalla y sin ella.

**2026-10-29 · Claude (Grieta)**
- `js/logica/47-grieta.js`: `GRIETA_PISOS`, `GRIETA_INTENTOS`, `BENDICIONES` (datos), `GRIETA_ESCALA`, `pisoGrieta`,
  `batallaGrieta`, `grietaTerminada` (desde `cobrarResultado`), `elegirBendicion`, `bendicionSugerida`. Salir a mitad de un
  piso = derrota (`enCurso`). Sin estamina. Desbloqueo `pGrieta` en el nivel 25.
- Motor: `prepararBatalla` acepta `c.stPct` (bonos solo de esa batalla) y `c.vidaYo` (vida inicial en fracción).
- Campaña: `nPoderCampana()` (n equivalente más alto superado, contando la dificultad). La Grieta escala con eso: con el
  nivel se volvía imposible en el tramo final (el nivel sube y el poder no).
- Pantalla `js/pantalla/31-grieta.js` e icono 🌀 en el Campamento. Bot visual y simulador la juegan.
- Medición (3 semillas): mejor piso por semana 6-14 tras la primera (la primera, 9-15).
- Verificación: 10/10 sistemas (3 de la Grieta), 14/14 escenarios, igual con pantalla y sin ella; en navegador: pantalla,
  batalla con la vida arrastrada, bendiciones.

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
