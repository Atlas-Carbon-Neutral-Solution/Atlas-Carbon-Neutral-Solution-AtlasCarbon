import { useState } from 'react'
import { MESI } from '../constants'
import { euroPerKwh, formatNumber } from '../utils/calc'

// Revisione dei dati estratti dal PDF: pre-compilati e sempre modificabili
// prima del salvataggio. I campi riconosciuti automaticamente sono marcati.
export default function BollettaImportDialog({ record, found, onSave, onCancel }) {
  const [b, setB] = useState(record)
  const set = (patch) => setB((prev) => ({ ...prev, ...patch }))

  const Auto = ({ k }) =>
    found?.[k] ? (
      <span className="ml-1 rounded bg-atlas-light/40 px-1 text-[10px] font-semibold text-atlas-dark">
        auto
      </span>
    ) : null

  const nFound = Object.keys(found || {}).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-atlas-dark">
            Dati estratti dalla bolletta
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {nFound} campi riconosciuti automaticamente. Verifica e correggi
            prima di salvare.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="field-label">
                Mese
                <Auto k="mese" />
              </span>
              <select
                className="field-input"
                value={String(b.mese)}
                onChange={(e) => set({ mese: Number(e.target.value) })}
              >
                {MESI.map((m) => (
                  <option key={m.value} value={String(m.value)}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">
                Anno
                <Auto k="anno" />
              </span>
              <input
                className="field-input"
                inputMode="numeric"
                value={b.anno ?? ''}
                onChange={(e) => set({ anno: e.target.value })}
              />
            </label>

            <FieldAuto label="Energia attiva TOT (kWh)" k="attivaTot" found={found} value={b.attivaTot} onChange={(v) => set({ attivaTot: v })} />
            <FieldAuto label="Potenza max (kW)" k="potenzaMax" found={found} value={b.potenzaMax} onChange={(v) => set({ potenzaMax: v })} />
            <FieldAuto label="Attiva F1 (kWh)" k="attivaF1" found={found} value={b.attivaF1} onChange={(v) => set({ attivaF1: v })} />
            <FieldAuto label="Attiva F2 (kWh)" k="attivaF2" found={found} value={b.attivaF2} onChange={(v) => set({ attivaF2: v })} />
            <FieldAuto label="Attiva F3 (kWh)" k="attivaF3" found={found} value={b.attivaF3} onChange={(v) => set({ attivaF3: v })} />
            <FieldAuto label="Reattiva (kvarh)" k="reattivaTot" found={found} value={b.reattivaTot} onChange={(v) => set({ reattivaTot: v })} />
            <FieldAuto label="Costo netto (€)" k="costoNetto" found={found} value={b.costoNetto} onChange={(v) => set({ costoNetto: v })} />
            <FieldAuto label="Costo IVA incl. (€)" k="costoIvato" found={found} value={b.costoIvato} onChange={(v) => set({ costoIvato: v })} />
            <div className="col-span-2">
              <label className="block">
                <span className="field-label">
                  POD
                  <Auto k="pod" />
                </span>
                <input
                  className="field-input"
                  value={b.pod ?? ''}
                  onChange={(e) => set({ pod: e.target.value })}
                  placeholder="IT001E..."
                />
              </label>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            €/kWh medio: <strong>{formatNumber(euroPerKwh(b), 4)}</strong>
          </p>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
          <button type="button" className="btn-secondary flex-1" onClick={onCancel}>
            Annulla
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => onSave(b)}
          >
            Salva bolletta
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldAuto({ label, k, found, value, onChange }) {
  return (
    <label className="block">
      <span className="field-label">
        {label}
        {found?.[k] ? (
          <span className="ml-1 rounded bg-atlas-light/40 px-1 text-[10px] font-semibold text-atlas-dark">
            auto
          </span>
        ) : null}
      </span>
      <input
        type="number"
        inputMode="decimal"
        className="field-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
