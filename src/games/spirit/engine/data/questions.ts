export interface Question {
  prompt: string;
  options: string[];
  /** Número de la opción correcta (1, 2 o 3), igual que en el original. */
  correct: number;
  explanation: string;
}

export const QUESTIONS: Question[] = [
  {
    prompt: '¿En qué planeta explora el rover Spirit?',
    options: ['1. Marte', '2. Júpiter', '3. Venus'],
    correct: 1,
    explanation: 'Spirit fue un rover que exploró Marte.',
  },
  {
    prompt: '¿Qué dejó al descubierto la rueda averiada de Spirit?',
    options: ['1. Suelo rico en sílice', '2. Un río actual', '3. Hielo bajo la superficie'],
    correct: 1,
    explanation: 'El arrastre de la rueda expuso suelo muy rico en sílice.',
  },
  {
    prompt: '¿Qué indica la sílice encontrada por Spirit?',
    options: ['1. Prueba de vida', '2. Posibles procesos con agua caliente', '3. Agua líquida actual'],
    correct: 2,
    explanation: 'La sílice es una pista de procesos con agua caliente, no una prueba de vida.',
  },
];
