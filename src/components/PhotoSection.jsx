import { useEffect, useRef, useState } from 'react'
import { getPhotos, putPhoto, deletePhoto, newId } from '../db'
import { compressImage } from '../utils/image'
import { TIPI_FOTO } from '../constants'
import ConfirmDialog from './ConfirmDialog'

function PhotoThumb({ photo, onDelete }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    const u = URL.createObjectURL(photo.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [photo.blob])

  return (
    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {url ? (
        <img
          src={url}
          alt={photo.tipo === 'targa' ? 'Targa dati' : 'Contesto'}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="aspect-square w-full" />
      )}
      <span
        className={`badge absolute left-1 top-1 ${
          photo.tipo === 'targa'
            ? 'bg-atlas-green text-white'
            : 'bg-atlas-light text-atlas-dark'
        }`}
      >
        {photo.tipo === 'targa' ? 'Targa' : 'Contesto'}
      </span>
      <button
        type="button"
        aria-label="Elimina foto"
        onClick={() => onDelete(photo)}
        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white active:bg-black/80"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function PhotoSection({ apparecchioId, onCountChange }) {
  const [photos, setPhotos] = useState([])
  const [tipo, setTipo] = useState('targa')
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const inputRef = useRef(null)

  async function refresh() {
    const list = await getPhotos(apparecchioId)
    setPhotos(list)
    if (onCountChange) onCountChange(list)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apparecchioId])

  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (files.length === 0) return
    setBusy(true)
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue
        const blob = await compressImage(file)
        await putPhoto({
          id: newId(),
          apparecchioId,
          blob,
          tipo,
          timestamp: Date.now(),
        })
      }
      await refresh()
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    await deletePhoto(toDelete.id)
    setToDelete(null)
    await refresh()
  }

  const targaCount = photos.filter((p) => p.tipo === 'targa').length

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="field-label mb-0">Tipo foto da acquisire:</span>
        <div className="inline-flex overflow-hidden rounded-lg border border-atlas-green">
          {TIPI_FOTO.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipo(t.value)}
              className={`min-h-touch px-3 py-1.5 text-sm font-semibold ${
                tipo === t.value
                  ? 'bg-atlas-green text-white'
                  : 'bg-white text-atlas-dark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            'Elaboro…'
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Scatta / carica foto
            </>
          )}
        </button>
      </div>

      {targaCount === 0 ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
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
            Nessuna foto della <strong>targa dati</strong> per questo
            apparecchio.
          </span>
        </div>
      ) : null}

      {photos.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <PhotoThumb key={p.id} photo={p} onDelete={setToDelete} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-500">
          Nessuna foto acquisita.
        </p>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminare la foto?"
        message="L'operazione non è reversibile."
        confirmLabel="Elimina"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
