/**
 * DESIGN GAME - BIBLIOTECA DE ENTIDADES
 * Panel derecho inferior: personajes, objetos y propiedades
 */

import { useState } from 'react'
import type { Entity, EntityType, GameSpecification } from '../types'
import {
  ENTITY_TEMPLATES as _ENTITY_TEMPLATES,
  SPRITE_DESCRIPTORS,
  getTemplatesByGenre,
  createEntityFromTemplate,
} from '../entities'
import {
  getState,
  selectEntity,
  addEntityById,
  updateEntity,
  removeEntity,
} from '../store'

interface Props {
  spec: GameSpecification
}

type Tab = 'scene' | 'add'

export default function EntityLibrary({ spec }: Props) {
  const [tab, setTab] = useState<Tab>('scene')
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all')
  const { selectedEntityId } = getState()

  const templates = getTemplatesByGenre(spec.genre)
  const filteredTemplates = filterType === 'all'
    ? templates
    : templates.filter((t) => t.type === filterType)

  const selectedEntity = spec.entities.find((e) => e.id === selectedEntityId)

  return (
    <div className="dg-entity-lib">
      <div className="dg-entity-lib__tabs">
        <button
          className={`dg-entity-lib__tab ${tab === 'scene' ? 'dg-entity-lib__tab--active' : ''}`}
          onClick={() => setTab('scene')}
        >
          En el juego ({spec.entities.length})
        </button>
        <button
          className={`dg-entity-lib__tab ${tab === 'add' ? 'dg-entity-lib__tab--active' : ''}`}
          onClick={() => setTab('add')}
        >
          + Agregar
        </button>
      </div>

      {tab === 'scene' ? (
        <div className="dg-entity-lib__body">
          {spec.entities.length === 0 ? (
            <div className="dg-empty-state">
              <span className="dg-empty-state__icon">🎭</span>
              <p>Sin objetos en el escenario. Agrégalos desde la pestaña "+ Agregar".</p>
            </div>
          ) : (
            <div className="dg-entity-lib__list">
              {spec.entities.map((entity) => (
                <EntityItem
                  key={entity.id}
                  entity={entity}
                  isSelected={entity.id === selectedEntityId}
                  onSelect={() => selectEntity(entity.id)}
                  onDelete={() => {
                    removeEntity(entity.id)
                    if (selectedEntityId === entity.id) selectEntity(null)
                  }}
                />
              ))}
            </div>
          )}

          {/* Editor de propiedades de la entidad seleccionada */}
          {selectedEntity && (
            <EntityPropsEditor entity={selectedEntity} spec={spec} />
          )}
        </div>
      ) : (
        <div className="dg-entity-lib__body">
          {/* Filtro por tipo */}
          <div className="dg-entity-lib__filter">
            {(['all', 'player', 'enemy', 'collectible', 'obstacle', 'platform', 'goal'] as const).map((t) => (
              <button
                key={t}
                className={`dg-filter-btn ${filterType === t ? 'dg-filter-btn--active' : ''}`}
                onClick={() => setFilterType(t)}
              >
                {TYPE_ICONS[t]} {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="dg-entity-lib__templates">
            {filteredTemplates.map((template) => (
              <button
                key={template.name}
                className="dg-template-btn"
                onClick={() => {
                  const entity = createEntityFromTemplate(template)
                  // Posición inicial ligeramente aleatoria
                  entity.position = {
                    x: 50 + Math.floor(Math.random() * 300),
                    y: 50 + Math.floor(Math.random() * 200),
                  }
                  addEntityById(entity)
                  selectEntity(entity.id)
                  setTab('scene')
                }}
              >
                <span className="dg-template-btn__emoji">
                  {SPRITE_DESCRIPTORS[template.sprite]?.emoji ?? '?'}
                </span>
                <div className="dg-template-btn__info">
                  <span className="dg-template-btn__name">{template.name}</span>
                  <span className="dg-template-btn__desc">{template.description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Item de entidad
// ---------------------------------------------------------------------------

function EntityItem({
  entity, isSelected, onSelect, onDelete,
}: {
  entity: Entity
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const desc = SPRITE_DESCRIPTORS[entity.sprite]
  return (
    <div
      className={`dg-entity-item ${isSelected ? 'dg-entity-item--selected' : ''}`}
      onClick={onSelect}
    >
      <span className="dg-entity-item__emoji">{desc?.emoji ?? '?'}</span>
      <div className="dg-entity-item__info">
        <span className="dg-entity-item__name">{entity.name}</span>
        <span className="dg-entity-item__type">{TYPE_LABELS[entity.type]}</span>
      </div>
      <span className="dg-entity-item__pos">
        ({Math.round(entity.position.x)}, {Math.round(entity.position.y)})
      </span>
      <button
        className="dg-entity-item__delete"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        aria-label={`Eliminar ${entity.name}`}
      >
        ✕
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor de propiedades
// ---------------------------------------------------------------------------

function EntityPropsEditor({ entity, spec }: { entity: Entity; spec: GameSpecification }) {
  return (
    <div className="dg-entity-props">
      <h4 className="dg-entity-props__title">
        {SPRITE_DESCRIPTORS[entity.sprite]?.emoji ?? '?'} {entity.name}
      </h4>

      <div className="dg-entity-props__fields">
        {/* Posición */}
        <div className="dg-entity-props__group">
          <span className="dg-entity-props__group-label">Posición</span>
          <div className="dg-entity-props__row">
            <label>
              X
              <input
                type="number"
                className="dg-entity-props__input"
                value={Math.round(entity.position.x)}
                min={0}
                max={spec.scene.size.width}
                onChange={(e) =>
                  updateEntity(entity.id, {
                    position: { ...entity.position, x: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              Y
              <input
                type="number"
                className="dg-entity-props__input"
                value={Math.round(entity.position.y)}
                min={0}
                max={spec.scene.size.height}
                onChange={(e) =>
                  updateEntity(entity.id, {
                    position: { ...entity.position, y: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
        </div>

        {/* Tamaño */}
        <div className="dg-entity-props__group">
          <span className="dg-entity-props__group-label">Tamaño</span>
          <div className="dg-entity-props__row">
            <label>
              Ancho
              <input
                type="number"
                className="dg-entity-props__input"
                value={entity.size.width}
                min={8}
                max={400}
                onChange={(e) =>
                  updateEntity(entity.id, {
                    size: { ...entity.size, width: Number(e.target.value) },
                  })
                }
              />
            </label>
            <label>
              Alto
              <input
                type="number"
                className="dg-entity-props__input"
                value={entity.size.height}
                min={8}
                max={400}
                onChange={(e) =>
                  updateEntity(entity.id, {
                    size: { ...entity.size, height: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
        </div>

        {/* Velocidad (si aplica) */}
        {entity.properties.speed !== undefined && (
          <div className="dg-entity-props__group">
            <label className="dg-entity-props__group-label">
              Velocidad
              <input
                type="range"
                className="dg-entity-props__range"
                value={entity.properties.speed}
                min={20}
                max={500}
                step={10}
                onChange={(e) =>
                  updateEntity(entity.id, {
                    properties: { ...entity.properties, speed: Number(e.target.value) },
                  })
                }
              />
              <span>{entity.properties.speed} px/s</span>
            </label>
          </div>
        )}

        {/* Puntos (si es coleccionable) */}
        {entity.type === 'collectible' && (
          <div className="dg-entity-props__group">
            <label className="dg-entity-props__group-label">
              Puntos al recolectar
              <input
                type="number"
                className="dg-entity-props__input"
                value={entity.properties.points ?? 10}
                min={0}
                max={1000}
                onChange={(e) =>
                  updateEntity(entity.id, {
                    properties: { ...entity.properties, points: Number(e.target.value) },
                  })
                }
              />
            </label>
          </div>
        )}

        {/* Comportamiento de enemigos */}
        {entity.type === 'enemy' && entity.properties.behavior && (
          <div className="dg-entity-props__group">
            <label className="dg-entity-props__group-label">
              Comportamiento
              <select
                className="dg-entity-props__select"
                value={entity.properties.behavior}
                onChange={(e) =>
                  updateEntity(entity.id, {
                    properties: {
                      ...entity.properties,
                      behavior: e.target.value as Entity['properties']['behavior'],
                    },
                  })
                }
              >
                <option value="static">Estático</option>
                <option value="patrol">Patrulla</option>
                <option value="follow">Seguir al jugador</option>
                <option value="random">Aleatorio</option>
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

const TYPE_LABELS: Record<EntityType | 'all', string> = {
  all: 'Todos',
  player: 'Jugador',
  enemy: 'Enemigo',
  collectible: 'Coleccionable',
  obstacle: 'Obstáculo',
  platform: 'Plataforma',
  goal: 'Meta',
}

const TYPE_ICONS: Record<EntityType | 'all', string> = {
  all: '🎲',
  player: '🧑',
  enemy: '👾',
  collectible: '⭐',
  obstacle: '🪨',
  platform: '▬',
  goal: '🏁',
}
