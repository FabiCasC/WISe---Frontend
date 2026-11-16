import type { Tutorial } from './types'

export default {
  gameId: 'opportunity',
  story:
    'Opportunity was a solar-powered rover that explored the plains of Meridiani on Mars for more than 14 years. Its scientists worked in a careful order: look at a rock first, grind off the dusty surface, and only then analyze what is inside. In this game you do the same, by matching the rover’s tools.',
  controls: [
    { keys: ['Tap'], does: 'Tap a tile, then tap a tile next to it, to swap them', touch: 'Same on a phone' },
    { keys: ['Drag'], does: 'Or drag a tile toward its neighbour to swap them' },
  ],
  parts: [
    { name: 'The grid of tiles', meaning: 'Each tile is one of the rover’s tools. Line up 3 or more of the same tool, in a row or a column, to use it. A swap that makes no match goes back.' },
    { name: 'Camera', meaning: 'Takes pictures. In level 1, every camera you match uncovers a piece of the rock photo.' },
    { name: 'RAT (the orange wheel)', meaning: 'The rock abrasion tool. It grinds off the dust and the weathered surface so you can see fresh rock.' },
    { name: 'Spectrometer (the purple target)', meaning: 'Reads the chemistry of the rock. From level 2 the right panel draws what it measured: on a dusty rock you get a flat dust reading that tells you nothing; on a ground rock you see a real mineral.' },
    { name: 'Energy (the lightning bolt)', meaning: 'The rover’s power and radio link. Some goals need it.' },
    { name: 'Moves', meaning: 'How many swaps you have left. Tiles that fall and match by themselves give points but do not count toward your goal, so aim your swaps.' },
  ],
  steps: [
    { text: 'Tap a camera tile, then tap a tile next to it to swap them. Try to line up 3 of the same tool.', pointer: true },
    { text: 'Look at the left panel: it shows what you still need to collect. In level 1, every camera you match uncovers part of the rock photo.' },
    { text: 'Look first, then touch: scientists photograph a rock before they disturb it. In level 2 you must match the RAT before the spectrometer.' },
    { text: 'The RAT grinds off the dust. Analyzing a dusty rock gives bad data, so the spectrometer only counts after the grinding.' },
    { text: 'In practice you have unlimited moves. In the real levels they run out, so plan each swap. Ready?' },
  ],
} satisfies Tutorial
