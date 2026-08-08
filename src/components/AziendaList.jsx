import { useEffect, useRef, useState } from 'react'
import Header from './Header'
import ConfirmDialog from './ConfirmDialog'
import {
  getAziende,
  getUtenze,
  getVettori,
  putAzienda,
  deleteAzienda,
  newId,
} from '../db'
import { emptyAzienda } from '../constants'
import {
  consumoTotaleUtenze,
  tepTotale,
  formatKWh,
  formatTep,
} from '../utils/calc'
import { exportBackup, importBackup } from '../utils/backup'
import { useStorageStatus } from '../hooks/useStorageStatus'
import StorageBanner from './StorageBanner'

function AziendaCard({ azienda, stats, onOpen, onDelete }) {
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
              {azienda.ragioneSociale || '(azienda senza nome)'}
            </h3>
            <p className="truncate text-sm text-gray-500">
              {azienda.indirizzo || 'Indirizzo non indicato'}
            </p>
          </div>
          {azienda.ateco ? (
            <span className="badge bg-atlas-light/30 text-atlas-dark">
              ATECO {azienda.ateco}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
          <span className="text-gray-600">
            <strong className="text-atlas-dark">{stats.count}</strong>{' '}
            {stats.count === 1 ? 'apparecchio' : 'apparecchi'}
          </span>
          <span className="text-gray-600">
            <strong className="text-atlas-green">{formatKWh(stats.ee)}</strong>
            {stats.tep > 0 ? (
              <span className="text-gray-500"> · {formatTep(stats.tep)}</span>
            ) : null}
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

export default function AziendaList({ onOpenAzienda }) {
  const [aziende, setAziende] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [toDelete, setToDelete] = useState(null)
  const [importFile, setImportFile] = useState(null)
  const [banner, setBanner] = useState(null)
  const importInput = useRef(null)
  const storage = useStorageStatus()

  async function refresh() {
    const list = await getAziende()
    setAziende(list)
    const entries = await Promise.all(
      list.map(async (a) => {
        const [utenze, vettori] = await Promise.all([
          getUtenze(a.id),
          getVettori(a.id),
        ])
        return [
          a.id,
          {
            count: utenze.length,
            ee: consumoTotaleUtenze(utenze),
            tep: tepTotale(vettori),
          },
        ]
      }),
    )
    setStats(Object.fromEntries(entries))
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function createAzienda() {
    const a = emptyAzienda(newId())
    a.ragioneSociale = 'Nuova azienda'
    await putAzienda(a)
    onOpenAzienda(a.id)
  }

  async function confirmDelete() {
    if (!toDelete) return
    await deleteAzienda(toDelete.id)
    setToDelete(null)
    await refresh()
  }

  async function doExport() {
    try {
      const res = await exportBackup()
      showBanner(
        `Backup esportato: ${res.aziende} aziende, ${res.utenze} utenze, ${res.photos} foto.`,
      )
    } catch (e) {
      console.error(e)
      showBanner('Errore durante l’esportazione del backup.', true)
    }
  }

  function onImportFileSelected(e) {
    const file = e.target.files?.[0]
    if (file) setImportFile(file)
    if (importInput.current) importInput.current.value = ''
  }

  async function runImport(mode) {
    const file = importFile
    setImportFile(null)
    if (!file) return
    try {
      const res = await importBackup(file, mode)
      await refresh()
      showBanner(
        `Backup importato: ${res.aziende} aziende, ${res.utenze} utenze, ${res.photos} foto.`,
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
        <StorageBanner status={storage} />
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
          <h2 className="text-lg font-bold text-atlas-dark">Aziende / Siti</h2>
          <span className="text-sm text-gray-500">
            {aziende.length} {aziende.length === 1 ? 'sito' : 'siti'}
          </span>
        </div>

        {loading ? (
          <p className="py-8 text-center text-gray-500">Caricamento…</p>
        ) : aziende.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
            <p className="text-gray-600">
              Nessun sito. Crea il primo rilievo con il pulsante in basso.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {aziende.map((a) => (
              <AziendaCard
                key={a.id}
                azienda={a}
                stats={stats[a.id] || { count: 0, ee: 0, tep: 0 }}
                onOpen={() => onOpenAzienda(a.id)}
                onDelete={() => setToDelete(a)}
              />
            ))}
          </div>
        )}

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
          <button type="button" className="btn-primary w-full" onClick={createAzienda}>
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
            Nuovo sito
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminare il sito?"
        message={`Verranno eliminati anche tutti gli apparecchi, gli automezzi, i consumi, le bollette e le foto di "${
          toDelete?.ragioneSociale || 'azienda'
        }". Operazione non reversibile.`}
        confirmLabel="Elimina"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      {importFile ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setImportFile(null)}
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
                onClick={() => setImportFile(null)}
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
