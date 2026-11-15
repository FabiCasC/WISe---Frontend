import { useState } from 'react'
import DesignGame from '../../games/design-game/DesignGame'
import RepairBay from '../components/RepairBay'
import SiteFooter from '../components/SiteFooter'
import { REPAIRS } from '../../content/repairs'

type Room = 'repair' | 'build'

/**
 * #/studio — where the student changes side.
 *
 * Two rooms, in the order a person actually learns:
 *  - Repair bay: fix real bugs in the arcade's own games, using NASA data to
 *    decide what is true. Reading someone else's rule comes before writing
 *    your own, and the bugs here are the real ones this repo had.
 *  - Free build: the block editor and simulator, for building from scratch.
 *
 * Repair is the default, because a blank page is the hardest place to start.
 */
export default function Studio({ accountId }: { accountId?: string }) {
  const [room, setRoom] = useState<Room>('repair')

  if (room === 'build') {
    return (
      <section className="section wrap page studio">
        <StudioTabs room={room} onChange={setRoom} />
        <DesignGame />
      </section>
    )
  }

  return (
    <>
      <section className="section wrap page studio">
        <header className="page__head">
          <h1 className="page__title">Studio</h1>
          <p className="page__lede">
            You have played these games. Now you are the one who writes them. Here the rules are
            open, the mistakes are real, and NASA's own measurements are what settle an argument.
          </p>
        </header>

        <StudioTabs room={room} onChange={setRoom} />
        <RepairBay accountId={accountId} />
      </section>
      <SiteFooter />
    </>
  )
}

function StudioTabs({ room, onChange }: { room: Room; onChange: (r: Room) => void }) {
  return (
    <div className="studio__tabs" role="tablist" aria-label="Studio rooms">
      <button
        type="button"
        role="tab"
        aria-selected={room === 'repair'}
        className={'studio__tab' + (room === 'repair' ? ' is-on' : '')}
        onClick={() => onChange('repair')}
      >
        <span className="studio__tab-name">Repair bay</span>
        <span className="studio__tab-note">Fix {REPAIRS.length} real bugs in these games</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={room === 'build'}
        className={'studio__tab' + (room === 'build' ? ' is-on' : '')}
        onClick={() => onChange('build')}
      >
        <span className="studio__tab-name">Free build</span>
        <span className="studio__tab-note">Make a game of your own with blocks</span>
      </button>
    </div>
  )
}
