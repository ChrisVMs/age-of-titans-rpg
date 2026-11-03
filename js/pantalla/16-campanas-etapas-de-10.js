  // ---------------- Campañas: etapas de 10 niveles (1-1 ... 1-10) (pantalla) ----------------
  ui.pintarCampanas = () => pintarCampanas();
  function pintarCampanas() {
    const actual = CAMPANAS.find(c => desbloqueada(c, 'normal') && !superada(c.id, 'normal'));   // el siguiente nivel por jugar
    $('listaCampanas').innerHTML = `<div class="formacion-resumen etapa">${textoFormacion()} <button data-ir-formacion="pCampana"><img class="ic-txt" src="img/iconos/defensa.png" alt="">Formación</button></div>` + ETAPAS.map(e => {
      if (e.bloqueada || !etapaDisponible(e)) return `<div class="campana bloqueada"><h3>${e.nombre}</h3><small><img class="ic-txt" src="img/iconos/candado.png" alt="">Próximamente</small></div>`;
      const niveles = CAMPANAS.filter(c => c.etapa === e.id), hechos = niveles.filter(c => superada(c.id, 'normal')).length;
      return `<h3 class="etapa">${e.nombre} <small>${hechos}/${niveles.length}</small></h3>` + niveles.map(c => {
        const abierta = desbloqueada(c, 'normal');
        return `<div class="campana nivel${abierta ? '' : ' bloqueada'}${c === actual ? ' actual' : ''}"><h3>${c.nombre}${c.jefe ? ' <span class="tag-jefe">JEFE</span>' : ''}</h3>
          ${abierta ? `<div class="difs">${ORDEN_DIF.map(d => {
            const ok = desbloqueada(c, d), dif = c.dificultades[d];
            const nota = !ok ? `<img class="ic-txt" src="img/iconos/candado.png" alt="">${razonBloqueo(c, d)}` : `<img class="ic-txt" src="img/iconos/estamina.png" alt="">${ESTAMINA_CAMPANA} · ${dif.enemigos.length} enem.${superada(c.id, d) ? ' · ✔' : ''}`;
            return `<button class="d-${d}" data-campana="${c.id}" data-dif="${d}" ${ok ? '' : 'disabled'}>${DIFICULTADES[d]}<small>${nota}</small></button>`;
          }).join('')}</div>${ORDEN_DIF.some(d => superada(c.id, d)) ? `<div class="difs autos">${ORDEN_DIF.map(d => superada(c.id, d)   // cada Auto debajo de su dificultad
            ? `<button data-auto="${d}" data-campana="${c.id}" aria-label="Auto ${DIFICULTADES[d]}"><img class="ic-txt" src="img/iconos/estamina.png" alt="">Auto</button>` : '<span></span>').join('')}</div>` : ''}` : `<small><img class="ic-txt" src="img/iconos/candado.png" alt="">${razonBloqueo(c, 'normal')}</small>`}</div>`;
      }).join('');
    }).join('');
    if (pantallaActual === 'pCampana') requestAnimationFrame(() => { const a = $('listaCampanas').querySelector('.actual'); if (a) a.scrollIntoView({ block: 'center' }); });
  }
  pintarCampanas();
  $('listaCampanas').addEventListener('click', e => {
    const a = e.target.closest('[data-auto]'); if (a) return barrido(CAMPANAS.find(x => x.id === a.dataset.campana), a.dataset.auto);
    const b = e.target.closest('[data-dif]'); if (!b) return;
    iniciarCampana(batallaCampana(CAMPANAS.find(x => x.id === b.dataset.campana), b.dataset.dif));
  });
