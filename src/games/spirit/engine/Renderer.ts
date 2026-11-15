import Phaser from 'phaser';
import { C, FINISH, H, W, hex } from './config';
import { INSTRUCTIONS } from './data/levels';
import type { GameModel } from './state';

type FontKey = 'small' | 'font' | 'medium' | 'big' | 'huge';

const FONTS: Record<FontKey, { size: number; bold: boolean }> = {
  small: { size: 18, bold: false },
  font: { size: 23, bold: false },
  medium: { size: 29, bold: true },
  big: { size: 48, bold: true },
  huge: { size: 58, bold: true },
};

/**
 * Reutiliza objetos Text entre fotogramas (el juego redibuja todo cada frame,
 * igual que el original en pygame, y crear textos nuevos sería muy costoso).
 */
class TextPool {
  private pools = new Map<string, { items: Phaser.GameObjects.Text[]; used: number }>();

  constructor(private scene: Phaser.Scene) {}

  begin(): void {
    for (const p of this.pools.values()) p.used = 0;
  }

  draw(msg: string, font: FontKey, color: number, x: number, y: number, center = false): void {
    const key = `${font}|${color}`;
    let pool = this.pools.get(key);
    if (!pool) {
      pool = { items: [], used: 0 };
      this.pools.set(key, pool);
    }
    let t = pool.items[pool.used];
    if (!t) {
      const f = FONTS[font];
      t = this.scene.add
        .text(0, 0, msg, {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: `${f.size}px`,
          fontStyle: f.bold ? 'bold' : 'normal',
          color: hex(color),
          resolution: Math.min(2, window.devicePixelRatio || 1),
        })
        .setDepth(10);
      pool.items.push(t);
    }
    pool.used += 1;
    t.setText(msg)
      .setOrigin(center ? 0.5 : 0, center ? 0.5 : 0)
      .setPosition(x, y)
      .setVisible(true);
  }

  end(): void {
    for (const p of this.pools.values()) {
      for (let i = p.used; i < p.items.length; i++) p.items[i].setVisible(false);
    }
  }
}

/** Estrellas fijas (equivale al random.Random(12) del original). */
function makeStars(): Array<[number, number]> {
  let a = 12;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const stars: Array<[number, number]> = [];
  for (let i = 0; i < 65; i++) stars.push([Math.floor(rnd() * (W + 1)), 15 + Math.floor(rnd() * 246)]);
  return stars;
}

const MOUNTAINS = [
  [0, 375], [140, 270], [290, 350], [480, 255], [670, 355],
  [850, 275], [1000, 350], [1000, 520], [0, 520],
].map(([x, y]) => new Phaser.Geom.Point(x, y));

export class Renderer {
  private g: Phaser.GameObjects.Graphics;
  private tp: TextPool;
  private stars = makeStars();

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(0);
    this.tp = new TextPool(scene);
  }

  // ---------- primitivas ----------
  private t(msg: string, font: FontKey, color: number, x: number, y: number, center = false) {
    this.tp.draw(msg, font, color, x, y, center);
  }

  /** Rectángulo (redondeado) que ignora tamaños no válidos, como bar() del original. */
  private bar(color: number, x: number, y: number, w: number, h: number, radius = 0) {
    w = Math.trunc(w);
    h = Math.trunc(h);
    if (w <= 0 || h <= 0) return;
    const r = Math.min(radius, Math.floor(w / 2), Math.floor(h / 2));
    this.g.fillStyle(color, 1);
    if (r > 0) this.g.fillRoundedRect(x, y, w, h, r);
    else this.g.fillRect(x, y, w, h);
  }

  private line(color: number, width: number, x1: number, y1: number, x2: number, y2: number) {
    this.g.lineStyle(width, color, 1);
    this.g.lineBetween(x1, y1, x2, y2);
  }

  private circle(color: number, x: number, y: number, r: number) {
    this.g.fillStyle(color, 1);
    this.g.fillCircle(x, y, r);
  }

  private poly(color: number, pts: Array<[number, number]>) {
    this.g.fillStyle(color, 1);
    this.g.fillPoints(pts.map(([x, y]) => new Phaser.Geom.Point(x, y)), true);
  }

  // ---------- elementos ----------
  private background(scroll: number) {
    this.g.fillStyle(C.NAVY, 1);
    this.g.fillRect(0, 0, W, H);
    for (const [x, y] of this.stars) this.circle(C.STAR, x, y, 2);
    this.g.fillStyle(C.DARK, 1);
    this.g.fillPoints(MOUNTAINS, true);
    this.bar(C.RUST, 0, 490, W, 160);
    for (let i = 0; i < 22; i++) {
      const x = (((i * 61 - Math.trunc(scroll * 0.5)) % W) + W) % W;
      const y = 535 + (i % 3) * 25;
      this.line(C.SAND, 2, x, y, x + 18, y + 2);
    }
  }

  private rover(x: number, y: number, color: number = C.YELLOW, s = 1) {
    const i = Math.trunc;
    this.line(C.CREAM, Math.max(1, i(3 * s)), i(x + 39 * s), i(y - 18 * s), i(x + 39 * s), i(y + 2 * s));
    this.circle(C.GREEN, i(x + 39 * s), i(y - 20 * s), Math.max(2, i(5 * s)));
    this.poly(C.NAVY, [
      [i(x + 3 * s), i(y + 12 * s)], [i(x + 16 * s), i(y + 1 * s)],
      [i(x + 64 * s), i(y + 1 * s)], [i(x + 76 * s), i(y + 12 * s)],
    ]);
    this.bar(color, i(x + 12 * s), i(y + 10 * s), 54 * s, 22 * s, Math.max(2, i(5 * s)));
    this.bar(C.CREAM, i(x + 25 * s), i(y + 2 * s), 28 * s, 10 * s, Math.max(2, i(3 * s)));
    for (const wx of [x + 17 * s, x + 39 * s, x + 61 * s]) {
      this.circle(C.NAVY, i(wx), i(y + 43 * s), Math.max(3, i(11 * s)));
      this.circle(C.HUB, i(wx), i(y + 43 * s), Math.max(2, i(5 * s)));
    }
  }

  private objects(m: GameModel) {
    for (const o of m.rocks) {
      const x = Math.trunc(o.x - m.scroll);
      if (x > -60 && x < W + 60) {
        this.poly(C.ROCK, [[x, 490], [x + 7, 465], [x + 25, 452], [x + 43, 474], [x + 48, 490]]);
      }
    }
    for (const o of m.batteries) {
      const x = Math.trunc(o.x - m.scroll);
      if (x > -40 && x < W + 40) {
        this.bar(C.YELLOW, x, o.y, 28, 32, 4);
        this.bar(C.CREAM, x + 9, o.y - 5, 10, 5);
        this.t('+', 'small', C.NAVY, x + 8, o.y + 3);
      }
    }
    for (const o of m.samples) {
      const x = Math.trunc(o.x - m.scroll);
      if (x > -50 && x < W + 50) {
        this.circle(C.YELLOW, x + 16, o.y + 16, 17);
        this.circle(C.CREAM, x + 10, o.y + 10, 5);
        this.t('MUESTRA', 'small', C.CREAM, x - 23, o.y - 28);
      }
    }
  }

  private   hud(m: GameModel) {
    this.bar(C.NAVY, 0, 0, W, 88);
    this.t(`NIVEL ${m.level}: ${m.levelName}`, 'font', C.CREAM, 22, 12);
    this.t(`PUNTOS: ${m.score}`, 'small', C.WHITE, 22, 51);
    this.t('ENERGÍA', 'small', C.WHITE, 390, 12);
    this.bar(C.GRAY, 390, 39, 190, 18, 8);
    this.bar(m.energy > 30 ? C.GREEN : C.RED, 390, 39, (190 * Math.max(0, m.energy)) / 100, 18, 8);
    this.t(`${Math.max(0, Math.trunc(m.energy))}%`, 'small', C.WHITE, 590, 35);
    this.t(
      m.practice ? 'TIEMPO: ∞' : `TIEMPO: ${Math.max(0, Math.trunc(m.timeLeft))} s`,
      'small',
      C.WHITE,
      790,
      20,
    );
    if (m.level === 3) this.t(`MUESTRAS: ${m.samplesDone}/3`, 'small', C.YELLOW, 790, 51);
  }

  private race(m: GameModel) {
    this.bar(C.NAVY2, 45, 105, 910, 120, 14);
    this.t('RIVAL VIRTUAL AZUL', 'small', C.CREAM, 60, 112);
    this.line(C.TRACK, 2, 65, 205, 925, 205);
    const rx = 75 + Math.trunc(Math.min(1, m.rivalProgress / FINISH) * 790);
    this.rover(rx, 151, C.CYAN, 0.68);
    this.line(C.YELLOW, 4, 900, 125, 900, 215);
    this.t('META', 'small', C.YELLOW, 870, 108);
    this.bar(C.NAVY2, 45, 235, 910, 48, 10);
    this.t('SPIRIT', 'small', C.CREAM, 60, 246);
    this.bar(C.GRAY, 145, 266, 760, 7, 4);
    this.bar(C.GREEN, 145, 266, Math.min(1, m.scroll / FINISH) * 760, 7, 4);
    this.line(C.YELLOW, 4, 905, 238, 905, 280);
  }

  // ---------- pantallas ----------
  private game(m: GameModel, reducedMotion: boolean) {
    this.background(m.scroll);
    if (m.level === 2) this.race(m);
    this.objects(m);
    if (reducedMotion || m.cooldown <= 0 || Math.trunc(m.cooldown * 10) % 2 === 0) {
      this.rover(175, Math.trunc(m.playerY));
    }
    this.hud(m);
    if (m.level === 1) this.t('Esquiva las rocas y llega a la meta >>>', 'small', C.CREAM, 530, 115);
    else if (m.level === 2) this.t('¡No dejes que el rival virtual llegue primero!', 'small', C.CREAM, 500, 300);
    else this.t('Busca las tres muestras brillantes', 'small', C.CREAM, 430, 115);
  }

  private start() {
    this.background(0);
    this.t('LA RUTA DE SPIRIT', 'big', C.CREAM, W / 2, 125, true);
    this.t('MISIÓN DE EXPLORACIÓN EN MARTE', 'font', C.YELLOW, W / 2, 183, true);
    this.rover(455, 315, C.YELLOW, 1.25);
    this.t('Tres misiones. Un rover. Tú decides el camino.', 'font', C.WHITE, W / 2, 430, true);
    this.t('Presiona ENTER para comenzar', 'medium', C.GREEN, W / 2, 510, true);
    this.t('Mover: flechas o A/D | Saltar: ESPACIO o ARRIBA | Pausa: P', 'small', C.CREAM, W / 2, 565, true);
  }

  private instructions(m: GameModel) {
    this.background(0);
    this.bar(C.CREAM, 90, 85, 820, 485, 20);
    this.t(`NIVEL ${m.level}: ${m.levelName}`, 'big', C.NAVY, W / 2, 135, true);
    this.t('LEE LAS INSTRUCCIONES ANTES DE JUGAR', 'small', C.TEAL, W / 2, 190, true);
    INSTRUCTIONS[m.level].forEach((line, i) =>
      this.t(line, 'font', line.startsWith('PIERDES') ? C.RED : C.NAVY, 145, 245 + i * 48),
    );
    this.t('CONTROLES: flechas mover | ARRIBA o ESPACIO saltar | P pausar', 'small', C.TEAL, W / 2, 500, true);
    this.t('Presiona ENTER para iniciar la misión', 'medium', C.GREEN, W / 2, 545, true);
  }

  private questionScreen(m: GameModel) {
    this.background(0);
    this.rover(100, 450);
    this.bar(C.CREAM, 100, 105, 800, 420, 20);
    const q = m.question;
    this.t(`ANÁLISIS DE MUESTRA ${m.samplesDone + 1}/3`, 'small', C.TEAL, W / 2, 150, true);
    this.t(q.prompt, 'medium', C.NAVY, W / 2, 220, true);
    q.options.forEach((opt, i) => this.t(opt, 'font', C.NAVY, 190, 290 + i * 48));
    this.t('Presiona 1, 2 o 3 para responder', 'small', C.TEAL, W / 2, 470, true);
  }

  private complete(m: GameModel) {
    this.background(0);
    this.t('¡NIVEL COMPLETADO!', 'big', C.GREEN, W / 2, 220, true);
    this.rover(455, 310);
    this.t(`Has superado la misión ${m.level}.`, 'font', C.CREAM, W / 2, 420, true);
    this.t('Presiona ENTER para continuar', 'medium', C.YELLOW, W / 2, 500, true);
  }

  private lost(m: GameModel) {
    this.background(0);
    this.t('¡HAS PERDIDO!', 'huge', C.RED, W / 2, 205, true);
    this.t(m.lossReason, 'font', C.CREAM, W / 2, 300, true);
    this.rover(455, 365, C.RED);
    this.t(`Puntuación obtenida: ${m.score}`, 'font', C.YELLOW, W / 2, 465, true);
    this.t('ENTER: reintentar desde el nivel 1', 'medium', C.WHITE, W / 2, 530, true);
  }

  private won(m: GameModel) {
    this.background(0);
    this.t('¡FELICITACIONES!', 'big', C.GREEN, W / 2, 190, true);
    this.t('COMPLETASTE LAS TRES MISIONES', 'medium', C.CREAM, W / 2, 260, true);
    this.rover(455, 340, C.YELLOW, 1.2);
    this.t(`PUNTUACIÓN FINAL: ${m.score}`, 'font', C.YELLOW, W / 2, 450, true);
    this.t('ENTER: jugar nuevamente', 'medium', C.WHITE, W / 2, 520, true);
  }

  private paused(m: GameModel) {
    this.background(m.scroll);
    this.t('JUEGO EN PAUSA', 'big', C.CREAM, W / 2, 260, true);
    this.t('Presiona P para continuar', 'font', C.YELLOW, W / 2, 330, true);
  }

  render(m: GameModel, reducedMotion = false): void {
    this.g.clear();
    this.tp.begin();
    switch (m.phase) {
      case 'start': this.start(); break;
      case 'instructions': this.instructions(m); break;
      case 'playing': this.game(m, reducedMotion); break;
      case 'question': this.questionScreen(m); break;
      case 'complete': this.complete(m); break;
      case 'lost': this.lost(m); break;
      case 'won': this.won(m); break;
      case 'paused': this.paused(m); break;
    }
    this.tp.end();
  }
}
