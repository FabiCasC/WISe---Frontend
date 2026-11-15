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
  ],
  practice: 'Dig a spot, press N a couple of times, and look for the chunks that shrink.',
} satisfies Tutorial
