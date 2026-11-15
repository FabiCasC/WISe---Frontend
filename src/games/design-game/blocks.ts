/**
 * DESIGN GAME - CATÁLOGO DE BLOQUES
 * -------------------------------------------------------------------------
 * Define todos los bloques disponibles: su tipo, categoría, parámetros
 * por defecto y descripción.
 *
 * Cada bloque tiene correspondencia directa con instrucciones ejecutables
 * en el motor (engine.ts). Modificar un parámetro aquí afecta el
 * comportamiento real del simulador.
 */

import type { Block, BlockCategory, BlockParameter, BlockType } from './types'

// ---------------------------------------------------------------------------
// Colores por categoría (distintos de los de la app principal)
// ---------------------------------------------------------------------------

export const BLOCK_COLORS: Record<BlockCategory, string> = {
  events:    '#E8703A',  // naranja
  movement:  '#4A90D9',  // azul
  appearance:'#9B59B6',  // morado
  control:   '#F1C40F',  // amarillo
  sensors:   '#27AE60',  // verde
  operators: '#1ABC9C',  // turquesa
  variables: '#E74C3C',  // rojo
  sound:     '#8E44AD',  // violeta
}

// ---------------------------------------------------------------------------
// Definición canónica de cada tipo de bloque
// ---------------------------------------------------------------------------

export interface BlockDefinition {
  type: BlockType
  category: BlockCategory
  label: string
  description: string
  icon: string
  defaultParams: BlockParameter[]
  /** true si puede contener bloques hijos (control flow) */
  hasChildren?: boolean
  /** true si actúa como bloque de evento (inicio de script) */
  isEvent?: boolean
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // -------------------------------------------------------------------------
  // EVENTOS
  // -------------------------------------------------------------------------
  {
    type: 'on_start',
    category: 'events',
    label: 'Al iniciar',
    description: 'Se ejecuta cuando el juego comienza',
    icon: '▶',
    defaultParams: [],
    isEvent: true,
  },
  {
    type: 'on_key_press',
    category: 'events',
    label: 'Al presionar tecla',
    description: 'Se ejecuta cuando el jugador presiona una tecla',
    icon: '⌨',
    defaultParams: [
      {
        name: 'key',
        type: 'key',
        value: 'ArrowRight',
        options: [
          { label: '→ Derecha', value: 'ArrowRight' },
          { label: '← Izquierda', value: 'ArrowLeft' },
          { label: '↑ Arriba', value: 'ArrowUp' },
          { label: '↓ Abajo', value: 'ArrowDown' },
          { label: 'Espacio', value: ' ' },
          { label: 'W', value: 'w' },
          { label: 'A', value: 'a' },
          { label: 'S', value: 's' },
          { label: 'D', value: 'd' },
        ],
      },
    ],
    isEvent: true,
  },
  {
    type: 'on_collision',
    category: 'events',
    label: 'Al tocar objeto',
    description: 'Se ejecuta cuando este personaje toca otro objeto',
    icon: '💥',
    defaultParams: [
      {
        name: 'target',
        type: 'entity',
        value: '',
        options: [], // se rellenan dinámicamente con las entidades del proyecto
      },
    ],
    isEvent: true,
  },

  // -------------------------------------------------------------------------
  // MOVIMIENTO
  // -------------------------------------------------------------------------
  {
    type: 'move',
    category: 'movement',
    label: 'Mover',
    description: 'Mueve el personaje en una dirección',
    icon: '→',
    defaultParams: [
      {
        name: 'direction',
        type: 'direction',
        value: 'right',
        options: [
          { label: 'Derecha', value: 'right' },
          { label: 'Izquierda', value: 'left' },
          { label: 'Arriba', value: 'up' },
          { label: 'Abajo', value: 'down' },
        ],
      },
      {
        name: 'speed',
        type: 'number',
        value: 150,
      },
    ],
  },
  {
    type: 'jump',
    category: 'movement',
    label: 'Saltar',
    description: 'El personaje salta hacia arriba',
    icon: '↑',
    defaultParams: [
      {
        name: 'force',
        type: 'number',
        value: 400,
      },
    ],
  },
  {
    type: 'set_position',
    category: 'movement',
    label: 'Ir a posición',
    description: 'Mueve el personaje a una posición exacta',
    icon: '📍',
    defaultParams: [
      { name: 'x', type: 'number', value: 100 },
      { name: 'y', type: 'number', value: 100 },
    ],
  },
  {
    type: 'turn',
    category: 'movement',
    label: 'Girar',
    description: 'Gira el personaje en grados',
    icon: '↻',
    defaultParams: [
      {
        name: 'degrees',
        type: 'number',
        value: 90,
      },
    ],
  },

  // -------------------------------------------------------------------------
  // APARIENCIA
  // -------------------------------------------------------------------------
  {
    type: 'show',
    category: 'appearance',
    label: 'Mostrar',
    description: 'Hace visible el personaje',
    icon: '👁',
    defaultParams: [],
  },
  {
    type: 'hide',
    category: 'appearance',
    label: 'Ocultar',
    description: 'Hace invisible el personaje',
    icon: '🙈',
    defaultParams: [],
  },
  {
    type: 'change_sprite',
    category: 'appearance',
    label: 'Cambiar apariencia',
    description: 'Cambia el aspecto visual del personaje',
    icon: '🎨',
    defaultParams: [
      {
        name: 'sprite',
        type: 'string',
        value: 'default',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Happy', value: 'happy' },
          { label: 'Hurt', value: 'hurt' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // CONTROL
  // -------------------------------------------------------------------------
  {
    type: 'wait',
    category: 'control',
    label: 'Esperar',
    description: 'Pausa la ejecución por un tiempo',
    icon: '⏱',
    defaultParams: [
      {
        name: 'seconds',
        type: 'number',
        value: 1,
      },
    ],
  },
  {
    type: 'repeat',
    category: 'control',
    label: 'Repetir',
    description: 'Repite instrucciones un número de veces',
    icon: '🔄',
    defaultParams: [
      {
        name: 'times',
        type: 'number',
        value: 10,
      },
    ],
    hasChildren: true,
  },
  {
    type: 'if_then',
    category: 'control',
    label: 'Si... entonces',
    description: 'Ejecuta instrucciones si se cumple una condición',
    icon: '❓',
    defaultParams: [
      {
        name: 'condition',
        type: 'boolean',
        value: true,
      },
    ],
    hasChildren: true,
  },
  {
    type: 'if_then_else',
    category: 'control',
    label: 'Si... sino',
    description: 'Elige entre dos caminos según una condición',
    icon: '⚡',
    defaultParams: [
      {
        name: 'condition',
        type: 'boolean',
        value: true,
      },
    ],
    hasChildren: true,
  },

  // -------------------------------------------------------------------------
  // SENSORES
  // -------------------------------------------------------------------------
  {
    type: 'touching',
    category: 'sensors',
    label: 'Tocando objeto',
    description: 'Verdadero si este personaje está tocando otro',
    icon: '📡',
    defaultParams: [
      {
        name: 'target',
        type: 'entity',
        value: '',
        options: [],
      },
    ],
  },
  {
    type: 'key_pressed',
    category: 'sensors',
    label: 'Tecla presionada',
    description: 'Verdadero si se está presionando una tecla',
    icon: '🎹',
    defaultParams: [
      {
        name: 'key',
        type: 'key',
        value: 'ArrowRight',
        options: [
          { label: '→ Derecha', value: 'ArrowRight' },
          { label: '← Izquierda', value: 'ArrowLeft' },
          { label: '↑ Arriba', value: 'ArrowUp' },
          { label: '↓ Abajo', value: 'ArrowDown' },
          { label: 'Espacio', value: ' ' },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // OPERADORES
  // -------------------------------------------------------------------------
  {
    type: 'add',
    category: 'operators',
    label: 'Sumar',
    description: 'Suma dos valores',
    icon: '+',
    defaultParams: [
      { name: 'a', type: 'number', value: 0 },
      { name: 'b', type: 'number', value: 0 },
    ],
  },
  {
    type: 'equals',
    category: 'operators',
    label: 'Igual a',
    description: 'Verdadero si los valores son iguales',
    icon: '=',
    defaultParams: [
      { name: 'a', type: 'number', value: 0 },
      { name: 'b', type: 'number', value: 0 },
    ],
  },
  {
    type: 'greater_than',
    category: 'operators',
    label: 'Mayor que',
    description: 'Verdadero si el primer valor es mayor',
    icon: '>',
    defaultParams: [
      { name: 'a', type: 'number', value: 0 },
      { name: 'b', type: 'number', value: 0 },
    ],
  },
  {
    type: 'less_than',
    category: 'operators',
    label: 'Menor que',
    description: 'Verdadero si el primer valor es menor',
    icon: '<',
    defaultParams: [
      { name: 'a', type: 'number', value: 0 },
      { name: 'b', type: 'number', value: 0 },
    ],
  },

  // -------------------------------------------------------------------------
  // VARIABLES
  // -------------------------------------------------------------------------
  {
    type: 'set_variable',
    category: 'variables',
    label: 'Asignar variable',
    description: 'Establece el valor de una variable',
    icon: '📝',
    defaultParams: [
      { name: 'variable', type: 'string', value: '', options: [] },
      { name: 'value', type: 'number', value: 0 },
    ],
  },
  {
    type: 'change_variable',
    category: 'variables',
    label: 'Cambiar variable',
    description: 'Incrementa o decrementa una variable',
    icon: '±',
    defaultParams: [
      { name: 'variable', type: 'string', value: '', options: [] },
      { name: 'amount', type: 'number', value: 1 },
    ],
  },
  {
    type: 'get_variable',
    category: 'variables',
    label: 'Leer variable',
    description: 'Obtiene el valor de una variable',
    icon: '📖',
    defaultParams: [
      { name: 'variable', type: 'string', value: '', options: [] },
    ],
  },

  // -------------------------------------------------------------------------
  // SONIDO
  // -------------------------------------------------------------------------
  {
    type: 'play_sound',
    category: 'sound',
    label: 'Reproducir sonido',
    description: 'Reproduce un efecto de sonido',
    icon: '🔊',
    defaultParams: [
      {
        name: 'sound',
        type: 'sound',
        value: 'beep',
        options: [
          { label: 'Beep', value: 'beep' },
          { label: 'Jump', value: 'jump' },
          { label: 'Collect', value: 'collect' },
          { label: 'Win', value: 'win' },
          { label: 'Lose', value: 'lose' },
        ],
      },
    ],
  },
  {
    type: 'stop_sound',
    category: 'sound',
    label: 'Detener sonido',
    description: 'Detiene todos los sonidos',
    icon: '🔇',
    defaultParams: [],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find((b) => b.type === type)
}

export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return BLOCK_DEFINITIONS.filter((b) => b.category === category)
}

export function createBlock(type: BlockType, overrides: Partial<Block> = {}): Block {
  const def = getBlockDefinition(type)
  if (!def) throw new Error(`Block type not found: ${type}`)
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    category: def.category,
    parameters: def.defaultParams.map((p) => ({ ...p })),
    ...overrides,
  }
}

export const BLOCK_CATEGORIES_ORDER: { key: BlockCategory; label: string }[] = [
  { key: 'events',     label: 'Eventos' },
  { key: 'movement',   label: 'Movimiento' },
  { key: 'control',    label: 'Control' },
  { key: 'sensors',    label: 'Sensores' },
  { key: 'appearance', label: 'Apariencia' },
  { key: 'operators',  label: 'Operadores' },
  { key: 'variables',  label: 'Variables' },
  { key: 'sound',      label: 'Sonido' },
]
