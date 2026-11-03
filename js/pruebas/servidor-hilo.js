// Hilo del servidor de bots (solo pruebas): carga la lógica del juego y las herramientas sin pantalla una vez y avanza los
// bots que le mandan. Entrada: { archivos } la primera vez; luego { b, perfil, hechos, dias, offset }. Salida: { id, perfil }.
const datos = { 'batalla.modoPruebas': '1' };
self.window = self; self.innerWidth = 900; self.innerHeight = 420; self.screen = {}; self.requestAnimationFrame = () => 0;
self.localStorage = { getItem: k => datos[k] ?? null, setItem: (k, v) => { datos[k] = String(v); }, removeItem: k => { delete datos[k]; } };
let listo = false;
onmessage = e => {
  try {
    if (!listo) { importScripts(...e.data.archivos.map(a => '../../' + a)); listo = true; return postMessage({ listo: true }); }
    const { b, perfil, hechos, dias, offset } = e.data;
    postMessage({ id: b.id, perfil: avanzarBot(b, perfil, hechos, dias, offset), hechos: hechos + dias });
  } catch (err) { postMessage({ error: String(err && err.stack || err), id: e.data.b && e.data.b.id }); }
};
