  // ---------------- Escenarios de prueba ----------------
  // Reglas del combate comprobadas con el motor, sin pantalla: cada escenario corre aislado (copia de la partida, semilla
  // fija) y devuelve true si se cumple o un texto con lo que falló. Los "pendiente" documentan algo que todavía no está.
  // Jugador de prueba: partida nueva (equipo básico, sin esquiva ni efectos), guerrero del nivel y árbol indicados.
  function jugadorPrueba(nivel = 30, arbol = {}) {
    return Object.assign(partidaNueva(), { nombre: 'Prueba', clase: 'guerrero', nivel, arbol, formacion: { pos: 'frente', aliados: [] }, torre: { mejor: 0 } });
  }
  // batalla de prueba: 1 contra 1 (o en grupo con grupo: true) contra muñecos con mucha vida que pegan `dano`
  function batallaPrueba({ dano = [1, 1], vida = 1e6, n = 1, grupo = false } = {}) {
    const enemigos = Array.from({ length: n }, (_, i) => ({ nombre: `Muñeco ${i + 1}`, vida, dano: [...dano], armadura: 0, defensa: 0, oro: 0, xp: 0 }));
    return { nombre: 'Prueba', torre: grupo ? 1 : undefined, premio: {}, botin: { piedra: [0, 0], polvo: 0 }, enemigos };
  }
  const huboResultado = (ev, gano) => ev.some(e => e[0] === 'resultado' && e[1] === gano);
  const ESCENARIOS = [
    ['Misma semilla, misma batalla', () => {
      const una = s => { sembrar(s); jugador = jugadorPrueba(20); const r = jugarHastaFin(batallaCampana(CAMPANAS[2], 'normal')); return JSON.stringify([r, batalla.grupo.heroes.map(u => u.vida), batalla.grupo.enemigos.map(u => u.vida)]); };
      const a = una(7), b = una(7);
      return a === b || `distintas: ${a} / ${b}`;
    }],
    ['Danza de cuchillas: buff sin golpear, +50 % de daño 3 ataques', () => {
      const golpes = buff => {   // daño de 4 ataques normales con la misma semilla, con o sin el buff antes
        sembrar(3); jugador = Object.assign(jugadorPrueba(30), { clase: 'asesino' }); prepararBatalla(batallaPrueba());
        const e = enemigoDuelo(), d = [];
        if (buff) { const v = e.vida; resolverRonda(HABILIDADES.find(h => h.id === 'danza')); if (e.vida !== v) return null; sembrar(3); }
        for (let i = 0; i < 4; i++) { const v = e.vida; resolverRonda(null); d.push(v - e.vida); }
        return d;
      };
      const sin = golpes(false), con = golpes(true);
      if (!con) return 'Danza golpeó al enemigo';
      const r = con.map((x, i) => x / sin[i]);
      return r.slice(0, 3).every(x => x > 1.4 && x < 1.6) && Math.abs(r[3] - 1) < .02 || `proporción por golpe: ${r.map(x => x.toFixed(2))}`;
    }],
    ['El veneno se acumula hasta 5 pilas', () => {
      prepararBatalla(batallaPrueba());
      for (let i = 0; i < 7; i++) aplicarEstado(enemigoDuelo(), 'veneno', 3, 10);
      const v = enemigoDuelo().estados.veneno;
      return v && v.pilas === 5 || `pilas: ${v && v.pilas}`;
    }],
    ['Los jefes mundiales no se pueden aturdir', () => {
      prepararBatalla(batallaMundial('cerbero'));
      aplicarEstado(enemigoDuelo(), 'aturdimiento', 2);
      return !enemigoDuelo().estados.aturdimiento || 'Cerbero quedó aturdido';
    }],
    ['Último bastión salva de un golpe mortal (1 contra 1)', () => {
      jugador = jugadorPrueba(30, { bastion: 1 });
      prepararBatalla(batallaPrueba({ dano: [1e7, 1e7] }));
      resolverRonda(null);
      const yo = heroeYo();
      if (yo.vida !== 1 || !yo.bastionUsado) return `vida tras el golpe: ${yo.vida}`;
      return huboResultado(resolverRonda(null), false) || 'el segundo golpe mortal no lo derrotó';
    }],
    ['Segundo aliento cura al bajar del 30 % (1 contra 1)', () => {
      jugador = jugadorPrueba(30, { aliento: 3 });
      prepararBatalla(batallaPrueba());
      const yo = heroeYo(); yo.vida = Math.floor(yo.vidaMax * .3);
      resolverRonda(null);
      return yo.alientoUsado && yo.vida > yo.vidaMax * .5 || `vida: ${yo.vida} de ${yo.vidaMax}`;
    }],
    ['Cerbero pasa a modo infernal al bajar del 50 %', () => {
      prepararBatalla(batallaMundial('cerbero'));
      const e = enemigoDuelo(), yo = heroeYo();
      batalla.infernal = false; e.vida = Math.floor(e.vidaMax / 2) + 1; yo.vida = yo.vidaMax = 1e9;
      resolverRonda(null);
      return batalla.infernal || `vida de Cerbero: ${e.vida} de ${e.vidaMax}`;
    }],
    ['Asmodeo herido levanta el escudo', () => {
      prepararBatalla(batallaMundial('asmodeo'));
      const e = enemigoDuelo(), yo = heroeYo();
      e.vida = Math.floor(e.vidaMax * .4); batalla.turnoEscudo = ESCUDO.turnos - 1; yo.vida = yo.vidaMax = 1e9;
      resolverRonda(null);
      return batalla.escudoRestante === ESCUDO.dura || `escudo: ${batalla.escudoRestante}`;
    }],
    ['Un golpe mortal remata a Asmodeo aunque tenga el escudo', () => {
      jugador = jugadorPrueba(30);
      prepararBatalla(batallaMundial('asmodeo'));
      const e = enemigoDuelo(), yo = heroeYo();
      e.vida = 10; batalla.escudoRestante = ESCUDO.dura; yo.vida = yo.vidaMax = 1e9;
      resolverRonda(null);
      return e.vida <= 0 || `vida de Asmodeo: ${e.vida}`;
    }],
    ['El Minotauro entra en furia bajo el umbral', () => {
      prepararBatalla(batallaMundial('minotauro'));
      const e = enemigoDuelo(), yo = heroeYo();
      e.vida = Math.floor(e.vidaMax * FURIA.umbral * .85);   // con margen por si esta semana regenera
      batalla.turnoFuria = FURIA.turnos - 1; yo.vida = yo.vidaMax = 1e9;
      resolverRonda(null);
      return batalla.furiaRestante === FURIA.dura || `furia: ${batalla.furiaRestante}`;
    }],
    ['En grupo, tu golpe va al objetivo marcado', () => {
      jugador = jugadorPrueba(30);
      prepararBatalla(batallaPrueba({ n: 4, grupo: true }));
      const t = batalla.grupo.enemigos.find(u => u.pos === 'atras'); batalla.grupo.objetivo = t;
      resolverRonda(null);
      const otros = batalla.grupo.enemigos.filter(u => u !== t && u.vida < u.vidaMax);
      return t.vida < t.vidaMax && !otros.length || `objetivo ${t.vida}/${t.vidaMax}, otros golpeados: ${otros.length}`;
    }],
    ['El simulador no cambia la partida', () => {
      const antes = JSON.stringify(jugador), guardado = localStorage.getItem(CLAVE), uid = sigUid;
      simular(batallaPrueba({ dano: [5, 9], vida: 300 }), { veces: 20 });
      return JSON.stringify(jugador) === antes && localStorage.getItem(CLAVE) === guardado && sigUid === uid || 'la partida o lo guardado cambió';
    }, { libre: true }],
    ['Espinas devuelve daño también en grupo', () => {
      jugador = jugadorPrueba(30);
      const c = batallaPrueba({ dano: [0, 0], grupo: true }); c.enemigos[0].espinas = .1;
      prepararBatalla(c);
      const yo = heroeYo(), e = batalla.grupo.enemigos[0]; batalla.grupo.objetivo = e;
      resolverRonda(null);
      return yo.vidaMax - yo.vida >= 2 || `daño recibido: ${yo.vidaMax - yo.vida} (el muñeco pega 1; las espinas, al menos 1 más)`;
    }],
    ['Último bastión también en grupo', () => {
      jugador = jugadorPrueba(30, { bastion: 1 });
      prepararBatalla(batallaPrueba({ dano: [1e7, 1e7], grupo: true }));
      resolverRonda(null);
      const yo = batalla.grupo.heroes.find(h => h.yo);
      if (yo.vida !== 1) return `vida tras el golpe: ${yo.vida}`;
      return huboResultado(resolverRonda(null), false) || 'el segundo golpe mortal no lo derrotó';
    }],
    ['Segundo aliento también en grupo', () => {
      jugador = jugadorPrueba(30, { aliento: 3 });
      prepararBatalla(batallaPrueba({ grupo: true }));
      const yo = batalla.grupo.heroes.find(h => h.yo); yo.vida = Math.floor(yo.vidaMax * .3);
      resolverRonda(null);
      return yo.alientoUsado && yo.vida > yo.vidaMax * .5 || `vida: ${yo.vida} de ${yo.vidaMax}`;
    }],
  ];
  // Corre todos los escenarios: [{ nombre, ok, detalle, pendiente }]
  function correrEscenarios() {
    return ESCENARIOS.map(([nombre, fn, { libre = false, pendiente = false } = {}]) => {
      let r;
      try { r = libre ? fn() : aislado(() => { sembrar(1); return fn(); }); }
      catch (e) { r = `error: ${e.message}`; }
      return { nombre, ok: r === true, detalle: r === true ? '' : String(r), pendiente };
    });
  }
