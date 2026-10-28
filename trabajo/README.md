# Trabajo en curso

Carpeta para dejar por escrito los requerimientos largos (un refactor, un balance, una investigación, cualquier tema),
de forma que **cualquier agente o persona pueda retomarlos sin que le expliquen el contexto**.

## Índice de temas

| Tema | Estado | Próximo paso | Última sesión |
|---|---|---|---|
| [Refactor del motor de combate](refactor-motor-combate/ESTADO.md) | en curso | Refactor terminado; quedan extras: reequilibrar Torre alta, CHANGELOG, simulador de progresión | 2026-10-28 · Claude |

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
