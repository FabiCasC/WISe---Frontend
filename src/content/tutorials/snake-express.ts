import type { Tutorial } from './types'

export default {
  gameId: 'snake-express',
  story:
    'The Moon has two kinds of ground. The dark plains, called lunar seas (maria), are old lava. The bright highlands are the oldest crust. Apollo crews brought back rocks from both, and left science packages behind on purpose to keep working. You walk the Moon like a train: every right rock you carry makes the train longer.',
  controls: [
    { keys: ['↑', '↓', '←', '→'], does: 'Walk (or W, A, S, D). You stand still until your first key', touch: 'Swipe, or use the arrow buttons' },
    { keys: ['Space'], does: 'Set down a science package (level 3)', touch: 'Tap the screen, or the Set down button' },
  ],
  parts: [
    { name: 'The lunar module (LM)', meaning: 'The spacecraft that took astronauts to the surface and back. You can only finish by walking back into it once you have what you need.' },
    { name: 'Dark rocks (basalt)', meaning: 'Basalt is dark volcanic rock that forms when lava cools. It is what the lunar seas are made of.' },
    { name: 'Bright rocks (highlands)', meaning: 'The highlands are the bright, mountainous parts of the Moon. They are its oldest crust, the outer layer of the rocky Moon.' },
    { name: 'Lunar sea (maria)', meaning: 'A big dark plain of rock that was once lava. Level 1 happens on one.' },
    { name: 'Your train', meaning: 'Every right rock you carry follows you as a wagon. A wrong rock breaks the last wagons off, costs you some air and does not come aboard.' },
    { name: 'Craters', meaning: 'Do not fall in. They have a bright rim.' },
    { name: 'Oxygen', meaning: 'Your backpack runs out, but only while you walk. Get home before it does.' },
    { name: 'Science package (ALSEP)', meaning: 'Level 3. Experiments you set down away from the lunar module so they keep sending data after you leave, as Apollo’s did.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button shows all of them.' },
  ],
  steps: [
    { text: 'Press Start. Nothing moves until you choose a direction: use the arrow keys or W A S D (or swipe).', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'], pointer: true },
    { text: 'Walk into a rock to pick it up. In level 1 only DARK rocks count: this is a lava plain. A bright rock breaks wagons off your train and the game tells you why.' },
    { text: 'Do not walk into your own train or into a crater.' },
    { text: 'When you have what you need, walk back into the lunar module (LM). Watch your Oxygen.' },
    { text: 'In level 2 the answer flips (bright rocks), and in level 3 you press Space to set down packages. Ready?', keys: ['Space'] },
  ],
} satisfies Tutorial
