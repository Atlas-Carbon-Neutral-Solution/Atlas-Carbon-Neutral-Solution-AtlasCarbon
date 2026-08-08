import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { getSupabase, resetSupabase } from '../supabase'
import {
  getCloudConfig,
  setCloudConfig,
  clearCloudConfig,
} from '../utils/cloudConfig'
import { syncNow, resetSyncCursor } from '../sync/supabaseSync'

const CloudContext = createContext(null)

export function useCloud() {
  const ctx = useContext(CloudContext)
  if (!ctx) throw new Error('useCloud fuori da CloudProvider')
  return ctx
}

export function CloudProvider({ children }) {
  const [config, setConfig] = useState(() => getCloudConfig())
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  // Sottoscrizione allo stato di autenticazione.
  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setReady(true)
      return
    }
    let subscription
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session || null)
      setReady(true)
    })
    const { data } = sb.auth.onAuthStateChange((_event, s) => setSession(s))
    subscription = data?.subscription
    return () => subscription?.unsubscribe?.()
  }, [config])

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const r = await syncNow()
      setLastSync({ ...r, at: Date.now() })
      return r
    } catch (e) {
      setLastSync({ error: e?.message || String(e), at: Date.now() })
      throw e
    } finally {
      setSyncing(false)
    }
  }, [])

  // Sincronizza automaticamente all'accesso e al ritorno online.
  useEffect(() => {
    if (session) sync().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    const onOnline = () => {
      if (session) sync().catch(() => {})
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [session, sync])

  const saveConfig = useCallback((url, anonKey) => {
    setCloudConfig(url, anonKey)
    resetSupabase()
    resetSyncCursor()
    setConfig(getCloudConfig())
  }, [])

  const disconnect = useCallback(async () => {
    try {
      await getSupabase()?.auth.signOut()
    } catch {
      /* ignore */
    }
    clearCloudConfig()
    resetSupabase()
    resetSyncCursor()
    setSession(null)
    setLastSync(null)
    setConfig(null)
  }, [])

  const signIn = useCallback(async (email, password) => {
    const sb = getSupabase()
    if (!sb) throw new Error('Configura prima il cloud.')
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email, password) => {
    const sb = getSupabase()
    if (!sb) throw new Error('Configura prima il cloud.')
    const { error } = await sb.auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    try {
      await getSupabase()?.auth.signOut()
    } catch {
      /* ignore */
    }
    setSession(null)
  }, [])

  const value = {
    config,
    configured: !!config,
    session,
    user: session?.user || null,
    ready,
    syncing,
    lastSync,
    sync,
    saveConfig,
    disconnect,
    signIn,
    signUp,
    signOut,
  }

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>
}
