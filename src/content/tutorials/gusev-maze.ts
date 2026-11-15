import type { Tutorial } from './types'

export default {
  gameId: 'gusev-maze',
  story:
    'On Mars, dust kept settling on Spirit’s solar panels and cutting its power. Sometimes a passing dust devil, a little whirlwind, blew the panels clean again. The team called it a cleaning event.',
  controls: [
    { keys: ['←', '↑', '↓', '→'], does: 'Move through the maze', touch: 'Swipe, or use the arrow buttons' },
    { keys: ['W', 'A', 'S', 'D'], does: 'Move (same as the arrows)' },
  ],
  parts: [
    { name: 'Samples', meaning: 'The dots to collect. Collect all of them to finish the level. Bigger glowing ones are rare and give more points.' },
    {
      name: 'Panel power',
      meaning:
        'How clean your solar panels are. Dust builds up, your rover gets slower, and at 0% it stops. Your panels change colour from blue to brown as they get dusty.',
    },
    {
      name: 'Dust devils',
      meaning:
        'The swirls wandering around. They are not enemies: drive into one when your panels are dusty and its wind cleans them, so your power jumps back up.',
    },
    { name: 'Rovers', meaning: 'Your lives. You lose one when the dust covers your panels completely.' },
  ],
  practice: 'Dust builds up slowly here. Let your panel power fall a little, then drive into a dust devil and watch it recover.',
} satisfies Tutorial
