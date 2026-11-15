/**
 * DESIGN GAME - PANTALLA DE BIENVENIDA
 */

import { useState } from 'react'
import type { GameGenre, GameSpecification } from '../types'

const GENRE_OPTIONS: { genre: GameGenre; label: string; emoji: string; desc: string }[] = [
  { genre: 'arcade',    emoji: '🕹️', label: 'Arcade',      desc: 'Recolecta objetos, esquiva enemigos' },
  { genre: 'platformer',emoji: '🏃', label: 'Plataformas', desc: 'Salta, corre, llega a la meta' },
  { genre: 'maze',      emoji: '🌀', label: 'Laberinto',   desc: 'Explora, encuentra la salida' },
]

const EXAMPLES = [
  'Un robot que recolecta estrellas y evita enemigos que se mueven',
  'Un héroe que salta entre plataformas flotantes para llegar al portal',
  'Un explorador que busca la llave para salir del laberinto antes de que lleguen los guardias',
  'Una nave espacial que recolecta cristales y esquiva asteroides',
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
            <span className="dg-welcome__badge-icon">🎮</span>
            <span>Design Game</span>
          </div>
          <h1 className="dg-welcome__title">
            Crea tu propio<br />
            <span className="dg-welcome__title-accent">videojuego 2D</span>
          </h1>
          <p className="dg-welcome__subtitle">
            Describe tu idea, selecciona el género y la IA generará una propuesta.
            Tú programas, personalizas y ejecutas tu juego.
          </p>
        </header>

        {/* Formulario */}
        <form className="dg-welcome__form" onSubmit={handleSubmit}>
          {/* Nombre del proyecto */}
          <div className="dg-field">
            <label className="dg-field__label" htmlFor="dg-project-name">
              Nombre de tu videojuego
            </label>
            <input
              id="dg-project-name"
              className="dg-field__input"
              type="text"
              placeholder="Ej: Aventura en el espacio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          {/* Género */}
          <div className="dg-field">
            <span className="dg-field__label">Tipo de videojuego</span>
            <div className="dg-genre-grid">
              {GENRE_OPTIONS.map((opt) => (
                <button
                  key={opt.genre}
                  type="button"
                  className={`dg-genre-btn ${genre === opt.genre ? 'dg-genre-btn--active' : ''}`}
                  onClick={() => setGenre(opt.genre)}
                >
                  <span className="dg-genre-btn__emoji">{opt.emoji}</span>
                  <span className="dg-genre-btn__label">{opt.label}</span>
                  <span className="dg-genre-btn__desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="dg-field">
            <label className="dg-field__label" htmlFor="dg-description">
              Describe tu videojuego
              <span className="dg-field__label-note"> (mínimo 10 caracteres)</span>
            </label>
            <textarea
              id="dg-description"
              className="dg-field__textarea"
              placeholder="Ej: Quiero crear un videojuego donde un personaje recolecte estrellas, evite enemigos y llegue a una meta antes de que termine el tiempo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
            <div className="dg-field__hint">
              <span className="dg-field__char-count">{description.length} caracteres</span>
            </div>
          </div>

          {/* Ejemplos */}
          <div className="dg-examples">
            <p className="dg-examples__title">Ejemplos para inspirarte:</p>
            <div className="dg-examples__list">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  className="dg-examples__item"
                  onClick={() => setDescription(ex)}
                >
                  <span className="dg-examples__icon">💡</span>
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
                Generando propuesta…
              </>
            ) : (
              <>
                <span>✨</span>
                Generar videojuego
              </>
            )}
          </button>
        </form>

        {/* Proyectos recientes */}
        {recentProjects.length > 0 && (
          <section className="dg-recent">
            <h2 className="dg-recent__title">Proyectos recientes</h2>
            <div className="dg-recent__list">
              {recentProjects.map((project) => (
                <div key={project.id} className="dg-recent__item">
                  <button
                    className="dg-recent__btn"
                    onClick={() => onOpenProject(project)}
                  >
                    <span className="dg-recent__icon">
                      {project.genre === 'arcade' ? '🕹️' : project.genre === 'platformer' ? '🏃' : '🌀'}
                    </span>
                    <div className="dg-recent__info">
                      <span className="dg-recent__name">{project.name}</span>
                      <span className="dg-recent__meta">
                        {GENRE_OPTIONS.find((g) => g.genre === project.genre)?.label}
                        {' · '}
                        {project.entities.length} entidades
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
                    aria-label={`Eliminar ${project.name}`}
                    title="Eliminar proyecto"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info sobre el módulo */}
        <div className="dg-info-row">
          <div className="dg-info-card">
            <span className="dg-info-card__icon">🤖</span>
            <div>
              <strong>IA como asistente</strong>
              <p>La IA sugiere cambios, tú decides qué aceptar. El aprendizaje es tuyo.</p>
            </div>
          </div>
          <div className="dg-info-card">
            <span className="dg-info-card__icon">🧩</span>
            <div>
              <strong>Programación visual</strong>
              <p>Arrastra bloques para programar. Sin código difícil.</p>
            </div>
          </div>
          <div className="dg-info-card">
            <span className="dg-info-card__icon">▶</span>
            <div>
              <strong>Prueba al instante</strong>
              <p>El simulador ejecuta tus instrucciones en tiempo real.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de borrado */}
      {showDeleteConfirm && (
        <div className="dg-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="dg-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dg-modal__title">¿Eliminar proyecto?</h3>
            <p className="dg-modal__text">Esta acción no se puede deshacer.</p>
            <div className="dg-modal__actions">
              <button
                className="dg-btn dg-btn--ghost"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className="dg-btn dg-btn--danger"
                onClick={() => {
                  onDeleteProject(showDeleteConfirm)
                  setShowDeleteConfirm(null)
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_review: 'En revisión',
  changes_requested: 'Con observaciones',
  approved: 'Aprobado',
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}
