import type { Tutorial } from './types'

export default {
  gameId: 'ingenuity-flight',
  story:
    'Ingenuity was the first helicopter to fly on another planet. Mars air is less than 1% as thick as Earth’s, so its blades had to spin much faster than a helicopter’s on Earth just to lift off. It flew 72 times before a damaged blade ended its mission.',
  controls: [
    { keys: ['↑', 'W', 'Space'], does: 'Spin the rotor faster (it keeps its speed when you let go)', touch: 'Touch the top of the screen' },
    { keys: ['↓', 'S'], does: 'Spin the rotor slower', touch: 'Touch the bottom of the screen' },
    { keys: ['←', '→'], does: 'Fly sideways', touch: 'Touch the left or right edge' },
  ],
  parts: [
    { name: 'Rotor speed', meaning: 'How fast the blades spin, in rpm. Below a certain speed there is not enough lift, so you cannot leave the ground. The gauge marks the speed that lifts you on Mars.' },
    { name: 'Height', meaning: 'How high above the ground you are, in metres.' },
    { name: 'Battery', meaning: 'Ingenuity charged a solar panel and could fly about 90 seconds a day. Climbing hard uses more power.' },
    { name: 'Goal', meaning: 'What to do this level: reach a height, photograph the rocks, or land at the new base.' },
    { name: 'NAV', meaning: 'Ingenuity’s camera needs ground with texture, like pebbles. Over smooth sand ripples it gets lost.' },
  ],
  steps: [
    { text: 'Press Start the rotors. Hold ↑ to spin the blades faster. Watch Rotor speed.', keys: ['ArrowUp', 'KeyW', 'Space'] },
    { text: 'Keep going until the speed passes the lift-off mark. Below it, Mars air is too thin to lift you.' },
    { text: 'Your height should climb now. Press ↓ to slow the blades and come down gently.', keys: ['ArrowDown', 'KeyS'] },
    { text: 'Use ← and → to fly sideways.', keys: ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'] },
    { text: 'In the real levels the battery counts down and you must land softly. Ready?' },
  ],
} satisfies Tutorial
