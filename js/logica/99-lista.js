  // ---------------- Fin de la lógica ----------------
  logicaLista = true;   // ya está todo definido (campañas, jefes...): la colección puede contarlos
  if (jugador.arbolDevuelto) { delete jugador.arbolDevuelto; guardar(); setTimeout(() => ui.avisar(`Árbol reiniciado: ahora el máximo es ${PUNTOS_ARBOL_MAX} puntos`), 800); }
