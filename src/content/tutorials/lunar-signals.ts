import type { Tutorial } from './types'

export default {
  gameId: 'lunar-signals',
  story:
    'Apollo 15 left two instruments on the Moon in 1971. A laser reflector still sends laser pulses back to Earth, and a seismometer listened to moonquakes until it was switched off in 1977. You work with both: you time a laser echo, and you find where a moonquake happened.',
  controls: [
    { keys: ['Click'], does: 'Press the buttons and drag the sliders', touch: 'Tap and drag' },
    { keys: ['Click'], does: 'Level 3: tap the map to drop a mark where the quake could be' },
  ],
  parts: [
    { name: 'Fire Laser (level 1)', meaning: 'Sends a laser pulse to the Moon. The stopwatch times how long it takes to come back.' },
    { name: 'Stopwatch', meaning: 'The time of the round trip. The light goes there AND back, so the distance is the speed of light × time ÷ 2.' },
    { name: 'Slider and Mark Distance', meaning: 'Slide the marker to the distance you worked out and press the button to check it.' },
    { name: 'Station circles (levels 2 and 3)', meaning: 'Each seismometer station measured how long the quake took to reach it. That gives a circle: the quake happened somewhere on it.' },
    { name: 'Where the circles cross', meaning: 'One circle is not enough, two circles cross in two places, and three circles cross in one. That is why scientists needed three stations.' },
    { name: 'Attempts left', meaning: 'Guessing until the game says yes is not measuring. Work the numbers out first.' },
  ],
  steps: [
    { text: 'Press Fire Laser and watch the pulse fly to the Moon and back. The stopwatch times it.', pointer: true },
    { text: 'The echo took a little more than 2 seconds. Light goes there AND back, so the Moon is at: speed of light × time ÷ 2.' },
    { text: 'Do the sum, slide the marker to your answer, and press Mark Distance. In practice, trying again costs nothing.', pointer: true },
    { text: 'Level 2 uses moonquakes: each station gives a circle, and the quake is where the circles meet. Level 3 asks what you can know when a station is silent.' },
    { text: 'You know the tools. In the real levels you have a limited number of attempts, so work it out first. Ready?' },
  ],
} satisfies Tutorial
