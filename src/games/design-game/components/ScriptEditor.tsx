/**
 * DESIGN GAME - EDITOR DE SCRIPTS (ÁREA DE PROGRAMACIÓN VISUAL)
 * Panel central: secuencias de bloques por entidad
 */

import { useState } from 'react'
import type { Block, BlockParameter, GameSpecification, Script } from '../types'
import { BLOCK_COLORS, BLOCK_DEFINITIONS as _BLOCK_DEFS, createBlock, getBlockDefinition } from '../blocks'
import {
  getState,
  selectEntity,
  selectScript,
  createScript,
  removeScript,
  appendBlock,
  removeBlock,
  updateBlockParams,
} from '../store'
import SpritePreview from './SpritePreview'
import { IconArrow, IconClose } from './Icons'

interface Props {
  spec: GameSpecification
}

export default function ScriptEditor({ spec }: Props) {
  const { selectedEntityId, selectedScriptId } = getState()

  const entities = spec.entities
  const selectedEntity = entities.find((e) => e.id === selectedEntityId)
  const entityScripts = spec.scripts.filter((s) => s.entityId === selectedEntityId)
  const selectedScript = spec.scripts.find((s) => s.id === selectedScriptId)

  if (entities.length === 0) {
    return (
      <div className="dg-script-editor dg-script-editor--empty">
        <div className="dg-empty-state">
          <h3>Nothing to program yet</h3>
          <p>Add a player, an enemy or something to collect from the Sprites panel, then come back here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dg-script-editor">
      {/* Selector de entidad */}
      <div className="dg-script-editor__entity-bar">
        {entities.map((entity) => (
          <button
            key={entity.id}
            className={`dg-entity-tab ${selectedEntityId === entity.id ? 'dg-entity-tab--active' : ''}`}
            onClick={() => selectEntity(entity.id)}
            title={entity.name}
          >
            <span className="dg-entity-tab__sprite">
              <SpritePreview sprite={entity.sprite} size={14} />
            </span>
            <span className="dg-entity-tab__name">{entity.name}</span>
          </button>
        ))}
      </div>

      {!selectedEntity ? (
        <div className="dg-empty-state">
          <p>Pick a sprite above to see and change what it does.</p>
        </div>
      ) : (
        <div className="dg-script-editor__body">
          {/* Lista de scripts de la entidad */}
          <div className="dg-script-editor__scripts-col">
            <div className="dg-script-editor__scripts-header">
              <span className="dg-script-editor__scripts-title">
                Scripts for "{selectedEntity.name}"
              </span>
              <button
                className="dg-btn dg-btn--ghost dg-btn--sm"
                onClick={() => {
                  const s = createScript(selectedEntity.id)
                  selectScript(s.id)
                }}
              >
                + Script
              </button>
            </div>

            {entityScripts.length === 0 && (
              <div className="dg-script-editor__no-scripts">
                <p>No scripts yet.</p>
                <button
                  className="dg-btn dg-btn--primary dg-btn--sm"
                  onClick={() => {
                    const s = createScript(selectedEntity.id)
                    selectScript(s.id)
                  }}
                >
                  Start the first one
                </button>
              </div>
            )}

            <div className="dg-script-list">
              {entityScripts.map((script) => (
                <ScriptListItem
                  key={script.id}
                  script={script}
                  isSelected={script.id === selectedScriptId}
                  onSelect={() => selectScript(script.id)}
                  onDelete={() => {
                    removeScript(script.id)
                    if (selectedScriptId === script.id) selectScript(null)
                  }}
                />
              ))}
            </div>
          </div>

          {/* Editor del script seleccionado */}
          <div className="dg-script-editor__editor-col">
            {!selectedScript ? (
              <div className="dg-empty-state dg-empty-state--center">
                <p>Pick a script on the left, or start a new one.</p>
              </div>
            ) : (
              <ScriptCanvas script={selectedScript} spec={spec} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Item de la lista de scripts
// ---------------------------------------------------------------------------

function ScriptListItem({
  script, isSelected, onSelect, onDelete,
}: {
  script: Script
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const eventDef = getBlockDefinition(script.eventBlock.type)
  const blockCount = countBlocks(script.eventBlock)

  return (
    <div
      className={`dg-script-item ${isSelected ? 'dg-script-item--selected' : ''}`}
      onClick={onSelect}
    >
      <div className="dg-script-item__info">
        <span className="dg-script-item__name">
          {eventDef?.label ?? 'Script'}
        </span>
        <span className="dg-script-item__count">
          {blockCount - 1} block{blockCount !== 2 ? 's' : ''}
        </span>
      </div>
      <button
        className="dg-script-item__delete"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        aria-label="Delete script"
      >
        <IconClose size={13} />
      </button>
    </div>
  )
}

function countBlocks(block: Block | undefined): number {
  if (!block) return 0
  let count = 1
  if (block.next) count += countBlocks(block.next)
  if (block.children) for (const c of block.children) count += countBlocks(c)
  return count
}

// ---------------------------------------------------------------------------
// Canvas del script (renderiza la cadena de bloques)
// ---------------------------------------------------------------------------

function ScriptCanvas({ script, spec }: { script: Script; spec: GameSpecification }) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)

  const blocks = flattenChain(script.eventBlock)

  return (
    <div className="dg-script-canvas">
      <div className="dg-script-canvas__header">
        <span className="dg-script-canvas__title">Script</span>
        <span className="dg-script-canvas__hint">
          Click a block to change its settings
        </span>
      </div>

      <div
        className="dg-script-canvas__area"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const type = e.dataTransfer.getData('block-type') as Block['type']
          if (!type) return
          const block = createBlock(type)
          appendBlock(script.id, block)
        }}
      >
        {blocks.map((block, idx) => (
          <BlockNode
            key={block.id}
            block={block}
            script={script}
            spec={spec}
            isEvent={idx === 0}
            isEditing={editingBlockId === block.id}
            onEdit={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
            onRemove={() => {
              if (idx === 0) return // No eliminar el evento raíz
              removeBlock(script.id, block.id)
              setEditingBlockId(null)
            }}
          />
        ))}

        {blocks.length === 1 && (
          <div className="dg-script-canvas__empty-hint">
            <IconArrow direction="up" />
            <span>Add blocks from the library on the left</span>
          </div>
        )}
      </div>
    </div>
  )
}

function flattenChain(block: Block | undefined): Block[] {
  if (!block) return []
  const result: Block[] = [block]
  if (block.next) result.push(...flattenChain(block.next))
  return result
}

// ---------------------------------------------------------------------------
// Nodo de bloque visual
// ---------------------------------------------------------------------------

function BlockNode({
  block, script, spec, isEvent, isEditing, onEdit, onRemove,
}: {
  block: Block
  script: Script
  spec: GameSpecification
  isEvent: boolean
  isEditing: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  const def = getBlockDefinition(block.type)
  const color = BLOCK_COLORS[block.category]

  return (
    <div
      className={`dg-block-node ${isEvent ? 'dg-block-node--event' : ''} ${isEditing ? 'dg-block-node--editing' : ''}`}
      style={{ '--block-color': color } as React.CSSProperties}
    >
      <div className="dg-block-node__header" onClick={onEdit}>
        {!isEvent && (
          <span className="dg-block-node__connector" />
        )}
        <span className="dg-block-node__label">{def?.label ?? block.type}</span>
        <div className="dg-block-node__params-preview">
          {block.parameters.slice(0, 2).map((p) => (
            <span key={p.name} className="dg-block-node__param-chip">
              {String(p.value)}
            </span>
          ))}
        </div>
        {!isEvent && (
          <button
            className="dg-block-node__remove"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            aria-label="Remove block"
          >
            <IconClose size={13} />
          </button>
        )}
      </div>

      {/* Editor de parámetros (expandido) */}
      {isEditing && block.parameters.length > 0 && (
        <div className="dg-block-node__params">
          {block.parameters.map((param) => (
            <ParamEditor
              key={param.name}
              param={param}
              spec={spec}
              onChange={(newValue) => {
                const updated = block.parameters.map((p) =>
                  p.name === param.name ? { ...p, value: newValue } : p,
                )
                updateBlockParams(script.id, block.id, updated)
              }}
            />
          ))}
        </div>
      )}

      {/* Conector inferior */}
      {!isEvent && (
        <span className="dg-block-node__connector dg-block-node__connector--bottom" />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor de parámetros de un bloque
// ---------------------------------------------------------------------------

function ParamEditor({
  param,
  spec,
  onChange,
}: {
  param: BlockParameter
  spec: GameSpecification
  onChange: (value: string | number | boolean) => void
}) {
  const options =
    param.type === 'entity'
      ? spec.entities.map((e) => ({ label: e.name, value: e.id }))
      : param.options ?? []

  return (
    <div className="dg-param-editor">
      <label className="dg-param-editor__label">{param.name}</label>

      {param.type === 'boolean' ? (
        <select
          className="dg-param-editor__input"
          value={String(param.value)}
          onChange={(e) => onChange(e.target.value === 'true')}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      ) : options.length > 0 ? (
        <select
          className="dg-param-editor__input"
          value={String(param.value)}
          onChange={(e) => {
            const val = param.type === 'number' ? Number(e.target.value) : e.target.value
            onChange(val)
          }}
        >
          {options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : param.type === 'number' ? (
        <input
          className="dg-param-editor__input"
          type="number"
          value={Number(param.value)}
          onChange={(e) => onChange(Number(e.target.value))}
          step={1}
        />
      ) : (
        <input
          className="dg-param-editor__input"
          type="text"
          value={String(param.value)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
