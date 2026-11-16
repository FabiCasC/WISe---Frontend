import Phaser from 'phaser'
import type { Evento, Ficha, Pos, PuertoReglas } from './events'
import { Hud } from './hud'
import { COLOR_BORDE_FICHA, COLOR_FICHA, ETIQUETA_FICHA, dibujarIcono } from './iconos'
import { PALETA } from './paleta'
import { Sfx } from './sfx'
import { CONFIG_NIVELES } from './config'
import { PanelRoca } from './panel'
import type { GameSettings } from '../../shared/types'

export const W = 360,
  H = 640,
  N = 6

export interface Config {
  reglas: PuertoReglas
  ajustes: GameSettings
  levelId: number
  tiempoMs: () => number
  reiniciarTiempo: () => void
  alSalir: () => void
  alTerminar: (ganado: boolean) => void
}

interface Estrella {
  arc: Phaser.GameObjects.Arc
  speed: number
  x: number
  y: number
}

export class OpportunityScene extends Phaser.Scene {
  private fichas: (Phaser.GameObjects.Container | null)[][] = []
  private hud!: Hud
  private sfx!: Sfx
  private panel!: PanelRoca
  private seleccion: Pos | null = null
  private ocupado = false
  private pendiente: (() => void) | null = null
  private terminado = false
  private entregado = false
  private cascada = 0
  private cola: Promise<void> = Promise.resolve()
  private modalCont: Phaser.GameObjects.Container | null = null
  private ambienteIniciado = false

  // Layout dinámico y responsive
  private boardX0 = 24
  private boardY0 = 316
  private celdaSize = 52
  private bgAtmosphere!: Phaser.GameObjects.Graphics
  private bgTablero!: Phaser.GameObjects.Graphics
  private estrellas: Estrella[] = []

  // Geometría del área central / tarjeta izquierda
  private centroX = 20
  private centroY = 148
  private centroW = 320
  private centroH = 154

  constructor(private cfg: Config) {
    super('opportunity')
  }

  preload() {
    this.load.on('loaderror', () => {})
  }

  create() {
    const { reglas, ajustes, levelId } = this.cfg
    this.cameras.main.setBackgroundColor(PALETA.espacio)
    this.sound.volume = ajustes.volume
    this.sfx = new Sfx(this, ajustes.volume)

    // Fondo cósmico y marco del tablero
    this.bgAtmosphere = this.add.graphics().setDepth(0)
    this.bgTablero = this.add.graphics().setDepth(1)

    // Nombre temático del nivel
    const nivelNombre = CONFIG_NIVELES[levelId]?.nombre ?? 'MISSION'

    // HUD Rediseñado con estilo del centro de control espacial
    this.hud = new Hud(
      this,
      this.scale.width,
      ajustes.reducedMotion,
      ajustes.lang,
      levelId,
      nivelNombre,
      () => this.sfx.alternarSilencio(),
      () => this.mostrarGuia(),
    )

    this.hud.setMaxEnergia(reglas.movimientosMax())
    this.hud.setEnergia(reglas.movimientosMax(), ajustes.practice)
    this.hud.setObjetivo(reglas.objetivo())

    const ini = reglas.progresoInicial()
    this.hud.setMetas(ini.metas, levelId)
    this.hud.setProgreso(ini.conteo, ini.puntos, ajustes.practice)

    // Crear fichas iniciales
    this.crearTablero(reglas.tableroInicial(), false)

    // Panel de la roca (DOM) encima del canvas
    const host = this.game.canvas.parentElement as HTMLElement
    this.panel = new PanelRoca(
      host,
      {
        nombre: CONFIG_NIVELES[levelId]?.nombre ?? '',
        objetivo: reglas.objetivo(),
        practica: ajustes.practice,
        informe: reglas.informeDisponible(),
        foto: 'assets/opportunity/roca.jpg',
      },
      {
        elegir: (p) => {
          if (this.terminado) return
          this.panel.render(reglas.elegirPunto(p))
        },
        barajar: () => this.accionDelPanel(() => reglas.barajar()),
        enviarInforme: () => this.accionDelPanel(() => reglas.enviarInforme()),
      },
    )
    this.panel.render(reglas.roca())

    // Aplicar layout inicial
    this.reorganizarLayout(this.scale.width, this.scale.height)

    // Escuchar redimensionamiento dinámico
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.reorganizarLayout(gameSize.width, gameSize.height)
    })

    // Iniciar música espacial cósmica en el primer gesto del usuario
    const iniciarAudio = () => {
      if (!this.ambienteIniciado) {
        this.ambienteIniciado = true
        this.sfx.reanudar()
        this.sfx.iniciarAmbiente()
      }
    }
    this.input.once('pointerdown', iniciarAudio)

    this.events.once('shutdown', () => this.limpiar())
  }

  // Animación continua de estrellas en el fondo
  override update(_time: number, delta: number) {
    if (this.cfg.ajustes.reducedMotion || this.estrellas.length === 0) return

    const dt = delta / 1000
    const w = this.scale.width
    const h = this.scale.height

    for (const s of this.estrellas) {
      s.y += s.speed * dt
      s.x -= s.speed * 0.35 * dt

      if (s.y > h + 10) {
        s.y = -10
        s.x = Phaser.Math.Between(0, w + 20)
      }
      if (s.x < -10) {
        s.x = w + 10
      }
      s.arc.setPosition(s.x, s.y)
    }
  }

  // ---------- layout responsive y armónico ----------
  private reorganizarLayout(w: number, h: number) {
    if (w <= 0 || h <= 0) return

    const esHorizontal = w >= 660 && w > h * 1.05

    let panelX = 16
    let panelW = 320

    if (esHorizontal) {
      // Modo Horizontal (Desktop / Laptop / Tablet Landscape)
      panelW = Math.min(460, Math.max(340, Math.floor(w * 0.44)))
      panelX = Math.max(16, Math.floor((w - panelW - Math.min(w * 0.52, h - 30)) / 3))

      const espacioDerecho = w - panelW - panelX - 24
      const altoMaxTablero = h - 68
      this.celdaSize = Math.max(
        46,
        Math.min(68, Math.floor(Math.min(espacioDerecho, altoMaxTablero) / N)),
      )
      const tableroSize = this.celdaSize * N

      this.boardX0 = Math.round(panelX + panelW + (espacioDerecho - tableroSize) / 2)
      this.boardY0 = Math.round(54 + (h - 54 - tableroSize) / 2)

      this.centroX = panelX
      this.centroY = 68
      this.centroW = panelW
      this.centroH = Math.max(180, Math.min(520, h - 86))
    } else {
      // Modo Vertical (Smartphones / Tablets Portrait)
      panelW = Math.min(460, w - 24)
      panelX = Math.round((w - panelW) / 2)

      const altoDisponible = Math.floor(h * 0.5)
      this.celdaSize = Math.max(44, Math.min(54, Math.floor(Math.min(w - 24, altoDisponible) / N)))
      const tableroSize = this.celdaSize * N

      this.boardX0 = Math.round((w - tableroSize) / 2)
      this.boardY0 = Math.round(h - tableroSize - 14)

      this.centroX = panelX
      this.centroY = 62
      this.centroW = panelW
      this.centroH = Math.max(120, this.boardY0 - 74)
    }

    // Actualizar fondo cósmico con planeta y estrellas
    this.redibujarAtmósfera(w, h)

    // Actualizar HUD
    this.hud.actualizarLayout(w, h, esHorizontal, panelX, panelW)

    // Actualizar Tablero con marco neón brillante
    this.redibujarTablero(this.boardX0, this.boardY0, this.celdaSize * N)

    // Actualizar Tarjeta de Misión / Descubrimiento
    this.redibujarAreaCentral()

    // Reposicionar fichas del tablero
    this.reposicionarFichas()

    // Reposicionar modal si está abierto
    if (this.modalCont) {
      this.modalCont.setPosition(0, 0)
    }
  }

  // Fondo espacial con planeta curvado y estrellas en movimiento
  private redibujarAtmósfera(w: number, h: number) {
    this.bgAtmosphere.clear()

    // Fondo espacial cósmico profundo
    this.bgAtmosphere.fillStyle(PALETA.espacio, 1).fillRect(0, 0, w, h)

    // Nebulosa púrpura en la esquina superior derecha
    this.bgAtmosphere.fillStyle(PALETA.neonPurpura, 0.08)
    this.bgAtmosphere.fillEllipse(w * 0.88, h * 0.15, 280, 180)

    // Nebulosa azul en la zona superior central
    this.bgAtmosphere.fillStyle(PALETA.neonAzul, 0.07)
    this.bgAtmosphere.fillEllipse(w * 0.45, h * 0.08, 320, 120)

    // Curvatura planetaria (Tierra/Marte) en la esquina inferior izquierda
    const planetX = -w * 0.05
    const planetY = h * 1.08
    const planetRadius = Math.max(w * 0.55, 340)

    // Atmósfera brillante azul cian
    this.bgAtmosphere.lineStyle(8, PALETA.neonCyan, 0.45)
    this.bgAtmosphere.strokeCircle(planetX, planetY, planetRadius + 3)
    this.bgAtmosphere.lineStyle(3, 0xffffff, 0.8)
    this.bgAtmosphere.strokeCircle(planetX, planetY, planetRadius)

    // Cuerpo del planeta
    this.bgAtmosphere.fillStyle(0x0e2852, 0.95).fillCircle(planetX, planetY, planetRadius)
    this.bgAtmosphere.fillStyle(0x133870, 0.7).fillCircle(planetX, planetY, planetRadius * 0.94)

    // Generar estrellas móviles
    if (this.estrellas.length === 0) {
      const n = 50
      for (let i = 0; i < n; i++) {
        const x = Phaser.Math.Between(4, w - 4)
        const y = Phaser.Math.Between(4, h - 4)
        const radius = Phaser.Math.FloatBetween(1, 2.4)
        const alpha = Phaser.Math.FloatBetween(0.3, 0.9)
        const speed = Phaser.Math.FloatBetween(12, 38) // Velocidad de deriva

        const arc = this.add.circle(x, y, radius, PALETA.blancoPuro, alpha).setDepth(0)
        this.estrellas.push({ arc, speed, x, y })
      }
    }
  }

  // Marco Neón del Tablero 6x6 (Inspirado exactamente en la imagen de referencia)
  private redibujarTablero(x0: number, y0: number, tableroSize: number) {
    this.bgTablero.clear()

    const pad = 12
    const r = 24
    const fx = x0 - pad
    const fy = y0 - pad
    const fw = tableroSize + pad * 2
    const fh = tableroSize + pad * 2

    // 1. Resplandor exterior neón púrpura/azul
    this.bgTablero.lineStyle(6, PALETA.neonAzul, 0.25).strokeRoundedRect(fx - 2, fy - 2, fw + 4, fh + 4, r + 2)
    this.bgTablero.lineStyle(3.5, PALETA.neonPurpura, 0.4).strokeRoundedRect(fx - 1, fy - 1, fw + 2, fh + 2, r + 1)

    // 2. Fondo brillante de la superficie del tablero
    this.bgTablero.fillStyle(PALETA.superficie, 0.98).fillRoundedRect(fx, fy, fw, fh, r)

    // 3. Borde neón cyan vibrante
    this.bgTablero.lineStyle(2.4, PALETA.neonCyan, 1).strokeRoundedRect(fx, fy, fw, fh, r)

    // 4. Destello especular de brillo blanco en el borde superior
    this.bgTablero.fillStyle(0xffffff, 0.85).fillRoundedRect(fx + fw * 0.2, fy, fw * 0.6, 2.8, 1.4)
    this.bgTablero.fillStyle(PALETA.neonCyan, 0.5).fillRoundedRect(fx + fw * 0.1, fy, fw * 0.8, 4, 2)
  }

  private pos(f: number, c: number) {
    return {
      x: this.boardX0 + c * this.celdaSize + this.celdaSize / 2,
      y: this.boardY0 + f * this.celdaSize + this.celdaSize / 2,
    }
  }

  /** Las etiquetas (CAMERA, RAT...) crecen con la ficha para leerse también en el móvil. */
  private tamanoEtiqueta() {
    return Math.max(10, Math.round(this.celdaSize * 0.19))
  }

  private reposicionarFichas() {
    const scaleFactor = this.celdaSize / 52
    for (let f = 0; f < N; f++) {
      for (let c = 0; c < N; c++) {
        const cont = this.fichas[f]?.[c]
        if (cont) {
          const p = this.pos(f, c)
          cont.setPosition(p.x, p.y)
          cont.setSize(this.celdaSize, this.celdaSize)

          const bg = cont.getData('bg') as Phaser.GameObjects.Graphics
          const tipo = cont.getData('tipo') as Ficha
          const ic = cont.getData('ic') as Phaser.GameObjects.Graphics

          if (bg && tipo) {
            this.pintarFondoFicha(bg, tipo, false)
          }
          if (ic) {
            ic.setScale(scaleFactor)
          }
          const et = cont.getData('etiqueta') as Phaser.GameObjects.Text | undefined
          et?.setFontSize(this.tamanoEtiqueta()).setY(this.celdaSize * 0.33)
        }
      }
    }
  }

  private redibujarAreaCentral() {
    this.panel?.colocar(this.centroX, this.centroY, this.centroW, this.centroH)
  }

  private crearTablero(t: Ficha[][], conFundido: boolean) {
    for (let f = 0; f < N; f++) {
      this.fichas[f] = []
      for (let c = 0; c < N; c++) {
        const o = this.crearFicha(t[f][c], f, c)
        if (conFundido && !this.cfg.ajustes.reducedMotion) {
          o.setAlpha(0)
          this.tweens.add({ targets: o, alpha: 1, duration: 250 })
        }
        this.fichas[f][c] = o
      }
    }
  }

  private pintarFondoFicha(
    g: Phaser.GameObjects.Graphics,
    tipo: Ficha,
    marcada: boolean,
  ) {
    g.clear()
    const r = Math.round(this.celdaSize * 0.44)
    const cornerR = 14

    // 1. Sombra inferior proyectada
    g.fillStyle(0x000000, 0.4).fillRoundedRect(-r + 1, -r + 3, r * 2, r * 2, cornerR)

    // 2. Base vibrante y encendida de la ficha
    g.fillStyle(COLOR_FICHA[tipo], 1).fillRoundedRect(-r, -r, r * 2, r * 2, cornerR)

    // 3. Borde de volumen sutil
    g.lineStyle(2, COLOR_BORDE_FICHA[tipo], 1).strokeRoundedRect(-r, -r, r * 2, r * 2, cornerR)

    // 4. Reflejo glossy superior (acabado casual game jugoso y moderno)
    g.fillStyle(0xffffff, 0.22)
    g.fillRoundedRect(-r + 3, -r + 2, r * 2 - 6, Math.round(r * 0.65), 7)

    // 5. Brillo de selección blanco puro
    if (marcada) {
      g.lineStyle(3.5, 0xffffff, 1).strokeRoundedRect(-r - 1, -r - 1, r * 2 + 2, r * 2 + 2, cornerR + 1)
    }
  }

  private crearFicha(tipo: Ficha, f: number, c: number, yInicial?: number) {
    const p = this.pos(f, c)
    const bg = this.add.graphics(),
      ic = this.add.graphics()
    this.pintarFondoFicha(bg, tipo, false)
    dibujarIcono(ic, tipo)
    ic.setScale(this.celdaSize / 52)

    // Nombre simple bajo el icono: nadie debe necesitar saber qué es un RAT.
    const etiqueta = this.add
      .text(0, this.celdaSize * 0.33, ETIQUETA_FICHA[tipo], {
        fontFamily: 'sans-serif',
        fontSize: `${this.tamanoEtiqueta()}px`,
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
    const cont = this.add.container(p.x, yInicial ?? p.y, [bg, ic, etiqueta]).setDepth(2)
    cont.setSize(this.celdaSize, this.celdaSize).setInteractive({ useHandCursor: true })
    cont.setData('tipo', tipo).setData('bg', bg).setData('ic', ic).setData('etiqueta', etiqueta)
    cont.on('pointerdown', (ptr: Phaser.Input.Pointer) => this.alPulsar(cont, ptr))
    return cont
  }

  private marcar(cont: Phaser.GameObjects.Container | null, on: boolean) {
    if (!cont) return
    this.pintarFondoFicha(
      cont.getData('bg') as Phaser.GameObjects.Graphics,
      cont.getData('tipo') as Ficha,
      on,
    )
    if (!this.cfg.ajustes.reducedMotion) {
      this.tweens.add({
        targets: cont,
        scale: on ? 1.14 : 1,
        duration: 120,
        ease: 'Quad.easeOut',
      })
    } else {
      cont.setScale(on ? 1.1 : 1)
    }
  }

  // ---------- interacción táctil y arrastre ----------
  private alPulsar(cont: Phaser.GameObjects.Container, p: Phaser.Input.Pointer) {
    if (this.ocupado || this.terminado) return
    const celda = this.celdaDe(cont)
    if (!celda) return

    this.sfx.select()

    if (this.seleccion && this.sonVecinas(this.seleccion, celda)) {
      const a = this.seleccion
      this.limpiarSeleccion()
      this.pedirSwap(a, celda)
      return
    }

    this.limpiarSeleccion()
    this.seleccion = celda
    this.marcar(cont, true)

    const x0 = p.x,
      y0 = p.y
    const mover = (q: Phaser.Input.Pointer) => {
      const dx = q.x - x0,
        dy = q.y - y0
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return
      cleanup()
      this.limpiarSeleccion()
      const dest: Pos =
        Math.abs(dx) > Math.abs(dy)
          ? [celda[0], celda[1] + Math.sign(dx)]
          : [celda[0] + Math.sign(dy), celda[1]]
      if (dest[0] >= 0 && dest[0] < N && dest[1] >= 0 && dest[1] < N) {
        this.pedirSwap(celda, dest)
      }
    }
    const cleanup = () => {
      this.input.off('pointermove', mover)
      this.input.off('pointerup', cleanup)
    }
    this.input.on('pointermove', mover)
    this.input.once('pointerup', cleanup)
  }

  private celdaDe(cont: Phaser.GameObjects.Container): Pos | null {
    for (let f = 0; f < N; f++) {
      for (let c = 0; c < N; c++) {
        if (this.fichas[f][c] === cont) return [f, c]
      }
    }
    return null
  }

  private sonVecinas(a: Pos, b: Pos) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1
  }

  private limpiarSeleccion() {
    if (this.seleccion) this.marcar(this.fichas[this.seleccion[0]][this.seleccion[1]], false)
    this.seleccion = null
  }

  private pedirSwap(a: Pos, b: Pos) {
    this.ocupado = true
    this.cascada = 0
    const eventos = this.cfg.reglas.intentarSwap(a, b)
    this.procesar(eventos).finally(() => this.liberar())
  }

  /** Barajar y enviar el informe: si aún cae una cascada, esperan su turno en vez de perderse. */
  private accionDelPanel(accion: () => Evento[]) {
    if (this.terminado) return
    if (this.ocupado) {
      this.pendiente = () => this.accionDelPanel(accion)
      return
    }
    this.ocupado = true
    this.procesar(accion()).finally(() => this.liberar())
  }

  private liberar() {
    this.ocupado = false
    const p = this.pendiente
    this.pendiente = null
    p?.()
  }

  // ---------- animación de eventos ----------
  procesar(eventos: Evento[]): Promise<void> {
    this.cola = this.cola.then(async () => {
      for (const e of eventos) await this.animar(e)
    })
    return this.cola
  }

  private dur(ms: number) {
    return this.cfg.ajustes.reducedMotion ? 1 : ms
  }

  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>((res) => {
      this.tweens.add({ ...cfg, onComplete: () => res() })
    })
  }

  private espera(ms: number) {
    return new Promise<void>((res) => {
      this.time.delayedCall(this.dur(ms), () => res())
    })
  }

  private async animar(e: Evento) {
    const { ajustes } = this.cfg
    switch (e.tipo) {
      case 'swap':
        this.sfx.swap()
        return this.animarSwap(e.a, e.b)
      case 'swapRevertido': {
        this.sfx.revertido()
        await this.animarSwap(e.a, e.b)
        if (!ajustes.reducedMotion) {
          const os = [this.fichas[e.a[0]][e.a[1]], this.fichas[e.b[0]][e.b[1]]].filter(
            Boolean,
          ) as Phaser.GameObjects.Container[]
          await Promise.all(
            os.map((o) =>
              this.tween({ targets: o, x: o.x + 5, duration: 45, yoyo: true, repeat: 2 }),
            ),
          )
        }
        return
      }
      case 'match': {
        this.sfx.match(this.cascada++)
        const objs = e.celdas
          .map(([f, c]) => this.fichas[f][c])
          .filter(Boolean) as Phaser.GameObjects.Container[]
        e.celdas.forEach(([f, c]) => (this.fichas[f][c] = null))

        if (!ajustes.reducedMotion) {
          objs.forEach((o) => this.chispasCientificas(o.x, o.y, COLOR_FICHA[e.ficha]))
        }
        await this.tween({
          targets: objs,
          scale: 0.1,
          alpha: 0,
          duration: this.dur(180),
          ease: 'Back.easeIn',
        })
        objs.forEach((o) => o.destroy())
        return
      }
      case 'caida': {
        const movs: Promise<void>[] = []
        for (const { de, a } of e.movimientos) {
          const o = this.fichas[de[0]][de[1]]
          if (!o) continue
          this.fichas[de[0]][de[1]] = null
          this.fichas[a[0]][a[1]] = o
          movs.push(
            this.tween({
              targets: o,
              y: this.pos(a[0], a[1]).y,
              duration: this.dur(210),
              ease: 'Bounce.easeOut',
            }),
          )
        }
        for (const { a, ficha } of e.nuevas) {
          const o = this.crearFicha(ficha, a[0], a[1], this.boardY0 - this.celdaSize)
          this.fichas[a[0]][a[1]] = o
          movs.push(
            this.tween({
              targets: o,
              y: this.pos(a[0], a[1]).y,
              duration: this.dur(240),
              ease: 'Bounce.easeOut',
            }),
          )
        }
        await Promise.all(movs)
        return
      }
      case 'roca':
        this.panel.render(e.vista)
        return
      case 'aviso':
        this.panel.mensaje(e.mensaje)
        return
      case 'energia':
        this.hud.setEnergia(e.restante, ajustes.practice)
        return
      case 'progreso':
        this.hud.setProgreso(e.conteo, e.puntos, ajustes.practice)
        return
      case 'malaDecision':
        // El texto ya está en el panel de la roca (ver roca.ts); aquí solo suena.
        this.sfx.mala()
        return
      case 'mezcla': {
        this.panel.mensaje('The tiles were shuffled.')
        this.fichas.flat().forEach((o) => o?.destroy())
        this.crearTablero(e.tablero, true)
        await this.espera(350)
        return
      }
      case 'nivelCompleto': {
        if (this.terminado) return
        this.terminado = true
        if (e.ganado) {
          this.sfx.gana()
        } else {
          this.sfx.pierde()
        }
        await this.espera(650)
        this.mostrarFinal(e.ganado)
        return
      }
    }
  }

  private async animarSwap(a: Pos, b: Pos) {
    const oa = this.fichas[a[0]][a[1]],
      ob = this.fichas[b[0]][b[1]]
    if (!oa || !ob) return
    const pa = this.pos(a[0], a[1]),
      pb = this.pos(b[0], b[1])
    this.fichas[a[0]][a[1]] = ob
    this.fichas[b[0]][b[1]] = oa
    await Promise.all([
      this.tween({ targets: oa, x: pb.x, y: pb.y, duration: this.dur(140), ease: 'Quad.easeOut' }),
      this.tween({ targets: ob, x: pa.x, y: pa.y, duration: this.dur(140), ease: 'Quad.easeOut' }),
    ])
  }

  private chispasCientificas(x: number, y: number, color: number) {
    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(x, y, 2.8, color).setDepth(15)
      const ang = (Math.PI / 3) * i + Phaser.Math.FloatBetween(-0.2, 0.2)
      const dist = Phaser.Math.Between(22, 34)
      this.tweens.add({
        targets: p,
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        scale: 0.2,
        alpha: 0,
        duration: 320,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      })
    }
  }

  // ---------- reinicio limpio in-situ ----------
  private reiniciarPartida() {
    this.modalCont?.destroy()
    this.modalCont = null

    for (let f = 0; f < N; f++) {
      for (let c = 0; c < N; c++) {
        this.fichas[f]?.[c]?.destroy()
      }
    }
    this.fichas = []

    this.cfg.reglas.reiniciar()
    this.cfg.reiniciarTiempo()

    this.ocupado = false
    this.pendiente = null
    this.terminado = false
    this.entregado = false
    this.cascada = 0
    this.limpiarSeleccion()

    this.hud.setMaxEnergia(this.cfg.reglas.movimientosMax())
    this.hud.setEnergia(this.cfg.reglas.movimientosMax(), this.cfg.ajustes.practice)
    this.hud.setObjetivo(this.cfg.reglas.objetivo())
    const ini = this.cfg.reglas.progresoInicial()
    this.hud.setMetas(ini.metas, this.cfg.levelId)
    this.hud.setProgreso(ini.conteo, ini.puntos, this.cfg.ajustes.practice)

    this.crearTablero(this.cfg.reglas.tableroInicial(), true)
    this.panel.cerrarModal()
    this.panel.mensaje('')
    this.panel.render(this.cfg.reglas.roca())
    this.reorganizarLayout(this.scale.width, this.scale.height)
  }

  // ---------- ayuda y resumen final (DOM, ver panel.ts) ----------
  private mostrarGuia() {
    this.panel.mostrarAyuda()
  }

  private mostrarFinal(ganado: boolean) {
    const { levelId, ajustes, reglas } = this.cfg
    const r = reglas.resultado(this.cfg.tiempoMs())
    const nombre = CONFIG_NIVELES[levelId]?.nombre ?? ''
    const entregar = (ok: boolean) => {
      if (this.entregado) return
      this.entregado = true
      this.cfg.alTerminar(ok)
    }
    this.panel.mostrarResumen({
      ganado,
      titulo: ganado ? `${nombre}: done` : `${nombre}: out of moves`,
      lineas: reglas.resumen(ganado),
      puntos: r.puntos,
      practica: ajustes.practice,
      onContinuar: () => entregar(true),
      onReintentar: () => this.reiniciarPartida(),
      onSalir: () => entregar(false),
    })
  }

  // ---------- pausa / reanudar / limpiar ----------
  pausar() {
    this.scene.pause()
    this.sound.pauseAll()
    this.sfx?.suspender()
  }

  reanudar() {
    this.scene.resume()
    this.sound.resumeAll()
    this.sfx?.reanudar()
  }

  limpiar() {
    this.panel?.destruir()
    this.modalCont?.destroy()
    this.modalCont = null
    this.sfx?.detener()
    this.input?.removeAllListeners()
    this.tweens?.killAll()
    this.time?.removeAllEvents()
    this.sound?.stopAll()
  }
}
