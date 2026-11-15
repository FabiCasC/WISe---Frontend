/** Constantes del juego (equivalen a las globales del script en Python). */
export const W = 1000;
export const H = 650;

export const PLAYER_X = 175;
export const GROUND = 438;
export const FINISH = 1900;
export const SPEED = 275;

export const JUMP_VELOCITY = -590;
export const GRAVITY = 1450;
export const ENERGY_DRAIN = 1.2; // por segundo
export const RIVAL_SPEED = 150; // px/s en el nivel 2
export const ROCK_DAMAGE = 25;
export const WRONG_ANSWER_DAMAGE = 30;
export const BATTERY_ENERGY = 20;
export const BATTERY_SCORE = 20;
export const CORRECT_SCORE = 50;
export const LEVEL_SCORE = 100;
export const HIT_COOLDOWN = 1.0;
export const MAX_DT = 0.05;

/** Paleta (RGB del original convertido a hexadecimal). */
export const C = {
  NAVY: 0x0d2334,
  NAVY2: 0x173648,
  RUST: 0xbe7058,
  DARK: 0x8b4c42,
  SAND: 0xe09d77,
  CREAM: 0xfff7e6,
  WHITE: 0xffffff,
  YELLOW: 0xf5ca69,
  GREEN: 0x70be89,
  RED: 0xda5b4e,
  GRAY: 0x53676f,
  CYAN: 0x6fcadc,
  STAR: 0xbed3d5,
  HUB: 0x879d9d,
  ROCK: 0x69433b,
  TRACK: 0x647e89,
  TEAL: 0x367777,
} as const;

export const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
