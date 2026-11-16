import DesignGame from '../../games/design-game/DesignGame'
import StudioCosmicBackdrop from '../components/StudioCosmicBackdrop'

/**
 * #/studio — where the student builds their own game (Free build).
 *
 * LAYOUT NOTE: the editor brings its own full-height screen with its own
 * background, so it is rendered OUTSIDE the page wrapper.
 */
export default function Studio({ accountId: _accountId }: { accountId?: string }) {
  return (
    <>
      <StudioCosmicBackdrop />
      <DesignGame />
    </>
  )
}
