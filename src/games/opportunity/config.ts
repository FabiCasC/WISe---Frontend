import type { Conteo } from './events'
import type { Lang } from '../../shared/types'

export const PUNTUACION_CONFIG = {
  puntosPorFicha: 10,
  bonoCascadaPorNivel: 25,
  bonoVictoria: 100,
  bonoPorMovimientoRestante: 20,
  bonoSinMalasDecisiones: 50,
} as const

export interface NivelConfig {
  id: number
  movimientos: number
  metas: Conteo
  objetivoEs: string
  objetivoEn: string
  notaEs: string
  notaEn: string
  explicacionVictoriaEs: string
  explicacionVictoriaEn: string
  explicacionDerrotaEs: string
  explicacionDerrotaEn: string
  evidencias: string[]
}

export const CONFIG_NIVELES: Record<number, NivelConfig> = {
  1: {
    id: 1,
    // Budgets measured with scripted players over 400 seeds per level (see reglasLocal.test.ts):
    // only the match the player aims at counts toward the goal, so these budgets leave a
    // competent player ~2 spare moves while a random tapper runs out well before the goal.
    movimientos: 4,
    metas: { camara: 6 },
    objetivoEs: 'Observar: reúne 6 cámaras para revelar la roca marciana',
    objetivoEn: 'Observe: collect 6 cameras to uncover the rock photo',
    notaEs: 'Observa primero. Cada cámara revela una parte de la roca antes de tomar decisiones.',
    notaEn: 'Look first. Each camera uncovers a piece of the rock before making decisions.',
    explicacionVictoriaEs:
      '¡Excelente observación! En ciencia espacial, observar el terreno con cámaras antes de intervenir evita dañar muestras valiosas y permite elegir el mejor punto de análisis.',
    explicacionVictoriaEn:
      'Great observation! In space science, imaging the terrain before intervening prevents damaging valuable samples and guides instrument placement.',
    explicacionDerrotaEs:
      'Se agotaron los movimientos antes de obtener las 6 fotografías. Observa bien el tablero para planear combinaciones de cámaras.',
    explicacionDerrotaEn:
      'Out of moves before collecting 6 cameras. Plan your moves ahead to prioritize camera matches.',
    evidencias: ['roca-observada'],
  },
  2: {
    id: 2,
    movimientos: 8,
    metas: { rat: 6, espectrometro: 6 },
    objetivoEs: 'Investigar: reúne primero 6 RAT para pulir la roca, y luego 6 espectrómetros',
    objetivoEn: 'Investigate: collect 6 RAT first to grind the rock, then 6 spectrometers',
    notaEs:
      'La herramienta RAT raspa el polvo y la corteza superficial. ¡Pule la roca antes de analizar su interior con el espectrómetro!',
    notaEn:
      'The RAT grinds surface dust and weathering rind. Grind before analyzing the interior with the spectrometer!',
    explicacionVictoriaEs:
      '¡Muestra investigada con éxito! Al pulir con el RAT se expuso el interior fresco de la roca, permitiendo que el espectrómetro detectara minerales sin la interferencia del polvo marciano.',
    explicacionVictoriaEn:
      'Investigation successful! Grinding with the RAT exposed fresh rock interior, letting the spectrometer detect minerals without dust interference.',
    explicacionDerrotaEs:
      'Recuerda la secuencia científica: completa primero las 6 herramientas RAT antes de usar los espectrómetros.',
    explicacionDerrotaEn:
      'Remember the scientific sequence: complete all 6 RAT tools before spectrometer analysis.',
    // Incluye 'ev-blueberries' (esferas de hematita) del expediente de misiones del portal
    evidencias: ['ev-blueberries', 'roca-pulida', 'roca-analizada'],
  },
  3: {
    id: 3,
    movimientos: 7,
    metas: { camara: 6, espectrometro: 6, energia: 6 },
    objetivoEs: 'Interpretar: reúne 6 cámaras, 6 espectrómetros y 6 de energía',
    objetivoEn: 'Interpret: collect 6 cameras, 6 spectrometers, and 6 energy',
    notaEs:
      'Una interpretación científica sólida requiere combinar múltiples líneas de evidencia y mantener la energía del rover.',
    notaEn:
      'A robust scientific interpretation requires multiple lines of evidence while managing rover energy.',
    explicacionVictoriaEs:
      '¡Interpretación científica completada! Las esferas de hematita y las vetas de yeso confirman la presencia de agua líquida en el pasado de Marte. Sin embargo, no se encontraron evidencias de vida.',
    explicacionVictoriaEn:
      'Interpretation complete! Hematite spherules and gypsum veins confirm ancient liquid water on Mars. However, no evidence of life was found.',
    explicacionDerrotaEs:
      'Interpretar requiere balancear tus recursos. Administra tus movimientos para conseguir las tres líneas de evidencia.',
    explicacionDerrotaEn:
      'Interpreting requires balancing resources. Manage moves to secure all three lines of evidence.',
    // Incluye 'ev-gypsum' (veta de yeso) y 'ev-blueberries' del expediente de misiones del portal
    evidencias: ['ev-gypsum', 'ev-blueberries', 'agua-antigua'],
  },
}

export function obtenerTextoNivel(cfg: NivelConfig, lang: Lang = 'es') {
  const es = lang !== 'en'
  return {
    objetivo: es ? cfg.objetivoEs : cfg.objetivoEn,
    nota: es ? cfg.notaEs : cfg.notaEn,
    victoria: es ? cfg.explicacionVictoriaEs : cfg.explicacionVictoriaEn,
    derrota: es ? cfg.explicacionDerrotaEs : cfg.explicacionDerrotaEn,
  }
}
