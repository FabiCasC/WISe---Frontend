// Panel de la roca (DOM) para Opportunity Echoes: los 3 puntos, la batería, las pruebas,
// el glosario que se abre al tocar una palabra subrayada y el resumen de lo aprendido.
// Va encima del canvas de Phaser, que sigue dibujando el tablero.

import { FICHAS, TERMINOS } from './glosario'
import { createGlossary, type Glossary } from '../shared/glossary'
import { showRecap } from '../shared/recap'
import type { EstadoPunto, Lectura, Punto, Rasgo, VistaRoca } from './roca'

const NOMBRE_RASGO: Record<Rasgo, string> = { esferitas: 'round balls', capas: 'layers', lisa: 'plain' }
const NOMBRE_LECTURA: Record<Lectura, string> = { polvo: 'dust', hematita: 'hematite', sulfatos: 'sulfates', comun: 'plain rock' }

const NS = 'http://www.w3.org/2000/svg'

const CSS = `
.opp{position:absolute;inset:0;pointer-events:none;font-family:system-ui,sans-serif;color:#eef3ff}
.opp *{box-sizing:border-box}
.opp-panel{position:absolute;pointer-events:auto;overflow:auto;border-radius:16px;padding:10px 12px;
  background:rgba(12,16,28,.92);border:2px solid #6de2f2;display:flex;flex-direction:column;gap:8px}
.opp-title{margin:0;font-size:12px;letter-spacing:.08em;color:#ffd25e;font-weight:800}
.opp-goal{margin:0;font-size:13px;line-height:1.35}
.opp-rock{position:relative;border-radius:12px;padding:8px;background:#1b1410 center/cover;
  display:flex;gap:8px;justify-content:center}
.opp-rock::before{content:"";position:absolute;inset:0;border-radius:12px;background:rgba(12,16,28,.6)}
.opp-spot{position:relative;flex:1 1 0;max-width:132px;min-width:78px;padding:6px;border-radius:12px;cursor:pointer;
  border:2px solid rgba(255,255,255,.25);background:rgba(12,16,28,.78);color:inherit;font:inherit;
  display:flex;flex-direction:column;align-items:center;gap:3px}
.opp-spot:hover{border-color:#6de2f2}
.opp-spot[aria-pressed=true]{border-color:#ffd25e;box-shadow:0 0 0 2px rgba(255,210,94,.35)}
.opp-spot svg{width:52px;height:52px}
.opp-spot b{font-size:13px}
.opp-chips{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;min-height:16px}
.opp-chip{font-size:10px;line-height:1;padding:3px 5px;border-radius:999px;background:rgba(109,226,242,.18);color:#bff3fb}
.opp-chip--warn{background:rgba(255,160,100,.2);color:#ffc9a3}
.opp-chip--ok{background:rgba(120,230,160,.2);color:#b6f2cd}
.opp-info{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.opp-bat{display:flex;gap:3px;align-items:center;font-size:11px}
.opp-bat i{width:12px;height:14px;border-radius:3px;background:rgba(255,255,255,.14);display:inline-block}
.opp-bat i.on{background:#ffd25e}
.opp-msg{margin:0;font-size:12.5px;line-height:1.4;min-height:34px;flex:1 1 180px}
.opp-evid{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.opp-send{min-height:40px;padding:6px 14px;border-radius:10px;border:0;cursor:pointer;font-weight:800;
  background:#6de2f2;color:#0c101c}
.opp-btn{min-height:40px;padding:6px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.4);cursor:pointer;
  background:transparent;color:#eef3ff;font:inherit;font-weight:700}
.opp-btn--main{background:#78e6a0;color:#0c101c;border-color:#78e6a0}
.opp-credit{font-size:10px;opacity:.65;text-align:right;margin:0}
`

export interface HandlersPanel {
  elegir(p: Punto): void
  enviarInforme(): void
  barajar(): void
}

export interface Resumen {
  ganado: boolean
  titulo: string
  lineas: string[]
  puntos: number | null
  practica: boolean
  onContinuar(): void
  onReintentar(): void
  onSalir(): void
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

function sv<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element) {
  const e = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  parent?.append(e)
  return e
}

/** Dibujo de un punto de la roca según lo que se sabe de él. */
function dibujarPunto(p: EstadoPunto): SVGSVGElement {
  const s = document.createElementNS(NS, 'svg')
  s.setAttribute('viewBox', '0 0 60 60')
  s.setAttribute('aria-hidden', 'true')
  sv('circle', { cx: 30, cy: 30, r: 26, fill: p.pulido ? '#5b3b2c' : '#b48b63', stroke: p.pulido ? '#ffd25e' : '#7a5a3c', 'stroke-width': 2.5 }, s)
  if (!p.fotografiado) {
    const t = sv('text', { x: 30, y: 38, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 700, fill: '#3a2a1c' }, s)
    t.textContent = '?'
  } else if (p.perturbado) {
    for (const [x1, y1, x2, y2] of [[14, 20, 46, 28], [14, 32, 46, 40], [18, 44, 42, 48]]) {
      sv('line', { x1, y1, x2, y2, stroke: '#3a2a1c', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, s)
    }
  } else if (p.rasgo === 'esferitas') {
    for (const [cx, cy] of [[20, 22], [32, 18], [40, 30], [24, 34], [34, 42], [18, 44], [44, 44]]) {
      sv('circle', { cx, cy, r: 4.2, fill: '#8ea0c4', stroke: '#4d5d80', 'stroke-width': 1 }, s)
    }
  } else if (p.rasgo === 'capas') {
    for (const y of [18, 26, 34, 42]) {
      sv('line', { x1: 12, y1: y, x2: 48, y2: y, stroke: '#7a5a3c', 'stroke-width': 3, 'stroke-linecap': 'round' }, s)
    }
  }
  return s
}

export class PanelRoca {
  private root = el('div', 'opp')
  private panel = el('div', 'opp-panel')
  private rock = el('div', 'opp-rock')
  private info = el('div', 'opp-info')
  private msg = el('p', 'opp-msg')
  private evid = el('div', 'opp-evid')
  private gl: Glossary
  private botones = new Map<Punto, HTMLButtonElement>()
  private enviar: HTMLButtonElement | null = null
  private ultimoMsg = ''
  constructor(
    host: HTMLElement,
    cfg: { nombre: string; objetivo: string; practica: boolean; informe: boolean; foto: string },
    private h: HandlersPanel,
  ) {
    if (!document.getElementById('opp-style')) {
      const st = el('style')
      st.id = 'opp-style'
      st.textContent = CSS
      document.head.append(st)
    }
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
    this.gl = createGlossary(this.root, TERMINOS.map((t) => ({ id: t.id, name: t.nombre, pattern: t.patron, text: t.texto })))

    const titulo = el('p', 'opp-title', cfg.practica ? 'PRACTICE · TRY EVERYTHING' : cfg.nombre)
    const goal = el('p', 'opp-goal')
    this.decorar(goal, cfg.practica ? 'Pick a spot on the rock, then match tools on the board. Nothing here counts.' : cfg.objetivo)

    this.rock.style.backgroundImage = `url(${cfg.foto})`
    for (const id of ['A', 'B', 'C'] as Punto[]) {
      const b = el('button', 'opp-spot')
      b.type = 'button'
      b.setAttribute('aria-pressed', 'false')
      b.addEventListener('click', () => this.h.elegir(id))
      this.botones.set(id, b)
      this.rock.append(b)
    }

    this.info.append(this.msg)
    if (!cfg.practica) {
      const bar = el('button', 'opp-btn', 'Shuffle tiles (1 move)')
      bar.type = 'button'
      bar.title = 'Use it when no match on the board is the one you want, so you do not touch the rock by accident.'
      bar.addEventListener('click', () => this.h.barajar())
      this.info.append(bar)
    }
    this.panel.append(titulo, goal, this.rock, this.info)
    if (cfg.informe) {
      this.enviar = el('button', 'opp-send', 'Send report')
      this.enviar.type = 'button'
      this.enviar.addEventListener('click', () => this.h.enviarInforme())
      this.evid.append(this.enviar)
      this.panel.append(this.evid)
    }
    const credito = el('p', 'opp-credit', 'Rock photo: NASA/JPL-Caltech/Cornell (cropped)')
    this.panel.append(credito)
    this.root.append(this.panel)
    host.append(this.root)
  }

  /** Coloca el panel en el hueco que deja el tablero (coordenadas del canvas). */
  colocar(x: number, y: number, w: number, h: number) {
    Object.assign(this.panel.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` })
  }

  render(v: VistaRoca) {
    for (const p of v.puntos) {
      const b = this.botones.get(p.id)!
      b.replaceChildren()
      b.append(dibujarPunto(p), el('b', undefined, `Spot ${p.id}`))
      const chips = el('div', 'opp-chips')
      if (p.perturbado) chips.append(el('span', 'opp-chip opp-chip--warn', 'scraped'))
      else if (p.fotografiado) chips.append(el('span', 'opp-chip opp-chip--ok', `photo: ${NOMBRE_RASGO[p.rasgo]}`))
      if (p.pulido) chips.append(el('span', 'opp-chip', 'ground'))
      if (p.lectura) chips.append(el('span', 'opp-chip', `read: ${NOMBRE_LECTURA[p.lectura]}`))
      b.append(chips)
      b.setAttribute('aria-pressed', String(v.elegido === p.id))
      b.setAttribute('aria-label', this.describir(p, v.elegido === p.id))
    }
    // Batería
    const bat = this.info.querySelector('.opp-bat') ?? this.info.insertBefore(el('div', 'opp-bat'), this.msg)
    bat.replaceChildren(el('span', undefined, 'Battery'))
    for (let i = 0; i < v.energiaMax; i++) bat.append(el('i', i < v.energia ? 'on' : ''))
    ;(bat as HTMLElement).setAttribute('aria-label', `Battery ${v.energia} of ${v.energiaMax}`)

    if (v.ultimo !== this.ultimoMsg) {
      this.ultimoMsg = v.ultimo
      if (v.ultimo) this.decorar(this.msg, v.ultimo)
    }
    if (this.enviar) {
      const e = v.evidencias
      this.evid.replaceChildren(
        el('span', e.imagen ? 'opp-chip opp-chip--ok' : 'opp-chip', `${e.imagen ? '✓' : '○'} clean photo`),
        el('span', e.quimica ? 'opp-chip opp-chip--ok' : 'opp-chip', `${e.quimica ? '✓' : '○'} water reading`),
        el('span', e.segundo ? 'opp-chip opp-chip--ok' : 'opp-chip', `${e.segundo ? '✓' : '○'} second spot agrees`),
        this.enviar,
      )
    }
  }

  /** Mensaje corto del juego (avisos de orden, falta de punto, etc.). */
  mensaje(texto: string) {
    this.ultimoMsg = texto
    this.decorar(this.msg, texto)
  }

  private describir(p: EstadoPunto, elegido: boolean) {
    const partes = [`Spot ${p.id}`, elegido ? 'selected' : 'not selected']
    partes.push(p.perturbado ? 'scraped' : p.fotografiado ? `photographed, ${NOMBRE_RASGO[p.rasgo]}` : 'not photographed')
    if (p.pulido) partes.push('ground')
    if (p.lectura) partes.push(`read: ${NOMBRE_LECTURA[p.lectura]}`)
    return partes.join(', ')
  }

  /** Escribe un texto subrayando cada término técnico (una vez) para explicarlo al tocarlo. */
  decorar(host: HTMLElement, texto: string) {
    this.gl.decorate(host, texto)
  }

  /** Pantalla de ayuda: qué hace cada ficha y qué significan las palabras. */
  mostrarAyuda() {
    this.gl.openHelp({
      title: 'What does everything mean?',
      sections: [{ title: 'Tools', items: FICHAS.map((f) => ({ name: f.nombre, text: f.texto })) }],
      closeLabel: 'Back to the rock',
    })
  }

  /** Resumen de 2 a 4 líneas con lo que hizo el jugador. */
  mostrarResumen(r: Resumen) {
    showRecap(this.gl, {
      won: r.ganado,
      title: r.titulo,
      lines: r.lineas,
      points: r.puntos,
      practice: r.practica,
      buttons: r.ganado
        ? [{ label: 'Continue', main: true, onClick: r.onContinuar }]
        : [
            { label: 'Try again', main: true, onClick: r.onReintentar },
            { label: 'Back to the arcade', onClick: r.onSalir },
          ],
    })
  }

  cerrarModal() {
    this.gl.closeModal()
  }

  destruir() {
    this.gl.destroy()
    this.root.remove()
  }
}
