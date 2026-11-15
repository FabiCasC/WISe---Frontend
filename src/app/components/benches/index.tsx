import type { BenchId } from '../../../content/repairs'
import SandAndGap from './SandAndGap'
import DustMeter from './DustMeter'
import ThreeCircles from './ThreeCircles'
import TwoOrbits from './TwoOrbits'

/** Picks the bench a mission asks for. One per mission, never shared. */
export function BenchFor({ id, onUsed }: { id: BenchId; onUsed: () => void }) {
  switch (id) {
    case 'sand-and-gap':
      return <SandAndGap onUsed={onUsed} />
    case 'dust-meter':
      return <DustMeter onUsed={onUsed} />
    case 'three-circles':
      return <ThreeCircles onUsed={onUsed} />
    case 'two-orbits':
      return <TwoOrbits onUsed={onUsed} />
  }
}
