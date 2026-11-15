/**
 * SOL Y SOMBRA - mapas.
 * -------------------------------------------------------------------------
 * Disenados a mano y comprobados antes de entrar al repositorio: un salto de
 * una celda de mas convierte un nivel de plataformas en un nivel imposible.
 * `levels.test.ts` repite esa comprobacion en cada ejecucion de los tests:
 * simula el salto real y verifica que cada rover llega a su salida y a cada
 * muestra, y que las compuertas hacen falta de verdad.
 *
 * Leyenda:
 *   #  roca
 *   L  low gap (rock overhang) -> the small SOLAR rover fits under it; the
 *                          RTG rover does not. WHY this and not soft ground:
 *                          an RTG rover is big (Curiosity about 2.1 m tall against
 *                          Spirit's 1.5 m), and that limit is real, while
 *                          "the heavy one bogs down" is false - the rover
 *                          that ended its mission stuck in soft soil was
 *                          Spirit, the LIGHT solar one.
 *   S  zona de sombra   -> segura para el NUCLEAR, apaga al SOLAR
 *   X  polvo            -> mortal para los dos (el motor lo admite; hoy no
 *                          lo usa ningun mapa: en el nivel 3 cerraba el
 *                          unico paso del nuclear y lo dejaba sin solucion)
 *   *  muestra
 *   1  inicio del solar      2  inicio del nuclear
 *   A  salida del solar      B  salida del nuclear
 *   P  placa (canal 1) -> abre las compuertas D
 *   Q  placa (canal 2) -> abre las compuertas E
 *   D  compuerta (canal 1)   E  compuerta (canal 2)
 */

export const CELL = 32

/** Nivel 1 - sin compuertas: ensena que cada rover cruza solo lo suyo. */
const LEVEL1 = [
  '##############################',
  '#                            #',
  '#                            #',
  '# A *                    * B #',
  '######                  ######',
  '#       *            *       #',
  '#     ####          ####     #',
  '#  *                      *  #',
  '#####                    #####',
  '#       *            *       #',
  '#     ####          ####     #',
  '#  *                      *  #',
  '#####                    #####',
  '#     LLLLL   12   SSSSS     #',
  '##############################',
  '##############################',
]

/**
 * Nivel 2 - primera cooperacion.
 * Las DOS salidas estan en camaras selladas, y la placa de cada camara cae
 * del lado que el otro rover no pisa: P esta pasada la sombra (solo nuclear)
 * y Q al fondo de un hueco bajo (solo solar). WHY both: con una sola placa el
 * nuclear abria la unica puerta y terminaba el nivel sin el solar.
 */
const LEVEL2 = [
  '##############################',
  '#                            #',
  '#                            #',
  '#                       ######',
  '#                    *  D A  #',
  '#                  ###########',
  '#              *  LLQ        #',
  '#            ########        #',
  '#        *                   #',
  '#      #####             #####',
  '#  *                     E*B #',
  '######                   #####',
  '#                            #',
  '# 1 2  LLLLL        SSSSS *P #',
  '##############################',
  '##############################',
]

/**
 * Nivel 3 - relevo.
 * Dos torres separadas por un bloque macizo: cada rover solo puede subir por
 * la suya. La placa de cada torre abre la camara del OTRO, asi que ninguno
 * de los dos termina el nivel por su cuenta.
 * WHY the two L cells on the left ledge (row 6): without them the nuclear
 * rover walked up the left tower too and pressed BOTH plates, which made the
 * relay a decoration. The low gap is the only way in to P.
 */
const LEVEL3 = [
  '##############################',
  '#       ##############       #',
  '#       ##############       #',
  '#       ##############       #',
  '#       E A* #### *B D       #',
  '#    #########  #########    #',
  '#  P*LL                 * Q  #',
  '# #####                ##### #',
  '#        *          *        #',
  '#      #####      #####      #',
  '#  *                      *  #',
  '######                  ######',
  '#                            #',
  '# 1 2   LLLLL    SSSSS       #',
  '##############################',
  '##############################',
]

export interface LevelSpec {
  map: string[]
  name: string
  /** Pista corta que se muestra al empezar. */
  hint: string
}

export const SUN_LEVELS: Record<1 | 2 | 3, LevelSpec> = {
  1: {
    map: LEVEL1,
    name: 'Each on its own side',
    hint: 'The small solar rover fits through low gaps; the tall nuclear rover crosses shade. Pick the wrong one and it stops.',
  },
  2: {
    map: LEVEL2,
    name: 'Shadow shift',
    hint: 'Each door opens from a plate on the other rover’s side: one past the shade, one under a low gap.',
  },
  3: {
    map: LEVEL3,
    name: 'Relay',
    hint: 'Solid rock splits the two towers: only the small rover gets into the left one. Each plate opens the OTHER rover’s door.',
  },
}

export const SUN_MAPS = [LEVEL1, LEVEL2, LEVEL3]
