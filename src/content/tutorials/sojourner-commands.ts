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
  steps: [
    { text: 'Press Start planning. Add a few moves with the arrow keys: ↑ forward, ↓ back, ← and → turn.', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyQ', 'KeyE'] },
    { text: 'Made a mistake? Backspace undoes the last command.', keys: ['Backspace'] },
    { text: 'Press Enter to send the plan to Mars. Watch the signal travel: that is the Radio delay, and nothing moves until it arrives.', keys: ['Enter'] },
    { text: 'Now the rover runs your whole plan, with no way to steer it. That is why planners had to think ahead.' },
    { text: 'In levels 2 and 3 press A to use the APXS on the back of the rover. Ready?' },
  ],
} satisfies Tutorial
