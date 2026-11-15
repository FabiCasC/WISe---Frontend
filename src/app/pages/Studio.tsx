import { IconGear } from '../components/Art'
import SiteFooter from '../components/SiteFooter'

/** The blocks the Studio will offer. Each one carries a real, sourced fact. */
const BLOCKS = [
  { kind: 'Machine', color: 'var(--moon)', text: 'Pick a real machine left on the Moon or Mars: Spirit, Sojourner, Apollo’s rover…' },
  { kind: 'Rule', color: 'var(--mars)', text: 'Choose the real rule your game is built on: sunlight and dust, radio delay, low gravity…' },
  { kind: 'Goal', color: 'var(--ok)', text: 'Decide what the player must achieve, and what loses.' },
  { kind: 'Fact', color: 'var(--action)', text: 'Attach the NASA source that explains it, so the game teaches something true.' },
]

export default function Studio() {
  return (
    <>
      <section className="section wrap page">
        <div className="page__head">
          <span className="page__icon" aria-hidden="true">
            <IconGear size={26} />
          </span>
          <div>
            <h1 className="page__title">Game Studio</h1>
            <p className="page__lede">
              Build your own game by snapping blocks together, like in Scratch. Every game you make
              has to teach a real fact from the NASA sources of the challenge.
            </p>
          </div>
        </div>

        <div className="card studio__soon">
          <h2 className="card__title">Coming next</h2>
          <p>
            The block editor is being designed. Creating games will unlock the <b>creator medals</b>{' '}
            in your profile: First Build, Game Maker and Studio Pro.
          </p>
          <ul className="studio__blocks">
            {BLOCKS.map((b) => (
              <li key={b.kind} style={{ borderLeftColor: b.color }}>
                <b>{b.kind}</b>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
