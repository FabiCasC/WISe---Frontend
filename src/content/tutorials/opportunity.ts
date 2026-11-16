import type { Tutorial } from './types'

export default {
  gameId: 'opportunity',
  story:
    'Opportunity was a solar-powered robot rover that explored the flat plains of Meridiani Planum on Mars for more than 14 years. Its scientists worked in a careful order: take a photo of a rock first, grind off its dusty surface, and only then measure what it is made of. In this game you match tiles to do the same on a rock with three spots.',
  controls: [
    { keys: ['Tap a spot'], does: 'Choose spot A, B or C on the rock. Every tool you match acts on the chosen spot', touch: 'Same on a phone' },
    { keys: ['Tap', 'Drag'], does: 'Swap two neighbouring tiles. Line up 3 or more of the same tile in a row or column', touch: 'Same on a phone' },
    { keys: ['Shuffle'], does: 'Mixes the tiles when none of the matches you can make is the one you want. It costs 1 move' },
  ],
  parts: [
    { name: 'The rock and its three spots', meaning: 'A, B and C are three places on one rock. A "?" means you have not photographed it yet. Tap a spot to choose it.' },
    { name: 'Camera', meaning: 'Takes a photo of the chosen spot without touching it. The photo shows what the spot looks like: tiny round balls, thin layers or nothing special.' },
    { name: 'Grinder (RAT)', meaning: 'A grinder on the rover’s arm. It scrapes off the dust and the outer crust of the rock to show the fresh rock inside. RAT stands for Rock Abrasion Tool.' },
    { name: 'Chemistry reader (spectrometer)', meaning: 'Measures what a spot is made of. If the spot still has dust on it, it measures the dust, which is the same on every rock and tells you nothing about it.' },
    { name: 'Battery', meaning: 'Every tool uses 1 power. When the battery bar is empty the tools do nothing, so match battery tiles to recharge.' },
    { name: 'Moves', meaning: 'How many swaps you have left. Tiles that fall in and match by themselves give points but do not act on the rock, so aim your swaps.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button at the top shows all of them.' },
  ],
  steps: [
    { text: 'Tap spot A on the rock to choose it. Everything you match next acts on the chosen spot.', pointer: true },
    { text: 'Match 3 cameras to photograph the chosen spot. Look at what the photo shows before you touch anything.', pointer: true },
    { text: 'Now match 3 grinder tiles (RAT) to scrape the dust off the same spot. The spot turns dark: fresh rock.', pointer: true },
    { text: 'Match 3 chemistry reader tiles. Because you ground first, the reader measures the rock itself. Try it on a dusty spot too and see the difference.', pointer: true },
    { text: 'Watch the battery bar: match battery tiles to recharge. In the real levels the moves run out, so plan each swap. Ready?', pointer: true },
  ],
} satisfies Tutorial
