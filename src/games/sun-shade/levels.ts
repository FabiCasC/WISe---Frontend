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
 *   L  charco de luz    -> seguro para el SOLAR, funde al NUCLEAR
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
 * La salida del solar esta en una camara sellada: su unica entrada es la
 * compuerta D. La placa P que la abre esta pasada una franja de sombra, por
 * donde solo pasa el nuclear.
 */
const LEVEL2 = [
  '##############################',
  '#                            #',
  '#                            #',
  '#                       ######',
  '#                    *  D A  #',
  '#                  ###########',
  '#              *             #',
  '#            #####           #',
  '#        *                   #',
  '#      #####                 #',
  '#  *                      *B #',
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
 */
const LEVEL3 = [
  '##############################',
  '#       ##############       #',
  '#       ##############       #',
  '#       ##############       #',
  '#       E A* #### *B D       #',
  '#    #########  #########    #',
  '#  P *                  * Q  #',
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
    name: 'Cada uno por su lado',
    hint: 'El solar cruza la luz; el nuclear, la sombra. Si se equivocan de charco, se apagan.',
  },
  2: {
    map: LEVEL2,
    name: 'Turno de sombra',
    hint: 'La puerta del solar solo se abre desde una placa al otro lado de la sombra.',
  },
  3: {
    map: LEVEL3,
    name: 'Relevo',
    hint: 'Las dos torres estan separadas por roca maciza y cada placa abre la puerta del OTRO rover.',
  },
}

export const SUN_MAPS = [LEVEL1, LEVEL2, LEVEL3]
