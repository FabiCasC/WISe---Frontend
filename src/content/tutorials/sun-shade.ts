import type { Tutorial } from './types'

export default {
  gameId: 'sun-shade',
  story:
    'Spirit and Opportunity ran on solar panels, so without light they stopped. A nuclear generator (an RTG) makes power from the heat of its fuel, so it works in the shade and at night. Two power sources, two kinds of rover. You drive both: one solar and one nuclear.',
  controls: [
    { keys: ['A', 'D'], does: 'Move the SOLAR rover left and right' },
    { keys: ['W'], does: 'Jump with the SOLAR rover' },
    { keys: ['←', '→'], does: 'Move the NUCLEAR rover' },
    { keys: ['↑'], does: 'Jump with the NUCLEAR rover' },
    { keys: ['R'], does: 'Restart the level' },
    { keys: ['Tab'], does: 'On a phone or when playing alone: switch which rover the buttons drive', touch: 'Tap Swap' },
  ],
  parts: [
    { name: 'Solar rover', meaning: 'Needs sunlight. In the dark purple SHADE its panels make no power, so it stops. It is small, so it fits under low gaps.' },
    { name: 'Nuclear rover', meaning: 'Does not need the Sun, so shade is safe for it. It is bigger, so it cannot fit under low gaps.' },
    { name: 'Solar panel', meaning: 'A plate that turns light into electricity. Without light it stops, and dust on it blocks the light and lowers the power.' },
    { name: 'Nuclear generator (RTG)', meaning: 'A "battery" that turns the heat of its fuel, plutonium-238, into electricity. It needs no light.' },
    { name: 'Shadow', meaning: 'The area with no light behind an object. Here it is the dark purple zones.' },
    { name: 'Lander', meaning: 'A spacecraft that sets down in one place and stays there. Landers and rovers can each use solar panels or an RTG.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button shows all of them.' },
    { name: 'Plates and doors', meaning: 'Stand on a plate to open the matching door. Each rover has to help the other through.' },
    { name: 'Samples', meaning: 'Collect them on the way. They are worth points.' },
    { name: 'Stops', meaning: 'How many times a rover has been stopped. Fewer is better.' },
  ],
  steps: [
    { text: 'Press Start. Move the SOLAR rover with A and D, and jump with W.', keys: ['KeyA', 'KeyD', 'KeyW'] },
    { text: 'Now the NUCLEAR rover: move with ← and →, and jump with ↑.', keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp'] },
    { text: 'Walk the solar rover into a dark purple shade zone. With no sunlight its panels make no power, and it stops.' },
    { text: 'The nuclear rover makes power from heat, so shade does not stop it. But it is bigger: it cannot fit under low gaps.' },
    { text: 'Press R to restart a level any time. Both rovers have to reach their hatch, and they must help each other. Ready?', keys: ['KeyR'] },
  ],
} satisfies Tutorial
