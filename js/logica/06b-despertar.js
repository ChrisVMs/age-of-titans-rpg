  // ---------------- Despertar ----------------
  // Segunda vida de lo que ya está al máximo (mascota Nv 10, reliquia ★5, skin ★5), desde el nivel 50: 5 niveles que
  // suben su bono un PCT_DESPERTAR % cada uno. En D3 se activa la pasiva de su tipo y en D5 su efecto visual. Va antes
  // que mascotas, skins y reliquias porque sus cálculos lo usan. Añadir un tipo = una entrada en TIPOS_DESPERTAR.
  const DESPERTAR_MAX = 5, PCT_DESPERTAR = 10, D_PASIVA = 3, D_VISUAL = 5;
  const COSTE_DESPERTAR = [{ esencia: 30, oro: 20000 }, { esencia: 60, oro: 40000 }, { esencia: 100, oro: 70000 }, { esencia: 150, oro: 100000 }, { esencia: 220, oro: 150000 }];
  // máximo de cada tipo: se consulta al usarlo (las constantes están en sus archivos, que cargan después)
  const TIPOS_DESPERTAR = {
    mascota:  { nombre: 'Mascota', alMax: id => (jugador.mascotas || {})[id] >= MASCOTA_MAX,  pasiva: '25 % de que su acción se repita al turno siguiente' },
    reliquia: { nombre: 'Reliquia', alMax: id => (jugador.reliquias || {})[id] >= RELIQUIA_MAX, pasiva: 'sus efectos también dan a tus aliados (50 %)' },
    skin:     { nombre: 'Skin',    alMax: id => (jugador.skinsPropias || {})[id] >= 5,         pasiva: '+5 a su efecto especial y +3 al tope de ese efecto' },
  };
  const PASIVA_MASCOTA = .25, PASIVA_RELIQUIA = .5, PASIVA_SKIN = { valor: 5, tope: .03 };
  const nivelDespertar = (tipo, id) => ((jugador.despertar || {})[tipo] || {})[id] || 0;
  const multDespertar = (tipo, id) => 1 + nivelDespertar(tipo, id) * PCT_DESPERTAR / 100;
  const pasivaDespertar = (tipo, id) => nivelDespertar(tipo, id) >= D_PASIVA;
  const costeDespertar = (tipo, id) => COSTE_DESPERTAR[nivelDespertar(tipo, id)];
  const puedeDespertar = (tipo, id) => desbloqueado('despertar') && TIPOS_DESPERTAR[tipo].alMax(id) && nivelDespertar(tipo, id) < DESPERTAR_MAX;
  function despertar(tipo, id) {
    if (!puedeDespertar(tipo, id) || !tieneCoste(costeDespertar(tipo, id))) return false;
    pagar(costeDespertar(tipo, id)); ((jugador.despertar ||= {})[tipo] ||= {})[id] = nivelDespertar(tipo, id) + 1; return true;
  }
