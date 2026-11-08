# Trabajo en curso

Carpeta para dejar por escrito los requerimientos largos (un refactor, un balance, una investigación, cualquier tema),
de forma que **cualquier agente o persona pueda retomarlos sin que le expliquen el contexto**.

## Último trabajo activo (si el usuario solo dice «continuar»)
**2026-11-07 · [Cuadros intermedios con IA (RIFE)](interpolacion-cuadros/ESTADO.md)** — se estaba probando la
interpolación de cuadros del ataque del asesino para quitar los saltos del sprite sin cambiar su arte. Abrir su
`ESTADO.md` y seguir su **Próximo paso**. Tema hermano (pausado en favor de este): [esqueleto 2D](esqueleto-2d/ESTADO.md).

## Índice de temas

| Tema | Estado | Próximo paso | Última sesión |
|---|---|---|---|
| [Roadmap técnico (determinismo, pruebas, balance)](roadmap-tecnico/ESTADO.md) | en curso · **prioridad alta** | Fases 1-5 hechas: que el usuario juegue las ramas nuevas; decidir asesino, Asmodeo y economía. | 2026-11-04 · Claude |
| [Balance de clases](balance-asesino/ESTADO.md) | en curso · **prioridad alta** | Cadena de clases hecha y 4 clases parejas contra monstruos; que el usuario lo juegue. | 2026-11-03 · Claude |
| [Asesino personalizable (piezas y skins)](asesino-personalizable/ESTADO.md) | en curso · **prioridad alta** | Elegir propuesta con el usuario (capas por regiones, accesorios, skins completas). | 2026-10-31 · Claude |
| [Generador de jugadores bot](bots-servidor/ESTADO.md) | en curso · **prioridad alta** | Hecho: 99 bots automáticos (hilos, incremental). Que el usuario lo pruebe y ajuste. | 2026-11-03 · Claude |
| [Tipos de jugador (simular jugadores reales)](tipos-jugador/ESTADO.md) | pausado | Fases 1-4 hechas; ajustar tipos con datos reales. Que el usuario pruebe el bot. | 2026-11-03 · Claude |
| [Conversión de sprites HD a pixel art](pixel-art/ESTADO.md) | pausado · **prioridad alta** | Aplicar `tools/pixelar.py` al Asesino cuando el usuario termine sus correcciones | 2026-10-30 · Claude |
| [Skin Escarcha del Asesino](skin-escarcha/ESTADO.md) | en curso | En el juego: que el usuario la pruebe. | 2026-11-07 · Claude |
| [Animación por esqueleto 2D (MVP)](esqueleto-2d/ESTADO.md) | en curso · **prioridad alta** | Pierna de atrás corregida y codos/rodillas que se curvan: que el usuario lo compare. Pipeline documentado para retomarlo. | 2026-11-07 · Claude |
| [Cuadros intermedios con IA (RIFE)](interpolacion-cuadros/ESTADO.md) | en curso | Todas las animaciones del asesino en el juego: que el usuario las pruebe en web y Android (tira de 80 925 px). | 2026-11-07 · Claude |
| [Sprites HD del Arquero](sprites-arquero/ESTADO.md) | pausado | Conectar Claude in Chrome y generar en Gemini (prompts listos). | 2026-11-07 · Claude |
| [Refactor del motor de combate](refactor-motor-combate/ESTADO.md) | finalizado | Nada pendiente | 2026-10-29 · Claude |
| [Separar la lógica de la pantalla](separar-logica/ESTADO.md) | finalizado | Nada pendiente | 2026-10-28 · Claude |
| [Contenido de nivel alto](contenido-nivel-alto/ESTADO.md) | pausado | Espera el arte: prompts listos y arte enchufable como dato | 2026-11-03 · Claude |
| [Retención a largo plazo](retencion/ESTADO.md) | en curso | Pacto local hecho: que el usuario lo pruebe; luego servidor real, aviso Android del asalto, contenido post-Nv 80. | 2026-11-04 · Claude |

### Estados
| Estado | Significa | Qué hacer al retomarlo |
|---|---|---|
| `en curso` | Hay trabajo pendiente y se puede seguir. | Leer **Última sesión** y **Próximo paso**, y continuar. |
| `pausado` | Espera algo externo: una decisión o un commit del usuario. El `ESTADO.md` dice qué. | Preguntar al usuario por eso antes de seguir. |
| `finalizado` | Terminado y verificado. **Nada pendiente.** | Nada. La carpeta queda como historial. |

## Cómo retomar un tema

1. Abre el `ESTADO.md` del tema y lee **Última sesión** (quién trabajó, qué cambió, qué quedó sin commit) y **Próximo paso**.
2. Lee **Decisiones**: lo decidido no se vuelve a discutir salvo que el usuario lo pida.
3. Comprueba que el código sigue como dice el estado (`git log`, rama, funciones citadas). Si no coincide, manda el
   código: corrige el estado y avísale al usuario.
4. Antes de cambiar algo, revisa **Cómo verificar**: cada tema dice cómo comprobar que no se rompió nada.

## Cómo mantenerlo (obligatorio para quien trabaje en un tema)

- **Un tema = una carpeta** `trabajo/<tema-en-minusculas>/` con su `ESTADO.md`, copiado de
  [`_plantilla/ESTADO.md`](_plantilla/ESTADO.md). El material de apoyo (scripts, mediciones largas) va en esa carpeta.
- **Al terminar cada paso, y siempre antes de cerrar la sesión**, actualizar en `ESTADO.md`:
  - **Estado** y fecha.
  - **Última sesión**: quién (`Claude`, otro agente o el nombre de la persona), fecha, qué cambió (archivos y
    funciones, en una línea cada uno), qué quedó **sin commit** y cómo se verificó. La sesión anterior baja a
    **Bitácora** (resumida en una línea).
  - **Hecho**, **Pendiente** y **Próximo paso**.
  - La fila del tema en el índice de arriba.
- **Al terminar el tema:** estado `finalizado`, **Próximo paso** = "Nada pendiente", **Pendiente** vacío (o lo que se
  decidió no hacer, con su motivo), y en **Última sesión** lo último que se hizo y cómo se verificó.
- Fechas absolutas (`2026-10-27`), nunca "ayer" ni "la semana pasada".
- Cada decisión del usuario se anota con su fecha y el motivo, en sus palabras si es posible.
- No copiar lo que ya dice el código o git: citar la función o el commit.
- Corto y al grano: es una hoja de ruta, no un informe.
- Los commits los hace el usuario. Que siempre quede claro qué parte del trabajo está sin commit.
