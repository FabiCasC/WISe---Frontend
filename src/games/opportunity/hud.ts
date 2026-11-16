import Phaser from 'phaser'
import type { Conteo, Ficha } from './events'
import type { Lang } from '../../shared/types'
import { PALETA, css } from './paleta'

interface Chip {
  ficha: Ficha
  contenedor: Phaser.GameObjects.Container
  fondo: Phaser.GameObjects.Graphics
  texto: Phaser.GameObjects.Text
  badge?: Phaser.GameObjects.Text
  meta: number
}

export class Hud {
  private headerCont: Phaser.GameObjects.Container

  // Cápsula de Opportunity con mascota
  private mascotCont: Phaser.GameObjects.Container
  private badgeCapsule: Phaser.GameObjects.Graphics
  private badgeTxt: Phaser.GameObjects.Text
  private levelTxt: Phaser.GameObjects.Text

  // Píldoras de movimientos y puntos
  private movPillCont: Phaser.GameObjects.Container
  private movBg: Phaser.GameObjects.Graphics
  private txtMovLabel: Phaser.GameObjects.Text
  private txtMovNum: Phaser.GameObjects.Text
  private movIcon: Phaser.GameObjects.Graphics

  private ptsPillCont: Phaser.GameObjects.Container
  private ptsBg: Phaser.GameObjects.Graphics
  private txtPtsNum: Phaser.GameObjects.Text

  // Botones de acción (Ayuda y Sonido)
  private btnAyudaCont: Phaser.GameObjects.Container
  private btnSonidoCont: Phaser.GameObjects.Container
  private btnSonidoIcon: Phaser.GameObjects.Graphics

  // Chips para niveles con múltiples metas
  private chips: Chip[] = []

  // Alerta educativa flotante
  private mensajeContainer: Phaser.GameObjects.Container
  private txtMensaje: Phaser.GameObjects.Text
  private bgMensaje: Phaser.GameObjects.Graphics

  private lang: Lang
  private nivelLargo = ''
  private nivelCorto = ''

  constructor(
    private scene: Phaser.Scene,
    anchoInicial: number,
    private reducedMotion: boolean,
    lang: Lang = 'es',
    levelId = 1,
    nivelNombre = '',
    onToggleSonido?: () => boolean,
    onAbrirAyuda?: () => void,
  ) {
    this.lang = lang
    const es = lang !== 'en'
    const st = { fontFamily: 'sans-serif', color: css(PALETA.blancoPuro) }

    // ----------------------------------------------------
    // ENCABEZADO SUPERIOR MODERNO (Estilo Sci-Fi del diseño)
    // ----------------------------------------------------
    this.headerCont = scene.add.container(0, 0).setDepth(25)

    // 1. Mascota robot Opportunity + Cápsula de Misión
    this.mascotCont = scene.add.container(16, 12)
    this.headerCont.add(this.mascotCont)

    // Dibujo del astronauta / robot Opportunity con casco y pulgar arriba
    const gMascot = scene.add.graphics()
    this.dibujarMascotaOpportunity(gMascot)
    this.mascotCont.add(gMascot)

    // Cápsula de título
    this.badgeCapsule = scene.add.graphics({ x: 44, y: 0 })
    this.badgeTxt = scene.add.text(54, 7, 'OPPORTUNITY MER-B', {
      ...st,
      fontSize: '12.5px',
      fontStyle: 'bold',
      color: css(PALETA.blancoPuro),
    })
    this.nivelCorto = `${es ? 'NIVEL' : 'LEVEL'} ${levelId}`
    this.nivelLargo = `${this.nivelCorto} • ${nivelNombre.toUpperCase()}`
    this.levelTxt = scene.add.text(
      54,
      22,
      this.nivelLargo,
      {
        ...st,
        fontSize: '10.5px',
        fontStyle: 'bold',
        color: css(PALETA.neonDorado),
      },
    )
    this.mascotCont.add([this.badgeCapsule, this.badgeTxt, this.levelTxt])

    // 2. Píldora de Movimientos (con icono y glow azul)
    this.movPillCont = scene.add.container(anchoInicial - 220, 12)
    this.movBg = scene.add.graphics()
    this.movIcon = scene.add.graphics({ x: 20, y: 19 })
    this.dibujarIconoMovimiento(this.movIcon)

    this.txtMovLabel = scene.add
      .text(68, 8, es ? 'MOVIMIENTOS' : 'MOVES', {
        ...st,
        fontSize: '8.5px',
        fontStyle: 'bold',
        color: css(PALETA.neonCyan),
      })
      .setOrigin(0.5, 0)

    this.txtMovNum = scene.add
      .text(68, 19, '12', {
        ...st,
        fontSize: '15px',
        fontStyle: 'bold',
        color: css(PALETA.blancoPuro),
      })
      .setOrigin(0.5, 0)

    this.movPillCont.add([this.movBg, this.movIcon, this.txtMovLabel, this.txtMovNum])
    this.headerCont.add(this.movPillCont)

    // 3. Píldora de Puntuación (con estrella dorada y glow)
    this.ptsPillCont = scene.add.container(anchoInicial - 110, 12)
    this.ptsBg = scene.add.graphics()
    const ptsStar = scene.add
      .text(18, 19, '★', {
        ...st,
        fontSize: '17px',
        color: css(PALETA.neonDorado),
      })
      .setOrigin(0.5)

    this.txtPtsNum = scene.add
      .text(50, 19, '0', {
        ...st,
        fontSize: '16px',
        fontStyle: 'bold',
        color: css(PALETA.neonDorado),
      })
      .setOrigin(0.5)

    this.ptsPillCont.add([this.ptsBg, ptsStar, this.txtPtsNum])
    this.headerCont.add(this.ptsPillCont)

    // 4. Botón [ ? ] Guía
    this.btnAyudaCont = scene.add.container(anchoInicial - 44, 31)
    const btnAyudaBg = scene
      .add.graphics()
      .fillStyle(PALETA.superficie, 0.95)
      .fillCircle(0, 0, 17)
      .lineStyle(1.8, PALETA.neonCyan, 1)
      .strokeCircle(0, 0, 17)
    const btnAyudaTxt = scene
      .add.text(0, 0, '?', {
        ...st,
        fontSize: '16px',
        fontStyle: 'bold',
        color: css(PALETA.blancoPuro),
      })
      .setOrigin(0.5)
    const btnAyudaHit = scene
      .add.circle(0, 0, 19, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
    btnAyudaHit.on('pointerup', () => onAbrirAyuda?.())
    this.btnAyudaCont.add([btnAyudaBg, btnAyudaTxt, btnAyudaHit])
    this.headerCont.add(this.btnAyudaCont)

    // 5. Botón Sonido / Ajustes
    this.btnSonidoCont = scene.add.container(anchoInicial - 44, 31)
    const btnSonidoBg = scene
      .add.graphics()
      .fillStyle(PALETA.superficie, 0.95)
      .fillCircle(0, 0, 17)
      .lineStyle(1.8, PALETA.neonCyan, 1)
      .strokeCircle(0, 0, 17)
    this.btnSonidoIcon = scene.add.graphics({ x: 0, y: 0 })
    this.dibujarIconoSonido(true)

    const btnSonidoHit = scene
      .add.circle(0, 0, 19, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
    btnSonidoHit.on('pointerup', () => {
      if (onToggleSonido) {
        const silenciado = onToggleSonido()
        this.dibujarIconoSonido(!silenciado)
      }
    })
    this.btnSonidoCont.add([btnSonidoBg, this.btnSonidoIcon, btnSonidoHit])
    this.headerCont.add(this.btnSonidoCont)

    // 6. Alerta flotante de mensajes
    this.mensajeContainer = scene.add.container(anchoInicial / 2, 290).setDepth(40).setAlpha(0)
    this.bgMensaje = scene.add.graphics()
    const iconoAlerta = scene.add.text(-120, 0, '⚠️', { fontSize: '18px' }).setOrigin(0.5)
    this.txtMensaje = scene
      .add.text(0, 0, '', {
        ...st,
        fontSize: '12px',
        color: css(PALETA.blancoPuro),
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5)

    this.mensajeContainer.add([this.bgMensaje, iconoAlerta, this.txtMensaje])
  }

  // Mascota Opportunity con casco y pantalla facial
  private dibujarMascotaOpportunity(g: Phaser.GameObjects.Graphics) {
    g.clear()

    // Resplandor azul detrás de la mascota
    g.fillStyle(PALETA.neonAzul, 0.25).fillCircle(18, 19, 20)

    // Casco blanco redondeado
    g.fillStyle(0xffffff, 1).fillRoundedRect(0, 2, 36, 33, 11)
    g.lineStyle(2, PALETA.neonCyan, 1).strokeRoundedRect(0, 2, 36, 33, 11)

    // Visor oscuro con reflejo
    g.fillStyle(0x060f24, 1).fillRoundedRect(5, 7, 26, 21, 7)
    g.lineStyle(1.2, PALETA.neonAzul, 0.8).strokeRoundedRect(5, 7, 26, 21, 7)

    // Ojos amigables celestes (pantalla del robot)
    g.fillStyle(PALETA.neonCyan, 1)
    g.fillRoundedRect(10, 13, 6, 7, 2)
    g.fillRoundedRect(20, 13, 6, 7, 2)

    // Pequeño cuerpo y pulgar arriba
    g.fillStyle(0xffffff, 1).fillRoundedRect(6, 34, 24, 8, 3)
    g.fillStyle(0xffffff, 1).fillCircle(34, 30, 4) // guante pulgar
    g.fillStyle(PALETA.neonCyan, 1).fillCircle(34, 28, 2.2)
  }

  private dibujarIconoMovimiento(g: Phaser.GameObjects.Graphics) {
    g.clear()
    g.fillStyle(PALETA.neonCyan, 1)
    // Icono estilizado de zapatilla/pasos espaciales
    g.fillRoundedRect(-8, 0, 16, 6, 2)
    g.fillPoints(
      [
        [-8, 0],
        [-3, -7],
        [2, -7],
        [4, 0],
      ].map(([x, y]) => new Phaser.Math.Vector2(x, y)),
      true,
    )
    g.fillStyle(0xffffff, 0.8)
    g.fillCircle(-2, -3, 1.5)
  }

  private dibujarIconoSonido(activo: boolean) {
    this.btnSonidoIcon.clear()
    const color = activo ? PALETA.neonCyan : PALETA.grisSecundario
    this.btnSonidoIcon.fillStyle(color, 1)
    this.btnSonidoIcon.fillPoints(
      [
        [-5, -3],
        [-2, -3],
        [2, -7],
        [2, 7],
        [-2, 3],
        [-5, 3],
      ].map(([x, y]) => new Phaser.Math.Vector2(x, y)),
      true,
    )
    if (activo) {
      this.btnSonidoIcon.lineStyle(1.8, color, 1)
      this.btnSonidoIcon.strokeCircle(3, 0, 4.5)
    } else {
      this.btnSonidoIcon.lineStyle(2, PALETA.rojoMarciano, 1)
      this.btnSonidoIcon.lineBetween(-6, -6, 6, 6)
    }
  }

  actualizarLayout(
    w: number,
    _h: number,
    esHorizontal: boolean,
    panelX: number,
    panelW: number,
  ) {
    const yTop = 14

    if (esHorizontal) {
      // 1. Mascota y cápsula izquierda
      this.badgeTxt.setText('OPPORTUNITY MER-B').setFontSize(12.5)
      this.levelTxt.setText(this.nivelLargo)
      this.mascotCont.setPosition(panelX, yTop)
      const capsuleW = Math.max(180, Math.min(220, panelW - 50))
      this.badgeCapsule.clear()
      this.badgeCapsule
        .fillStyle(PALETA.superficie, 0.95)
        .fillRoundedRect(0, 0, capsuleW, 38, 12)
        .lineStyle(2, PALETA.neonAzul, 0.9)
        .strokeRoundedRect(0, 0, capsuleW, 38, 12)
        .lineStyle(1, PALETA.neonCyan, 0.6)
        .strokeRoundedRect(2, 2, capsuleW - 4, 34, 10)

      // 2. Píldoras y botones en la parte superior derecha
      const btnSpacing = 42
      const btnRightX = w - 30

      this.btnSonidoCont.setPosition(btnRightX, yTop + 19)
      this.btnAyudaCont.setPosition(btnRightX - btnSpacing, yTop + 19)

      const pillPtsX = btnRightX - btnSpacing - 94
      this.ptsPillCont.setPosition(pillPtsX, yTop)
      this.dibujarPill(this.ptsBg, 84, 38, PALETA.neonDorado, PALETA.superficie)

      const pillMovX = pillPtsX - 114
      this.movPillCont.setPosition(pillMovX, yTop)
      this.dibujarPill(this.movBg, 104, 38, PALETA.neonAzul, PALETA.superficie)
    } else {
      // Modo Vertical (Smartphones)
      this.mascotCont.setPosition(12, yTop)
      // En el móvil las píldoras ocupan la derecha: la cápsula se queda con lo justo.
      const capsuleW = Math.max(88, Math.min(170, w - 298))
      this.badgeTxt.setText('OPPORTUNITY').setFontSize(10)
      this.levelTxt.setText(this.nivelCorto)
      this.badgeCapsule.clear()
      this.badgeCapsule
        .fillStyle(PALETA.superficie, 0.95)
        .fillRoundedRect(0, 0, capsuleW, 38, 12)
        .lineStyle(1.8, PALETA.neonAzul, 1)
        .strokeRoundedRect(0, 0, capsuleW, 38, 12)

      const btnRightX = w - 24
      this.btnSonidoCont.setPosition(btnRightX, yTop + 19)
      this.btnAyudaCont.setPosition(btnRightX - 38, yTop + 19)

      const pillPtsX = btnRightX - 110
      this.ptsPillCont.setPosition(pillPtsX, yTop)
      this.dibujarPill(this.ptsBg, 68, 38, PALETA.neonDorado, PALETA.superficie)

      const pillMovX = pillPtsX - 92
      this.movPillCont.setPosition(pillMovX, yTop)
      this.dibujarPill(this.movBg, 86, 38, PALETA.neonAzul, PALETA.superficie)
    }

    // 3. Mensaje flotante centrado
    this.mensajeContainer.setPosition(w / 2, esHorizontal ? 300 : 280)
    const msgW = Math.min(420, w - 40)
    this.bgMensaje.clear()
    this.bgMensaje
      .fillStyle(PALETA.superficie, 0.98)
      .fillRoundedRect(-msgW / 2, -26, msgW, 52, 12)
      .lineStyle(2, PALETA.alertaNaranja, 1)
      .strokeRoundedRect(-msgW / 2, -26, msgW, 52, 12)
    this.txtMensaje.setWordWrapWidth(msgW - 60)
  }

  private dibujarPill(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
    neonColor: number,
    bgColor: number,
  ) {
    g.clear()
    // Brillo sutil exterior
    g.lineStyle(4, neonColor, 0.25).strokeRoundedRect(-1, -1, w + 2, h + 2, 14)
    // Fondo oscuro
    g.fillStyle(bgColor, 0.95).fillRoundedRect(0, 0, w, h, 12)
    // Borde neón nítido
    g.lineStyle(1.8, neonColor, 1).strokeRoundedRect(0, 0, w, h, 12)
  }

  setMaxEnergia(_n: number) {}

  setEnergia(restante: number, practica: boolean) {
    const es = this.lang !== 'en'
    if (practica) {
      this.txtMovNum.setText('∞').setColor(css(PALETA.neonCyan))
      this.txtMovLabel.setText(es ? 'PRÁCTICA' : 'PRACTICE')
    } else {
      this.txtMovNum.setText(String(restante))
      if (restante <= 3) {
        this.txtMovNum.setColor(css(PALETA.rojoMarciano))
      } else {
        this.txtMovNum.setColor(css(PALETA.blancoPuro))
      }
    }
  }

  setObjetivo(_texto: string) {}

  limpiarChips() {
    for (const ch of this.chips) {
      ch.contenedor.destroy()
    }
    this.chips = []
  }

  setMetas(_metas: Conteo, _levelId = 1) {}

  setProgreso(conteo: Conteo, puntos: number, _practica: boolean) {
    this.txtPtsNum.setText(String(puntos))
    for (const ch of this.chips) {
      const n = Math.min(conteo[ch.ficha] ?? 0, ch.meta)
      const listo = n >= ch.meta
      ch.texto.setText(`${n}/${ch.meta}${listo ? ' ✓' : ''}`)
    }
  }

  mensaje(texto: string) {
    this.scene.tweens.killTweensOf(this.mensajeContainer)
    this.txtMensaje.setText(texto)
    this.mensajeContainer.setAlpha(1)
    this.scene.tweens.add({
      targets: this.mensajeContainer,
      alpha: 0,
      delay: 2800,
      duration: this.reducedMotion ? 1 : 450,
    })
  }
}
