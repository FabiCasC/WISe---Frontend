/**
 * DESIGN GAME - MOTOR DE EJECUCIÓN
 * -------------------------------------------------------------------------
 * Interpreta el GameSpecification y ejecuta los scripts de programación.
 *
 * Principios de seguridad:
 * - No ejecuta código arbitrario. Solo instrucciones del catálogo.
 * - Parámetros validados antes de aplicarse.
 * - Límites de ciclos para evitar bucles infinitos.
 * - Reinicio consistente del estado.
 *
 * El simulador consume el estado del engine. El engine NO sabe nada
 * del DOM: solo opera sobre GameRuntime y llama callbacks.
 */

import type {
  Block,
  Entity,
  EntityRuntimeState,
  GameRuntime,
  GameSpecification,
  Script,
} from './types'

const MAX_REPEAT = 1000
const STEP_MS = 16 // ~60fps
const WAIT_MAX_SECONDS = 60

export type EngineEvent =
  | { type: 'score_changed'; value: number }
  | { type: 'entity_state_changed'; entityId: string; state: EntityRuntimeState }
  | { type: 'game_won'; score: number }
  | { type: 'game_lost'; reason: string }
  | { type: 'sound'; sound: string }
  | { type: 'collision'; entityA: string; entityB: string }

export type EngineEventHandler = (event: EngineEvent) => void

// ---------------------------------------------------------------------------
// Inicialización del runtime
// ---------------------------------------------------------------------------

export function createRuntime(spec: GameSpecification): GameRuntime {
  const entityStates = new Map<string, EntityRuntimeState>()

  for (const entity of spec.entities) {
    entityStates.set(entity.id, {
      position: { ...entity.position },
      velocity: { x: 0, y: 0 },
      visible: true,
      sprite: entity.sprite,
      customState: { health: 1, alive: true },
    })
  }

  const variableValues = new Map<string, string | number | boolean>()
  for (const v of spec.variables) {
    variableValues.set(v.name, v.initialValue)
  }

  return {
    spec,
    entityStates,
    variableValues,
    activeScripts: new Set(),
    phase: 'ready',
    elapsedTime: 0,
    score: 0,
  }
}

// ---------------------------------------------------------------------------
// Motor de ejecución principal
// ---------------------------------------------------------------------------

export class GameEngine {
  private runtime: GameRuntime
  private eventHandlers: Set<EngineEventHandler> = new Set()
  private pressedKeys: Set<string> = new Set()
  private animFrame: number | null = null
  private lastTime = 0
  private waitTimers: Map<string, number> = new Map()
  private scriptExecutionStacks: Map<string, BlockExecutionContext[]> = new Map()

  constructor(spec: GameSpecification) {
    this.runtime = createRuntime(spec)
  }

  on(handler: EngineEventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  private emit(event: EngineEvent): void {
    for (const h of this.eventHandlers) h(event)
  }

  getRuntime(): GameRuntime {
    return this.runtime
  }

  getEntityState(entityId: string): EntityRuntimeState | undefined {
    return this.runtime.entityStates.get(entityId)
  }

  // -------------------------------------------------------------------------
  // Ciclo de juego
  // -------------------------------------------------------------------------

  start(): void {
    if (this.runtime.phase === 'playing') return
    this.runtime.phase = 'playing'
    this.triggerEvent('on_start', {})
    this.lastTime = performance.now()
    this.loop()
  }

  pause(): void {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame)
      this.animFrame = null
    }
    this.runtime.phase = 'paused'
  }

  resume(): void {
    if (this.runtime.phase !== 'paused') return
    this.runtime.phase = 'playing'
    this.lastTime = performance.now()
    this.loop()
  }

  stop(): void {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame)
      this.animFrame = null
    }
    this.pressedKeys.clear()
    this.waitTimers.clear()
    this.scriptExecutionStacks.clear()
    this.runtime = createRuntime(this.runtime.spec)
    this.runtime.phase = 'ready'
  }

  reload(spec: GameSpecification): void {
    const wasPlaying = this.runtime.phase === 'playing'
    this.stop()
    this.runtime = createRuntime(spec)
    if (wasPlaying) this.start()
  }

  destroy(): void {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame)
      this.animFrame = null
    }
    this.eventHandlers.clear()
    this.pressedKeys.clear()
    this.waitTimers.clear()
  }

  private loop(): void {
    const tick = (time: number) => {
      if (this.runtime.phase !== 'playing') return
      const dt = Math.min(time - this.lastTime, 100) // cap a 100ms para evitar saltos
      this.lastTime = time
      this.runtime.elapsedTime += dt
      this.update(dt)
      this.checkCollisions()
      this.animFrame = requestAnimationFrame(tick)
    }
    this.animFrame = requestAnimationFrame(tick)
  }

  // -------------------------------------------------------------------------
  // Actualización por frame
  // -------------------------------------------------------------------------

  private update(dt: number): void {
    const gravity = this.runtime.spec.scene.gravity ?? 0
    const sceneH = this.runtime.spec.scene.size.height

    for (const [entityId, entityState] of this.runtime.entityStates) {
      if (!entityState.customState?.alive) continue

      const entity = this.runtime.spec.entities.find((e) => e.id === entityId)
      if (!entity) continue

      // Comportamiento automático según propiedades
      this.applyBehavior(entity, entityState, dt)

      // Aplicar gravedad (solo platforner)
      if (gravity > 0) {
        entityState.velocity.y += (gravity * dt) / 1000
      }

      // Aplicar velocidad
      entityState.position.x += (entityState.velocity.x * dt) / 1000
      entityState.position.y += (entityState.velocity.y * dt) / 1000

      // Colisión con suelo
      const bottom = entityState.position.y + entity.size.height
      if (bottom >= sceneH) {
        entityState.position.y = sceneH - entity.size.height
        entityState.velocity.y = 0
        if (entityState.customState) entityState.customState['onGround'] = true
      } else {
        if (entityState.customState) entityState.customState['onGround'] = false
      }

      // Límites del escenario
      const sceneW = this.runtime.spec.scene.size.width
      entityState.position.x = Math.max(0, Math.min(entityState.position.x, sceneW - entity.size.width))
    }

    // Avanzar wait timers
    for (const [key, remaining] of this.waitTimers) {
      const newVal = remaining - dt
      if (newVal <= 0) {
        this.waitTimers.delete(key)
      } else {
        this.waitTimers.set(key, newVal)
      }
    }

    // Continuar ejecución de scripts que esperaban
    for (const [scriptId, stack] of this.scriptExecutionStacks) {
      if (stack.length > 0) {
        const ctx = stack[stack.length - 1]
        if (ctx.waiting) {
          const waitKey = `${scriptId}_wait`
          if (!this.waitTimers.has(waitKey)) {
            ctx.waiting = false
            this.continueScript(scriptId)
          }
        }
      }
    }
  }

  private applyBehavior(entity: Entity, state: EntityRuntimeState, _dt: number): void {
    const behavior = entity.properties.behavior
    if (behavior === 'static' || behavior === undefined) return

    const speed = entity.properties.speed ?? 60

    if (behavior === 'patrol') {
      const dir = entity.properties.direction ?? 'horizontal'
      const range = entity.properties.patrolRange ?? {
        min: { x: entity.position.x - 80, y: entity.position.y - 80 },
        max: { x: entity.position.x + 80, y: entity.position.y + 80 },
      }

      if (dir === 'horizontal') {
        if (state.velocity.x === 0) state.velocity.x = speed
        if (state.position.x <= range.min.x) state.velocity.x = Math.abs(speed)
        if (state.position.x >= range.max.x) state.velocity.x = -Math.abs(speed)
      } else {
        if (state.velocity.y === 0) state.velocity.y = speed
        if (state.position.y <= range.min.y) state.velocity.y = Math.abs(speed)
        if (state.position.y >= range.max.y) state.velocity.y = -Math.abs(speed)
      }
    } else if (behavior === 'follow') {
      const player = this.runtime.spec.entities.find((e) => e.type === 'player')
      if (!player) return
      const pState = this.runtime.entityStates.get(player.id)
      if (!pState) return
      const dx = pState.position.x - state.position.x
      const dy = pState.position.y - state.position.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 1) {
        state.velocity.x = (dx / dist) * speed
        state.velocity.y = (dy / dist) * speed
      }
    } else if (behavior === 'random') {
      if (Math.random() < 0.01) { // cambiar dirección aleatoriamente
        const angle = Math.random() * Math.PI * 2
        state.velocity.x = Math.cos(angle) * speed
        state.velocity.y = Math.sin(angle) * speed
      }
    }
  }

  // -------------------------------------------------------------------------
  // Colisiones
  // -------------------------------------------------------------------------

  private checkCollisions(): void {
    const entities = this.runtime.spec.entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i]
        const b = entities[j]
        const aState = this.runtime.entityStates.get(a.id)
        const bState = this.runtime.entityStates.get(b.id)
        if (!aState || !bState) continue
        if (!aState.visible || !bState.visible) continue
        if (!aState.customState?.['alive'] || !bState.customState?.['alive']) continue

        if (this.overlaps(a, aState, b, bState)) {
          this.emit({ type: 'collision', entityA: a.id, entityB: b.id })
          this.handleCollision(a, aState, b, bState)
        }
      }
    }
  }

  private overlaps(
    a: Entity, aState: EntityRuntimeState,
    b: Entity, bState: EntityRuntimeState,
  ): boolean {
    return (
      aState.position.x < bState.position.x + b.size.width &&
      aState.position.x + a.size.width > bState.position.x &&
      aState.position.y < bState.position.y + b.size.height &&
      aState.position.y + a.size.height > bState.position.y
    )
  }

  private handleCollision(
    a: Entity, aState: EntityRuntimeState,
    b: Entity, bState: EntityRuntimeState,
  ): void {
    // Colectible + player -> recolectar
    if (a.type === 'player' && b.type === 'collectible') {
      bState.visible = false
      if (bState.customState) bState.customState['alive'] = false
      const pts = b.properties.points ?? 0
      this.runtime.score += pts
      const scoreVar = this.runtime.variableValues.get('puntuacion') ?? 0
      this.runtime.variableValues.set('puntuacion', Number(scoreVar) + pts)
      this.emit({ type: 'score_changed', value: this.runtime.score })
      this.triggerEvent('on_collision', { target: b.id }, a.id)
    } else if (a.type === 'collectible' && b.type === 'player') {
      aState.visible = false
      if (aState.customState) aState.customState['alive'] = false
      const pts = a.properties.points ?? 0
      this.runtime.score += pts
      const scoreVar = this.runtime.variableValues.get('puntuacion') ?? 0
      this.runtime.variableValues.set('puntuacion', Number(scoreVar) + pts)
      this.emit({ type: 'score_changed', value: this.runtime.score })
      this.triggerEvent('on_collision', { target: a.id }, b.id)
    }

    // Player + enemy -> daño
    else if (a.type === 'player' && b.type === 'enemy') {
      this.handlePlayerHit(a.id, b.properties.damage ?? 1)
      this.triggerEvent('on_collision', { target: b.id }, a.id)
    } else if (a.type === 'enemy' && b.type === 'player') {
      this.handlePlayerHit(b.id, a.properties.damage ?? 1)
      this.triggerEvent('on_collision', { target: a.id }, b.id)
    }

    // Player + goal -> ganar
    else if ((a.type === 'player' && b.type === 'goal') ||
             (a.type === 'goal' && b.type === 'player')) {
      this.runtime.phase = 'won'
      this.emit({ type: 'game_won', score: this.runtime.score })
    }

    // Trigger on_collision scripts
    this.triggerEvent('on_collision', { target: b.id }, a.id)
    this.triggerEvent('on_collision', { target: a.id }, b.id)
  }

  private handlePlayerHit(_playerId: string, damage: number): void {
    const lives = this.runtime.variableValues.get('vidas') ?? 3
    const newLives = Number(lives) - damage
    this.runtime.variableValues.set('vidas', newLives)
    this.emit({ type: 'score_changed', value: this.runtime.score })
    if (newLives <= 0) {
      this.runtime.phase = 'lost'
      this.emit({ type: 'game_lost', reason: 'You ran out of lives.' })
    }
  }

  // -------------------------------------------------------------------------
  // Eventos de teclado
  // -------------------------------------------------------------------------

  keyDown(key: string): void {
    if (this.pressedKeys.has(key)) return
    this.pressedKeys.add(key)
    if (this.runtime.phase !== 'playing') return
    this.triggerEvent('on_key_press', { key })
  }

  keyUp(key: string): void {
    this.pressedKeys.delete(key)
  }

  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key)
  }

  // -------------------------------------------------------------------------
  // Ejecución de scripts
  // -------------------------------------------------------------------------

  private triggerEvent(eventType: string, params: Record<string, unknown>, entityId?: string): void {
    for (const script of this.runtime.spec.scripts) {
      if (entityId && script.entityId !== entityId) continue
      const event = script.eventBlock
      if (event.type !== eventType) continue

      // Verificar parámetros del evento
      if (eventType === 'on_key_press') {
        const keyParam = event.parameters.find((p) => p.name === 'key')
        if (keyParam && keyParam.value !== params['key']) continue
      }
      if (eventType === 'on_collision') {
        const targetParam = event.parameters.find((p) => p.name === 'target')
        if (targetParam && targetParam.value && targetParam.value !== params['target']) continue
      }

      this.executeScript(script)
    }
  }

  private executeScript(script: Script): void {
    // Ejecutar la cadena de bloques encadenada al evento
    if (!script.eventBlock.next) return
    this.executeBlockChain(script.id, script.entityId, script.eventBlock.next)
  }

  private executeBlockChain(scriptId: string, entityId: string, block: Block | undefined): void {
    if (!block) return
    if (this.runtime.phase === 'lost' || this.runtime.phase === 'won') return

    this.executeBlock(scriptId, entityId, block)

    if (block.next) {
      // Si hay un wait activo, encolar el siguiente bloque
      if (this.waitTimers.has(`${scriptId}_wait`)) {
        const existing = this.scriptExecutionStacks.get(scriptId) ?? []
        existing.push({ entityId, nextBlock: block.next, waiting: false })
        this.scriptExecutionStacks.set(scriptId, existing)
      } else {
        this.executeBlockChain(scriptId, entityId, block.next)
      }
    }
  }

  private continueScript(scriptId: string): void {
    const stack = this.scriptExecutionStacks.get(scriptId)
    if (!stack || stack.length === 0) return
    const ctx = stack.pop()!
    if (ctx.nextBlock) {
      this.executeBlockChain(scriptId, ctx.entityId, ctx.nextBlock)
    }
    if (stack.length === 0) this.scriptExecutionStacks.delete(scriptId)
  }

  private executeBlock(scriptId: string, entityId: string, block: Block): void {
    const state = this.runtime.entityStates.get(entityId)
    if (!state) return

    const getParam = (name: string) =>
      block.parameters.find((p) => p.name === name)?.value

    switch (block.type) {
      // --- Movimiento -------------------------------------------------------
      case 'move': {
        const dir = String(getParam('direction') ?? 'right')
        const speed = Number(getParam('speed') ?? 150)
        switch (dir) {
          case 'right': state.position.x += speed * STEP_MS / 1000; break
          case 'left':  state.position.x -= speed * STEP_MS / 1000; break
          case 'up':    state.position.y -= speed * STEP_MS / 1000; break
          case 'down':  state.position.y += speed * STEP_MS / 1000; break
        }
        this.clampToScene(entityId, state)
        break
      }

      case 'jump': {
        const force = Number(getParam('force') ?? 400)
        const isOnGround = state.customState?.['onGround'] ?? true
        if (isOnGround || this.runtime.spec.scene.gravity === 0) {
          state.velocity.y = -(force)
          if (state.customState) state.customState['onGround'] = false
        }
        break
      }

      case 'set_position': {
        const x = Number(getParam('x') ?? state.position.x)
        const y = Number(getParam('y') ?? state.position.y)
        state.position = { x, y }
        this.clampToScene(entityId, state)
        break
      }

      case 'turn': {
        const degrees = Number(getParam('degrees') ?? 90)
        const current = Number(state.customState?.['rotation'] ?? 0)
        if (state.customState) state.customState['rotation'] = current + degrees
        break
      }

      // --- Apariencia -------------------------------------------------------
      case 'show':
        state.visible = true
        break

      case 'hide':
        state.visible = false
        break

      case 'change_sprite': {
        const sprite = String(getParam('sprite') ?? 'default')
        state.sprite = sprite
        break
      }

      // --- Control ----------------------------------------------------------
      case 'wait': {
        const seconds = Math.min(Number(getParam('seconds') ?? 1), WAIT_MAX_SECONDS)
        this.waitTimers.set(`${scriptId}_wait`, seconds * 1000)
        // marcar el contexto actual como esperando
        const stack = this.scriptExecutionStacks.get(scriptId)
        if (stack && stack.length > 0) {
          stack[stack.length - 1].waiting = true
        }
        break
      }

      case 'repeat': {
        const times = Math.min(Number(getParam('times') ?? 10), MAX_REPEAT)
        if (block.children) {
          for (let i = 0; i < times; i++) {
            for (const child of block.children) {
              this.executeBlock(scriptId, entityId, child)
            }
          }
        }
        break
      }

      case 'if_then': {
        const condition = this.evaluateCondition(block, entityId)
        if (condition && block.children) {
          for (const child of block.children) {
            this.executeBlock(scriptId, entityId, child)
          }
        }
        break
      }

      case 'if_then_else': {
        const condition = this.evaluateCondition(block, entityId)
        const half = block.children ? Math.floor(block.children.length / 2) : 0
        const thenBlocks = block.children?.slice(0, half) ?? []
        const elseBlocks = block.children?.slice(half) ?? []
        for (const child of condition ? thenBlocks : elseBlocks) {
          this.executeBlock(scriptId, entityId, child)
        }
        break
      }

      // --- Variables --------------------------------------------------------
      case 'set_variable': {
        const name = String(getParam('variable') ?? '')
        const value = getParam('value') ?? 0
        if (name) this.runtime.variableValues.set(name, value as number)
        break
      }

      case 'change_variable': {
        const name = String(getParam('variable') ?? '')
        const amount = Number(getParam('amount') ?? 1)
        if (name) {
          const cur = Number(this.runtime.variableValues.get(name) ?? 0)
          this.runtime.variableValues.set(name, cur + amount)
        }
        break
      }

      // --- Sonido -----------------------------------------------------------
      case 'play_sound': {
        const sound = String(getParam('sound') ?? 'beep')
        this.emit({ type: 'sound', sound })
        break
      }

      case 'stop_sound':
        // El simulador escucha este evento y detiene el audio
        this.emit({ type: 'sound', sound: '_stop' })
        break

      default:
        // Bloque no reconocido: ignorar silenciosamente
        break
    }
  }

  private evaluateCondition(block: Block, _entityId: string): boolean {
    const getParam = (name: string) =>
      block.parameters.find((p) => p.name === name)?.value
    const condition = getParam('condition')
    if (typeof condition === 'boolean') return condition
    // Si la condición es una referencia a un sensor, evaluarla
    return Boolean(condition)
  }

  private clampToScene(entityId: string, state: EntityRuntimeState): void {
    const entity = this.runtime.spec.entities.find((e) => e.id === entityId)
    if (!entity) return
    const { width: sw, height: sh } = this.runtime.spec.scene.size
    state.position.x = Math.max(0, Math.min(state.position.x, sw - entity.size.width))
    state.position.y = Math.max(0, Math.min(state.position.y, sh - entity.size.height))
  }

  // -------------------------------------------------------------------------
  // Control de teclado continuo (para movimiento fluido)
  // -------------------------------------------------------------------------

  updateMovementFromKeys(): void {
    if (this.runtime.phase !== 'playing') return

    for (const script of this.runtime.spec.scripts) {
      const event = script.eventBlock
      if (event.type !== 'on_key_press') continue

      const keyParam = event.parameters.find((p) => p.name === 'key')
      if (!keyParam) continue

      const key = String(keyParam.value)
      if (this.pressedKeys.has(key)) {
        // Ejecutar el script continuamente mientras la tecla está presionada
        this.executeScript(script)
      }
    }
  }
}

interface BlockExecutionContext {
  entityId: string
  nextBlock: Block | undefined
  waiting: boolean
}
