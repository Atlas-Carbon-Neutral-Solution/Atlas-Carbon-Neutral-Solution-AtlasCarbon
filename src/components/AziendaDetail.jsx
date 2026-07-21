import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './Header'
import { TextField, NumberField, TextAreaField } from './Field'
import {
  AREE,
  CATEGORIE,
  STATI,
  STATO_BADGE,
  emptyUtenza,
  labelOf,
} from '../constants'
import {
  getAzienda,
  putAzienda,
  getUtenze,
  getVettori,
  getPhotos,
  newId,
} from '../db'
import { useAutosave } from '../hooks/useAutosave'
import {
  consumoUtenza,
  consumoTotaleUtenze,
  percentualeSulTotale,
  tepTotale,
  formatKWh,
  formatTep,
  formatNumber,
} from '../utils/calc'
import { exportXlsx, exportPhotosZip } from '../utils/exportXlsxZip'
import UtenzaForm from './UtenzaForm'
import VettoriSection from './VettoriSection'
import BolletteSection from './BolletteSection'

const TABS = [
  { key: 'anagrafica', label: 'Anagrafica' },
  { key: 'utenze', label: 'Utenze' },
  { key: 'vettori', label: 'Consumi' },
  { key: 'bollette', label: 'Bollette' },
]

function UtenzaRow({ utenza, totale, noTarga, onOpen }) {
  const consumo = consumoUtenza(utenza)
  const pct = percentualeSulTotale(utenza, totale)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-3 text-left last:border-b-0 active:bg-atlas-bg"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-atlas-dark">
            {utenza.denominazione || '(senza nome)'}
          </span>
          {noTarga ? (
            <span className="badge bg-yellow-100 text-yellow-800">no targa</span>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span>{labelOf(AREE, utenza.area)}</span>
          <span>· {labelOf(CATEGORIE, utenza.categoria)}</span>
          {utenza.ubicazione ? <span>· {utenza.ubicazione}</span> : null}
          <span className={`badge ${STATO_BADGE[utenza.stato] || ''}`}>
            {labelOf(STATI, utenza.stato)}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-atlas-dark">{formatKWh(consumo)}</div>
        <div className="text-xs text-gray-500">{formatNumber(pct, 1)}%</div>
      </div>
    </button>
  )
}

function ExportBar({ azienda, utenze }) {
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  async function run(fn, okMsg) {
    setBusy(true)
    try {
      const res = await fn(azienda)
      setMsg(typeof okMsg === 'function' ? okMsg(res) : okMsg)
    } catch (e) {
      console.error(e)
      setMsg('Errore durante l’esportazione.')
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
          disabled={busy}
          onClick={() => run(exportXlsx, 'File .xlsx generato.')}
        >
          Esporta .xlsx
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() =>
            run(exportPhotosZip, (r) =>
              r.count === 0
                ? 'Nessuna foto da esportare.'
                : `Archivio .zip generato (${r.count} foto).`,
            )
          }
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

export default function AziendaDetail({ aziendaId, onBack }) {
  const [azienda, setAzienda] = useState(null)
  const [utenze, setUtenze] = useState([])
  const [vettori, setVettori] = useState([])
  const [targaMap, setTargaMap] = useState({})
  const [sortDesc, setSortDesc] = useState(true)
  const [tab, setTab] = useState('anagrafica')
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  const [saveState, scheduleSave] = useAutosave(async (payload) => {
    await putAzienda(payload)
  })

  const loadChildren = useCallback(async () => {
    const [uList, vList] = await Promise.all([
      getUtenze(aziendaId),
      getVettori(aziendaId),
    ])
    setUtenze(uList)
    setVettori(vList)
    const entries = await Promise.all(
      uList.map(async (u) => {
        const photos = await getPhotos(u.id)
        return [u.id, photos.some((p) => p.tipo === 'targa')]
      }),
    )
    setTargaMap(Object.fromEntries(entries))
  }, [aziendaId])

  useEffect(() => {
    let active = true
    ;(async () => {
      const a = await getAzienda(aziendaId)
      if (!active) return
      setAzienda(a)
      await loadChildren()
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [aziendaId, loadChildren])

  const totaleEE = useMemo(() => consumoTotaleUtenze(utenze), [utenze])
  const totaleTep = useMemo(() => tepTotale(vettori), [vettori])

  const sorted = useMemo(() => {
    const copy = [...utenze]
    copy.sort((a, b) => {
      const d = consumoUtenza(b) - consumoUtenza(a)
      return sortDesc ? d : -d
    })
    return copy
  }, [utenze, sortDesc])

  function update(patch) {
    const next = { ...azienda, ...patch }
    setAzienda(next)
    scheduleSave(next)
  }

  function openNew() {
    setEditing({ utenza: emptyUtenza(newId(), aziendaId), isNew: true })
  }

  async function closeEditor() {
    setEditing(null)
    await loadChildren()
  }

  if (editing) {
    return (
      <UtenzaForm
        initial={editing.utenza}
        isNew={editing.isNew}
        onClose={closeEditor}
      />
    )
  }

  if (loading || !azienda) {
    return (
      <div className="min-h-screen bg-atlas-bg">
        <Header saveState="idle" onBack={onBack} />
        <p className="p-6 text-center text-gray-500">Caricamento…</p>
      </div>
    )
  }

  const senzaTarga = utenze.filter((u) => !targaMap[u.id]).length

  return (
    <div className="min-h-screen bg-atlas-bg">
      <Header
        saveState={saveState}
        onBack={onBack}
        subtitle={azienda.ragioneSociale || 'Azienda'}
      />

      {/* Riepilogo */}
      <div className="bg-atlas-dark text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-atlas-light">
              Utenze
            </p>
            <p className="text-xl font-bold">{utenze.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-atlas-light">
              Cons. elettrico stimato
            </p>
            <p className="text-xl font-bold">{formatKWh(totaleEE)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-atlas-light">
              Consumi (tep)
            </p>
            <p className="text-xl font-bold">{formatTep(totaleTep)}</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`min-h-touch flex-1 border-b-2 px-2 py-2 text-sm font-semibold ${
                tab === t.key
                  ? 'border-atlas-green text-atlas-green'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-3 py-4 pb-28">
        {tab === 'anagrafica' ? (
          <>
            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-atlas-dark">
                Anagrafica azienda / sito
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField
                    label="Ragione sociale"
                    value={azienda.ragioneSociale}
                    onChange={(v) => update({ ragioneSociale: v })}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    label="Indirizzo"
                    value={azienda.indirizzo}
                    onChange={(v) => update({ indirizzo: v })}
                  />
                </div>
                <TextField
                  label="P.IVA"
                  value={azienda.piva}
                  onChange={(v) => update({ piva: v })}
                  inputMode="numeric"
                />
                <TextField
                  label="Codice ATECO"
                  value={azienda.ateco}
                  onChange={(v) => update({ ateco: v })}
                  placeholder="Es. 23.61"
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Settore merceologico"
                    value={azienda.settore}
                    onChange={(v) => update({ settore: v })}
                  />
                </div>
                <TextField
                  label="Anno di riferimento"
                  value={azienda.annoRiferimento}
                  onChange={(v) => update({ annoRiferimento: v })}
                  inputMode="numeric"
                />
                <NumberField
                  label="Superficie (m²)"
                  value={azienda.superficie}
                  onChange={(v) => update({ superficie: v })}
                />
              </div>

              <h3 className="mb-2 mt-4 text-sm font-bold text-atlas-dark">
                Prezzi dei vettori energetici
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <NumberField
                  label="Energia elettrica (€/kWh)"
                  value={azienda.prezzoEE}
                  onChange={(v) => update({ prezzoEE: v })}
                />
                <NumberField
                  label="Gas naturale (€/Smc)"
                  value={azienda.prezzoGas}
                  onChange={(v) => update({ prezzoGas: v })}
                />
                <NumberField
                  label="Gasolio (€/litro)"
                  value={azienda.prezzoGasolio}
                  onChange={(v) => update({ prezzoGasolio: v })}
                />
              </div>

              <div className="mt-4">
                <TextAreaField
                  label="Note"
                  value={azienda.note}
                  onChange={(v) => update({ note: v })}
                />
              </div>
            </section>

            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-atlas-dark">
                Esportazione dati
              </h2>
              <ExportBar azienda={azienda} utenze={utenze} />
            </section>
          </>
        ) : null}

        {tab === 'utenze' ? (
          <section className="rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="text-base font-bold text-atlas-dark">
                Utenze monitorate
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
                  {senzaTarga === 1 ? 'utenza è priva' : 'utenze sono prive'}{' '}
                  della foto della targa dati.
                </span>
              </div>
            ) : null}

            {sorted.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">
                Nessuna utenza. Usa il pulsante “+ Utenza”.
              </p>
            ) : (
              <div className="mt-1">
                {sorted.map((u) => (
                  <UtenzaRow
                    key={u.id}
                    utenza={u}
                    totale={totaleEE}
                    noTarga={!targaMap[u.id]}
                    onOpen={() => setEditing({ utenza: u, isNew: false })}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {tab === 'vettori' ? (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-atlas-dark">
              Vettori energetici e consumi
            </h2>
            <VettoriSection aziendaId={aziendaId} />
          </section>
        ) : null}

        {tab === 'bollette' ? (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-atlas-dark">
              Bollette elettriche mensili
            </h2>
            <BolletteSection
              aziendaId={aziendaId}
              annoDefault={azienda.annoRiferimento}
            />
          </section>
        ) : null}
      </main>

      {tab === 'utenze' ? (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-3 py-3 backdrop-blur"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto max-w-3xl">
            <button type="button" className="btn-primary w-full" onClick={openNew}>
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
              Utenza
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
