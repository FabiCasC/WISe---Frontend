import Phaser from 'phaser';
import type { Conteo, Ficha } from './events';
import { COLOR_FICHA, dibujarIcono } from './iconos';
import { PALETA, css } from './paleta';

interface Chip { ficha: Ficha; texto: Phaser.GameObjects.Text; meta: number }

export class Hud {
  private barra: Phaser.GameObjects.Rectangle;
  private txtMov: Phaser.GameObjects.Text;
  private txtPuntos: Phaser.GameObjects.Text;
  private txtObjetivo: Phaser.GameObjects.Text;
  private txtMensaje: Phaser.GameObjects.Text;
  private chips: Chip[] = [];
  private anchoBarra: number;
  private maxEnergia = 1;

  constructor(private scene: Phaser.Scene, private ancho: number, private reducedMotion: boolean) {
    const st = { fontFamily: 'sans-serif', color: css(PALETA.aliceBlue) };
    this.anchoBarra = ancho - 32;
    scene.add.rectangle(16, 16, this.anchoBarra, 14, PALETA.duskBlue).setOrigin(0, 0).setDepth(5);
    this.barra = scene.add.rectangle(16, 16, this.anchoBarra, 14, PALETA.pearlAqua).setOrigin(0, 0).setDepth(6);
    this.txtMov = scene.add.text(16, 36, '', { ...st, fontSize: '16px', fontStyle: 'bold' }).setDepth(5);
    this.txtPuntos = scene.add.text(ancho - 16, 36, '', { ...st, fontSize: '16px', color: css(PALETA.thistle) }).setOrigin(1, 0).setDepth(5);
    this.txtObjetivo = scene.add.text(16, 62, '', { ...st, fontSize: '13px', wordWrap: { width: ancho - 32 } }).setDepth(5);
    this.txtMensaje = scene.add.text(ancho / 2, 306, '', {
      ...st, fontSize: '15px', color: css(PALETA.thistle), backgroundColor: css(PALETA.deepNavy), padding: { x: 10, y: 5 },
      align: 'center', wordWrap: { width: ancho - 40 },
    }).setOrigin(0.5, 1).setAlpha(0).setDepth(20);
  }

  setMaxEnergia(n: number) { this.maxEnergia = Math.max(1, n); }

  setEnergia(restante: number, practica: boolean) {
    const r = practica ? 1 : Phaser.Math.Clamp(restante / this.maxEnergia, 0, 1);
    this.barra.width = Math.max(1, this.anchoBarra * r);
    this.txtMov.setText(practica ? 'Moves: ∞  (practice)' : `Moves: ${restante}`);
  }

  setObjetivo(texto: string) { this.txtObjetivo.setText(texto); }

  // Fichas de meta con su ícono y contador (como en la tarjeta del portal).
  setMetas(metas: Conteo) {
    const entradas = Object.entries(metas) as [Ficha, number][];
    const w = (this.ancho - 32 - 8 * (entradas.length - 1)) / entradas.length;
    entradas.forEach(([ficha, meta], i) => {
      const x = 16 + i * (w + 8), y = 108;
      this.scene.add.rectangle(x, y, w, 30, PALETA.duskBlue, 0.45).setOrigin(0, 0).setStrokeStyle(1, PALETA.duskBlue).setDepth(5);
      this.scene.add.rectangle(x + 4, y + 3, 24, 24, COLOR_FICHA[ficha]).setOrigin(0, 0).setDepth(5);
      const g = this.scene.add.graphics({ x: x + 16, y: y + 15 }).setScale(0.6).setDepth(6);
      dibujarIcono(g, ficha);
      const texto = this.scene.add.text(x + 36, y + 15, `0/${meta}`, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: css(PALETA.aliceBlue) })
        .setOrigin(0, 0.5).setDepth(6);
      this.chips.push({ ficha, texto, meta });
    });
  }

  setProgreso(conteo: Conteo, puntos: number, practica: boolean) {
    for (const ch of this.chips) {
      const n = Math.min(conteo[ch.ficha] ?? 0, ch.meta), listo = n >= ch.meta;
      ch.texto.setText(`${n}/${ch.meta}${listo ? ' ✓' : ''}`).setColor(css(listo ? PALETA.pearlAqua : PALETA.aliceBlue));
    }
    this.txtPuntos.setText(practica ? '' : `★ ${puntos}`);
  }

  mensaje(texto: string) {
    this.scene.tweens.killTweensOf(this.txtMensaje);
    this.txtMensaje.setText(texto).setAlpha(1);
    this.scene.tweens.add({ targets: this.txtMensaje, alpha: 0, delay: 1600, duration: this.reducedMotion ? 1 : 400 });
  }
}
