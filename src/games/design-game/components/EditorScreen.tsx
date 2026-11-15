/**
 * DESIGN GAME - EDITOR PRINCIPAL
 * Cuatro áreas: Biblioteca de bloques | Área de programación | Simulador | Entidades
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

type ActivePanel = 'blocks' | 'editor' | 'simulator' | 'entities' | 'ai'

interface Props {
  project: GameSpecification
  selectedEntityId: string | null
  selectedScriptId: string | null
  onBack: () => void
}

export default function EditorScreen({ project, onBack }: Props) {
  const [, forceUpdate] = useReducer((n) => n + 1, 0)
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

  // Auto-guardado con debounce
  useEffect(() => {
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    saveTimeout.current = window.setTimeout(() => {
      saveCurrentProject()
    }, 2000)
    return () => {
      if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    }
  }, [spec])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(t)
  }, [toast])

  const handleSave = useCallback(() => {
    setIsSaving(true)
    saveCurrentProject()
    setTimeout(() => {
      setIsSaving(false)
      setToast('Project saved')
    }, 400)
  }, [])

  const handleReviewClick = useCallback(() => {
    const validation = validateProject(spec)
    if (!validation.valid) {
      setToast(`Not ready to send: ${validation.errors[0]?.message}`)
      return
    }
    setShowReview(true)
  }, [spec])

  const handleSubmitReview = useCallback(() => {
    const result = submitForReview()
    setShowReview(false)
    if (result) {
      setToast('Sent to your teacher')
    } else {
      setToast('It did not send. Check the list first.')
    }
  }, [])

  const latestReview = getLatestReview()
  const reviewStatus = spec.buildStatus

  const MOBILE_TABS: Array<{ key: ActivePanel; label: string }> = [
    { key: 'blocks',    label: 'Blocks' },
    { key: 'editor',    label: 'Scripts' },
    { key: 'simulator', label: 'Run' },
    { key: 'entities',  label: 'Sprites' },
  ]

  return (
    <div className="dg-editor">
      {/* Top bar */}
      <header className="dg-editor__topbar">
        <div className="dg-editor__topbar-left">
          <button className="dg-btn dg-btn--ghost dg-btn--sm" onClick={onBack}>
            Back
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
            <button
              className="dg-btn dg-btn--warn dg-btn--sm"
              onClick={() => setShowReview(true)}
            >
              See the feedback
            </button>
          )}

          <button
            className="dg-btn dg-btn--ghost dg-btn--sm"
            onClick={() => setShowAI(!showAI)}
            aria-pressed={showAI}
          >
            AI
          </button>

          <button
            className="dg-btn dg-btn--ghost dg-btn--sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>

          <button
            className="dg-btn dg-btn--primary dg-btn--sm"
            onClick={handleReviewClick}
            disabled={spec.buildStatus === 'in_review'}
          >
            {spec.buildStatus === 'in_review' ? 'In review' : 'Send to teacher'}
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Layout de cuatro paneles */}
      <div className="dg-editor__workspace">
        {/* Panel izquierdo: Biblioteca de bloques */}
        <aside
          className={`dg-editor__panel dg-editor__panel--left ${activePanel === 'blocks' ? 'dg-editor__panel--active' : ''}`}
          role="tabpanel"
          aria-label="Block library"
        >
          <BlockLibrary spec={spec} />
        </aside>

        {/* Panel central: Editor de scripts */}
        <main
          className={`dg-editor__panel dg-editor__panel--center ${activePanel === 'editor' ? 'dg-editor__panel--active' : ''}`}
          role="tabpanel"
          aria-label="Script editor"
        >
          <ScriptEditor spec={spec} />
        </main>

        {/* Panel derecho superior: Simulador */}
        <section
          className={`dg-editor__panel dg-editor__panel--right-top ${activePanel === 'simulator' ? 'dg-editor__panel--active' : ''}`}
          role="tabpanel"
          aria-label="Game simulator"
        >
          <Simulator spec={spec} />
        </section>

        {/* Panel derecho inferior: Entidades */}
        <section
          className={`dg-editor__panel dg-editor__panel--right-bottom ${activePanel === 'entities' ? 'dg-editor__panel--active' : ''}`}
          role="tabpanel"
          aria-label="Sprite library"
        >
          <EntityLibrary spec={spec} />
        </section>
      </div>

      {/* Panel de IA (drawer lateral) */}
      {showAI && (
        <div className="dg-editor__ai-drawer">
          <AIAssistant spec={spec} onClose={() => setShowAI(false)} />
        </div>
      )}

      {/* Modal de revisión */}
      {showReview && (
        <ReviewModal
          spec={spec}
          latestReview={latestReview}
          onConfirm={handleSubmitReview}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="dg-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In review',
  changes_requested: 'Changes asked for',
  approved: 'Approved',
}
