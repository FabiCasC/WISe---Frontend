import type { Tutorial } from './types'

export default {
  gameId: 'sojourner-commands',
  story:
    'Sojourner, the first rover on Mars (1997), was driven from Earth. Radio signals took many minutes to get there, so nobody could steer it live: drivers planned its moves ahead, sent them, and waited to see what happened.',
  controls: [
    { keys: ['↑', '↓'], does: 'Add a command: go forward or back', touch: 'Tap the command buttons' },
    { keys: ['←', '→'], does: 'Add a command: turn left or right' },
    { keys: ['A'], does: 'Add the APXS measurement (levels 2 and 3)' },
    { keys: ['Backspace'], does: 'Undo the last command' },
    { keys: ['Enter'], does: 'Send the whole plan to Mars', touch: 'Tap Send' },
  ],
  parts: [
    { name: 'Plan', meaning: 'The commands you have lined up (there is a limit). They only run after you send them.' },
    { name: 'Radio delay', meaning: 'How many minutes your plan takes to reach Mars. That is why you cannot steer live.' },
    { name: 'Sol', meaning: 'A Martian day. You only have a few sols, so plan well.' },
    { name: 'Plans sent', meaning: 'How many plans you have sent to Mars so far.' },
    { name: 'APXS', meaning: 'Sojourner’s chemistry tool. It sits on the BACK of the rover, so you must back up to a rock to measure it.' },
  ],
  practice: 'Add three or four moves, press Enter, and watch the signal travel to Mars before the rover moves.',
} satisfies Tutorial
