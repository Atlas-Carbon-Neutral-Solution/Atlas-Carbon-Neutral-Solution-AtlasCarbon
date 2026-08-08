// Configurazione Supabase (URL progetto + anon key), salvata localmente.
// Accessi a localStorage protetti (in alcuni iframe sandbox può lanciare).
const KEY = 'atlas-supabase-config'

function safeGet(k) {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function safeSet(k, v) {
  try {
    localStorage.setItem(k, v)
    return true
  } catch {
    return false
  }
}
function safeDel(k) {
  try {
    localStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}

export function getCloudConfig() {
  const raw = safeGet(KEY)
  if (!raw) return null
  try {
    const c = JSON.parse(raw)
    return c && c.url && c.anonKey ? c : null
  } catch {
    return null
  }
}

export function setCloudConfig(url, anonKey) {
  return safeSet(
    KEY,
    JSON.stringify({ url: (url || '').trim(), anonKey: (anonKey || '').trim() }),
  )
}

export function clearCloudConfig() {
  safeDel(KEY)
}

export function isCloudConfigured() {
  return !!getCloudConfig()
}
