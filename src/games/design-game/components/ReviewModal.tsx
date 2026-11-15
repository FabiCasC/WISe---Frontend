/**
 * DESIGN GAME - MODAL DE ENVÍO A REVISIÓN
 */

import type { GameSpecification, ReviewSubmission } from '../types'
import { validateProject } from '../store'
import { SPRITE_DESCRIPTORS } from '../entities'

interface Props {
  spec: GameSpecification
  latestReview: ReviewSubmission | null
  onConfirm: () => void
  onClose: () => void
}

export default function ReviewModal({ spec, latestReview, onConfirm, onClose }: Props) {
  const validation = validateProject(spec)
  const hasPendingReview = latestReview?.status === 'in_review'
  const hasObservations = latestReview?.status === 'changes_requested'

  return (
    <div className="dg-overlay" onClick={onClose}>
      <div className="dg-modal dg-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="dg-modal__header">
          <h2 className="dg-modal__title">📤 Enviar a revisión docente</h2>
          <button className="dg-btn dg-btn--ghost dg-btn--sm" onClick={onClose}>✕</button>
        </div>

        <div className="dg-modal__body">
          {/* Resumen del proyecto */}
          <div className="dg-review__summary">
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Videojuego</span>
              <span className="dg-review__summary-value">{spec.name}</span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Género</span>
              <span className="dg-review__summary-value">{GENRE_LABELS[spec.genre]}</span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Entidades</span>
              <span className="dg-review__summary-value">
                {spec.entities.map((e) => SPRITE_DESCRIPTORS[e.sprite]?.emoji ?? '?').join(' ')}
                {' '}{spec.entities.length}
              </span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Scripts</span>
              <span className="dg-review__summary-value">{spec.scripts.length}</span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Versión</span>
              <span className="dg-review__summary-value">
                v{spec.reviewHistory.length + 1}
              </span>
            </div>
          </div>

          {/* Observaciones anteriores */}
          {hasObservations && latestReview?.feedback && (
            <div className="dg-review__feedback">
              <h3 className="dg-review__feedback-title">
                💬 Observaciones del docente (v{latestReview.version})
              </h3>
              <p className="dg-review__feedback-text">{latestReview.feedback.comments}</p>
              {latestReview.feedback.issues.length > 0 && (
                <ul className="dg-review__issues">
                  {latestReview.feedback.issues.map((issue, i) => (
                    <li key={i} className={`dg-review__issue dg-review__issue--${issue.type}`}>
                      {issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : '💡'}
                      {' '}{issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Validación */}
          <div className="dg-review__validation">
            <h3 className="dg-review__validation-title">Verificación previa al envío</h3>

            {validation.errors.length > 0 ? (
              <ul className="dg-review__checklist">
                {validation.errors.map((error, i) => (
                  <li key={i} className="dg-review__check dg-review__check--fail">
                    <span>❌</span>
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="dg-review__checklist">
                <li className="dg-review__check dg-review__check--ok">
                  <span>✅</span>
                  <span>El proyecto tiene nombre</span>
                </li>
                <li className="dg-review__check dg-review__check--ok">
                  <span>✅</span>
                  <span>Existe al menos un escenario</span>
                </li>
                <li className={`dg-review__check ${spec.entities.length > 0 ? 'dg-review__check--ok' : 'dg-review__check--fail'}`}>
                  <span>{spec.entities.length > 0 ? '✅' : '❌'}</span>
                  <span>Hay entidades en el juego ({spec.entities.length})</span>
                </li>
                <li className={`dg-review__check ${spec.scripts.length > 0 ? 'dg-review__check--ok' : 'dg-review__check--fail'}`}>
                  <span>{spec.scripts.length > 0 ? '✅' : '❌'}</span>
                  <span>Hay instrucciones de programación ({spec.scripts.length})</span>
                </li>
              </ul>
            )}

            {validation.warnings.length > 0 && (
              <ul className="dg-review__checklist dg-review__checklist--warn">
                {validation.warnings.map((w, i) => (
                  <li key={i} className="dg-review__check dg-review__check--warn">
                    <span>⚠️</span>
                    <span>{w.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Estado de revisión en curso */}
          {hasPendingReview && (
            <div className="dg-review__notice dg-review__notice--pending">
              <span>⏳</span>
              <div>
                <strong>Ya tienes una versión en revisión</strong>
                <p>Enviada el {formatDate(latestReview!.submittedAt)}. No puedes enviar otra versión mientras esta está siendo revisada.</p>
              </div>
            </div>
          )}

          {/* Info sobre snapshot */}
          {!hasPendingReview && validation.valid && (
            <div className="dg-review__notice">
              <span>ℹ️</span>
              <div>
                <strong>Al confirmar</strong>
                <p>Se guardará una copia exacta e inmutable de tu proyecto. Puedes seguir editando después del envío: los cambios posteriores no afectarán la versión que el docente está revisando.</p>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="dg-modal__footer">
          <button className="dg-btn dg-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="dg-btn dg-btn--primary"
            onClick={onConfirm}
            disabled={!validation.valid || hasPendingReview}
          >
            {hasPendingReview
              ? 'En revisión'
              : !validation.valid
                ? 'Corrige los errores primero'
                : '✓ Confirmar envío'}
          </button>
        </div>

        {/* Historial */}
        {spec.reviewHistory.length > 0 && (
          <div className="dg-review__history">
            <h3 className="dg-review__history-title">Historial de envíos</h3>
            <div className="dg-review__history-list">
              {[...spec.reviewHistory].reverse().map((r) => (
                <div key={r.id} className="dg-review__history-item">
                  <span className={`dg-status dg-status--${r.status}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                  <span>v{r.version}</span>
                  <span className="dg-review__history-date">{formatDate(r.submittedAt)}</span>
                  {r.feedback?.comments && (
                    <span className="dg-review__history-comment">
                      "{r.feedback.comments.slice(0, 60)}{r.feedback.comments.length > 60 ? '…' : ''}"
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const GENRE_LABELS: Record<string, string> = {
  arcade: 'Arcade',
  platformer: 'Plataformas',
  maze: 'Laberinto',
}

const STATUS_LABELS: Record<string, string> = {
  in_review: '⏳ En revisión',
  changes_requested: '💬 Observaciones',
  approved: '✅ Aprobado',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
