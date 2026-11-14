import { createPlaceholder } from '../createPlaceholder';
/**
 * JUEGO 2 - Dos senales de la Luna
 * Pareja responsable: Computacion Cientifica 2 + Ingenieria de Sistemas.
 *
 * PARA EMPEZAR:
 *   1. `maps/level-1.json`, `level-2.json`, `level-3.json`: mapas por casillas
 *      disenados a mano, cada uno con su secuencia de solucion comprobada.
 *   2. `rules.ts`: movimiento por casillas, placas, compuertas y espejos.
 *      Sin Phaser, para probarlo con Vitest.
 *   3. Sustituir la linea de abajo por el mountGame real.
 *
 * GARANTIAS EXIGIDAS POR EL PLAN:
 *   - Modo individual completo: se cambia de personaje con Q (o boton tactil).
 *     La historia entera se puede terminar sin segundo jugador.
 *   - Ninguna compuerta puede encerrar permanentemente a un personaje.
 *   - El boton de reinicio permanece SIEMPRE visible.
 *   - El retrorreflector es pasivo: sin barra de bateria, no es transmisor.
 */
export const mountGame = createPlaceholder('lunar-signals');
