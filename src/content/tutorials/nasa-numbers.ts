import type { Tutorial } from './types'

export default {
  gameId: 'nasa-numbers',
  story:
    'Every mission is built on measured numbers: how far away the Moon is, how long a light pulse takes to get there and back, what year a rover landed. In this game you find a NASA number by guessing, and the game tells you if you are too high or too low.',
  controls: [
    { keys: ['0-9'], does: 'Type your guess in the box', touch: 'Tap the box and type' },
    { keys: ['Enter'], does: 'Try your guess' },
  ],
  parts: [
    { name: 'The clue', meaning: 'The question about a mission, with ONE number as its answer.' },
    { name: 'The range', meaning: 'The smallest and biggest numbers you can guess. Shown inside the box.' },
    { name: 'Higher / Lower', meaning: 'After each guess the game tells you which way to go. Guess the middle of what is left and you will always get there fast.' },
    { name: 'Tries left', meaning: 'Every question has a limited number of tries. The limit is enough if you halve the range each time.' },
    { name: 'Mission log', meaning: 'After each question, a short true fact from a NASA source about the number you found.' },
  ],
  steps: [
    { text: 'Press Start. Read the clue, then type a number in the box and press Enter.', keys: ['Enter'] },
    { text: 'The game says Higher or Lower. Do not guess at random: try the middle of the range.' },
    { text: 'Each time, cut what is left in half. That way you find any number in just a few tries.' },
    { text: 'Read the mission log after each answer: it is a real NASA fact about that number.' },
    { text: 'The real levels count your tries, so use the halving trick. Ready?' },
  ],
} satisfies Tutorial
