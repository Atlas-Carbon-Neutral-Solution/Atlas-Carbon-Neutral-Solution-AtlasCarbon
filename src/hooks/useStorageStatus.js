import { useEffect, useState } from 'react'
import { detectStorage } from '../utils/storage'

// Ritorna lo stato dell'archiviazione: null finché non rilevato, poi
// { mode: 'indexeddb' | 'memory', persisted: boolean }.
export function useStorageStatus() {
  const [status, setStatus] = useState(null)
  useEffect(() => {
    let active = true
    detectStorage().then((s) => {
      if (active) setStatus(s)
    })
    return () => {
      active = false
    }
  }, [])
  return status
}
