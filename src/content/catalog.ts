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
    title: 'Advanced game',
    teaser: 'A new challenge that uses everything you learned.',
    unlockAt: 4,
    icon: 'avanzado',
  },
  {
    id: 'reto-especial',
    title: 'Special challenge',
    teaser: 'Less energy, more decisions. Can you do it?',
    unlockAt: 5,
    icon: 'reto',
  },
  {
    id: 'mision-final',
    title: 'Final mission',
    teaser: 'All three machines together in one mission.',
    unlockAt: 6,
    icon: 'final',
  },
  {
    id: 'realidad-virtual',
    title: 'Virtual reality',
    teaser: 'Walk next to the rovers on Mars.',
    unlockAt: null,
    icon: 'vr',
  },
]
