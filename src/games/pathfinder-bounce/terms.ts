import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'shield', name: 'Heat shield', pattern: 'heat shield|\\bshield\\b', text: 'A plate that protects from the heat of entering the air, and slows the ship down a lot.' },
  { id: 'chute', name: 'Parachute', pattern: 'parachute', text: 'A big cloth that slows you down with the air it catches.' },
  { id: 'rockets', name: 'Braking rockets', pattern: 'rockets?', text: 'Engines that push upward to brake in the last stretch.' },
  { id: 'airbags', name: 'Airbags', pattern: 'airbags?', text: 'Inflated bags that cushion the hit and let the lander bounce.' },
  { id: 'cord', name: 'Cord (tether)', pattern: 'cord|tether', text: 'The rope that holds the lander to its parachute. It is cut before the ground.' },
  { id: 'thin', name: 'Thin air', pattern: 'thin air|thin', text: 'Very little air, so it brakes very little.' },
]
