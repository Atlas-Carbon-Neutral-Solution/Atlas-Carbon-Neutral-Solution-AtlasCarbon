import { useEffect, useState } from 'react'
import { NumberField, SelectField, TextField } from './Field'
import ConfirmDialog from './ConfirmDialog'
import {
  TIPI_MEZZO,
  ALIMENTAZIONI,
  alimentazioneDef,
  emptyAutomezzo,
  labelOf,
} from '../constants'
import { getAutomezzi, putAutomezzo, deleteAutomezzo, newId } from '../db'
import {
  automezzoTep,
  automezzoCosto,
  tepTotaleAutomezzi,
  costoTotaleAutomezzi,
  formatTep,
  formatEuro,
  formatNumber,
} from '../utils/calc'
import { useAutosave } from '../hooks/useAutosave'

function AutomezzoCard({ automezzo, onChange, onDelete }) {
  function setAlimentazione(code) {
    const def = alimentazioneDef(code)
    onChange({
      ...automezzo,
      alimentazione: code,
      um: def.um,
      fattoreTep: String(def.fattoreTep),
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <TextField
            label="Identificativo / targa"
            value={automezzo.identificativo}
            onChange={(v) => onChange({ ...automezzo, identificativo: v })}
            placeholder="Es. Pala CAT 950 — targa AB123CD"
          />
        </div>
        <SelectField
          label="Tipo mezzo"
          value={automezzo.tipoMezzo}
          onChange={(v) => onChange({ ...automezzo, tipoMezzo: v })}
          options={TIPI_MEZZO}
        />
        <SelectField
          label="Alimentazione"
          value={automezzo.alimentazione}
          onChange={setAlimentazione}
          options={ALIMENTAZIONI}
        />
        <NumberField
          label={`Consumo annuo${automezzo.um ? ' (' + automezzo.um + ')' : ''}`}
          value={automezzo.consumo}
          onChange={(v) => onChange({ ...automezzo, consumo: v })}
        />
        <NumberField
          label="Percorrenza (km/anno)"
          value={automezzo.kmAnno}
          onChange={(v) => onChange({ ...automezzo, kmAnno: v })}
        />
        <NumberField
          label="Fattore tep/u.m."
          value={automezzo.fattoreTep}
          onChange={(v) => onChange({ ...automezzo, fattoreTep: v })}
        />
        <NumberField
          label={`Prezzo (€/${automezzo.um || 'u.m.'})`}
          value={automezzo.prezzoUnitario}
          onChange={(v) => onChange({ ...automezzo, prezzoUnitario: v })}
        />
        <div className="col-span-2">
          <button
            type="button"
            className="btn-danger w-full"
            onClick={() => onDelete(automezzo)}
          >
            Elimina mezzo
          </button>
        </div>
      </div>
      <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-xs text-gray-600">
        <span>
          Consumo:{' '}
          <strong className="text-atlas-dark">
            {formatNumber(automezzoTep(automezzo), 2)} tep
          </strong>
        </span>
        <span>
          Costo:{' '}
          <strong className="text-atlas-green">
            {formatEuro(automezzoCosto(automezzo))}
          </strong>
        </span>
      </div>
    </div>
  )
}

export default function AutomezziSection({ aziendaId }) {
  const [automezzi, setAutomezzi] = useState([])
  const [toDelete, setToDelete] = useState(null)
  const [, scheduleSave] = useAutosave(async (payload) => {
    await putAutomezzo(payload)
  })

  async function refresh() {
    setAutomezzi(await getAutomezzi(aziendaId))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aziendaId])

  function onChange(next) {
    setAutomezzi((list) => list.map((m) => (m.id === next.id ? next : m)))
    scheduleSave(next)
  }

  async function add() {
    const m = emptyAutomezzo(newId(), aziendaId)
    await putAutomezzo(m)
    await refresh()
  }

  async function confirmDelete() {
    if (!toDelete) return
    await deleteAutomezzo(toDelete.id)
    setToDelete(null)
    await refresh()
  }

  const tep = tepTotaleAutomezzi(automezzi)
  const costo = costoTotaleAutomezzi(automezzi)

  return (
    <div>
      {automezzi.length > 0 ? (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-atlas-bg px-4 py-2 text-sm">
          <span className="font-semibold text-atlas-dark">
            {automezzi.length} mezzi · {formatTep(tep)}
          </span>
          <span className="font-semibold text-atlas-green">
            {formatEuro(costo)}
          </span>
        </div>
      ) : (
        <p className="mb-3 text-sm text-gray-500">
          Nessun automezzo inserito. Aggiungi i mezzi aziendali (pale,
          escavatori, autocarri, muletti…) con il relativo consumo annuo di
          carburante.
        </p>
      )}

      <div className="space-y-3">
        {automezzi.map((m) => (
          <AutomezzoCard
            key={m.id}
            automezzo={m}
            onChange={onChange}
            onDelete={setToDelete}
          />
        ))}
      </div>

      <button type="button" className="btn-secondary mt-3 w-full" onClick={add}>
        + Aggiungi automezzo
      </button>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminare l'automezzo?"
        message={`"${toDelete?.identificativo || labelOf(TIPI_MEZZO, toDelete?.tipoMezzo)}" verrà rimosso.`}
        confirmLabel="Elimina"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
