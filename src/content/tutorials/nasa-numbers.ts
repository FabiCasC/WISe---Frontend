import type { Tutorial } from './types'

export default {
  gameId: 'nasa-numbers',
  story:
    'A space probe called Dawn carries a beacon, and in each round it hides at a different spot. You scan numbers and the beacon answers higher or lower. Later you learn that every measurement can be a little off, and you turn a laser echo into the distance to the Moon. The beacon spots, the noise and the echo times are made up by the game; the speed of light and the Moon are real.',
  controls: [
    { keys: ['0-9'], does: 'Type a number in the box', touch: 'Tap the box and type' },
    { keys: ['Enter'], does: 'Send your scan, your interval or your distance' },
  ],
  parts: [
    { name: 'Space probe', meaning: 'A robot spacecraft that travels far from Earth. Here it is Dawn, and you are looking for its beacon.' },
    { name: 'Range bar', meaning: 'The stretch where the beacon can still be. After every scan the bar gets shorter: you can watch half of it disappear.' },
    { name: 'Halving', meaning: 'Scanning the middle of the range, so you throw away half of the possibilities. It finds any number in just a few scans.' },
    { name: 'Scans left', meaning: 'Scans are limited, but halving always fits. Guessing at random does not.' },
    { name: 'Margin of error', meaning: 'How far off a measurement can be. In level 2 every reading can be wrong by that much, so the interval you mark has to be at least that wide, and overlapping readings make it narrower.' },
    { name: 'Echo', meaning: 'The signal that comes back after bouncing off something. In level 3 a laser pulse goes to the Moon and its echo returns.' },
    { name: 'Retroreflector', meaning: 'A special mirror that sends light back the way it came. Apollo 15 left one on the Moon.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button shows all of them.' },
  ],
  steps: [
    { text: 'Type a number in the box and press Enter to scan it. Try the middle of the range.', keys: ['Enter'] },
    { text: 'The beacon answers higher or lower, and the bar gets shorter. Scan the middle of what is left again.' },
    { text: 'Each scan cuts the range in half. Keep halving and you will find the beacon in a few scans.' },
    { text: 'In level 2 you take readings that can be off by the margin of error, then mark an interval. In level 3 distance = speed of light x echo time / 2, because the light goes there and back.' },
    { text: 'The real levels count your scans and have no hints, so use halving. Ready?' },
  ],
} satisfies Tutorial
