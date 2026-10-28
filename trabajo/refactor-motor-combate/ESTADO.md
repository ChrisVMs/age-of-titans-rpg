# Refactor del motor de combate

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-27

## Objetivo
Hacer el combate escalable y mantenible: separar las reglas (motor) de la pantalla (animaciones), tener un solo motor
para todos los modos y poder probar y balancear sin jugar a mano. Así un backend futuro podría correr el mismo motor,
el contenido nuevo (jefes, habilidades) se agrega una vez, y las reglas se verifican solas. El bot y el simulador son
consecuencia, no el objetivo (lo aclaró el usuario el 2026-10-27).

## Próximo paso
**Pendiente 2-5** (ver **Pendiente**): el refactor en sí está terminado (motor único, sin reglas distintas por modo).
Torre ya reequilibrada (Espinas al 5 % en la Torre). Lo siguiente, a elegir por el usuario.

## Última sesión
**2026-10-28 · Claude**
- Torre reequilibrada: Espinas devuelve el 5 % en la Torre (`MODIFICADORES` → `torre: { desc, ap }`; `pisoTorre` y
  `pintarTorre` usan esa versión). Los jefes mundiales siguen al 10 %.
- Medido (6 bots, 400 batallas por piso): con 10 %, el piso 60 (jefe) bajaba a ~20 % para Sigrid/Elric; con 5 %, 52-65 %
  (sin Espinas, 82-85 %). Los demás pisos con Espinas (50, 100) no cambian. Espinas + Regeneración no era la causa.
- Verificación: 14/14 escenarios. Commit en `qa` (ver `git log`).
- Antes, el mismo día: medición de `REGLAS` y reglas iguales en todos los modos (`d35ed46`, `6141056`).

## Decisiones
- 2026-10-28 · Espinas al 5 % solo en la Torre ("5 % solo en la Torre"): al 10 % los pisos de jefe eran un muro.
- 2026-10-28 · Espinas funciona en todos los modos ("que funcione en todo": el texto del piso dice la verdad; la
  Torre alta se endurece y se reequilibra aparte). Las otras 4 reglas, como en grupo ("igualar como en grupo").
- 2026-10-27 · Trabajar en la rama `qa`; los commits los hace el usuario.
- 2026-10-27 · Migración por etapas: 1 estado en un objeto · 2 motor que emite eventos · 3 simulador · 4 motor único.
- 2026-10-27 · Durante una ronda (tu ataque y la respuesta) no se puede huir: `marcarRonda()` desactiva `#huir` y `#btnHuir`.
  Motivo: salir a mitad de ronda dejaba la ronda pendiente corriendo sobre la batalla siguiente.
- 2026-10-27 · El motor resuelve la ronda entera al pulsar (la decisión del jugador es su entrada). Consecuencia aceptada:
  tocar otro enemigo durante la animación cambia el objetivo para la ronda siguiente, no la actual.
- 2026-10-27 · El ×0,5 de daño en grupo (`DANO_GRUPO`, "equilibrio provisional" de la v0.2.1) se quitó de la fórmula y
  pasó a los datos: `crearDificultad` genera daño base 3-5 en vez de 6-10. Motivo del usuario: números limpios (lo que
  dicen los datos es lo que pega) estando en desarrollo. Dificultad medida igual antes y después.
- 2026-10-27 · Último bastión y Segundo aliento funcionan en todos los modos (antes solo en 1 contra 1: en grupo eran
  puntos del árbol que no hacían nada). Efecto en balance pequeño (+2-5 % de victorias solo para quien los tiene).
- 2026-10-27 · No endurecer la curva "de rebote": cambios de dificultad se deciden con números (simulador), aparte.
- 2026-10-27 · Etapa 4 con el enfoque recomendado: 1 contra 1 = grupo de 1 contra 1, y las reglas que difieren como
  opciones por modo (`REGLAS`). El usuario lo confirmó ("continua etapa 4").
- 2026-10-27 · En 1 contra 1 el azar se tira ahora en el orden del motor de grupo (objetivo, esquiva, crítico, estados...).
  No cambia el balance (medido), pero la misma semilla da otra batalla que antes en arena y jefes mundiales. También se
  igualaron detalles de redondeo y de números (daño de habilidad redondeado una vez, mascota con la fórmula de grupo y
  su icono 🐾, el daño de los estados no deja la vida en negativo) y un caso raro de la arena: si el contraataque del
  rival te mataba, la ronda seguía y su golpe podía "revivirte" con el Último bastión.
- 2026-10-27 · Arreglado: el golpe que remata a Asmodeo con el escudo puesto se recortaba a su vida antes de pasar por el
  escudo y no lo mataba (en 1 contra 1 antes no pasaba; apareció al unir los motores y se corrigió en la misma sesión).
- 2026-10-27 · Arreglado en grupo: el set 4 del Minotauro reducía el golpe ya recortado a tu vida restante, así que con
  poca vida un golpe mortal podía dejarte vivo. Ahora reduce el golpe entero, como ya hacía el 1 contra 1.

## Hecho
| Paso | Commit | Verificación |
|---|---|---|
| Bot de pruebas (repetir batalla / jugar solo) | `ec10c87` | jugado en navegador |
| Etapa 1: estado de batalla en `batalla.*` | `ec10c87` | campaña, arena, 3 jefes sin errores |
| Bloqueo de huida durante la ronda | `ec10c87` | probado en 1v1 y grupo |
| Etapa 2a: motor 1v1 con eventos (`resolverRonda` + `reproducir`) | `ec10c87` | equivalencia con semilla: idéntico |
| Etapa 2b: motor de grupo con eventos (`resolverRondaGrupo`) | `dd14378` | equivalencia: campaña, Torre, Calabozo, reyes, con y sin aliados |
| Etapa 3: simulador (`simular`) + botón "📊 Simular batallas" | `dd14378` | equivalencia + fidelidad (simulada = jugada) + aislamiento |
| Azar con semilla (`rnd`, `sembrar`) | `dd14378` | 7 batallas idénticas a la versión previa |
| Escenarios de prueba (`ESCENARIOS`) + botón "✅ Escenarios" | `dd14378` | 12/12 en verde; detectan fallos provocados |
| ×0,5 a los datos de enemigos de grupo | `dd14378` | % medio de victorias igual en 6 perfiles |
| Bastión y aliento en grupo | `dd14378` | escenarios + visto en pantalla |
| Etapa 4: motor único (`resolverRonda` para todos los modos, `REGLAS`) | `a09c375` | grupo idéntico con semilla; 1 contra 1 igual en estadística; escenarios; pantalla |

## Pendiente
2. Entrada en `CHANGELOG.md` con lo de esta rama (el usuario la pidió como opcional; la 0.2.1 aún dice "×0,5 en grupo").
3. Simulador de progresión para saber **cuánto tarda terminar el juego** (oro, XP y equipo por día con 150 de estamina).
   El usuario lo pidió el 2026-10-27; hoy solo hay aproximaciones (ver **Mediciones**).
4. Simulador: falta Calabozo y Torre de reyes (necesitan sala; se podrían armar con aliados bot), y opción de jefe
   mundial "desde cero" (hoy parte de la vida que le queda ese día).
5. La generación de rivales de arena dio rivales distintos con la misma semilla antes de existir `rnd`; revisar si con
   `sembrar()` ya es determinista.

## Reglas por tipo de enemigo
Desde el 2026-10-28 no hay reglas distintas por modo (ver **Medición de `REGLAS`** y **Decisiones**).
Ya no son diferencias de modo, sino del tipo de enemigo (valen en los dos): jefes mundiales inmunes al control y sus
especiales (`decidirAtaqueEnemigo`, `especialSinGolpe`, `golpeEspecial`); jefes, rivales y reyes con inmunidad temporal
al control; el rival de la arena con Estocada, críticos, robo y contraataque propios (`e.rival`); los reyes, como
jugadores (`u.perfil`). La mascota muerde a un enemigo al azar (en 1 contra 1 solo hay uno).

## Cómo verificar
- **Escenarios:** Pruebas → "✅ Escenarios de prueba", o `correrEscenarios()` en la consola. Todos en verde.
  Para añadir uno: entrada en `ESCENARIOS` (nombre + función que devuelve `true` o un texto con lo que falló).
- **Simulador:** Pruebas → "📊 Simular batallas", o `simular(batallaTorre(10), { veces: 100, semilla: 5 })`.
- **Equivalencia automática** (lo que se usó en la etapa 4): copiar `index.html` como `antes.html` antes de tocar nada y,
  después, `node trabajo/refactor-motor-combate/herramientas/equivalencia.js . <ruta a antes.html>` (Playwright con Chromium).
  Juega 234 casos (6 perfiles × campaña, Torre, calabozo, reyes, arena, 3 jefes y un duelo de 3, con y sin aliados) con
  6 semillas y dice cuáles cambian. Con `MEDIR=medir-duelo.js` compara en cambio % de victorias, rondas, vida y daño de
  1500 batallas por caso de 1 contra 1. `node .../herramientas/pantalla.js .` juega en pantalla una batalla de cada modo.
- **Equivalencia a mano** (etapas anteriores):
  1. Copiar `index.html` a una carpeta temporal como `antes.html` **antes** de tocar nada.
  2. Servir ambas: `python trabajo/refactor-motor-combate/herramientas/servidor.py <carpeta del juego> <ruta a antes.html>`
     → juego en `http://127.0.0.1:8765/index.html?pruebas` y la copia en `/antes.html?pruebas`.
  3. En cada una, mismas batallas con la misma semilla, por ejemplo
     `JSON.stringify(simular(batallaCampana(CAMPANAS[4], 'dificil'), { veces: 30, semilla: 321 }))`, y comparar.
     Si el cambio altera el orden de redondeo, comparar % de victorias con muchas batallas en lugar de exactitud
     ([herramientas/perfiles.js](herramientas/perfiles.js) arma perfiles de nivel 5 a 57 y mide campaña y Torre).
- **En pantalla** (solo si el cambio es fuerte, según `CLAUDE.md`): una batalla de cada modo con el autoataque.

## Mapa del código (todo en `index.html`)
- `batalla` (objeto global): estado de la batalla en curso: `campana`, `reglas`, `grupo` ({ heroes, enemigos, turnoMascota,
  objetivo, duelo }), `enemigo` (datos del enemigo actual en 1 contra 1; en grupo, el primero), `ganado` y el estado de
  los jefes mundiales. `simulando`: el simulador corre sobre una copia.
- `rnd()` / `sembrar(n)`: azar del juego con semilla opcional. `elegirSonido`: azar aparte para sonidos.
- Inicio: `prepararBatalla(c)` (motor: `armarGrupo` o `armarDuelo`) → `iniciarCampana(c)` (cobra estamina, dibuja:
  `dibujarGrupo` o `mostrarEnemigo`). Cada modo arma su batalla sin empezarla: `batallaCampana`, `batallaTorre`,
  `batallaArena`, `batallaMundial`.
- Motor (bloque "Motor del combate (todos los modos)"): unidades (`unidadJugador`, `unidadMonstruo`, `unidadRey`),
  `resolverRonda` → `resolverAccionJugador` (tú, aliados y reyes), `resolverAccionEnemigo` (monstruos, jefes, rival de
  arena), `resolverMascota`; comunes: `resolverTick`, `aplicarEstado`, `nodosVida` (bastión/aliento), `aguanteSet4`,
  `contraatacar`, `morir`, `cobrar`. Accesos: `heroeYo()`, `enemigoDuelo()`.
- Pantalla: `ronda` llama al motor y pasa los eventos a `reproducir(eventos)`, que dibuja cada evento en la escena
  1 contra 1 (`u.duelo`, `u.el` = su casilla) o en el rombo; la lista de tipos de evento está encima de `emitir`.
- Pruebas: `aislado(fn)`, `jugarHastaFin(c)`, `simular(c, opciones)`, `ESCENARIOS`, `correrEscenarios`, `jugadorPrueba`,
  `batallaPrueba`. Bot: `botEmpezar('repetir' | 'jugar')`.

## Mediciones (2026-10-27, perfiles sintéticos guerrero, solos, autoataque)
- Una ronda de grupo dura ~3,5 s a x1 (+0,5 s de pausa con autoataque); una batalla ganada, 4-7,5 rondas.
- Quitar el ×0,5 sin compensar habría pedido ~30-60 % más de poder para cada dificultad (por eso se pasó a los datos).
- Frontera actual (último nivel con ≥50 % en Normal/Difícil/Pesadilla/Infierno · piso de Torre): Nv5 4/1/0/0 · 10,
  Nv10 7/3/2/0 · 25, Nv20 9/7/4/2 · 30, Nv30 10/9/7/3 · 30, Nv40 10/9/9/5 · 50, Kaito Nv57 10/10/10/9 · 60.

## Medición de `REGLAS` (2026-10-28, 6 bots Nv 44-60, solos, 800 batallas por caso con las mismas semillas)
Cuánto cambia el % de victorias al pasar cada opción al valor del otro modo. 1 contra 1: arena (rival fuerte) y los 3 jefes
al 45 % de vida. Grupo: campaña Pesadilla/Infierno alta y Torre 40, 50 y 60.
| Opción | 1 contra 1 como grupo | Grupo como 1 contra 1 |
|---|---|---|
| `contraDefensa` | 33,6 → 33,9 % (Morgana arena 95 → 98) | sin cambio |
| `regenAntes` | sin cambio | sin cambio |
| `espinas` | 33,6 → 39,2 % (Asmodeo: Lyra 64 → 100, Morgana 8 → 100) | 78,8 → 73,9 % (Torre 60: Sigrid 82 → 20, Elric 88 → 15) |
| `gastaHabControlado` | sin cambio | 78,8 → 79,3 % (Torre 60: +6 % arquero y mago) |
| `habTrasEsquiva` | sin cambio | sin cambio |
Script: `herramientas/reglas.js` (se evalúa en el juego con `correr.js`).

## Cuidado con
- La página **guarda la partida al salir**: restaurar `localStorage` y luego navegar puede pisar lo restaurado.
- "Juego abierto en otra pestaña" aparece si se recarga rápido; mientras está, no se guarda nada (`pestanaBloqueada`).
- Los aliados bot en campaña y Torre solo existen en modo pruebas (`MODO_PRUEBAS`); en el juego publicado se juega solo.
- `rangoClase` es `const` (no se puede reemplazar desde la consola); `aplicarEstado` y `decidirAtaqueEnemigo` sí.
- En 1 contra 1 las dos unidades están en la casilla `frente` (así el orden y los objetivos funcionan como en grupo).
- Reglas del proyecto en `CLAUDE.md`: web y Android por igual, sin `alert/confirm/prompt`, textos cortos, y el navegador
  solo para cambios fuertes.

## Bitácora
- 2026-10-28 · Claude · Etapa 4 (motor único), commits `a09c375`, `585bb82`; medición de `REGLAS` `d35ed46`.
- 2026-10-27 · Claude · Etapa 2b (motor de grupo con eventos), etapa 3 (simulador, azar con semilla, escenarios), ×0,5 a
  los datos, bastión y aliento en grupo, y este sistema `trabajo/`. El usuario lo commiteó como `dd14378` ("refactor pt 2").
- 2026-10-27 · Claude · Bot de pruebas, etapa 1 (estado en `batalla`), bloqueo de huida y etapa 2a (motor 1v1 con
  eventos). El usuario lo commiteó como `ec10c87` ("migracion pt 1").
