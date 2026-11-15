import Phaser from 'phaser';
import type { Phase } from './state';

/** Datos que Phaser publica para que React los muestre. */
export interface HudSnapshot {
  phase: Phase;
  level: number;
  levelName: string;
  score: number;
  energy: number;
  time: number;
  samples: number;
}

export const EventBus = new Phaser.Events.EventEmitter();
