/**
 * DESIGN GAME - GAME SPECIFICATION CONTRACT
 * -------------------------------------------------------------------------
 * Este contrato es la fuente de verdad compartida entre:
 * - IA (generación y modificaciones)
 * - Editor visual (programación con bloques)
 * - Motor de ejecución (simulador)
 * - Persistencia (guardado y recuperación)
 * - Validación (envío a revisión)
 * - Revisión docente (evaluación)
 *
 * REGLA CRÍTICA: Este modelo representa el estado lógico completo del
 * videojuego. Cualquier cambio en el editor DEBE reflejarse aquí, y
 * cualquier cambio aquí DEBE ejecutarse en el simulador.
 */

// ---------------------------------------------------------------------------
// Tipos base
// ---------------------------------------------------------------------------

export type GameGenre = 'arcade' | 'platformer' | 'maze'

export type EntityType = 
  | 'player' 
  | 'enemy' 
  | 'collectible' 
  | 'obstacle' 
  | 'platform' 
  | 'goal'

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Entidades del videojuego
// ---------------------------------------------------------------------------

export interface Entity {
  id: string
  type: EntityType
  name: string
  /** Recurso gráfico (color o asset predefinido) */
  sprite: string
  position: Position
  size: Size
  /** Propiedades específicas por tipo */
  properties: EntityProperties
}

export interface EntityProperties {
  /** Velocidad (px/s) */
  speed?: number
  /** Puede ser movido por el jugador */
  controllable?: boolean
  /** Puntos que otorga al ser recolectado */
  points?: number
  /** Daño que causa al jugador */
  damage?: number
  /** Comportamiento automático */
  behavior?: 'static' | 'patrol' | 'follow' | 'random'
  /** Dirección de patrulla o movimiento */
  direction?: 'horizontal' | 'vertical'
  /** Límites de movimiento (para patrol) */
  patrolRange?: { min: Position; max: Position }
}

// ---------------------------------------------------------------------------
// Sistema de bloques de programación
// ---------------------------------------------------------------------------

export type BlockCategory =
  | 'events'
  | 'movement'
  | 'appearance'
  | 'control'
  | 'sensors'
  | 'operators'
  | 'variables'
  | 'sound'

export type BlockType =
  // Events
  | 'on_start'
  | 'on_key_press'
  | 'on_collision'
  // Movement
  | 'move'
  | 'turn'
  | 'jump'
  | 'set_position'
  // Appearance
  | 'show'
  | 'hide'
  | 'change_sprite'
  // Control
  | 'wait'
  | 'repeat'
  | 'if_then'
  | 'if_then_else'
  // Sensors
  | 'touching'
  | 'key_pressed'
  | 'distance_to'
  // Operators
  | 'add'
  | 'subtract'
  | 'equals'
  | 'greater_than'
  | 'less_than'
  | 'and'
  | 'or'
  | 'not'
  // Variables
  | 'set_variable'
  | 'change_variable'
  | 'get_variable'
  // Sound
  | 'play_sound'
  | 'stop_sound'

export interface BlockParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'entity' | 'key' | 'direction' | 'sound'
  value: string | number | boolean
  options?: Array<{ label: string; value: string | number | boolean }>
}

export interface Block {
  id: string
  type: BlockType
  category: BlockCategory
  /** Parámetros configurables */
  parameters: BlockParameter[]
  /** Bloques conectados dentro (para control flow) */
  children?: Block[]
  /** Siguiente bloque en la secuencia */
  next?: Block
}

/** Script: secuencia de bloques asociada a un evento y una entidad */
export interface Script {
  id: string
  /** Entidad que ejecuta este script */
  entityId: string
  /** Evento que dispara la ejecución */
  eventBlock: Block
  /** Timestamp de última modificación */
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Variables del juego
// ---------------------------------------------------------------------------

export interface GameVariable {
  id: string
  name: string
  type: 'number' | 'string' | 'boolean'
  initialValue: string | number | boolean
  currentValue: string | number | boolean
}

// ---------------------------------------------------------------------------
// Escenario
// ---------------------------------------------------------------------------

export interface Scene {
  id: string
  name: string
  /** Color de fondo o imagen */
  background: string
  /** Dimensiones del escenario */
  size: Size
  /** Gravedad (para platformers) */
  gravity?: number
}

// ---------------------------------------------------------------------------
// Especificación completa del videojuego
// ---------------------------------------------------------------------------

export interface GameSpecification {
  /** Metadatos */
  id: string
  name: string
  description: string
  genre: GameGenre
  createdAt: string
  updatedAt: string

  /** Escenario */
  scene: Scene

  /** Todas las entidades del juego */
  entities: Entity[]

  /** Variables globales */
  variables: GameVariable[]

  /** Scripts de programación */
  scripts: Script[]

  /** Estado de construcción */
  buildStatus: 'draft' | 'in_review' | 'changes_requested' | 'approved'

  /** Historial de revisiones */
  reviewHistory: ReviewSubmission[]
}

// ---------------------------------------------------------------------------
// Sistema de revisión docente
// ---------------------------------------------------------------------------

export interface ReviewSubmission {
  id: string
  version: number
  submittedAt: string
  status: 'in_review' | 'changes_requested' | 'approved'
  /** Snapshot inmutable de la especificación enviada */
  snapshot: GameSpecification
  /** Observaciones del docente */
  feedback?: ReviewFeedback
}

export interface ReviewFeedback {
  comments: string
  issues: ReviewIssue[]
  approvedAt?: string
  reviewerName?: string
}

export interface ReviewIssue {
  type: 'error' | 'warning' | 'suggestion'
  message: string
  /** Referencia opcional a un elemento específico */
  reference?: {
    type: 'entity' | 'script' | 'block'
    id: string
  }
}

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  message: string
  reference?: {
    type: 'entity' | 'script' | 'block' | 'variable'
    id: string
  }
}

export interface ValidationWarning {
  code: string
  message: string
}

// ---------------------------------------------------------------------------
// Estado de ejecución (motor)
// ---------------------------------------------------------------------------

export interface GameRuntime {
  /** Referencia a la especificación */
  spec: GameSpecification
  /** Estado actual de las entidades (posición, visibilidad, etc.) */
  entityStates: Map<string, EntityRuntimeState>
  /** Valores actuales de variables */
  variableValues: Map<string, string | number | boolean>
  /** Scripts activos */
  activeScripts: Set<string>
  /** Estado general */
  phase: 'ready' | 'playing' | 'paused' | 'won' | 'lost'
  /** Tiempo transcurrido (ms) */
  elapsedTime: number
  /** Puntuación actual */
  score: number
}

export interface EntityRuntimeState {
  position: Position
  velocity: Position
  visible: boolean
  sprite: string
  /** Estado personalizado por comportamiento */
  customState?: Record<string, unknown>
}
