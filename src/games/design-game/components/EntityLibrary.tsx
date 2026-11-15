/**
 * DESIGN GAME - BIBLIOTECA DE ENTIDADES
 * Sin emojis; iconos SVG coherentes con Órbita Arcade.
 */

import { useState } from 'react'
import type { Entity, EntityType, GameSpecification } from '../types'
import {
  getTemplatesByGenre,
  createEntityFromTemplate,
} from '../entities'
import {
  getState, selectEntity, addEntityById, updateEntity, removeEntity,
} from '../store'

/* -------------------------------------------------------------------------
   Iconos SVG
   ------------------------------------------------------------------------- */
const stroke = {
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconPlayer()      { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.5" {...stroke} /><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" {...stroke} /></svg> }
function IconEnemy()       { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l9 16H3L12 3z" {...stroke} /></svg> }
function IconCollectible() { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3.1 6.4 7 1-5 4.9 1.2 7L12 18l-6.3 3.3 1.2-7-5-4.9 7-1z" {...stroke} /></svg> }
function IconObstacle()    { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 7-9 7-9-7z" {...stroke} /></svg> }
function IconPlatform()    { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="12" width="20" height="6" rx="2" {...stroke} /></svg> }
function IconGoal()        { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2v20M5 4l9 3-9 3" {...stroke} /></svg> }
function IconAll()         { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" {...stroke} /><rect x="14" y="3" width="7" height="7" rx="1" {...stroke} /><rect x="3" y="14" width="7" height="7" rx="1" {...stroke} /><rect x="14" y="14" width="7" height="7" rx="1" {...stroke} /></svg> }
function IconClose()       { return <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" {...stroke} /></svg> }
function IconAdd()         { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" {...stroke} /></svg> }

/* -------------------------------------------------------------------------
   Mapa tipo → icono
   ------------------------------------------------------------------------- */
const TYPE_ICON: Record<EntityType | 'all', () => JSX.Element> = {
  all:         IconAll,
  player:      IconPlayer,
  enemy:       IconEnemy,
  collectible: IconCollectible,
  obstacle:    IconObstacle,
  platform:    IconPlatform,
  goal:        IconGoal,
}

const TYPE_LABELS: Record<EntityType | 'all', string> = {
  all:         'Todos',
  player:      'Jugador',
  enemy:       'Enemigo',
  collectible: 'Coleccionable',
  obstacle:    'Obstáculo',
  platform:    'Plataforma',
  goal:        'Meta',
}

/* -------------------------------------------------------------------------
   Componente principal
   ------------------------------------------------------------------------- */

interface Props { spec: GameSpecification }

type Tab = 'scene' | 'add'

export default function EntityLibrary({ spec }: Props) {
  const [tab, setTab] = useState<Tab>('scene')
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all')
  const { selectedEntityId } = getState()

  const templates = getTemplatesByGenre(spec.genre)
  const filteredTemplates = filterType === 'all' ? templates : templates.filter((t) => t.type === filterType)
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
              <span className="dg-empty-state__icon"><IconAll /></span>
              <p>Sin objetos en el escenario. Agrégalos desde la pestaña Agregar.</p>
            </div>
          ) : (
            <div className="dg-entity-lib__list">
              {spec.entities.map((entity) => (
                <EntityItem
                  key={entity.id}
                  entity={entity}
                  isSelected={entity.id === selectedEntityId}
                  onSelect={() => selectEntity(entity.id)}
                  onDelete={() => { removeEntity(entity.id); if (selectedEntityId === entity.id) selectEntity(null) }}
                />
              ))}
            </div>
          )}

          {selectedEntity && <EntityPropsEditor entity={selectedEntity} spec={spec} />}
        </div>
      ) : (
        <div className="dg-entity-lib__body">
          {/* Filtro */}
          <div className="dg-entity-lib__filter">
            {(['all', 'player', 'enemy', 'collectible', 'obstacle', 'platform', 'goal'] as const).map((t) => {
              const Icon = TYPE_ICON[t]
              return (
                <button
                  key={t}
                  className={`dg-filter-btn ${filterType === t ? 'dg-filter-btn--active' : ''}`}
                  onClick={() => setFilterType(t)}
                  title={TYPE_LABELS[t]}
                >
                  <Icon />
                </button>
              )
            })}
          </div>

          <div className="dg-entity-lib__templates">
            {filteredTemplates.map((template) => {
              const Icon = TYPE_ICON[template.type] ?? IconAll
              return (
                <button
                  key={template.name}
                  className="dg-template-btn"
                  onClick={() => {
                    const entity = createEntityFromTemplate(template)
                    entity.position = {
                      x: 50 + Math.floor(Math.random() * 300),
                      y: 50 + Math.floor(Math.random() * 200),
                    }
                    addEntityById(entity)
                    selectEntity(entity.id)
                    setTab('scene')
                  }}
                >
                  <span className="dg-template-btn__glyph" aria-hidden="true"><Icon /></span>
                  <div className="dg-template-btn__info">
                    <span className="dg-template-btn__name">{template.name}</span>
                    <span className="dg-template-btn__desc">{template.description}</span>
                  </div>
                  <span className="dg-template-btn__add" aria-hidden="true"><IconAdd /></span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------
   Entity item
   ------------------------------------------------------------------------- */

function EntityItem({ entity, isSelected, onSelect, onDelete }: {
  entity: Entity; isSelected: boolean; onSelect: () => void; onDelete: () => void
}) {
  const Icon = TYPE_ICON[entity.type] ?? IconAll
  return (
    <div className={`dg-entity-item ${isSelected ? 'dg-entity-item--selected' : ''}`} onClick={onSelect}>
      <span className="dg-entity-item__glyph"><Icon /></span>
      <div className="dg-entity-item__info">
        <span className="dg-entity-item__name">{entity.name}</span>
        <span className="dg-entity-item__type">{TYPE_LABELS[entity.type]}</span>
      </div>
      <span className="dg-entity-item__pos">
        {Math.round(entity.position.x)}, {Math.round(entity.position.y)}
      </span>
      <button
        className="dg-entity-item__delete"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        aria-label={`Eliminar ${entity.name}`}
      >
        <IconClose />
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------
   Props editor
   ------------------------------------------------------------------------- */

function EntityPropsEditor({ entity, spec }: { entity: Entity; spec: GameSpecification }) {
  const Icon = TYPE_ICON[entity.type] ?? IconAll
  return (
    <div className="dg-entity-props">
      <h4 className="dg-entity-props__title">
        <span className="dg-entity-props__title-icon"><Icon /></span>
        {entity.name}
      </h4>

      <div className="dg-entity-props__fields">
        {/* Posición */}
        <div className="dg-entity-props__group">
          <span className="dg-entity-props__group-label">Posición</span>
          <div className="dg-entity-props__row">
            <label>X
              <input type="number" className="dg-entity-props__input"
                value={Math.round(entity.position.x)} min={0} max={spec.scene.size.width}
                onChange={(e) => updateEntity(entity.id, { position: { ...entity.position, x: Number(e.target.value) } })}
              />
            </label>
            <label>Y
              <input type="number" className="dg-entity-props__input"
                value={Math.round(entity.position.y)} min={0} max={spec.scene.size.height}
                onChange={(e) => updateEntity(entity.id, { position: { ...entity.position, y: Number(e.target.value) } })}
              />
            </label>
          </div>
        </div>

        {/* Tamaño */}
        <div className="dg-entity-props__group">
          <span className="dg-entity-props__group-label">Tamaño</span>
          <div className="dg-entity-props__row">
            <label>Ancho
              <input type="number" className="dg-entity-props__input"
                value={entity.size.width} min={8} max={400}
                onChange={(e) => updateEntity(entity.id, { size: { ...entity.size, width: Number(e.target.value) } })}
              />
            </label>
            <label>Alto
              <input type="number" className="dg-entity-props__input"
                value={entity.size.height} min={8} max={400}
                onChange={(e) => updateEntity(entity.id, { size: { ...entity.size, height: Number(e.target.value) } })}
              />
            </label>
          </div>
        </div>

        {/* Velocidad */}
        {entity.properties.speed !== undefined && (
          <div className="dg-entity-props__group">
            <label className="dg-entity-props__group-label">
              Velocidad — {entity.properties.speed} px/s
              <input type="range" className="dg-entity-props__range"
                value={entity.properties.speed} min={20} max={500} step={10}
                onChange={(e) => updateEntity(entity.id, { properties: { ...entity.properties, speed: Number(e.target.value) } })}
              />
            </label>
          </div>
        )}

        {/* Puntos */}
        {entity.type === 'collectible' && (
          <div className="dg-entity-props__group">
            <label className="dg-entity-props__group-label">
              Puntos al recolectar
              <input type="number" className="dg-entity-props__input"
                value={entity.properties.points ?? 10} min={0} max={1000}
                onChange={(e) => updateEntity(entity.id, { properties: { ...entity.properties, points: Number(e.target.value) } })}
              />
            </label>
          </div>
        )}

        {/* Comportamiento de enemigos */}
        {entity.type === 'enemy' && entity.properties.behavior && (
          <div className="dg-entity-props__group">
            <label className="dg-entity-props__group-label">
              Comportamiento
              <select className="dg-entity-props__select"
                value={entity.properties.behavior}
                onChange={(e) => updateEntity(entity.id, { properties: { ...entity.properties, behavior: e.target.value as Entity['properties']['behavior'] } })}
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
