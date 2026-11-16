import { COPY } from './copy'
import { Glide, approach, el, fmt, sv, type Env, type LevelRun } from './dom'
import {
  candidates, circlesCross, correctRadius, judgeCircle, judgeMarks,
  radiusFromDelay, readings, type QuakeDef, type Vec,
} from './rules'

/**
 * Level 2 ('guided'): one station, then two, then three.
 * Level 3 ('free'): no guidance; one station does not work and the child must
 * decide whether what is available is enough to locate the quake.
 */
export type QuakeMode = 'guided' | 'free'

const GRAPH_W = 200
const GRAPH_H = 64
const GRAPH_SECONDS = 10
const P_TIME = 1.5
/** The finale waves travel this many times faster than the map units/s. */
const WAVE_SPEEDUP = 3

export function buildQuakeLevel(env: Env, q: QuakeDef, mode: QuakeMode): LevelRun {
  const guided = mode === 'guided'
  const delays = new Map<string, number>(readings(q).map((r) => [r.stationId, r.delay]))
  const unitsPerSecond = radiusFromDelay(1, q.vp, q.vs)
  const order = q.stations.filter((s) => s.working).map((s) => s.id)
  const posOf = (id: string): Vec => q.stations.find((s) => s.id === id)!.pos

  const confirmed = new Map<string, number>() // station → exact radius
  let selected = order[0]
  /** Level 3: every place the player claims the quake could be. */
  let marks: Vec[] = []
  let answersOn = false
  let done = false

  // Animated pieces (persistent elements that glide instead of being redrawn).
  const circleEls = new Map<string, SVGCircleElement>()
  const circleR = new Map<string, number>()
  const circleTarget = new Map<string, number>()
  let preview: SVGCircleElement | null = null
  let waves: { t: number; p: SVGCircleElement; s: SVGCircleElement } | null = null

  const root = el('div', 'ls-quake')

  // ───────────────────────── Map ─────────────────────────
  const map = sv('svg', {
    viewBox: '0 0 100 100',
    class: 'ls-map',
    role: 'img',
    'aria-label': 'Map of the Moon with seismic stations',
  })
  sv('rect', { x: 0, y: 0, width: 100, height: 100, rx: 4, class: 'ls-map__bg' }, map)
  for (const [cx, cy, r] of [[18, 22, 6], [78, 14, 4], [88, 82, 7], [30, 90, 3]] as const) {
    sv('circle', { cx, cy, r, class: 'ls-map__crater' }, map)
  }
  const circlesLayer = sv('g', {}, map)
  const wavesLayer = sv('g', {}, map)
  const pointsLayer = sv('g', {}, map)
  const stationsLayer = sv('g', {}, map)
  const pickLayer = sv('g', {}, map)

  for (const s of q.stations) {
    const g = sv('g', { class: `ls-station${s.working ? '' : ' is-dead'}` }, stationsLayer)
    sv('circle', { cx: s.pos.x, cy: s.pos.y, r: 2.2 }, g)
    const label = sv('text', { x: s.pos.x + 3.4, y: s.pos.y + 1.2 }, g)
    label.textContent = s.working ? s.id : `${s.id} · no signal`
    env.name(g, COPY.names.station(s.id, s.working))
  }

  // ───────────────────────── Panel ─────────────────────────
  const panel = el('div', 'ls-panel')

  const tabsRow = el('div', 'ls-tabs')
  tabsRow.setAttribute('role', 'group')
  tabsRow.setAttribute('aria-label', 'Stations')
  const tabs = new Map<string, HTMLButtonElement>()
  for (const s of q.stations) {
    const b = el('button', 'ls-tab', s.working ? `Station ${s.id}` : `${s.id} · no signal`)
    b.type = 'button'
    tabs.set(s.id, b)
    tabsRow.append(b)
  }

  const graph = sv('svg', {
    viewBox: `0 0 ${GRAPH_W} ${GRAPH_H}`,
    class: 'ls-graph',
    role: 'img',
    'aria-label': 'Vibration graph of the station',
  })
  env.name(graph, COPY.names.graph)
  const delayText = el('p', 'ls-readout')
  const legend = el('p', 'ls-note', `1 second of delay equals ${fmt(unitsPerSecond, 1)} map units.`)

  const slider = el('input', 'ls-slider')
  slider.type = 'range'
  slider.min = '0'
  slider.max = '100'
  slider.step = '0.5'
  slider.value = '10'
  slider.setAttribute('aria-label', 'Circle radius')
  const radiusText = el('p', 'ls-readout')
  const delayGlide = new Glide(
    (v) => { delayText.textContent = `Delay between the P wave and the S wave: ${fmt(v, 1)} s` },
    220,
    env.reducedMotion,
    0,
  )
  const radiusGlide = new Glide(
    (v) => { radiusText.textContent = `Radius: ${fmt(v, 1)} units` },
    80,
    env.reducedMotion,
    Number(slider.value),
  )
  const check = el('button', 'btn btn--primary', 'Check Circle')
  check.type = 'button'

  const msg = el('p', 'ls-msg', guided ? COPY.l2.start : COPY.l3.start)
  msg.setAttribute('role', 'status')

  panel.append(tabsRow, graph, delayText, legend, slider, radiusText, check)

  // Final answer (level 3 only). There is no "not enough" button to press:
  // the player states that two stations are not enough by MARKING every place
  // the two circles still allow. One mark is an incomplete answer.
  const submit = el('button', 'btn btn--primary', 'Submit Marks')
  submit.type = 'button'
  submit.disabled = true
  const clear = el('button', 'btn btn--ghost', 'Clear Marks')
  clear.type = 'button'
  clear.disabled = true
  const marksText = el('p', 'ls-readout')
  if (!guided) {
    const answer = el('div', 'ls-answer')
    answer.append(submit, clear)
    panel.append(marksText, answer)
  }
  panel.append(msg)

  root.append(map, panel)
  env.stage.append(root)

  // ───────────────────────── Drawing ─────────────────────────
  const say = (text: string, tone: '' | 'ok' | 'bad' = '') => {
    msg.textContent = text
    msg.className = `ls-msg${tone ? ` is-${tone}` : ''}`
  }

  const drawPoints = (points: Vec[], cls: string) => {
    pointsLayer.replaceChildren()
    for (const p of points) {
      const dot = sv('circle', { cx: p.x, cy: p.y, r: 2.4, class: cls }, pointsLayer)
      env.name(dot, cls.includes('is-final') ? COPY.names.quakeSpot : COPY.names.spot)
    }
  }

  const drawGraph = (id: string) => {
    graph.replaceChildren()
    const delay = delays.get(id)
    if (delay === undefined) return
    const px = GRAPH_W / GRAPH_SECONDS
    const tS = P_TIME + delay
    let d = ''
    for (let x = 0; x <= GRAPH_W; x++) {
      const t = x / px
      let a = 0.8 * Math.sin(x * 1.7)
      if (t >= P_TIME) a += 9 * Math.exp(-(t - P_TIME) * 1.2) * Math.sin((t - P_TIME) * 38)
      if (t >= tS) a += 20 * Math.exp(-(t - tS) * 0.5) * Math.sin((t - tS) * 24)
      d += `${x === 0 ? 'M' : 'L'}${x} ${(GRAPH_H / 2 - 4 - a).toFixed(2)}`
    }
    sv('path', { d, pathLength: 1, class: 'ls-graph__trace' }, graph)
    for (let s = 0; s < GRAPH_SECONDS; s++) {
      sv('line', { x1: s * px, x2: s * px, y1: GRAPH_H - 8, y2: GRAPH_H - 4, class: 'ls-graph__tick' }, graph)
      const tt = sv('text', { x: s * px + 1, y: GRAPH_H - 0.5, class: 'ls-graph__num' }, graph)
      tt.textContent = String(s)
    }
    for (const [t, name] of [[P_TIME, 'P'], [tS, 'S']] as const) {
      sv('line', { x1: t * px, x2: t * px, y1: 2, y2: GRAPH_H - 8, class: 'ls-graph__mark' }, graph)
      const tx = sv('text', { x: t * px + 2, y: 9, class: 'ls-graph__label' }, graph)
      tx.textContent = name
    }
    delayGlide.to(delay)
  }

  const drawCircles = () => {
    for (const s of q.stations) {
      if (!s.working) continue
      let c = circleEls.get(s.id)
      if (!c) {
        c = sv('circle', { cx: s.pos.x, cy: s.pos.y, r: 0, class: 'ls-circle' }, circlesLayer)
        circleEls.set(s.id, c)
        circleR.set(s.id, 0)
      }
      const exact = confirmed.get(s.id)
      c.style.display = exact === undefined ? 'none' : ''
      if (exact !== undefined) {
        circleTarget.set(s.id, exact)
        if (env.reducedMotion) {
          circleR.set(s.id, exact)
          c.setAttribute('r', String(exact))
        }
      }
    }
    if (!preview) preview = sv('circle', { cx: 0, cy: 0, r: 0, class: 'ls-circle is-preview' }, circlesLayer)
    const showPreview = !done && !confirmed.has(selected)
    preview.style.display = showPreview ? '' : 'none'
    if (showPreview) {
      const p = posOf(selected)
      preview.setAttribute('cx', String(p.x))
      preview.setAttribute('cy', String(p.y))
      preview.setAttribute('r', slider.value)
    }
  }

  /** Finale: P and S waves spread from the epicenter; P (faster) arrives first. */
  const startWaves = () => {
    if (env.reducedMotion) return
    wavesLayer.replaceChildren()
    const e = q.epicenter
    waves = {
      t: 0,
      p: sv('circle', { cx: e.x, cy: e.y, r: 0, class: 'ls-wave ls-wave--p' }, wavesLayer),
      s: sv('circle', { cx: e.x, cy: e.y, r: 0, class: 'ls-wave ls-wave--s' }, wavesLayer),
    }
    env.sfx.quake()
  }

  const drawPick = () => {
    pickLayer.replaceChildren()
    for (const m of marks) {
      const pick = sv('circle', { cx: m.x, cy: m.y, r: 2, class: 'ls-pick' }, pickLayer)
      env.name(pick, COPY.names.mark)
    }
  }

  const refresh = () => {
    for (const s of q.stations) {
      const b = tabs.get(s.id)!
      const idx = order.indexOf(s.id)
      b.disabled = !s.working || (guided && idx > confirmed.size)
      b.classList.toggle('is-on', s.id === selected)
      b.classList.toggle('is-done', confirmed.has(s.id))
    }
    const locked = done || confirmed.has(selected)
    slider.disabled = locked
    check.disabled = locked
    radiusGlide.to(Number(slider.value))
    drawGraph(selected)
    drawCircles()
    if (!guided) {
      submit.disabled = !answersOn || done || marks.length === 0
      clear.disabled = !answersOn || done || marks.length === 0
      marksText.textContent = answersOn
        ? marks.length === 0
          ? COPY.l3.marksHint
          : `Marks placed: ${marks.length}`
        : ''
    }
  }

  // ───────────────────────── Interaction ─────────────────────────
  for (const [id, b] of tabs) {
    b.addEventListener('click', () => {
      env.sfx.select()
      selected = id
      refresh()
    })
  }

  slider.addEventListener('input', () => {
    radiusGlide.to(Number(slider.value))
    drawCircles()
  })

  const afterConfirm = () => {
    const ids = [...confirmed.keys()]
    const next = order.find((id) => !confirmed.has(id))
    if (next) selected = next

    if (guided) {
      const c = candidates(q, ids)
      if (c.kind === 'circle') say(COPY.l2.one, 'ok')
      else if (c.kind === 'two-points') {
        drawPoints(c.points, 'ls-dot')
        say(COPY.l2.two, 'ok')
      } else if (c.kind === 'one-point') {
        done = true
        drawPoints([q.epicenter], 'ls-dot is-final')
        refresh()
        startWaves()
        env.finish(COPY.l2.conclusion)
        return
      }
    } else if (confirmed.size === order.length) {
      answersOn = true
      say(COPY.l3.ready, 'ok')
    } else {
      say('')
    }
    refresh()
  }

  check.addEventListener('click', () => {
    if (done || confirmed.has(selected)) return
    const val = Number(slider.value)
    const verdict = judgeCircle(q, selected, val)
    const ok = verdict === 'ok'
    const left = env.judge(ok)
    if (ok) {
      env.sfx.ok()
      confirmed.set(selected, correctRadius(q, selected))
      drawCircles()
      circleR.set(selected, val) // the circle grows from the player's radius to the exact one
      circleEls.get(selected)?.setAttribute('r', String(val))
      afterConfirm()
      return
    }
    if (left === 0) return // the scene has already ended the level as failed
    env.sfx.bad()
    if (!guided) {
      say(`${COPY.l3.mismatch} ${COPY.attemptsLeft(left)}`, 'bad')
      return
    }
    const apart = [...confirmed].find(([id, r]) => !circlesCross(posOf(id), r, posOf(selected), val))
    const why = apart
      ? COPY.l2.noCross(apart[0])
      : verdict === 'too-small'
        ? COPY.l2.small
        : COPY.l2.big
    say(`${why} ${COPY.attemptsLeft(left)}`, 'bad')
  })

  // Level 3: each tap adds one more place the quake could be.
  map.addEventListener('pointerdown', (e: PointerEvent) => {
    if (guided || !answersOn || done) return
    const r = map.getBoundingClientRect()
    marks = [...marks, {
      x: Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)),
    }]
    env.sfx.select()
    drawPick()
    refresh()
  })

  clear.addEventListener('click', () => {
    if (done) return
    marks = []
    env.sfx.select()
    drawPick()
    refresh()
  })

  submit.addEventListener('click', () => {
    if (done || marks.length === 0) return
    const verdict = judgeMarks(q, order, marks)
    if (verdict === 'none') {
      say(COPY.l3.needMarks, 'bad')
      return
    }
    const left = env.judge(verdict === 'complete')
    if (verdict === 'complete') {
      done = true
      pickLayer.replaceChildren()
      drawPoints(candidates(q, order).points, 'ls-dot is-ghost')
      refresh()
      env.finish(COPY.l3.conclusion)
      return
    }
    if (left === 0) return // the scene has already ended the level as failed
    env.sfx.bad()
    const why = verdict === 'incomplete' ? COPY.l3.incomplete : COPY.l3.wrongMarks
    say(`${why} ${COPY.attemptsLeft(left)}`, 'bad')
  })

  refresh()
  if (!env.reducedMotion) {
    map.classList.add('is-quake') // the quake shakes the map once on arrival
    env.sfx.quake()
  }

  return {
    tick(dt) {
      delayGlide.tick(dt)
      radiusGlide.tick(dt)
      for (const [id, target] of circleTarget) {
        const cur = circleR.get(id) ?? 0
        const next = approach(cur, target, dt, 110, 0.05)
        if (next !== cur) {
          circleR.set(id, next)
          circleEls.get(id)?.setAttribute('r', String(next))
        }
      }
      if (waves) {
        waves.t += dt / 1000
        const pr = q.vp * WAVE_SPEEDUP * waves.t
        const sr = q.vs * WAVE_SPEEDUP * waves.t
        waves.p.setAttribute('r', String(pr))
        waves.s.setAttribute('r', String(sr))
        waves.p.style.opacity = String(Math.max(0, 1 - pr / 110))
        waves.s.style.opacity = String(Math.max(0, 1 - sr / 110))
        if (sr >= 110) {
          wavesLayer.replaceChildren()
          waves = null
        }
      }
    },
  }
}
