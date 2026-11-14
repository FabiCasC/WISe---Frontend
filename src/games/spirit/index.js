import { createPlaceholder } from '../createPlaceholder';
/**
 * JUEGO 3 - La ultima ruta de Spirit
 * Pareja responsable: Kevin + Ingenieria Estadistica.
 * Estadistica lidera reglas, balance y mapa; Kevin integra la interfaz.
 *
 * PARA EMPEZAR:
 *   1. `maps/`: mapas cenitales con caminos solidos, arena y rocas.
 *      Cada mapa debe tener una solucion comprobada DENTRO del presupuesto
 *      de energia y tiempo. No se generan obstaculos al azar en partida.
 *   2. `rules.ts`: energia (100 u.; 1 solido, 3 arena, 5 por observacion),
 *      reloj y puntuacion. Funciones puras, probadas con Vitest.
 *   3. Sustituir la linea de abajo por el mountGame real.
 *
 * GARANTIAS EXIGIDAS POR EL PLAN:
 *   - El rival es un recorrido programado, identificado como virtual en la UI.
 *     No hay colisiones entre vehiculos.
 *   - Quedarse sin energia o sin reloj abre reintento y practica sin reloj.
 *   - Terminar despues del rival permite completar la mision: solo se pierde
 *     el bono de carrera.
 *   - Los limites son DATOS ajustables, no cambios en el motor.
 */
export const mountGame = createPlaceholder('spirit');
