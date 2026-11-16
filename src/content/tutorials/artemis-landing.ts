import type { Tutorial } from './types'

export default {
  gameId: 'artemis-landing',
  story:
    'The Moon has no air, so a landing ship cannot use a parachute: only its engine can slow it down. And the Moon’s gravity is weak but never lets go, so hovering burns fuel and gets you nowhere. This is the problem the Artemis landers have to solve.',
  controls: [
    { keys: ['↑', 'W', 'Space'], does: 'Fire the main engine to slow your fall', touch: 'Hold the thrust button' },
    { keys: ['←', '→'], does: 'Fire the side jets to stop drifting sideways (also A and D)', touch: 'Hold Left or Right' },
  ],
  parts: [
    { name: 'Altitude', meaning: 'How high above the landing pad you are.' },
    { name: 'Vertical', meaning: 'How fast you move up or down. The arrow ▼ means falling and ▲ means rising. Touch down gently.' },
    { name: 'Drift', meaning: 'How fast you slide sideways. Touching down while sliding tips the lander over.' },
    { name: 'Fuel (hover)', meaning: 'Your fuel, measured in seconds you could hover. Every second of engine burns it, and hovering gets you no closer to the ground.' },
    { name: 'Descent engine', meaning: 'The big engine that slows your fall. It is the only brake you have.' },
    { name: 'Thruster', meaning: 'A small engine that pushes sideways to stop the drift.' },
    { name: 'Low gravity', meaning: 'The Moon pulls gently, so a fall is slow, but the pull never stops: floating in place just burns fuel.' },
    { name: 'Fuel', meaning: 'What the engine burns. With none left there is no braking.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button shows all of them.' },
    { name: 'The landing pad', meaning: 'Land on it, slowly, upright and with fuel left.' },
  ],
  steps: [
    { text: 'Press Begin descent (or Space). Your ship is falling. Watch Vertical, with its ▼ arrow.', keys: ['Space', 'Enter'] },
    { text: 'Hold ↑ (or Space) to fire the engine and slow your fall. Short bursts save fuel.', keys: ['ArrowUp', 'KeyW', 'Space'] },
    { text: 'Press ← or → to cancel any sideways Drift. Land at zero drift or you will tip.', keys: ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'] },
    { text: 'Watch Fuel (hover). Using the engine too early wastes fuel: with no air, nothing else will slow you.' },
    { text: 'Aim for a slow, straight touchdown on the pad. The real levels give you less fuel. Ready?' },
  ],
} satisfies Tutorial
