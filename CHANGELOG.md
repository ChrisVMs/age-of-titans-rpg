# Versiones de Batalla

La versión del juego está en `VERSION_JUEGO` (`index.html`). Se muestra abajo a la izquierda del Campamento y en el menú 🧪 de pruebas. Cada partida guarda con qué versión se grabó (`jugador.version`).

En la app Android (`C:\PROYECTOS\BATALLA-MOBILE`) va la misma versión en `package.json` y en `android/app/build.gradle`:

- `versionName`: la versión del juego.
- `versionCode`: un número entero que sube en cada entrega a Google Play.

## Sin publicar (rama `qa`)

### 🗡️ Asesino (clase nueva)
- +12 % ataque, −10 % vida, −15 % defensa; +8 % crítico, +15 % daño crítico, +5 % esquiva.
- Habilidades: **Puñalada** (×1,6, sangra), **Paso sombrío** (×2,4, envenena) y **Danza de cuchillas** (×3,5, atraviesa armadura; se aprende en el árbol).
- Árbol de 3 ramas: Filo, Sombras y Venenos.
- Va cuerpo a cuerpo (también en grupo). Sprite propio de 100 cuadros (`img/asesino/tira.png`) con todas sus hojas (`tools/hojas/asesino_*.jpg`, 100 cuadros):
  reposo animado, ataque, habilidades, retroceso al recibir un golpe y derrota.
- Arquero y Maga marcan `distancia` en `CLASES`: el resto de clases ataca cuerpo a cuerpo.

### 🔮 Maga
- La clase Mago pasa a ser **Maga**, con sprite y animaciones propios (antes usaba los del guerrero).
- Ataca y lanza sus habilidades desde su sitio: prepara el bastón, conjura y suelta una bola de fuego.
- Frames en `img/maga/`, recortados de `tools/hojas/maga_hd.jpg` con `tools/split_sheet.py`. `tira.png` sigue las 14 poses del guerrero.

### 🎁 Misiones
- Barra de actividad: cofres al completar 2, 4 y 6 misiones del día (3 y 5 de la semana).
- Evento semanal (desde el nivel 10): cada semana una actividad da fichas para la tienda del evento, con un título exclusivo del tema.

### 📱 Batalla en vertical
- En vertical la batalla en grupo va en diagonal (tu grupo abajo, los enemigos arriba) y sale ~1,7 veces más grande; en los duelos los dos luchan más juntos y se ven más grandes.
- Los botones de huir, velocidad, sonido y auto van en 2×2 y la barra superior ya no se corta.

### 🔥 Estados y curas
- Quemaduras, venenos y sangrados de los monstruos hacen daño fijo según el contenido (~2,5 % de la vida esperada): al hacerte más fuerte, duelen menos. Jefes: como mucho el 2,5 % de tu vida.
- El mismo estado no se acumula en ti ni en los jefes: reinicia su duración.
- Las mascotas tienen su propia fuerza (un % de tus estadísticas según calidad y nivel); su golpe y su cura son su ataque × un multiplicador. Segundo aliento y el set de Asmodeo curan según tu ataque y tu daño, no un % de la vida.

### 📈 Ritmo
- El nivel 80 vuelve a costar ~3,5-4 meses (el barrido de las etapas altas daba demasiada experiencia).

### 🗼 Torre alta
- Desde el piso 100, los hitos dan Esencia y cada 50 pisos una pieza Ancestral. La Torre es más suave desde el piso 90 (el 100 era un muro).

### 📚 Códice
- La Colección suma 5 colecciones (títulos, piezas de set, bestiarios de las etapas 2 y 3, cazador veterano), premios al 25/50/75/100 % y marcos de perfil.

### 🗡️ Ecos (con la Arena)
- 4 rivales con nombre que crecen contigo y se vengan. Cada día uno te reta (gratis) y compiten contigo en un ranking semanal con premio.

### 🏚️ Ruinas del campamento (desde el nivel 5)
- Reconstruye 6 edificios: producen oro y materiales aunque no juegues (hasta llenar el almacén) y dan un bono pequeño.

### ✨ Despertar (desde el nivel 50)
- Arreglado: con una skin en D5 el guerrero desaparecía en batalla (choque de nombres de estilo con la estela de la espada).
- Mascotas, reliquias y skins al máximo se despiertan con Esencia: 5 niveles (+10 % del bono cada uno), pasiva en D3 y brillo en D5.
- La Esencia del barrido y de los calabozos baja: el aura y el despertar duran meses.

### 🌀 La Grieta (desde el nivel 25)
- 15 pisos que cambian cada semana. La vida no se recupera entre pisos y tras cada victoria eliges 1 de 3 bendiciones. 2 intentos por semana.

### ⚡ Estamina y cristales
- Tocar la estamina abre las recargas: 3 anuncios al día (+50 cada uno) y una recarga de +150 por 50 💎.
- Cristales 💎: en los cofres de misiones y la primera vez que completas un capítulo en cada dificultad.

### 🔊 Sonido
- Botón para silenciar o activar el sonido, en el Campamento y en la batalla (se recuerda).

### 🧪 Modo pruebas
- Velocidad x5 en batalla (también la usa el bot).
- Menú de pruebas por grupos (recursos, bots y simulación, partida, otros). Un solo botón rellena estamina y todas las entradas; otro da materiales y 💎.
- 📈 Simular progresión: eliges los días (hasta 180) y desde dónde (partida nueva o tu personaje), se ve el avance, puedes simular más días sobre el mismo personaje y seguir jugando con él.
- El botón 🤖 Parar bot se ve también en batalla, y salir de una batalla a mano para el bot.
- 🤖 Bot: jugar solo: al acabarse la estamina ve los anuncios, recarga con cristales y pasa al día siguiente, hasta que lo pares.
- En la web y en la app: 7 toques en la versión del Campamento lo activan o lo quitan (con su propia partida, aparte de la real).

### ⚔️ Combate
- Un solo motor de combate para todos los modos: la arena y los jefes mundiales siguen las mismas reglas que la campaña, la Torre y el calabozo.
- El daño enemigo en grupo ya no se divide entre 2 al pegar: los monstruos de grupo tienen directamente la mitad de daño (mismo resultado, números limpios).
- Último bastión y Segundo aliento funcionan también en grupo.
- Espinas funciona en todos los modos (antes, en los pisos de la Torre se mostraba pero no hacía nada). En la Torre devuelve el 5 % del daño; en los jefes mundiales, el 10 %.
- Iguales en todos los modos: el contraataque de tu skin hace el 60 % de tu golpe; la Regeneración del enemigo cura después de sus estados; si pierdes el turno, la habilidad elegida se gasta; si el rival esquiva tu habilidad, no le aplica su estado.
- Arreglado: el golpe que remataba a Asmodeo con el escudo puesto no lo mataba.
- Arreglado: el set 4 del Minotauro podía dejarte vivo ante un golpe mortal en grupo.
- Durante una ronda no se puede huir.

### 📈 Progresión más larga
- La experiencia por nivel crece más rápido desde el nivel 30: llegar al 80 lleva unos 3,5-4 meses jugando cada día y viendo anuncios (antes, ~30 días).
- El Auto (barrido) da la mitad de experiencia que pelear el nivel; el oro y los materiales no cambian.
- Calabozo: si vas solo, los enemigos tienen +50 % de vida (pide ir en grupo).

### 🧪 Pruebas
- Simulador de batallas, escenarios de prueba y bot que juega solo (menú 🧪).

## 0.2.1 — 2026-10-25

### 📱 Pantalla vertical y horizontal
- Botón de orientación arriba a la derecha del Campamento: 🔄 Auto (gira con el móvil), ▭ Horizontal o ▯ Vertical. Se recuerda.
- Si el sistema no deja girar la pantalla, el juego se adapta: en Vertical con la ventana horizontal se dibuja un móvil vertical centrado, y en Horizontal con la ventana vertical el juego se gira 90°.
- Sustituye la casilla «Vista vertical» del menú de pruebas.

### 🛡 Batalla por grupos (Campaña y Torre)
- Formación en rombo 1-2-1: Frente, Arriba, Abajo y Retaguardia. Botón «🛡 Formación» en Campaña y Torre para elegir tu casilla y llevar hasta 2 bots como aliados (máx. 3 jugadores).
- Hasta 4 enemigos a la vez, con el jefe al frente.
- Los golpes normales eligen objetivo según la casilla (Frente 50 %, Arriba 20 %, Abajo 20 %, Retaguardia 10 %); las habilidades caen sobre cualquiera.
- Todos actúan en cada ronda: tú eliges tus habilidades y los aliados usan las suyas solos. El Guerrero ataca cuerpo a cuerpo; Arquero y Mago disparan desde su casilla.
- Estados por unidad; la mascota y el botín funcionan como antes.
- Equilibrio provisional: daño enemigo ×0,5 en grupo y +70 % de vida enemiga por aliado.
- La Arena sigue siendo 1 contra 1.

### 👥 Salas multijugador (Torre de reyes)
- La pantalla de la Torre de reyes muestra la lista de salas abiertas (número y jugadores, p. ej. 👥 2/3): puedes crear una o unirte.
- 3 huecos que se llenan de izquierda a derecha con el personaje y su nombre: el dueño y luego los que llegan. El dueño invita, expulsa, elige dificultad y formación (rombo) y empieza.
- Cada invitado pulsa Ready desde su lado; Empezar se habilita cuando todos están listos. Si el dueño sale, el jugador 2 pasa a ser el dueño.
- Al volver de una batalla (o huir), la sala vuelve a la fase previa: los invitados deben pulsar Ready otra vez.
- Dentro de una sala no hay flecha de volver: la única salida es «Abandonar sala».
- Pruebas: los invitados son bots, aceptan y pulsan Ready 1 s después de llegar; si sales de tu sala, salen todos. Hay 2 bots nuevos (Sigrid y Elric). Los reyes son réplicas del top 3, así que esos jugadores también pueden entrar e invitarse.
- El ranking del servidor tiene su propia pantalla (🏅 Ranking en el Campamento): al elegir un jugador se ve su personaje a la derecha.
- Los jefes mundiales siguen siendo 1 contra 1, sin sala.

### 🏰 Calabozo multijugador
- Al pulsar BATALLA eliges entre 📜 Campaña y 🏰 Calabozo multijugador.
- El calabozo usa las mismas salas que la Torre de reyes (lista, crear/unirse, invitar, Ready, formación). Tu grupo lucha contra 3 monstruos y un jefe a la vez.
- El calabozo se elige en un combo arriba de la lista: se ven sus salas y «Crear sala» abre una para ese calabozo. 4 calabozos: ⚰️ Cripta del cementerio (Nv 10), 🏛️ Mausoleo ancestral (Nv 12), 🌫️ Ciénaga de la bruja (Nv 14) y 🌋 Abismo de brasas (Nv 16), calibrados para que con ~5,5k de poder la Cripta en Normal no se pase solo y se gane con 3 jugadores (enemigos del calabozo con ×2,3 de vida y ×1,5 de daño sobre su nivel). La dificultad se elige con botones bajo el título; cada uno se desbloquea al superar el anterior. Dificultades: solo Normal abierta; cada una se desbloquea al superar la anterior en ese calabozo. La dificultad la elige el dueño; cambiarla obliga a pulsar Ready otra vez.
- No gasta estamina: 2 intentos al día. Si vas solo, pide confirmación (es difícil). Sin intentos puedes entrar igual a ayudar, sin recompensa (se avisa antes). Paga 1,5 veces el premio de la campaña de su nivel, más el botín de cada enemigo. +70 % de vida enemiga por aliado.
- Turno con tiempo en multijugador (calabozo y Torre de reyes): tienes 10 s para elegir tu ataque; si no pulsas nada, se lanza un ataque normal. La cuenta se ve sobre el botón de atacar y se pausa con el autoataque.
- Sin acelerador en multijugador (calabozo y Torre de reyes): se juega a x1 y el botón ⏩ no aparece, salvo en modo pruebas. En combates individuales (campaña, torre, arena, jefes) sigue igual.
- Cambiar la dificultad de una sala devuelve a todos a la fase previa: hay que pulsar Ready otra vez.

### 🗼 Torre rebalanceada y materiales explicados
- Torre: los monstruos ya no sueltan botín; solo hay una recompensa al superar el piso, y es la mitad que antes (● 50 × piso, 30 XP × piso, menos piedras, polvo y almas cada 5 pisos; hito cada 10: ● 250 × piso y 3 + piso/10 almas). Dificultad algo mayor: el piso n equivale a campaña 1 + (n−1)/3,5 (antes /4) con +15 % de vida. Antes se encadenaban muchos pisos, se mejoraba con lo ganado y se volvía a encadenar, acortando el juego.
- Materiales: al tocar 🔷 ✨ 💠 en la barra de la Herrería o en el inventario se explica qué es, para qué sirve y dónde conseguirlo. Si falta un material al encantar, refinar o pulir, el aviso dice su nombre y dónde conseguirlo (con OK); si solo falta oro, sigue siendo un aviso breve.

### 🎯 Objetivo y jefe atrás (batallas en grupo)
- El jefe de los monstruos va siempre en la retaguardia; el resto, delante. Los reyes mantienen su orden.
- Tocar un enemigo lo elige como objetivo (diana 🎯 y brillo rojo): tus golpes y habilidades van a él. Sin elegir, o si cae, se marca el más adelantado; también en autoataque.

### 📅 Login de 30 días
- Pruebas: botón «Día X +» arriba en el Campamento. Cada + adelanta un día la fecha del juego: reinicia misiones diarias, login, estamina, entradas y evento del día; lo semanal se reinicia al cumplirse la semana. Solo en modo pruebas.
- Nuevo icono 📅 Login en la fila de arriba del Campamento (con aviso rojo si hoy toca). Abre una ventana con 30 casilleros: cada día que entras se activa el siguiente (no hace falta que sean seguidos). Premios crecientes, más grandes los días 7, 14, 21 y 28, y el 30 (● 10 000, 💠 30, ✨ 30). Al completar el 30 vuelve al 1.
- Sustituye al login de 7 días de Misiones.

### ⚡ Auto en campaña
- En cada nivel de campaña ya superado aparece «⚡ Auto <dificultad>» para las dificultades superadas: cobra las recompensas sin pelear gastando ⚡ 10, como una partida. Da lo mismo que ganarla (premio, oro y XP de los enemigos, piedras, polvo y probabilidad de equipo, con eventos y efectos) y cuenta para misiones, bestiario y maestría. Solo en campaña.

### 🔓 Desbloqueo por nivel
- Curva de experiencia: igual hasta el nivel 30; desde ahí cada nivel cuesta ×1,03 más por nivel. Nv 51 pasa de 435k a 570k de XP total y Nv 80 de 1,35 M a ~3,4 M.
- Los candados también se aplican en modo pruebas (solo los bots siguen siendo exclusivos de pruebas).
- 🎒 Inventario: nuevo acceso en la fila de iconos del Campamento con todos los objetos (con filtros) y los materiales; en Héroe → Objetos queda el equipo puesto y un botón al inventario.
- Las funciones se abren poco a poco: Herrería Nv 3 · Mascotas Nv 5 · Habilidades Nv 8 · Torre Nv 10 · Refinar y pulir Nv 12 · Arena Nv 15 · Runas, reliquias y expediciones Nv 18 · Skins, títulos y colección Nv 20 · Calabozo Nv 25 · Jefes mundiales Nv 30 · Torre de reyes Nv 35.
- Lo bloqueado se ve apagado con «🔒 Nv X»; al tocarlo, un aviso dice cuándo se abre. Al subir al nivel, «🔓 ¡Desbloqueado: …!».
- Las misiones de modos bloqueados no aparecen. El próximo desbloqueo sale en 🎯 Objetivos cuando faltan 3 niveles o menos.
- Quien ya pasó el nivel, o ha ascendido, lo tiene todo abierto. En modo pruebas, todo está abierto.
- Bug: el diálogo de confirmación y el aviso de pestaña duplicada estaban dentro de la pantalla de batalla y no se veían fuera de ella (reiniciar, desguazar, fundir runas, ascender, guardar el árbol). Ahora están a nivel de página.
- Botón de pruebas: reiniciar el personaje (nivel 1, sin oro ni materiales, conserva el nombre).

### ✨ Pulido — skins, Poder, economía y bugs
- Skins: el efecto especial crece con las estrellas (★1 60 % → ★5 100 % de su valor, más brillo en ★5); la ficha muestra lo que da la siguiente ★. Bonos pequeños con identidad (Infernal daño, Cristalino crítico, Necro-guardián aguante, Áurico economía, Obsidiana jefes); ninguna es obligatoria.
- Poder: cada set de 4 piezas completo suma +4 %.
- Herrería: convertir piedras en almas (🔷 40 + ● 500 → 💠 1, hasta 10 de una vez). Sumidero de piedras y red de seguridad para las almas.
- Bug: con la pantalla de misiones abierta al cambiar de día, un botón viejo podía cobrar otra vez; ahora se revalida antes de pagar.
- Bug: comprar una mascota que ya tenías la devolvía a nivel 1, y «mejorar» sin tenerla costaba 0. Mandar una expedición con otra en curso la sobrescribía.
- Debug: los botones de prueba (oro, estamina, jefes, fases, perfiles de bot) y los valores iniciales de prueba solo existen en modo pruebas.

### 🔁 Fase 4 — Retención
- Eventos rotativos, uno por día: lunes 🔨 Forja (+50 % piedras y polvo, encantar −25 % de oro) · martes 🏹 Cacería (+50 % de equipo y +15 % de subir rareza) · miércoles 💰 Oro (+50 %) · jueves 👹 Jefes (+50 % de recompensas y de piezas de set) · viernes 📈 Experiencia (+50 %, también maestría) · fin de semana 🎁 Botín (doble equipo y polvo). El aviso del Campamento muestra también el de mañana.
- Cada modo tiene una recompensa propia: Torre → almas cada 5 pisos (el recurso escaso de encantar) · Arena → polvo de refinamiento (5 + liga) · Calabozo → un objeto garantizado (épico en Normal; legendario o mítico en Pesadilla e Infierno) · Jefes → reliquias y piezas de set · Campaña → equipo y piedras · Torre de reyes → premio semanal y título.
- 🎯 Objetivos en el Campamento: los 3 más cercanos de distinto tipo (nivel, maestría y especialización, siguiente ★ de skin, mascota, set n/4, pieza casi perfecta, encantamiento, piso de Torre, calabozo), con barra de progreso; tocar uno lleva a su pantalla.
- Bug: un premio con un recurso que el botín no llevaba (almas) daba NaN; ahora se suma bien y se muestra en el resultado.

### 🧩 Fase 3 — Builds
- Reliquias: solo 3 activas a la vez (botones ACTIVAR/Quitar en Runas). Valen más por nivel que antes (resistencia 4, jefes 5, esquiva 3, habilidad 5, penetración 4, daño crítico 8 %/nivel). Partidas sin elección usan las 3 de más nivel.
- Especialización de maestría desde Nv 10, una por clase: 💥 Destructor (+8 % habilidad, +6 % penetración), 🛡️ Bastión (+5 % reducción, +10 % curación) o ⚔️ Gladiador (+4 % crítico, +6 % contraataque). ×1,5 en Nv 30 y ×2 en Nv 50. La primera es gratis; cambiarla cuesta ● 3 000.
- Árbol de habilidades con tope de 45 puntos (el árbol completo cuesta 51): incluso con todas las ascensiones hay que elegir.
- Jefes como prueba de build:
  - Cerbero (crítico): en modo infernal los críticos solo se dividen entre 1,5 (el resto, entre 3).
  - Asmodeo (sostenido y habilidades): una habilidad rompe su escudo; quemado, envenenado o sangrando se cura la mitad. Curación del 10 % al 4 % (con su vida actual anulaba casi todo el daño).
  - Gran Minotauro (aguante): la reducción de daño frena el doble la parte del Gran Tajo que va por tu vida.
  - Cada jefe indica en sus reglas qué build premia.
- El modificador semanal Regeneración ya no sale en jefes mundiales (curaba 300-500 por turno); sigue en la Torre.

### 🎯 Fase 2 — Progresión
- Calidad del objeto según las estrellas de sus líneas: Mala, Decente, Buena, Excelente, Casi perfecta (85 %+) o Perfecta (todo ★5). Se ve en la ficha y en la herrería.
- Refinamiento: nuevo **Pulir ★** (● 300 · ✨ 3) que vuelve a sortear solo las estrellas de una línea, manteniendo el atributo, para terminar piezas casi perfectas. Garantía: tras 9 sorteos sin ★4+ en un objeto, el siguiente sale ★4 o ★5. El equipo de jefe refina solo atributos secundarios, como al crearse.
- Encantamiento con protección contra rachas: cada fallo seguido suma probabilidad y la garantía llega tras 3/5/8/15 fallos seguidos (éxito base 60/35/22/10 %). Se muestra en la herrería; un éxito reinicia la racha y bajar de nivel no la borra.
- Runas raras (15 %) y perfectas (3 %) al crearlas: suman un efecto secundario a 1/3 o 2/3 del valor por nivel. La fusión conserva la mejor calidad (10 % de subirla). Nuevo **Pulir** (● 1 000 · ✨ 10): sube la calidad (30 % a rara, 8 % a perfecta, garantía en 4 y 12 pulidos) o cambia el secundario.
- Sets de jefe de 4 piezas (6 piezas nuevas): 2 piezas bono pequeño, 3 piezas bono importante y 4 piezas efecto especial. Cerbero: los críticos queman. Asmodeo: cada habilidad cura un 6 % de la vida. Minotauro: golpes de más del 15 % de la vida se reducen un 35 %. Funcionan en 1 contra 1 y en grupo.
- Garantía de pieza de set: 8 intentos seguidos contra un jefe sin pieza dan una segura, preferentemente una que aún no tengas.

### ⚔️ Fase 1 — Combate y balance
- Bonos en % (mascota, skin, árbol, runas, maestría, colección, ascensión y título) se suman en un solo bloque y se aplican una vez; antes se multiplicaban en cadena y el endgame crecía de forma exponencial. La clase sigue aparte. Poder de los bots: −2 % a −7 %.
- Un solo orden de cálculo del golpe en 1 contra 1 y en grupo: bruto → (habilidad + jefes + remate en el mismo bloque) → crítico → armadura/defensa → reducción de daño → escudos y fases. En grupo el daño de habilidades ya no se multiplica aparte.
- La armadura de monstruos y jefes reduce tu daño con la misma fórmula que la tuya; la penetración quita armadura efectiva y los golpes perforantes la ignoran. Antes la armadura enemiga no hacía nada sin penetración. La mordida de la mascota también cuenta la armadura.
- Resistencia con una sola tirada: el 60 % de su valor evita el estado y el 40 % reduce su daño (al tope: 45 % de evitarlo, −30 % de daño). También atenúa la bola de fuego de Cerbero y el Gran Tajo. Antes contaba dos veces y al tope anulaba casi todo.
- Topes nuevos: robo de vida 25 %, contraataque 35 %, remate 50 %, curación 100 %.
- Jefes recomprobados: con 25k de poder, ~8 500 de daño a Cerbero por intento (sigue cayendo en 2).

### ⚖️ Correcciones de la auditoría
- Torre: el botín de los enemigos solo se cobra si superas el piso (perder a propósito era farmeo infinito, porque no cuesta estamina).
- Bots solo en modo pruebas: fuera de él no hay aliados bot en la formación, ni invitaciones, ni salas de bots en las listas. (El ranking y los reyes siguen simulando el servidor.)
- Encantamiento: éxito +10..+12 60 %, +13..+15 35 %, +16..+20 22 %, +21..+25 10 %. Desde +15, fallar tiene un 50 % de bajar un nivel. Bendición: +10 % y sin degradación por 400 × nivel de oro y (nivel − 9) almas. A +18: sin bendición ~70k oro y ~1 100 almas; con bendición ~155k oro y ~320 almas.
- Calabozo: niveles 3, 5, 8 y 10 (dentro de la campaña) y premio ×1,5 en vez de ×2. En la sala de otro no se desbloquea un calabozo saltándose el anterior.
- Jefes mundiales calibrados para 25-30k de poder: Cerbero 15 000 de vida y 250-350 de daño, Asmodeo 20 000 y 320-430, Gran Minotauro 25 000 y 300-400. Con 25k se quitan ~9 900 por intento (Cerbero en 2 intentos, Minotauro en 3). Recompensas por daño reajustadas a la nueva vida.
- Abandonar a mitad de ronda ya no cuenta muertes para misiones, bestiario ni maestría.
- Aviso si la partida no se puede guardar (almacenamiento lleno), en vez de perderse en silencio.
- Una sola pestaña a la vez: si el juego ya está abierto en otra, esta queda bloqueada sin guardar; «Jugar aquí» la recupera y bloquea la otra.

### Seguridad
- El modo pruebas ya no se activa con `?pruebas` en cualquier dirección: solo abriendo el archivo (file://) o en un servidor local 127.0.0.1 con `?pruebas`. En la web desplegada y en la app Android nunca aparece.

### Interfaz
- Nombre del jugador: se edita en Héroe → perfil (✏️), 3-14 caracteres y distinto de los jugadores del ranking. Se ve en el Campamento, la batalla, las salas y los rankings. Las partidas sin nombre reciben uno provisional (Héroe1234).
- Filtros de objetos (bolsa y herrería) como iconos de ranura con su contador.

### 👑 Torre de reyes: 3 contra 3 y dificultades
- Ahora tu grupo lucha contra los 3 reyes a la vez en el rombo (n.º 1 al frente). Los reyes luchan como jugadores: su aspecto, sus habilidades de clase, golpes de estado y efectos (esquiva, reducción, resistencia, robo, contraataque), con inmunidad a control encadenado.
- Dificultades según un % de los atributos reales de los reyes (ataque, defensa, vida y armadura): Normal 60 %, Difícil 80 %, Pesadilla 100 % e Infierno 130 %.
- Premio de cada dificultad la primera vez que se gana en la semana: Normal ● 5 000 y 10 almas · Difícil ● 10 000, 20 almas y 5 polvo · Pesadilla ● 20 000, 40 almas y 15 polvo · Infierno ● 35 000, 70 almas y 30 polvo. Título «Matarreyes» al ganar en Pesadilla o Infierno.
- 3 intentos al día. Botón de pruebas para reiniciar intentos y premios.

### 🐞 Corrección: Arena y Torre de reyes demasiado fáciles
- Tu golpe ignoraba la armadura y la defensa de los rivales, mientras que el suyo sí pasaba por las tuyas. Ahora los rivales (Arena y reyes) se defienden con la misma fórmula que tú; la penetración les quita armadura y los golpes perforantes la ignoran. La mordida de la mascota también cuenta su defensa.
- Los rivales usan sus efectos defensivos reales: esquiva, reducción de daño, resistencia a estados, robo de vida y contraataque (en la Arena, los tuyos, porque el rival es tu espejo).
- Inmunidad a control para todos los rivales, como los jefes: tras un aturdimiento o una congelación no se les puede volver a controlar enseguida.

## 0.2.0 — 2026-10-25

### 👑 Torre de reyes (evento semanal)
- Subes la torre venciendo en orden a los 3 reyes, que son el top 3 del ranking del servidor sin contarte a ti.
- Cada rey lucha con sus estadísticas y efectos reales (vida, ataque, armadura, crítico y daño crítico) y usa un Golpe real cada 4 turnos.
- 3 intentos al día; el progreso se reinicia cada lunes.
- Premios: rey n.º 3 ● 5 000 y 10 almas; n.º 2 ● 10 000, 20 almas y 10 polvo; n.º 1 ● 20 000, 40 almas y 20 polvo, más el título mítico «Matarreyes».

### Bots y ranking del servidor
- 4 bots de distintas clases, con perfiles completos montados con las piezas reales del juego. Su Poder lo calcula la misma función `poder()`:

  | Bot | Clase | Nivel | Poder |
  |---|---|---|---|
  | Thorin | Mago | 60 | ⚔ 29 294 |
  | Kaito | Guerrero | 57 | ⚔ 27 054 |
  | Lyra | Arquero | 56 | ⚔ 25 870 |
  | Morgana | Guerrero | 54 | ⚔ 25 273 |

- Ranking del servidor en la Torre de reyes, con los bots y tu personaje.
- Modo pruebas (🧪): "Jugar con un bot" carga un bot como partida. Tu partida se guarda aparte y vuelve con "Volver a mi partida". El bot con el que juegas no aparece duplicado ni te toca como rey.

## 0.1.9 — 2026-10-25

### Sistemas de retención (alargan el juego sin crear contenido nuevo)
- **🗼 Torre infinita:** pisos generados por fórmula y siempre iguales para cada número. No gasta estamina.
  - Jefe cada 10 pisos; modificadores en los pisos múltiplos de 5, en los jefes y en todos los pisos desde el 30.
  - Recompensa por cada piso, y en cada hito de 10 pisos almas, oro y un objeto.
  - El piso 37 equivale aproximadamente a 1-10 Normal, y el 80 supera al Infierno.
- **📋 Misiones:**
  - 7 diarias y 6 semanales, cada grupo con un bonus por completar 5.
  - Login diario en un ciclo de 7 días, cuyas recompensas suben un 25 % por semana completa (hasta ×3).
- **🧭 Expediciones:** mandas una mascota que no lleves puesta durante 2, 4 u 8 horas y trae oro y materiales (más cuanto mejor es la mascota).
- **Jefes con modificadores semanales:** 2 cada semana (Frenesí, Coraza, Espinas, Regeneración, Ígneo, Gélido o Venenoso) y recompensas +30 %.
- **Conjuntos de jefe:** 2 piezas del mismo jefe activan un bono: Cerbero +6 % crítico y +25 % daño crítico; Asmodeo +15 % habilidades y +4 % robo; Minotauro +15 % penetración y +15 % daño a jefes.
- **Temporadas de Arena:** cada mes se entrega el premio de la liga alcanzada (de ● 1 000 a ● 20 000 y 45 almas) y los puntos por encima de 1 000 se reducen a la mitad.
- **⭐ Ascensión:** al nivel 80 vuelves al 1 y se reinician los árboles, a cambio de +5 % a todo y +2 puntos de habilidad por ascensión (máximo 10).
- **Eventos por calendario:** fin de semana doble botín, miércoles +50 % de oro y viernes +50 % de experiencia.

## 0.1.8 — 2026-10-25

### Progresión más larga (meta: que un jugador free to play no termine el juego en menos de un mes)
- **Encantamiento:**
  - Probabilidad de éxito según el nivel al que se sube: hasta +9 siempre sale; +10 a +12, 50 %; +13 a +15, 20 %; +16 a +20, 12 %; +21 a +25, 6 %.
  - Estando en +13 o más, fallar baja el objeto un nivel.
  - Desde +10 también cuesta **Polvo de almas**: 2 para +10, 12 para +15 y 32 para +25.
  - La Bendición pasa de +70 % a +15 % de éxito, evita la degradación y cuesta oro y 2 almas más.
- **Desguace:**
  - El equipo se puede desguazar y da 💠 Polvo de almas según su rareza: rara 1, épica 3, legendaria 8, mítica 20, más 1 por cada 3 niveles de encantamiento.
  - Las piezas comunes no dan almas, así que se siguen vendiendo por oro.
  - Botón "Desguazar comunes y raras" en la Herrería.
- **Oro inicial:** 3 000 en lugar de 500, para pasar el bache de 1-4.
- **Jefes mundiales:** 3 entradas de jefe al día en lugar de estamina; la estamina queda solo para la campaña.
- **Equipo exclusivo de jefe:** 6 piezas míticas (2 por jefe) que no salen en cofres.
  - Todas sus líneas extra son atributos secundarios al azar.
  - Probabilidad: 35 % al derrotar al jefe; si no, hasta un 10 % según el daño causado.
- **Nuevo atributo secundario "Experiencia extra":** hasta +50 %.

## 0.1.7 — 2026-10-25

### Clases Arquero y Mago
- **Cambio de clase:** se elige en Héroe → Habilidades con las pestañas de clase y el botón "Jugar como…". Es gratis fuera de batalla, y cada clase conserva su árbol y su maestría.
- **Arquero:**
  - Atributos: +10 % ataque, −12 % vida, −20 % defensa, +5 % crítico, +4 % esquiva.
  - Habilidades: Disparo certero (×2,2), Lluvia de flechas (×1,6, sangrado) y Flecha perforante (×3,2, ignora la armadura; se aprende en el árbol).
  - Árbol: Precisión, Supervivencia y Cacería.
- **Mago:**
  - Atributos: +6 % ataque, −15 % vida, −25 % armadura, +15 % daño de habilidades, +5 % resistencia.
  - Habilidades: Bola de fuego (×2, quemadura), Lanza de hielo (×1,7, congelación) y Meteoro (×4, quemadura; se aprende en el árbol).
  - Árbol: Fuego, Hielo y Arcano.
- **Mejoras del árbol genéricas:** daño de una habilidad, menos recarga, estados al golpear y habilidades cargadas al empezar. Las especiales del Guerrero (Segundo aliento, Último bastión) solo cuentan siendo Guerrero.
- Arquero y Mago usan el sprite y las animaciones del guerrero hasta tener los suyos.

## 0.1.6 — 2026-10-25

- **Corrección:** las habilidades listas se veían aplastadas y sin icono. Su clase `lista` coincidía con la lista de niveles de la Campaña; ahora se llama `cargada`.
- BATALLA-MOBILE sigue en la 0.1.5: solo se sincroniza cuando se pide.

## 0.1.5 — 2026-10-25

### Escritorio y tablet: el juego se amplía
- En pantallas grandes en horizontal (más de 520 px de alto), el juego se dibuja a 412 px de alto, igual que en un móvil en horizontal, y se amplía entero hasta llenar la ventana. Se ve como en el móvil pero grande, sin bandas negras. Por ejemplo, en 1280×720 se amplía ×1,75.
- Las reglas responsive (`@media`) pasan a ser `@container` sobre el lienzo (`body`). En móvil el lienzo es la pantalla, así que ahí todo se ve igual que antes. En vertical tampoco se amplía.
- La escala de la batalla y la de los menús miden el lienzo y no la ventana.
- Barras de scroll finas y del color del juego; en escritorio ocupan espacio y cortaban el panel del Héroe.

## 0.1.4 — 2026-10-25

### Batalla en móvil horizontal
- **Personaje que se agrandaba al golpear:** la animación de temblor anulaba la escala del escenario; ahora usa `translate`, así que la escala se mantiene.
- **Escala de la escena:** se calcula con el hueco real que queda y no con 220 px fijos. Los combatientes están más juntos (100 px en vez de 240) y los avances de los ataques se acortan en lo mismo, así que el golpe sigue llegando al rival. En 440×330 los personajes pasan de 0,41 a 0,6 de escala.
- **Botones de la barra:** más pequeños (habilidades de 46 px y ataque de 60 px), y la barra cabe entera; antes el botón de ataque podía quedar cortado.
- **Jefe mundial y Arena:** se quita el rótulo sobre la escena, que se montaba sobre la barra de vida del jefe.

### Presentación de los jefes mundiales
- Dos columnas: a la izquierda el jefe (nombre, retrato, vida y Desafiar) y a la derecha las reglas y el ranking. Cabe sin scroll en móvil horizontal.

## 0.1.3 — 2026-10-25

### Ajustes de tamaño en móvil horizontal
- **Botones:** los genéricos son más pequeños (texto de 14 px y menos relleno), como "Cambiar rivales" en la Arena. Los del Campamento y la batalla no cambian.
- **Tienda:** cada cofre es una tarjeta horizontal (imagen, nombre y probabilidades, y botones apilados); los 4 cofres caben a la vez.
- **Héroe:** la vitrina es más baja para que el Poder y los atributos se vean sin bajar.
- **Herrería:** el panel izquierdo es más ancho y su contenido ya no se sale. El icono y el nombre del objeto son más pequeños, y los filtros caben en una línea.

## 0.1.2 — 2026-10-25

### Proporciones como el Campamento en móvil horizontal
- **Escala según la altura de la pantalla:** sustituye al 80 % fijo y va de 0,7 en pantallas de 320 px a 1 en pantallas de 450 px o más.
- **Cabecera:** siempre en una sola línea.
- **Fichas de skin y de mascota del inventario:** en horizontal, con la imagen a la izquierda y los datos a la derecha.
- **Listas de skins y mascotas:** más compactas.
- **Campamento:** el título del héroe va dentro de la etiqueta del nombre; antes flotaba separado del personaje.

## 0.1.1 — 2026-10-25

### Pantallas más compactas en móvil horizontal (referencia: King God Castle)
- Todas las pantallas salvo el Campamento y la batalla se ven algo más pequeñas y usan todo el ancho en varias columnas.
- **Inventario y Herrería:** dos paneles, cada uno con su propio scroll.
- **Campaña y Colección:** en varias columnas.
- **Árbol de habilidades:** el árbol ocupa toda la altura a la izquierda; maestría, clase, puntos y descripción van a la derecha.
- **Jefe mundial:** en dos columnas.
- **Mascotas:** rejilla de iconos con una columna por categoría y la ficha al lado; las 15 mascotas se ven sin scroll, en móvil y en escritorio.

## 0.1.0 — 2026-10-25

Primera versión numerada. Incluye:

### Campañas y modos de juego
- **Campaña:** Etapa 1 con los niveles 1-1 a 1-10, cada uno en Normal, Difícil, Pesadilla e Infierno.
- **Jefes mundiales:** Cerbero, Asmodeo y Gran Minotauro.
- **Arena:** PvP asíncrono contra rivales controlados por la IA.

### Progresión del guerrero
- **Equipo:** cuatro piezas (casco, armadura, espada y capa) con rarezas de Común a Mítica.
- **Atributos:** cuatro base y siete secundarios, con topes.
- **Herrería:** encantamiento y refinado.
- **Mejoras permanentes:**
  - Árbol de habilidades (1 punto cada 2 niveles, hasta el nivel 80, con botón de guardar).
  - Maestría.
  - Runas.
  - Reliquias.
  - Colección.
  - Títulos.
- **Mascotas:** 15 en 5 categorías.
- **Skins:** 10, con estrellas y brillo al llegar a ★5.

### Combate y equilibrio
- **Efectos de estado:** quemadura, veneno, sangrado, congelación y aturdimiento.
- **Balance revisado:** defensa con rendimiento decreciente y daño mínimo del 15 %, topes de secundarios y de Fortuna, economía y Arena ajustadas, y jefes inmunes al control.

### Interfaz
- **Campamento** como menú principal, adaptado a móvil en horizontal.
- **Barra de batalla** con iconos y botón para huir.
- **Modo pruebas** (al abrir el archivo directamente o con `?pruebas`), con los botones de prueba reunidos en el menú 🧪.
