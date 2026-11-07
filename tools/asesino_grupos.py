"""asesino_grupos.py - Casillas de img/asesino/tira.png que usa cada animación de una skin del Asesino.
Lo usan tira_skin_asesino.py (arma la tira de la skin) y hoja_base_asesino.py (exporta las hojas base para el generador)."""
# casilla de la tira original <- cuadro de la skin (en el orden en que el juego los usa)
REPOSO = [70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 0, 1, 2]   # el reposo de la skin tiene 13 cuadros propios
GRUPOS = {
    'reposo': REPOSO,
    'ataque': list(range(11, 20)),
    'retroceso': [56, 57, 62, 64, 65],
    'punalada': [100, 101, 102, 108, 103, 104, 105, 106, 107, 5, 6, 7, 8, 9, 10, 21, 89, 90, 91, 92, 93, 95, 96, 97, 98, 27, 81, 28, 83, 84, 86],
    'paso': [35, 36, 37, 38, 39, 20, 21, 22, 23, 24, 28, 29],   # la Danza usa 35-39: mismos cuadros
    'derrota': list(range(41, 55)),
}
# cómo se reparte cada animación en hojas para el generador (cuadros por hoja, columnas): la Puñalada y la Derrota, en varias
HOJAS = {
    'reposo': [(13, 5)], 'ataque': [(9, 5)], 'retroceso': [(5, 3)], 'paso': [(12, 5)],
    'punalada': [(12, 4), (12, 4), (7, 4)], 'derrota': [(7, 4), (7, 4)],
}
