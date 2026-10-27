# Refactor del motor de combate

**Estado:** en curso · **Rama:** `qa` · **Actualizado:** 2026-10-27

## Objetivo
Hacer el combate escalable y mantenible: separar las reglas (motor) de la pantalla (animaciones), tener un solo motor
para todos los modos y poder probar y balancear sin jugar a mano. Así un backend futuro podría correr el mismo motor,
el contenido nuevo (jefes, habilidades) se agrega una vez, y las reglas se verifican solas. El bot y el simulador son
consecuencia, no el objetivo (lo aclaró el usuario el 2026-10-27).

## Próximo paso
**Etapa 4: unir los motores de 1 contra 1 (`resolverRonda`) y de grupo (`resolverRondaGrupo`) en uno.**
- Enfoque recomendado (pendiente de confirmar con el usuario): modelar 1 contra 1 como un grupo de 1 héroe contra
  1 enemigo, con las reglas que aún difieren como **opciones por modo**, para que el balance no cambie. Luego el usuario
  decide, una a una, cuáles igualar.
- Diferencias que quedan (ver **Diferencias de reglas**). Los especiales de jefe (Cerbero, Asmodeo, Minotauro) solo
  existen en 1 contra 1: pasarían a ser un "comportamiento" del enemigo (`decidirAtaqueEnemigo` + su resolución).
- Hecho cuando: un solo `resolverRonda` para todos los modos, `ronda()` sin bifurcar a `rondaGrupo`, equivalencia con
  semilla igual que antes en todos los modos (ver **Cómo verificar**) y los 12 escenarios en verde.
- Antes de empezar: preguntar al usuario si confirma el enfoque.

## Última sesión
**2026-10-27 · Claude** (después del commit `ec10c87` del usuario)
- Cambios en `index.html`:
  - Etapa 2b: `resolverRondaGrupo` y acciones de grupo (`resolverAccionHeroe`, `resolverAccionEnemigo`,
    `resolverMascotaGrupo`, `resolverTickU`) emiten eventos; `rondaGrupo` solo reproduce; `reproducir` dibuja eventos de grupo.
  - Etapa 3: `prepararBatalla`, `armarGrupo`/`dibujarGrupo`, `crearUnidad`/`dibujarUnidad`, armadores `batallaCampana`,
    `batallaTorre`, `batallaArena`, `batallaMundial`; `simular`, `aislado`, `jugarHastaFin`; botón "📊 Simular batallas".
  - Azar: `rnd`, `sembrar`, `elegirSonido`; 41 `Math.random()` pasaron a `rnd()` (quedan solo identificadores).
  - Escenarios: `ESCENARIOS`, `correrEscenarios`, `jugadorPrueba`, `batallaPrueba`; botón "✅ Escenarios de prueba".
  - Balance: `crearDificultad` con daño base 3-5 y sin `DANO_GRUPO`; `nodosVidaU` (bastión y aliento en grupo).
  - `simulando` desactiva `guardar()` y `avisar()`; `sumarMaestria` no avisa mientras simula.
- Otros archivos: `CLAUDE.md` (sección "Trabajo en curso") y carpeta `trabajo/` (este sistema).
- Sin commit: **todo lo anterior** (rama `qa` sobre `ec10c87`).
- Verificación: equivalencia con semilla frente a la versión previa en cada paso; 12/12 escenarios; dificultad medida
  igual antes y después del ×0,5; batallas en pantalla sin errores.
- Quedó a medias: nada. La etapa 4 no se empezó (espera que el usuario confirme el enfoque).

## Decisiones
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

## Hecho
| Paso | Commit | Verificación |
|---|---|---|
| Bot de pruebas (repetir batalla / jugar solo) | `ec10c87` | jugado en navegador |
| Etapa 1: estado de batalla en `batalla.*` | `ec10c87` | campaña, arena, 3 jefes sin errores |
| Bloqueo de huida durante la ronda | `ec10c87` | probado en 1v1 y grupo |
| Etapa 2a: motor 1v1 con eventos (`resolverRonda` + `reproducir`) | `ec10c87` | equivalencia con semilla: idéntico |
| Etapa 2b: motor de grupo con eventos (`resolverRondaGrupo`) | sin commit | equivalencia: campaña, Torre, Calabozo, reyes, con y sin aliados |
| Etapa 3: simulador (`simular`) + botón "📊 Simular batallas" | sin commit | equivalencia + fidelidad (simulada = jugada) + aislamiento |
| Azar con semilla (`rnd`, `sembrar`) | sin commit | 7 batallas idénticas a la versión previa |
| Escenarios de prueba (`ESCENARIOS`) + botón "✅ Escenarios" | sin commit | 12/12 en verde; detectan fallos provocados |
| ×0,5 a los datos de enemigos de grupo | sin commit | % medio de victorias igual en 6 perfiles |
| Bastión y aliento en grupo | sin commit | escenarios + visto en pantalla |

## Pendiente
1. Etapa 4 (motor único), ver **Próximo paso**.
2. Entrada en `CHANGELOG.md` con lo de esta rama (el usuario la pidió como opcional; la 0.2.1 aún dice "×0,5 en grupo").
3. Simulador de progresión para saber **cuánto tarda terminar el juego** (oro, XP y equipo por día con 150 de estamina).
   El usuario lo pidió el 2026-10-27; hoy solo hay aproximaciones (ver **Mediciones**).
4. Simulador: falta Calabozo y Torre de reyes (necesitan sala; se podrían armar con aliados bot), y opción de jefe
   mundial "desde cero" (hoy parte de la vida que le queda ese día).
5. La generación de rivales de arena dio rivales distintos con la misma semilla antes de existir `rnd`; revisar si con
   `sembrar()` ya es determinista.

## Diferencias de reglas entre 1 contra 1 y grupo (para la etapa 4)
| Regla | 1 contra 1 | Grupo |
|---|---|---|
| Contraataque de tu skin | descuenta armadura (`factorPenetracion`) e infernal | `danoGuerrero × .6` sin armadura |
| Control (aturdir, congelar) a jefes | jefes mundiales inmunes siempre; jefes/rivales con inmunidad temporal | jefes y reyes: inmunidad temporal |
| Regeneración del enemigo | al empezar su turno, antes de estados | al actuar, después de estados |
| Mordida de la mascota | al enemigo actual | a un enemigo al azar |
| Especiales de jefe, espinas | sí | no existen (esos jefes solo están en 1v1) |
| Rival de arena / reyes | rival con Estocada y crítico propios | reyes con sus habilidades de clase reales |

## Cómo verificar
- **Escenarios:** Pruebas → "✅ Escenarios de prueba", o `correrEscenarios()` en la consola. Todos en verde.
  Para añadir uno: entrada en `ESCENARIOS` (nombre + función que devuelve `true` o un texto con lo que falló).
- **Simulador:** Pruebas → "📊 Simular batallas", o `simular(batallaTorre(10), { veces: 100, semilla: 5 })`.
- **Equivalencia antes/después de un cambio** (lo que se usó en cada etapa):
  1. Copiar `index.html` a una carpeta temporal como `antes.html` **antes** de tocar nada.
  2. Servir ambas: `python trabajo/refactor-motor-combate/herramientas/servidor.py <carpeta del juego> <ruta a antes.html>`
     → juego en `http://127.0.0.1:8765/index.html?pruebas` y la copia en `/antes.html?pruebas`.
  3. En cada una, mismas batallas con la misma semilla, por ejemplo
     `JSON.stringify(simular(batallaCampana(CAMPANAS[4], 'dificil'), { veces: 30, semilla: 321 }))`, y comparar.
     Si el cambio altera el orden de redondeo, comparar % de victorias con muchas batallas en lugar de exactitud
     ([herramientas/perfiles.js](herramientas/perfiles.js) arma perfiles de nivel 5 a 57 y mide campaña y Torre).
- **En pantalla** (solo si el cambio es fuerte, según `CLAUDE.md`): una batalla de cada modo con el autoataque.

## Mapa del código (todo en `index.html`)
- `batalla` (objeto global): estado de la batalla en curso. `simulando`: el simulador corre sobre una copia.
- `rnd()` / `sembrar(n)`: azar del juego con semilla opcional. `elegirSonido`: azar aparte para sonidos.
- Inicio: `prepararBatalla(c)` (motor) → `iniciarCampana(c)` (cobra estamina, dibuja: `dibujarGrupo`, `mostrarEnemigo`).
  Cada modo arma su batalla sin empezarla: `batallaCampana`, `batallaTorre`, `batallaArena`, `batallaMundial`.
- Motor 1v1: `resolverRonda` → `resolverEstados`, `resolverAtaque`, `decidirAtaqueEnemigo`, `resolverMascota`, `aplicarEstado`.
- Motor grupo: `armarGrupo`, `resolverRondaGrupo` → `resolverAccionHeroe`, `resolverAccionEnemigo`, `resolverMascotaGrupo`,
  `resolverTickU`, `aplicarEstadoU`, `nodosVidaU` (bastión/aliento), `morirU`, `cobrarU`.
- Pantalla: `ronda` / `rondaGrupo` llaman al motor y pasan los eventos a `reproducir(eventos)`; la lista de tipos de
  evento está comentada encima de `emitir`.
- Pruebas: `aislado(fn)`, `jugarHastaFin(c)`, `simular(c, opciones)`, `ESCENARIOS`, `correrEscenarios`, `jugadorPrueba`,
  `batallaPrueba`. Bot: `botEmpezar('repetir' | 'jugar')`.

## Mediciones (2026-10-27, perfiles sintéticos guerrero, solos, autoataque)
- Una ronda de grupo dura ~3,5 s a x1 (+0,5 s de pausa con autoataque); una batalla ganada, 4-7,5 rondas.
- Quitar el ×0,5 sin compensar habría pedido ~30-60 % más de poder para cada dificultad (por eso se pasó a los datos).
- Frontera actual (último nivel con ≥50 % en Normal/Difícil/Pesadilla/Infierno · piso de Torre): Nv5 4/1/0/0 · 10,
  Nv10 7/3/2/0 · 25, Nv20 9/7/4/2 · 30, Nv30 10/9/7/3 · 30, Nv40 10/9/9/5 · 50, Kaito Nv57 10/10/10/9 · 60.

## Cuidado con
- La página **guarda la partida al salir**: restaurar `localStorage` y luego navegar puede pisar lo restaurado.
- "Juego abierto en otra pestaña" aparece si se recarga rápido; mientras está, no se guarda nada (`pestanaBloqueada`).
- Los aliados bot en campaña y Torre solo existen en modo pruebas (`MODO_PRUEBAS`); en el juego publicado se juega solo.
- `rangoClase` es `const` (no se puede reemplazar desde la consola); `aplicarEstado` y `decidirAtaqueEnemigo` sí.
- Reglas del proyecto en `CLAUDE.md`: web y Android por igual, sin `alert/confirm/prompt`, textos cortos, y el navegador
  solo para cambios fuertes.

## Bitácora
- 2026-10-27 · Claude · Bot de pruebas, etapa 1 (estado en `batalla`), bloqueo de huida y etapa 2a (motor 1v1 con
  eventos). El usuario lo commiteó como `ec10c87` ("migracion pt 1").
