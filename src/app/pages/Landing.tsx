import { ARCHIVE_STATS } from '../../content/archive'
import { BRAND } from '../../content/brand'
import { MISSIONS, type MissionCard } from '../../content/missions'
import { GAME_IDS, totalScore } from '../../shared/progress'
import type { GameId, Progress } from '../../shared/types'
import { IconPlay, IconStamp } from '../components/Art'
import PortalCard from '../components/PortalCard'
import SiteFooter from '../components/SiteFooter'

const CREW = [
  {
    role: 'Kevin · Telecomunicaciones',
    task: 'Integración, portal, UX y publicación. Apoyo al juego 3.',
    out: 'Una sola navegación, carga de módulos, progreso y demo pública.',
  },
  {
    role: 'Computación Científica 1',
    task: 'Reglas y generación del juego 1.',
    out: 'Intercambios, cascadas y tablero siempre jugable.',
  },
  {
    role: 'Ingeniería de Software',
    task: 'Escenas, interacción y entrega del juego 1.',
    out: 'Tres niveles integrados; build y pruebas automatizadas comunes.',
  },
  {
    role: 'Computación Científica 2',
    task: 'Reglas y mapas del juego 2.',
    out: 'Interruptores, haces y tres soluciones comprobadas.',
  },
  {
    role: 'Ingeniería de Sistemas',
    task: 'Controles, escenas del juego 2 y apoyo al despliegue.',
    out: 'Modo individual completo; móvil probado y URL de respaldo.',
  },
  {
    role: 'Ingeniería Estadística',
    task: 'Reglas del juego 3, dificultad y validación educativa.',
    out: 'Rutas con energía suficiente; registro de pruebas honesto.',
  },
]

interface Props {
  progress: Progress
  onPlay: (mission: MissionCard) => void
  onDossier: (gameId: GameId) => void
}

export default function Landing({ progress, onPlay, onDossier }: Props) {
  const stamps = progress.memories.length
  const score = totalScore(progress)
  const levelsDone = GAME_IDS.reduce(
    (n, id) => n + progress.games[id].levelsCompleted.length,
    0,
  )

  return (
    <>
      {/* ============================================================ PORTADA */}
      <section className="cover">
        <div className="cover__media" aria-hidden="true">
          <img className="cover__img" src="assets/brand/hero.webp" alt="" />
          <span className="cover__tint" />
        </div>

        <div className="cover__inner">
          <span className="cover__eyebrow">{BRAND.event}</span>

          {/* El nombre accesible va en aria-label: un hijo visualmente oculto
              dentro de un titular con background-clip:text se repinta y se ve. */}
          <h1 className="cover__word" aria-label={BRAND.full}>
            <span aria-hidden="true">{BRAND.wordmarkDisplay}</span>
            <span className="cover__word-sub" aria-hidden="true">
              {BRAND.wordmarkSub}
            </span>
          </h1>

          <p className="cover__claim">{BRAND.claim}</p>
          <p className="cover__lede">{BRAND.tagline}</p>

          <div className="cover__cta">
            <a className="btn btn--xl btn--primary" href="#/arcade">
              <IconPlay size={24} />
              Entrar al arcade
            </a>
            <a className="btn btn--xl btn--ghost" href="#juegos">
              Ver los tres juegos
            </a>
          </div>

          <div className="cover__stats">
            <div className="stat">
              <div className="stat__value">{MISSIONS.length}</div>
              <div className="stat__label">Juegos</div>
            </div>
            <div className="stat">
              <div className="stat__value">{ARCHIVE_STATS.total}</div>
              <div className="stat__label">Equipos reales</div>
            </div>
            <div className="stat">
              <div className="stat__value">{levelsDone}/9</div>
              <div className="stat__label">Niveles</div>
            </div>
            <div className="stat">
              <div className="stat__value">{stamps}/3</div>
              <div className="stat__label">Recuerdos</div>
            </div>
            <div className="stat">
              <div className="stat__value" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {score.toLocaleString('es')}
              </div>
              <div className="stat__label">Puntos</div>
            </div>
          </div>
        </div>

        <a className="cover__scroll" href="#juegos" aria-label="Bajar a los juegos">
          <span />
        </a>
      </section>

      {/* ============================================================= JUEGOS */}
      <section className="section wrap" id="juegos">
        <div className="section__head section__head--center">
          <span className="section__kicker">Tres misiones reales</span>
          <h2 className="section__title">Tres equipos que siguen allí</h2>
          <p className="section__note">
            Cada partida dura entre dos y cuatro minutos. Al terminar se abre el recuerdo
            de la misión y su ficha real con fuente.
          </p>
        </div>

        <div className="portals portals--center">
          {MISSIONS.map((mission) => (
            <PortalCard
              key={mission.gameId}
              mission={mission}
              progress={progress}
              onPlay={() => onPlay(mission)}
              onDossier={() => onDossier(mission.gameId)}
            />
          ))}
        </div>

        <div className="section__foot">
          <a className="btn btn--lg btn--ghost" href="#/arcade">
            <IconPlay />
            Ver también el archivo de {ARCHIVE_STATS.total} equipos
          </a>
        </div>
      </section>

      {/* ========================================================== PASAPORTE */}
      <section className="section wrap" id="pasaporte">
        <div className="passport">
          <div className="section__head" style={{ marginBottom: 0 }}>
            <div>
              <span className="section__kicker">Progreso</span>
              <h2 className="section__title">Pasaporte de recuerdos · {stamps}/3</h2>
            </div>
            <p className="section__note">
              Al completar una misión se sella su recuerdo. Con los tres sellos se abre el
              museo final, donde los tres protagonistas aparecen juntos.
            </p>
          </div>

          <div className="passport__grid">
            {MISSIONS.map((mission) => {
              const unlocked = progress.memories.includes(mission.gameId)
              const best = Math.max(
                0,
                ...Object.values(progress.games[mission.gameId].bestScore).map((v) => v ?? 0),
              )
              return (
                <div
                  key={mission.gameId}
                  className={`memory${unlocked ? ' is-unlocked' : ''}`}
                  style={{ ['--accent' as string]: mission.accent }}
                >
                  <span className="memory__seal">
                    <IconStamp size={20} />
                  </span>
                  <span className="memory__name">{mission.hardware}</span>
                  <span className="memory__state">
                    {unlocked
                      ? `Recuerdo recuperado · mejor puntuación ${best}`
                      : 'Sin sellar. Completa un nivel para abrirlo.'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================= EQUIPO */}
      <section className="section wrap" id="equipo">
        <div className="section__head">
          <div>
            <span className="section__kicker">Seis integrantes · tres parejas</span>
            <h2 className="section__title">Quién construye qué</h2>
          </div>
          <p className="section__note">
            Cada pareja trabaja en su carpeta contra el mismo contrato de integración, así
            que la base nunca bloquea a los juegos.
          </p>
        </div>

        <div className="crew">
          {CREW.map((member) => (
            <div className="crew__card" key={member.role}>
              <div className="crew__role">{member.role}</div>
              <p className="crew__task">{member.task}</p>
              <p className="crew__out">{member.out}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
