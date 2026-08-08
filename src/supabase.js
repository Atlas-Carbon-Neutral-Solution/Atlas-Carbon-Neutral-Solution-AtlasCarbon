import { createClient } from '@supabase/supabase-js'
import { getCloudConfig } from './utils/cloudConfig'

// Client Supabase creato a partire dalla configurazione locale.
// Ritorna null se il cloud non è configurato.
let client = null
let clientKey = null

export function getSupabase() {
  const cfg = getCloudConfig()
  if (!cfg) return null
  const key = cfg.url + '|' + cfg.anonKey
  if (!client || clientKey !== key) {
    client = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
    clientKey = key
  }
  return client
}

export function resetSupabase() {
  client = null
  clientKey = null
}
