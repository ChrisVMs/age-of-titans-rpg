// Simulación de progresión en un hilo aparte (Web Worker), para que la pantalla no se congele y muestre el avance.
// Carga la lógica del juego y las herramientas de pruebas sin pantalla (como pruebas/cargar.js en Node) y avisa cada día.
// Mensaje de entrada: { archivos, dias, semilla, estaminaExtra, offset, perfil (partida desde la que sigue, o nada) } · salida: { dia } por día y { fin } al terminar.
const datos = { 'batalla.modoPruebas': '1' };   // modo pruebas: las etapas y calabozos sin arte también cuentan
self.window = self; self.innerWidth = 900; self.innerHeight = 420; self.screen = {}; self.requestAnimationFrame = () => 0;
self.localStorage = { getItem: k => datos[k] ?? null, setItem: (k, v) => { datos[k] = String(v); }, removeItem: k => { delete datos[k]; } };
onmessage = e => {
  const { archivos, dias, semilla, estaminaExtra, offset, perfil } = e.data;
  datos['batalla.diaPrueba'] = String(offset || 0);   // mismo día de juego que la partida (para poder pasarle el personaje)
  try {
    importScripts(...archivos.map(a => '../../' + a));
    const r = simularProgresion({ dias, semilla, estaminaExtra, perfil, alDia: d => postMessage({ dia: d }) });
    postMessage({ fin: r });
  } catch (err) { postMessage({ error: String(err && err.stack || err) }); }
};
