import type { Tutorial } from './types'

export default {
  gameId: 'lunar-rover',
  story:
    'Apollo 15, 16 and 17 each took an electric Lunar Roving Vehicle to the Moon and left it there. Its batteries could not be recharged, so every drive had to end back at the lunar module. You plan a short trip, collect samples and get home.',
  controls: [
    { keys: ['↑', '↓', '←', '→'], does: 'Drive (or W, A, S, D)', touch: 'Hold your finger on the map and the rover drives toward it' },
  ],
  parts: [
    { name: 'Battery', meaning: 'It never recharges. Every metre you drive uses some, so you must reserve enough to get back.' },
    { name: 'Samples', meaning: 'The rocks to collect at each station on the map.' },
    { name: 'To the LM', meaning: 'How far you are from the lunar module (LM), your way home.' },
    { name: 'Driven', meaning: 'The distance you have driven so far.' },
    { name: 'Walk-back circle (level 2)', meaning: 'Stay inside it. If the rover broke, the astronauts had to be able to walk back to the lunar module.' },
    { name: 'Navigation arrow (level 3)', meaning: 'Hills hide the lunar module, so follow the arrow, like the real rover’s navigation computer, which always knew the way home.' },
  ],
  steps: [
    { text: 'Press Start driving. Drive with the arrow keys or W A S D (or hold a finger on the map).', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'], pointer: true },
    { text: 'Look at Battery. It does not recharge on the Moon: every metre counts.' },
    { text: 'Drive to a sample station to collect a sample.' },
    { text: 'Watch To the LM. Keep enough battery to drive home, and in level 2 stay inside the walk-back circle.' },
    { text: 'Plan a short loop and always know the way back. The real levels have a smaller battery. Ready?' },
  ],
} satisfies Tutorial
