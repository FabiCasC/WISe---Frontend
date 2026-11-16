// End-of-level recap: 2 to 4 lines built from what the player did, with their numbers.
import { el, type Glossary } from './glossary'

export interface Recap {
  won: boolean
  title: string
  /** 2 to 4 lines, each one written from the player's own numbers. */
  lines: string[]
  points: number | null
  practice: boolean
  buttons: { label: string; main?: boolean; onClick: () => void }[]
}

export function showRecap(glossary: Glossary, r: Recap) {
  const card = el('div', r.won ? 'gl-card' : 'gl-card gl-card--lose')
  card.setAttribute('role', 'dialog')
  card.setAttribute('aria-label', r.title)
  const list = el('ul')
  for (const l of r.lines.slice(0, 4)) {
    const li = el('li')
    glossary.decorate(li, l)
    list.append(li)
  }
  card.append(el('h2', undefined, r.title), el('p', undefined, 'What you learned:'), list)
  if (r.points !== null && !r.practice) card.append(el('p', undefined, `★ ${r.points} science points`))
  const actions = el('div', 'gl-actions')
  let first: HTMLButtonElement | null = null
  for (const b of r.buttons) {
    const btn = el('button', b.main ? 'gl-btn gl-btn--main' : 'gl-btn', b.label)
    btn.type = 'button'
    btn.addEventListener('click', b.onClick)
    actions.append(btn)
    first ??= btn
  }
  card.append(actions)
  glossary.showModal(card, false)
  first?.focus()
}
