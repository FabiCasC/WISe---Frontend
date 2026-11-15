import { useCallback, useMemo, useState } from 'react'
import { REPAIRS, type RepairMission } from '../../content/repairs'
import { getGame } from '../../content/games'
import { SOURCES } from '../../content/sources'
import { BenchFor } from './benches'
import { createSfx } from '../../games/shared/audio'
import {
  emptyRepairs,
  isSolved,
  loadRepairs,
  markSolved,
  saveRepairs,
  type RepairProgress,
} from '../../shared/repairProgress'

interface MissionMeta {
  icon: string
  category: string
  accentColor: string
  conceptPill: string
  xp: number
  hint: string
}

const MISSION_META: Record<string, MissionMeta> = {
  'sand-vs-size': {
    icon: '🚜',
    category: 'Rover physics · Traction',
    accentColor: '#f59e0b',
    conceptPill: 'Ground pressure and footprint',
    xp: 50,
    hint: 'Send both rovers across soft sand: which one sinks, and why?',
  },
  'death-cleans-panels': {
    icon: '☀️',
    category: 'Solar power · Mars dust',
    accentColor: '#eab308',
    conceptPill: 'Dust devils',
    xp: 50,
    hint: 'Try both actions: what really clears the solar panels?',
  },
  'two-stations': {
    icon: '📡',
    category: 'Moonquakes · Apollo network',
    accentColor: '#06b6d4',
    conceptPill: 'Triangulation',
    xp: 75,
    hint: 'Two stations cross at two points. How many pin down one place?',
  },
  'praised-into-a-corner': {
    icon: '🚀',
    category: 'Orbital mechanics · Apollo 11',
    accentColor: '#a855f7',
    conceptPill: 'A lower orbit is faster',
    xp: 100,
    hint: 'To catch a ship in the same orbit you must drop to a lower one.',
  },
}

const RANKS = [
  { level: 'Cadet', title: 'Space Engineering Cadet', icon: '🧑‍🚀' },
  { level: 'Level 1', title: 'Lunar Telemetry Technician', icon: '📡' },
  { level: 'Level 2', title: 'Robotics Specialist', icon: '🤖' },
  { level: 'Level 3', title: 'Flight Systems Officer', icon: '🛰️' },
  { level: 'Master', title: 'Chief Orbital Engineer', icon: '👨‍🚀' },
]

/**
 * REPAIR BAY
 * -------------------------------------------------------------------------
 * El taller interactivo de ingeniería y física de la NASA.
 * Los estudiantes prueban la física real en bancos de prueba interactivos,
 * descubren el error en la regla del juego y corrigen el código visual.
 */
export default function RepairBay({ accountId }: { accountId?: string }) {
  const [progress, setProgress] = useState<RepairProgress>(() => {
    try {
      return loadRepairs(accountId)
    } catch {
      return emptyRepairs()
    }
  })
  const [openId, setOpenId] = useState<string | null>(null)

  const open = useMemo(() => REPAIRS.find((r) => r.id === openId) ?? null, [openId])

  const handleSolved = useCallback(
    (id: string, firstTry: boolean) => {
      setProgress((prev) => {
        const next = markSolved(prev, id, firstTry)
        saveRepairs(next, accountId)
        return next
      })

      // Sonido de celebración estelar sintetizado con WebAudio
      try {
        const sfx = createSfx(0.35)
        sfx.tone(523.25, 100, 'sine', 0.25)
        setTimeout(() => sfx.tone(659.25, 100, 'sine', 0.28), 110)
        setTimeout(() => sfx.tone(783.99, 100, 'sine', 0.3), 220)
        setTimeout(() => sfx.tone(1046.5, 280, 'sine', 0.35), 330)
      } catch {}
    },
    [accountId],
  )

  if (open) {
    return (
      <Mission
        key={open.id}
        mission={open}
        solved={isSolved(progress, open.id)}
        onSolved={handleSolved}
        onBack={() => setOpenId(null)}
      />
    )
  }

  const done = progress.solved.length
  const rank = RANKS[Math.min(done, RANKS.length - 1)]
  const progressPercent = Math.round((done / REPAIRS.length) * 100)

  return (
    <div className="bay">
      {/* Cabecera visual del Taller */}
      <header className="bay__header-card">
        <div className="bay__badge">
          <span>🛠️ NASA FLIGHT LAB</span>
          <span className="bay__badge-sep">·</span>
          <span>REAL PHYSICS</span>
        </div>
        <h1 className="bay__h1">Repair bay</h1>
        <p className="bay__lede">
          Some games in this arcade were teaching things that are not true. Run the test
          bench yourself, check it against NASA's data, and repair the rule.
        </p>

        {/* Dashboard de Progreso & Rango Espacial */}
        <div className="bay__tracker" role="region" aria-label="Repair progress">
          <div className="bay__tracker-head">
            <div className="bay__rank-info">
              <span className="bay__rank-icon" aria-hidden="true">{rank.icon}</span>
              <div>
                <span className="bay__rank-badge">CURRENT RANK</span>
                <strong className="bay__rank-title">{rank.title}</strong>
              </div>
            </div>
            <div className="bay__stats-badge">
              <span className="bay__stats-pct">{progressPercent}%</span>
              <span className="bay__stats-sub">{done} of {REPAIRS.length} repaired</span>
            </div>
          </div>

          <div className="bay__meter-bar" aria-hidden="true">
            <div
              className="bay__meter-fill"
              style={{ width: `${Math.max(8, progressPercent)}%` }}
            >
              <span className="bay__meter-rocket">🚀</span>
            </div>
          </div>

          <div className="bay__milestones" aria-hidden="true">
            {REPAIRS.map((m, idx) => {
              const isDone = isSolved(progress, m.id)
              return (
                <div
                  key={m.id}
                  className={'bay__milestone' + (isDone ? ' is-done' : '')}
                >
                  <span className="bay__milestone-dot">{isDone ? '✓' : idx + 1}</span>
                  <span className="bay__milestone-lbl">Bug {idx + 1}</span>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* Lista de Misiones de Reparación */}
      <ol className="bay__list">
        {REPAIRS.map((m, i) => {
          const game = getGame(m.gameId)
          const fixed = isSolved(progress, m.id)
          const meta = MISSION_META[m.id] ?? {
            icon: '🔧',
            category: 'Space physics',
            accentColor: '#f3b54a',
            conceptPill: 'Simulation',
            xp: 50,
            hint: m.ask,
          }

          return (
            <li key={m.id}>
              <button
                type="button"
                className={'bay__card' + (fixed ? ' is-fixed' : '')}
                onClick={() => setOpenId(m.id)}
                style={{ '--mission-accent': meta.accentColor } as React.CSSProperties}
              >
                {/* Icono de Misión */}
                <div className="bay__icon-box" aria-hidden="true">
                  <span className="bay__icon-symbol">{meta.icon}</span>
                  <span className="bay__icon-num">{String(i + 1).padStart(2, '0')}</span>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="bay__body">
                  <div className="bay__top-tags">
                    <span className="bay__game">{game?.title ?? m.gameId}</span>
                    <span className="bay__category-tag">{meta.category}</span>
                  </div>
                  <strong className="bay__title">{m.title}</strong>
                  <span className="bay__ask">{m.ask}</span>
                  <div className="bay__pills-row">
                    <span className="bay__concept-pill">💡 {meta.conceptPill}</span>
                    <span className="bay__xp-pill">+{meta.xp} XP</span>
                  </div>
                </div>

                {/* Botón de Estado / Acción */}
                <div className="bay__action-wrap">
                  <span className={'bay__state-badge' + (fixed ? ' is-fixed' : '')}>
                    {fixed ? '✓ REPAIRED' : 'INVESTIGATE ➔'}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Mission({
  mission,
  solved,
  onSolved,
  onBack,
}: {
  mission: RepairMission
  solved: boolean
  onSolved: (id: string, firstTry: boolean) => void
  onBack: () => void
}) {
  const [used, setUsed] = useState(solved)
  const [tried, setTried] = useState<string[]>([])

  const chosen = tried[tried.length - 1] ?? null
  const chosenOption = mission.options.find((o) => o.id === chosen) ?? null
  const isRight = chosenOption?.correct === true
  const source = SOURCES[mission.evidence.sourceId]
  const game = getGame(mission.gameId)
  const meta = MISSION_META[mission.id] ?? {
    icon: '🔧',
    category: 'Física Espacial',
    accentColor: '#f3b54a',
    conceptPill: 'Simulación',
    xp: 50,
    hint: mission.ask,
  }

  const choose = (id: string) => {
    if (isRight) return
    const option = mission.options.find((o) => o.id === id)
    if (!option) return
    const firstTry = tried.length === 0
    setTried((t) => (t.includes(id) ? t : [...t, id]))
    if (option.correct) onSolved(mission.id, firstTry)
  }

  const shown = isRight ? mission.ruleFixed : mission.rule

  return (
    <div className="bay">
      {/* Navegación y Cabecera de la Misión */}
      <div className="bay__crumb">
        <button type="button" className="bay__backlink" onClick={onBack}>
          ← All repairs
        </button>
        <span className="bay__crumb-sep" aria-hidden="true">/</span>
        <span className="bay__crumb-game">{game?.title ?? mission.gameId}</span>
        <h2 className="bay__crumb-title">{meta.icon} {mission.title}</h2>
        {solved ? <span className="bay__state-badge is-fixed">✓ Repaired</span> : null}
      </div>

      {/* Stepper de 4 Pasos de la Misión */}
      <div className="bay__stepper" aria-label="Investigation steps">
        <div className={'bay__step-node' + (used ? ' is-done' : ' is-current')}>
          <span className="bay__step-node-num">1</span>
          <span className="bay__step-node-lbl">Run the bench</span>
        </div>
        <div className={'bay__step-node' + (used && !isRight ? ' is-current' : used ? ' is-done' : '')}>
          <span className="bay__step-node-num">2</span>
          <span className="bay__step-node-lbl">What you saw</span>
        </div>
        <div className={'bay__step-node' + (isRight ? ' is-done' : used ? ' is-current' : '')}>
          <span className="bay__step-node-num">3</span>
          <span className="bay__step-node-lbl">Repair the rule</span>
        </div>
        <div className={'bay__step-node' + (isRight ? ' is-done is-current' : '')}>
          <span className="bay__step-node-num">4</span>
          <span className="bay__step-node-lbl">NASA evidence</span>
        </div>
      </div>

      {/* Banner de instrucción para niños */}
      {!used && (
        <div className="bay__hint-banner">
          <span className="bay__hint-icon">🧪</span>
          <p>
            <strong>Step 1:</strong> play with the test bench below. Press the controls and
            watch what the physics really does.
          </p>
        </div>
      )}

      {/* 1. Banco de Pruebas Interactivo */}
      <BenchFor id={mission.bench} onUsed={() => setUsed(true)} />

      {used ? (
        <>
          {/* 2. Observación vs Contradicción del juego */}
          <div className="bay__seen">
            <div className="bay__seen-box bay__seen-box--saw">
              <span className="bay__seen-tag">👀 WHAT YOU SAW</span>
              <p className="bay__saw">{mission.observation}</p>
            </div>
            <div className="bay__seen-box bay__seen-box--says">
              <span className="bay__seen-tag">⚠️ WHAT THE GAME CLAIMED</span>
              <p className="bay__says">{mission.gameSays}</p>
            </div>
          </div>

          {/* 3. Bloques de Programación */}
          <section className="bay__step">
            <h3 className="bay__h3">
              <span>🛠️</span> The rule inside the game
            </h3>
            <div className="blocks">
              {shown.before.map((line) => (
                <p key={line} className="blocks__row">
                  {line}
                </p>
              ))}
              <p className={'blocks__row blocks__row--slot' + (isRight ? ' is-fixed' : '')}>
                <span className="blocks__slot">{shown.slot}</span>
                {isRight ? <span className="blocks__tag">✓ REPAIRED</span> : null}
              </p>
              {shown.after.map((line) => (
                <p key={line} className="blocks__row">
                  {line}
                </p>
              ))}
            </div>

            {!isRight ? (
              <div className="bay__options-block">
                <p className="bay__prompt">Pick the piece that repairs the block:</p>
                <ul className="bay__options">
                  {mission.options.map((o) => {
                    const usedOpt = tried.includes(o.id)
                    return (
                      <li key={o.id}>
                        <button
                          type="button"
                          className={'bay__chip' + (usedOpt ? ' is-wrong' : '')}
                          onClick={() => choose(o.id)}
                          disabled={usedOpt}
                        >
                          {o.label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {chosenOption ? (
                  <div className="bay__note-card" role="status">
                    <span className="bay__note-icon">💡</span>
                    <p className="bay__note">{chosenOption.note}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="bay__celebration-card" role="status">
                <span className="bay__celebration-emoji">🎉</span>
                <div>
                  <h4 className="bay__celebration-title">RULE REPAIRED (+{meta.xp} XP)</h4>
                  <p className="bay__note is-right">
                    {mission.options.find((o) => o.correct)!.note}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* 4. Evidencia NASA */}
          {isRight ? (
            <section className="bay__step bay__step--nasa">
              <div className="bay__nasa-badge">
                <span>🚀 MEASURED BY NASA</span>
              </div>
              <h3 className="bay__h3">What the data shows</h3>
              <p className="bay__evidence">{mission.evidence.text}</p>
              {source ? (
                <p className="bay__source">
                  <a href={source.url} target="_blank" rel="noreferrer noopener">
                    🔗 Official source: {source.title}
                  </a>
                  <span className="bay__publisher">
                    {source.publisher}
                    {source.accessed ? ' · checked ' + source.accessed : ''}
                  </span>
                </p>
              ) : null}

              <div className="bay__done">
                <h4 className="bay__h4">What really changed in the game</h4>
                <p>{mission.fixedIn}</p>
                <button type="button" className="bay__next" onClick={onBack}>
                  ← Back to all repairs
                </button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
