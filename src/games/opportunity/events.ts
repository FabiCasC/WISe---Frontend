// Contrato entre la lógica (reglasLocal.ts) y la escena (scene.ts).
// La lógica entrega la lista de lo que pasó en cada jugada; la escena la anima en orden.
export type Pos = [number, number]; // [fila, columna]
export type Ficha = 'camara' | 'rat' | 'espectrometro' | 'energia';
export type Conteo = Partial<Record<Ficha, number>>;

export type Evento =
  | { tipo: 'swap'; a: Pos; b: Pos }
  | { tipo: 'swapRevertido'; a: Pos; b: Pos }
  | { tipo: 'match'; celdas: Pos[]; ficha: Ficha }
  | { tipo: 'caida'; movimientos: { de: Pos; a: Pos }[]; nuevas: { a: Pos; ficha: Ficha }[] }
  | { tipo: 'nieblaQuitada'; zonas: number }
  | { tipo: 'energia'; delta: number; restante: number }
  | { tipo: 'progreso'; conteo: Conteo; metas: Conteo; puntos: number }
  | { tipo: 'malaDecision'; mensaje: string }
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
}

// Lo que la escena necesita de la lógica.
export interface PuertoReglas {
  tableroInicial(): Ficha[][];
  progresoInicial(): Extract<Evento, { tipo: 'progreso' }>;
  intentarSwap(a: Pos, b: Pos): Evento[];
  objetivo(): string;
  nota(): string;
  movimientosMax(): number;
  zonasNiebla(): number;
  resultado(tiempoMs: number): Resultado;
}
