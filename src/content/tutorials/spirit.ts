import type { Tutorial } from './types'

export default {
  gameId: 'spirit',
  story:
    'Spirit explored Gusev crater on Mars for six years, far longer than planned. A broken wheel, soft sand and the cold winter all shaped its mission. You live three real moments of it: soft sand that traps it, the wheel that uncovered a clue, and surviving the winter.',
  controls: [
    { keys: ['←', '→'], does: 'Drive back and forward (or A and D)', touch: 'Hold the BACK or FWD buttons at the bottom' },
    { keys: ['Space', '↑', 'W'], does: 'Jump over rocks and sand', touch: 'Tap above the horizon line' },
    { keys: ['P'], does: 'Pause the game' },
  ],
  parts: [
    { name: 'Power', meaning: 'Spirit’s battery. It drains while you drive, and a rock hit takes a chunk. Yellow cells give some back.' },
    { name: 'Time / Winter in', meaning: 'How long you have. On the winter level it counts down to the cold season.' },
    { name: 'Soft sand (level 1)', meaning: 'The pale, rippled ground. Wheels spin and drain power, and if you stay too long, Spirit gets stuck for good, like it did in 2009. Jump over it.' },
    { name: 'Bright soil (level 2)', meaning: 'Spirit’s right front wheel was broken and dragged along the ground. Where it scraped, it uncovered bright silica soil, a clue that hot water was once there. Most of it is buried under rocks.' },
    { name: 'Slopes and Solar power (level 3)', meaning: 'Gusev is south of the equator, so in winter the Sun is low in the north. Park on the slope tilted toward it to get the most power.' },
    { name: 'Silica', meaning: 'A light-colored mineral. On Earth it usually forms where there is hot water.' },
    { name: 'Hot springs', meaning: 'Springs of hot water coming out of the ground. Silica like Spirit found is a sign that something like that was once there.' },
    { name: 'Solar panel', meaning: 'A plate that turns sunlight into electricity. The more it faces the Sun, the more power you get.' },
    { name: 'Home Plate', meaning: 'The area of Mars where Spirit got stuck in sand.' },
    { name: 'Words with a dotted line', meaning: 'The ? button in the corner lists every word of this game and what it means.' },
  ],
  steps: [
    { text: 'Press Enter (or tap) to start, then drive with → or D.', keys: ['ArrowRight', 'KeyD'], pointer: true },
    { text: 'Press Space to jump over a rock. Jumping is also how you cross soft sand quickly.', keys: ['Space', 'ArrowUp', 'KeyW'] },
    { text: 'Look at Power. Driving drains it, rocks cost you more, and yellow cells give some back.' },
    { text: 'Soft sand drains your power and slows you down, and too long in it means getting stuck for good. On the real levels, jump it.' },
    { text: 'Level 2 hides bright soil under rocks and level 3 asks you to park on the right slope. The level screen explains each. Ready?' },
  ],
} satisfies Tutorial
