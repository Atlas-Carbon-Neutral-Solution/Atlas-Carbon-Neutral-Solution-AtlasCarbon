import { useEffect, useState } from 'react'
import { NumberField, SelectField, TextField } from './Field'
import ConfirmDialog from './ConfirmDialog'
import { MESI, emptyBolletta, labelOf } from '../constants'
import { getBollette, putBolletta, deleteBolletta, newId } from '../db'
import { euroPerKwh, formatNumber, formatEuro } from '../utils/calc'
import { useAutosave } from '../hooks/useAutosave'

function BollettaCard({ bolletta, open, onToggle, onChange, onDelete }) {
  const kwh = Number(bolletta.attivaTot) || 0
  const costo = Number(bolletta.costoNetto) || 0
  const set = (patch) => onChange({ ...bolletta, ...patch })

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-3 text-left active:bg-atlas-bg"
      >
        <span className="font-semibold text-atlas-dark">
          {labelOf(MESI, Number(bolletta.mese))} {bolletta.anno}
        </span>
        <span className="flex items-center gap-3 text-sm">
          <span className="text-gray-600">{formatNumber(kwh)} kWh</span>
          <span className="text-atlas-green">{formatEuro(costo)}</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-atlas-green transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open ? (
        <div className="border-t border-gray-100 p-3">
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Mese"
              value={String(bolletta.mese)}
              onChange={(v) => set({ mese: Number(v) })}
              options={MESI.map((m) => ({ value: String(m.value), label: m.label }))}
            />
            <TextField
              label="Anno"
              value={bolletta.anno}
              onChange={(v) => set({ anno: v })}
              inputMode="numeric"
            />
            <NumberField
              label="Energia attiva TOT (kWh)"
              value={bolletta.attivaTot}
              onChange={(v) => set({ attivaTot: v })}
            />
            <NumberField
              label="Potenza max (kW)"
              value={bolletta.potenzaMax}
              onChange={(v) => set({ potenzaMax: v })}
            />
            <NumberField
              label="Attiva F1 (kWh)"
              value={bolletta.attivaF1}
              onChange={(v) => set({ attivaF1: v })}
            />
            <NumberField
              label="Attiva F2 (kWh)"
              value={bolletta.attivaF2}
              onChange={(v) => set({ attivaF2: v })}
            />
            <NumberField
              label="Attiva F3 (kWh)"
              value={bolletta.attivaF3}
              onChange={(v) => set({ attivaF3: v })}
            />
            <NumberField
              label="Energia reattiva (kvarh)"
              value={bolletta.reattivaTot}
              onChange={(v) => set({ reattivaTot: v })}
            />
            <NumberField
              label="Costo netto (€)"
              value={bolletta.costoNetto}
              onChange={(v) => set({ costoNetto: v })}
            />
            <NumberField
              label="Costo IVA incl. (€)"
              value={bolletta.costoIvato}
              onChange={(v) => set({ costoIvato: v })}
            />
            <div className="col-span-2">
              <TextField
                label="POD"
                value={bolletta.pod}
                onChange={(v) => set({ pod: v })}
                placeholder="IT001E..."
              />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-600">
            <span>
              €/kWh medio:{' '}
              <strong className="text-atlas-dark">
                {formatNumber(euroPerKwh(bolletta), 4)}
              </strong>
            </span>
            <button
              type="button"
              className="font-semibold text-red-700"
              onClick={() => onDelete(bolletta)}
            >
              Elimina bolletta
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function BolletteSection({ aziendaId, annoDefault }) {
  const [bollette, setBollette] = useState([])
  const [openId, setOpenId] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [, scheduleSave] = useAutosave(async (payload) => {
    await putBolletta(payload)
  })

  async function refresh() {
    setBollette(await getBollette(aziendaId))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aziendaId])

  function onChange(next) {
    setBollette((list) => list.map((b) => (b.id === next.id ? next : b)))
    scheduleSave(next)
  }

  async function add() {
    // propone il mese successivo all'ultima bolletta inserita
    const last = bollette[bollette.length - 1]
    const mese = last ? (Number(last.mese) % 12) + 1 : 1
    const anno = last ? last.anno : annoDefault
    const b = { ...emptyBolletta(newId(), aziendaId, anno), mese }
    await putBolletta(b)
    await refresh()
    setOpenId(b.id)
  }

  async function confirmDelete() {
    if (!toDelete) return
    await deleteBolletta(toDelete.id)
    setToDelete(null)
    await refresh()
  }

  const totKwh = bollette.reduce((s, b) => s + (Number(b.attivaTot) || 0), 0)
  const totCosto = bollette.reduce((s, b) => s + (Number(b.costoNetto) || 0), 0)

  return (
    <div>
      {bollette.length > 0 ? (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-atlas-bg px-4 py-2 text-sm">
          <span className="font-semibold text-atlas-dark">
            {bollette.length} bollette · {formatNumber(totKwh)} kWh
          </span>
          <span className="font-semibold text-atlas-green">
            {formatEuro(totCosto)}
          </span>
        </div>
      ) : (
        <p className="mb-3 text-sm text-gray-500">
          Nessuna bolletta inserita. Aggiungi le letture mensili dell'energia
          elettrica.
        </p>
      )}

      <div className="space-y-2">
        {bollette.map((b) => (
          <BollettaCard
            key={b.id}
            bolletta={b}
            open={openId === b.id}
            onToggle={() => setOpenId((id) => (id === b.id ? null : b.id))}
            onChange={onChange}
            onDelete={setToDelete}
          />
        ))}
      </div>

      <button type="button" className="btn-secondary mt-3 w-full" onClick={add}>
        + Aggiungi bolletta
      </button>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminare la bolletta?"
        message="Operazione non reversibile."
        confirmLabel="Elimina"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
