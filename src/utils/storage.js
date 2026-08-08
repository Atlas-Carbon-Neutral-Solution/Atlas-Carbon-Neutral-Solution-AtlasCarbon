import { initDB } from '../db'

// Richiede al browser l'archiviazione permanente (evita che i dati vengano
// eliminati automaticamente sotto pressione di spazio). Ritorna true se
// l'archiviazione è (o diventa) permanente.
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage) return false
    if (navigator.storage.persisted) {
      const already = await navigator.storage.persisted()
      if (already) return true
    }
    if (navigator.storage.persist) {
      return await navigator.storage.persist()
    }
  } catch {
    /* ignore */
  }
  return false
}

// Rileva la modalità di archiviazione effettiva e se è permanente.
// Ritorna { mode: 'indexeddb' | 'memory', persisted: boolean }.
export async function detectStorage() {
  const mode = await initDB()
  let persisted = false
  if (mode === 'indexeddb') {
    persisted = await requestPersistentStorage()
  }
  return { mode, persisted }
}
