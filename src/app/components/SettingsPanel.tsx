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
    <Modal title="Ajustes" subtitle="Se guardan en este dispositivo" onClose={onClose}>
      <div>
        <div className="setting">
          <div>
            <div className="setting__name">Volumen</div>
            <p className="setting__hint">
              Al mínimo, silencio total. Los juegos reciben este valor al montarse.
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
            aria-label="Volumen general"
          />
        </div>

        <div className="setting">
          <div>
            <div className="setting__name">Movimiento reducido</div>
            <p className="setting__hint">
              Desactiva parallax, estrellas animadas y transiciones largas.
            </p>
          </div>
          <Switch
            checked={settings.reducedMotion}
            onChange={(v) => onChange({ reducedMotion: v })}
            label="Movimiento reducido"
          />
        </div>

        <div className="setting">
          <div>
            <div className="setting__name">Modo práctica</div>
            <p className="setting__hint">
              Sin reloj ni límite de movimientos. Sirve para aprender; no puntúa.
            </p>
          </div>
          <Switch
            checked={settings.practice}
            onChange={(v) => onChange({ practice: v })}
            label="Modo práctica"
          />
        </div>

        <div className="setting">
          <div>
            <div className="setting__name">Idioma de la interfaz</div>
            <p className="setting__hint">
              Las fichas científicas mantienen el término técnico original.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['es', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                className={`btn btn--sm ${settings.lang === lang ? 'btn--primary' : 'btn--quiet'}`}
                onClick={() => onChange({ lang })}
                aria-pressed={settings.lang === lang}
              >
                {lang === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!storageOk && (
        <div className="field field--warn">
          <div className="field__label">Guardado no disponible</div>
          <div className="field__value">
            Este navegador bloquea el almacenamiento local (suele pasar en ventanas
            privadas). Puedes jugar con normalidad, pero el progreso se perderá al
            cerrar la pestaña.
          </div>
        </div>
      )}

      <div className="field">
        <div className="field__label">Datos</div>
        <div className="field__value" style={{ marginBottom: 12 }}>
          Borra niveles completados, puntuaciones y recuerdos del pasaporte. No afecta a
          los recursos del juego.
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
              Sí, borrar todo
            </button>
            <button
              type="button"
              className="btn btn--sm btn--quiet"
              onClick={() => setConfirming(false)}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn--sm btn--quiet"
            onClick={() => setConfirming(true)}
          >
            Reiniciar progreso
          </button>
        )}
      </div>
    </Modal>
  )
}
