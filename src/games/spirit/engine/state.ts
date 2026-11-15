import {
  BATTERY_ENERGY, BATTERY_SCORE, ENERGY_DRAIN, FINISH, GRAVITY, GROUND, HIT_COOLDOWN,
  JUMP_VELOCITY, LEVEL_SCORE, PLAYER_X, ROCK_DAMAGE, SPEED,
} from './config';
import { LEVEL_NAMES, buildLevel, type Rect, type Slope, type Zone } from './data/levels';

export type Phase = 'start' | 'instructions' | 'playing' | 'complete' | 'lost' | 'paused';

export interface InputState {
  right: boolean;
  left: boolean;
  jump: boolean;
}

export interface Decision {
  concept: string;
  correct: boolean;
}

/** Same as pygame.Rect.colliderect: edges that only touch do not count. */
const overlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// --- Tuning tied to the science of each level --------------------------------
/** Soft sand: wheels spin, the rover slows down and burns power. */
export const SAND_SPEED = 0.4;
export const SAND_DRAIN = 12;
/** Seconds inside one sand patch before the rover is stuck for good. */
export const STUCK_AFTER = 1.6;
/** Dragging the broken wheel makes Spirit slower. */
export const DRAG_SPEED = 0.72;
export const SILICA_NEEDED = 3;
/** Level 3: solar power by ground, with a low Sun in the north. */
export const POWER = { north: 1, flat: 0.55, south: 0.25 } as const;
export const PARK_SECONDS = 3;

const ROVER_W = 66;

/**
 * Game state and rules, independent of Phaser and React so they can be
 * tested on their own. There are no quiz questions: every concept is learned
 * by what the rover does on the ground.
 */
export class GameModel {
  phase: Phase = 'start';
  level = 1;
  score = 0;
  energy = 100;
  timeLeft = 0;

  scroll = 0;
  playerY = GROUND;
  vy = 0;
  onGround = true;
  cooldown = 0;
  lossReason = '';
  /** Short message shown on screen, with seconds left. */
  toast = '';
  toastTime = 0;

  rocks: Rect[] = [];
  batteries: Rect[] = [];
  sand: Zone[] = [];
  silica: Zone[] = [];
  slopes: Slope[] = [];

  /** Level 1: seconds spent in each sand patch; patches already judged. */
  sandTime = new Map<Zone, number>();
  private judgedSand = new Set<Zone>();
  /** Level 2: patches uncovered, and patches already judged (found or missed). */
  found = new Set<Zone>();
  private judgedSilica = new Set<Zone>();
  /** Level 3: seconds standing still, and where. */
  stillTime = 0;
  private judgedPark = new Set<string>();

  decisions: Decision[] = [];

  private readonly initialLevel: number;

  constructor(level = 1, readonly practice = false) {
    this.initialLevel = level;
    this.level = level;
    this.resetLevel();
  }

  get levelName(): string {
    return LEVEL_NAMES[this.level];
  }

  /** Is the rover body over this stretch of ground (world coordinates)? */
  private over(z: Zone): boolean {
    const left = this.scroll + PLAYER_X + 5;
    return left < z.x + z.w && z.x < left + ROVER_W;
  }

  /** Ground under the rover in level 3. */
  get ground(): 'north' | 'south' | 'flat' {
    const s = this.slopes.find((z) => this.over(z));
    return s ? s.facing : 'flat';
  }

  get solarPower(): number {
    return POWER[this.ground];
  }

  get onSand(): Zone | undefined {
    return this.onGround ? this.sand.find((z) => this.over(z)) : undefined;
  }

  // ---------- flow ----------
  resetLevel(): void {
    this.scroll = 0;
    this.playerY = GROUND;
    this.vy = 0;
    this.onGround = true;
    this.cooldown = 0;
    this.toast = '';
    this.toastTime = 0;
    this.stillTime = 0;
    const layout = buildLevel(this.level);
    this.timeLeft = layout.time;
    this.rocks = layout.rocks;
    this.batteries = layout.batteries;
    this.sand = layout.sand;
    this.silica = layout.silica;
    this.slopes = layout.slopes;
    this.sandTime = new Map();
    this.judgedSand = new Set();
    this.found = new Set();
    this.judgedSilica = new Set();
    this.judgedPark = new Set();
  }

  startLevel(): void {
    this.resetLevel();
    this.phase = 'instructions';
  }

  newGame(): void {
    this.level = this.initialLevel;
    this.score = 0;
    this.energy = 100;
    this.startLevel();
  }

  private say(msg: string, seconds = 3.5): void {
    this.toast = msg;
    this.toastTime = seconds;
  }

  private lose(reason: string): void {
    this.lossReason = reason;
    this.phase = 'lost';
  }

  private completeLevel(): void {
    if (!this.practice) this.score += LEVEL_SCORE + Math.max(0, Math.trunc(this.energy));
    this.phase = 'complete';
  }

  // ---------- discrete input ----------
  handleEnter(): void {
    switch (this.phase) {
      case 'start':
      case 'lost':
        this.newGame();
        break;
      case 'instructions':
        this.phase = 'playing';
        break;
      default:
        break;
    }
  }

  togglePause(): void {
    if (this.phase === 'playing') this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'playing';
  }

  // ---------- simulation (only in 'playing') ----------
  update(dt: number, input: InputState): void {
    const sandNow = this.onSand;
    let speed = SPEED;
    if (sandNow) speed *= SAND_SPEED;
    if (this.level === 2) speed *= DRAG_SPEED;

    const before = this.scroll;
    if (input.right) this.scroll += speed * dt;
    if (input.left) this.scroll = Math.max(0, this.scroll - speed * 0.65 * dt);
    const moved = this.scroll !== before;

    // A stuck wheel in sand cannot push off to jump.
    if (input.jump && this.onGround) {
      this.vy = JUMP_VELOCITY * (sandNow ? 0.55 : 1);
      this.onGround = false;
    }
    this.vy += GRAVITY * dt;
    this.playerY += this.vy * dt;
    if (this.playerY >= GROUND) {
      this.playerY = GROUND;
      this.vy = 0;
      this.onGround = true;
    }

    const player: Rect = { x: PLAYER_X + 5, y: Math.trunc(this.playerY) + 8, w: ROVER_W, h: 40 };

    for (const rock of [...this.rocks]) {
      const r: Rect = { x: Math.trunc(rock.x - this.scroll), y: rock.y, w: rock.w, h: rock.h };
      if (overlap(player, r) && this.cooldown <= 0) {
        if (!this.practice) this.energy -= ROCK_DAMAGE;
        this.cooldown = HIT_COOLDOWN;
        this.rocks = this.rocks.filter((o) => o !== rock);
        if (!this.practice && this.energy <= 0) {
          this.energy = 0;
          this.lose('Spirit hit the rocks and ran out of power.');
          return;
        }
      }
    }

    for (const bat of [...this.batteries]) {
      const r: Rect = { x: Math.trunc(bat.x - this.scroll), y: bat.y, w: bat.w, h: bat.h };
      if (overlap(player, r)) {
        this.energy = Math.min(100, this.energy + BATTERY_ENERGY);
        if (!this.practice) this.score += BATTERY_SCORE;
        this.batteries = this.batteries.filter((o) => o !== bat);
      }
    }

    if (this.level === 1 && this.updateSand(dt, sandNow)) return;
    if (this.level === 2) this.updateSilica();
    if (this.level === 3 && this.updateWinter(dt, moved)) return;

    if (!this.practice) {
      const drain = ENERGY_DRAIN + (sandNow ? SAND_DRAIN : 0);
      // Level 3: what the panels make depends on the slope under the rover.
      const charge = this.level === 3 ? (this.solarPower - POWER.flat) * 4 : 0;
      this.energy = Math.min(100, this.energy - (drain - charge) * dt);
      this.timeLeft -= dt;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.toastTime = Math.max(0, this.toastTime - dt);

    if (!this.practice && this.energy <= 0) {
      this.energy = 0;
      this.lose(sandNow ? 'The wheels spun in the sand until the batteries ran dry.' : 'Spirit ran out of power.');
      return;
    }
    if (!this.practice && this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.lose(
        this.level === 3
          ? 'Winter arrived and Spirit was not parked facing the Sun. In the cold, low power can be fatal.'
          : 'Mission time ran out.',
      );
      return;
    }

    if (this.scroll >= FINISH) {
      if (this.level === 1) return this.completeLevel();
      if (this.level === 2) {
        if (this.found.size >= SILICA_NEEDED) return this.completeLevel();
        return this.lose(
          `Only ${this.found.size} of ${SILICA_NEEDED} bright patches found. The dragged wheel only scrapes the soil while Spirit is on the ground.`,
        );
      }
      // Level 3 has no finish line: you win by parking well.
      this.scroll = FINISH;
    }
  }

  /** Returns true if the level ended. */
  private updateSand(dt: number, sandNow: Zone | undefined): boolean {
    if (sandNow) {
      const t = (this.sandTime.get(sandNow) ?? 0) + dt;
      this.sandTime.set(sandNow, t);
      if (t < dt * 1.5) this.say('Soft sand! The wheels sink and spin. Get out fast.', 2);
      if (!this.practice && t >= STUCK_AFTER) {
        this.decisions.push({ concept: 'arena-gasta-energia', correct: false });
        this.lose('Stuck in soft sand, just like Spirit near Home Plate in May 2009. It never got free.');
        return true;
      }
    }
    // Judge each patch once it is behind the rover.
    for (const z of this.sand) {
      if (this.judgedSand.has(z)) continue;
      if (z.x + z.w < this.scroll + PLAYER_X) {
        this.judgedSand.add(z);
        // A clipped landing does not count: only really driving through it does.
        const touched = (this.sandTime.get(z) ?? 0) > 0.2;
        this.decisions.push({ concept: 'arena-gasta-energia', correct: !touched });
        if (!touched) this.say('Clean jump over the sand: no power wasted.', 2);
      }
    }
    return false;
  }

  private updateSilica(): void {
    if (this.onGround) {
      for (const z of this.silica) {
        if (this.found.has(z) || !this.over(z)) continue;
        this.found.add(z);
        this.judgedSilica.add(z);
        if (!this.practice) this.score += 60;
        this.decisions.push({ concept: 'silice-agua-caliente', correct: true });
        this.say(
          this.found.size === 1
            ? 'Bright white soil! It is about 90% silica. On Earth this forms in hot springs or steam vents.'
            : `Silica patch ${this.found.size}: hot water once flowed through this ground.`,
          4.5,
        );
      }
    }
    // A patch the rover has already driven past without scraping is a sample
    // lost for good. It was a real decision (jump safely, or stay down and take
    // the hit), so it is logged as such instead of only ever logging successes.
    for (const z of this.silica) {
      if (this.judgedSilica.has(z)) continue;
      if (z.x + z.w < this.scroll + PLAYER_X) {
        this.judgedSilica.add(z);
        this.decisions.push({ concept: 'silice-agua-caliente', correct: false });
        this.say('You flew over bright soil: in the air the dragged wheel scrapes nothing.', 3);
      }
    }
  }

  /** Returns true if the level ended. */
  private updateWinter(dt: number, moved: boolean): boolean {
    if (moved || !this.onGround) {
      this.stillTime = 0;
      return false;
    }
    this.stillTime += dt;
    if (this.stillTime < PARK_SECONDS) return false;

    const ground = this.ground;
    const where = ground === 'flat' ? 'flat' : String(this.slopes.find((z) => this.over(z))!.x);
    if (ground === 'north') {
      this.decisions.push({ concept: 'inclinar-paneles-al-sol', correct: true });
      this.say('Parked facing north: the panels point at the low winter Sun.', 4);
      this.completeLevel();
      return true;
    }
    if (!this.judgedPark.has(where)) {
      this.judgedPark.add(where);
      if (ground === 'south') {
        this.decisions.push({ concept: 'inclinar-paneles-al-sol', correct: false });
        this.say('This slope faces SOUTH, away from the winter Sun: only 25% power. Try another.', 4.5);
      } else {
        this.say('Flat ground: 55% power. A slope that faces the Sun would give more.', 4);
      }
    }
    this.stillTime = 0;
    return false;
  }
}
