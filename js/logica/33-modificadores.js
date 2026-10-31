  // ---------------- Modificadores (jefes semanales y Torre) ----------------
  const MODIFICADORES = [
    { id: 'frenesi',  icono: '😡', nombre: 'Frenesí',      desc: '+25 % de daño',                ap: e => { e.dano = e.dano.map(x => Math.round(x * 1.25)); } },
    { id: 'coraza',   icono: '🛡️', nombre: 'Coraza',       desc: '+60 de armadura',              ap: e => { e.armadura = (e.armadura || 0) + 60; } },
    { id: 'robusto',  icono: '💪', nombre: 'Robusto',      desc: '+40 % de vida',                ap: e => { e.vida = Math.round(e.vida * 1.4); }, soloTorre: true },
    { id: 'espinas',  icono: '🌵', nombre: 'Espinas',      desc: 'te devuelve el 10 % del daño',  ap: e => { e.espinas = .1; }, torre: { desc: 'te devuelve el 5 % del daño', ap: e => { e.espinas = .05; } } },   // en la Torre, al 10 % los pisos de jefe eran un muro
    { id: 'regen',    icono: '💚', nombre: 'Regeneración', desc: 'recupera el 2 % de vida por turno', ap: e => { e.regen = .02; }, soloTorre: true },   // en jefes mundiales curaba ~300-500 por turno
    { id: 'igneo',    icono: '🔥', nombre: 'Ígneo',        desc: 'sus golpes queman',            ap: e => { e.aplica = [...(e.aplica || []), { estado: 'quemadura', prob: .3, turnos: 2, pct: .04 }]; } },
    { id: 'gelido',   icono: '❄️', nombre: 'Gélido',       desc: 'sus golpes congelan',          ap: e => { e.aplica = [...(e.aplica || []), { estado: 'congelacion', prob: .15, turnos: 1 }]; } },
    { id: 'venenoso', icono: '☠️', nombre: 'Venenoso',     desc: 'sus golpes envenenan',         ap: e => { e.aplica = [...(e.aplica || []), { estado: 'veneno', prob: .35, turnos: 3, pct: .025 }]; } },
  ];
  for (const m of MODIFICADORES) m.img = 'mod_' + m.id;   // icono HD: img/iconos/mod_<id>.png
  function elegirMods(rnd, n, pool) { const p = [...pool], r = []; while (r.length < n && p.length) r.push(p.splice(Math.floor(rnd() * p.length), 1)[0]); return r; }
  // jefes mundiales: 2 modificadores por semana (la vida máxima no cambia: se comparte entre intentos)
  const modsSemana = () => elegirMods(azarSemilla('jefes' + semana()), 2, MODIFICADORES.filter(md => !md.soloTorre));
