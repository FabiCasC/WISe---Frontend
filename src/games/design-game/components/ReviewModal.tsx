/**
 * DESIGN GAME - MODAL DE ENVÍO A REVISIÓN
 */

import type { GameSpecification, ReviewSubmission } from '../types'
import { validateProject } from '../store'
import SpritePreview from './SpritePreview'
import { IconCheck, IconClose, IconInfo, IconWarning } from './Icons'

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
          <h2 className="dg-modal__title">Send this to your teacher</h2>
          <button className="dg-btn dg-btn--ghost dg-btn--sm" onClick={onClose}>
            <IconClose label="Close" />
          </button>
        </div>

        <div className="dg-modal__body">
          {/* Resumen del proyecto */}
          <div className="dg-review__summary">
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Game</span>
              <span className="dg-review__summary-value">{spec.name}</span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Kind</span>
              <span className="dg-review__summary-value">{GENRE_LABELS[spec.genre]}</span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Sprites</span>
              <span className="dg-review__summary-value">
                {spec.entities.slice(0, 8).map((e) => (
                  <SpritePreview key={e.id} sprite={e.sprite} size={16} />
                ))}
                {' '}{spec.entities.length}
              </span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Scripts</span>
              <span className="dg-review__summary-value">{spec.scripts.length}</span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Version</span>
              <span className="dg-review__summary-value">
                v{spec.reviewHistory.length + 1}
              </span>
            </div>
          </div>

          {/* Observaciones anteriores */}
          {hasObservations && latestReview?.feedback && (
            <div className="dg-review__feedback">
              <h3 className="dg-review__feedback-title">
                What your teacher said (v{latestReview.version})
              </h3>
              <p className="dg-review__feedback-text">{latestReview.feedback.comments}</p>
              {latestReview.feedback.issues.length > 0 && (
                <ul className="dg-review__issues">
                  {latestReview.feedback.issues.map((issue, i) => (
                    <li key={i} className={`dg-review__issue dg-review__issue--${issue.type}`}>
                      {issue.type === 'error'
                        ? <IconClose label="Must fix" />
                        : issue.type === 'warning'
                          ? <IconWarning label="Warning" />
                          : <IconInfo label="Note" />}
                      {' '}{issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Validación */}
          <div className="dg-review__validation">
            <h3 className="dg-review__validation-title">Checks before sending</h3>

            {validation.errors.length > 0 ? (
              <ul className="dg-review__checklist">
                {validation.errors.map((error, i) => (
                  <li key={i} className="dg-review__check dg-review__check--fail">
                    <IconClose label="Not ready" />
                    <span>{error.message}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="dg-review__checklist">
                <li className="dg-review__check dg-review__check--ok">
                  <IconCheck label="Done" />
                  <span>The project has a name</span>
                </li>
                <li className="dg-review__check dg-review__check--ok">
                  <IconCheck label="Done" />
                  <span>There is a scene</span>
                </li>
                <li className={`dg-review__check ${spec.entities.length > 0 ? 'dg-review__check--ok' : 'dg-review__check--fail'}`}>
                  {spec.entities.length > 0
                    ? <IconCheck label="Done" />
                    : <IconClose label="Not ready" />}
                  <span>There are sprites in the game ({spec.entities.length})</span>
                </li>
                <li className={`dg-review__check ${spec.scripts.length > 0 ? 'dg-review__check--ok' : 'dg-review__check--fail'}`}>
                  {spec.scripts.length > 0
                    ? <IconCheck label="Done" />
                    : <IconClose label="Not ready" />}
                  <span>There are scripts ({spec.scripts.length})</span>
                </li>
              </ul>
            )}

            {validation.warnings.length > 0 && (
              <ul className="dg-review__checklist dg-review__checklist--warn">
                {validation.warnings.map((w, i) => (
                  <li key={i} className="dg-review__check dg-review__check--warn">
                    <IconWarning label="Warning" />
                    <span>{w.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Estado de revisión en curso */}
          {hasPendingReview && (
            <div className="dg-review__notice dg-review__notice--pending">
              <IconInfo label="Note" />
              <div>
                <strong>One version is already with your teacher</strong>
                <p>Sent on {formatDate(latestReview!.submittedAt)}. You can send the next one once this has been read.</p>
              </div>
            </div>
          )}

          {/* Info sobre snapshot */}
          {!hasPendingReview && validation.valid && (
            <div className="dg-review__notice">
              <IconInfo label="Note" />
              <div>
                <strong>What happens when you confirm</strong>
                <p>A frozen copy of the project is kept. You can keep working afterwards: later changes do not touch the copy your teacher is reading.</p>
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="dg-modal__footer">
          <button className="dg-btn dg-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="dg-btn dg-btn--primary"
            onClick={onConfirm}
            disabled={!validation.valid || hasPendingReview}
          >
            {hasPendingReview
              ? 'In review'
              : !validation.valid
                ? 'Fix the list first'
                : 'Confirm and send'}
          </button>
        </div>

        {/* Historial */}
        {spec.reviewHistory.length > 0 && (
          <div className="dg-review__history">
            <h3 className="dg-review__history-title">Everything you have sent</h3>
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
  platformer: 'Platform',
  maze: 'Maze',
}

const STATUS_LABELS: Record<string, string> = {
  in_review: 'In review',
  changes_requested: 'Changes asked for',
  approved: 'Approved',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en', {
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
