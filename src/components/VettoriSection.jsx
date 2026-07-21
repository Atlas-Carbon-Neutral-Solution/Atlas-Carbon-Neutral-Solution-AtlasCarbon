import { useEffect, useState } from 'react'
import { NumberField, SelectField } from './Field'
import ConfirmDialog from './ConfirmDialog'
import { VETTORI, vettoreDef, emptyVettore, labelOf } from '../constants'
import { getVettori, putVettore, deleteVettore, newId } from '../db'
import {
  vettoreTep,
  vettoreCosto,
  tepTotale,
  costoTotaleVettori,
  formatTep,
  formatEuro,
  formatNumber,
} from '../utils/calc'
import { useAutosave } from '../hooks/useAutosave'

function VettoreCard({ vettore, onChange, onDelete }) {
  function setVettoreType(code) {
    const def = vettoreDef(code)
    // aggiorna u.m. e fattore ai valori standard del nuovo vettore
    onChange({ ...vettore, vettore: code, um: def.um, fattoreTep: String(def.fattoreTep) })
  }

  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <SelectField
            label="Vettore energetico"
            value={vettore.vettore}
            onChange={setVettoreType}
            options={VETTORI}
          />
        </div>
        <NumberField
          label={`Valore${vettore.um ? ' (' + vettore.um + ')' : ''}`}
          value={vettore.valore}
          onChange={(v) => onChange({ ...vettore, valore: v })}
        />
        <NumberField
          label="Fattore tep/u.m."
          value={vettore.fattoreTep}
          onChange={(v) => onChange({ ...vettore, fattoreTep: v })}
        />
        <NumberField
          label="Prezzo unitario (€/u.m.)"
          value={vettore.prezzoUnitario}
          onChange={(v) => onChange({ ...vettore, prezzoUnitario: v })}
        />
        <div className="flex items-end">
          <button
            type="button"
            className="btn-danger w-full"
            onClick={() => onDelete(vettore)}
          >
            Elimina
          </button>
        </div>
      </div>
      <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-xs text-gray-600">
        <span>
          Consumo:{' '}
          <strong className="text-atlas-dark">
            {formatNumber(vettoreTep(vettore), 2)} tep
          </strong>
        </span>
        <span>
          Costo:{' '}
          <strong className="text-atlas-green">
            {formatEuro(vettoreCosto(vettore))}
          </strong>
        </span>
      </div>
    </div>
  )
}

export default function VettoriSection({ aziendaId }) {
  const [vettori, setVettori] = useState([])
  const [toDelete, setToDelete] = useState(null)
  const [, scheduleSave] = useAutosave(async (payload) => {
    await putVettore(payload)
  })

  async function refresh() {
    setVettori(await getVettori(aziendaId))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aziendaId])

  function onChange(next) {
    setVettori((list) => list.map((v) => (v.id === next.id ? next : v)))
    scheduleSave(next)
  }

  async function add() {
    const v = emptyVettore(newId(), aziendaId)
    await putVettore(v)
    await refresh()
  }

  async function confirmDelete() {
    if (!toDelete) return
    await deleteVettore(toDelete.id)
    setToDelete(null)
    await refresh()
  }

  const tep = tepTotale(vettori)
  const costo = costoTotaleVettori(vettori)

  return (
    <div>
      {vettori.length > 0 ? (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-atlas-bg px-4 py-2 text-sm">
          <span className="font-semibold text-atlas-dark">
            Totale: {formatTep(tep)}
          </span>
          <span className="font-semibold text-atlas-green">
            {formatEuro(costo)}
          </span>
        </div>
      ) : (
        <p className="mb-3 text-sm text-gray-500">
          Nessun consumo inserito. Aggiungi i consumi annui rilevati dalle
          bollette/fatture per ciascun vettore.
        </p>
      )}

      <div className="space-y-3">
        {vettori.map((v) => (
          <VettoreCard
            key={v.id}
            vettore={v}
            onChange={onChange}
            onDelete={setToDelete}
          />
        ))}
      </div>

      <button type="button" className="btn-secondary mt-3 w-full" onClick={add}>
        + Aggiungi vettore
      </button>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminare il vettore?"
        message={`"${labelOf(VETTORI, toDelete?.vettore)}" verrà rimosso.`}
        confirmLabel="Elimina"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
