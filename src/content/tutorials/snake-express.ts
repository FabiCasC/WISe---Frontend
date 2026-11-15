import type { Tutorial } from './types'

export default {
  gameId: 'snake-express',
  story:
    'The Moon has two kinds of ground. The dark plains, called maria, are old lava. The bright highlands are the oldest crust. Apollo crews brought back rocks from both, and left science packages behind on purpose to keep working. You walk the Moon and collect.',
  controls: [
    { keys: ['↑', '↓', '←', '→'], does: 'Walk (or W, A, S, D)', touch: 'Swipe, or use the arrow buttons' },
    { keys: ['Space'], does: 'Set down a science package (level 3)', touch: 'Tap the screen, or the Set down button' },
  ],
  parts: [
    { name: 'The lunar module (LM)', meaning: 'Your way home. You can only finish by walking back into it once you have what you need.' },
    { name: 'Dark rocks', meaning: 'Basalt: cooled lava from the dark plains.' },
    { name: 'Bright rocks', meaning: 'Pieces of the Moon’s oldest crust, from the highlands.' },
    { name: 'Craters', meaning: 'Do not fall in. They have a bright rim.' },
    { name: 'Your tail', meaning: 'Everything you carry follows you. Do not walk into it.' },
    { name: 'Oxygen', meaning: 'Your backpack runs out. Get home before it does.' },
    { name: 'Packages (level 3)', meaning: 'Gold boxes you set down away from the lunar module. They stay and keep sending data, as Apollo’s experiments did.' },
  ],
  steps: [
    { text: 'Press Start. Walk with the arrow keys or W A S D (or swipe).', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'], pointer: true },
    { text: 'Walk into a rock to pick it up. In level 1, only DARK rocks count: this is a lava plain. A bright rock does not help, and the game tells you why.' },
    { text: 'Your tail grows as you carry things. Do not walk into your own tail, or into a crater.' },
    { text: 'When you have what you need, walk back into the lunar module (LM). Watch your Oxygen.' },
    { text: 'In level 2 the answer flips (bright rocks), and in level 3 you press Space to set down packages. Ready?', keys: ['Space'] },
  ],
} satisfies Tutorial
