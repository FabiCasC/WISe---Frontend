import type { Tutorial } from './types'

export default {
  gameId: 'orbital-grid',
  story:
    'To talk to a far-away probe, an antenna has to have it above its horizon, and the Earth turns once a day. That is why NASA’s Deep Space Network has three sites, in California, Spain and Australia, spread around the world.',
  controls: [
    { keys: ['Click'], does: 'Place a dish on the ring, or tap a dish again to remove it', touch: 'Tap the ring' },
    { keys: ['←', '→', 'Space'], does: 'Move the cursor around the ring and place a dish' },
    { keys: ['Enter'], does: 'Run one day and see when you have contact', touch: 'Tap Run a day' },
    { keys: ['C'], does: 'Clear all your dishes', touch: 'Tap Clear dishes' },
  ],
  parts: [
    { name: 'The Earth', meaning: 'Seen from above the North Pole. It turns during the day, and your dishes turn with it.' },
    { name: 'Gold dots', meaning: 'Your antennas. The blue arc around each one shows the part of the sky it can see.' },
    { name: 'The probe', meaning: 'The spacecraft on the right. It turns green and shows LINK when at least one dish can see it, and red when none can.' },
    { name: 'The 24-hour bar', meaning: 'After you run a day: green is time with contact, red is a blackout.' },
    { name: 'Contact last run', meaning: 'The share of the day you stayed in touch. Your goal is on the right.' },
    { name: 'Days run', meaning: 'How many times you tested. Testing is how you find the gap.' },
    { name: 'Deep Space Network (DSN)', meaning: 'The giant antennas of NASA that talk to far-away probes.' },
    { name: 'Goldstone, Madrid and Canberra', meaning: 'The three sites of the Deep Space Network, spread around the world.' },
    { name: 'Horizon', meaning: 'The line where the sky meets the Earth. An antenna only sees what is above its horizon, so when the Earth turns it away it loses the probe.' },
    { name: 'Blackout', meaning: 'The time when no antenna sees the probe. It shows in red on the 24-hour bar.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button shows all of them.' },
  ],
  steps: [
    { text: 'Press Start. Click on the ring around the Earth to place a dish (or move with ← → and press Space).', keys: ['Space'], pointer: true },
    { text: 'Place just one dish, then press Enter to run a day. Watch the probe: green means LINK, red means no signal.', keys: ['Enter'] },
    { text: 'Look at the 24-hour bar: the red parts are blackouts, when no dish could see the probe.' },
    { text: 'Click on a dish to remove it, and try two or three dishes spread around. Where do the blackouts go?' },
    { text: 'The real levels set a goal for how much of the day you must stay in contact. Ready?' },
  ],
} satisfies Tutorial
