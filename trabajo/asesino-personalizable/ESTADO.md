# Asesino personalizable (piezas y skins)

**Estado:** en curso (primera skin hecha) · **Prioridad: ALTA** · **Rama:** qa · **Actualizado:** 2026-10-31

## Objetivo
Poder cambiar piezas y skins del Asesino sin romper su animación de 109 cuadros.

## Próximo paso
Siguiente skin del Asesino (referencias en `tools/hojas/asesino_skins/`): exportar cada animación actual en hojas de 12 a escala del juego, generar con el prompt genérico de `PROMPT_SPRITE.md`, recortar con `tools/skin_asesino.py` (DESVANECER=3,4,5 en paso), armar con `tools/tira_skin_asesino.py <skin>` y añadir la entrada en SKINS y en animaciones.html.

## Última sesión
**2026-10-31 · Claude**
- Tema creado a pedido del usuario. Nada implementado aún.

## Decisiones
- 2026-10-31 · Se descartan por ahora la animación por esqueleto (Spine, Rive, DragonBones: hay que animar a mano en su editor y rehacer todo) y el despiece en Krita · lo práctico: **skins completas** (hojas nuevas con las mismas poses, procesadas con el mismo flujo) y, opcional, tintes por zonas (usuario).

## Hecho
- Skin Espectro completa e integrada: cuadros en `img/asesino/skins/espectro/`, tira con la misma distribución de casillas (`tools/tira_skin_asesino.py`), skins por clase (`skinPuesta`, `ponerSkin`, `skinsClase` en `08-skins.js`), prueba en `pruebas/sistemas.js` · probado en el navegador (menú, batalla, Puñalada, derrota).

## Pendiente

## Cómo verificar
`node pruebas/escenarios.js`, `node pruebas/sistemas.js`, `node pruebas/sin-pantalla.js`, `node pruebas/progresion.js`.

## Mapa del código

## Cuidado con

## Bitácora
- 2026-10-31 · Claude · Tema creado.
