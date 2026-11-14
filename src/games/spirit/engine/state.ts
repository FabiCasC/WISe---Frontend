import {
  BATTERY_ENERGY, BATTERY_SCORE, CORRECT_SCORE, ENERGY_DRAIN, FINISH, GRAVITY, GROUND,
  HIT_COOLDOWN, JUMP_VELOCITY, LEVEL_SCORE, PLAYER_X, RIVAL_SPEED, ROCK_DAMAGE, SPEED,
  WRONG_ANSWER_DAMAGE,
} from './config';
import { LEVEL_NAMES, buildLevel, type Rect } from './data/levels';
import { QUESTIONS, type Question } from './data/questions';

export type Phase =
  | 'start' | 'instructions' | 'playing' | 'question'
  | 'complete' | 'lost' | 'won' | 'paused';

export interface InputState {
  right: boolean;
  left: boolean;
  jump: boolean;
}

/** Igual que pygame.Rect.colliderect: los bordes que solo se tocan no cuentan. */
const overlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Estado y reglas del juego. No depende de Phaser ni de React,
 * así se puede probar de forma aislada.
 */
export class GameModel {
  phase: Phase = 'start';
  level = 1;
  score = 0;
  energy = 100;
  timeLeft = 0;
  answersCorrect = true;

  scroll = 0;
  playerY = GROUND;
  vy = 0;
  onGround = true;
  cooldown = 0;

  rivalProgress = 0;
  samplesDone = 0;
  questionIndex = 0;
  lossReason = '';

  rocks: Rect[] = [];
  batteries: Rect[] = [];
  samples: Rect[] = [];

  private readonly initialLevel: number;

  constructor(level = 1, readonly practice = false) {
    this.initialLevel = level;
    this.level = level;
    this.resetLevel();
  }

  get levelName(): string {
    return LEVEL_NAMES[this.level];
  }

  get question(): Question {
    return QUESTIONS[this.questionIndex];
  }

  // ---------- flujo ----------
  resetLevel(): void {
    this.scroll = 0;
    this.playerY = GROUND;
    this.vy = 0;
    this.onGround = true;
    this.cooldown = 0;
    this.rivalProgress = 0;
    this.samplesDone = 0;
    const layout = buildLevel(this.level);
    this.timeLeft = layout.time;
    this.rocks = layout.rocks;
    this.batteries = layout.batteries;
    this.samples = layout.samples;
  }

  startLevel(): void {
    this.resetLevel();
    this.phase = 'instructions';
  }

  newGame(): void {
    this.level = this.initialLevel;
    this.score = 0;
    this.energy = 100;
    this.answersCorrect = true;
    this.startLevel();
  }

  private lose(reason: string): void {
    this.lossReason = reason;
    this.phase = 'lost';
  }

  private completeLevel(): void {
    if (!this.practice) this.score += LEVEL_SCORE;
    this.phase = 'complete';
  }

  private nextLevel(): void {
    if (this.level < 3) {
      this.level += 1;
      this.startLevel();
    } else {
      this.phase = 'won';
    }
  }

  // ---------- entradas discretas ----------
  handleEnter(): void {
    switch (this.phase) {
      case 'start':
      case 'lost':
      case 'won':
        this.newGame();
        break;
      case 'instructions':
        this.phase = 'playing';
        break;
      case 'complete':
        this.nextLevel();
        break;
      default:
        break;
    }
  }

  togglePause(): void {
    if (this.phase === 'playing') this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'playing';
  }

  answer(choice: number): void {
    if (this.phase !== 'question') return;
    if (choice === this.question.correct) {
      if (!this.practice) this.score += CORRECT_SCORE;
    } else {
      this.answersCorrect = false;
      if (!this.practice) this.energy -= WRONG_ANSWER_DAMAGE;
    }
    this.samplesDone += 1;

    if (this.energy <= 0) {
      this.energy = 0;
      this.lose('La energía de Spirit llegó a cero.');
    } else if (this.samplesDone >= 3) {
      this.completeLevel();
    } else {
      this.phase = 'playing';
    }
  }

  // ---------- simulación (solo en 'playing') ----------
  update(dt: number, input: InputState): void {
    if (input.right) this.scroll += SPEED * dt;
    if (input.left) this.scroll = Math.max(0, this.scroll - SPEED * 0.65 * dt);
    if (input.jump && this.onGround) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
    }
    this.vy += GRAVITY * dt;
    this.playerY += this.vy * dt;
    if (this.playerY >= GROUND) {
      this.playerY = GROUND;
      this.vy = 0;
      this.onGround = true;
    }

    const player: Rect = { x: PLAYER_X + 5, y: Math.trunc(this.playerY) + 8, w: 66, h: 40 };

    if (this.level === 2) {
      this.rivalProgress += RIVAL_SPEED * dt;
      if (this.rivalProgress >= FINISH) {
        this.lose('El rover rival azul llegó primero a la meta.');
        return;
      }
    }

    for (const rock of [...this.rocks]) {
      const r: Rect = { x: Math.trunc(rock.x - this.scroll), y: rock.y, w: rock.w, h: rock.h };
      if (overlap(player, r) && this.cooldown <= 0) {
        if (!this.practice) this.energy -= ROCK_DAMAGE;
        this.cooldown = HIT_COOLDOWN;
        this.rocks = this.rocks.filter((o) => o !== rock);
        if (!this.practice && this.energy <= 0) {
          this.energy = 0;
          this.lose('Spirit chocó con rocas y se quedó sin energía.');
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

    if (this.level === 3) {
      for (const s of [...this.samples]) {
        const r: Rect = { x: Math.trunc(s.x - this.scroll), y: s.y, w: s.w, h: s.h };
        if (overlap(player, r)) {
          this.samples = this.samples.filter((o) => o !== s);
          this.questionIndex = this.samplesDone;
          this.phase = 'question';
          return;
        }
      }
    }

    if (!this.practice) {
      this.energy -= ENERGY_DRAIN * dt;
      this.timeLeft -= dt;
    }
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (!this.practice && this.energy <= 0) {
      this.energy = 0;
      this.lose('Spirit se quedó sin energía.');
      return;
    }
    if (!this.practice && this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.lose('Se acabó el tiempo de la misión.');
      return;
    }
    if ((this.level === 1 || this.level === 2) && this.scroll >= FINISH) {
      this.completeLevel();
    }
  }
}
