# Generador de jugadores bot

**Estado:** en curso · **Prioridad: ALTA** · **Rama:** qa · **Actualizado:** 2026-11-03

## Objetivo
Hasta 99 bots que simulen un servidor real: progresión por días con poder variado, automática y al ritmo de juego del
usuario, sin intervención manual. Solo para pruebas: no influye en el núcleo del juego y se quitará más adelante.

## Próximo paso
Que el usuario lo pruebe (ranking, arena, Ecos, reyes, aliados con los bots nuevos) y decida ajustes: número de bots,
ritmos, días de inicio. Opcional: modo rápido (sin combate golpe a golpe) si en móvil va lento.

## Última sesión
**2026-11-03 · Claude (jugadores reales)**
- Los bots empezaban con el botín del modo pruebas (10 000 oro, 300 piedras…) y hasta 5 días antes del día 1: el día 1
  había bots de 30 k. Ahora empiezan con lo del juego publicado (`INICIO_REAL_BOT`: 3000 oro, 20 piedras, 5 polvo, 0 almas,
  esencia y cristales) y como mucho 2 días antes (`INICIO_BOT` -2..20). `VERSION_SERVIDOR` 2: el servidor guardado se rehace solo.
- Medido (3 días, un bot por ritmo): día 1 entre 2,0 k y 2,7 k de poder; intenso día 3 ~8,9 k; casual ~2,6 k.
- Prueba nueva: empiezan sin ventajas. 35/35 sistemas.

**2026-11-03 · Claude**
- Diseño acordado: incremental (cada bot guarda su partida y solo se simula el día que falta) + varios hilos (Web Workers,
  uno por núcleo hasta 4) + asíncrono (se pausa en tus batallas, guarda cada bot al terminar).
- `js/pruebas/4-servidor-bots.js` (puro, se prueba en Node): `BOTS_SERVIDOR` (99), `RITMOS_BOT` (casual/normal/intenso:
  estamina extra y probabilidad de jugar), `INICIO_BOT` (día del servidor en que empieza: -5 a 20), `planServidor`,
  `diasPendientesBot`, `juegaBot`, `avanzarBot` (usa `simularProgresion` día a día).
- `js/pruebas/servidor-hilo.js`: hilo que carga la lógica una vez y avanza los bots que le mandan.
- `js/pruebas/8-servidor-bots-pantalla.js`: arranca solo en modo pruebas; IndexedDB (`batalla-servidor`: `meta` y
  `bot:<id>`); cola de los más atrasados; reparte a los hilos de a 3 días; sin hilos (file://) simula de a un día en el hilo
  principal. Los bots que ya empezaron pasan a `cacheBots` (ranking, arena, Ecos, reyes, aliados). Estado en el menú de
  pruebas: "🌐 Servidor día N · X/99 bots · al día / simulando" y "Reiniciar servidor".
- Cambios en el juego: ninguno (solo js/orden.json e index.html cargan los 2 archivos de pruebas).
- Verificación: 34/34 sistemas (3 del servidor), 15/15 escenarios, igual con pantalla y sin ella. Navegador: 3 hilos,
  día 1 al día en ~40 s (28 bots), "Día +2" retoma solo (36 bots), ranking con los bots; file:// sin hilos también avanza.

## Decisiones
- 2026-11-03 · Automático y al ritmo del usuario; en paralelo y asíncrono; con combate real (no el modo rápido) · usuario.
- 2026-11-03 · Solo pruebas, fácil de probar y de quitar, sin tocar el núcleo · usuario.

## Cómo verificar
- `node pruebas/sistemas.js` (pruebas "Servidor de bots").
- En el juego (modo pruebas): menú 🧪, línea "🌐 Servidor…"; el ranking muestra los bots.

## Mapa del código
- `js/pruebas/4-servidor-bots.js`, `js/pruebas/servidor-hilo.js`, `js/pruebas/8-servidor-bots-pantalla.js`.
- Se engancha al juego solo con `cacheBots` (lista que ya usaba `bots()` en `js/logica/35-bots-del-servidor.js`).

## Cuidado con
- Para quitarlo: borrar los 3 archivos y sus líneas en `js/orden.json` e `index.html` (cargador de pruebas).
- Sin hilos (abrir el archivo directamente) cada día de bot bloquea ~0,3 s: el primer arranque da tirones.

## Bitácora
- 2026-11-03 · Claude · Servidor de 99 bots implementado (incremental, hilos, asíncrono).
- 2026-10-31 · Claude · Tema creado.
