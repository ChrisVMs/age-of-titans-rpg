  // ---------------- Inventario ----------------
  // Ícono estándar por tipo de objeto, teñido con el mismo color que la pieza
  const icono = m => `<span class="icono" style="background-image:url(${m.icono || RANURAS[m.ranura].icono});filter:${m.color || 'none'}"></span>`;
  const ORDEN_RAREZA = Object.keys(RAREZAS);
  let invTab = 'objetos';
  function textoAccionMascota(m, n) {
    const p = Math.round(pctStatsMascota(m, n) * 10) / 10, a = m.accion.aplica;
    const extra = a ? ` · ${Math.round(a.prob * 100)}% de ${ESTADOS[a.estado].nombre.toLowerCase()} ${ESTADOS[a.estado].icono}` : '';
    return `Fuerza: ${p}% de tus estadísticas · ${m.desc}: ${m.accion.tipo === 'golpe' ? 'golpe' : 'cura'} de ${m.accion.mult}× su ataque cada ${m.accion.turnos} turnos${extra}`;
  }
  // Nombre del jugador: se ve en el campamento, la batalla, las salas y el ranking; se edita desde el perfil (Héroe).
  // 3-14 caracteres; no puede coincidir con un jugador del ranking (los bots).
  jugador.nombre ||= `Héroe${1000 + Math.floor(Math.random() * 9000)}`;   // partidas sin nombre: uno provisional
  let editandoNombre = false;
  function validarNombre(n) {
    if (n.length < 3 || n.length > 14) return 'El nombre debe tener entre 3 y 14 caracteres';
    if (!/^[\p{L}\p{N} _-]+$/u.test(n)) return 'Solo letras, números, espacios, - y _';
    if (DEF_BOTS.some(d => d.nombre.toLowerCase() === n.toLowerCase())) return 'Ese nombre ya lo usa otro jugador';
    return '';
  }
  const CATEGORIAS_BOLSA = ['espada', 'casco', 'armadura', 'capa'];
  let filtroBolsa = 'todos';

  // Ventana de detalle de objeto y utilidades de costes
  function filasTotales(t, comparar) {
    return [...Object.keys(ATRIBUTOS), ...Object.keys(SECUNDARIOS)].filter(a => t[a] || (comparar && comparar[a])).map(a => {
      const v = t[a] || 0, d = comparar ? Math.round((v - (comparar[a] || 0)) * 10) / 10 : 0;
      const dif = comparar && d ? ` <span class="${d > 0 ? 'mas' : 'menos'}">(${d > 0 ? '+' : ''}${fmtAtr(a, d)})</span>` : '';
      return `<div><span>${nombreAtr(a)}</span><span>+${fmtAtr(a, v)}${dif}</span></div>`;
    }).join('');
  }
  const tieneCoste = c => Object.entries(c).every(([k, v]) => k === 'prob' || (k === 'oro' ? jugador.oro >= v : jugador.mat[k] >= v));
  const textoCoste = c => Object.entries(c).filter(([k]) => k !== 'prob').map(([k, v]) => {
    const tengo = k === 'oro' ? jugador.oro : jugador.mat[k];   // icono HD del recurso (icPremio): solo se usa en HTML
    return `<span class="${tengo < v ? 'falta' : ''}">${icPremio(k)}<b>${v}</b></span>`;   // en rojo si no alcanza (sin "tienes": ocupaba espacio)
  }).join(' · ');
  const faltaCoste = c => Object.entries(c).filter(([k]) => k !== 'prob').map(([k, v]) => {
    const tengo = k === 'oro' ? jugador.oro : jugador.mat[k]; return tengo < v ? `${v - tengo} ${k === 'oro' ? '● oro' : MATERIALES[k]}` : '';
  }).filter(Boolean).join(' · ');
  let modalFijo = false;   // true: solo se cierra con sus botones

  // Ficha del objeto en el inventario: atributos, comparación con lo equipado y acciones
  function lineasHtml(o) {
    const m = modelo[o.modelo], r = RAREZAS[m.rareza];
    return o.lineas.map(l => `<div><span>${nombreAtr(l.a)} ${estrellas(l.e)}</span><span>+${fmtAtr(l.a, valorLinea(o, l))}</span></div>`).join('') +
      (o.enc ? `<div><span class="enc">Encantamiento +${o.enc}/${encMax(o)}</span><span class="enc">+${Math.round(ENC_PRINCIPAL[PRINCIPAL[m.ranura]] * r.mult * o.enc)} ${ATRIBUTOS[PRINCIPAL[m.ranura]]}</span></div>` : '') +
      (m.jefe ? (() => { const C = CONJUNTOS[m.jefe], n = piezasConjunto()[m.jefe] || 0;
        return `<div><span class="enc">Set «${C.nombre}» · ${n}/4 equipadas</span></div>` + [2, 3].map(k =>
          `<div><span class="enc" style="opacity:${n >= k ? 1 : .5}">${k} piezas${n >= k ? ' <img class="ic-txt" src="img/iconos/hecho.png" alt="">' : ''}</span><span class="enc" style="opacity:${n >= k ? 1 : .5}">${textoNivelSet(C[k])}</span></div>`).join('')
          + `<div><span class="enc" style="opacity:${n >= 4 ? 1 : .5}">4 piezas${n >= 4 ? ' <img class="ic-txt" src="img/iconos/hecho.png" alt="">' : ''}</span><span class="enc" style="opacity:${n >= 4 ? 1 : .5}">${C.especial}</span></div>`; })() : '');
  }
