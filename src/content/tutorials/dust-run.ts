import type { Tutorial } from './types'

export default {
  gameId: 'dust-run',
  story:
    'In June 2018 a dust storm covered the whole planet Mars. Opportunity ran on solar panels, so as the dust thickened it made less and less power, and on June 10 it went silent. You drive in its place and feel why.',
  controls: [
    { keys: ['Space', '↑'], does: 'Jump over rocks and dunes', touch: 'Tap Jump' },
    { keys: ['↓'], does: 'Duck under the high gusts of dust (levels 2 and 3)', touch: 'Hold Duck' },
  ],
  parts: [
    { name: 'Distance', meaning: 'How far you still have to drive. Reach the end before your power runs out.' },
    { name: 'Energy', meaning: 'Your battery. It drains all the time, and every crash costs you more.' },
    {
      name: 'Dust τ · sunlight',
      meaning:
        'τ (say "tau") measures how much dust blocks the Sun. The higher τ is, the less sunlight reaches your panels, and the faster your energy drains. The percentage is the sunlight that gets through.',
    },
    { name: 'Sun breaks', meaning: 'Bright patches you can catch to recharge your battery.' },
    { name: 'Rocks, dunes and gusts', meaning: 'Hit one and you lose energy. Jump the low ones, duck the high ones.' },
  ],
  practice: 'Practice has no energy loss. Jump a rock, catch a sun break and watch the τ meter climb as you go.',
} satisfies Tutorial
