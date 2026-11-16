import Phaser from 'phaser'
import type { Ficha } from './events'
import { PALETA } from './paleta'

// Colores base de fichas de alta saturación
export const COLOR_FICHA: Record<Ficha, number> = {
  camara: PALETA.cyanFicha,
  rat: PALETA.naranjaFicha,
  espectrometro: PALETA.purpuraFicha,
  energia: PALETA.amarilloFicha,
}

// Bordes de volumen
export const COLOR_BORDE_FICHA: Record<Ficha, number> = {
  camara: PALETA.bordeCyan,
  rat: PALETA.bordeNaranja,
  espectrometro: PALETA.bordePurpura,
  energia: PALETA.bordeAmarillo,
}

// Color del icono interior
export const COLOR_ICONO: Record<Ficha, number> = {
  camara: 0x06142e,
  rat: 0xffffff,
  espectrometro: 0xffffff,
  energia: 0x06142e,
}

export const NOMBRE: Record<Ficha, string> = {
  camara: 'Camera',
  rat: 'Grinder (RAT)',
  espectrometro: 'Chemistry reader',
  energia: 'Battery',
}

/** Nombre corto que va escrito sobre la ficha. */
export const ETIQUETA_FICHA: Record<Ficha, string> = {
  camara: 'CAMERA',
  rat: 'RAT',
  espectrometro: 'READER',
  energia: 'BATTERY',
}

export const SUBTITULO_FICHA: Record<Ficha, string> = {
  camara: 'Takes photos',
  rat: 'Scrapes dust off',
  espectrometro: 'Reads minerals',
  energia: 'Recharges power',
}

/**
 * Dibuja el icono vectorial estilizado coincidente con el diseño espacial de referencia.
 * Centrado en (0, 0), escala base ~34x34 px.
 */
export function dibujarIcono(g: Phaser.GameObjects.Graphics, tipo: Ficha) {
  const c = COLOR_ICONO[tipo]
  g.clear()

  switch (tipo) {
    case 'camara': {
      // Cuerpo de la cámara compacta estilizada
      g.fillStyle(c, 1)
      g.fillRoundedRect(-14, -9, 28, 20, 5)
      // Visor superior
      g.fillRoundedRect(-6, -13, 12, 5, 2)
      // Lente exterior con brillo cyan
      g.fillStyle(PALETA.cyanFicha, 1)
      g.fillCircle(0, 1, 7.5)
      // Pupila interior
      g.fillStyle(c, 1)
      g.fillCircle(0, 1, 4.5)
      // Reflejo blanco nítido
      g.fillStyle(0xffffff, 1)
      g.fillCircle(2, -1, 1.8)
      break
    }

    case 'rat': {
      // Herramienta de abrasión: círculo blanco con 4 aspas y núcleo
      g.lineStyle(3, c, 1)
      g.strokeCircle(0, 0, 11)
      // Eje central
      g.fillStyle(c, 1)
      g.fillCircle(0, 0, 3.5)
      // Aspas en cruz con inclinación dinámica
      g.lineStyle(2.8, c, 1)
      g.lineBetween(-10, -5, 10, 5)
      g.lineBetween(-5, 10, 5, -10)
      break
    }

    case 'espectrometro': {
      // Sensor APXS / Mössbauer: dos anillos concéntricos blancos con marcas doradas
      g.lineStyle(2.8, c, 1)
      g.strokeCircle(0, 0, 11.5)
      g.lineStyle(2, c, 0.9)
      g.strokeCircle(0, 0, 6.5)
      // Sensor central dorado
      g.fillStyle(PALETA.amarilloFicha, 1)
      g.fillCircle(0, 0, 3)
      // 4 marcas cardinales doradas de precisión
      ;[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang) => {
        g.fillCircle(Math.cos(ang) * 9, Math.sin(ang) * 9, 1.8)
      })
      break
    }

    case 'energia': {
      // Rayo energético estilizado, sólido y nítido
      g.fillStyle(c, 1)
      g.fillPoints(
        [
          [3, -15],
          [-9, 2],
          [-1, 2],
          [-4, 15],
          [9, -3],
          [1, -3],
          [6, -15],
        ].map(([x, y]) => new Phaser.Math.Vector2(x, y)),
        true,
      )
      break
    }
  }
}
