import { useEffect, useRef, useState } from 'react'
import Header from './Header'
import ConfirmDialog from './ConfirmDialog'
import {
  getBuildings,
  getAppliances,
  putBuilding,
  deleteBuilding,
  newId,
} from '../db'
import { emptyBuilding, DESTINAZIONI, labelOf } from '../constants'
import { consumoTotale, formatKWh } from '../utils/calc'
import { exportBackup, importBackup } from '../utils/backup'

function BuildingCard({ building, stats, onOpen, onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full px-4 py-3 text-left active:bg-atlas-bg"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-atlas-dark">
              {building.nome || '(edificio senza nome)'}
            </h3>
            <p className="truncate text-sm text-gray-500">
              {building.indirizzo || 'Indirizzo non indicato'}
            </p>
          </div>
          <span className="badge bg-atlas-light/30 text-atlas-dark">
            {labelOf(DESTINAZIONI, building.destinazione)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
          <span className="text-gray-600">
            <strong className="text-atlas-dark">{stats.count}</strong>{' '}
            {stats.count === 1 ? 'apparecchio' : 'apparecchi'}
          </span>
          <span className="text-gray-600">
            Consumo stimato:{' '}
            <strong className="text-atlas-green">
              {formatKWh(stats.totale)}
            </strong>
          </span>
        </div>
      </button>
      <div className="flex border-t border-gray-100">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 py-2.5 text-sm font-semibold text-atlas-green active:bg-atlas-bg"
        >
          Apri
        </button>
        <div className="w-px bg-gray-100" />
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 py-2.5 text-sm font-semibold text-red-700 active:bg-red-50"
        >
          Elimina
        </button>
      </div>
    </div>
  )
}

export default function BuildingList({ onOpenBuilding }) {
  const [buildings, setBuildings] = useState([])
  const [stats, setStats] = useState({}) // id -> { count, totale }
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState(null)
  const [importMode, setImportMode] = useState(null) // pending file+choice
  const [banner, setBanner] = useState(null)
  const importInput = useRef(null)

  async function refresh() {
    const list = await getBuildings()
    setBuildings(list)
    const entries = await Promise.all(
      list.map(async (b) => {
        const apps = await getAppliances(b.id)
        return [b.id, { count: apps.length, totale: consumoTotale(apps) }]
      }),
    )
    setStats(Object.fromEntries(entries))
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function createBuilding() {
    const b = emptyBuilding(newId())
    b.nome = 'Nuovo edificio'
    await putBuilding(b)
    onOpenBuilding(b.id)
  }

  async function confirmDelete() {
    if (!toDelete) return
    await deleteBuilding(toDelete.id)
    setToDelete(null)
    await refresh()
  }

  async function doExport() {
    try {
      const res = await exportBackup()
      showBanner(
        `Backup esportato: ${res.buildings} edifici, ${res.appliances} apparecchi, ${res.photos} foto.`,
      )
    } catch (e) {
      console.error(e)
      showBanner('Errore durante l’esportazione del backup.', true)
    }
  }

  function onImportFileSelected(e) {
    const file = e.target.files?.[0]
    if (file) setImportMode({ file })
    if (importInput.current) importInput.current.value = ''
  }

  async function runImport(mode) {
    const file = importMode?.file
    setImportMode(null)
    if (!file) return
    try {
      const res = await importBackup(file, mode)
      await refresh()
      showBanner(
        `Backup importato: ${res.buildings} edifici, ${res.appliances} apparecchi, ${res.photos} foto.`,
      )
    } catch (e) {
      console.error(e)
      showBanner('File di backup non valido.', true)
    }
  }

  function showBanner(text, error = false) {
    setBanner({ text, error })
    setTimeout(() => setBanner(null), 4000)
  }

  return (
    <div className="min-h-screen bg-atlas-bg">
      <Header saveState="idle" />

      <main className="mx-auto max-w-3xl px-3 py-4 pb-28">
        {banner ? (
          <div
            className={`mb-3 rounded-lg px-3 py-2 text-sm font-semibold ${
              banner.error
                ? 'bg-red-50 text-red-700'
                : 'bg-atlas-light/25 text-atlas-dark'
            }`}
          >
            {banner.text}
          </div>
        ) : null}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-atlas-dark">Edifici</h2>
          <span className="text-sm text-gray-500">
            {buildings.length}{' '}
            {buildings.length === 1 ? 'edificio' : 'edifici'}
          </span>
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-500">Caricamento…</p>
        ) : buildings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
            <p className="text-gray-600">
              Nessun edificio. Crea il primo rilievo con il pulsante in basso.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {buildings.map((b) => (
              <BuildingCard
                key={b.id}
                building={b}
                stats={stats[b.id] || { count: 0, totale: 0 }}
                onOpen={() => onOpenBuilding(b.id)}
                onDelete={() => setToDelete(b)}
              />
            ))}
          </div>
        )}

        {/* Backup / trasferimento dati */}
        <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-base font-bold text-atlas-dark">
            Backup e trasferimento dati
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            Esporta l’intero database in un file JSON (foto incluse) per
            trasferire il rilievo su un altro dispositivo, oppure importa un
            backup esistente.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary" onClick={doExport}>
              Esporta backup
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => importInput.current?.click()}
            >
              Importa backup
            </button>
          </div>
          <input
            ref={importInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFileSelected}
          />
        </section>
      </main>

      <div
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-3 py-3 backdrop-blur"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            className="btn-primary w-full"
            onClick={createBuilding}
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
            Nuovo edificio
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminare l’edificio?"
        message={`Verranno eliminati anche tutti gli apparecchi e le foto di "${
          toDelete?.nome || 'edificio'
        }". Operazione non reversibile.`}
        confirmLabel="Elimina"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      {importMode ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setImportMode(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-atlas-dark">
              Come importare il backup?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              “Unisci” aggiunge o aggiorna i dati senza cancellare quelli
              esistenti. “Sostituisci” cancella tutti i dati attuali e li
              rimpiazza con quelli del file.
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => runImport('merge')}
              >
                Unisci ai dati esistenti
              </button>
              <button
                type="button"
                className="btn-danger w-full"
                onClick={() => runImport('replace')}
              >
                Sostituisci tutto
              </button>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => setImportMode(null)}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
