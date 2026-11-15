// Paleta oficial del juego - Concepto: "Mars Exploration Mission / Deep Space Sci-Fi"
// Sistema visual inspirado en la estética neon cósmica con brillos y alta saturación

export const PALETA = {
  // Fondo y cosmos
  espacio: 0x050918, // #050918 - Espacio profundo
  espacioSecundario: 0x0a102a, // #0A102A - Nebulosa azul/violeta
  superficie: 0x0c1530, // #0C1530 - Paneles de misión oscuros
  superficieElevada: 0x132044, // #132044 - Tarjetas y ranuras
  ranuraTablero: 0x080e22, // #080E22 - Ranura de cada celda

  // Acentos neón de interfaz y marcos
  neonCyan: 0x00f0ff, // #00F0FF - Brillo neón cyan
  neonAzul: 0x0084ff, // #0084FF - Azul eléctrico brillante
  neonPurpura: 0xa855f7, // #A855F7 - Púrpura cósmico
  neonDorado: 0xffcc00, // #FFCC00 - Puntos y estrellas doradas

  // Fichas vibrantes (colores vivos y saturados de alta calidad)
  cyanFicha: 0x00b4d8, // #00B4D8 - Cámara (Cyan vibrante)
  naranjaFicha: 0xff5414, // #FF5414 - RAT (Naranja marciano encendido)
  purpuraFicha: 0x9333ea, // #9333EA - Espectrómetro (Púrpura intenso)
  amarilloFicha: 0xffcc00, // #FFCC00 - Energía (Amarillo solar brillante)

  // Bordes y reflejos de fichas
  bordeCyan: 0x0077b6,
  bordeNaranja: 0xd03b00,
  bordePurpura: 0x6b21a8,
  bordeAmarillo: 0xd49b00,

  // Textos y estados
  blancoPuro: 0xffffff,
  blancoCalido: 0xf3f6fc,
  arena: 0xf5d0a6,
  verdeExito: 0x10b981,
  grisSecundario: 0x7e8ca4,
  alertaNaranja: 0xff9800,
  rojoMarciano: 0xff3b30,

  // Compatibilidad semántica con lógica existente
  azulCyanEncendido: 0x00b4d8,
  naranjaMarcianoEncendido: 0xff5414,
  purpuraVibrante: 0x9333ea,
  amarilloSolarEncendido: 0xffcc00,
  azulTecnologico: 0x00f0ff,
  terracota: 0xff5414,
  espectroVioleta: 0x9333ea,
  dorado: 0xffcc00,
  deepNavy: 0x050918,
  duskBlue: 0x0c1530,
  pearlAqua: 0x00b4d8,
  thistle: 0xff5414,
  aliceBlue: 0xffffff,
} as const

export const css = (n: number) => '#' + n.toString(16).padStart(6, '0')
