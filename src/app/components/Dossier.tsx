import type { MissionCard } from '../../content/missions'
import { getSources } from '../../content/sources'
import { IconLink, IconPlay } from './Art'
import Modal from './Modal'

/**
 * Ficha científica. Cada afirmación del juego tiene aquí su contrapartida
 * real, la dramatización declarada y la fuente abierta. Es el requisito
 * de trazabilidad del plan.
 */
export default function Dossier({
  mission,
  onClose,
  onPlay,
}: {
  mission: MissionCard
  onClose: () => void
  onPlay: () => void
}) {
  const sources = getSources(mission.sourceIds)
  const d = mission.dossier

  return (
    <Modal
      title={mission.hardware}
      subtitle={`${mission.bodyLabel} · Science card for ${mission.title}`}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--primary" onClick={onPlay}>
            <IconPlay />
            Play this mission
          </button>
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Back to the portal
          </button>
        </div>
      }
    >
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))' }}>
        <div className="field">
          <div className="field__label">Arrival</div>
          <div className="field__value">{d.arrival}</div>
        </div>
        <div className="field">
          <div className="field__label">Last contact</div>
          <div className="field__value">{d.lastContact}</div>
        </div>
        <div className="field">
          <div className="field__label">Mission status</div>
          <div className="field__value">{d.missionEnd}</div>
        </div>
      </div>

      <div className="field">
        <div className="field__label">What it was for</div>
        <div className="field__value">{d.purpose}</div>
      </div>

      <div className="field">
        <div className="field__label">What we learned from it</div>
        <div className="field__value">{d.finding}</div>
      </div>

      <div>
        <div className="field__label" style={{ marginBottom: 10 }}>
          Evidence the game unlocks
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {mission.evidence.map((ev) => (
            <div className="field" key={ev.id}>
              <div className="field__value">
                <strong style={{ color: mission.accent }}>{ev.label}.</strong> {ev.meaning}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="field field--warn">
        <div className="field__label">What the game makes up</div>
        <div className="field__value">{d.dramatization}</div>
      </div>

      <div>
        <div className="field__label" style={{ marginBottom: 10 }}>
          What this game does not claim
        </div>
        <ul className="list-check">
          {d.notTrue.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="field__label" style={{ marginBottom: 10 }}>
          Sources
        </div>
        <div className="srcs">
          {sources.map((s) => (
            <a className="src" key={s.id} href={s.url} target="_blank" rel="noreferrer noopener">
              <IconLink />
              <span style={{ flex: 1 }}>
                {s.title}
                <span className="src__pub">
                  {s.publisher}
                  {s.accessed ? ` · accessed ${s.accessed}` : ' · access date to be verified'}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </Modal>
  )
}
