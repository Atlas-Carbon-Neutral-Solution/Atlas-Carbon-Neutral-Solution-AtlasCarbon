import { useEffect, useRef, useState } from 'react'
import Header from './Header'
import PhotoSection from './PhotoSection'
import ConfirmDialog from './ConfirmDialog'
import { TextField, NumberField, SelectField, TextAreaField } from './Field'
import { CATEGORIE, STATI } from '../constants'
import { putAppliance, deleteAppliance } from '../db'
import { useAutosave } from '../hooks/useAutosave'
import { validateAppliance } from '../utils/validate'
import { consumoAnnuo, formatKWh } from '../utils/calc'

export default function ApplianceForm({ initial, isNew, onClose }) {
  const [appliance, setAppliance] = useState(initial)
  const [photoCount, setPhotoCount] = useState({ total: 0, targa: 0 })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const persisted = useRef(!isNew)

  const [saveState, scheduleSave, saveNow] = useAutosave(async (payload) => {
    await putAppliance(payload)
    persisted.current = true
  })

  // Per un nuovo apparecchio crea subito il record, così è possibile
  // acquisire foto immediatamente (flusso "foto della targa" in campo).
  useEffect(() => {
    if (isNew && !persisted.current) {
      putAppliance(initial).then(() => {
        persisted.current = true
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const errors = validateAppliance(appliance)

  function update(patch) {
    const next = { ...appliance, ...patch }
    setAppliance(next)
    scheduleSave(next)
  }

  async function handleBack() {
    await saveNow()
    // Se è un nuovo apparecchio rimasto completamente vuoto, rimuovilo
    // per non lasciare righe fantasma nell'elenco.
    const empty =
      isNew &&
      !appliance.nome?.trim() &&
      !appliance.marca?.trim() &&
      !appliance.modello?.trim() &&
      !appliance.potenza &&
      photoCount.total === 0
    if (empty) {
      await deleteAppliance(appliance.id)
      onClose({ deleted: true })
      return
    }
    onClose({})
  }

  async function handleDelete() {
    await deleteAppliance(appliance.id)
    setConfirmDelete(false)
    onClose({ deleted: true })
  }

  const consumo = consumoAnnuo(appliance)

  return (
    <div className="min-h-screen bg-atlas-bg">
      <Header
        saveState={saveState}
        onBack={handleBack}
        subtitle={isNew ? 'Nuovo apparecchio' : 'Modifica apparecchio'}
      />

      <main className="mx-auto max-w-3xl px-3 py-4 pb-28">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                label="Nome / identificativo"
                value={appliance.nome}
                onChange={(v) => update({ nome: v })}
                placeholder="Es. Plafoniera corridoio piano 1"
                required
                error={errors.nome}
              />
            </div>

            <SelectField
              label="Categoria"
              value={appliance.categoria}
              onChange={(v) => update({ categoria: v })}
              options={CATEGORIE}
            />
            <SelectField
              label="Stato"
              value={appliance.stato}
              onChange={(v) => update({ stato: v })}
              options={STATI}
            />

            <TextField
              label="Marca"
              value={appliance.marca}
              onChange={(v) => update({ marca: v })}
            />
            <TextField
              label="Modello"
              value={appliance.modello}
              onChange={(v) => update({ modello: v })}
            />

            <NumberField
              label="Potenza nominale (kW)"
              value={appliance.potenza}
              onChange={(v) => update({ potenza: v })}
              placeholder="0,00"
              required
              error={errors.potenza}
            />
            <NumberField
              label="Quantità"
              value={appliance.quantita}
              onChange={(v) => update({ quantita: v })}
              required
              error={errors.quantita}
            />

            <NumberField
              label="Ore funzionamento/giorno"
              value={appliance.orePerGiorno}
              onChange={(v) => update({ orePerGiorno: v })}
              placeholder="0–24"
              error={errors.orePerGiorno}
            />
            <NumberField
              label="Giorni/anno"
              value={appliance.giorniPerAnno}
              onChange={(v) => update({ giorniPerAnno: v })}
              placeholder="0–365"
              error={errors.giorniPerAnno}
            />

            <div className="sm:col-span-2">
              <TextField
                label="Ubicazione (piano/locale)"
                value={appliance.ubicazione}
                onChange={(v) => update({ ubicazione: v })}
                placeholder="Es. Piano 1 — Locale tecnico"
              />
            </div>

            <div className="sm:col-span-2">
              <TextAreaField
                label="Note"
                value={appliance.note}
                onChange={(v) => update({ note: v })}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-atlas-bg px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-atlas-dark">
                Consumo stimato annuo
              </span>
              <span className="text-lg font-bold text-atlas-green">
                {formatKWh(consumo)}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              potenza × quantità × ore/giorno × giorni/anno
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-atlas-dark">
            Foto ({photoCount.total})
          </h2>
          <PhotoSection
            apparecchioId={appliance.id}
            onCountChange={(list) =>
              setPhotoCount({
                total: list.length,
                targa: list.filter((p) => p.tipo === 'targa').length,
              })
            }
          />
        </section>

        {!isNew ? (
          <button
            type="button"
            className="btn-danger mt-4 w-full"
            onClick={() => setConfirmDelete(true)}
          >
            Elimina apparecchio
          </button>
        ) : null}
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-3 py-3 backdrop-blur"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={handleBack}
          >
            Fine
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminare l'apparecchio?"
        message="Verranno eliminate anche le foto associate. Operazione non reversibile."
        confirmLabel="Elimina"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
