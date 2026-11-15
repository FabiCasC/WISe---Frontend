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
    label: 'When the game starts',
    description: 'Runs once, as soon as the game begins',
    defaultParams: [],
    isEvent: true,
  },
  {
    type: 'on_key_press',
    category: 'events',
    label: 'When a key is pressed',
    description: 'Runs when the player presses this key',
    defaultParams: [
      {
        name: 'key',
        type: 'key',
        value: 'ArrowRight',
        options: [
          { label: 'Right arrow', value: 'ArrowRight' },
          { label: 'Left arrow', value: 'ArrowLeft' },
          { label: 'Up arrow', value: 'ArrowUp' },
          { label: 'Down arrow', value: 'ArrowDown' },
          { label: 'Space', value: ' ' },
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
    label: 'When this touches',
    description: 'Runs when this sprite touches another one',
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
    label: 'Move',
    description: 'Moves this sprite one way',
    defaultParams: [
      {
        name: 'direction',
        type: 'direction',
        value: 'right',
        options: [
          { label: 'Right', value: 'right' },
          { label: 'Left', value: 'left' },
          { label: 'Up', value: 'up' },
          { label: 'Down', value: 'down' },
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
    label: 'Jump',
    description: 'Pushes this sprite upwards',
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
    label: 'Go to spot',
    description: 'Moves this sprite to an exact spot',
    defaultParams: [
      { name: 'x', type: 'number', value: 100 },
      { name: 'y', type: 'number', value: 100 },
    ],
  },
  {
    type: 'turn',
    category: 'movement',
    label: 'Turn',
    description: 'Turns this sprite by some degrees',
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
    label: 'Show',
    description: 'Makes this sprite visible',
    defaultParams: [],
  },
  {
    type: 'hide',
    category: 'appearance',
    label: 'Hide',
    description: 'Makes this sprite invisible',
    defaultParams: [],
  },
  {
    type: 'change_sprite',
    category: 'appearance',
    label: 'Change look',
    description: 'Changes how this sprite looks',
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
    label: 'Wait',
    description: 'Pauses for a few seconds',
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
    label: 'Repeat',
    description: 'Runs the blocks inside it again and again',
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
    label: 'If... then',
    description: 'Runs the blocks inside only when something is true',
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
    label: 'If... else',
    description: 'Picks one of two paths',
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
    label: 'Touching',
    description: 'True while this sprite touches another one',
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
    label: 'Key held down',
    description: 'True while this key is held down',
    defaultParams: [
      {
        name: 'key',
        type: 'key',
        value: 'ArrowRight',
        options: [
          { label: 'Right arrow', value: 'ArrowRight' },
          { label: 'Left arrow', value: 'ArrowLeft' },
          { label: 'Up arrow', value: 'ArrowUp' },
          { label: 'Down arrow', value: 'ArrowDown' },
          { label: 'Space', value: ' ' },
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
    label: 'Add',
    description: 'Adds two numbers together',
    defaultParams: [
      { name: 'a', type: 'number', value: 0 },
      { name: 'b', type: 'number', value: 0 },
    ],
  },
  {
    type: 'equals',
    category: 'operators',
    label: 'Equal to',
    description: 'True when both values are the same',
    defaultParams: [
      { name: 'a', type: 'number', value: 0 },
      { name: 'b', type: 'number', value: 0 },
    ],
  },
  {
    type: 'greater_than',
    category: 'operators',
    label: 'Greater than',
    description: 'True when the first value is bigger',
    defaultParams: [
      { name: 'a', type: 'number', value: 0 },
      { name: 'b', type: 'number', value: 0 },
    ],
  },
  {
    type: 'less_than',
    category: 'operators',
    label: 'Less than',
    description: 'True when the first value is smaller',
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
    label: 'Set value',
    description: 'Sets a stored value to a number',
    defaultParams: [
      { name: 'variable', type: 'string', value: '', options: [] },
      { name: 'value', type: 'number', value: 0 },
    ],
  },
  {
    type: 'change_variable',
    category: 'variables',
    label: 'Change value',
    description: 'Adds to or takes away from a stored value',
    defaultParams: [
      { name: 'variable', type: 'string', value: '', options: [] },
      { name: 'amount', type: 'number', value: 1 },
    ],
  },
  {
    type: 'get_variable',
    category: 'variables',
    label: 'Read value',
    description: 'Reads a stored value',
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
    label: 'Play sound',
    description: 'Plays a sound effect',
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
    label: 'Stop sound',
    description: 'Stops every sound',
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
  { key: 'events',     label: 'Events' },
  { key: 'movement',   label: 'Motion' },
  { key: 'control',    label: 'Control' },
  { key: 'sensors',    label: 'Sensing' },
  { key: 'appearance', label: 'Looks' },
  { key: 'operators',  label: 'Operators' },
  { key: 'variables',  label: 'Data' },
  { key: 'sound',      label: 'Sound' },
]
