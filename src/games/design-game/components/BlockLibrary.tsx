/**
 * DESIGN GAME - BIBLIOTECA DE BLOQUES
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
import { getState, createScript, appendBlock, selectScript } from '../store'

/* SVG de icono de pista */
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IconInfo() {
  return <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" {...stroke} /><path d="M12 11v5M12 7.6v.2" {...stroke} /></svg>
}

/** Icono neutro por bloque */
function BlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity={0.7} />
    </svg>
  )
}

interface Props { spec: GameSpecification }

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
        <p className="dg-block-lib__title">Block library</p>
        <input
          className="dg-block-lib__search"
          type="search"
          placeholder="Find a block…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Find a block"
        />
      </div>

      <div className="dg-block-lib__cats">
        {BLOCK_CATEGORIES_ORDER.map(({ key, label }) => (
          <button
            key={key}
            className={`dg-block-lib__cat ${activeCategory === key ? 'dg-block-lib__cat--active' : ''}`}
            onClick={() => setActiveCategory(key)}
            style={activeCategory === key ? { borderLeftColor: BLOCK_COLORS[key] } : {}}
          >
            <span className="dg-block-lib__cat-dot" style={{ background: BLOCK_COLORS[key] }} />
            {label}
          </button>
        ))}
      </div>

      <div className="dg-block-lib__blocks">
        {defs.length === 0 && (
          <p className="dg-block-lib__empty">
            {search ? 'Nothing matches that.' : 'No blocks in this group yet.'}
          </p>
        )}
        {defs.map((def) => (
          <BlockItem key={def.type} def={def} spec={spec} />
        ))}
      </div>

      <div className="dg-block-lib__tip">
        <span className="dg-block-lib__tip-icon"><IconInfo /></span>
        <span>Click a block to add it to the script you picked.</span>
      </div>
    </div>
  )
}

function BlockItem({ def, spec }: { def: BlockDefinition; spec: GameSpecification }) {
  const color = BLOCK_COLORS[def.category]

  const handleClick = () => {
    const { selectedEntityId, selectedScriptId } = getState()
    const targetEntityId = selectedEntityId ?? spec.entities[0]?.id
    if (!targetEntityId) return

    if (def.isEvent) {
      const script = createScript(targetEntityId)
      selectScript(script.id)
      return
    }

    let scriptId = selectedScriptId
    if (!scriptId) {
      const existing = spec.scripts.filter((s) => s.entityId === targetEntityId)
      if (existing.length > 0) {
        scriptId = existing[0].id
      } else {
        const s = createScript(targetEntityId)
        scriptId = s.id
      }
      selectScript(scriptId)
    }

    if (scriptId) {
      const block = createBlockDef(def.type)
      appendBlock(scriptId, block)
    }
  }

  return (
    <button
      className="dg-block-item"
      style={{ '--block-color': color } as React.CSSProperties}
      onClick={handleClick}
      title={def.description}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('block-type', def.type) }}
    >
      <span className="dg-block-item__icon">
              <BlockIcon />
            </span>
      <div className="dg-block-item__text">
        <span className="dg-block-item__label">{def.label}</span>
        <span className="dg-block-item__desc">{def.description}</span>
      </div>
    </button>
  )
}
