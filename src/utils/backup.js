import { getAllData, mergeData, replaceAllData, newId } from '../db'
import { blobToDataURL, dataURLToBlob } from './image'

const BACKUP_VERSION = 1

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Esporta l'intero database in un file JSON (foto in base64).
export async function exportBackup() {
  const { buildings, appliances, photos } = await getAllData()
  const photosB64 = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      apparecchioId: p.apparecchioId,
      tipo: p.tipo,
      timestamp: p.timestamp,
      dataUrl: await blobToDataURL(p.blob),
    })),
  )

  const payload = {
    app: 'atlas-rilievo-diagnosi-energetica',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    buildings,
    appliances,
    photos: photosB64,
  }

  const blob = new Blob([JSON.stringify(payload)], {
    type: 'application/json',
  })
  const stamp = new Date().toISOString().slice(0, 10)
  triggerDownload(blob, `atlas-backup_${stamp}.json`)
  return {
    buildings: buildings.length,
    appliances: appliances.length,
    photos: photos.length,
  }
}

async function parseBackup(text) {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.buildings)) {
    throw new Error('File di backup non valido.')
  }
  const photos = await Promise.all(
    (data.photos || []).map(async (p) => ({
      id: p.id || newId(),
      apparecchioId: p.apparecchioId,
      tipo: p.tipo,
      timestamp: p.timestamp || Date.now(),
      blob: await dataURLToBlob(p.dataUrl),
    })),
  )
  return {
    buildings: data.buildings || [],
    appliances: data.appliances || [],
    photos,
  }
}

// Importa un backup JSON. mode: 'replace' sostituisce tutto, 'merge' aggiunge/aggiorna.
export async function importBackup(file, mode = 'merge') {
  const text = await file.text()
  const data = await parseBackup(text)
  if (mode === 'replace') {
    await replaceAllData(data)
  } else {
    await mergeData(data)
  }
  return {
    buildings: data.buildings.length,
    appliances: data.appliances.length,
    photos: data.photos.length,
  }
}
