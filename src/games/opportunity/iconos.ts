import Phaser from 'phaser';
import type { Ficha } from './events';
import { PALETA } from './paleta';

export const COLOR_FICHA: Record<Ficha, number> = {
  camara: PALETA.pearlAqua, rat: PALETA.thistle, espectrometro: PALETA.duskBlue, energia: PALETA.aliceBlue,
};
// Color del ícono: navy sobre fichas claras, Alice Blue sobre Dusk Blue (contraste).
export const COLOR_ICONO: Record<Ficha, number> = {
  camara: PALETA.deepNavy, rat: PALETA.deepNavy, espectrometro: PALETA.aliceBlue, energia: PALETA.deepNavy,
};
export const NOMBRE: Record<Ficha, string> = {
  camara: 'Camera', rat: 'RAT', espectrometro: 'Spectrometer', energia: 'Energy',
};

// Íconos centrados en (0,0), caben en ~34x34 px (como la tarjeta del portal: cámara, raya, aro y rayo).
export function dibujarIcono(g: Phaser.GameObjects.Graphics, tipo: Ficha) {
  const c = COLOR_ICONO[tipo], fondo = COLOR_FICHA[tipo];
  g.clear();
  switch (tipo) {
    case 'camara':
      g.fillStyle(c).fillRoundedRect(-15, -9, 30, 21, 5).fillRoundedRect(-6, -14, 12, 6, 2);
      g.fillStyle(fondo).fillCircle(0, 2, 7);
      g.fillStyle(c).fillCircle(0, 2, 3.5);
      break;
    case 'rat':
      g.lineStyle(7, c).lineBetween(-10, 13, 10, -13);
      break;
    case 'espectrometro':
      g.lineStyle(5, c).strokeCircle(0, 0, 10);
      break;
    case 'energia':
      g.fillStyle(c).fillPoints(
        [[3, -16], [-9, 2], [-1, 2], [-4, 16], [9, -3], [1, -3], [6, -16]].map(([x, y]) => new Phaser.Math.Vector2(x, y)),
        true,
      );
      break;
  }
}
