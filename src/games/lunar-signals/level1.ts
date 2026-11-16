import { COPY } from './copy'
import { el, fmt, type Env, type LevelRun } from './dom'
import { LEVEL1_MEASURED_ECHO_S } from './levels'
import { C_KM_S, distanceFromEcho, judgeEcho } from './rules'

/** The distance dial runs from 0 to 500,000 km. */
const DIAL_MAX_KM = 500_000
/** The journey appears 4 times slower than real time. */
const SLOWMO = 4

const km = (v: number): string => Math.round(v).toLocaleString('en')

export function buildLevel1(env: Env): LevelRun {
  const measured = LEVEL1_MEASURED_ECHO_S
  const tripMs = measured * 1000 * SLOWMO

  let phase: 'idle' | 'flying' | 'measured' | 'done' = 'idle'
  let t = 0
  let hitDone = false

  const root = el('div', 'ls-l1')

  // ── Flight track: Earth · rail · Moon ──
  // The Moon sits at a FIXED end of the rail and the pulse crosses the whole
  // rail. The track is an animation of the round trip, not a distance scale:
  // nothing on it can be measured with a ruler or lined up with an answer.
  const track = el('div', 'ls-track')
  const rail = el('div', 'ls-rail')
  const earth = el('span', 'ls-earth')
  earth.setAttribute('aria-label', 'Earth')
  const moon = el('span', 'ls-moon')
  moon.setAttribute('aria-label', 'Moon (distance unknown)')
  const beam = el('span', 'ls-beam')
  const pulse = el('span', 'ls-pulse')
  pulse.hidden = true
  rail.append(el('span', 'ls-line'), beam, earth, moon, pulse)
  track.append(rail)
  track.append(el('p', 'ls-note', 'Not to scale: how far away the Moon is, is exactly what you have to find out.'))

  // ── Stopwatch ──
  const watchWrap = el('div', 'ls-watch')
  watchWrap.append(el('span', 'ls-watch__label', 'Stopwatch'))
  const watch = el('span', 'ls-watch__value', '0.00 s')
  watchWrap.append(watch)

  // ── Controls ──
  const fire = el('button', 'btn btn--primary', 'Fire Laser')
  fire.type = 'button'

  const slider = el('input', 'ls-slider')
  slider.type = 'range'
  slider.min = '0'
  slider.max = String(DIAL_MAX_KM)
  slider.step = '500'
  slider.value = '100000'
  slider.setAttribute('aria-label', 'Distance to the Moon, in kilometres')

  // The dial reads back only the number the player dialled in. It never shows
  // the echo that distance would produce, which would let them turn the slider
  // until the two times met instead of computing d = c · t / 2.
  const dial = el('p', 'ls-readout')
  const check = el('button', 'btn btn--primary', 'Mark Distance')
  check.type = 'button'

  const tools = el('div', 'ls-tools')
  tools.hidden = true
  tools.append(el('p', 'ls-note', COPY.l1.hint(km(C_KM_S))), slider, dial, check)

  const msg = el('p', 'ls-msg', COPY.l1.idle)
  msg.setAttribute('role', 'status')

  root.append(track, watchWrap, fire, tools, msg)
  env.stage.append(root)

  // Touch an object to see its name for a moment.
  env.name(earth, COPY.names.earth)
  env.name(moon, COPY.names.moon)
  env.name(pulse, COPY.names.pulse)
  env.name(beam, COPY.names.beam)
  env.name(watchWrap, COPY.names.stopwatch)
  env.name(slider, COPY.names.marker)

  const say = (text: string, tone: '' | 'ok' | 'bad' = '') => {
    env.decorate(msg, text)
    msg.className = `ls-msg${tone ? ` is-${tone}` : ''}`
  }

  const show = (p: number) => {
    const out = p < 0.5 ? p * 2 : (1 - p) * 2 // 0 → 1 → 0
    pulse.style.left = `${out * 100}%`
    beam.style.width = `${out * 100}%`
    pulse.classList.toggle('is-back', p > 0.5)
    if (p >= 0.5 && !hitDone) {
      hitDone = true
      moon.classList.add('is-hit')
      env.sfx.hit()
    }
    watch.textContent = `${fmt(Math.min(p, 1) * measured)} s`
  }

  const updateDial = () => {
    dial.textContent = `Marker set at ${km(Number(slider.value))} km`
  }

  const land = () => {
    phase = 'measured'
    pulse.hidden = true
    beam.hidden = true
    // The Moon goes dark: from here on the only thing the player has is the
    // stopwatch reading, so the answer cannot be found by looking at a sprite.
    moon.hidden = true
    env.sfx.echo()
    watch.textContent = `${fmt(measured)} s`
    tools.hidden = false
    updateDial()
    say(COPY.l1.measured(fmt(measured), km(C_KM_S)))
  }

  fire.addEventListener('click', () => {
    if (phase === 'flying' || phase === 'done') return
    env.sfx.fire()
    hitDone = false
    moon.classList.remove('is-hit')
    pulse.hidden = false
    beam.hidden = false
    if (env.reducedMotion) {
      land()
      return
    }
    phase = 'flying'
    t = 0
    say(COPY.l1.flying)
  })

  slider.addEventListener('input', updateDial)

  check.addEventListener('click', () => {
    if (phase !== 'measured') return
    const v = Number(slider.value)
    const r = judgeEcho(v, measured)
    const left = env.judge(r.verdict === 'match')
    if (r.verdict === 'match') {
      env.sfx.ok()
      phase = 'done'
      slider.disabled = true
      check.disabled = true
      fire.disabled = true
      say(COPY.l1.ok, 'ok')
      env.finish(COPY.l1.recap(fmt(measured), km(C_KM_S), km(Math.round(distanceFromEcho(measured) / 1000) * 1000)))
      return
    }
    if (left === 0) return // the scene has already ended the level as failed
    env.sfx.bad()
    const real = fmt(measured)
    const dir = r.verdict === 'too-short' ? COPY.l1.tooShort(real) : COPY.l1.tooLong(real)
    say(`${dir} ${COPY.attemptsLeft(left)}`, 'bad')
  })

  return {
    tick(dt) {
      if (phase !== 'flying') return
      t += dt
      const p = t / tripMs
      if (p >= 1) {
        show(1)
        land()
        return
      }
      show(p)
    },
  }
}
