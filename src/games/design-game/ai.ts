/**
 * DESIGN GAME - CAPA DE INTEGRACIÓN DE IA
 * -------------------------------------------------------------------------
 * Procesa descripciones en lenguaje natural y propone cambios al
 * GameSpecification.
 *
 * ESTADO ACTUAL: Implementación de demostración claramente identificada.
 * No existe infraestructura de IA en el repositorio ni API keys configuradas.
 * Esta capa está diseñada para conectarse a un proveedor real sin modificar
 * la interfaz pública.
 *
 * Para conectar un proveedor real:
 * 1. Reemplazar `callAIProvider` con la llamada real al endpoint
 * 2. El endpoint debe recibir AIRequest y devolver AIResponse
 * 3. Las claves deben estar en variables de entorno del servidor,
 *    nunca en el cliente
 */

import type {
  Entity,
  GameGenre,
  GameSpecification,
  Script,
} from './types'
import { createBlock, getBlockDefinition } from './blocks'
import { ENTITY_TEMPLATES, createEntityFromTemplate } from './entities'

// ---------------------------------------------------------------------------
// Tipos de la capa de IA
// ---------------------------------------------------------------------------

export interface AIRequest {
  /** Descripción en lenguaje natural del estudiante */
  message: string
  /** Estado actual del proyecto (solo contexto necesario, no todo el spec) */
  context: AIContext
}

export interface AIContext {
  projectName: string
  genre: GameGenre
  entityCount: number
  scriptCount: number
  variableCount: number
  entityNames: string[]
}

export interface AIResponse {
  /** Explicación para el estudiante */
  explanation: string
  /** Pregunta educativa o pista (opcional) */
  hint?: string
  /** Cambios propuestos al proyecto */
  proposedChanges: ProposedChange[]
  /** Si es false, la IA solo explica sin proponer cambios */
  hasChanges: boolean
  /** Indica que esta respuesta es de demostración */
  isDemo: boolean
}

export type ProposedChange =
  | { type: 'add_entity'; template: string; position?: { x: number; y: number } }
  | { type: 'add_script'; entityName: string; eventType: string; blocks: string[] }
  | { type: 'update_entity_property'; entityName: string; property: string; value: string | number }
  | { type: 'add_variable'; name: string; initialValue: number }

export interface AIConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  proposedChanges?: ProposedChange[]
  accepted?: boolean
  isDemo: boolean
}

// ---------------------------------------------------------------------------
// Motor de procesamiento de lenguaje natural (modo demostración)
// ---------------------------------------------------------------------------

const DEMO_PATTERNS: Array<{
  patterns: RegExp[]
  response: (match: RegExpMatchArray, context: AIContext) => AIResponse
}> = [
  {
    patterns: [
      /jump (higher|further|more)/i,
      /higher jump/i,
      /stronger jump/i,
    ],
    response: (_m, ctx) => ({
      explanation: `Good idea. To make ${ctx.entityNames[0] ?? 'your sprite'} jump higher, I would raise the force on the "Jump" block. That force is how fast the sprite is pushed upwards when it leaves the ground.`,
      hint: 'What number would make a higher jump? A bigger force means a harder push upwards.',
      proposedChanges: [
        { type: 'update_entity_property', entityName: ctx.entityNames[0] ?? 'player', property: 'speed', value: 250 },
      ],
      hasChanges: true,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /add (an? )?enem(y|ies)/i,
      /put (an? )?enemy/i,
      /make (an? )?enemy/i,
    ],
    response: (_m, _ctx) => ({
      explanation: 'I can add an enemy that walks from side to side. A "Guard" moves left and right on its own. Shall I drop one in the middle of the scene?',
      hint: 'What should happen when the player touches it? The "When this touches" block is where that reaction goes.',
      proposedChanges: [
        { type: 'add_entity', template: 'Guard', position: { x: 350, y: 200 } },
      ],
      hasChanges: true,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /add (a )?star/i,
      /put (a )?star/i,
      /collect(ible|able)?s?\b/i,
    ],
    response: (_m, _ctx) => ({
      explanation: 'I can add a star to collect. When the player touches it, the points go up on their own. How many stars do you want in the end?',
      hint: 'A star disappears once the player touches it. Could you keep a count of how many were picked up?',
      proposedChanges: [
        { type: 'add_entity', template: 'Star', position: { x: 200, y: 150 } },
      ],
      hasChanges: true,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /score/i,
      /points?\b/i,
      /keep count/i,
    ],
    response: (_m, _ctx) => ({
      explanation: 'Your game already keeps a score. Every time the player picks something up, the points go up on their own. To make one thing worth more, change its "Points when collected" field in the panel on the right.',
      hint: 'Which things should be worth more? Usually the ones that are hardest to reach.',
      proposedChanges: [],
      hasChanges: false,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /what does (this|the) block do/i,
      /what is (this|it) for/i,
      /explain/i,
    ],
    response: (_m, ctx) => ({
      explanation: `A block is one instruction telling a sprite what to do. **Events** (orange) start the action, **Motion** (blue) moves the sprite, and **Control** (yellow) repeats things or chooses between them. Your project "${ctx.projectName}" has ${ctx.scriptCount} scripts so far.`,
      hint: 'Which block is the confusing one? I can go through any of them in more detail.',
      proposedChanges: [],
      hasChanges: false,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /can(no|')?t pick up/i,
      /(does|is) ?n'?t work/i,
      /why (does)?n'?t/i,
      /problem with/i,
    ],
    response: (_m, ctx) => ({
      explanation: `For ${ctx.entityNames[0] ?? 'your sprite'} to pick things up, it needs a script that starts with "When this touches", pointed at the thing being collected. Two things to check: 1) that script exists, 2) the two sprites are close enough on screen to actually meet.`,
      hint: 'Do you have a script starting with "When this touches"? If not, add one and hang an action under it.',
      proposedChanges: [],
      hasChanges: false,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /improve|better/i,
      /suggest/i,
      /what (can|should) i do/i,
      /idea/i,
    ],
    response: (_m, ctx) => ({
      explanation: `Your ${ctx.genre} game has ${ctx.entityCount} sprites and ${ctx.scriptCount} scripts. A few ways to push it further: 1) spread things to collect into harder corners, 2) keep a timer and count down, 3) mix enemies that patrol with enemies that chase, 4) make the second half harder than the first.`,
      hint: 'Which part feels thin to you: the moving, the challenge, or the story?',
      proposedChanges: [],
      hasChanges: false,
      isDemo: true,
    }),
  },
]

const GENERIC_RESPONSE: AIResponse = {
  explanation: 'I follow what you want. Think about which blocks would say that: is it a movement, a condition, or something that starts the action? The library on the left is sorted that way.',
  hint: 'Can you walk me through what should happen, step by step?',
  proposedChanges: [],
  hasChanges: false,
  isDemo: true,
}

// ---------------------------------------------------------------------------
// Función principal de procesamiento
// ---------------------------------------------------------------------------

export async function processAIRequest(request: AIRequest): Promise<AIResponse> {
  // Simulamos latencia de red para ser honesto sobre que es una demo
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400))

  const message = request.message.toLowerCase()
  const context = request.context

  for (const pattern of DEMO_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = message.match(regex)
      if (match) {
        return pattern.response(match, context)
      }
    }
  }

  // Si la descripción parece ser para generar un juego nuevo
  if (context.entityCount === 0) {
    return generateInitialProposal(message, context.genre)
  }

  return GENERIC_RESPONSE
}

// ---------------------------------------------------------------------------
// Generación de propuesta inicial a partir de la descripción
// ---------------------------------------------------------------------------

export function generateInitialProposal(description: string, genre: GameGenre): AIResponse {
  const changes: ProposedChange[] = []

  // Detectar elementos mencionados
  const mentionsEnemy = /(enemy|enemies|monster|baddie|obstacle)/i.test(description)
  const mentionsStar = /(star|collect|coin|gem|treasure)/i.test(description)
  const mentionsGoal = /(goal|exit|portal|finish|reach)/i.test(description)

  // Siempre hay un jugador
  if (genre === 'arcade' || genre === 'maze') {
    changes.push({ type: 'add_entity', template: 'Robot', position: { x: 50, y: 200 } })
  } else {
    changes.push({ type: 'add_entity', template: 'Runner', position: { x: 60, y: 380 } })
  }

  if (genre === 'platformer') {
    changes.push({ type: 'add_entity', template: 'Ground', position: { x: 0, y: 468 } })
    changes.push({ type: 'add_entity', template: 'Solid platform', position: { x: 150, y: 340 } })
    changes.push({ type: 'add_entity', template: 'Solid platform', position: { x: 350, y: 260 } })
  }

  if (mentionsEnemy || genre === 'maze') {
    changes.push({ type: 'add_entity', template: 'Guard', position: { x: 350, y: 180 } })
  }

  if (mentionsStar) {
    changes.push({ type: 'add_entity', template: 'Star', position: { x: 200, y: 100 } })
    changes.push({ type: 'add_entity', template: 'Star', position: { x: 500, y: 150 } })
    changes.push({ type: 'add_entity', template: 'Star', position: { x: 650, y: 80 } })
  } else {
    // Siempre hay algo para recolectar
    changes.push({ type: 'add_entity', template: 'Coin', position: { x: 250, y: 120 } })
    changes.push({ type: 'add_entity', template: 'Coin', position: { x: 450, y: 90 } })
  }

  if (mentionsGoal || genre !== 'arcade') {
    changes.push({
      type: 'add_entity',
      template: genre === 'platformer' ? 'Goal flag' : 'Portal',
      position: { x: 720, y: 200 },
    })
  }

  // Scripts básicos para el jugador
  changes.push({
    type: 'add_script',
    entityName: 'player',
    eventType: 'on_key_press',
    blocks: ['move'],
  })

  if (genre === 'platformer') {
    changes.push({
      type: 'add_script',
      entityName: 'player',
      eventType: 'on_key_press',
      blocks: ['jump'],
    })
  }

  return {
    explanation: `Here is a first draft for your ${GENRE_LABELS[genre]} game. It has one sprite you control, a few things to collect${mentionsEnemy ? ', some enemies' : ''} and the bones of a scene. It is only a starting point: keep what works and change the rest.`,
    hint: `Two things worth deciding early: how does the player win, and what makes it hard?`,
    proposedChanges: changes,
    hasChanges: true,
    isDemo: true,
  }
}

const GENRE_LABELS: Record<GameGenre, string> = {
  arcade: 'arcade',
  platformer: 'platform',
  maze: 'maze',
}

// ---------------------------------------------------------------------------
// Aplicar cambios propuestos al proyecto
// ---------------------------------------------------------------------------

export function applyProposedChanges(
  spec: GameSpecification,
  changes: ProposedChange[],
): GameSpecification {
  let updated = { ...spec }

  for (const change of changes) {
    switch (change.type) {
      case 'add_entity': {
        const template = ENTITY_TEMPLATES.find((t) => t.name === change.template)
        if (!template) break
        const entity: Entity = {
          ...createEntityFromTemplate(template),
          position: change.position ?? { x: 100, y: 100 },
        }
        updated = { ...updated, entities: [...updated.entities, entity] }
        break
      }

      case 'add_script': {
        const entity = updated.entities.find(
          (e) => e.name.toLowerCase().includes(change.entityName.toLowerCase()) ||
                 e.type === 'player',
        )
        if (!entity) break

        const eventType = change.eventType === 'on_key_press'
          ? 'on_key_press' as const
          : 'on_start' as const

        const eventBlock = createBlock(eventType)
        if (eventType === 'on_key_press') {
          eventBlock.parameters = [{ name: 'key', type: 'key', value: 'ArrowRight' }]
        }

        // Encadenar los bloques especificados
        let lastBlock = eventBlock
        for (const blockType of change.blocks) {
          const def = getBlockDefinition(blockType as Parameters<typeof getBlockDefinition>[0])
          if (!def) continue
          const block = createBlock(def.type)
          lastBlock.next = block
          lastBlock = block
        }

        const script: Script = {
          id: `script_ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          entityId: entity.id,
          eventBlock,
          updatedAt: new Date().toISOString(),
        }
        updated = { ...updated, scripts: [...updated.scripts, script] }
        break
      }

      case 'update_entity_property': {
        updated = {
          ...updated,
          entities: updated.entities.map((e) =>
            e.name.toLowerCase().includes(change.entityName.toLowerCase())
              ? { ...e, properties: { ...e.properties, [change.property]: change.value } }
              : e,
          ),
        }
        break
      }

      case 'add_variable': {
        if (updated.variables.some((v) => v.name === change.name)) break
        updated = {
          ...updated,
          variables: [
            ...updated.variables,
            {
              id: `var_ai_${Date.now()}`,
              name: change.name,
              type: 'number' as const,
              initialValue: change.initialValue,
              currentValue: change.initialValue,
            },
          ],
        }
        break
      }
    }
  }

  return { ...updated, updatedAt: new Date().toISOString() }
}

// ---------------------------------------------------------------------------
// Historial de conversación
// ---------------------------------------------------------------------------

export function createMessage(
  role: 'user' | 'assistant',
  content: string,
  proposedChanges?: ProposedChange[],
): AIConversationMessage {
  return {
    role,
    content,
    timestamp: new Date().toISOString(),
    proposedChanges,
    accepted: undefined,
    isDemo: true,
  }
}
