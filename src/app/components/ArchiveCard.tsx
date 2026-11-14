import {
  PLACE_COLORS,
  PLACE_LABEL,
  STATUS_LABEL,
  type ArchiveItem,
} from '../../content/archive'
import { MISSIONS } from '../../content/missions'
import type { MissionCard } from '../../content/missions'
import { IconPlay } from './Art'
import Modal from './Modal'
import TileIcon from './TileIcon'

/** Si la ficha del archivo tiene juego, lo ofrece. Si no, lo dice claramente. */
function linkedMission(item: ArchiveItem): MissionCard | undefined {
  const n = item.name.toLowerCase()
  if (n.includes('opportunity')) return MISSIONS.find((m) => m.gameId === 'opportunity')
  if (n.includes('spirit')) return MISSIONS.find((m) => m.gameId === 'spirit')
  if (n.includes('apollo 15')) return MISSIONS.find((m) => m.gameId === 'lunar-signals')
  return undefined
}

export default function ArchiveCard({
  item,
  onClose,
  onPlay,
}: {
  item: ArchiveItem
  onClose: () => void
  onPlay: (mission: MissionCard) => void
}) {
  const [from, to] = PLACE_COLORS[item.place]
  const mission = linkedMission(item)

  return (
    <Modal
      title={item.name}
      subtitle={`${PLACE_LABEL[item.place]} · ${item.year} · ${STATUS_LABEL[item.status]}`}
      onClose={onClose}
      footer={
        mission ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--primary" onClick={() => onPlay(mission)}>
              <IconPlay />
              Play “{mission.title}”
            </button>
            <button type="button" className="btn btn--quiet" onClick={onClose}>
              Keep exploring
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Keep exploring
          </button>
        )
      }
    >
      <div className="archive-hero" style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}>
        <TileIcon kind={item.kind} size={74} />
      </div>

      <div className="field">
        <div className="field__label">What it is</div>
        <div className="field__value">{item.note}</div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <div className="field">
          <div className="field__label">Where it is</div>
          <div className="field__value">{PLACE_LABEL[item.place]}</div>
        </div>
        <div className="field">
          <div className="field__label">Year</div>
          <div className="field__value">{item.year}</div>
        </div>
        <div className="field">
          <div className="field__label">Status</div>
          <div className="field__value">{STATUS_LABEL[item.status]}</div>
        </div>
      </div>

      {mission ? (
        <div className="field" style={{ borderColor: 'rgba(109,226,242,.35)' }}>
          <div className="field__label">Has a game</div>
          <div className="field__value">
            This machine stars in “{mission.title}”. Its full science card, with
            sources, is in the playable missions section.
          </div>
        </div>
      ) : (
        <div className="field field--warn">
          <div className="field__label">Short entry</div>
          <div className="field__value">
            An archive entry with no game or full science card yet. Its data still has
            to be checked against an official source before release.
          </div>
        </div>
      )}
    </Modal>
  )
}
