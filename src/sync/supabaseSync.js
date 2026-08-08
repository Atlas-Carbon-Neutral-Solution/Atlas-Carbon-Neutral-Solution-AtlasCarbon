import { getSupabase } from '../supabase'
import {
  KIND_STORE,
  getStoreRecords,
  getRecord,
  putRaw,
  deleteRaw,
  getDeletions,
  clearDeletion,
} from '../db'
import { blobToDataURL, dataURLToBlob } from '../utils/image'

const TABLE = 'records'
const LS_LAST = 'atlas-sync-last'

function getLast() {
  try {
    return Number(localStorage.getItem(LS_LAST)) || 0
  } catch {
    return 0
  }
}
function setLast(v) {
  try {
    localStorage.setItem(LS_LAST, String(v))
  } catch {
    /* ignore */
  }
}
export function resetSyncCursor() {
  try {
    localStorage.removeItem(LS_LAST)
  } catch {
    /* ignore */
  }
}

// "updatedAt" logico del record (le foto usano timestamp).
function recMs(kind, rec) {
  if (!rec) return -1
  return kind === 'photo' ? Number(rec.timestamp) || 0 : Number(rec.updatedAt) || 0
}

// Record locale -> payload JSON per il cloud.
async function recordToData(kind, rec) {
  if (kind === 'photo') {
    const { blob, ...rest } = rec
    return { ...rest, dataUrl: blob ? await blobToDataURL(blob) : null }
  }
  return { ...rec }
}

// Riga cloud -> record locale.
async function rowToRecord(row) {
  const d = row.data || {}
  if (row.kind === 'photo') {
    const { dataUrl, ...rest } = d
    return { ...rest, id: row.id, blob: dataUrl ? await dataURLToBlob(dataUrl) : null }
  }
  return { ...d, id: row.id }
}

export async function testConnection() {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud non configurato.')
  const { error } = await sb.from(TABLE).select('id').limit(1)
  if (error) throw error
  return true
}

// Sincronizzazione bidirezionale (pull poi push), last-write-wins.
export async function syncNow() {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud non configurato.')
  const {
    data: { session },
  } = await sb.auth.getSession()
  if (!session) throw new Error('Accedi al cloud per sincronizzare.')

  const last = getLast()
  const startedAt = Date.now()
  let pulled = 0
  let pushed = 0

  /* ---- PULL: applica le modifiche remote più recenti ---- */
  const { data: rows, error } = await sb
    .from(TABLE)
    .select('id,kind,data,deleted,updated_at')
    .gt('updated_at', new Date(last).toISOString())
    .order('updated_at', { ascending: true })
  if (error) throw error

  for (const row of rows || []) {
    const store = KIND_STORE[row.kind]
    if (!store) continue
    if (row.deleted) {
      const local = await getRecord(store, row.id)
      if (local) {
        await deleteRaw(store, row.id)
        pulled++
      }
      continue
    }
    const remoteMs = new Date(row.updated_at).getTime()
    const local = await getRecord(store, row.id)
    const localMs = local ? recMs(row.kind, local) : -1
    if (remoteMs >= localMs) {
      await putRaw(store, await rowToRecord(row))
      pulled++
    }
  }

  /* ---- PUSH: invia le modifiche locali e le eliminazioni ---- */
  const payload = []
  for (const [kind, store] of Object.entries(KIND_STORE)) {
    const recs = await getStoreRecords(store)
    for (const rec of recs) {
      const ms = recMs(kind, rec)
      if (ms > last) {
        payload.push({
          id: rec.id,
          kind,
          deleted: false,
          data: await recordToData(kind, rec),
          updated_at: new Date(ms || Date.now()).toISOString(),
        })
      }
    }
  }
  const dels = await getDeletions()
  for (const d of dels) {
    payload.push({
      id: d.id,
      kind: d.kind,
      deleted: true,
      data: {},
      updated_at: new Date(d.deletedAt || Date.now()).toISOString(),
    })
  }

  if (payload.length) {
    for (let i = 0; i < payload.length; i += 200) {
      const { error: perr } = await sb
        .from(TABLE)
        .upsert(payload.slice(i, i + 200), { onConflict: 'id' })
      if (perr) throw perr
    }
    pushed = payload.length
    for (const d of dels) await clearDeletion(d.id)
  }

  setLast(startedAt)
  return { pulled, pushed }
}
