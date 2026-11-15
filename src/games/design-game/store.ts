/**
 * DESIGN GAME - STORE (Estado global)
 * -------------------------------------------------------------------------
 * Gestión reactiva del estado del módulo.
 * Utiliza callbacks (publisher/subscriber simple) para notificar cambios
 * sin imponer dependencias externas de gestión de estado.
 *
 * El GameSpecification vive aquí y es la fuente de verdad para:
 * editor visual, motor de ejecución, IA, persistencia y revisión.
 */

import type {
  Block,
  Entity,
  GameGenre,
  GameSpecification,
  GameVariable,
  ReviewSubmission,
  Scene,
  Script,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './types'
import { createEntityFromTemplate, getTemplatesByType } from './entities'
import { createBlock } from './blocks'

const STORAGE_KEY = 'orbita-arcade:design-game'

// ---------------------------------------------------------------------------
// Estado global del módulo
// ---------------------------------------------------------------------------

export interface DesignGameStore {
  /** Proyecto actual */
  project: GameSpecification | null
  /** Lista de proyectos guardados */
  projects: GameSpecification[]
  /** Entidad seleccionada en el editor */
  selectedEntityId: string | null
  /** Script seleccionado en el editor */
  selectedScriptId: string | null
  /** Estado del simulador */
  simulatorRunning: boolean
}

type StoreListener = () => void

let state: DesignGameStore = {
  project: null,
  projects: [],
  selectedEntityId: null,
  selectedScriptId: null,
  simulatorRunning: false,
}

const listeners = new Set<StoreListener>()

function notify() {
  for (const fn of listeners) fn()
}

export function getState(): DesignGameStore {
  return state
}

export function subscribe(fn: StoreListener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ---------------------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------------------

export function loadProjects(): GameSpecification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveProjects(projects: GameSpecification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {
    // blocked storage: continuar sin guardar
  }
}

export function initStore(): void {
  const projects = loadProjects()
  state = { ...state, projects }
  notify()
}

// ---------------------------------------------------------------------------
// Creación y navegación de proyectos
// ---------------------------------------------------------------------------

export function createNewProject(params: {
  name: string
  description: string
  genre: GameGenre
}): GameSpecification {
  const id = `dg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const scene: Scene = {
    id: 'scene_main',
    name: 'Escena principal',
    background: defaultBackground(params.genre),
    size: { width: 800, height: 500 },
    gravity: params.genre === 'platformer' ? 800 : 0,
  }

  const project: GameSpecification = {
    id,
    name: params.name,
    description: params.description,
    genre: params.genre,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scene,
    entities: [],
    variables: [
      {
        id: 'var_score',
        name: 'puntuacion',
        type: 'number',
        initialValue: 0,
        currentValue: 0,
      },
      {
        id: 'var_lives',
        name: 'vidas',
        type: 'number',
        initialValue: 3,
        currentValue: 3,
      },
    ],
    scripts: [],
    buildStatus: 'draft',
    reviewHistory: [],
  }

  return project
}

function defaultBackground(genre: GameGenre): string {
  switch (genre) {
    case 'arcade':    return '#1a1a2e'
    case 'platformer':return '#87CEEB'
    case 'maze':      return '#2d1b69'
  }
}

export function openProject(project: GameSpecification): void {
  state = {
    ...state,
    project,
    selectedEntityId: null,
    selectedScriptId: null,
    simulatorRunning: false,
  }
  notify()
}

export function saveCurrentProject(): void {
  if (!state.project) return
  const updated = {
    ...state.project,
    updatedAt: new Date().toISOString(),
  }
  const projects = state.projects.filter((p) => p.id !== updated.id)
  const newProjects = [updated, ...projects]
  state = { ...state, project: updated, projects: newProjects }
  saveProjects(newProjects)
  notify()
}

export function deleteProject(id: string): void {
  const projects = state.projects.filter((p) => p.id !== id)
  state = { ...state, projects, project: state.project?.id === id ? null : state.project }
  saveProjects(projects)
  notify()
}

export function closeProject(): void {
  saveCurrentProject()
  state = { ...state, project: null, selectedEntityId: null, selectedScriptId: null, simulatorRunning: false }
  notify()
}

// ---------------------------------------------------------------------------
// Mutaciones del proyecto
// ---------------------------------------------------------------------------

function updateProject(updater: (p: GameSpecification) => GameSpecification): void {
  if (!state.project) return
  state = {
    ...state,
    project: {
      ...updater(state.project),
      updatedAt: new Date().toISOString(),
    },
  }
  notify()
}

export function setProjectName(name: string): void {
  updateProject((p) => ({ ...p, name }))
}

export function setProjectDescription(description: string): void {
  updateProject((p) => ({ ...p, description }))
}

// --- Entidades ---

const ENTITY_TEMPLATES_MAP = new Map(
  getTemplatesByType('player').concat(
    getTemplatesByType('enemy'),
    getTemplatesByType('collectible'),
    getTemplatesByType('obstacle'),
    getTemplatesByType('platform'),
    getTemplatesByType('goal'),
  ).map((t) => [t.name, t]),
)

export function addEntity(templateName: string): Entity | null {
  const template = ENTITY_TEMPLATES_MAP.get(templateName)
  if (!template) return null

  const entity = createEntityFromTemplate(template)
  updateProject((p) => ({ ...p, entities: [...p.entities, entity] }))
  return entity
}

export function addEntityById(entity: Entity): void {
  updateProject((p) => ({ ...p, entities: [...p.entities, entity] }))
}

export function updateEntity(id: string, changes: Partial<Entity>): void {
  updateProject((p) => ({
    ...p,
    entities: p.entities.map((e) =>
      e.id === id ? { ...e, ...changes, properties: { ...e.properties, ...(changes.properties ?? {}) } } : e,
    ),
  }))
}

export function removeEntity(id: string): void {
  updateProject((p) => ({
    ...p,
    entities: p.entities.filter((e) => e.id !== id),
    scripts: p.scripts.filter((s) => s.entityId !== id),
  }))
  if (state.selectedEntityId === id) {
    state = { ...state, selectedEntityId: null, selectedScriptId: null }
  }
  notify()
}

export function selectEntity(id: string | null): void {
  state = { ...state, selectedEntityId: id }
  notify()
}

// --- Scripts ---

export function createScript(entityId: string): Script {
  const eventBlock = createBlock('on_start')
  const script: Script = {
    id: `script_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    entityId,
    eventBlock,
    updatedAt: new Date().toISOString(),
  }
  updateProject((p) => ({ ...p, scripts: [...p.scripts, script] }))
  return script
}

export function selectScript(id: string | null): void {
  state = { ...state, selectedScriptId: id }
  notify()
}

export function updateScript(id: string, changes: Partial<Script>): void {
  updateProject((p) => ({
    ...p,
    scripts: p.scripts.map((s) =>
      s.id === id ? { ...s, ...changes, updatedAt: new Date().toISOString() } : s,
    ),
  }))
}

export function removeScript(id: string): void {
  updateProject((p) => ({
    ...p,
    scripts: p.scripts.filter((s) => s.id !== id),
  }))
  if (state.selectedScriptId === id) {
    state = { ...state, selectedScriptId: null }
  }
  notify()
}

/** Actualiza el bloque de evento de un script. */
export function setEventBlock(scriptId: string, eventBlock: Block): void {
  updateProject((p) => ({
    ...p,
    scripts: p.scripts.map((s) =>
      s.id === scriptId ? { ...s, eventBlock, updatedAt: new Date().toISOString() } : s,
    ),
  }))
}

/** Conecta un bloque al final de la cadena del bloque de evento. */
export function appendBlock(scriptId: string, block: Block): void {
  updateProject((p) => ({
    ...p,
    scripts: p.scripts.map((s) => {
      if (s.id !== scriptId) return s
      const updated = appendBlockToChain(s.eventBlock, block)
      return { ...s, eventBlock: updated, updatedAt: new Date().toISOString() }
    }),
  }))
}

function appendBlockToChain(root: Block, block: Block): Block {
  if (!root.next) return { ...root, next: block }
  return { ...root, next: appendBlockToChain(root.next, block) }
}

/** Elimina un bloque de la cadena por ID. */
export function removeBlock(scriptId: string, blockId: string): void {
  updateProject((p) => ({
    ...p,
    scripts: p.scripts.map((s) => {
      if (s.id !== scriptId) return s
      const updated = removeBlockFromChain(s.eventBlock, blockId)
      return { ...s, eventBlock: updated, updatedAt: new Date().toISOString() }
    }),
  }))
}

function removeBlockFromChain(block: Block, targetId: string): Block {
  // No se elimina el evento raíz
  if (block.next?.id === targetId) {
    return { ...block, next: block.next.next }
  }
  if (block.next) {
    return { ...block, next: removeBlockFromChain(block.next, targetId) }
  }
  return block
}

/** Actualiza parámetros de un bloque en cualquier script. */
export function updateBlockParams(
  scriptId: string,
  blockId: string,
  parameters: Block['parameters'],
): void {
  updateProject((p) => ({
    ...p,
    scripts: p.scripts.map((s) => {
      if (s.id !== scriptId) return s
      const updated = updateBlockInChain(s.eventBlock, blockId, parameters)
      return { ...s, eventBlock: updated, updatedAt: new Date().toISOString() }
    }),
  }))
}

function updateBlockInChain(
  block: Block,
  targetId: string,
  parameters: Block['parameters'],
): Block {
  if (block.id === targetId) return { ...block, parameters }
  if (block.next) return { ...block, next: updateBlockInChain(block.next, targetId, parameters) }
  if (block.children) {
    return {
      ...block,
      children: block.children.map((c) => updateBlockInChain(c, targetId, parameters)),
    }
  }
  return block
}

// --- Variables ---

export function addVariable(variable: Omit<GameVariable, 'currentValue'>): void {
  const full: GameVariable = { ...variable, currentValue: variable.initialValue }
  updateProject((p) => ({ ...p, variables: [...p.variables, full] }))
}

export function updateVariable(id: string, changes: Partial<GameVariable>): void {
  updateProject((p) => ({
    ...p,
    variables: p.variables.map((v) => (v.id === id ? { ...v, ...changes } : v)),
  }))
}

export function removeVariable(id: string): void {
  updateProject((p) => ({
    ...p,
    variables: p.variables.filter((v) => v.id !== id),
  }))
}

// --- Simulador ---

export function setSimulatorRunning(running: boolean): void {
  state = { ...state, simulatorRunning: running }
  notify()
}

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

export function validateProject(project: GameSpecification): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  if (!project.name.trim()) {
    errors.push({ code: 'NO_NAME', message: 'El proyecto no tiene nombre.' })
  }

  const hasScene = !!project.scene
  if (!hasScene) {
    errors.push({ code: 'NO_SCENE', message: 'El proyecto no tiene escenario.' })
  }

  const hasInteractive = project.entities.some(
    (e) => e.type === 'player' || e.type === 'goal' || e.type === 'collectible',
  )
  if (!hasInteractive) {
    errors.push({
      code: 'NO_INTERACTIVE',
      message: 'Agrega al menos un personaje jugable, una meta o un coleccionable.',
    })
  }

  const hasScripts = project.scripts.length > 0
  if (!hasScripts) {
    errors.push({
      code: 'NO_SCRIPTS',
      message: 'Agrega al menos una instrucción de programación para tu videojuego.',
    })
  }

  const hasPlayer = project.entities.some((e) => e.type === 'player')
  if (!hasPlayer) {
    warnings.push({
      code: 'NO_PLAYER',
      message: 'No hay un personaje jugador. ¿El jugador controla alguna entidad?',
    })
  }

  for (const script of project.scripts) {
    const entity = project.entities.find((e) => e.id === script.entityId)
    if (!entity) {
      errors.push({
        code: 'ORPHAN_SCRIPT',
        message: `Un script referencia a una entidad que no existe (${script.entityId}).`,
        reference: { type: 'script', id: script.id },
      })
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ---------------------------------------------------------------------------
// Revisión docente
// ---------------------------------------------------------------------------

export function submitForReview(): ReviewSubmission | null {
  if (!state.project) return null

  const validation = validateProject(state.project)
  if (!validation.valid) return null

  // No permitir envío duplicado mientras está en revisión
  const hasActivePendingReview = state.project.reviewHistory.some(
    (r) => r.status === 'in_review',
  )
  if (hasActivePendingReview) return null

  const version = state.project.reviewHistory.length + 1
  const submission: ReviewSubmission = {
    id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    version,
    submittedAt: new Date().toISOString(),
    status: 'in_review',
    snapshot: JSON.parse(JSON.stringify(state.project)), // snapshot inmutable
  }

  updateProject((p) => ({
    ...p,
    buildStatus: 'in_review',
    reviewHistory: [...p.reviewHistory, submission],
  }))

  saveCurrentProject()
  return submission
}

export function getLatestReview(): ReviewSubmission | null {
  if (!state.project) return null
  const history = state.project.reviewHistory
  return history.length > 0 ? history[history.length - 1] : null
}

export function applyReviewFeedback(
  submissionId: string,
  feedback: ReviewSubmission['feedback'],
  newStatus: 'approved' | 'changes_requested',
): void {
  updateProject((p) => ({
    ...p,
    buildStatus: newStatus,
    reviewHistory: p.reviewHistory.map((r) =>
      r.id === submissionId ? { ...r, status: newStatus, feedback } : r,
    ),
  }))
  saveCurrentProject()
}
