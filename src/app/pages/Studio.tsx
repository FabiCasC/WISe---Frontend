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
 *  - Repair bay: run an experiment on a real game, see what it gets wrong,
 *    and fix the rule. Reading someone else's rule comes before writing
 *    your own, and the bugs here are the real ones this repo had.
 *  - Free build: the block editor and simulator, for building from scratch.
 *
 * Repair is the default, because a blank page is the hardest place to start.
 *
 * LAYOUT NOTE: the editor brings its own full-height screen with its own
 * background, so it is rendered OUTSIDE the page wrapper. Nesting it inside
 * one squeezed its three panels into a column and double-padded them, which
 * is what made Studio look cramped and unfinished. The switcher stays a thin
 * bar rather than two big cards, so it never competes with the heading of
 * whichever room is open.
 */
export default function Studio({ accountId }: { accountId?: string }) {
  const [room, setRoom] = useState<Room>('repair')

  if (room === 'build') {
    return (
      <>
        <div className="wrap studio__bar">
          <StudioTabs room={room} onChange={setRoom} />
        </div>
        <DesignGame />
      </>
    )
  }

  return (
    <>
      {/* No page header here: with the switcher, a back button and a mission
          title stacked on top of it, the bench - the only part the student
          actually uses - started below the fold. The room owns its heading
          and drops it entirely once a mission is open. */}
      <section className="section wrap page studio">
        <StudioTabs room={room} onChange={setRoom} />
        <RepairBay accountId={accountId} />
      </section>
      <SiteFooter />
    </>
  )
}

function StudioTabs({ room, onChange }: { room: Room; onChange: (r: Room) => void }) {
  return (
    <div className="studio__switch" role="tablist" aria-label="Studio rooms">
      <button
        type="button"
        role="tab"
        aria-selected={room === 'repair'}
        className={'studio__seg' + (room === 'repair' ? ' is-on' : '')}
        onClick={() => onChange('repair')}
      >
        Repair bay
        <span className="studio__seg-note">{REPAIRS.length} real bugs</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={room === 'build'}
        className={'studio__seg' + (room === 'build' ? ' is-on' : '')}
        onClick={() => onChange('build')}
      >
        Free build
        <span className="studio__seg-note">Your own game</span>
      </button>
    </div>
  )
}
