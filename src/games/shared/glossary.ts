// Underlined terms that explain themselves on tap, plus a help screen that lists
// them all. Plain DOM: it works over a Phaser canvas or a 2D canvas stage.
// Rule of the design: if a term cannot be explained in one line, it does not enter the game.

export interface Term {
  id: string
  /** How it reads on screen and in the help list. */
  name: string
  /** Pattern (no flags) that finds it inside a text. */
  pattern: string
  /** One line for someone who knows nothing about the topic. */
  text: string
}

export interface HelpSection {
  title: string
  items: { name: string; text: string }[]
}

export interface HelpOptions {
  title?: string
  /** Shown before the word list (for example what each tool does). */
  sections?: HelpSection[]
  closeLabel?: string
}

const CSS = `
.gl-term{all:unset;cursor:help;text-decoration:underline dotted currentColor;text-underline-offset:3px;color:inherit}
.gl-term:focus-visible{outline:2px solid #ffd25e;outline-offset:2px}
.gl-tip{position:absolute;pointer-events:auto;max-width:260px;padding:8px 10px;border-radius:10px;font-size:12.5px;
  line-height:1.35;background:#eef3ff;color:#0c101c;box-shadow:0 4px 16px rgba(0,0,0,.5);z-index:30;text-align:left}
.gl-tip b{display:block;margin-bottom:2px}
.gl-modal{position:absolute;inset:0;pointer-events:auto;background:rgba(6,9,18,.94);display:flex;
  align-items:flex-start;justify-content:center;overflow:auto;padding:14px;z-index:20;color:#eef3ff;font-family:system-ui,sans-serif}
.gl-card{width:100%;max-width:480px;border-radius:18px;padding:16px;background:#101830;
  border:2px solid #78e6a0;display:flex;flex-direction:column;gap:10px;margin:auto;text-align:left}
.gl-card--lose{border-color:#ffd25e}
.gl-card h2{margin:0;font-size:18px}
.gl-card p{margin:0;font-size:14px;line-height:1.5}
.gl-card ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.5}
.gl-actions{display:flex;gap:8px;flex-wrap:wrap}
.gl-btn{min-height:40px;padding:6px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.4);cursor:pointer;
  background:transparent;color:#eef3ff;font:inherit;font-weight:700}
.gl-btn--main{background:#78e6a0;color:#0c101c;border-color:#78e6a0}
.gl-help{position:absolute;top:8px;right:8px;z-index:15;width:36px;height:36px;border-radius:50%;cursor:pointer;
  border:2px solid #6de2f2;background:rgba(12,16,28,.92);color:#eef3ff;font:700 16px system-ui,sans-serif}
`

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

export function injectGlossaryStyles() {
  if (document.getElementById('gl-style')) return
  const st = el('style')
  st.id = 'gl-style'
  st.textContent = CSS
  document.head.append(st)
}

export interface Glossary {
  /** Writes a text into host, underlining each term once. */
  decorate(host: HTMLElement, text: string): void
  openHelp(opts?: HelpOptions): void
  /** Puts a card on top of everything inside root (help, recap). */
  showModal(card: HTMLElement, isHelp?: boolean): void
  closeModal(): void
  hasModal(): boolean
  destroy(): void
}

export function createGlossary(root: HTMLElement, terms: Term[]): Glossary {
  injectGlossaryStyles()
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative'
  let tip: HTMLElement | null = null
  let tipTimer: ReturnType<typeof setTimeout> | undefined
  let modal: HTMLElement | null = null
  const compiled = terms.map((t) => ({ t, re: new RegExp(t.pattern, 'i') }))

  const hideTip = () => {
    clearTimeout(tipTimer)
    tip?.remove()
    tip = null
  }
  const showTip = (id: string, anchor: HTMLElement) => {
    const t = terms.find((x) => x.id === id)
    if (!t) return
    hideTip()
    const box = el('div', 'gl-tip')
    box.setAttribute('role', 'status')
    box.append(el('b', undefined, t.name), t.text)
    root.append(box)
    const r = root.getBoundingClientRect()
    const a = anchor.getBoundingClientRect()
    const width = Math.min(260, r.width - 16)
    box.style.maxWidth = `${width}px`
    const x = Math.min(Math.max(8, a.left - r.left), Math.max(8, r.width - width - 8))
    const below = a.bottom - r.top + 6
    box.style.left = `${x}px`
    box.style.top = `${below + box.offsetHeight > r.height ? Math.max(8, a.top - r.top - box.offsetHeight - 6) : below}px`
    tip = box
    tipTimer = setTimeout(hideTip, 7000)
  }

  const onDown = (e: Event) => {
    if (tip && !(e.target as Element).closest('.gl-term, .gl-tip')) hideTip()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && modal?.dataset.help) closeModal()
  }
  root.addEventListener('pointerdown', onDown)
  document.addEventListener('keydown', onKey)

  function decorate(host: HTMLElement, text: string) {
    host.replaceChildren()
    const used = new Set<string>()
    let rest = text
    while (rest) {
      let best: { id: string; idx: number; len: number } | null = null
      for (const { t, re } of compiled) {
        if (used.has(t.id)) continue
        const m = re.exec(rest)
        if (m && m[0] && (!best || m.index < best.idx)) best = { id: t.id, idx: m.index, len: m[0].length }
      }
      if (!best) {
        host.append(rest)
        break
      }
      if (best.idx > 0) host.append(rest.slice(0, best.idx))
      const b = el('button', 'gl-term', rest.slice(best.idx, best.idx + best.len))
      b.type = 'button'
      const id = best.id
      b.addEventListener('click', (e) => {
        e.stopPropagation()
        showTip(id, b)
      })
      host.append(b)
      used.add(id)
      rest = rest.slice(best.idx + best.len)
    }
  }

  function showModal(card: HTMLElement, isHelp = false) {
    closeModal()
    const m = el('div', 'gl-modal')
    if (isHelp) m.dataset.help = '1'
    m.append(card)
    root.append(m)
    modal = m
  }
  function closeModal() {
    modal?.remove()
    modal = null
  }

  function openHelp(opts: HelpOptions = {}) {
    if (modal) return
    const card = el('div', 'gl-card')
    card.append(el('h2', undefined, opts.title ?? 'What does everything mean?'))
    const list = (items: { name: string; text: string }[]) => {
      const ul = el('ul')
      for (const it of items) {
        const li = el('li')
        li.append(el('b', undefined, `${it.name}: `), it.text)
        ul.append(li)
      }
      return ul
    }
    for (const s of opts.sections ?? []) card.append(el('h2', undefined, s.title), list(s.items))
    if (terms.length) card.append(el('h2', undefined, 'Words'), list(terms.map((t) => ({ name: t.name, text: t.text }))))
    const close = el('button', 'gl-btn gl-btn--main', opts.closeLabel ?? 'Back to the game')
    close.type = 'button'
    close.addEventListener('click', closeModal)
    card.append(close)
    showModal(card, true)
    close.focus()
  }

  return {
    decorate,
    openHelp,
    showModal,
    closeModal,
    hasModal: () => modal !== null,
    destroy() {
      hideTip()
      closeModal()
      root.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    },
  }
}
