import {
  GENERAL_LEVELS,
  MAX_GENERAL_LEVEL,
  getGeneralLevel,
  nextGeneralLevel,
  totalLevelsCompleted,
  totalScore,
} from '../../shared/progress'
import type { Progress } from '../../shared/types'
import { IconStar } from './Art'

/**
 * Nivel general del jugador: seis segmentos en Thistle y el requisito del
 * siguiente nivel en una frase.
 */
export default function LevelMeter({ progress, compact = false }: { progress: Progress; compact?: boolean }) {
  const level = getGeneralLevel(progress)
  const next = nextGeneralLevel(progress)
  const levels = totalLevelsCompleted(progress)
  const score = totalScore(progress)

  return (
    <section className={`meter${compact ? ' meter--compact' : ''}`} id="nivel" aria-labelledby="meter-title">
      <div className="meter__head">
        <span className="meter__badge" aria-hidden="true">
          <IconStar size={18} />
          {level}
        </span>
        <div>
          <h2 className="meter__title" id="meter-title">
            Tu nivel general: {level} de {MAX_GENERAL_LEVEL}
          </h2>
          <p className="meter__next">
            {next ? (
              <>
                Para subir al nivel {next.level}: <strong>{next.requirement.toLowerCase()}</strong>
                {next.unlocks && <> · se abre: {next.unlocks.toLowerCase()}</>}
              </>
            ) : (
              <strong>¡Llegaste a la meta! Completaste las tres misiones.</strong>
            )}
          </p>
        </div>
      </div>

      <ol
        className="meter__track"
        role="img"
        aria-label={`Nivel ${level} de ${MAX_GENERAL_LEVEL}`}
      >
        {GENERAL_LEVELS.map((l) => (
          <li
            key={l.level}
            className={`meter__seg${l.level <= level ? ' is-on' : ''}${l.level === level ? ' is-current' : ''}`}
            title={`Nivel ${l.level}: ${l.requirement}${l.unlocks ? ` · ${l.unlocks}` : ''}`}
          >
            <span>{l.level}</span>
          </li>
        ))}
      </ol>

      {!compact && (
        <p className="meter__stats">
          <span>
            <b>{levels}</b> de 9 niveles completados
          </span>
          <span>
            <b>{score.toLocaleString('es')}</b> puntos
          </span>
        </p>
      )}
    </section>
  )
}
