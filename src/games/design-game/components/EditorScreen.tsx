/**
 * DESIGN GAME - EDITOR PRINCIPAL
 */

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { GameSpecification } from '../types'
import {
  saveCurrentProject,
  validateProject,
  submitForReview,
  getLatestReview,
  getState,
  subscribe,
} from '../store'
import BlockLibrary from './BlockLibrary'
import ScriptEditor from './ScriptEditor'
import Simulator from './Simulator'
import EntityLibrary from './EntityLibrary'
import AIAssistant from './AIAssistant'
import ReviewModal from './ReviewModal'

/* -------------------------------------------------------------------------
   Iconos SVG
   ------------------------------------------------------------------------- */
const stroke = {
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconBack() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" {...stroke} /></svg>
}
function IconSave() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" {...stroke} /><path d="M17 21v-8H7v8M7 3v5h8" {...stroke} /></svg>
}
function IconSend() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" {...stroke} /></svg>
}
function IconBot() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="8" width="16" height="11" rx="3" {...stroke} /><circle cx="9" cy="13" r="1.5" {...stroke} /><circle cx="15" cy="13" r="1.5" {...stroke} /><path d="M12 3v5" {...stroke} /></svg>
}
function IconBlocks() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1.5" {...stroke} /><rect x="13" y="3" width="8" height="8" rx="1.5" {...stroke} /><rect x="3" y="13" width="8" height="8" rx="1.5" {...stroke} /><path d="M13 17h8M17 13v8" {...stroke} /></svg>
}
function IconCode() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 7l-4 10" {...stroke} /></svg>
}
function IconPlay() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.5v15l13-7.5z" fill="currentColor" /></svg>
}
function IconEntities() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3.5" {...stroke} /><circle cx="16" cy="16" r="3.5" {...stroke} /><path d="M4 20l16-16" {...stroke} strokeWidth={1.4} /></svg>
}
function IconAlert() {
  return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.5h3.4L21 20H3L10.3 3.5z" {...stroke} /><path d="M12 10v4M12 17.5v.5" {...stroke} /></svg>
}

type ActivePanel = 'blocks' | 'editor' | 'simulator' | 'entities' | 'ai'

interface Props {
  project: GameSpecification
  selectedEntityId: string | null
  selectedScriptId: string | null
  onBack: () => void
}

export default function EditorScreen({ project, onBack }: Props) {
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0)
  const [activePanel, setActivePanel] = useState<ActivePanel>('editor')
  const [showAI, setShowAI] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeout = useRef<number | null>(null)

  useEffect(() => {
    const unsub = subscribe(forceUpdate)
    return unsub
  }, [])

  const { project: current } = getState()
  const spec = current ?? project

  useEffect(() => {
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    saveTimeout.current = window.setTimeout(() => { saveCurrentProject() }, 2000)
    return () => { if (saveTimeout.current) window.clearTimeout(saveTimeout.current) }
  }, [spec])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(t)
  }, [toast])

  const handleSave = useCallback(() => {
    setIsSaving(true)
    saveCurrentProject()
    setTimeout(() => { setIsSaving(false); setToast('Proyecto guardado') }, 400)
  }, [])

  const handleReviewClick = useCallback(() => {
    const validation = validateProject(spec)
    if (!validation.valid) { setToast(validation.errors[0]?.message ?? 'Corrige los errores primero'); return }
    setShowReview(true)
  }, [spec])

  const handleSubmitReview = useCallback(() => {
    const result = submitForReview()
    setShowReview(false)
    setToast(result ? 'Enviado a revisión correctamente' : 'No se pudo enviar. Verifica los requisitos.')
  }, [])

  const latestReview = getLatestReview()
  const reviewStatus = spec.buildStatus

  const MOBILE_TABS: Array<{ key: ActivePanel; label: string; Icon: () => JSX.Element }> = [
    { key: 'blocks',    label: 'Bloques',  Icon: IconBlocks },
    { key: 'editor',    label: 'Editor',   Icon: IconCode },
    { key: 'simulator', label: 'Simular',  Icon: IconPlay },
    { key: 'entities',  label: 'Objetos',  Icon: IconEntities },
  ]

  return (
    <div className="dg-editor">
      {/* Top bar */}
      <header className="dg-editor__topbar">
        <div className="dg-editor__topbar-left">
          <button className="dg-btn dg-btn--quiet dg-btn--sm" onClick={onBack}>
            <IconBack /> Inicio
          </button>
          <div className="dg-editor__title">
            <span className="dg-editor__title-name">{spec.name}</span>
            <span className={`dg-status dg-status--${reviewStatus}`}>
              {STATUS_LABELS[reviewStatus]}
            </span>
          </div>
        </div>

        <div className="dg-editor__topbar-actions">
          {latestReview?.status === 'changes_requested' && (
            <button className="dg-btn dg-btn--warn dg-btn--sm" onClick={() => setShowReview(true)}>
              <IconAlert /> Ver observaciones
            </button>
          )}
          <button
            className="dg-btn dg-btn--quiet dg-btn--sm"
            onClick={() => setShowAI(!showAI)}
            aria-pressed={showAI}
          >
            <IconBot /> IA
          </button>
          <button
            className="dg-btn dg-btn--quiet dg-btn--sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <IconSave /> {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            className="dg-btn dg-btn--primary dg-btn--sm"
            onClick={handleReviewClick}
            disabled={spec.buildStatus === 'in_review'}
          >
            <IconSend />
            {spec.buildStatus === 'in_review' ? 'En revisión' : 'Enviar a revisión'}
          </button>
        </div>
      </header>

      {/* Pestañas móviles */}
      <div className="dg-editor__mobile-tabs" role="tablist">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activePanel === tab.key}
            className={`dg-editor__mobile-tab ${activePanel === tab.key ? 'dg-editor__mobile-tab--active' : ''}`}
            onClick={() => setActivePanel(tab.key)}
          >
            <tab.Icon /> {tab.label}
          </button>
        ))}
      </div>

      {/* Layout de cuatro paneles */}
      <div className="dg-editor__workspace">
        <aside
          className={`dg-editor__panel dg-editor__panel--left ${activePanel === 'blocks' ? 'dg-editor__panel--active' : ''}`}
          role="tabpanel" aria-label="Biblioteca de bloques"
        >
          <BlockLibrary spec={spec} />
        </aside>

        <main
          className={`dg-editor__panel dg-editor__panel--center ${activePanel === 'editor' ? 'dg-editor__panel--active' : ''}`}
          role="tabpanel" aria-label="Editor de programación"
        >
          <ScriptEditor spec={spec} />
        </main>

        <section
          className={`dg-editor__panel dg-editor__panel--right-top ${activePanel === 'simulator' ? 'dg-editor__panel--active' : ''}`}
          role="tabpanel" aria-label="Simulador"
        >
          <Simulator spec={spec} />
        </section>

        <section
          className={`dg-editor__panel dg-editor__panel--right-bottom ${activePanel === 'entities' ? 'dg-editor__panel--active' : ''}`}
          role="tabpanel" aria-label="Entidades"
        >
          <EntityLibrary spec={spec} />
        </section>
      </div>

      {showAI && (
        <div className="dg-editor__ai-drawer">
          <AIAssistant spec={spec} onClose={() => setShowAI(false)} />
        </div>
      )}

      {showReview && (
        <ReviewModal
          spec={spec}
          latestReview={latestReview}
          onConfirm={handleSubmitReview}
          onClose={() => setShowReview(false)}
        />
      )}

      {toast && <div className="dg-toast" role="status">{toast}</div>}
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_review: 'En revisión',
  changes_requested: 'Con observaciones',
  approved: 'Aprobado',
}
