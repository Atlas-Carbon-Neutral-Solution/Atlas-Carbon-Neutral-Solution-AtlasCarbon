import { openDB } from 'idb'

const DB_NAME = 'atlas-rilievo'
const DB_VERSION = 1

// Nomi degli object store.
export const STORES = {
  buildings: 'buildings',
  appliances: 'appliances',
  photos: 'photos',
}

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.buildings)) {
          db.createObjectStore(STORES.buildings, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.appliances)) {
          const s = db.createObjectStore(STORES.appliances, { keyPath: 'id' })
          s.createIndex('edificioId', 'edificioId', { unique: false })
        }
        if (!db.objectStoreNames.contains(STORES.photos)) {
          const s = db.createObjectStore(STORES.photos, { keyPath: 'id' })
          s.createIndex('apparecchioId', 'apparecchioId', { unique: false })
        }
      },
    })
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
/* Edifici                                                            */
/* ------------------------------------------------------------------ */

export async function getBuildings() {
  const db = await getDB()
  const list = await db.getAll(STORES.buildings)
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export async function getBuilding(id) {
  const db = await getDB()
  return db.get(STORES.buildings, id)
}

export async function putBuilding(building) {
  const db = await getDB()
  const record = { ...building, updatedAt: Date.now() }
  if (!record.createdAt) record.createdAt = record.updatedAt
  await db.put(STORES.buildings, record)
  return record
}

export async function deleteBuilding(id) {
  const db = await getDB()
  // Cancella a cascata gli apparecchi e le relative foto.
  const appliances = await db.getAllFromIndex(
    STORES.appliances,
    'edificioId',
    id,
  )
  const tx = db.transaction(
    [STORES.buildings, STORES.appliances, STORES.photos],
    'readwrite',
  )
  for (const a of appliances) {
    const photos = await tx
      .objectStore(STORES.photos)
      .index('apparecchioId')
      .getAllKeys(a.id)
    for (const pid of photos) {
      await tx.objectStore(STORES.photos).delete(pid)
    }
    await tx.objectStore(STORES.appliances).delete(a.id)
  }
  await tx.objectStore(STORES.buildings).delete(id)
  await tx.done
}

/* ------------------------------------------------------------------ */
/* Apparecchi                                                         */
/* ------------------------------------------------------------------ */

export async function getAppliances(edificioId) {
  const db = await getDB()
  const list = await db.getAllFromIndex(
    STORES.appliances,
    'edificioId',
    edificioId,
  )
  return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

export async function getAppliance(id) {
  const db = await getDB()
  return db.get(STORES.appliances, id)
}

export async function putAppliance(appliance) {
  const db = await getDB()
  const record = { ...appliance, updatedAt: Date.now() }
  if (!record.createdAt) record.createdAt = record.updatedAt
  await db.put(STORES.appliances, record)
  return record
}

export async function deleteAppliance(id) {
  const db = await getDB()
  const tx = db.transaction([STORES.appliances, STORES.photos], 'readwrite')
  const photoKeys = await tx
    .objectStore(STORES.photos)
    .index('apparecchioId')
    .getAllKeys(id)
  for (const pid of photoKeys) {
    await tx.objectStore(STORES.photos).delete(pid)
  }
  await tx.objectStore(STORES.appliances).delete(id)
  await tx.done
}

export async function countAppliances(edificioId) {
  const db = await getDB()
  return db.countFromIndex(STORES.appliances, 'edificioId', edificioId)
}

/* ------------------------------------------------------------------ */
/* Foto                                                               */
/* ------------------------------------------------------------------ */

export async function getPhotos(apparecchioId) {
  const db = await getDB()
  const list = await db.getAllFromIndex(
    STORES.photos,
    'apparecchioId',
    apparecchioId,
  )
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

export async function countPhotos(apparecchioId, tipo) {
  const photos = await getPhotos(apparecchioId)
  if (!tipo) return photos.length
  return photos.filter((p) => p.tipo === tipo).length
}

/* ------------------------------------------------------------------ */
/* Backup completo (per import/export JSON)                           */
/* ------------------------------------------------------------------ */

export async function getAllData() {
  const db = await getDB()
  const [buildings, appliances, photos] = await Promise.all([
    db.getAll(STORES.buildings),
    db.getAll(STORES.appliances),
    db.getAll(STORES.photos),
  ])
  return { buildings, appliances, photos }
}

export async function replaceAllData({ buildings, appliances, photos }) {
  const db = await getDB()
  const tx = db.transaction(
    [STORES.buildings, STORES.appliances, STORES.photos],
    'readwrite',
  )
  await tx.objectStore(STORES.buildings).clear()
  await tx.objectStore(STORES.appliances).clear()
  await tx.objectStore(STORES.photos).clear()
  for (const b of buildings || []) await tx.objectStore(STORES.buildings).put(b)
  for (const a of appliances || [])
    await tx.objectStore(STORES.appliances).put(a)
  for (const p of photos || []) await tx.objectStore(STORES.photos).put(p)
  await tx.done
}

export async function mergeData({ buildings, appliances, photos }) {
  const db = await getDB()
  const tx = db.transaction(
    [STORES.buildings, STORES.appliances, STORES.photos],
    'readwrite',
  )
  for (const b of buildings || []) await tx.objectStore(STORES.buildings).put(b)
  for (const a of appliances || [])
    await tx.objectStore(STORES.appliances).put(a)
  for (const p of photos || []) await tx.objectStore(STORES.photos).put(p)
  await tx.done
}
