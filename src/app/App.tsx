import { useCallback, useEffect, useState } from 'react'
import type { ArchiveItem } from '../content/archive'
import { getGame, type GameEntry } from '../content/games'
import { getMission } from '../content/missions'
import {
  getPlayerId,
  loadMembership,
  localClassService,
  saveMembership,
  type Membership,
} from '../shared/classroom'
import { applyResult, isLevelUnlocked, nextPlayableLevel } from '../shared/progress'
import type { GameId, GameResult, LevelId } from '../shared/types'
import ArchiveCard from './components/ArchiveCard'
import Dossier from './components/Dossier'
import { GameSheet } from './components/GameWall'
import SettingsPanel from './components/SettingsPanel'
import Sky from './components/Sky'
import Topbar from './components/Topbar'
import GameHost from './GameHost'
import { navigate, useHashRoute, useScrollReset, type PageRoute } from './hooks/useHashRoute'
import { useProgress } from './hooks/useProgress'
import Arcade from './pages/Arcade'
import Archive from './pages/Archive'
import Home from './pages/Home'
import JoinClass from './pages/JoinClass'
import Panel from './pages/Panel'
import Teacher from './pages/Teacher'

/** Servicio de clases. Cuando exista el backend se cambia aquí por el cliente de API. */
const classService = localClassService

function pageKey(page: PageRoute): string {
  if (page.name === 'join') return `join/${page.code ?? ''}`
  if (page.name === 'panel') return `panel/${page.token}`
  return page.name
}

export default function App() {
  const route = useHashRoute()
  const { progress, storageOk, record, updateSettings, reset } = useProgress()

  const [playerId] = useState(getPlayerId)
  const [membership, setMembership] = useState<Membership | null>(loadMembership)
  const [dossierId, setDossierId] = useState<GameId | null>(null)
  const [archiveItem, setArchiveItem] = useState<ArchiveItem | null>(null)
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
    if (route.name === 'arcade' && /^#\/(play|jugar)\b/.test(window.location.hash)) navigate('#/arcade')
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
      setArchiveItem(null)
      setSheetGame(null)
      if (!game || game.status !== 'live') {
        if (game) setSheetGame(game)
        return
      }
      const lvl =
        levelId && levelId <= game.levels && isLevelUnlocked(progress, gameId, levelId)
          ? levelId
          : nextPlayableLevel(progress, gameId, game.levels)
      navigate(`#/play/${gameId}/${lvl}`)
    },
    [progress],
  )

  const exitGame = useCallback(() => navigate(pageHash), [pageHash])

  const handleResult = useCallback(
    (result: GameResult) => {
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
    [record, membership, progress, exitGame],
  )

  const joined = useCallback((m: Membership) => {
    saveMembership(m)
    setMembership(m)
  }, [])

  const leaveClass = useCallback(() => {
    saveMembership(null)
    setMembership(null)
    setToast('You left the class. Your progress is still here, in solo mode.')
    navigate('#/')
  }, [])

  const dossierMission = dossierId ? getMission(dossierId) : undefined

  return (
    <>
      <Sky reducedMotion={progress.settings.reducedMotion} />

      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="shell">
        <Topbar
          progress={progress}
          membership={membership}
          onSettings={() => setSettingsOpen(true)}
        />

        <main id="main">
          {page.name === 'arcade' && (
            <Arcade progress={progress} membership={membership} onOpenGame={setSheetGame} />
          )}
          {page.name === 'archive' && (
            <Archive progress={progress} onPlay={(m) => play(m.gameId)} onItem={setArchiveItem} />
          )}
          {page.name === 'teacher' && <Teacher service={classService} />}
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
            <Home progress={progress} membership={membership} onOpenGame={setSheetGame} />
          )}
        </main>
      </div>

      {/* --------------------------------------------------------- SUPERPUESTO */}
      {route.name === 'play' && isLevelUnlocked(progress, route.gameId, route.levelId) && (
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

      {archiveItem && (
        <ArchiveCard
          item={archiveItem}
          onClose={() => setArchiveItem(null)}
          onPlay={(m) => play(m.gameId)}
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
