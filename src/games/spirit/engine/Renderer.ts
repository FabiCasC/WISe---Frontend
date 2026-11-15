import Phaser from 'phaser';
import { C, H, PAUSE_BOX, PLAYER_X, SKY_Y, W, hex } from './config';
import { INSTRUCTIONS } from './data/levels';
import { SILICA_NEEDED, type GameModel } from './state';

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
    const sx = (x: number) => Math.trunc(x - m.scroll);

    // Level 1: soft sand, pale and rippled.
    for (const z of m.sand) {
      const x = sx(z.x);
      if (x > W || x + z.w < 0) continue;
      this.bar(0xf2c79a, x, 486, z.w, 18, 6);
      for (let k = 8; k < z.w - 8; k += 22) this.line(0xc98f62, 2, x + k, 494, x + k + 12, 497);
    }

    // Level 2: bright silica, hidden until the dragged wheel scrapes it.
    for (const z of m.silica) {
      const x = sx(z.x);
      if (x > W || x + z.w < 0) continue;
      if (m.found.has(z)) {
        this.bar(0xfdfaf2, x, 488, z.w, 12, 4);
        this.t('SILICA', 'small', C.CREAM, x + z.w / 2, 516, true);
      } else {
        // A faint hint: slightly paler dust.
        this.bar(0xc98a6e, x, 489, z.w, 6, 3);
      }
    }

    // Level 3: slopes. A north-facing slope tilts toward the Sun (right).
    for (const z of m.slopes) {
      const x = sx(z.x);
      if (x > W + 40 || x + z.w < -40) continue;
      // No label: the aspect of a slope is something to READ OFF the picture.
      // The compass and the Sun are drawn below, so which way the face is
      // tilted (and how lit it is) is all the player needs — and all they get.
      const north = z.facing === 'north';
      this.poly(north ? 0xa75f49 : 0x7d4639, north
        ? [[x, 490], [x + z.w, 430], [x + z.w, 490]]
        : [[x, 430], [x + z.w, 490], [x, 490]]);
    }

    for (const o of m.rocks) {
      const x = sx(o.x);
      if (x > -60 && x < W + 60) {
        this.poly(C.ROCK, [[x, 490], [x + 7, 465], [x + 25, 452], [x + 43, 474], [x + 48, 490]]);
      }
    }
    for (const o of m.batteries) {
      const x = sx(o.x);
      if (x > -40 && x < W + 40) {
        this.bar(C.YELLOW, x, o.y, 28, 32, 4);
        this.bar(C.CREAM, x + 9, o.y - 5, 10, 5);
        this.t('+', 'small', C.NAVY, x + 8, o.y + 3);
      }
    }
    if (m.level === 2) {
      // The trench left by the dragged wheel.
      this.line(0x6b3a31, 4, 0, 494, PLAYER_X + 17, 494);
    }
    if (m.level === 3) {
      // Low winter Sun in the north (to the right) and a compass.
      this.circle(C.YELLOW, 930, 300, 26);
      this.t('SUN (north, low)', 'small', C.YELLOW, 930, 345, true);
      this.t('S  ←   → N', 'small', C.CREAM, 120, 115, true);
    }
  }

  private hud(m: GameModel) {
    this.bar(C.NAVY, 0, 0, W, 88);
    this.t(`LEVEL ${m.level}: ${m.levelName}`, 'font', C.CREAM, 22, 12);
    this.t(`POINTS: ${m.score}`, 'small', C.WHITE, 22, 51);
    this.t('POWER', 'small', C.WHITE, 390, 12);
    this.bar(C.GRAY, 390, 39, 190, 18, 8);
    this.bar(m.energy > 30 ? C.GREEN : C.RED, 390, 39, (190 * Math.max(0, m.energy)) / 100, 18, 8);
    this.t(`${Math.max(0, Math.trunc(m.energy))}%`, 'small', C.WHITE, 590, 35);
    const clock = m.level === 3 ? 'WINTER IN' : 'TIME';
    this.t(m.practice ? `${clock}: ∞` : `${clock}: ${Math.max(0, Math.trunc(m.timeLeft))} s`, 'small', C.WHITE, 760, 14);
    if (m.level === 2) this.t(`BRIGHT SOIL: ${m.found.size}/${SILICA_NEEDED}`, 'small', C.YELLOW, 760, 51);
    // Level 3 shows no SOLAR POWER percentage: a live number that reads 100%
    // on the right slope is the answer, not a clue. The POWER bar still rises
    // or falls with where the rover stands, which is the honest signal.
    // Pause chip, so a tablet has somewhere to tap for P.
    this.bar(C.NAVY2, PAUSE_BOX.x + 10, 8, PAUSE_BOX.w - 24, 34, 8);
    this.t('II', 'small', C.CREAM, PAUSE_BOX.x + PAUSE_BOX.w / 2 - 2, 25, true);
  }

  /**
   * Hints for the touch zones of padZone(). They are only hints: the whole
   * half-screen is live, so a finger does not have to find a small button.
   */
  private pad() {
    this.g.fillStyle(C.CREAM, 0.1);
    this.g.fillRoundedRect(28, H - 92, 128, 64, 14);
    this.g.fillRoundedRect(W - 156, H - 92, 128, 64, 14);
    this.t('< BACK', 'small', C.CREAM, 92, H - 60, true);
    this.t('FWD >', 'small', C.CREAM, W - 92, H - 60, true);
    this.g.lineStyle(2, C.CREAM, 0.14);
    this.g.lineBetween(0, SKY_Y, W, SKY_Y);
    this.t('TAP ABOVE THE LINE TO JUMP', 'small', C.CREAM, W / 2, SKY_Y + 16, true);
  }

  // ---------- screens ----------
  private game(m: GameModel, reducedMotion: boolean) {
    this.background(m.scroll);
    this.objects(m);
    if (reducedMotion || m.cooldown <= 0 || Math.trunc(m.cooldown * 10) % 2 === 0) {
      this.rover(175, Math.trunc(m.playerY));
    }
    this.hud(m);
    this.pad();
    if (m.toastTime > 0 && m.toast) {
      this.bar(C.NAVY2, 60, 108, 880, 46, 12);
      this.t(m.toast, 'small', C.CREAM, W / 2, 131, true);
    } else if (m.level === 1) this.t('Jump over the soft sand and the rocks >>>', 'small', C.CREAM, 530, 115);
    else if (m.level === 2) this.t('Stay on the ground to scrape the soil. Jumping a rock skips its sample.', 'small', C.CREAM, 330, 115);
    else this.t('Stand still 3 s to park. Which slope is tilted toward the Sun?', 'small', C.CREAM, 380, 115);
  }

  private start() {
    this.background(0);
    this.t("SPIRIT'S ROUTE", 'big', C.CREAM, W / 2, 125, true);
    this.t('A MARS EXPLORATION MISSION', 'font', C.YELLOW, W / 2, 183, true);
    this.rover(455, 315, C.YELLOW, 1.25);
    this.t('Three real moments from Spirit\'s six years on Mars.', 'font', C.WHITE, W / 2, 430, true);
    this.t('Press ENTER or tap to start', 'medium', C.GREEN, W / 2, 510, true);
    this.t('Keys: arrows or A/D, SPACE to jump, P to pause | Touch: tap the screen', 'small', C.CREAM, W / 2, 565, true);
  }

  private instructions(m: GameModel) {
    this.background(0);
    this.bar(C.CREAM, 70, 85, 860, 485, 20);
    this.t(`LEVEL ${m.level}: ${m.levelName}`, 'big', C.NAVY, W / 2, 135, true);
    this.t('READ THIS BEFORE YOU DRIVE', 'small', C.TEAL, W / 2, 190, true);
    INSTRUCTIONS[m.level].forEach((line, i) =>
      this.t(line, 'small', line.startsWith('You LOSE') ? C.RED : C.NAVY, 110, 240 + i * 46),
    );
    this.t('CONTROLS: arrows or A/D | UP or SPACE to jump | P to pause | or tap the screen', 'small', C.TEAL, W / 2, 500, true);
    this.t('Press ENTER or tap to start the mission', 'medium', C.GREEN, W / 2, 545, true);
  }

  private complete(m: GameModel) {
    this.background(0);
    this.t('LEVEL COMPLETE!', 'big', C.GREEN, W / 2, 220, true);
    this.rover(455, 310);
    this.t(`You finished mission ${m.level}.`, 'font', C.CREAM, W / 2, 420, true);
  }

  private lost(m: GameModel) {
    this.background(0);
    this.t('MISSION LOST', 'huge', C.RED, W / 2, 205, true);
    this.t(m.lossReason, 'small', C.CREAM, W / 2, 300, true);
    this.rover(455, 365, C.RED);
    this.t(`Points: ${m.score}`, 'font', C.YELLOW, W / 2, 465, true);
  }

  private paused(m: GameModel) {
    this.background(m.scroll);
    this.t('PAUSED', 'big', C.CREAM, W / 2, 260, true);
    this.t('Press P or tap to continue', 'font', C.YELLOW, W / 2, 330, true);
  }

  render(m: GameModel, reducedMotion = false): void {
    this.g.clear();
    this.tp.begin();
    switch (m.phase) {
      case 'start': this.start(); break;
      case 'instructions': this.instructions(m); break;
      case 'playing': this.game(m, reducedMotion); break;
      case 'complete': this.complete(m); break;
      case 'lost': this.lost(m); break;
      case 'paused': this.paused(m); break;
    }
    this.tp.end();
  }
}
