/**
 * DESIGN GAME - BIBLIOTECA DE BLOQUES
 * Panel izquierdo del editor: categorías + bloques arrastrables
 */

import { useState } from 'react'
import type { BlockCategory, GameSpecification } from '../types'
import {
  BLOCK_CATEGORIES_ORDER,
  BLOCK_COLORS,
  BLOCK_DEFINITIONS,
  createBlock as createBlockDef,
  type BlockDefinition,
} from '../blocks'
import {
  getState,
  createScript,
  appendBlock,
  selectScript,
} from '../store'

interface Props {
  spec: GameSpecification
}

export default function BlockLibrary({ spec }: Props) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('events')
  const [search, setSearch] = useState('')

  const defs = BLOCK_DEFINITIONS.filter((b) => {
    if (b.category !== activeCategory) return false
    if (search) return b.label.toLowerCase().includes(search.toLowerCase())
    return true
  })

  return (
    <div className="dg-block-lib">
      <div className="dg-block-lib__header">
        <h3 className="dg-block-lib__title">Bloques</h3>
        <input
          className="dg-block-lib__search"
          type="search"
          placeholder="Buscar…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar bloques"
        />
      </div>

      {/* Categorías */}
      <div className="dg-block-lib__cats">
        {BLOCK_CATEGORIES_ORDER.map(({ key, label }) => (
          <button
            key={key}
            className={`dg-block-lib__cat ${activeCategory === key ? 'dg-block-lib__cat--active' : ''}`}
            onClick={() => setActiveCategory(key)}
            style={activeCategory === key ? { borderLeftColor: BLOCK_COLORS[key] } : {}}
          >
            <span
              className="dg-block-lib__cat-dot"
              style={{ background: BLOCK_COLORS[key] }}
            />
            {label}
          </button>
        ))}
      </div>

      {/* Bloques de la categoría */}
      <div className="dg-block-lib__blocks">
        {defs.length === 0 && (
          <p className="dg-block-lib__empty">
            {search ? 'No se encontraron bloques.' : 'Sin bloques en esta categoría.'}
          </p>
        )}
        {defs.map((def) => (
          <BlockItem key={def.type} def={def} spec={spec} />
        ))}
      </div>

      {/* Ayuda contextual */}
      <div className="dg-block-lib__tip">
        <span>💡</span>
        <span>Haz clic en un bloque para agregarlo al script seleccionado.</span>
      </div>
    </div>
  )
}

function BlockItem({ def, spec }: { def: BlockDefinition; spec: GameSpecification }) {
  const color = BLOCK_COLORS[def.category]

  const handleClick = () => {
    const { selectedEntityId, selectedScriptId } = getState()

    // Si no hay entidad seleccionada, no se puede agregar
    const targetEntityId = selectedEntityId ?? spec.entities[0]?.id
    if (!targetEntityId) return

    if (def.isEvent) {
      // Los eventos crean un script nuevo
      const script = createScript(targetEntityId)
      selectScript(script.id)
      return
    }

    // Agregar bloque al script seleccionado o crear uno nuevo
    let scriptId = selectedScriptId
    if (!scriptId) {
      const existingScripts = spec.scripts.filter((s) => s.entityId === targetEntityId)
      if (existingScripts.length > 0) {
        scriptId = existingScripts[0].id
      } else {
        const newScript = createScript(targetEntityId)
        scriptId = newScript.id
      }
      selectScript(scriptId)
    }

    if (scriptId) {
      const block = createBlockDef(def.type)
      appendBlock(scriptId, block)
    }  }

  return (
    <button
      className="dg-block-item"
      style={{ '--block-color': color } as React.CSSProperties}
      onClick={handleClick}
      title={def.description}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('block-type', def.type)
      }}
    >
      <span className="dg-block-item__icon">{def.icon}</span>
      <div className="dg-block-item__text">
        <span className="dg-block-item__label">{def.label}</span>
        <span className="dg-block-item__desc">{def.description}</span>
      </div>
    </button>
  )
}
