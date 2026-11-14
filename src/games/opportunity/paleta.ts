// Paleta oficial del juego (Alice Blue, Thistle, Pearl Aqua, Dusk Blue, Deep Navy).
export const PALETA = {
  aliceBlue: 0xdae8fb,
  thistle: 0xf2d2ff,
  pearlAqua: 0x75cbd1,
  duskBlue: 0x3e5ba3,
  deepNavy: 0x0c0d45,
} as const;

export const css = (n: number) => '#' + n.toString(16).padStart(6, '0');
