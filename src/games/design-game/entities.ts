/**
 * DESIGN GAME - BIBLIOTECA DE ENTIDADES PREDETERMINADAS
 * -------------------------------------------------------------------------
 * Define el catálogo de personajes, enemigos, coleccionables, obstáculos,
 * plataformas y objetos interactivos disponibles para los tres géneros.
 *
 * Los recursos gráficos son CSS/Canvas puro (sin imágenes externas).
 * Cada sprite se define como un descriptor que el renderer interpreta.
 */

import type { Entity, EntityType, GameGenre } from './types'

export interface EntityTemplate {
  type: EntityType
  name: string
  sprite: string
  defaultSize: { width: number; height: number }
  description: string
  /** Para qué géneros es apropiada */
  genres: GameGenre[]
  defaultProperties: Entity['properties']
}

export const ENTITY_TEMPLATES: EntityTemplate[] = [
  // -------------------------------------------------------------------------
  // JUGADORES
  // -------------------------------------------------------------------------
  {
    type: 'player',
    name: 'Explorer',
    sprite: 'player_explorer',
    defaultSize: { width: 32, height: 48 },
    description: 'Main character, controlled by the player',
    genres: ['arcade', 'platformer', 'maze'],
    defaultProperties: { speed: 150, controllable: true },
  },
  {
    type: 'player',
    name: 'Spaceship',
    sprite: 'player_ship',
    defaultSize: { width: 40, height: 40 },
    description: 'A ship the player steers',
    genres: ['arcade'],
    defaultProperties: { speed: 200, controllable: true },
  },
  {
    type: 'player',
    name: 'Runner',
    sprite: 'player_athlete',
    defaultSize: { width: 32, height: 48 },
    description: 'Light and quick, good at jumping',
    genres: ['platformer', 'arcade'],
    defaultProperties: { speed: 180, controllable: true },
  },
  {
    type: 'player',
    name: 'Robot',
    sprite: 'player_robot',
    defaultSize: { width: 36, height: 44 },
    description: 'A steady robot for maze games',
    genres: ['maze', 'arcade'],
    defaultProperties: { speed: 120, controllable: true },
  },

  // -------------------------------------------------------------------------
  // ENEMIGOS
  // -------------------------------------------------------------------------
  {
    type: 'enemy',
    name: 'Guard',
    sprite: 'enemy_guard',
    defaultSize: { width: 32, height: 48 },
    description: 'Walks from side to side',
    genres: ['platformer', 'maze', 'arcade'],
    defaultProperties: { speed: 80, behavior: 'patrol', direction: 'horizontal', damage: 1 },
  },
  {
    type: 'enemy',
    name: 'Chaser',
    sprite: 'enemy_chaser',
    defaultSize: { width: 32, height: 32 },
    description: 'Follows the player',
    genres: ['maze', 'arcade'],
    defaultProperties: { speed: 60, behavior: 'follow', damage: 1 },
  },
  {
    type: 'enemy',
    name: 'Asteroid',
    sprite: 'enemy_asteroid',
    defaultSize: { width: 28, height: 28 },
    description: 'Drifts in random directions',
    genres: ['arcade'],
    defaultProperties: { speed: 100, behavior: 'random', damage: 1 },
  },
  {
    type: 'enemy',
    name: 'Ghost',
    sprite: 'enemy_ghost',
    defaultSize: { width: 32, height: 40 },
    description: 'Walks up and down',
    genres: ['maze', 'platformer'],
    defaultProperties: { speed: 70, behavior: 'patrol', direction: 'vertical', damage: 1 },
  },

  // -------------------------------------------------------------------------
  // COLECCIONABLES
  // -------------------------------------------------------------------------
  {
    type: 'collectible',
    name: 'Star',
    sprite: 'collectible_star',
    defaultSize: { width: 24, height: 24 },
    description: 'Worth 10 points when picked up',
    genres: ['arcade', 'platformer', 'maze'],
    defaultProperties: { points: 10 },
  },
  {
    type: 'collectible',
    name: 'Coin',
    sprite: 'collectible_coin',
    defaultSize: { width: 20, height: 20 },
    description: 'Worth 5 points when picked up',
    genres: ['platformer', 'arcade', 'maze'],
    defaultProperties: { points: 5 },
  },
  {
    type: 'collectible',
    name: 'Gem',
    sprite: 'collectible_gem',
    defaultSize: { width: 22, height: 28 },
    description: 'Worth 20 points when picked up',
    genres: ['arcade', 'maze'],
    defaultProperties: { points: 20 },
  },
  {
    type: 'collectible',
    name: 'Key',
    sprite: 'collectible_key',
    defaultSize: { width: 20, height: 32 },
    description: 'Unlocks doors',
    genres: ['maze', 'platformer'],
    defaultProperties: { points: 0 },
  },

  // -------------------------------------------------------------------------
  // OBSTÁCULOS
  // -------------------------------------------------------------------------
  {
    type: 'obstacle',
    name: 'Rock',
    sprite: 'obstacle_rock',
    defaultSize: { width: 40, height: 36 },
    description: 'Blocks the way',
    genres: ['arcade', 'platformer', 'maze'],
    defaultProperties: { damage: 0, behavior: 'static' },
  },
  {
    type: 'obstacle',
    name: 'Fire wall',
    sprite: 'obstacle_fire',
    defaultSize: { width: 32, height: 48 },
    description: 'Hurts the player on contact',
    genres: ['platformer', 'maze'],
    defaultProperties: { damage: 1, behavior: 'static' },
  },
  {
    type: 'obstacle',
    name: 'Spikes',
    sprite: 'obstacle_spike',
    defaultSize: { width: 32, height: 24 },
    description: 'A trap that hurts the player',
    genres: ['platformer', 'arcade'],
    defaultProperties: { damage: 1, behavior: 'static' },
  },

  // -------------------------------------------------------------------------
  // PLATAFORMAS
  // -------------------------------------------------------------------------
  {
    type: 'platform',
    name: 'Solid platform',
    sprite: 'platform_solid',
    defaultSize: { width: 128, height: 24 },
    description: 'Something the player can stand on',
    genres: ['platformer'],
    defaultProperties: { behavior: 'static' },
  },
  {
    type: 'platform',
    name: 'Moving platform',
    sprite: 'platform_moving',
    defaultSize: { width: 96, height: 24 },
    description: 'Slides from side to side',
    genres: ['platformer'],
    defaultProperties: { speed: 60, behavior: 'patrol', direction: 'horizontal' },
  },
  {
    type: 'platform',
    name: 'Ground',
    sprite: 'platform_ground',
    defaultSize: { width: 800, height: 32 },
    description: 'The floor everything stands on',
    genres: ['platformer'],
    defaultProperties: { behavior: 'static' },
  },

  // -------------------------------------------------------------------------
  // METAS / OBJETIVOS
  // -------------------------------------------------------------------------
  {
    type: 'goal',
    name: 'Goal flag',
    sprite: 'goal_flag',
    defaultSize: { width: 32, height: 48 },
    description: 'Reach it and the game is won',
    genres: ['platformer', 'maze'],
    defaultProperties: {},
  },
  {
    type: 'goal',
    name: 'Portal',
    sprite: 'goal_portal',
    defaultSize: { width: 48, height: 64 },
    description: 'The way out, and the way to win',
    genres: ['maze', 'arcade'],
    defaultProperties: {},
  },
]

export function getTemplatesByGenre(genre: GameGenre): EntityTemplate[] {
  return ENTITY_TEMPLATES.filter((t) => t.genres.includes(genre))
}

export function getTemplatesByType(type: EntityType): EntityTemplate[] {
  return ENTITY_TEMPLATES.filter((t) => t.type === type)
}

/** Crea una nueva entidad desde una plantilla */
export function createEntityFromTemplate(template: EntityTemplate, id?: string): Entity {
  return {
    id: id ?? `entity_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: template.type,
    name: template.name,
    sprite: template.sprite,
    position: { x: 100, y: 100 },
    size: { ...template.defaultSize },
    properties: { ...template.defaultProperties },
  }
}

// ---------------------------------------------------------------------------
// Colores de sprite (todos renderizados por canvas, sin imágenes)
// ---------------------------------------------------------------------------

export interface SpriteDescriptor {
  primaryColor: string
  secondaryColor: string
  shape: 'player' | 'enemy' | 'star' | 'coin' | 'gem' | 'key' | 'rock' | 'fire' | 'spike' | 'platform' | 'flag' | 'portal'
}

export const SPRITE_DESCRIPTORS: Record<string, SpriteDescriptor> = {
  player_explorer: { primaryColor: '#4A90D9', secondaryColor: '#2C5F8A', shape: 'player' },
  player_ship:     { primaryColor: '#7B68EE', secondaryColor: '#4B3FA8', shape: 'player' },
  player_athlete:  { primaryColor: '#F39C12', secondaryColor: '#B7770D', shape: 'player' },
  player_robot:    { primaryColor: '#1ABC9C', secondaryColor: '#148F77', shape: 'player' },
  enemy_guard:     { primaryColor: '#E74C3C', secondaryColor: '#A93226', shape: 'enemy' },
  enemy_chaser:    { primaryColor: '#E67E22', secondaryColor: '#A04000', shape: 'enemy' },
  enemy_asteroid:  { primaryColor: '#7F8C8D', secondaryColor: '#4D5656', shape: 'rock' },
  enemy_ghost:     { primaryColor: '#BDC3C7', secondaryColor: '#7F8C8D', shape: 'enemy' },
  collectible_star:{ primaryColor: '#F1C40F', secondaryColor: '#B7950B', shape: 'star' },
  collectible_coin:{ primaryColor: '#F39C12', secondaryColor: '#B7770D', shape: 'coin' },
  collectible_gem: { primaryColor: '#E91E8C', secondaryColor: '#A11564', shape: 'gem' },
  collectible_key: { primaryColor: '#D4AC0D', secondaryColor: '#9A7D0A', shape: 'key' },
  obstacle_rock:   { primaryColor: '#795548', secondaryColor: '#4E342E', shape: 'rock' },
  obstacle_fire:   { primaryColor: '#FF5722', secondaryColor: '#BF360C', shape: 'fire' },
  obstacle_spike:  { primaryColor: '#607D8B', secondaryColor: '#37474F', shape: 'spike' },
  platform_solid:  { primaryColor: '#5D4037', secondaryColor: '#3E2723', shape: 'platform' },
  platform_moving: { primaryColor: '#1565C0', secondaryColor: '#0D47A1', shape: 'platform' },
  platform_ground: { primaryColor: '#4CAF50', secondaryColor: '#388E3C', shape: 'platform' },
  goal_flag:       { primaryColor: '#27AE60', secondaryColor: '#1E8449', shape: 'flag' },
  goal_portal:     { primaryColor: '#8E44AD', secondaryColor: '#6C3483', shape: 'portal' },
}
