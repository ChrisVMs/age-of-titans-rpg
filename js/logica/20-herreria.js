  // ---------------- Herrería ----------------
  let herSel = null, herTab = 'encantar', lineaSel = 0, candidato = null, bendecir = false;
  const pagar = c => { for (const [k, v] of Object.entries(c)) if (k === 'oro') jugador.oro -= v; else if (k !== 'prob') jugador.mat[k] -= v; };
  let filtroHer = 'todos';
