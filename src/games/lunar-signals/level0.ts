import { COPY } from './copy'
import { approach, el, fmt, sv, type Env, type LevelRun } from './dom'
import { circleIntersections, dist, spDelay, type Vec } from './rules'

/**
 * Level 0 · Practice Run.
 * A short mission briefing, then four mini-lessons guided by Ping the robot:
 *   1. An echo with sound  → "there AND back", so distance = speed × time ÷ 2
 *   2. The same with light → the Moon laser idea of Level 1
 *   3. P and S waves       → the gap between them tells how far a quake was
 *   4. Circles             → three stations pin down one point (Levels 2 and 3)
 * It never calls env.judge(): practice has no attempts, no score and no
 * decisions, so it cannot change the player's results.
 */

/** Practice is learned by doing: a slider the player sets and the game tests. No multiple choice. */
interface SliderTask {
  prompt: string
  min: number
  max: number
  step: number
  start: number
  show(v: number): string
  check(v: number): { ok: boolean; text: string }
}
type Tone = '' | 'ok'

interface StepApi {
  scene: HTMLElement
  say(text: string, tone?: Tone): void
  task(t: SliderTask): void
  /** The lesson is done: unlocks "Next". */
  done(): void
}
/** A step builds its scene and may return a per-frame tick. */
type Step = (api: StepApi) => ((dtMs: number) => void) | undefined

/** Ping the robot guide (pure SVG, no image files). */
function pingAvatar(): SVGSVGElement {
  const s = sv('svg', { viewBox: '0 0 60 60', class: 'ls-ping', role: 'img', 'aria-label': 'Ping, your robot guide' })
  sv('line', { x1: 30, y1: 7, x2: 30, y2: 15, class: 'ls-ping__ant' }, s)
  sv('circle', { cx: 30, cy: 5, r: 3.2, class: 'ls-ping__bulb' }, s)
  sv('rect', { x: 9, y: 15, width: 42, height: 36, rx: 13, class: 'ls-ping__head' }, s)
  sv('circle', { cx: 22, cy: 31, r: 4.6, class: 'ls-ping__eye' }, s)
  sv('circle', { cx: 38, cy: 31, r: 4.6, class: 'ls-ping__eye' }, s)
  sv('path', { d: 'M21 41 Q30 48 39 41', class: 'ls-ping__smile' }, s)
  return s
}

// ───────────────────────── Echo rig (lessons 1 and 2) ─────────────────────────

interface RigOpts {
  left: { cls: string; name: string }
  right: { cls: string; name: string }
  pulseName: string
  fireLabel: string
  note: string
  /** Echo time shown on the stopwatch, and the real duration of the trip. */
  seconds: number
  onLanded: () => void
}

/** A tiny "fire, wait for the echo" track. Returns its per-frame tick. */
function echoRig(env: Env, scene: HTMLElement, o: RigOpts): (dtMs: number) => void {
  const tripMs = o.seconds * 1000
  let phase: 'idle' | 'flying' = 'idle'
  let t = 0
  let hit = false

  const track = el('div', 'ls-track')
  const rail = el('div', 'ls-rail')
  const left = el('span', o.left.cls)
  const right = el('span', o.right.cls)
  const beam = el('span', 'ls-beam')
  const pulse = el('span', 'ls-pulse')
  pulse.hidden = true
  rail.append(el('span', 'ls-line'), beam, left, right, pulse)
  track.append(rail, el('p', 'ls-note', o.note))
  env.name(left, o.left.name)
  env.name(right, o.right.name)
  env.name(pulse, o.pulseName)

  const watchWrap = el('div', 'ls-watch')
  const watch = el('span', 'ls-watch__value', '0.00 s')
  watchWrap.append(el('span', 'ls-watch__label', COPY.names.stopwatch), watch)
  env.name(watchWrap, COPY.names.stopwatch)

  const fire = el('button', 'btn btn--primary', o.fireLabel)
  fire.type = 'button'
  scene.append(track, watchWrap, fire)

  const show = (p: number) => {
    const out = p < 0.5 ? p * 2 : (1 - p) * 2 // 0 → 1 → 0
    pulse.style.left = `${out * 100}%`
    beam.style.width = `${out * 100}%`
    pulse.classList.toggle('is-back', p > 0.5)
    if (p >= 0.5 && !hit) {
      hit = true
      right.classList.add('is-hit')
      env.sfx.hit()
    }
    watch.textContent = `${fmt(Math.min(p, 1) * o.seconds)} s`
  }

  const land = () => {
    phase = 'idle'
    pulse.hidden = true
    beam.hidden = true
    watch.textContent = `${fmt(o.seconds)} s`
    env.sfx.echo()
    o.onLanded()
  }

  fire.addEventListener('click', () => {
    if (phase === 'flying') return
    env.sfx.fire()
    hit = false
    right.classList.remove('is-hit')
    pulse.hidden = false
    beam.hidden = false
    if (env.reducedMotion) {
      show(1)
      land()
      return
    }
    phase = 'flying'
    t = 0
  })

  return (dt) => {
    if (phase !== 'flying') return
    t += dt
    const p = t / tripMs
    if (p >= 1) {
      show(1)
      land()
      return
    }
    show(p)
  }
}

// ───────────────────────── Level 0 ─────────────────────────

export function buildLevel0(env: Env, onFinish: () => void): LevelRun {
  let idx = -1
  let stepTick: ((dtMs: number) => void) | undefined

  const root = el('div', 'ls-l0')
  const top = el('div', 'ls-l0__top')
  const ping = pingAvatar()
  env.name(ping, COPY.names.ping)
  const bubble = el('p', 'ls-bubble')
  bubble.setAttribute('role', 'status')
  top.append(ping, bubble)

  const progress = el('p', 'ls-note')
  const scene = el('div', 'ls-l0__scene')
  const quiz = el('div', 'ls-l0__quiz')
  const bar = el('div', 'ls-l0__bar')
  const skip = el('button', 'btn btn--ghost', COPY.l0.skip)
  skip.type = 'button'
  const next = el('button', 'btn btn--primary', COPY.briefing.start)
  next.type = 'button'
  bar.append(skip, next)

  root.append(top, progress, scene, quiz, bar)
  env.stage.append(root)

  const say = (text: string, tone: Tone = '') => {
    env.decorate(bubble, text)
    bubble.className = `ls-bubble${tone ? ` is-${tone}` : ''}`
  }

  /** A slider the player sets and tests. A wrong test costs nothing; a right one unlocks "Next". */
  const task = (t: SliderTask) => {
    quiz.replaceChildren()
    const prompt = el('p', 'ls-question')
    env.decorate(prompt, t.prompt)
    const slider = el('input', 'ls-slider')
    slider.type = 'range'
    slider.min = String(t.min)
    slider.max = String(t.max)
    slider.step = String(t.step)
    slider.value = String(t.start)
    slider.setAttribute('aria-label', 'Practice marker')
    const readout = el('p', 'ls-readout', t.show(t.start))
    slider.addEventListener('input', () => {
      readout.textContent = t.show(Number(slider.value))
    })
    const test = el('button', 'btn btn--primary', 'Test my marker')
    test.type = 'button'
    test.addEventListener('click', () => {
      const r = t.check(Number(slider.value))
      say(r.text, r.ok ? 'ok' : '')
      if (r.ok) {
        env.sfx.ok()
        slider.disabled = true
        test.disabled = true
        next.disabled = false
      } else env.sfx.bad()
    })
    quiz.append(prompt, slider, readout, test)
  }
  const done = () => {
    next.disabled = false
  }

  const api: StepApi = { scene, say, task, done }

  // ── Lesson 1: an echo with sound ──
  const soundStep: Step = (a) => {
    a.say(COPY.l0.sound.intro)
    let asked = false
    return echoRig(env, a.scene, {
      left: { cls: 'ls-you', name: COPY.names.you },
      right: { cls: 'ls-cliff', name: COPY.names.cliff },
      pulseName: COPY.names.shout,
      fireLabel: COPY.l0.sound.shout,
      note: COPY.l0.sound.note,
      seconds: 3,
      onLanded: () => {
        if (asked) return
        asked = true
        a.say(COPY.l0.sound.landed)
        a.task({
          prompt: COPY.l0.sound.task,
          min: 0, max: 1500, step: 10, start: 200,
          show: (v) => `Cliff marker at ${v} m`,
          check: (v) => {
            const echo = (2 * v) / 340
            if (Math.abs(echo - COPY.l0.sound.target) <= 0.1) return { ok: true, text: COPY.l0.sound.ok }
            return { ok: false, text: echo < COPY.l0.sound.target ? COPY.l0.sound.near(fmt(echo, 1)) : COPY.l0.sound.far(fmt(echo, 1)) }
          },
        })
      },
    })
  }

  // ── Lesson 2: the same trick with light ──
  const lightStep: Step = (a) => {
    a.say(COPY.l0.light.intro)
    let asked = false
    return echoRig(env, a.scene, {
      left: { cls: 'ls-earth', name: COPY.names.earth },
      right: { cls: 'ls-moon', name: COPY.names.practiceMoon },
      pulseName: COPY.names.practicePulse,
      fireLabel: COPY.l0.light.fire,
      note: COPY.l0.light.note,
      seconds: 1,
      onLanded: () => {
        if (asked) return
        asked = true
        a.say(COPY.l0.light.landed)
        a.task({
          prompt: COPY.l0.light.task,
          min: 0, max: 600000, step: 5000, start: 50000,
          show: (v) => `Moon marker at ${v.toLocaleString('en-US')} km`,
          check: (v) => {
            const echo = (2 * v) / 299_792
            if (Math.abs(echo - COPY.l0.light.target) <= 0.05) return { ok: true, text: COPY.l0.light.ok }
            return { ok: false, text: echo < COPY.l0.light.target ? COPY.l0.light.near(fmt(echo, 2)) : COPY.l0.light.far(fmt(echo, 2)) }
          },
        })
      },
    })
  }

  // ── Lesson 3: the runner (P) and the walker (S) ──
  const wavesStep: Step = (a) => {
    const VP = 10
    const VS = 5.5
    const SPEEDUP = 4
    const EPI: Vec = { x: 10, y: 25 }
    a.say(COPY.l0.waves.intro)
    a.scene.dataset.step = 'waves'

    const svg = sv('svg', { viewBox: '0 0 100 50', class: 'ls-wavemap', role: 'img', 'aria-label': COPY.l0.waves.aria })
    sv('rect', { x: 0, y: 0, width: 100, height: 50, rx: 4, class: 'ls-map__bg' }, svg)
    const wavesLayer = sv('g', {}, svg)
    const epi = sv('circle', { cx: EPI.x, cy: EPI.y, r: 2.4, class: 'ls-dot' }, svg)
    const epiLabel = sv('text', { x: EPI.x, y: EPI.y - 5, class: 'ls-wavetext ls-wavetext--free' }, svg)
    epiLabel.textContent = COPY.l0.waves.quake
    env.name(epi, COPY.names.epicenter)

    interface Slot {
      x: number
      d: number
      pLine: SVGTextElement
      sLine: SVGTextElement
      gapLine: SVGTextElement
      pDone: boolean
      sDone: boolean
    }
    const slots: Slot[] = [
      { x: 38, label: COPY.l0.waves.near },
      { x: 82, label: COPY.l0.waves.far },
    ].map(({ x, label }) => {
      const g = sv('g', { class: 'ls-station' }, svg)
      sv('circle', { cx: x, cy: EPI.y, r: 2.2 }, g)
      sv('text', { x, y: EPI.y - 5, class: 'ls-wavetext' }, g).textContent = label
      const pLine = sv('text', { x, y: EPI.y + 7, class: 'ls-wavetext ls-wavetext--p' }, g)
      const sLine = sv('text', { x, y: EPI.y + 11.5, class: 'ls-wavetext ls-wavetext--s' }, g)
      const gapLine = sv('text', { x, y: EPI.y + 16.5, class: 'ls-wavetext ls-wavetext--gap' }, g)
      env.name(g, label)
      return { x, d: Math.abs(x - EPI.x), pLine, sLine, gapLine, pDone: false, sDone: false }
    })

    const button = el('button', 'btn btn--primary', COPY.l0.waves.button)
    button.type = 'button'
    const quakeSlider = el('input', 'ls-slider')
    quakeSlider.type = 'range'
    quakeSlider.min = '5'
    quakeSlider.max = '95'
    quakeSlider.step = '1'
    quakeSlider.value = String(EPI.x)
    quakeSlider.setAttribute('aria-label', 'Quake position')
    const placeQuake = () => {
      EPI.x = Number(quakeSlider.value)
      epi.setAttribute('cx', String(EPI.x))
      epiLabel.setAttribute('x', String(EPI.x))
    }
    quakeSlider.addEventListener('input', placeQuake)
    const taskText = el('p', 'ls-question')
    env.decorate(taskText, COPY.l0.waves.task)
    a.scene.append(svg, taskText, quakeSlider, button)

    let waves: { t: number; p: SVGCircleElement; s: SVGCircleElement } | null = null
    let asked = false

    const arriveP = (s: Slot) => {
      s.pDone = true
      s.pLine.textContent = COPY.l0.waves.pArrived
    }
    const arriveS = (s: Slot) => {
      s.sDone = true
      s.sLine.textContent = COPY.l0.waves.sArrived
      s.gapLine.textContent = COPY.l0.waves.gap(fmt(spDelay(s.d, VP, VS), 1))
    }
    const land = () => {
      if (asked) return
      const near = slots[0]
      const far = slots[1]
      if (near && far && far.d < near.d) {
        asked = true
        a.say(COPY.l0.waves.win, 'ok')
        env.sfx.ok()
        quakeSlider.disabled = true
        button.disabled = true
        a.done()
      } else {
        a.say(COPY.l0.waves.lose)
        env.sfx.bad()
      }
      waves = null
    }

    button.addEventListener('click', () => {
      if (waves) return
      placeQuake()
      for (const s of slots) {
        s.d = Math.abs(s.x - EPI.x)
        s.pDone = false
        s.sDone = false
        s.pLine.textContent = ''
        s.sLine.textContent = ''
        s.gapLine.textContent = ''
      }
      wavesLayer.replaceChildren()
      env.sfx.quake()
      if (env.reducedMotion) {
        for (const s of slots) {
          arriveP(s)
          arriveS(s)
        }
        land()
        return
      }
      waves = {
        t: 0,
        p: sv('circle', { cx: EPI.x, cy: EPI.y, r: 0, class: 'ls-wave ls-wave--p' }, wavesLayer),
        s: sv('circle', { cx: EPI.x, cy: EPI.y, r: 0, class: 'ls-wave ls-wave--s' }, wavesLayer),
      }
    })

    return (dt) => {
      if (!waves) return
      waves.t += dt / 1000
      const pr = VP * SPEEDUP * waves.t
      const sr = VS * SPEEDUP * waves.t
      waves.p.setAttribute('r', String(pr))
      waves.s.setAttribute('r', String(sr))
      waves.p.style.opacity = String(Math.max(0.25, 1 - pr / 110))
      waves.s.style.opacity = String(Math.max(0.25, 1 - sr / 110))
      for (const s of slots) {
        if (!s.pDone && pr >= s.d) {
          arriveP(s)
          env.sfx.select()
        }
        if (!s.sDone && sr >= s.d) {
          arriveS(s)
          env.sfx.hit()
        }
      }
      if (slots.every((s) => s.sDone)) {
        wavesLayer.replaceChildren()
        waves = null
        land()
      }
    }
  }

  // ── Lesson 4: three circles, one point ──
  const circlesStep: Step = (a) => {
    const ST: { id: string; pos: Vec }[] = [
      { id: 'A', pos: { x: 25, y: 30 } },
      { id: 'B', pos: { x: 75, y: 35 } },
      { id: 'C', pos: { x: 50, y: 80 } },
    ]
    const QUAKE: Vec = { x: 55, y: 52 }
    const radii = ST.map((s) => dist(s.pos, QUAKE))
    a.say(COPY.l0.circles.intro)

    const svg = sv('svg', { viewBox: '0 0 100 100', class: 'ls-map ls-map--still', role: 'img', 'aria-label': COPY.l0.circles.aria })
    sv('rect', { x: 0, y: 0, width: 100, height: 100, rx: 4, class: 'ls-map__bg' }, svg)
    const circlesLayer = sv('g', {}, svg)
    const dotsLayer = sv('g', {}, svg)
    const stationsLayer = sv('g', {}, svg)
    const circleEls = ST.map((s) => sv('circle', { cx: s.pos.x, cy: s.pos.y, r: 0, class: 'ls-circle' }, circlesLayer))
    for (const s of ST) {
      const g = sv('g', { class: 'ls-station' }, stationsLayer)
      sv('circle', { cx: s.pos.x, cy: s.pos.y, r: 2.2 }, g)
      sv('text', { x: s.pos.x + 3.4, y: s.pos.y + 1.2 }, g).textContent = s.id
      env.name(g, COPY.names.station(s.id, true))
    }

    const button = el('button', 'btn btn--primary', COPY.l0.circles.button('A'))
    button.type = 'button'
    a.scene.append(svg, button)

    const cur = ST.map(() => 0)
    const target = ST.map(() => 0)
    let shown = 0
    let after: (() => void) | null = null

    const dot = (p: Vec, cls: string, name: string) => {
      const d = sv('circle', { cx: p.x, cy: p.y, r: 2.4, class: cls }, dotsLayer)
      env.name(d, name)
    }

    const onSettled = (i: number) => {
      if (i === 0) {
        a.say(COPY.l0.circles.one)
      } else if (i === 1) {
        const [pa, pb] = [ST[0], ST[1]]
        if (pa && pb) {
          for (const p of circleIntersections(pa.pos, radii[0] ?? 0, pb.pos, radii[1] ?? 0)) {
            dot(p, 'ls-dot', COPY.names.spot)
          }
        }
        a.say(COPY.l0.circles.two)
      } else {
        dotsLayer.replaceChildren()
        dot(QUAKE, 'ls-dot is-final', COPY.names.quakeSpot)
        if (!env.reducedMotion) svg.classList.add('is-quake')
        env.sfx.ok()
        a.say(COPY.l0.circles.three, 'ok')
        a.say(COPY.l0.circles.ready, 'ok')
        a.done()
        button.textContent = COPY.l0.circles.done
        return
      }
      const nextStation = ST[i + 1]
      button.textContent = COPY.l0.circles.button(nextStation ? nextStation.id : '')
      button.disabled = false
    }

    button.addEventListener('click', () => {
      if (shown >= ST.length || after) return
      const i = shown
      shown += 1
      env.sfx.select()
      button.disabled = true
      target[i] = radii[i] ?? 0
      if (env.reducedMotion) {
        cur[i] = target[i] ?? 0
        circleEls[i]?.setAttribute('r', String(cur[i]))
      }
      after = () => onSettled(i)
    })

    return (dt) => {
      for (let i = 0; i < ST.length; i++) {
        const c = cur[i] ?? 0
        const n = approach(c, target[i] ?? 0, dt, 110, 0.05)
        if (n !== c) {
          cur[i] = n
          circleEls[i]?.setAttribute('r', String(n))
        }
      }
      if (after && cur.every((c, k) => c === target[k])) {
        const run = after
        after = null
        run()
      }
    }
  }

  const STEPS: Step[] = [soundStep, lightStep, wavesStep, circlesStep]

  /** Mission briefing: the short "why should I care" before any rules. */
  const briefing = () => {
    progress.textContent = ''
    next.disabled = false
    next.textContent = COPY.briefing.start
    say(COPY.briefing.ping)
    const list = el('div', 'ls-brief')
    list.append(el('h3', 'ls-brief__title', COPY.briefing.title))
    for (const c of COPY.briefing.cards) {
      const card = el('div', 'ls-brief__card')
      const icon = el('span', 'ls-brief__icon', c.icon)
      icon.setAttribute('aria-hidden', 'true')
      card.append(icon, el('span', '', c.text))
      list.append(card)
    }
    scene.append(list)
  }

  const go = (n: number) => {
    idx = n
    scene.replaceChildren()
    quiz.replaceChildren()
    stepTick = undefined
    if (n < 0) {
      briefing()
      return
    }
    const step = STEPS[n]
    if (!step) {
      onFinish()
      return
    }
    progress.textContent = COPY.l0.stepOf(n + 1, STEPS.length)
    next.disabled = true
    next.textContent = n === STEPS.length - 1 ? COPY.l0.finish : COPY.l0.next
    stepTick = step(api)
  }

  next.addEventListener('click', () => {
    env.sfx.select()
    go(idx + 1)
  })
  skip.addEventListener('click', () => onFinish())

  go(-1)

  return {
    tick(dt) {
      stepTick?.(dt)
    },
  }
}
