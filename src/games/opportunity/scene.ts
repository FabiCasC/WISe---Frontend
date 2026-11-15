import Phaser from 'phaser'
import type { Evento, Ficha, Pos, PuertoReglas } from './events'
import { Hud } from './hud'
import { COLOR_BORDE_FICHA, COLOR_FICHA, NOMBRE, SUBTITULO_FICHA, dibujarIcono } from './iconos'
import { PALETA, css } from './paleta'
import { Sfx } from './sfx'
import { ROCA_CREDITO } from './creditos'
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
  private niebla: Phaser.GameObjects.Rectangle[] = []
  private seleccion: Pos | null = null
  private ocupado = false
  private terminado = false
  private entregado = false
  private cascada = 0
  private cola: Promise<void> = Promise.resolve()
  private modalCont: Phaser.GameObjects.Container | null = null
  private fotoCont: Phaser.GameObjects.Container | null = null
  private centroCont: Phaser.GameObjects.Container | null = null
  private targetCounterTxt: Phaser.GameObjects.Text | null = null
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
    if (this.cfg.levelId === 1) this.load.image('roca', 'assets/opportunity/roca.jpg')
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
    const nombresNiveles: Record<number, string> = {
      1: ajustes.lang === 'en' ? 'OBSERVAR' : 'OBSERVAR',
      2: ajustes.lang === 'en' ? 'INVESTIGAR' : 'INVESTIGAR',
      3: ajustes.lang === 'en' ? 'INTERPRETAR' : 'INTERPRETAR',
    }
    const nivelNombre = nombresNiveles[levelId] ?? 'MISIÓN'

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
      this.centroH = Math.max(180, Math.min(340, h - 86))
    } else {
      // Modo Vertical (Smartphones / Tablets Portrait)
      panelW = Math.min(460, w - 24)
      panelX = Math.round((w - panelW) / 2)

      const altoDisponible = Math.floor(h * 0.5)
      this.celdaSize = Math.max(44, Math.min(60, Math.floor(Math.min(w - 24, altoDisponible) / N)))
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
        }
      }
    }
  }

  private redibujarAreaCentral() {
    const { levelId } = this.cfg
    if (levelId === 1) {
      this.crearFotoNiebla()
    } else if (levelId === 2) {
      this.crearPanelLaboratorioNivel2()
    } else {
      this.crearPanelLaboratorioNivel3()
    }
  }

  // NIVEL 1: Tarjeta Sci-Fi con pestaña asimétrica y marco neón
  private crearFotoNiebla() {
    this.fotoCont?.destroy()
    this.fotoCont = this.add.container(0, 0).setDepth(2)
    const x = this.centroX,
      y = this.centroY,
      w = this.centroW,
      h = this.centroH

    // 1. Marco exterior con pestaña asimétrica en la esquina superior izquierda
    const cardBg = this.add.graphics()
    const r = 18

    // Resplandor exterior neón cyan
    cardBg.lineStyle(5, PALETA.neonAzul, 0.25).strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, r + 2)

    // Cuerpo de la tarjeta
    cardBg.fillStyle(PALETA.superficie, 0.98).fillRoundedRect(x, y, w, h, r)
    cardBg.lineStyle(2.4, PALETA.neonCyan, 1).strokeRoundedRect(x, y, w, h, r)

    // Líneas decorativas sci-fi en la parte superior derecha `///`
    cardBg.fillStyle(PALETA.neonCyan, 0.7)
    ;[0, 10, 20].forEach((dx) => {
      cardBg.fillPoints(
        [
          [x + w - 38 + dx, y + 16],
          [x + w - 32 + dx, y + 16],
          [x + w - 40 + dx, y + 26],
          [x + w - 46 + dx, y + 26],
        ].map(([px, py]) => new Phaser.Math.Vector2(px, py)),
        true,
      )
    })
    this.fotoCont.add(cardBg)

    // Pestaña de objetivo activo (CÁMARA 0/6)
    const targetBadge = this.add.graphics()
    targetBadge.fillStyle(PALETA.cyanFicha, 1).fillCircle(x + 28, y + 24, 15)
    targetBadge.lineStyle(2, 0xffffff, 0.9).strokeCircle(x + 28, y + 24, 15)

    const targetIcon = this.add.graphics({ x: x + 28, y: y + 24 }).setScale(0.55)
    dibujarIcono(targetIcon, 'camara')

    const targetTitle = this.add.text(x + 50, y + 14, 'CÁMARA', {
      fontFamily: 'sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: css(PALETA.blancoCalido),
    })

    const ini = this.cfg.reglas.progresoInicial()
    const conteoCam = ini.conteo.camara ?? 0
    this.targetCounterTxt = this.add.text(x + 50, y + 26, `${conteoCam}/6`, {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: css(PALETA.neonCyan),
    })
    this.fotoCont.add([targetBadge, targetIcon, targetTitle, this.targetCounterTxt])

    // 2. Ventana de visualización con los 4 soportes angulares `[ ]`
    const winX = x + 16,
      winY = y + 48,
      winW = w - 32,
      winH = h - 68

    // Corchetes angulares en las 4 esquinas
    const cornerGlints = this.add.graphics()
    cornerGlints.lineStyle(2.5, PALETA.neonCyan, 1)
    const cl = 12
    // Sup-izq
    cornerGlints.lineBetween(winX, winY, winX + cl, winY)
    cornerGlints.lineBetween(winX, winY, winX, winY + cl)
    // Sup-der
    cornerGlints.lineBetween(winX + winW, winY, winX + winW - cl, winY)
    cornerGlints.lineBetween(winX + winW, winY, winX + winW, winY + cl)
    // Inf-izq
    cornerGlints.lineBetween(winX, winY + winH, winX + cl, winY + winH)
    cornerGlints.lineBetween(winX, winY + winH, winX, winY + winH - cl)
    // Inf-der
    cornerGlints.lineBetween(winX + winW, winY + winH, winX + winW - cl, winY + winH)
    cornerGlints.lineBetween(winX + winW, winY + winH, winX + winW, winY + winH - cl)
    this.fotoCont.add(cornerGlints)

    // Imagen de la roca (o textura geológica con hematita)
    if (this.textures.exists('roca')) {
      const img = this.add
        .image(winX + winW / 2, winY + winH / 2, 'roca')
        .setDisplaySize(winW, winH)
      this.fotoCont.add(img)
    } else {
      const g = this.add.graphics()
      g.fillStyle(0x351b0c).fillRect(winX, winY, winW, winH)
      g.fillStyle(0xba451e, 0.85).fillEllipse(winX + winW / 2, winY + winH * 0.65, winW * 0.7, winH * 0.6)
      g.fillStyle(PALETA.arena, 0.55).fillEllipse(winX + winW / 2 - 15, winY + winH * 0.55, winW * 0.35, winH * 0.3)
      g.fillStyle(0x0e1724, 0.95)
      ;[
        [-65, 8],
        [-30, 24],
        [12, 4],
        [45, 20],
        [68, 6],
        [-8, 32],
      ].forEach(([dx, dy]) =>
        g.fillCircle(winX + winW / 2 + dx, winY + winH * 0.55 + dy, Phaser.Math.Between(3, 5)),
      )
      this.fotoCont.add(g)
    }

    // 3. 6 Sectores con retículas y marcas (+)
    this.niebla = []
    const cols = 3,
      filas = 2,
      cw = winW / cols,
      ch = winH / filas

    const reticula = this.add.graphics()
    reticula.lineStyle(1, 0x1f3458, 0.8)

    for (let i = 0; i < 6; i++) {
      const col = i % cols
      const fil = Math.floor(i / cols)
      const rx = winX + col * cw + cw / 2
      const ry = winY + fil * ch + ch / 2

      // Sector de niebla
      const rect = this.add
        .rectangle(rx, ry, cw - 2, ch - 2, 0x111c34, 0.96)
        .setStrokeStyle(1, 0x22385c)
      this.fotoCont.add(rect)
      this.niebla.push(rect)

      // Marca (+) en el centro de cada sector
      const plusIcon = this.add.graphics()
      plusIcon.lineStyle(1.4, 0x3d5b88, 0.8)
      plusIcon.strokeCircle(rx, ry, 7)
      plusIcon.lineBetween(rx - 3.5, ry, rx + 3.5, ry)
      plusIcon.lineBetween(rx, ry - 3.5, rx, ry + 3.5)
      this.fotoCont.add(plusIcon)
    }

    // Crédito oficial de la foto
    const creditoTxt = this.add
      .text(x + w - 16, y + h - 11, `📷 ${ROCA_CREDITO.leyenda}`, {
        fontFamily: 'sans-serif',
        fontSize: '9px',
        color: css(PALETA.grisSecundario),
      })
      .setOrigin(1, 0.5)
    this.fotoCont.add(creditoTxt)
  }

  // NIVEL 2: Laboratorio de Desbaste y Análisis con el mismo estilo
  private crearPanelLaboratorioNivel2() {
    this.centroCont?.destroy()
    this.centroCont = this.add.container(0, 0).setDepth(2)
    const x = this.centroX,
      y = this.centroY,
      w = this.centroW,
      h = this.centroH
    const es = this.cfg.ajustes.lang !== 'en'
    const r = 18

    const panelBg = this.add.graphics()
    panelBg.lineStyle(5, PALETA.neonAzul, 0.25).strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, r + 2)
    panelBg.fillStyle(PALETA.superficie, 0.98).fillRoundedRect(x, y, w, h, r)
    panelBg.lineStyle(2.4, PALETA.naranjaFicha, 1).strokeRoundedRect(x, y, w, h, r)
    this.centroCont.add(panelBg)

    const titulo = this.add
      .text(x + w / 2, y + 16, es ? 'SECUENCIA DE INVESTIGACIÓN' : 'INVESTIGATION SEQUENCE', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: css(PALETA.amarilloFicha),
      })
      .setOrigin(0.5, 0)

    const boxW = Math.floor((w - 36) / 2)
    const boxH = Math.max(90, h - 54)

    // Caja Fase 1 (RAT)
    const ratBox = this.add
      .graphics()
      .fillStyle(PALETA.superficieElevada, 0.9)
      .fillRoundedRect(x + 14, y + 40, boxW, boxH, 12)
      .lineStyle(1.8, PALETA.naranjaFicha, 1)
      .strokeRoundedRect(x + 14, y + 40, boxW, boxH, 12)

    const ratIcon = this.add.graphics({ x: x + 34, y: y + 62 }).setScale(0.7)
    dibujarIcono(ratIcon, 'rat')

    const ratTitle = this.add
      .text(x + 52, y + 54, es ? '1. Pulido RAT' : '1. RAT Grind', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: css(PALETA.naranjaFicha),
      })
      .setOrigin(0, 0)

    const ratDesc = this.add
      .text(
        x + 20,
        y + 78,
        es
          ? 'Raspa polvo y corteza para exponer roca fresca.'
          : 'Grinds dust to expose fresh rock.',
        {
          fontFamily: 'sans-serif',
          fontSize: '9.5px',
          color: css(PALETA.blancoCalido),
          wordWrap: { width: boxW - 14 },
        },
      )
      .setOrigin(0, 0)

    // Caja Fase 2 (Espectrómetro)
    const espBox = this.add
      .graphics()
      .fillStyle(PALETA.superficieElevada, 0.9)
      .fillRoundedRect(x + boxW + 22, y + 40, boxW, boxH, 12)
      .lineStyle(1.8, PALETA.purpuraFicha, 1)
      .strokeRoundedRect(x + boxW + 22, y + 40, boxW, boxH, 12)

    const espIcon = this.add.graphics({ x: x + boxW + 42, y: y + 62 }).setScale(0.7)
    dibujarIcono(espIcon, 'espectrometro')

    const espTitle = this.add
      .text(x + boxW + 60, y + 54, es ? '2. Análisis' : '2. Analysis', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: css(PALETA.purpuraFicha),
      })
      .setOrigin(0, 0)

    const espDesc = this.add
      .text(
        x + boxW + 28,
        y + 78,
        es
          ? 'Analiza minerales internos. Se activa tras pulir.'
          : 'Analyzes minerals. Activates after grinding.',
        {
          fontFamily: 'sans-serif',
          fontSize: '9.5px',
          color: css(PALETA.grisSecundario),
          wordWrap: { width: boxW - 14 },
        },
      )
      .setOrigin(0, 0)

    this.centroCont.add([titulo, ratBox, ratIcon, ratTitle, ratDesc, espBox, espIcon, espTitle, espDesc])
  }

  // NIVEL 3: Panel de Hipótesis de Agua Antigua
  private crearPanelLaboratorioNivel3() {
    this.centroCont?.destroy()
    this.centroCont = this.add.container(0, 0).setDepth(2)
    const x = this.centroX,
      y = this.centroY,
      w = this.centroW,
      h = this.centroH
    const es = this.cfg.ajustes.lang !== 'en'
    const r = 18

    const panelBg = this.add.graphics()
    panelBg.lineStyle(5, PALETA.neonAzul, 0.25).strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, r + 2)
    panelBg.fillStyle(PALETA.superficie, 0.98).fillRoundedRect(x, y, w, h, r)
    panelBg.lineStyle(2.4, PALETA.amarilloFicha, 1).strokeRoundedRect(x, y, w, h, r)
    this.centroCont.add(panelBg)

    const titulo = this.add
      .text(x + w / 2, y + 14, es ? 'HIPÓTESIS DE AGUA ANTIGUA' : 'ANCIENT WATER HYPOTHESIS', {
        fontFamily: 'sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: css(PALETA.amarilloFicha),
      })
      .setOrigin(0.5, 0)

    const nota = this.add
      .text(
        x + w / 2,
        y + 32,
        es
          ? 'Reúne las 3 evidencias para formular la conclusión científica:'
          : 'Gather 3 lines of evidence to formulate scientific conclusion:',
        {
          fontFamily: 'sans-serif',
          fontSize: '10px',
          color: css(PALETA.arena),
          align: 'center',
          wordWrap: { width: w - 24 },
        },
      )
      .setOrigin(0.5, 0)

    const pilares: { ficha: Ficha; label: string }[] = [
      { ficha: 'camara', label: es ? 'Fotografía' : 'Imaging' },
      { ficha: 'espectrometro', label: es ? 'Minerales' : 'Minerals' },
      { ficha: 'energia', label: es ? 'Telemetría' : 'Telemetry' },
    ]
    const pW = Math.floor((w - 36) / 3)
    const boxH = Math.max(70, h - 72)

    pilares.forEach((p, idx) => {
      const px = x + 14 + idx * (pW + 4)
      const pBox = this.add
        .graphics()
        .fillStyle(PALETA.superficieElevada, 0.9)
        .fillRoundedRect(px, y + 58, pW, boxH, 10)
        .lineStyle(1.4, COLOR_FICHA[p.ficha], 1)
        .strokeRoundedRect(px, y + 58, pW, boxH, 10)

      const ic = this.add.graphics({ x: px + pW / 2, y: y + 80 }).setScale(0.65)
      dibujarIcono(ic, p.ficha)

      const lb = this.add
        .text(px + pW / 2, y + 58 + boxH - 18, p.label, {
          fontFamily: 'sans-serif',
          fontSize: '9.5px',
          fontStyle: 'bold',
          color: css(COLOR_FICHA[p.ficha]),
        })
        .setOrigin(0.5, 0)

      this.centroCont!.add([pBox, ic, lb])
    })

    this.centroCont.add([titulo, nota])
  }

  // ---------- creación y renderizado de fichas con reflejo glossy ----------
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

    const cont = this.add.container(p.x, yInicial ?? p.y, [bg, ic]).setDepth(2)
    cont.setSize(this.celdaSize, this.celdaSize).setInteractive({ useHandCursor: true })
    cont.setData('tipo', tipo).setData('bg', bg).setData('ic', ic)
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
    this.procesar(eventos).finally(() => {
      this.ocupado = false
    })
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
    const { ajustes, levelId } = this.cfg
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
      case 'nieblaQuitada': {
        this.sfx.niebla()
        const quitar = this.niebla.splice(0, e.zonas)
        await this.tween({
          targets: quitar,
          alpha: 0,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: this.dur(450),
          ease: 'Quad.easeOut',
        })
        quitar.forEach((q) => q.destroy())
        return
      }
      case 'energia':
        this.hud.setEnergia(e.restante, ajustes.practice)
        return
      case 'progreso': {
        this.hud.setProgreso(e.conteo, e.puntos, ajustes.practice)
        if (levelId === 1 && this.targetCounterTxt) {
          const c = Math.min(6, e.conteo.camara ?? 0)
          this.targetCounterTxt.setText(`${c}/6`)
        }
        return
      }
      case 'malaDecision':
        this.sfx.mala()
        this.hud.mensaje(e.mensaje)
        return
      case 'mezcla': {
        const txt =
          ajustes.lang === 'en'
            ? 'No moves: reshuffling scientific deck'
            : 'Sin jugadas: remezclando instrumentos'
        this.hud.mensaje(txt)
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
    this.reorganizarLayout(this.scale.width, this.scale.height)
  }

  // ---------- guía interactiva del nivel [ ? ] ----------
  private mostrarGuia() {
    if (this.modalCont) return
    const es = this.cfg.ajustes.lang !== 'en'
    const w = this.scale.width,
      h = this.scale.height
    const pw = Math.min(460, w - 32),
      ph = Math.min(460, h - 30),
      py = Math.round((h - ph) / 2)

    const cont = this.add.container(0, 0).setDepth(60)
    this.modalCont = cont

    cont.add(
      this.add
        .rectangle(w / 2, h / 2, w, h, PALETA.espacio, 0.9)
        .setInteractive({ useHandCursor: false }),
    )

    const panel = this.add.graphics()
    panel
      .fillStyle(PALETA.superficie, 0.98)
      .fillRoundedRect(w / 2 - pw / 2, py, pw, ph, 16)
      .lineStyle(2.4, PALETA.neonCyan, 1)
      .strokeRoundedRect(w / 2 - pw / 2, py, pw, ph, 16)
    cont.add(panel)

    // Título
    cont.add(
      this.add
        .text(w / 2, py + 18, es ? 'GUÍA CIENTÍFICA DEL ROVER' : 'ROVER SCIENCE GUIDE', {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: css(PALETA.amarilloFicha),
        })
        .setOrigin(0.5, 0),
    )

    // Lista de instrumentos
    const tipos: Ficha[] = ['camara', 'rat', 'espectrometro', 'energia']
    const itemH = Math.min(50, Math.floor((ph - 180) / 4))
    tipos.forEach((tipo, i) => {
      const iy = py + 48 + i * (itemH + 6)
      const box = this.add
        .graphics()
        .fillStyle(PALETA.superficieElevada, 0.85)
        .fillRoundedRect(w / 2 - pw / 2 + 12, iy, pw - 24, itemH, 10)
        .lineStyle(1.4, COLOR_FICHA[tipo], 0.9)
        .strokeRoundedRect(w / 2 - pw / 2 + 12, iy, pw - 24, itemH, 10)

      const ic = this.add
        .graphics({ x: w / 2 - pw / 2 + 36, y: iy + itemH / 2 })
        .setScale(itemH / 65)
      dibujarIcono(ic, tipo)

      const nombre = this.add.text(w / 2 - pw / 2 + 62, iy + 6, NOMBRE[tipo].toUpperCase(), {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: css(COLOR_FICHA[tipo]),
      })
      const desc = this.add.text(w / 2 - pw / 2 + 62, iy + 22, SUBTITULO_FICHA[tipo], {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        color: css(PALETA.blancoCalido),
      })
      cont.add([box, ic, nombre, desc])
    })

    // Nota pedagógica de la misión
    const notaY = py + 48 + 4 * (itemH + 6) + 6
    const notaH = Math.max(50, ph - (notaY - py) - 58)
    const notaBg = this.add
      .graphics()
      .fillStyle(PALETA.superficieElevada, 0.7)
      .fillRoundedRect(w / 2 - pw / 2 + 12, notaY, pw - 24, notaH, 8)
    const notaTitle = this.add.text(
      w / 2 - pw / 2 + 20,
      notaY + 6,
      es ? 'Misión actual:' : 'Current mission:',
      {
        fontFamily: 'sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: css(PALETA.arena),
      },
    )
    const notaTxt = this.add.text(w / 2 - pw / 2 + 20, notaY + 22, this.cfg.reglas.nota(), {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: css(PALETA.blancoCalido),
      wordWrap: { width: pw - 40 },
    })
    cont.add([notaBg, notaTitle, notaTxt])

    // Botón Entendido
    const by = py + ph - 48
    const btnBg = this.add
      .graphics()
      .fillStyle(PALETA.neonCyan)
      .fillRoundedRect(w / 2 - 80, by, 160, 36, 12)
    const btnTxt = this.add
      .text(w / 2, by + 18, es ? '¡Entendido!' : 'Got it!', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: css(PALETA.espacio),
      })
      .setOrigin(0.5)
    const hit = this.add
      .rectangle(w / 2, by + 18, 160, 36, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
    hit.on('pointerup', () => {
      this.modalCont?.destroy()
      this.modalCont = null
    })
    cont.add([btnBg, btnTxt, hit])
  }

  // ---------- pantallas de victoria y derrota ----------
  private mostrarFinal(ganado: boolean) {
    const { levelId, ajustes, reglas } = this.cfg
    const r = reglas.resultado(this.cfg.tiempoMs())
    const es = ajustes.lang !== 'en'
    const w = this.scale.width,
      h = this.scale.height

    const pw = Math.min(480, w - 24),
      ph = Math.min(ganado ? (levelId === 3 ? 480 : 420) : 360, h - 20)
    const py = Math.round((h - ph) / 2)
    const cont = this.add.container(0, 0).setDepth(60)
    this.modalCont = cont

    cont.add(
      this.add
        .rectangle(w / 2, h / 2, w, h, PALETA.espacio, 0.92)
        .setInteractive({ useHandCursor: false }),
    )

    const panel = this.add.graphics()
    panel
      .fillStyle(PALETA.superficie, 0.98)
      .fillRoundedRect(w / 2 - pw / 2, py, pw, ph, 18)
      .lineStyle(2.4, ganado ? PALETA.verdeExito : PALETA.neonDorado, 1)
      .strokeRoundedRect(w / 2 - pw / 2, py, pw, ph, 18)
    cont.add(panel)

    const txt = (y: number, s: string, size: number, color: number, bold = false) =>
      cont.add(
        this.add
          .text(w / 2, y, s, {
            fontFamily: 'sans-serif',
            fontSize: `${size}px`,
            color: css(color),
            fontStyle: bold ? 'bold' : 'normal',
            align: 'center',
            wordWrap: { width: pw - 30 },
          })
          .setOrigin(0.5, 0),
      )

    let y = py + 18

    if (ganado) {
      txt(
        y,
        es ? '¡MISIÓN CUMPLIDA, EXPLORADOR!' : 'MISSION COMPLETE!',
        18,
        PALETA.amarilloFicha,
        true,
      )
      y += 30

      const seg = Math.round(r.tiempoMs / 1000)
      txt(
        y,
        ajustes.practice
          ? es
            ? 'Modo Práctica · Experimentos libres'
            : 'Practice Mode · Free experiments'
          : `★ ${r.puntos} ${es ? 'PUNTOS CIENTÍFICOS' : 'SCIENCE POINTS'}`,
        16,
        PALETA.blancoPuro,
        true,
      )
      y += 24

      txt(
        y,
        `${es ? 'Tiempo' : 'Time'}: ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}  ·  ${es ? 'Movs sobrantes' : 'Remaining moves'}: ${r.movimientosRestantes}`,
        12,
        PALETA.arena,
      )
      y += 20

      if (!ajustes.practice) {
        if (r.sinErroresDecision) {
          txt(
            y,
            es
              ? '✓ ¡Decisión científica impecable! (+50 pts)'
              : '✓ Flawless scientific choice! (+50 pts)',
            11,
            PALETA.verdeExito,
          )
          y += 18
        } else if (r.malasDecisiones > 0) {
          txt(
            y,
            es
              ? `Decisiones precipitadas registradas: ${r.malasDecisiones}`
              : `Rushed decisions recorded: ${r.malasDecisiones}`,
            11,
            PALETA.naranjaFicha,
          )
          y += 18
        }
      }

      if (levelId === 1 || levelId === 2) {
        const cajaReflexion = this.add
          .graphics()
          .fillStyle(PALETA.superficieElevada, 0.75)
          .fillRoundedRect(w / 2 - pw / 2 + 16, y, pw - 32, 100, 10)
        cont.add(cajaReflexion)
        cont.add(
          this.add
            .text(w / 2, y + 10, reglas.explicacionVictoria(), {
              fontFamily: 'sans-serif',
              fontSize: '11px',
              color: css(PALETA.blancoCalido),
              align: 'center',
              wordWrap: { width: pw - 50 },
            })
            .setOrigin(0.5, 0),
        )
      } else {
        this.tableroEvidencia(cont, y + 2, pw, es)
      }

      // Botón Continuar
      const by = py + ph - 52
      const btnBg = this.add.graphics()
      btnBg.fillStyle(PALETA.verdeExito).fillRoundedRect(w / 2 - 100, by, 200, 38, 12)
      cont.add(btnBg)
      cont.add(
        this.add
          .text(w / 2, by + 19, es ? 'Registrar en el Portal' : 'Register in Portal', {
            fontFamily: 'sans-serif',
            fontSize: '14.5px',
            fontStyle: 'bold',
            color: css(PALETA.espacio),
          })
          .setOrigin(0.5),
      )
      const btnClick = this.add
        .rectangle(w / 2, by + 19, 200, 38, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true })
      btnClick.on('pointerup', () => {
        if (this.entregado) return
        this.entregado = true
        this.cfg.alTerminar(true)
      })
      cont.add(btnClick)
    } else {
      // Pantalla de derrota motivadora
      txt(y, es ? '¡Buen intento, explorador!' : 'Great effort, explorer!', 19, PALETA.arena, true)
      y += 32

      txt(y, reglas.explicacionDerrota(), 12, PALETA.blancoCalido)
      y += 66

      txt(
        y,
        es
          ? 'Opportunity superó muchas tormentas marcianas.\n¡Ajusta tu estrategia e inténtalo de nuevo!'
          : 'Opportunity endured many Martian storms.\nAdjust your plan and try again!',
        11,
        PALETA.arena,
      )

      // Botón 1: Reintentar
      const by1 = py + ph - 100
      const btnReintentarBg = this.add.graphics()
      btnReintentarBg
        .fillStyle(PALETA.amarilloFicha)
        .fillRoundedRect(w / 2 - 105, by1, 210, 36, 12)
      cont.add(btnReintentarBg)
      cont.add(
        this.add
          .text(w / 2, by1 + 18, es ? 'Reintentar misión' : 'Retry mission', {
            fontFamily: 'sans-serif',
            fontSize: '14.5px',
            fontStyle: 'bold',
            color: css(PALETA.espacio),
          })
          .setOrigin(0.5),
      )
      const btnReintentarClick = this.add
        .rectangle(w / 2, by1 + 18, 210, 36, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true })
      btnReintentarClick.on('pointerup', () => this.reiniciarPartida())
      cont.add(btnReintentarClick)

      // Botón 2: Volver al portal
      const by2 = py + ph - 50
      const btnSalirBg = this.add.graphics()
      btnSalirBg
        .fillStyle(PALETA.superficieElevada, 0.8)
        .fillRoundedRect(w / 2 - 105, by2, 210, 34, 12)
        .lineStyle(1.4, PALETA.arena, 0.8)
        .strokeRoundedRect(w / 2 - 105, by2, 210, 34, 12)
      cont.add(btnSalirBg)
      cont.add(
        this.add
          .text(w / 2, by2 + 17, es ? 'Volver al centro de control' : 'Return to control center', {
            fontFamily: 'sans-serif',
            fontSize: '13px',
            color: css(PALETA.blancoCalido),
          })
          .setOrigin(0.5),
      )
      const btnSalirClick = this.add
        .rectangle(w / 2, by2 + 17, 210, 34, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true })
      btnSalirClick.on('pointerup', () => {
        if (this.entregado) return
        this.entregado = true
        this.cfg.alTerminar(false)
      })
      cont.add(btnSalirClick)
    }

    if (!ajustes.reducedMotion) {
      cont.setAlpha(0)
      this.tweens.add({ targets: cont, alpha: 1, duration: 280 })
    }
  }

  // Nivel 3: Tablero de evidencia científica
  private tableroEvidencia(
    cont: Phaser.GameObjects.Container,
    y: number,
    pw: number,
    es: boolean,
  ) {
    const wScreen = this.scale.width
    const fichas: Ficha[] = ['camara', 'espectrometro', 'energia'],
      w = (pw - 24) / 3
    fichas.forEach((f, i) => {
      const x = wScreen / 2 - pw / 2 + 12 + i * w + w / 2
      const g = this.add.graphics({ x: x, y: y + 16 }).setScale(0.7)
      g.fillStyle(COLOR_FICHA[f]).fillRoundedRect(-23, -23, 46, 46, 11)
      cont.add(g)
      const ic = this.add.graphics({ x: x, y: y + 16 }).setScale(0.7)
      dibujarIcono(ic, f)
      cont.add(ic)
      cont.add(
        this.add
          .text(x, y + 36, `${NOMBRE[f]} ✓`, {
            fontFamily: 'sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
            color: css(PALETA.blancoPuro),
          })
          .setOrigin(0.5, 0),
      )
    })

    const fila = (
      yy: number,
      encendido: boolean,
      titulo: string,
      detalle: string,
      subdetalle: string,
    ) => {
      const baseX = wScreen / 2 - pw / 2 + 16
      const g = this.add.graphics()
      g.fillStyle(encendido ? PALETA.verdeExito : PALETA.grisSecundario, encendido ? 1 : 0.4).fillCircle(
        baseX + 16,
        yy + 12,
        9,
      )
      if (encendido)
        g.lineStyle(2, PALETA.amarilloFicha, 0.9).strokeCircle(baseX + 16, yy + 12, 13)
      cont.add(g)
      cont.add(
        this.add.text(baseX + 34, yy, titulo, {
          fontFamily: 'sans-serif',
          fontSize: '12.5px',
          fontStyle: 'bold',
          color: css(encendido ? PALETA.verdeExito : PALETA.grisSecundario),
        }),
      )
      cont.add(
        this.add.text(baseX + 34, yy + 17, detalle, {
          fontFamily: 'sans-serif',
          fontSize: '10.5px',
          color: css(PALETA.blancoCalido),
          wordWrap: { width: pw - 60 },
        }),
      )
      cont.add(
        this.add.text(baseX + 34, yy + 33, subdetalle, {
          fontFamily: 'sans-serif',
          fontSize: '9.5px',
          color: css(encendido ? PALETA.arena : PALETA.grisSecundario),
          wordWrap: { width: pw - 60 },
        }),
      )
    }

    fila(
      y + 60,
      true,
      es ? 'AGUA ANTIGUA: Confirmada' : 'ANCIENT WATER: Confirmed',
      es
        ? 'Esferas de hematita ("blueberries") y vetas de yeso.'
        : 'Hematite spherules ("blueberries") & gypsum veins.',
      es
        ? 'Minerales depositados por agua líquida subterránea.'
        : 'Minerals formed through circulating liquid water.',
    )

    fila(
      y + 130,
      false,
      es ? 'VIDA: Sin pruebas (en gris)' : 'LIFE: No evidence (grayed out)',
      es
        ? 'Opportunity no encontró vida ni fósiles biológicos.'
        : 'Opportunity found neither life nor biological fossils.',
      es
        ? 'Tener agua antigua NO demuestra la existencia de vida.'
        : 'Ancient water does NOT demonstrate life existed.',
    )
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
    this.modalCont?.destroy()
    this.modalCont = null
    this.sfx?.detener()
    this.input?.removeAllListeners()
    this.tweens?.killAll()
    this.time?.removeAllEvents()
    this.sound?.stopAll()
  }
}
