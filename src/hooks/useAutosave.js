import { useCallback, useEffect, useRef, useState } from 'react'

// Hook di autosave con debounce.
// Ritorna [saveState, scheduleSave, saveNow].
// saveState: 'idle' | 'saving' | 'saved'
export function useAutosave(saveFn, delay = 600) {
  const [saveState, setSaveState] = useState('idle')
  const timer = useRef(null)
  const pending = useRef(null)
  const saveFnRef = useRef(saveFn)
  const resetTimer = useRef(null)

  useEffect(() => {
    saveFnRef.current = saveFn
  }, [saveFn])

  const runSave = useCallback(async (payload) => {
    setSaveState('saving')
    try {
      await saveFnRef.current(payload)
      setSaveState('saved')
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setSaveState('idle'), 2500)
    } catch (e) {
      console.error('Errore di salvataggio', e)
      setSaveState('idle')
    }
  }, [])

  const scheduleSave = useCallback(
    (payload) => {
      pending.current = payload
      setSaveState('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        runSave(pending.current)
      }, delay)
    },
    [delay, runSave],
  )

  const saveNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    if (pending.current != null) {
      await runSave(pending.current)
    }
  }, [runSave])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  return [saveState, scheduleSave, saveNow]
}
