/**
 * DESIGN GAME - PANTALLA DE BIENVENIDA
 * Diseño alineado con el look & feel de Órbita Arcade:
 * fondo oscuro, acento dorado, tipografía Nunito, sin emojis.
 */

import { useState } from 'react'
import type { GameGenre, GameSpecification } from '../types'

/* -------------------------------------------------------------------------
   Iconos SVG inline (misma convención que Art.tsx: 24×24, trazo)
   ------------------------------------------------------------------------- */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconGamepad() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '100%', height: '100%' }}>
      <rect x="2" y="6" width="20" height="12" rx="4" {...stroke} />
      <path d="M7 12h4M9 10v4M15 11.5h.01M17 13h.01" {...stroke} />
    </svg>
  )
}

function IconRun() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '100%', height: '100%' }}>
      <circle cx="13" cy="4.5" r="1.5" fill="currentColor" />
      <path d="M6.5 17l3.5-5 2 2.5L14 10l3.5 5" {...stroke} />
      <path d="M5 20l3-3M19 20l-3-3" {...stroke} />
    </svg>
  )
}

function IconMaze() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '100%', height: '100%' }}>
      <path d="M4 4h4v4H4zM10 4h2v2h-2zM14 4h6v3h-6zM4 10v4h2v-2h4v2h2v-4" {...stroke} strokeWidth={1.6} />
      <path d="M14 10h2v2h4v2h-4v2h2v2h-6v-6h2v-2zM4 16v4h8v-2H6v-2" {...stroke} strokeWidth={1.6} />
    </svg>
  )
}

function IconBulb() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '100%', height: '100%' }}>
      <path d="M12 2a7 7 0 0 1 4 12.7V17H8v-2.3A7 7 0 0 1 12 2Z" {...stroke} />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" {...stroke} />
    </svg>
  )
}

function IconBlocks() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '100%', height: '100%' }}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" {...stroke} />
      <rect x="13" y="3" width="8" height="8" rx="1.5" {...stroke} />
      <rect x="3" y="13" width="8" height="8" rx="1.5" {...stroke} />
      <path d="M13 17h8M17 13v8" {...stroke} />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '100%', height: '100%' }}>
      <path d="M6 4.5v15l13-7.5z" fill="currentColor" />
    </svg>
  )
}

function IconBot() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '100%', height: '100%' }}>
      <rect x="4" y="8" width="16" height="11" rx="3" {...stroke} />
      <circle cx="9" cy="13" r="1.5" {...stroke} />
      <circle cx="15" cy="13" r="1.5" {...stroke} />
      <path d="M12 3v5M9.5 19v2M14.5 19v2" {...stroke} />
    </svg>
  )
}

function IconFile() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '100%', height: '100%' }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" {...stroke} />
      <path d="M14 2v6h6M8 13h8M8 17h5" {...stroke} />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...{ width: '40', height: '100%' }}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" {...stroke} />
    </svg>
  )
}

/* -------------------------------------------------------------------------
   Tipos e iconos de género
   ------------------------------------------------------------------------- */

const GENRE_OPTIONS: {
  genre: GameGenre
  label: string
  desc: string
  Icon: () => JSX.Element
}[] = [
  { genre: 'arcade',    label: 'Arcade',      desc: 'Recolecta objetos, esquiva enemigos', Icon: IconGamepad },
  { genre: 'platformer',label: 'Plataformas', desc: 'Salta, corre, llega a la meta',       Icon: IconRun },
  { genre: 'maze',      label: 'Laberinto',   desc: 'Explora, encuentra la salida',         Icon: IconMaze },
]

const EXAMPLES = [
  'Un robot que recolecta cristales y evita enemigos que se mueven de un lado a otro',
  'Un héroe que salta entre plataformas flotantes para llegar al portal de salida',
  'Un explorador que busca la llave para salir del laberinto antes de que lleguen los guardias',
  'Una nave que recolecta fragmentos de roca y esquiva asteroides en movimiento',
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
            <span className="dg-welcome__badge-glyph" aria-hidden="true">
              <IconGamepad />
            </span>
            Design Game
          </div>
          <h1 className="dg-welcome__title">
            Crea tu propio{' '}
            <span className="dg-welcome__title-accent">videojuego 2D</span>
          </h1>
          <p className="dg-welcome__subtitle">
            Describe tu idea, elige el género y la IA generará una propuesta.
            Tú programas, ajustas y ejecutas tu videojuego.
          </p>
        </header>

        {/* Formulario principal */}
        <form className="dg-welcome__form" onSubmit={handleSubmit}>

          {/* Nombre */}
          <div className="dg-field">
            <label className="dg-field__label" htmlFor="dg-project-name">
              Nombre del videojuego
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
              {GENRE_OPTIONS.map(({ genre: g, label, desc, Icon }) => (
                <button
                  key={g}
                  type="button"
                  className={`dg-genre-btn ${genre === g ? 'dg-genre-btn--active' : ''}`}
                  onClick={() => setGenre(g)}
                >
                  <span className="dg-genre-btn__icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="dg-genre-btn__label">{label}</span>
                  <span className="dg-genre-btn__desc">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="dg-field">
            <label className="dg-field__label" htmlFor="dg-description">
              Describe tu videojuego
              <span className="dg-field__label-note">(mínimo 10 caracteres)</span>
            </label>
            <textarea
              id="dg-description"
              className="dg-field__textarea"
              placeholder="Ej: Quiero crear un videojuego donde un personaje recolecte estrellas, evite enemigos y llegue a una meta antes de que termine el tiempo…"
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
            <p className="dg-examples__title">Ejemplos para comenzar</p>
            <div className="dg-examples__list">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  className="dg-examples__item"
                  onClick={() => setDescription(ex)}
                >
                  {ex}
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
              'Generar videojuego'
            )}
          </button>
        </form>

        {/* Proyectos recientes */}
        {recentProjects.length > 0 && (
          <section className="dg-recent">
            <h2 className="dg-recent__title">Proyectos recientes</h2>
            <div className="dg-recent__list">
              {recentProjects.map((project) => {
                const GenreIcon = GENRE_OPTIONS.find((g) => g.genre === project.genre)?.Icon ?? IconFile
                return (
                  <div key={project.id} className="dg-recent__item">
                    <button
                      className="dg-recent__btn"
                      onClick={() => onOpenProject(project)}
                    >
                      <span className="dg-recent__icon" aria-hidden="true">
                        <GenreIcon />
                      </span>
                      <div className="dg-recent__info">
                        <span className="dg-recent__name">{project.name}</span>
                        <span className="dg-recent__meta">
                          {GENRE_OPTIONS.find((g) => g.genre === project.genre)?.label}
                          {' · '}
                          {project.entities.length} entidades
                          {project.buildStatus !== 'draft' && (
                            <span className={`dg-status dg-status--${project.buildStatus}`} style={{ marginLeft: 6 }}>
                              {STATUS_LABELS[project.buildStatus]}
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="dg-recent__date">{formatDate(project.updatedAt)}</span>
                    </button>
                    <button
                      className="dg-recent__delete"
                      onClick={() => setShowDeleteConfirm(project.id)}
                      aria-label={`Eliminar ${project.name}`}
                      title="Eliminar proyecto"
                    >
                      <IconTrash />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Tarjetas de características */}
        <div className="dg-info-row">
          {INFO_CARDS.map((card) => (
            <div key={card.title} className="dg-info-card">
              <span className="dg-info-card__icon" aria-hidden="true">
                <card.Icon />
              </span>
              <div className="dg-info-card__body">
                <strong>{card.title}</strong>
                <p>{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmación de borrado */}
      {showDeleteConfirm && (
        <div className="dg-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="dg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dg-modal__header">
              <h2 className="dg-modal__title">Eliminar proyecto</h2>
            </div>
            <div className="dg-modal__body">
              <p className="dg-modal__text">Esta acción no se puede deshacer.</p>
            </div>
            <div className="dg-modal__footer">
              <button className="dg-btn dg-btn--quiet" onClick={() => setShowDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                className="dg-btn dg-btn--danger"
                onClick={() => { onDeleteProject(showDeleteConfirm); setShowDeleteConfirm(null) }}
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

/* -------------------------------------------------------------------------
   Datos estáticos
   ------------------------------------------------------------------------- */

const INFO_CARDS = [
  { Icon: IconBot,    title: 'IA como asistente',    desc: 'La IA sugiere cambios, tú decides qué aceptar. El aprendizaje es tuyo.' },
  { Icon: IconBlocks, title: 'Programación visual',  desc: 'Conecta bloques para programar. Sin código difícil.' },
  { Icon: IconPlay,   title: 'Prueba al instante',   desc: 'El simulador ejecuta tus instrucciones en tiempo real.' },
]

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_review: 'En revisión',
  changes_requested: 'Con observaciones',
  approved: 'Aprobado',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch { return '' }
}
