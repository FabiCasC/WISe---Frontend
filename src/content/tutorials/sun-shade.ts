import type { Tutorial } from './types'

export default {
  gameId: 'sun-shade',
  story:
    'Spirit and Opportunity ran on solar panels, so without light they stopped. Curiosity and Perseverance carry a nuclear generator (an RTG) that makes power from heat, so they work in the shade, at night and in winter. Two power sources, two kinds of rover. You drive both.',
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
    { name: 'Plates and doors', meaning: 'Stand on a plate to open the matching door. Each rover has to help the other through.' },
    { name: 'Samples', meaning: 'Collect them on the way. They are worth points.' },
    { name: 'Stops', meaning: 'How many times a rover has been stopped. Fewer is better.' },
  ],
  practice: 'Walk the solar rover into a shaded zone to see it stop, then try the same with the nuclear one.',
} satisfies Tutorial
