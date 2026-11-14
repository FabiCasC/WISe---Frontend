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
              Jugar «{mission.title}»
            </button>
            <button type="button" className="btn btn--quiet" onClick={onClose}>
              Seguir explorando
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Seguir explorando
          </button>
        )
      }
    >
      <div className="archive-hero" style={{ background: `linear-gradient(155deg, ${from}, ${to})` }}>
        <TileIcon kind={item.kind} size={74} />
      </div>

      <div className="field">
        <div className="field__label">Qué es</div>
        <div className="field__value">{item.note}</div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <div className="field">
          <div className="field__label">Dónde está</div>
          <div className="field__value">{PLACE_LABEL[item.place]}</div>
        </div>
        <div className="field">
          <div className="field__label">Año</div>
          <div className="field__value">{item.year}</div>
        </div>
        <div className="field">
          <div className="field__label">Estado</div>
          <div className="field__value">{STATUS_LABEL[item.status]}</div>
        </div>
      </div>

      {mission ? (
        <div className="field" style={{ borderColor: 'rgba(109,226,242,.35)' }}>
          <div className="field__label">Tiene juego</div>
          <div className="field__value">
            Este equipo es protagonista de «{mission.title}». Su ficha científica completa,
            con fuentes, está en la sección de misiones jugables.
          </div>
        </div>
      ) : (
        <div className="field field--warn">
          <div className="field__label">Ficha breve</div>
          <div className="field__value">
            Entrada del archivo, todavía sin juego ni ficha científica completa. Los datos
            están pendientes de contraste con fuente oficial antes de la entrega.
          </div>
        </div>
      )}
    </Modal>
  )
}
