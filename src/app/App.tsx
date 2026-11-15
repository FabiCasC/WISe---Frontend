import { useCallback, useEffect, useState } from 'react'
import { getGame, type GameEntry } from '../content/games'
import { getMission } from '../content/missions'
import { getTutorial } from '../content/tutorials'
import {
  loadMembership,
  localClassService,
  saveMembership,
  type Membership,
} from '../shared/classroom'
import {
  addClassIn,
  currentAccount,
  loadAccountDb,
  logInIn,
  logOutIn,
  saveAccountDb,
  signUpIn,
  type Account,
  type AccountDb,
} from '../shared/accounts'
import { computeMedals, medalStatsFromProgress } from '../shared/medals'
import { applyResult, isLevelUnlocked, nextPlayableLevel } from '../shared/progress'
import { loadSeen, saveSeen, withSeen } from '../shared/tutorial'
import type { GameId, GameResult, LevelId } from '../shared/types'
import Dossier from './components/Dossier'
import { GameSheet } from './components/GameWall'
import SettingsPanel from './components/SettingsPanel'
import TutorialFlow from './components/TutorialFlow'
import Sky from './components/Sky'
import Topbar from './components/Topbar'
import GameHost from './GameHost'
import { navigate, useHashRoute, useScrollReset, type PageRoute } from './hooks/useHashRoute'
import { useProgress } from './hooks/useProgress'
import Auth from './pages/Auth'
import Home from './pages/Home'
import JoinClass from './pages/JoinClass'
import Panel from './pages/Panel'
import Profile from './pages/Profile'
import Studio from './pages/Studio'
import Teacher from './pages/Teacher'

/** Servicio de clases. Cuando exista el backend se cambia aquí por el cliente de API. */
const classService = localClassService

function pageKey(page: PageRoute): string {
  if (page.name === 'join') return `join/${page.code ?? ''}`
  if (page.name === 'panel') return `panel/${page.token}`
  return page.name
}

/**
 * Accounts are simulated for the MVP (see shared/accounts.ts). Nothing in the
 * portal opens without one, and each account keeps its own progress.
 */
export default function App() {
  const [db, setDb] = useState<AccountDb>(loadAccountDb)
  const account = currentAccount(db)

  useEffect(() => {
    saveAccountDb(db)
  }, [db])

  if (!account) {
    return (
      <>
        <Sky reducedMotion={false} />
        <Auth
          db={db}
          onSignUp={(input) => {
            const r = signUpIn(db, input)
            if (r.ok) setDb(r.db)
            return r
          }}
          onLogIn={(username) => {
            const r = logInIn(db, username)
            if (r.ok) setDb(r.db)
            return r
          }}
        />
      </>
    )
  }

  return (
    <Portal
      key={account.id}
      account={account}
      onLogout={() => {
        navigate('#/')
        setDb(logOutIn(db))
      }}
      onClassCreated={(code) => setDb(addClassIn(db, account.id, code))}
    />
  )
}

interface PortalProps {
  account: Account
  onLogout: () => void
  onClassCreated: (code: string) => void
}

function Portal({ account, onLogout, onClassCreated }: PortalProps) {
  const route = useHashRoute()
  const { progress, storageOk, record, updateSettings, reset } = useProgress(account.id)

  // The account id doubles as the anonymous id the class dashboard sees.
  const playerId = account.id
  const [membership, setMembership] = useState<Membership | null>(() => loadMembership(account.id))
  const [seenGuides, setSeenGuides] = useState<string[]>(() => loadSeen(account.id))
  const [dossierId, setDossierId] = useState<GameId | null>(null)
  const [sheetGame, setSheetGame] = useState<GameEntry | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  /**
   * Mientras se juega, la página de fondo sigue siendo la que estaba. Así,
   * al salir de la partida se vuelve justo donde se estaba.
   */
  const [page, setPage] = useState<PageRoute>(() =>
    route.name === 'play' ? { name: 'landing' } : route,
  )
  const [pageHash, setPageHash] = useState('#/')
  useEffect(() => {
    if (route.name !== 'play') {
      setPage(route)
      setPageHash(window.location.hash || '#/')
    }
  }, [route])

  // A #/play link to an unknown or not-yet-playable game shows the arcade:
  // keep the address bar in step with what is on screen.
  useEffect(() => {
    if (route.name === 'landing' && /^#\/(play|jugar)\b/.test(window.location.hash)) navigate('#/games')
  }, [route])

  // The arcade is the wall of games at the bottom of the home page: both
  // #/games and #/arcade scroll there, also when the home is already open.
  useEffect(() => {
    if (route.name !== 'landing' || !/^#\/(games|arcade)$/.test(window.location.hash)) return
    const id = window.requestAnimationFrame(() =>
      document.getElementById('games')?.scrollIntoView({ block: 'start' }),
    )
    return () => window.cancelAnimationFrame(id)
  }, [route])

  // Cambiar de página vuelve arriba; moverse por anclas no.
  useScrollReset(pageKey(page))

  // Una URL directa a un nivel bloqueado lleva al nivel que sí está abierto.
  useEffect(() => {
    if (route.name === 'play' && !isLevelUnlocked(progress, route.gameId, route.levelId)) {
      const levels = getGame(route.gameId)?.levels ?? 1
      navigate(`#/play/${route.gameId}/${nextPlayableLevel(progress, route.gameId, levels)}`)
    }
  }, [route, progress])

  // Aviso único si el navegador bloquea el guardado.
  useEffect(() => {
    if (!storageOk) {
      setToast(
        'This browser blocks local saving: you can play, but your progress will not be kept.',
      )
    }
  }, [storageOk])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(t)
  }, [toast])

  /** Opens a game. Every game is open; inside a game, levels go in order. */
  const play = useCallback(
    (gameId: GameId, levelId?: LevelId) => {
      const game = getGame(gameId)
      setDossierId(null)
      setSheetGame(null)
      if (!game || game.status !== 'live') {
        if (game) setSheetGame(game)
        return
      }
      let lvl =
        levelId && levelId <= game.levels && isLevelUnlocked(progress, gameId, levelId)
          ? levelId
          : nextPlayableLevel(progress, gameId, game.levels)
      // Level 0 (how to play): on request, and by itself the first time a
      // player is about to start level 1 of a game.
      if (getTutorial(gameId) && (levelId === 0 || (lvl === 1 && !seenGuides.includes(gameId)))) lvl = 0
      navigate(`#/play/${gameId}/${lvl}`)
    },
    [progress, seenGuides],
  )

  /** Leaves Level 0 for the real game, and remembers the guide was seen. */
  const startFromGuide = useCallback(
    (gameId: GameId) => {
      setSeenGuides((prev) => {
        const next = withSeen(prev, gameId)
        saveSeen(account.id, next)
        return next
      })
      const levels = getGame(gameId)?.levels ?? 1
      navigate(`#/play/${gameId}/${nextPlayableLevel(progress, gameId, levels)}`)
    },
    [account.id, progress],
  )

  const exitGame = useCallback(() => navigate(pageHash), [pageHash])

  const handleResult = useCallback(
    (result: GameResult) => {
      // Level 0 is practice: finishing it counts for nothing, it just moves on.
      if (route.name === 'play' && route.levelId === 0) {
        startFromGuide(result.gameId)
        return
      }
      record(result)
      if (membership) {
        // Mismo cálculo que hace record(), para enviar el progreso ya actualizado.
        classService.reportResult(membership, applyResult(progress, result), result).catch(() => {
          /* el respaldo local nunca debe interrumpir la partida */
        })
      }
      const game = getGame(result.gameId)
      const title = game?.title ?? getMission(result.gameId)?.title ?? result.gameId
      // A finished level goes straight on to the next one of the same game:
      // the player stays in the game and sees every level in order. Only the
      // last level (or leaving on purpose) returns to the arcade.
      if (result.completed && game && result.levelId < game.levels) {
        setToast(`Level ${result.levelId} complete! Level ${result.levelId + 1} of ${game.levels}`)
        navigate(`#/play/${result.gameId}/${result.levelId + 1}`)
        return
      }
      setToast(
        result.completed
          ? `You finished every level of ${title}!`
          : 'Game closed before finishing. You can try again any time.',
      )
      exitGame()
    },
    [record, membership, progress, exitGame, route, startFromGuide],
  )

  const joined = useCallback((m: Membership) => {
    saveMembership(m, account.id)
    setMembership(m)
  }, [account.id])

  const leaveClass = useCallback(() => {
    saveMembership(null, account.id)
    setMembership(null)
    setToast('You left the class. Your progress is still here, in solo mode.')
    navigate('#/')
  }, [account.id])

  const dossierMission = dossierId ? getMission(dossierId) : undefined

  const medalStats = medalStatsFromProgress(progress, {
    gamesCreated: account.gamesCreated,
    classesCreated: account.classCodes.length,
  })
  const medals = computeMedals(medalStats, account.role)

  return (
    <>
      <Sky reducedMotion={progress.settings.reducedMotion} />

      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="shell">
        <Topbar
          account={account}
          progress={progress}
          membership={membership}
          onSettings={() => setSettingsOpen(true)}
        />

        <main id="main">
          {page.name === 'studio' && <Studio />}
          {page.name === 'profile' && (
            <Profile
              account={account}
              progress={progress}
              stats={medalStats}
              medals={medals}
              onLogout={onLogout}
            />
          )}
          {page.name === 'teacher' &&
            (account.role === 'teacher' ? (
              <Teacher service={classService} onCreated={onClassCreated} />
            ) : (
              <section className="section wrap page">
                <h1 className="page__title">Teachers only</h1>
                <p className="page__lede">
                  Classes are created by teachers. Ask your teacher for a class code and type it on
                  the home page.
                </p>
              </section>
            ))}
          {page.name === 'join' && (
            <JoinClass
              key={page.code ?? ''}
              code={page.code}
              membership={membership}
              playerId={playerId}
              service={classService}
              onJoined={joined}
              onLeave={leaveClass}
            />
          )}
          {page.name === 'panel' && (
            <Panel key={page.token} token={page.token} service={classService} />
          )}
          {page.name === 'landing' && (
            <Home role={account.role} progress={progress} membership={membership} onOpenGame={setSheetGame} />
          )}
        </main>
      </div>

      {/* --------------------------------------------------------- SUPERPUESTO */}
      {route.name === 'play' && route.levelId === 0 && getGame(route.gameId) && getTutorial(route.gameId) && (
        <TutorialFlow
          key={route.gameId}
          game={getGame(route.gameId)!}
          tutorial={getTutorial(route.gameId)!}
          onStart={() => startFromGuide(route.gameId)}
          onExit={exitGame}
          renderPractice={() => (
            <GameHost
              gameId={route.gameId}
              levelId={1}
              settings={{ ...progress.settings, practice: true }}
              onResult={handleResult}
              onExit={exitGame}
            />
          )}
        />
      )}

      {route.name === 'play' && route.levelId >= 1 && isLevelUnlocked(progress, route.gameId, route.levelId) && (
        <GameHost
          gameId={route.gameId}
          levelId={route.levelId}
          settings={progress.settings}
          onResult={handleResult}
          onExit={exitGame}
        />
      )}

      {dossierMission && (
        <Dossier
          mission={dossierMission}
          onClose={() => setDossierId(null)}
          onPlay={() => play(dossierMission.gameId)}
        />
      )}

      {sheetGame && (
        <GameSheet
          game={sheetGame}
          progress={progress}
          onClose={() => setSheetGame(null)}
          onPlay={(g, lvl) => play(g.id, lvl)}
          onDossier={(id) => {
            setSheetGame(null)
            setDossierId(id)
          }}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          settings={progress.settings}
          storageOk={storageOk}
          onChange={updateSettings}
          onReset={() => {
            reset()
            setToast('Progress reset.')
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            type="button"
            className="btn btn--sm btn--quiet"
            onClick={() => setToast(null)}
            aria-label="Close message"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}
