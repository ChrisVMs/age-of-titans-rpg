  // ---------------- inicio (pantalla) ----------------
  const $ = id => document.getElementById(id);
  if (!MODO_PRUEBAS) document.documentElement.classList.add('sin-pruebas');
  function ajustarLienzo() {
    const W = innerWidth, H = innerHeight, b = document.body;
    const girar = orientacion === 'horizontal' && H > W, vertical = orientacion === 'vertical' && W > H;
    const AW = girar ? H : W, AH = girar ? W : H;   // ancho y alto del lienzo antes de girarlo
    const ampliar = !vertical && AW > AH && AH > 520;
    const k = ampliar ? AH / ALTO_DISENO : 1;
    b.style.width = ampliar || girar ? `${AW / k}px` : vertical ? `${Math.min(W, Math.round(H * 9 / 19.5))}px` : '';
    b.style.height = ampliar || girar ? `${AH / k}px` : '';
    b.style.margin = vertical ? '0 auto' : '';
    b.style.transform = (girar ? `translate(${W}px,0) rotate(90deg) ` : '') + (ampliar ? `scale(${k})` : '');
    document.documentElement.classList.toggle('ampliado', ampliar);
  }
  addEventListener('resize', ajustarLienzo); ajustarLienzo(); bloquearOrientacion();
