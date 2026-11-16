import type { Sfx } from './sound'

/** Minimal DOM/SVG utilities and the contract between the scene and each level. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = '',
  text?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text !== undefined) n.textContent = text
  return n
}

const SVG_NS = 'http://www.w3.org/2000/svg'

export function sv<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v))
  parent?.append(n)
  return n
}

/** Number with a decimal point (English UI). */
export const fmt = (n: number, decimals = 2): string => n.toFixed(decimals)

/**
 * Moves `cur` toward `target` with exponential smoothing, so numbers (and their
 * decimals) advance little by little instead of jumping. Snaps when very close.
 */
export function approach(cur: number, target: number, dtMs: number, tauMs: number, eps = 0.004): number {
  if (tauMs <= 0) return target
  const v = cur + (target - cur) * (1 - Math.exp(-dtMs / tauMs))
  return Math.abs(target - v) <= eps ? target : v
}

/** A readout whose number glides toward its target. With reduced motion it jumps. */
export class Glide {
  private value: number
  private target: number
  constructor(
    private readonly render: (v: number) => void,
    private readonly tauMs: number,
    private readonly reduced: boolean,
    start = 0,
  ) {
    this.value = start
    this.target = start
    render(start)
  }

  to(target: number, snap = false): void {
    this.target = target
    if (snap || this.reduced) {
      this.value = target
      this.render(target)
    }
  }

  tick(dtMs: number): void {
    if (this.value === this.target) return
    this.value = approach(this.value, this.target, dtMs, this.tauMs)
    this.render(this.value)
  }
}

/**
 * Little name labels: when the player touches an object, its name pops up next
 * to the finger for a moment and then goes away by itself.
 */
export interface NameTags {
  attach(target: Element, label: string): void
  dispose(): void
}

export function createNameTags(root: HTMLElement, showMs = 1400): NameTags {
  const tag = el('div', 'ls-nametag')
  tag.setAttribute('aria-hidden', 'true')
  tag.hidden = true
  root.append(tag)
  let timer: ReturnType<typeof setTimeout> | undefined

  const show = (label: string, e: PointerEvent) => {
    tag.textContent = label
    tag.hidden = false
    const box = root.getBoundingClientRect()
    const w = tag.offsetWidth
    const minX = root.scrollLeft + 4
    const maxX = Math.max(minX, root.scrollLeft + root.clientWidth - w - 4)
    const x = Math.min(maxX, Math.max(minX, e.clientX - box.left + root.scrollLeft - w / 2))
    const y = Math.max(root.scrollTop + 4, e.clientY - box.top + root.scrollTop - 46)
    tag.style.left = `${x}px`
    tag.style.top = `${y}px`
    // Restart the little pop-in animation each time.
    tag.style.animation = 'none'
    void tag.offsetWidth
    tag.style.animation = ''
    clearTimeout(timer)
    timer = setTimeout(() => {
      tag.hidden = true
    }, showMs)
  }

  return {
    attach(target, label) {
      target.addEventListener('pointerdown', (e) => show(label, e as PointerEvent))
    },
    dispose() {
      clearTimeout(timer)
      tag.remove()
    },
  }
}

/** What the scene offers to each level. */
export interface Env {
  stage: HTMLElement
  reducedMotion: boolean
  /** Sound effects (silent when volume is 0). */
  sfx: Sfx
  /**
   * Register an evaluated attempt and get back how many wrong answers are still
   * allowed. 0 means the scene has already ended the level as failed, so the
   * caller must stop touching the UI.
   */
  judge(correct: boolean): number
  /** The level has been solved: shows the recap (lines built from what the player did). */
  finish(lines: string[]): void
  /** Writes a text into host, underlining the technical words so they explain on tap. */
  decorate(host: HTMLElement, text: string): void
  /** Touch or click `target` and its name shows for a moment (see createNameTags). */
  name(target: Element, label: string): void
}

export interface LevelRun {
  /** Called every frame with ACTIVE ms (never paused). */
  tick?: (dtMs: number) => void
}