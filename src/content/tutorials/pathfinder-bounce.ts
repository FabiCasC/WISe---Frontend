import type { Tutorial } from './types'

export default {
  gameId: 'pathfinder-bounce',
  story:
    'On 4 July 1997 Mars Pathfinder hit the Martian air at about 7,300 m/s. No one could steer it: a heat shield, a parachute, rockets and airbags each had to work at the right moment. You are mission control.',
  controls: [
    { keys: ['Space'], does: 'Do the next step of the landing', touch: 'Tap the button' },
    { keys: ['1', '2', '3', '4'], does: 'Parachute, Airbags, Rockets, Cut cord (when a level uses more than one)', touch: 'Tap the buttons' },
  ],
  parts: [
    { name: 'Altitude', meaning: 'How high above the ground the lander is.' },
    { name: 'Speed', meaning: 'How fast it is falling. Each part of the landing only works below or above certain speeds.' },
    { name: 'Since entry', meaning: 'Time since the lander hit the top of the air.' },
    { name: 'Clock', meaning: 'The game speeds up time high in the sky and slows it down near the ground, so you can react when it matters.' },
    { name: 'Heat shield', meaning: 'Does the first big braking and drops off by itself.' },
    { name: 'Parachute', meaning: 'Slows you a lot, but if you open it while you are still too fast, it tears.' },
    { name: 'Cord (tether)', meaning: 'The rope that holds the lander to its parachute. It is cut before the ground.' },
    { name: 'Thin air', meaning: 'Very little air, so it brakes very little. That is why the parachute alone is not enough on Mars.' },
    { name: 'Words with a dotted line', meaning: 'Tap any underlined word to read what it means. The ? button shows all of them.' },
    { name: 'Rockets and airbags', meaning: 'Mars air is very thin, so a parachute is not enough. Rockets brake the last part, and airbags cushion the bounce.' },
  ],
  steps: [
    { text: 'Press Start entry. The lander is falling at thousands of metres per second. Watch Speed and Altitude.', keys: ['Space', 'Enter'] },
    { text: 'The heat shield is slowing you down by itself. The Clock runs fast high in the sky, and slows down near the ground so you can react.' },
    { text: 'When the game says it is time, press Space (or the button) to do the next step of the landing.', keys: ['Space', 'Digit1', 'Digit2', 'Digit3', 'Digit4'] },
    { text: 'Each step only works in the right speed range. Too early and the parachute tears, too late and the airbags burst.' },
    { text: 'That is the landing. The real levels check your timing. Ready?' },
  ],
} satisfies Tutorial
