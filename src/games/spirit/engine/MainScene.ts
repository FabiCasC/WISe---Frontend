import Phaser from 'phaser';
import { BACK_BOX, MAX_DT, padZone, type PadZone } from './config';
import { EventBus, type HudSnapshot } from './EventBus';
import { Renderer } from './Renderer';
import { GameModel, type Decision } from './state';

const K = Phaser.Input.Keyboard.KeyCodes;

type KeyMap = Record<'left' | 'right' | 'up' | 'space' | 'a' | 'd' | 'w', Phaser.Input.Keyboard.Key>;

interface SceneOptions {
  levelId: number;
  practice: boolean;
  reducedMotion: boolean;
  onFinish: (completed: boolean, score: number, decisions: Decision[]) => void;
}

export class MainScene extends Phaser.Scene {
  private model: GameModel;
  private sceneRenderer!: Renderer;
  private keys!: KeyMap;
  private lastHud = '';
  private finishSent = false;
  /** Which zone each finger/mouse button is holding down (see padZone). */
  private held = new Map<number, PadZone>();

  constructor(private readonly options: SceneOptions) {
    super('Main');
    this.model = new GameModel(options.levelId, options.practice);
  }

  create(): void {
    this.sceneRenderer = new Renderer(this);

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, space: K.SPACE, a: K.A, d: K.D, w: K.W,
    }) as KeyMap;
    // Evita que las flechas y la barra espaciadora desplacen la página.
    kb.addCapture([K.UP, K.DOWN, K.LEFT, K.RIGHT, K.SPACE]);
    kb.on('keydown', this.onKeyDown, this);

    // Touch/mouse path. Without it the game is keyboard-only and unplayable on
    // a tablet, while the rest of the arcade accepts both.
    this.input.addPointer(2); // two extra fingers: move and jump at the same time
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);
    this.input.on('gameout', this.releaseAll, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown', this.onKeyDown, this);
      this.input.off('pointerdown', this.onPointerDown, this);
      this.input.off('pointerup', this.onPointerUp, this);
      this.input.off('pointerupoutside', this.onPointerUp, this);
      this.input.off('gameout', this.releaseAll, this);
    });
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    const zone = padZone(p.x, p.y);
    if (zone === 'pause') {
      this.model.togglePause();
      return;
    }
    // Outside a run (title, instructions, win, loss) a tap is ENTER, so a
    // tablet can start the level and retry after losing.
    if (this.model.phase === 'paused') {
      this.model.togglePause();
      return;
    }
    // A level is only reported when the player has read its result screen.
    if (this.model.phase === 'complete') {
      this.finish(true);
      return;
    }
    if (this.model.phase === 'lost' && this.inBackBox(p.x, p.y)) {
      this.finish(false);
      return;
    }
    if (this.model.phase !== 'playing') {
      this.model.handleEnter();
      return;
    }
    this.held.set(p.id, zone);
  }

  private inBackBox(x: number, y: number): boolean {
    return x >= BACK_BOX.x && x <= BACK_BOX.x + BACK_BOX.w && y >= BACK_BOX.y && y <= BACK_BOX.y + BACK_BOX.h;
  }

  /** Tells the portal how the run ended. Only once, and only when the player is done with it. */
  private finish(completed: boolean): void {
    if (this.finishSent) return;
    this.finishSent = true;
    this.options.onFinish(completed, this.model.score, this.model.decisions);
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    this.held.delete(p.id);
  }

  /** The pointer left the canvas: nothing is being held any more. */
  private releaseAll(): void {
    this.held.clear();
  }

  /** Eventos discretos. Se ignora la repetición automática (pygame no la genera). */
  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    switch (e.key) {
      case 'Enter':
        if (this.model.phase === 'complete') this.finish(true);
        else this.model.handleEnter();
        break;
      case 'b':
      case 'B':
        if (this.model.phase === 'lost') this.finish(false);
        break;
      case 'p':
      case 'P': this.model.togglePause(); break;
      default: break;
    }
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, MAX_DT);
    const k = this.keys;

    if (this.model.phase === 'playing') {
      const touch = [...this.held.values()];
      this.model.update(dt, {
        right: k.right.isDown || k.d.isDown || touch.includes('right'),
        left: k.left.isDown || k.a.isDown || touch.includes('left'),
        jump: k.space.isDown || k.up.isDown || k.w.isDown || touch.includes('jump'),
      });
    } else {
      this.held.clear(); // a tap that changed phase must not keep driving
    }

    this.sceneRenderer.render(this.model, this.options.reducedMotion);
    this.publishHud();

  }

  /** Avisa a React solo cuando cambia algún valor visible. */
  private publishHud(): void {
    const m = this.model;
    const snap: HudSnapshot = {
      phase: m.phase,
      level: m.level,
      levelName: m.levelName,
      score: m.score,
      energy: Math.max(0, Math.trunc(m.energy)),
      time: Math.max(0, Math.trunc(m.timeLeft)),
      samples: m.found.size,
    };
    const key = JSON.stringify(snap);
    if (key !== this.lastHud) {
      this.lastHud = key;
      EventBus.emit('hud', snap);
    }
  }
}
