/**
 * Tarjetas del catálogo que todavía no son juegos jugables.
 * Se muestran bloqueadas hasta el nivel general indicado; al alcanzarlo
 * pasan a "Muy pronto". No se construyen en esta versión.
 */
export interface UpcomingCard {
  id: string
  title: string
  teaser: string
  /** Nivel general que la desbloquea. null = solo visual (próximamente). */
  unlockAt: 4 | 5 | 6 | null
  icon: 'avanzado' | 'reto' | 'final' | 'vr'
}

export const UPCOMING: UpcomingCard[] = [
  {
    id: 'avanzado-1',
    title: 'Juego avanzado',
    teaser: 'Un reto nuevo que usa todo lo que aprendiste.',
    unlockAt: 4,
    icon: 'avanzado',
  },
  {
    id: 'reto-especial',
    title: 'Reto especial',
    teaser: 'Menos energía, más decisiones. ¿Lo logras?',
    unlockAt: 5,
    icon: 'reto',
  },
  {
    id: 'mision-final',
    title: 'Misión final',
    teaser: 'Los tres equipos juntos en una sola misión.',
    unlockAt: 6,
    icon: 'final',
  },
  {
    id: 'realidad-virtual',
    title: 'Realidad virtual',
    teaser: 'Camina junto a los rovers en Marte.',
    unlockAt: null,
    icon: 'vr',
  },
]
