import { createPlaceholder } from '../createPlaceholder';
/**
 * JUEGO 1 - Ecos de Opportunity
 * Pareja responsable: Computacion Cientifica 1 + Ingenieria de Software.
 *
 * PARA EMPEZAR:
 *   1. Crear aqui `rules.ts` con las reglas PURAS (tablero 6x6, intercambio,
 *      cascadas, objetivos). Sin Phaser: asi se prueban con Vitest.
 *   2. Crear `scene.ts` con la escena de Phaser que dibuja esas reglas.
 *   3. Sustituir la linea de abajo por el mountGame real, respetando la
 *      firma de src/shared/types.ts. No cambiar el contrato sin avisar.
 *
 * GARANTIAS EXIGIDAS POR EL PLAN:
 *   - Tablero inicial sin combinaciones ya resueltas y con al menos un
 *     movimiento valido.
 *   - Si no quedan jugadas, remezclar sin descontar turnos.
 *   - Un intercambio sin combinacion se revierte y NO consume movimiento.
 *   - Usar ctx.seed para que un fallo se pueda reproducir.
 */
export const mountGame = createPlaceholder('opportunity');
