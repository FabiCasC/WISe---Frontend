import { COPY } from './copy'
import { Glide, el, fmt, type Env, type LevelRun } from './dom'
import { LEVEL1_MEASURED_ECHO_S } from './levels'
import { distanceFromEcho, echoSeconds, judgeEcho } from './rules'

/** The bar represents from 0 to 500,000 km. */
const BAR_MAX_KM = 500_000
/** The journey appears 4 times slower than real time. */
const SLOWMO = 4

export function buildLevel1(env: Env): LevelRun {
  const measured = LEVEL1_MEASURED_ECHO_S
  const moonFrac = distanceFromEcho(measured) / BAR_MAX_KM
  const tripMs = measured * 1000 * SLOWMO

  let phase: 'idle' | 'flying' | 'measured' | 'done' = 'idle'
  let t = 0
  let hitDone = false

  const root = el('div', 'ls-l1')

  // ── Track: Earth · bar · Moon ──
  const track = el('div', 'ls-track')
  const rail = el('div', 'ls-rail')
  const earth = el('span', 'ls-earth')
  earth.setAttribute('aria-label', 'Earth')
  const moon = el('span', 'ls-moon')
  moon.setAttribute('aria-label', 'Moon')
  moon.style.left = `${moonFrac * 100}%`
  const beam = el('span', 'ls-beam')
  const pulse = el('span', 'ls-pulse')
  pulse.hidden = true
  const marker = el('span', 'ls-marker')
  marker.hidden = true
  rail.append(el('span', 'ls-line'), beam, earth, moon, pulse, marker)
  track.append(rail)

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
  slider.max = String(BAR_MAX_KM)
  slider.step = '500'
  slider.value = '100000'
  slider.setAttribute('aria-label', 'Distance marker')

  const markerEcho = el('p', 'ls-readout')
  const echoGlide = new Glide(
    (v) => { markerEcho.textContent = `Marker echo: ${fmt(v)} s` },
    90,
    env.reducedMotion,
    echoSeconds(Number(slider.value)),
  )
  const check = el('button', 'btn btn--primary', 'Mark Distance')
  check.type = 'button'

  const tools = el('div', 'ls-tools')
  tools.hidden = true
  tools.append(slider, markerEcho, check)

  const msg = el('p', 'ls-msg', COPY.l1.idle)
  msg.setAttribute('role', 'status')

  root.append(track, watchWrap, fire, tools, msg)
  env.stage.append(root)

  const say = (text: string, tone: '' | 'ok' | 'bad' = '') => {
    msg.textContent = text
    msg.className = `ls-msg${tone ? ` is-${tone}` : ''}`
  }

  const show = (p: number) => {
    const out = p < 0.5 ? p * 2 : (1 - p) * 2 // 0 → 1 → 0
    pulse.style.left = `${out * moonFrac * 100}%`
    beam.style.width = `${out * moonFrac * 100}%`
    pulse.classList.toggle('is-back', p > 0.5)
    if (p >= 0.5 && !hitDone) {
      hitDone = true
      moon.classList.add('is-hit')
      env.sfx.hit()
    }
    watch.textContent = `${fmt(Math.min(p, 1) * measured)} s`
  }

  const updateMarker = (snap = false) => {
    const v = Number(slider.value)
    marker.style.left = `${(v / BAR_MAX_KM) * 100}%`
    echoGlide.to(echoSeconds(v), snap)
  }

  const land = () => {
    phase = 'measured'
    pulse.hidden = true
    beam.hidden = true
    env.sfx.echo()
    watch.textContent = `${fmt(measured)} s`
    tools.hidden = false
    marker.hidden = false
    updateMarker(true)
    say(COPY.l1.measured(fmt(measured)))
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

  slider.addEventListener('input', () => updateMarker())

  check.addEventListener('click', () => {
    if (phase !== 'measured') return
    const v = Number(slider.value)
    const r = judgeEcho(v, measured)
    env.judge(r.verdict === 'match')
    if (r.verdict === 'match') {
      env.sfx.ok()
      marker.classList.add('is-locked')
      phase = 'done'
      slider.disabled = true
      check.disabled = true
      fire.disabled = true
      say(COPY.l1.ok, 'ok')
      const km = (Math.round(distanceFromEcho(measured) / 1000) * 1000).toLocaleString('en')
      env.finish(COPY.l1.conclusion(km))
      return
    }
    env.sfx.bad()
    const mine = fmt(r.markerEchoSeconds)
    const real = fmt(measured)
    say(
      r.verdict === 'too-short' ? COPY.l1.tooShort(mine, real) : COPY.l1.tooLong(mine, real),
      'bad',
    )
  })

  return {
    tick(dt) {
      echoGlide.tick(dt)
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