# Asesino personalizable (piezas y skins)

**Estado:** en curso · **Prioridad: ALTA** · **Rama:** qa · **Actualizado:** 2026-10-31

## Objetivo
Poder cambiar piezas y skins del Asesino sin romper su animación de 109 cuadros.

## Próximo paso
1) Generalizar `tools/tira_asesino.py` para armar una tira por skin desde `tools/hojas/asesino_<skin>_<hoja>`. 2) Sistema de skins por clase (hoy SKINS es del guerrero). 3) Primera skin con el usuario.

## Última sesión
**2026-10-31 · Claude**
- Tema creado a pedido del usuario. Nada implementado aún.

## Decisiones
- 2026-10-31 · Se descartan por ahora la animación por esqueleto (Spine, Rive, DragonBones: hay que animar a mano en su editor y rehacer todo) y el despiece en Krita · lo práctico: **skins completas** (hojas nuevas con las mismas poses, procesadas con el mismo flujo) y, opcional, tintes por zonas (usuario).

## Hecho

## Pendiente

## Cómo verificar
`node pruebas/escenarios.js`, `node pruebas/sistemas.js`, `node pruebas/sin-pantalla.js`, `node pruebas/progresion.js`.

## Mapa del código

## Cuidado con

## Bitácora
- 2026-10-31 · Claude · Tema creado.
