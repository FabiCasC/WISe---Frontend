import type { Tutorial } from './types'

export default {
  gameId: 'phoenix-ice',
  story:
    'Phoenix landed near the north pole of Mars in 2008 and dug trenches with its robotic arm. Bright chunks in one trench vanished in a few days: water ice turning straight into gas. That is how scientists knew it was ice.',
  controls: [
    { keys: ['1', '2', '3', '4', '5'], does: 'Dig that spot (keys 1 to 6 on the levels with six spots)', touch: 'Tap a spot' },
    { keys: ['N'], does: 'Wait one sol (a Martian day) and watch what changes', touch: 'Tap Next sol' },
    { keys: ['O'], does: 'Put the selected scoop in the oven (levels 2 and 3)', touch: 'Tap Oven' },
    { keys: ['Enter'], does: 'Send your report or run the oven' },
  ],
  parts: [
    { name: 'Sol', meaning: 'A Martian day. Things change from one sol to the next, so waiting is part of the science.' },
    { name: 'Energy', meaning: 'Phoenix runs on a solar panel, so it only has so many actions. Digging and waiting use it up.' },
    { name: 'Bright chunks', meaning: 'Water ice or salt, and they look the same! Watch them over several sols: ice slowly disappears, salt stays.' },
    { name: 'Labeled', meaning: 'How many chunks you have labeled Ice or Salt (tap a chunk to change its label).' },
    { name: 'Ovens left', meaning: 'Phoenix could heat a sample in a small oven to look for water. You only have a few ovens.' },
    { name: 'Water readings', meaning: 'How many times the oven found water. Ice left in the open turns to gas, so use fresh samples.' },
    { name: 'Sublimation', meaning: 'Changing from ice straight to gas, without becoming liquid. It is why ice chunks shrink and vanish.' },
    { name: 'Water ice', meaning: 'Frozen water. On Mars it hides under the soil near the poles.' },
    { name: 'Salt', meaning: 'A mineral that does not shrink or vanish with the days.' },
    { name: 'Oven', meaning: 'An instrument that heats a sample to see if it releases water.' },
    { name: 'Trench', meaning: 'A ditch dug by the arm of the lander.' },
    { name: 'Sol', meaning: 'One day on Mars. Each sol the Sun gives less light as winter comes.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button shows all of them.' },
  ],
  steps: [
    { text: 'Press Start digging. Dig a spot: press a number key (1 to 5), or tap a spot.', keys: ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'], pointer: true },
    { text: 'Press N to wait one sol (a Martian day). Look for bright chunks that get smaller.', keys: ['KeyN'] },
    { text: 'Bright chunks that vanish were water ice turning into gas. The ones that stay are salt. Watch a few sols.' },
    { text: 'Tap a chunk to label it Ice or Salt. In the later levels, Enter or O puts a scoop in the oven to look for water.', keys: ['KeyO', 'Enter'] },
    { text: 'Energy and ovens are limited, like on the real Phoenix. Ready?' },
  ],
} satisfies Tutorial
