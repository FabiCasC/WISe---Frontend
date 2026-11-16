import type { Lang } from '../../shared/types';
import type { Decision, Punto, VistaRoca } from './roca';

// Contrato entre la lógica (reglasLocal.ts) y la escena (scene.ts).
export type Pos = [number, number]; // [fila, columna]
export type Ficha = 'camara' | 'rat' | 'espectrometro' | 'energia';
export type Conteo = Partial<Record<Ficha, number>>;

export type Evento =
  | { tipo: 'swap'; a: Pos; b: Pos }
  | { tipo: 'swapRevertido'; a: Pos; b: Pos }
  | { tipo: 'match'; celdas: Pos[]; ficha: Ficha }
  | { tipo: 'caida'; movimientos: { de: Pos; a: Pos }[]; nuevas: { a: Pos; ficha: Ficha }[] }
  | { tipo: 'energia'; delta: number; restante: number }
  | { tipo: 'progreso'; conteo: Conteo; metas: Conteo; puntos: number }
  | { tipo: 'malaDecision'; mensaje: string }
  | { tipo: 'aviso'; mensaje: string }
  | { tipo: 'roca'; vista: VistaRoca }
  | { tipo: 'mezcla'; tablero: Ficha[][] }
  | { tipo: 'nivelCompleto'; ganado: boolean };

export interface Resultado {
  levelId: number;
  completado: boolean;
  puntos: number;
  tiempoMs: number;
  evidencias: string[];
  sinErroresDecision: boolean;
  practica: boolean;
  movimientosUsados: number;
  movimientosRestantes: number;
  malasDecisiones: number;
  historialDecisiones: string[];
  decisiones: Decision[];
  objetivosCompletados: Conteo;
}

// Lo que la escena necesita de la lógica.
export interface PuertoReglas {
  tableroInicial(): Ficha[][];
  progresoInicial(): Extract<Evento, { tipo: 'progreso' }>;
  intentarSwap(a: Pos, b: Pos): Evento[];
  reiniciar(): void;
  objetivo(): string;
  /** Lo que el jugador aprendió, en 2 a 4 líneas, según lo que hizo. */
  resumen(ganado: boolean): string[];
  roca(): VistaRoca;
  elegirPunto(p: Punto): VistaRoca;
  enviarInforme(): Evento[];
  barajar(): Evento[];
  informeDisponible(): boolean;
  movimientosMax(): number;
  movimientosRestantes(): number;
  resultado(tiempoMs: number): Resultado;
  obtenerMalasDecisiones(): number;
  obtenerLang(): Lang;
}
