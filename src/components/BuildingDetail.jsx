import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './Header'
import { TextField, NumberField, SelectField, TextAreaField } from './Field'
import {
  DESTINAZIONI,
  STATI,
  CATEGORIE,
  STATO_BADGE,
  emptyAppliance,
  labelOf,
} from '../constants'
import {
  getBuilding,
  putBuilding,
  getAppliances,
  getPhotos,
  newId,
} from '../db'
import { useAutosave } from '../hooks/useAutosave'
import {
  consumoAnnuo,
  consumoTotale,
  percentualeSulTotale,
  formatKWh,
  formatNumber,
} from '../utils/calc'
import { exportXlsx, exportPhotosZip } from '../utils/exportXlsxZip'
import ApplianceForm from './ApplianceForm'

function ExportBar({ building, appliances }) {
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  async function doXlsx() {
    setBusy(true)
    try {
      await exportXlsx(building)
      setMsg('File .xlsx generato.')
    } catch (e) {
      console.error(e)
      setMsg('Errore durante la generazione del file.')
    } finally {
      setBusy(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  async function doZip() {
    setBusy(true)
    try {
      const res = await exportPhotosZip(building)
      setMsg(
        res.count === 0
          ? 'Nessuna foto da esportare.'
          : `Archivio .zip generato (${res.count} foto).`,
      )
    } catch (e) {
      console.error(e)
      setMsg('Errore durante la generazione dello .zip.')
    } finally {
      setBusy(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={busy || appliances.length === 0}
          onClick={doXlsx}
        >
          Esporta .xlsx
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={doZip}
        >
          Esporta foto .zip
        </button>
      </div>
      {msg ? (
        <p className="mt-2 text-center text-xs font-semibold text-atlas-green">
          {msg}
        </p>
      ) : null}
    </div>
  )
}

function ApplianceRow({ appliance, totale, noTarga, onOpen }) {
  const consumo = consumoAnnuo(appliance)
  const pct = percentualeSulTotale(appliance, totale)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-3 text-left last:border-b-0 active:bg-atlas-bg"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-atlas-dark">
            {appliance.nome || '(senza nome)'}
          </span>
          {noTarga ? (
            <span
              title="Manca la foto della targa dati"
              className="badge bg-yellow-100 text-yellow-800"
            >
              no targa
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span>{labelOf(CATEGORIE, appliance.categoria) || appliance.categoria}</span>
          {appliance.ubicazione ? <span>· {appliance.ubicazione}</span> : null}
          <span
            className={`badge ${STATO_BADGE[appliance.stato] || ''}`}
          >
            {labelOf(STATI, appliance.stato)}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-atlas-dark">{formatKWh(consumo)}</div>
        <div className="text-xs text-gray-500">
          {formatNumber(pct, 1)}%
        </div>
      </div>
    </button>
  )
}

export default function BuildingDetail({ buildingId, onBack }) {
  const [building, setBuilding] = useState(null)
  const [appliances, setAppliances] = useState([])
  const [targaMap, setTargaMap] = useState({}) // apparecchioId -> bool hasTarga
  const [sortDesc, setSortDesc] = useState(true)
  const [editing, setEditing] = useState(null) // { appliance, isNew }
  const [loading, setLoading] = useState(true)

  const [saveState, scheduleSave] = useAutosave(async (payload) => {
    await putBuilding(payload)
  })

  const loadAppliances = useCallback(async () => {
    const list = await getAppliances(buildingId)
    setAppliances(list)
    const entries = await Promise.all(
      list.map(async (a) => {
        const photos = await getPhotos(a.id)
        return [a.id, photos.some((p) => p.tipo === 'targa')]
      }),
    )
    setTargaMap(Object.fromEntries(entries))
  }, [buildingId])

  useEffect(() => {
    let active = true
    ;(async () => {
      const b = await getBuilding(buildingId)
      if (!active) return
      setBuilding(b)
      await loadAppliances()
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [buildingId, loadAppliances])

  const totale = useMemo(() => consumoTotale(appliances), [appliances])

  const sorted = useMemo(() => {
    const copy = [...appliances]
    copy.sort((a, b) => {
      const d = consumoAnnuo(b) - consumoAnnuo(a)
      return sortDesc ? d : -d
    })
    return copy
  }, [appliances, sortDesc])

  function update(patch) {
    const next = { ...building, ...patch }
    setBuilding(next)
    scheduleSave(next)
  }

  function openNew() {
    setEditing({ appliance: emptyAppliance(newId(), buildingId), isNew: true })
  }

  function openEdit(appliance) {
    setEditing({ appliance, isNew: false })
  }

  async function closeEditor() {
    setEditing(null)
    await loadAppliances()
  }

  if (editing) {
    return (
      <ApplianceForm
        initial={editing.appliance}
        isNew={editing.isNew}
        onClose={closeEditor}
      />
    )
  }

  if (loading || !building) {
    return (
      <div className="min-h-screen bg-atlas-bg">
        <Header saveState="idle" onBack={onBack} />
        <p className="p-6 text-center text-gray-500">Caricamento…</p>
      </div>
    )
  }

  const senzaTarga = appliances.filter((a) => !targaMap[a.id]).length

  return (
    <div className="min-h-screen bg-atlas-bg">
      <Header
        saveState={saveState}
        onBack={onBack}
        subtitle={building.nome || 'Edificio'}
      />

      <main className="mx-auto max-w-3xl px-3 py-4 pb-28">
        {/* Riepilogo consumo */}
        <section className="rounded-2xl bg-atlas-dark p-4 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-atlas-light">
                Consumo stimato totale
              </p>
              <p className="text-2xl font-bold">{formatKWh(totale)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-atlas-light">
                Apparecchi
              </p>
              <p className="text-2xl font-bold">{appliances.length}</p>
            </div>
          </div>
        </section>

        {/* Anagrafica edificio */}
        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-atlas-dark">
            Anagrafica edificio
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                label="Nome"
                value={building.nome}
                onChange={(v) => update({ nome: v })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                label="Indirizzo"
                value={building.indirizzo}
                onChange={(v) => update({ indirizzo: v })}
              />
            </div>
            <SelectField
              label="Destinazione d’uso"
              value={building.destinazione}
              onChange={(v) => update({ destinazione: v })}
              options={DESTINAZIONI}
            />
            <NumberField
              label="Anno costruzione"
              value={building.annoCostruzione}
              onChange={(v) => update({ annoCostruzione: v })}
              inputMode="numeric"
            />
            <NumberField
              label="Superficie utile (m²)"
              value={building.superficie}
              onChange={(v) => update({ superficie: v })}
            />
            <NumberField
              label="Volume lordo (m³)"
              value={building.volume}
              onChange={(v) => update({ volume: v })}
            />
            <NumberField
              label="Occupanti"
              value={building.occupanti}
              onChange={(v) => update({ occupanti: v })}
              inputMode="numeric"
            />
            <NumberField
              label="Ore occupazione/settimana"
              value={building.oreOccupazione}
              onChange={(v) => update({ oreOccupazione: v })}
            />
            <TextField
              label="POD elettrico"
              value={building.pod}
              onChange={(v) => update({ pod: v })}
              placeholder="IT001E..."
            />
            <TextField
              label="PDR gas (opzionale)"
              value={building.pdr}
              onChange={(v) => update({ pdr: v })}
            />
            <NumberField
              label="Potenza impegnata (kW)"
              value={building.potenzaImpegnata}
              onChange={(v) => update({ potenzaImpegnata: v })}
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Note"
                value={building.note}
                onChange={(v) => update({ note: v })}
              />
            </div>
          </div>
        </section>

        {/* Apparecchi */}
        <section className="mt-4 rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-bold text-atlas-dark">
              Apparecchi censiti
            </h2>
            <button
              type="button"
              onClick={() => setSortDesc((s) => !s)}
              className="flex min-h-touch items-center gap-1 rounded-lg px-2 text-sm font-semibold text-atlas-green"
            >
              Consumo
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={sortDesc ? '' : 'rotate-180'}
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {senzaTarga > 0 ? (
            <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <span>
                {senzaTarga}{' '}
                {senzaTarga === 1
                  ? 'apparecchio è privo'
                  : 'apparecchi sono privi'}{' '}
                della foto della targa dati.
              </span>
            </div>
          ) : null}

          {sorted.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">
              Nessun apparecchio censito. Usa il pulsante “+ Apparecchio”.
            </p>
          ) : (
            <div className="mt-1">
              {sorted.map((a) => (
                <ApplianceRow
                  key={a.id}
                  appliance={a}
                  totale={totale}
                  noTarga={!targaMap[a.id]}
                  onOpen={() => openEdit(a)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Export */}
        <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-atlas-dark">
            Esportazione dati edificio
          </h2>
          <ExportBar building={building} appliances={appliances} />
        </section>
      </main>

      {/* FAB nuovo apparecchio */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-3 py-3 backdrop-blur"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={openNew}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Apparecchio
          </button>
        </div>
      </div>
    </div>
  )
}
