import Phaser from 'phaser';
import { MAX_DT } from './config';
import { EventBus, type HudSnapshot } from './EventBus';
import { Renderer } from './Renderer';
import { GameModel } from './state';

const K = Phaser.Input.Keyboard.KeyCodes;

type KeyMap = Record<'left' | 'right' | 'up' | 'space' | 'a' | 'd' | 'w', Phaser.Input.Keyboard.Key>;

interface SceneOptions {
  levelId: number;
  practice: boolean;
  reducedMotion: boolean;
  onFinish: (completed: boolean, score: number, firstAnswerCorrect: boolean) => void;
}

export class MainScene extends Phaser.Scene {
  private model: GameModel;
  private sceneRenderer!: Renderer;
  private keys!: KeyMap;
  private lastHud = '';
  private finishSent = false;

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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => kb.off('keydown', this.onKeyDown, this));
  }

  /** Eventos discretos. Se ignora la repetición automática (pygame no la genera). */
  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    switch (e.key) {
      case 'Enter': this.model.handleEnter(); break;
      case 'p':
      case 'P': this.model.togglePause(); break;
      case '1':
      case '2':
      case '3': this.model.answer(Number(e.key)); break;
      default: break;
    }
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, MAX_DT);
    const k = this.keys;

    if (this.model.phase === 'playing') {
      this.model.update(dt, {
        right: k.right.isDown || k.d.isDown,
        left: k.left.isDown || k.a.isDown,
        jump: k.space.isDown || k.up.isDown || k.w.isDown,
      });
    }

    this.sceneRenderer.render(this.model, this.options.reducedMotion);
    this.publishHud();

    if (!this.finishSent && ['complete', 'lost', 'won'].includes(this.model.phase)) {
      this.finishSent = true;
      this.options.onFinish(
        this.model.phase !== 'lost',
        this.model.score,
        this.model.answersCorrect,
      );
    }
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
      samples: m.samplesDone,
    };
    const key = JSON.stringify(snap);
    if (key !== this.lastHud) {
      this.lastHud = key;
      EventBus.emit('hud', snap);
    }
  }
}
