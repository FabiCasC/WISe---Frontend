import { useState } from 'react'
import type { GameSettings } from '../../shared/types'
import Modal from './Modal'

interface Props {
  settings: GameSettings
  storageOk: boolean
  onChange: (patch: Partial<GameSettings>) => void
  onReset: () => void
  onClose: () => void
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      onClick={() => onChange(!checked)}
    />
  )
}

export default function SettingsPanel({
  settings,
  storageOk,
  onChange,
  onReset,
  onClose,
}: Props) {
  const [confirming, setConfirming] = useState(false)

  return (
    <Modal title="Settings" subtitle="Saved on this device" onClose={onClose}>
      <div>
        <div className="setting">
          <div>
            <div className="setting__name">Volume</div>
            <p className="setting__hint">
              At the lowest setting, total silence. Games get this value when they start.
            </p>
          </div>
          <input
            className="range"
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(settings.volume * 100)}
            onChange={(e) => onChange({ volume: Number(e.target.value) / 100 })}
            aria-label="Main volume"
          />
        </div>

        <div className="setting">
          <div>
            <div className="setting__name">Reduced motion</div>
            <p className="setting__hint">
              Turns off floating shapes, parallax and long transitions.
            </p>
          </div>
          <Switch
            checked={settings.reducedMotion}
            onChange={(v) => onChange({ reducedMotion: v })}
            label="Reduced motion"
          />
        </div>

        <div className="setting">
          <div>
            <div className="setting__name">Practice mode</div>
            <p className="setting__hint">
              No timer and no move limit. Good for learning; it does not score.
            </p>
          </div>
          <Switch
            checked={settings.practice}
            onChange={(v) => onChange({ practice: v })}
            label="Practice mode"
          />
        </div>

      </div>

      {!storageOk && (
        <div className="field field--warn">
          <div className="field__label">Saving not available</div>
          <div className="field__value">
            This browser blocks local storage (common in private windows). You can
            play normally, but your progress will be lost when you close the tab.
          </div>
        </div>
      )}

      <div className="field">
        <div className="field__label">Data</div>
        <div className="field__value" style={{ marginBottom: 12 }}>
          Clears completed levels, scores and unlocked evidence. It does not affect the
          game files.
        </div>
        {confirming ? (
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={() => {
                onReset()
                setConfirming(false)
              }}
            >
              Yes, clear everything
            </button>
            <button
              type="button"
              className="btn btn--sm btn--quiet"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn--sm btn--quiet"
            onClick={() => setConfirming(true)}
          >
            Reset progress
          </button>
        )}
      </div>
    </Modal>
  )
}
