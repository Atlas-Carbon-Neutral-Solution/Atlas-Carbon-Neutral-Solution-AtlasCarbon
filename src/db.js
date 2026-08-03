import { openDB } from 'idb'

const DB_NAME = 'atlas-diagnosi'
const DB_VERSION = 2

export const STORES = {
  aziende: 'aziende',
  utenze: 'utenze',
  automezzi: 'automezzi',
  vettori: 'vettori',
  bollette: 'bollette',
  photos: 'photos',
}

let dbPromise = null

const upgrade = (db) => {
  if (!db.objectStoreNames.contains(STORES.aziende)) {
    db.createObjectStore(STORES.aziende, { keyPath: 'id' })
  }
  for (const [store, index] of [
    [STORES.utenze, 'aziendaId'],
    [STORES.automezzi, 'aziendaId'],
    [STORES.vettori, 'aziendaId'],
    [STORES.bollette, 'aziendaId'],
    [STORES.photos, 'utenzaId'],
  ]) {
    if (!db.objectStoreNames.contains(store)) {
      const s = db.createObjectStore(store, { keyPath: 'id' })
      s.createIndex(index, index, { unique: false })
    }
  }
}

async function openDatabase() {
  try {
    return await openDB(DB_NAME, DB_VERSION, { upgrade })
  } catch (e) {
    // IndexedDB non disponibile (es. iframe con storage bloccato):
    // fallback in memoria, così l'app resta comunque utilizzabile.
    console.warn('IndexedDB non disponibile, uso archivio in memoria.', e)
    await import('fake-indexeddb/auto')
    return openDB(DB_NAME, DB_VERSION, { upgrade })
  }
}

function getDB() {
  if (!dbPromise) {
    dbPromise = openDatabase()
  }
  return dbPromise
}

export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/* ------------------------------------------------------------------ */
/* Aziende / Siti                                                     */
/* ------------------------------------------------------------------ */

export async function getAziende() {
  const db = await getDB()
  const list = await db.getAll(STORES.aziende)
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export async function getAzienda(id) {
  const db = await getDB()
  return db.get(STORES.aziende, id)
}

export async function putAzienda(azienda) {
  const db = await getDB()
  const record = { ...azienda, updatedAt: Date.now() }
  if (!record.createdAt) record.createdAt = record.updatedAt
  await db.put(STORES.aziende, record)
  return record
}

export async function deleteAzienda(id) {
  const db = await getDB()
  const utenze = await db.getAllFromIndex(STORES.utenze, 'aziendaId', id)
  const tx = db.transaction(
    [
      STORES.aziende,
      STORES.utenze,
      STORES.automezzi,
      STORES.vettori,
      STORES.bollette,
      STORES.photos,
    ],
    'readwrite',
  )
  for (const u of utenze) {
    const photoKeys = await tx
      .objectStore(STORES.photos)
      .index('utenzaId')
      .getAllKeys(u.id)
    for (const pid of photoKeys) await tx.objectStore(STORES.photos).delete(pid)
    await tx.objectStore(STORES.utenze).delete(u.id)
  }
  for (const store of [STORES.automezzi, STORES.vettori, STORES.bollette]) {
    const keys = await tx
      .objectStore(store)
      .index('aziendaId')
      .getAllKeys(id)
    for (const k of keys) await tx.objectStore(store).delete(k)
  }
  await tx.objectStore(STORES.aziende).delete(id)
  await tx.done
}

/* ------------------------------------------------------------------ */
/* Utenze monitorate                                                  */
/* ------------------------------------------------------------------ */

export async function getUtenze(aziendaId) {
  const db = await getDB()
  const list = await db.getAllFromIndex(STORES.utenze, 'aziendaId', aziendaId)
  return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

export async function putUtenza(utenza) {
  const db = await getDB()
  const record = { ...utenza, updatedAt: Date.now() }
  if (!record.createdAt) record.createdAt = record.updatedAt
  await db.put(STORES.utenze, record)
  return record
}

export async function deleteUtenza(id) {
  const db = await getDB()
  const tx = db.transaction([STORES.utenze, STORES.photos], 'readwrite')
  const photoKeys = await tx
    .objectStore(STORES.photos)
    .index('utenzaId')
    .getAllKeys(id)
  for (const pid of photoKeys) await tx.objectStore(STORES.photos).delete(pid)
  await tx.objectStore(STORES.utenze).delete(id)
  await tx.done
}

/* ------------------------------------------------------------------ */
/* Automezzi aziendali                                                */
/* ------------------------------------------------------------------ */

export async function getAutomezzi(aziendaId) {
  const db = await getDB()
  const list = await db.getAllFromIndex(STORES.automezzi, 'aziendaId', aziendaId)
  return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

export async function putAutomezzo(automezzo) {
  const db = await getDB()
  const record = { ...automezzo, updatedAt: Date.now() }
  if (!record.createdAt) record.createdAt = record.updatedAt
  await db.put(STORES.automezzi, record)
  return record
}

export async function deleteAutomezzo(id) {
  const db = await getDB()
  await db.delete(STORES.automezzi, id)
}

/* ------------------------------------------------------------------ */
/* Vettori energetici / consumi                                       */
/* ------------------------------------------------------------------ */

export async function getVettori(aziendaId) {
  const db = await getDB()
  const list = await db.getAllFromIndex(STORES.vettori, 'aziendaId', aziendaId)
  return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

export async function putVettore(vettore) {
  const db = await getDB()
  const record = { ...vettore, updatedAt: Date.now() }
  if (!record.createdAt) record.createdAt = record.updatedAt
  await db.put(STORES.vettori, record)
  return record
}

export async function deleteVettore(id) {
  const db = await getDB()
  await db.delete(STORES.vettori, id)
}

/* ------------------------------------------------------------------ */
/* Bollette                                                           */
/* ------------------------------------------------------------------ */

export async function getBollette(aziendaId) {
  const db = await getDB()
  const list = await db.getAllFromIndex(STORES.bollette, 'aziendaId', aziendaId)
  return list.sort((a, b) => {
    if (a.anno !== b.anno) return String(a.anno).localeCompare(String(b.anno))
    return (Number(a.mese) || 0) - (Number(b.mese) || 0)
  })
}

export async function putBolletta(bolletta) {
  const db = await getDB()
  const record = { ...bolletta, updatedAt: Date.now() }
  if (!record.createdAt) record.createdAt = record.updatedAt
  await db.put(STORES.bollette, record)
  return record
}

export async function deleteBolletta(id) {
  const db = await getDB()
  await db.delete(STORES.bollette, id)
}

/* ------------------------------------------------------------------ */
/* Foto (child di Utenza)                                             */
/* ------------------------------------------------------------------ */

export async function getPhotos(utenzaId) {
  const db = await getDB()
  const list = await db.getAllFromIndex(STORES.photos, 'utenzaId', utenzaId)
  return list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
}

export async function putPhoto(photo) {
  const db = await getDB()
  await db.put(STORES.photos, photo)
  return photo
}

export async function deletePhoto(id) {
  const db = await getDB()
  await db.delete(STORES.photos, id)
}

/* ------------------------------------------------------------------ */
/* Backup completo (import/export JSON)                               */
/* ------------------------------------------------------------------ */

export async function getAllData() {
  const db = await getDB()
  const [aziende, utenze, automezzi, vettori, bollette, photos] =
    await Promise.all([
      db.getAll(STORES.aziende),
      db.getAll(STORES.utenze),
      db.getAll(STORES.automezzi),
      db.getAll(STORES.vettori),
      db.getAll(STORES.bollette),
      db.getAll(STORES.photos),
    ])
  return { aziende, utenze, automezzi, vettori, bollette, photos }
}

async function writeAll(data, clear) {
  const db = await getDB()
  const tx = db.transaction(
    [
      STORES.aziende,
      STORES.utenze,
      STORES.automezzi,
      STORES.vettori,
      STORES.bollette,
      STORES.photos,
    ],
    'readwrite',
  )
  if (clear) {
    for (const s of Object.values(STORES)) await tx.objectStore(s).clear()
  }
  for (const r of data.aziende || []) await tx.objectStore(STORES.aziende).put(r)
  for (const r of data.utenze || []) await tx.objectStore(STORES.utenze).put(r)
  for (const r of data.automezzi || [])
    await tx.objectStore(STORES.automezzi).put(r)
  for (const r of data.vettori || []) await tx.objectStore(STORES.vettori).put(r)
  for (const r of data.bollette || [])
    await tx.objectStore(STORES.bollette).put(r)
  for (const r of data.photos || []) await tx.objectStore(STORES.photos).put(r)
  await tx.done
}

export async function replaceAllData(data) {
  await writeAll(data, true)
}

export async function mergeData(data) {
  await writeAll(data, false)
}
