import { useEffect, useRef, useState } from 'react'
import Header from './Header'
import PhotoSection from './PhotoSection'
import ConfirmDialog from './ConfirmDialog'
import { TextField, NumberField, SelectField, TextAreaField } from './Field'
import { AREE, CATEGORIE, STATI, TIPOLOGIE, TIPI_MISURA } from '../constants'
import { putUtenza, deleteUtenza } from '../db'
import { useAutosave } from '../hooks/useAutosave'
import { validateUtenza } from '../utils/validate'
import { consumoUtenza, formatKWh } from '../utils/calc'

export default function UtenzaForm({ initial, isNew, onClose }) {
  const [utenza, setUtenza] = useState(initial)
  const [photoCount, setPhotoCount] = useState({ total: 0, targa: 0 })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const persisted = useRef(!isNew)

  const [saveState, scheduleSave, saveNow] = useAutosave(async (payload) => {
    await putUtenza(payload)
    persisted.current = true
  })

  useEffect(() => {
    if (isNew && !persisted.current) {
      putUtenza(initial).then(() => {
        persisted.current = true
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const errors = validateUtenza(utenza)

  function update(patch) {
    const next = { ...utenza, ...patch }
    setUtenza(next)
    scheduleSave(next)
  }

  async function handleBack() {
    await saveNow()
    const empty =
      isNew &&
      !utenza.denominazione?.trim() &&
      !utenza.marca?.trim() &&
      !utenza.modello?.trim() &&
      !utenza.potenza &&
      photoCount.total === 0
    if (empty) {
      await deleteUtenza(utenza.id)
      onClose({ deleted: true })
      return
    }
    onClose({})
  }

  async function handleDelete() {
    await deleteUtenza(utenza.id)
    setConfirmDelete(false)
    onClose({ deleted: true })
  }

  const consumo = consumoUtenza(utenza)

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
                label="Denominazione apparecchio"
                value={utenza.denominazione}
                onChange={(v) => update({ denominazione: v })}
                placeholder="Es. Compressore aria sala 2"
                required
                error={errors.denominazione}
              />
            </div>

            <SelectField
              label="Area / destinazione"
              value={utenza.area}
              onChange={(v) => update({ area: v })}
              options={AREE}
            />
            <SelectField
              label="Tipologia vettore"
              value={utenza.tipologia}
              onChange={(v) => update({ tipologia: v })}
              options={TIPOLOGIE}
            />
            <SelectField
              label="Categoria"
              value={utenza.categoria}
              onChange={(v) => update({ categoria: v })}
              options={CATEGORIE}
            />
            <SelectField
              label="Stato"
              value={utenza.stato}
              onChange={(v) => update({ stato: v })}
              options={STATI}
            />

            <TextField
              label="Marca"
              value={utenza.marca}
              onChange={(v) => update({ marca: v })}
            />
            <TextField
              label="Modello"
              value={utenza.modello}
              onChange={(v) => update({ modello: v })}
            />

            <NumberField
              label="Potenza nominale (kW)"
              value={utenza.potenza}
              onChange={(v) => update({ potenza: v })}
              placeholder="0,00"
              required
              error={errors.potenza}
            />
            <NumberField
              label="Quantità"
              value={utenza.quantita}
              onChange={(v) => update({ quantita: v })}
              required
              error={errors.quantita}
            />

            <NumberField
              label="Fattore di carico (0–1)"
              value={utenza.fattoreCarico}
              onChange={(v) => update({ fattoreCarico: v })}
              placeholder="Es. 0,6"
              error={errors.fattoreCarico}
              hint="Quota di potenza mediamente assorbita"
            />
            <NumberField
              label="Rendimento (0–1)"
              value={utenza.rendimento}
              onChange={(v) => update({ rendimento: v })}
              placeholder="Es. 0,95"
              error={errors.rendimento}
            />

            <NumberField
              label="Ore funzionamento/giorno"
              value={utenza.orePerGiorno}
              onChange={(v) => update({ orePerGiorno: v })}
              placeholder="0–24"
              error={errors.orePerGiorno}
            />
            <NumberField
              label="Giorni/anno"
              value={utenza.giorniPerAnno}
              onChange={(v) => update({ giorniPerAnno: v })}
              placeholder="0–365"
              error={errors.giorniPerAnno}
            />

            <SelectField
              label="Tipo di misura"
              value={utenza.tipoMisura}
              onChange={(v) => update({ tipoMisura: v })}
              options={TIPI_MISURA}
            />
            <TextField
              label="Ubicazione (reparto/locale)"
              value={utenza.ubicazione}
              onChange={(v) => update({ ubicazione: v })}
              placeholder="Es. Reparto stampaggio"
            />

            <div className="sm:col-span-2">
              <TextAreaField
                label="Note"
                value={utenza.note}
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
              potenza × quantità × fattore di carico × ore/giorno × giorni/anno
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-atlas-dark">
            Foto ({photoCount.total})
          </h2>
          <PhotoSection
            utenzaId={utenza.id}
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
          <button type="button" className="btn-primary w-full" onClick={handleBack}>
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
