// Ejecutor único de las pruebas sin navegador. Corre en paralelo y resume al final.
// Uso: node pruebas/todo.js              rápido: escenarios, sistemas y sin-pantalla corto (para cada cambio)
//      node pruebas/todo.js completo     + sin-pantalla largo, métricas de progresión (vs referencia) y equivalencia
//      opciones del completo: --contra=<rama o commit> (equivalencia, por defecto origin/main) · --sin-equivalencia
// Las métricas se comparan con pruebas/referencia.json; si un cambio de balance es intencional, se actualiza con
// `node pruebas/metricas.js --guardar-referencia` (nunca a ciegas: primero entender la diferencia).
const { spawn, execFileSync } = require('child_process'), path = require('path'), fs = require('fs'), os = require('os');
const raiz = path.join(__dirname, '..'), completo = process.argv.includes('completo');
const opcion = (n, def) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : def; };

// Una entrada por prueba: nombre, script y argumentos. Añadir una = añadir una entrada.
const RAPIDAS = [
  { nombre: 'escenarios', args: ['pruebas/escenarios.js'] },
  { nombre: 'sistemas', args: ['pruebas/sistemas.js'] },
  { nombre: 'sin pantalla (10 días)', args: ['pruebas/sin-pantalla.js', '10', '1,2'] },
];
const COMPLETAS = [
  { nombre: 'escenarios', args: ['pruebas/escenarios.js'] },
  { nombre: 'sistemas', args: ['pruebas/sistemas.js'] },
  { nombre: 'sin pantalla (20 días)', args: ['pruebas/sin-pantalla.js', '20', '1,2,3,4,5'] },
  { nombre: 'métricas de progresión', args: ['pruebas/metricas.js'], informe: true },
];

function correr({ nombre, args, cwd = raiz }) {
  return new Promise(ok => {
    const t0 = Date.now(), p = spawn(process.execPath, args, { cwd }); let salida = '';
    p.stdout.on('data', d => salida += d); p.stderr.on('data', d => salida += d);
    p.on('close', codigo => ok({ nombre, ok: codigo === 0, salida, s: Math.round((Date.now() - t0) / 1000) }));
  });
}

// Copia de otra versión (git worktree) para la equivalencia; null si no se puede
function otraVersion(ref) {
  const dir = path.join(os.tmpdir(), `batalla-equivalencia-${process.pid}`);
  try { execFileSync('git', ['worktree', 'add', '--detach', '-q', dir, ref], { cwd: raiz, stdio: 'pipe' }); return dir; }
  catch (e) { console.log(`⚠ equivalencia: no se pudo preparar ${ref} (${String(e.stderr || e.message).trim().split('\n')[0]})`); return null; }
}

(async () => {
  const t0 = Date.now(), lista = [...(completo ? COMPLETAS : RAPIDAS)];
  let dir = null;
  if (completo && !process.argv.includes('--sin-equivalencia')) {
    const ref = opcion('contra', 'origin/main');
    if ((dir = otraVersion(ref))) lista.push({ nombre: `equivalencia con ${ref}`, args: ['pruebas/equivalencia.js', dir], informe: true, aviso: true });
  }
  console.log(`Pruebas ${completo ? 'completas' : 'rápidas'}: ${lista.map(x => x.nombre).join(' · ')}\n`);
  const res = await Promise.all(lista.map(correr));
  if (dir) try { execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: raiz, stdio: 'pipe' }); } catch {}
  for (const [i, r] of res.entries()) {
    const fallos = r.salida.split('\n').filter(l => l.startsWith('❌'));
    // la equivalencia distinta no es un fallo: avisa de que las batallas cambiaron respecto a la otra versión
    const marca = r.ok ? '✅' : lista[i].aviso ? '⚠️ ' : '❌';
    console.log(`${marca} ${r.nombre} (${r.s} s)${fallos.length ? '\n   ' + fallos.join('\n   ') : ''}`);
    if (lista[i].informe || (!r.ok && !fallos.length)) console.log(r.salida.trimEnd().split('\n').map(l => '   ' + l).join('\n'));
  }
  const malos = res.filter((r, i) => !r.ok && !lista[i].aviso);
  console.log(`\n${malos.length ? '❌' : '✅'} ${res.length - malos.length}/${res.length} en ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exitCode = malos.length ? 1 : 0;
})();
