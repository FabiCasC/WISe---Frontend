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
      /saltar? (más )?alto/i,
      /salto más (fuerte|alto|grande)/i,
      /que salte más/i,
    ],
    response: (_m, ctx) => ({
      explanation: `¡Buena idea! Para que ${ctx.entityNames[0] ?? 'tu personaje'} salte más alto, necesito aumentar la fuerza del bloque "Saltar". Actualmente configura la fuerza de salto, que es cuánta velocidad hacia arriba recibe el personaje.`,
      hint: '¿Puedes pensar en qué número representaría un salto más alto? Un valor mayor = más fuerza hacia arriba.',
      proposedChanges: [
        { type: 'update_entity_property', entityName: ctx.entityNames[0] ?? 'jugador', property: 'speed', value: 250 },
      ],
      hasChanges: true,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /agrega?r? (un? )?enemigo/i,
      /poner (un? )?enemigo/i,
      /crear (un? )?enemigo/i,
    ],
    response: (_m, _ctx) => ({
      explanation: 'Puedo agregar un enemigo que patrulla de un lado a otro. Los enemigos tipo "Guardián" se mueven horizontalmente de forma automática. ¿Te parece bien agregarlo en la parte central del escenario?',
      hint: '¿Qué debería pasar cuando el jugador toca al enemigo? Puedes usar el bloque "Al tocar objeto" para programar esa reacción.',
      proposedChanges: [
        { type: 'add_entity', template: 'Guardián', position: { x: 350, y: 200 } },
      ],
      hasChanges: true,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /agrega?r? (una? )?estrella/i,
      /poner (una? )?estrella/i,
      /coleccionable/i,
    ],
    response: (_m, _ctx) => ({
      explanation: 'Agregaré una estrella coleccionable. Cuando el jugador la toque, sumará puntos automáticamente. ¿Cuántas estrellas te gustaría en total?',
      hint: 'Las estrellas desaparecen al ser tocadas por el jugador. ¿Podrías usar una variable para contar cuántas has recogido?',
      proposedChanges: [
        { type: 'add_entity', template: 'Estrella', position: { x: 200, y: 150 } },
      ],
      hasChanges: true,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /puntuaci[oó]n/i,
      /puntaje/i,
      /sistema de puntos/i,
    ],
    response: (_m, _ctx) => ({
      explanation: 'El sistema de puntuación ya está incluido con la variable "puntuacion". Cada vez que el jugador recolecta un objeto, los puntos se suman automáticamente. Para aumentar los puntos de un objeto, puedes cambiar su propiedad "puntos" en el panel de propiedades.',
      hint: '¿Qué objetos deberían valer más puntos? Generalmente, los más difíciles de alcanzar valen más.',
      proposedChanges: [],
      hasChanges: false,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /qu[eé] hace (este|el) bloque/i,
      /para qu[eé] sirve/i,
      /expl[ií]ca(me)?/i,
    ],
    response: (_m, ctx) => ({
      explanation: `Los bloques de programación son instrucciones que le dicen a tu personaje qué hacer. Los bloques de **Eventos** (naranja) inician la acción, y los bloques de **Movimiento** (azul) mueven al personaje. Los de **Control** (amarillo) permiten repetir o tomar decisiones. Tu proyecto "${ctx.projectName}" tiene ${ctx.scriptCount} scripts programados.`,
      hint: '¿Qué bloque te genera más dudas? Puedo explicar cualquiera con más detalle.',
      proposedChanges: [],
      hasChanges: false,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /no puede recoger/i,
      /no funciona/i,
      /por qu[eé] no/i,
      /problema con/i,
    ],
    response: (_m, ctx) => ({
      explanation: `Para que ${ctx.entityNames[0] ?? 'el personaje'} pueda recoger objetos, necesitas un script con el evento "Al tocar objeto" conectado al coleccionable. El evento detecta la colisión y ejecuta las acciones que definas. Si no ves el efecto, verifica que: 1) hay un script con evento de colisión, 2) el personaje y el coleccionable están en posiciones donde pueden tocarse.`,
      hint: '¿Tienes un script que usa el bloque "Al tocar objeto"? Si no, agrégalo y conecta un bloque de acción.',
      proposedChanges: [],
      hasChanges: false,
      isDemo: true,
    }),
  },
  {
    patterns: [
      /mejorar/i,
      /sugerencia/i,
      /qu[eé] puedo hacer/i,
      /recomendaci[oó]n/i,
    ],
    response: (_m, ctx) => ({
      explanation: `Tu videojuego de tipo ${ctx.genre} tiene ${ctx.entityCount} entidades y ${ctx.scriptCount} scripts. Algunas ideas para mejorarlo: 1) Agrega múltiples coleccionables en posiciones estratégicas, 2) Usa variables para crear un contador de tiempo, 3) Agrega enemigos con distintos comportamientos (patrulla, seguir al jugador), 4) Implementa niveles de dificultad con más obstáculos.`,
      hint: '¿Qué aspecto del juego sientes que falta? ¿El movimiento, el desafío, o la historia?',
      proposedChanges: [],
      hasChanges: false,
      isDemo: true,
    }),
  },
]

const GENERIC_RESPONSE: AIResponse = {
  explanation: 'Entiendo lo que describes. Para implementarlo correctamente en tu videojuego, considera qué bloques representarían esa acción: ¿es un movimiento, una condición, o un evento? Revisa la biblioteca de bloques en el panel izquierdo.',
  hint: '¿Puedes describir con más detalle qué debería pasar paso a paso?',
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
  const mentionsEnemy = /(enemigo|monstruo|malo|obstáculo)/i.test(description)
  const mentionsStar = /(estrella|coleccionable|moneda|gema)/i.test(description)
  const mentionsGoal = /(meta|salida|portal|llegar)/i.test(description)

  // Siempre hay un jugador
  if (genre === 'arcade' || genre === 'maze') {
    changes.push({ type: 'add_entity', template: 'Robot', position: { x: 50, y: 200 } })
  } else {
    changes.push({ type: 'add_entity', template: 'Atleta', position: { x: 60, y: 380 } })
  }

  if (genre === 'platformer') {
    changes.push({ type: 'add_entity', template: 'Suelo', position: { x: 0, y: 468 } })
    changes.push({ type: 'add_entity', template: 'Plataforma sólida', position: { x: 150, y: 340 } })
    changes.push({ type: 'add_entity', template: 'Plataforma sólida', position: { x: 350, y: 260 } })
  }

  if (mentionsEnemy || genre === 'maze') {
    changes.push({ type: 'add_entity', template: 'Guardián', position: { x: 350, y: 180 } })
  }

  if (mentionsStar) {
    changes.push({ type: 'add_entity', template: 'Estrella', position: { x: 200, y: 100 } })
    changes.push({ type: 'add_entity', template: 'Estrella', position: { x: 500, y: 150 } })
    changes.push({ type: 'add_entity', template: 'Estrella', position: { x: 650, y: 80 } })
  } else {
    // Siempre hay algo para recolectar
    changes.push({ type: 'add_entity', template: 'Moneda', position: { x: 250, y: 120 } })
    changes.push({ type: 'add_entity', template: 'Moneda', position: { x: 450, y: 90 } })
  }

  if (mentionsGoal || genre !== 'arcade') {
    changes.push({
      type: 'add_entity',
      template: genre === 'platformer' ? 'Meta' : 'Portal',
      position: { x: 720, y: 200 },
    })
  }

  // Scripts básicos para el jugador
  changes.push({
    type: 'add_script',
    entityName: 'jugador',
    eventType: 'on_key_press',
    blocks: ['move'],
  })

  if (genre === 'platformer') {
    changes.push({
      type: 'add_script',
      entityName: 'jugador',
      eventType: 'on_key_press',
      blocks: ['jump'],
    })
  }

  return {
    explanation: `¡Genial! He analizado tu descripción y preparé una propuesta para tu videojuego de tipo ${GENRE_LABELS[genre]}. Incluye un personaje jugable, algunos objetos para recolectar${mentionsEnemy ? ', enemigos' : ''} y la estructura básica del escenario. Recuerda que tú tienes el control: puedes aceptar esta propuesta y modificarla como quieras.`,
    hint: `Para hacer tu juego más interesante, piensa en: ¿cómo gana el jugador? ¿Qué hace que sea difícil o fácil?`,
    proposedChanges: changes,
    hasChanges: true,
    isDemo: true,
  }
}

const GENRE_LABELS: Record<GameGenre, string> = {
  arcade: 'Arcade',
  platformer: 'Plataformas',
  maze: 'Laberinto',
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
