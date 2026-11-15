/**
 * DESIGN GAME - PANTALLA DE BIENVENIDA
 */

import { useState } from 'react'
import type { GameGenre, GameSpecification } from '../types'
import { IconClose } from './Icons'

const GENRE_OPTIONS: { genre: GameGenre; label: string; desc: string }[] = [
  { genre: 'arcade',     label: 'Arcade',   desc: 'Collect things, dodge enemies' },
  { genre: 'platformer', label: 'Platform', desc: 'Run, jump, reach the flag' },
  { genre: 'maze',       label: 'Maze',     desc: 'Explore, find the way out' },
]

const EXAMPLES = [
  'A robot that collects stars and keeps away from enemies that move',
  'A hero who jumps across floating platforms to reach the portal',
  'An explorer hunting for the key out of the maze before the guards arrive',
  'A spaceship that gathers crystals and dodges asteroids',
]

interface Props {
  recentProjects: GameSpecification[]
  isGenerating: boolean
  onDescribe: (description: string, genre: GameGenre, name: string) => void
  onOpenProject: (project: GameSpecification) => void
  onDeleteProject: (id: string) => void
}

export default function WelcomeScreen({
  recentProjects,
  isGenerating,
  onDescribe,
  onOpenProject,
  onDeleteProject,
}: Props) {
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState<GameGenre>('arcade')
  const [name, setName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const canGenerate = description.trim().length >= 10 && name.trim().length >= 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canGenerate || isGenerating) return
    onDescribe(description.trim(), genre, name.trim())
  }

  return (
    <div className="dg-welcome">
      <div className="dg-welcome__bg" aria-hidden="true">
        <div className="dg-welcome__bg-grid" />
        <div className="dg-welcome__bg-glow dg-welcome__bg-glow--a" />
        <div className="dg-welcome__bg-glow dg-welcome__bg-glow--b" />
      </div>

      <div className="dg-welcome__content">
        {/* Cabecera */}
        <header className="dg-welcome__header">
          <div className="dg-welcome__badge">
            <span>Design Game</span>
          </div>
          <h1 className="dg-welcome__title">
            Build your own<br />
            <span className="dg-welcome__title-accent">2D game</span>
          </h1>
          <p className="dg-welcome__subtitle">
            Say what you have in mind, pick a kind of game, and the helper drafts a start.
            After that it is yours: you program it, change it and run it.
          </p>
        </header>

        {/* Formulario */}
        <form className="dg-welcome__form" onSubmit={handleSubmit}>
          {/* Nombre del proyecto */}
          <div className="dg-field">
            <label className="dg-field__label" htmlFor="dg-project-name">
              Name your game
            </label>
            <input
              id="dg-project-name"
              className="dg-field__input"
              type="text"
              placeholder="For example: Rescue on Mars"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          {/* Género */}
          <div className="dg-field">
            <span className="dg-field__label">Kind of game</span>
            <div className="dg-genre-grid">
              {GENRE_OPTIONS.map((opt) => (
                <button
                  key={opt.genre}
                  type="button"
                  className={`dg-genre-btn ${genre === opt.genre ? 'dg-genre-btn--active' : ''}`}
                  onClick={() => setGenre(opt.genre)}
                >
                  <span className="dg-genre-btn__label">{opt.label}</span>
                  <span className="dg-genre-btn__desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="dg-field">
            <label className="dg-field__label" htmlFor="dg-description">
              Describe your game
              <span className="dg-field__label-note"> (at least 10 characters)</span>
            </label>
            <textarea
              id="dg-description"
              className="dg-field__textarea"
              placeholder="For example: a robot picks up stars, keeps away from the guards, and reaches the flag before time runs out..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
            <div className="dg-field__hint">
              <span className="dg-field__char-count">{description.length} characters</span>
            </div>
          </div>

          {/* Ejemplos */}
          <div className="dg-examples">
            <p className="dg-examples__title">Ideas you can borrow:</p>
            <div className="dg-examples__list">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  className="dg-examples__item"
                  onClick={() => setDescription(ex)}
                >
                  <span>{ex}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón principal */}
          <button
            type="submit"
            className="dg-btn dg-btn--primary dg-btn--xl dg-btn--block"
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="dg-spinner" />
                Drafting your game…
              </>
            ) : (
              'Build my game'
            )}
          </button>
        </form>

        {/* Proyectos recientes */}
        {recentProjects.length > 0 && (
          <section className="dg-recent">
            <h2 className="dg-recent__title">Projects you were working on</h2>
            <div className="dg-recent__list">
              {recentProjects.map((project) => (
                <div key={project.id} className="dg-recent__item">
                  <button
                    className="dg-recent__btn"
                    onClick={() => onOpenProject(project)}
                  >
                    <div className="dg-recent__info">
                      <span className="dg-recent__name">{project.name}</span>
                      <span className="dg-recent__meta">
                        {GENRE_OPTIONS.find((g) => g.genre === project.genre)?.label}
                        {' · '}
                        {project.entities.length} sprites
                        {project.buildStatus !== 'draft' && (
                          <span className={`dg-status dg-status--${project.buildStatus}`}>
                            {' · '}{STATUS_LABELS[project.buildStatus]}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="dg-recent__date">
                      {formatDate(project.updatedAt)}
                    </span>
                  </button>
                  <button
                    className="dg-recent__delete"
                    onClick={() => setShowDeleteConfirm(project.id)}
                    aria-label={`Delete ${project.name}`}
                    title="Delete project"
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info sobre el módulo */}
        <div className="dg-info-row">
          <div className="dg-info-card">
            <div>
              <strong>The helper only suggests</strong>
              <p>It proposes changes and you decide what to keep. The thinking stays yours.</p>
            </div>
          </div>
          <div className="dg-info-card">
            <div>
              <strong>Blocks, not typing</strong>
              <p>Drag blocks together. Nothing to misspell.</p>
            </div>
          </div>
          <div className="dg-info-card">
            <div>
              <strong>Run it straight away</strong>
              <p>The simulator plays exactly the blocks you built.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de borrado */}
      {showDeleteConfirm && (
        <div className="dg-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="dg-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dg-modal__title">Delete this project?</h3>
            <p className="dg-modal__text">This cannot be undone.</p>
            <div className="dg-modal__actions">
              <button
                className="dg-btn dg-btn--ghost"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="dg-btn dg-btn--danger"
                onClick={() => {
                  onDeleteProject(showDeleteConfirm)
                  setShowDeleteConfirm(null)
                }}
              >
                Delete
              </button>
            </div>
          </div>
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

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}
