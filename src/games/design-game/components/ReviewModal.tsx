/**
 * DESIGN GAME - MODAL DE REVISIÓN DOCENTE
 * Sin emojis; iconos SVG coherentes con Órbita Arcade.
 */

import type { GameSpecification, ReviewSubmission } from '../types'
import { validateProject } from '../store'

/* -------------------------------------------------------------------------
   Iconos SVG
   ------------------------------------------------------------------------- */
const stroke = {
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconClose()   { return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" {...stroke} /></svg> }
function IconCheck()   { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} strokeWidth={2.4} /></svg> }
function IconCross()   { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...stroke} strokeWidth={2.4} /></svg> }
function IconWarn()    { return <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.5h3.4L21 20H3L10.3 3.5z" {...stroke} /><path d="M12 10v4M12 17.5v.5" {...stroke} /></svg> }
function IconInfo()    { return <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" {...stroke} /><path d="M12 11v5M12 7.6v.2" {...stroke} /></svg> }
function IconSend()    { return <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" {...stroke} /></svg> }
function IconClock()   { return <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" {...stroke} /><path d="M12 7v5l3 3" {...stroke} /></svg> }

interface Props {
  spec: GameSpecification
  latestReview: ReviewSubmission | null
  onConfirm: () => void
  onClose: () => void
}

export default function ReviewModal({ spec, latestReview, onConfirm, onClose }: Props) {
  const validation        = validateProject(spec)
  const hasPendingReview  = latestReview?.status === 'in_review'
  const hasObservations   = latestReview?.status === 'changes_requested'

  return (
    <div className="dg-overlay" onClick={onClose}>
      <div className="dg-modal dg-modal--wide" onClick={(e) => e.stopPropagation()}>

        {/* Cabecera */}
        <div className="dg-modal__header">
          <h2 className="dg-modal__title">Send to your teacher</h2>
          <button className="dg-btn dg-btn--quiet dg-btn--sm" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className="dg-modal__body">

          {/* Resumen */}
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
              <span className="dg-review__summary-value">{spec.entities.length}</span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Scripts</span>
              <span className="dg-review__summary-value">{spec.scripts.length}</span>
            </div>
            <div className="dg-review__summary-item">
              <span className="dg-review__summary-label">Version</span>
              <span className="dg-review__summary-value">v{spec.reviewHistory.length + 1}</span>
            </div>
          </div>

          {/* Observaciones anteriores */}
          {hasObservations && latestReview?.feedback && (
            <div className="dg-review__feedback">
              <h3 className="dg-review__feedback-title">
                Notes from your teacher — v{latestReview.version}
              </h3>
              <p className="dg-review__feedback-text">{latestReview.feedback.comments}</p>
              {latestReview.feedback.issues.length > 0 && (
                <ul className="dg-review__issues">
                  {latestReview.feedback.issues.map((issue, i) => (
                    <li key={i} className={`dg-review__issue dg-review__issue--${issue.type}`}>
                      {issue.type === 'error' ? <IconCross /> : issue.type === 'warning' ? <IconWarn /> : <IconInfo />}
                      {' '}{issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Validación */}
          <div className="dg-review__validation">
            <h3 className="dg-review__validation-title">Checks before you send</h3>

            <ul className="dg-review__checklist">
              {validation.errors.length > 0
                ? validation.errors.map((error, i) => (
                    <li key={i} className="dg-review__check dg-review__check--fail">
                      <IconCross /> {error.message}
                    </li>
                  ))
                : (
                  <>
                    <li className="dg-review__check dg-review__check--ok">
                      <IconCheck /> Your project has a name
                    </li>
                    <li className="dg-review__check dg-review__check--ok">
                      <IconCheck /> There is a scene
                    </li>
                    <li className={`dg-review__check ${spec.entities.length > 0 ? 'dg-review__check--ok' : 'dg-review__check--fail'}`}>
                      {spec.entities.length > 0 ? <IconCheck /> : <IconCross />}
                      {' '}Sprites in the game ({spec.entities.length})
                    </li>
                    <li className={`dg-review__check ${spec.scripts.length > 0 ? 'dg-review__check--ok' : 'dg-review__check--fail'}`}>
                      {spec.scripts.length > 0 ? <IconCheck /> : <IconCross />}
                      {' '}Scripts written ({spec.scripts.length})
                    </li>
                  </>
                )
              }
            </ul>

            {validation.warnings.length > 0 && (
              <ul className="dg-review__checklist dg-review__checklist--warn" style={{ marginTop: 6 }}>
                {validation.warnings.map((w, i) => (
                  <li key={i} className="dg-review__check dg-review__check--warn">
                    <IconWarn /> {w.message}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* En revisión */}
          {hasPendingReview && (
            <div className="dg-review__notice dg-review__notice--pending">
              <span className="dg-review__notice-icon"><IconClock /></span>
              <div>
                <strong>Your teacher already has a version</strong>
                <p>Sent on {formatDate(latestReview!.submittedAt)}. You cannot send another one until this one is read.</p>
              </div>
            </div>
          )}

          {/* Info sobre snapshot */}
          {!hasPendingReview && validation.valid && (
            <div className="dg-review__notice">
              <span className="dg-review__notice-icon"><IconInfo /></span>
              <div>
                <strong>What happens next</strong>
                <p>A copy of your project is saved exactly as it is now. You can keep working afterwards: later changes do not touch the copy your teacher reads.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="dg-modal__footer">
          <button className="dg-btn dg-btn--quiet" onClick={onClose}>Cancel</button>
          <button
            className="dg-btn dg-btn--primary"
            onClick={onConfirm}
            disabled={!validation.valid || hasPendingReview}
          >
            <IconSend />
            {hasPendingReview
              ? 'In review'
              : !validation.valid
                ? 'Fix the problems first'
                : 'Send it'}
          </button>
        </div>

        {/* Historial */}
        {spec.reviewHistory.length > 0 && (
          <div className="dg-review__history">
            <h3 className="dg-review__history-title">What you have sent</h3>
            <div className="dg-review__history-list">
              {[...spec.reviewHistory].reverse().map((r) => (
                <div key={r.id} className="dg-review__history-item">
                  <span className={`dg-status dg-status--${r.status}`}>{STATUS_LABELS[r.status]}</span>
                  <span style={{ color: 'var(--text-dim)' }}>v{r.version}</span>
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
  arcade: 'Arcade', platformer: 'Platformer', maze: 'Maze',
}

const STATUS_LABELS: Record<string, string> = {
  in_review:          'In review',
  changes_requested:  'Changes asked for',
  approved:           'Approved',
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}
