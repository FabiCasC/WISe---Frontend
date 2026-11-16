export const PUNTUACION_CONFIG = {
  puntosPorFicha: 10,
  bonoCascadaPorNivel: 25,
  bonoVictoria: 100,
  bonoPorMovimientoRestante: 20,
  bonoSinMalasDecisiones: 50,
} as const

export interface NivelConfig {
  id: number
  nombre: string
  movimientos: number
  objetivo: string
  /** Ids de evidencia del expediente del portal que se entregan al ganar. */
  evidencias: string[]
}

// Presupuestos medidos con un jugador guionizado sobre cientos de semillas
// (ver reglasLocal.test.ts): el jugador que apunta gana con holgura y el azar casi nunca.
export const CONFIG_NIVELES: Record<number, NivelConfig> = {
  1: {
    id: 1,
    nombre: 'LOOK FIRST',
    movimientos: 9,
    objetivo: 'Photograph all 3 spots on the rock before you touch any of them.',
    evidencias: ['roca-observada'],
  },
  2: {
    id: 2,
    nombre: 'GRIND, THEN READ',
    movimientos: 8,
    objetivo: 'Get one reading of fresh rock. Grind a spot with the RAT before you read it.',
    evidencias: ['ev-blueberries', 'roca-pulida', 'roca-analizada'],
  },
  3: {
    id: 3,
    nombre: 'BUILD THE CASE',
    movimientos: 14,
    objetivo: 'Send a report with 3 clues: a clean photo, a water reading, and a second spot that agrees.',
    evidencias: ['ev-blueberries', 'agua-antigua'],
  },
}
