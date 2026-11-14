import type { GameId, LevelId } from '../shared/types'

export type Body = 'luna' | 'marte'

export interface LevelSpec {
  id: LevelId
  name: string
  goal: string
  /** Idea cientifica que el nivel debe dejar clara. */
  idea: string
}

export interface Evidence {
  id: string
  label: string
  /** Lo que SI demuestra la evidencia. Redaccion revisada: nada de "vida". */
  meaning: string
}

export interface MissionCard {
  gameId: GameId
  /** Titulo del juego en el portal. */
  title: string
  /** Subtitulo corto bajo el titulo. */
  kicker: string
  body: Body
  bodyLabel: string
  /** Equipo protagonista real. */
  hardware: string
  genre: string
  /** Frase en primera persona. SIEMPRE marcada como dramatizacion en la UI. */
  voice: string
  /** Que aprende el jugador. Una frase. */
  learning: string
  /** Pareja responsable segun el plan. */
  crew: string
  durationMin: [number, number]
  accent: string
  levels: LevelSpec[]
  evidence: Evidence[]
  dossier: {
    arrival: string
    lastContact: string
    missionEnd: string
    purpose: string
    finding: string
    /** Lo que el juego inventa. Obligatorio por el plan. */
    dramatization: string
    /** Errores frecuentes que esta ficha corrige. */
    notTrue: string[]
  }
  sourceIds: string[]
  /** Arte opcional. Si el archivo no existe, el portal dibuja el fallback CSS. */
  art: string
}

export const MISSIONS: MissionCard[] = [
  {
    gameId: 'opportunity',
    title: 'Ecos de Opportunity',
    kicker: 'Conectar tres piezas · Meridiani Planum',
    body: 'marte',
    bodyLabel: 'Marte',
    hardware: 'Rover Opportunity (MER-B)',
    genre: 'Puzzle de observación',
    voice: 'Mi viaje terminó, pero mis observaciones siguen contando una historia.',
    learning: 'Relacionar instrumento, evidencia y agua antigua.',
    crew: 'Computación Científica 1 · Ingeniería de Software',
    durationMin: [2, 4],
    accent: '#E68A68',
    levels: [
      {
        id: 1,
        name: 'Observar',
        goal: '12 movimientos · reunir 6 cámaras',
        idea: 'Observar antes de concluir.',
      },
      {
        id: 2,
        name: 'Investigar',
        goal: '16 movimientos · 6 RAT y 6 espectrómetros',
        idea: 'Las esferas oscuras son concreciones minerales, no organismos.',
      },
      {
        id: 3,
        name: 'Interpretar',
        goal: '18 movimientos · 6 cámaras, 6 espectrómetros y 6 energías',
        idea: 'Hematita y yeso apuntan a agua antigua, no a vida confirmada.',
      },
    ],
    evidence: [
      {
        id: 'ev-blueberries',
        label: 'Esferas de hematita',
        meaning: 'Concreciones minerales que se forman con agua circulando entre las rocas.',
      },
      {
        id: 'ev-gypsum',
        label: 'Veta de yeso',
        meaning: 'Mineral depositado por agua líquida que atravesó una fractura.',
      },
    ],
    dossier: {
      arrival: 'Aterrizó en Meridiani Planum el 25 de enero de 2004.',
      lastContact: 'Última señal el 10 de junio de 2018, durante una tormenta de polvo global.',
      missionEnd: 'La NASA dio la misión por concluida el 13 de febrero de 2019.',
      purpose: 'Buscar en las rocas señales de ambientes con agua en el pasado de Marte.',
      finding:
        'Concreciones ricas en hematita y vetas de yeso: minerales que necesitan agua líquida para formarse.',
      dramatization:
        'El rover no habla ni conserva recuerdos. La voz en primera persona y el tablero de piezas son recursos narrativos del juego.',
      notTrue: [
        'No encontró vida ni pruebas de vida.',
        'No sigue transmitiendo: permanece inmóvil en Marte.',
        'Combinar piezas en el tablero no identifica minerales de verdad.',
      ],
    },
    sourceIds: ['mer-opportunity'],
    art: 'assets/missions/opportunity.webp',
  },
  {
    gameId: 'lunar-signals',
    title: 'Dos señales de la Luna',
    kicker: 'Puzzle cooperativo · Hadley-Apeninos',
    body: 'luna',
    bodyLabel: 'Luna',
    hardware: 'Sismómetro y retrorreflector láser de Apollo 15',
    genre: 'Puzzle por turnos',
    voice: 'Dos señales distintas salieron de aquí. Una se apagó; la otra todavía responde.',
    learning: 'Distinguir vibraciones registradas y medición con láser.',
    crew: 'Computación Científica 2 · Ingeniería de Sistemas',
    durationMin: [3, 4],
    accent: '#C8CEDA',
    levels: [
      {
        id: 1,
        name: 'Escuchar',
        goal: 'A mantiene una placa · B alcanza el registro sísmico',
        idea: 'Las vibraciones se registran como datos; no es sonido viajando por el vacío.',
      },
      {
        id: 2,
        name: 'Devolver luz',
        goal: 'B rota dos espejos · el haz vuelve a su origen',
        idea: 'Un retrorreflector devuelve la luz hacia donde vino. Es pasivo.',
      },
      {
        id: 3,
        name: 'Leer el legado',
        goal: 'Combinar placa y haz · archivar cada registro',
        idea: 'Ondas sísmicas y pulsos de luz miden cosas distintas.',
      },
    ],
    evidence: [
      {
        id: 'ev-seismic',
        label: 'Registro sísmico',
        meaning: 'Las vibraciones medidas en superficie permiten estudiar el interior de la Luna.',
      },
      {
        id: 'ev-retro',
        label: 'Pulso devuelto',
        meaning:
          'El tiempo de ida y vuelta de un láser da la distancia Tierra-Luna con enorme precisión.',
      },
    ],
    dossier: {
      arrival: 'Apollo 15 alunizó en Hadley-Apeninos el 30 de julio de 1971.',
      lastContact:
        'Las estaciones ALSEP, incluido el sismómetro, se apagaron por orden desde Tierra el 30 de septiembre de 1977.',
      missionEnd:
        'El retrorreflector láser no se apagó: es pasivo y se sigue usando en mediciones actuales.',
      purpose:
        'Registrar vibraciones del suelo lunar y servir de espejo para pulsos láser enviados desde la Tierra.',
      finding:
        'Dos formas muy distintas de estudiar la Luna: escuchar su interior y medir su distancia.',
      dramatization:
        'Los avatares de señal, las compuertas y las plataformas son ficción. El objetivo nunca es reparar equipos.',
      notTrue: [
        'El retrorreflector no tiene batería ni transmite: solo devuelve la luz que recibe.',
        'El sismómetro de Apollo 15 dejó de enviar datos en 1977.',
        'Los hallazgos de toda la red sísmica no son obra de una sola estación.',
      ],
    },
    sourceIds: ['apollo-15', 'alsep-pds', 'lunar-laser'],
    art: 'assets/missions/lunar-signals.webp',
  },
  {
    gameId: 'spirit',
    title: 'La última ruta de Spirit',
    kicker: 'Exploración contra reloj · Cráter Gusev',
    body: 'marte',
    bodyLabel: 'Marte',
    hardware: 'Rover Spirit (MER-A)',
    genre: 'Exploración y energía',
    voice: 'Una rueda dejó de girar. Arrastrándola descubrí algo que no buscaba.',
    learning: 'Elegir una ruta segura y leer pistas del pasado en el suelo.',
    crew: 'Kevin · Ingeniería Estadística',
    durationMin: [2, 4],
    accent: '#F2A65A',
    levels: [
      {
        id: 1,
        name: 'Elegir camino',
        goal: 'Llegar al archivo · 1 observación · 90 s',
        idea: 'La ruta más corta puede tener el terreno más difícil.',
      },
      {
        id: 2,
        name: 'Mirar el suelo',
        goal: '2 observaciones · 120 s · zona de suelo claro',
        idea: 'Una avería de rueda expuso material que merecía investigarse.',
      },
      {
        id: 3,
        name: 'Priorizar evidencia',
        goal: '3 observaciones · desvío seguro · 150 s',
        idea: 'La sílice fue una pista de procesos con agua, no una prueba de vida.',
      },
    ],
    evidence: [
      {
        id: 'ev-silica',
        label: 'Suelo rico en sílice',
        meaning: 'Se asocia a procesos en los que el agua caliente altera la roca.',
      },
      {
        id: 'ev-track',
        label: 'Huella de la rueda trabada',
        meaning: 'Un fallo mecánico destapó material enterrado y abrió una línea de investigación.',
      },
    ],
    dossier: {
      arrival: 'Aterrizó en el cráter Gusev el 4 de enero de 2004.',
      lastContact: 'Última comunicación el 22 de marzo de 2010.',
      missionEnd:
        'Quedó inmovilizado en suelo blando en 2009; la misión se dio por terminada el 25 de mayo de 2011.',
      purpose: 'Buscar en Gusev rocas alteradas por agua en el pasado marciano.',
      finding:
        'Arrastrando la rueda averiada dejó al descubierto suelo muy rico en sílice, una pista de agua caliente.',
      dramatization:
        'La carrera, el cronómetro y las unidades de energía son convenciones del juego. No reproducen su velocidad ni una ruta histórica real.',
      notTrue: [
        'Nadie va a reactivarlo, limpiarlo ni traerlo de vuelta.',
        'El rival de la carrera es un recorrido programado, no otro vehículo real.',
        'La sílice no es una prueba de vida.',
      ],
    },
    sourceIds: ['mer-spirit'],
    art: 'assets/missions/spirit.webp',
  },
]

export function getMission(gameId: GameId): MissionCard | undefined {
  return MISSIONS.find((m) => m.gameId === gameId)
}
