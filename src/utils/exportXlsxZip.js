import { getAppliances, getPhotos } from '../db'
import { consumoAnnuo, consumoTotale, percentualeSulTotale } from './calc'

const DEST_LABEL = {
  uffici: 'Uffici',
  industriale: 'Industriale',
  commerciale: 'Commerciale',
  residenziale: 'Residenziale',
  pubblico: 'Pubblico',
  altro: 'Altro',
}

const CAT_LABEL = {
  illuminazione: 'Illuminazione',
  hvac: 'HVAC/Climatizzazione',
  motori: 'Motori/Pompe',
  refrigerazione: 'Refrigerazione',
  ict: 'ICT',
  acs: 'Produzione ACS',
  altro: 'Altro',
}

const STATO_LABEL = {
  buono: 'Buono',
  obsoleto: 'Obsoleto',
  sostituire: 'Da sostituire',
}

function sanitizeFilename(name) {
  return (name || 'senza-nome')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 60)
}

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

// Genera il file .xlsx con due fogli (Edificio / Apparecchi).
export async function exportXlsx(building) {
  const XLSX = await import('xlsx')
  const appliances = await getAppliances(building.id)
  const totale = consumoTotale(appliances)

  const edificioRows = [
    ['Campo', 'Valore'],
    ['Nome', building.nome || ''],
    ['Indirizzo', building.indirizzo || ''],
    ['Destinazione d’uso', DEST_LABEL[building.destinazione] || ''],
    ['Anno costruzione', building.annoCostruzione || ''],
    ['Superficie utile (m²)', building.superficie || ''],
    ['Volume lordo (m³)', building.volume || ''],
    ['Occupanti', building.occupanti || ''],
    ['Ore occupazione/settimana', building.oreOccupazione || ''],
    ['POD elettrico', building.pod || ''],
    ['PDR gas', building.pdr || ''],
    ['Potenza impegnata (kW)', building.potenzaImpegnata || ''],
    ['Note', building.note || ''],
    ['Numero apparecchi censiti', appliances.length],
    ['Consumo stimato totale (kWh/anno)', Math.round(totale)],
  ]

  const applianceRows = [
    [
      'Identificativo',
      'Categoria',
      'Marca',
      'Modello',
      'Potenza nominale (kW)',
      'Quantità',
      'Ore/giorno',
      'Giorni/anno',
      'Ubicazione',
      'Stato',
      'Consumo stimato (kWh/anno)',
      '% sul totale',
      'Note',
    ],
  ]
  for (const a of appliances) {
    applianceRows.push([
      a.nome || '',
      CAT_LABEL[a.categoria] || '',
      a.marca || '',
      a.modello || '',
      Number(a.potenza) || 0,
      Number(a.quantita) || 0,
      Number(a.orePerGiorno) || 0,
      Number(a.giorniPerAnno) || 0,
      a.ubicazione || '',
      STATO_LABEL[a.stato] || '',
      Math.round(consumoAnnuo(a)),
      Number(percentualeSulTotale(a, totale).toFixed(1)),
      a.note || '',
    ])
  }

  const wb = XLSX.utils.book_new()
  const wsEd = XLSX.utils.aoa_to_sheet(edificioRows)
  wsEd['!cols'] = [{ wch: 32 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsEd, 'Edificio')

  const wsAp = XLSX.utils.aoa_to_sheet(applianceRows)
  wsAp['!cols'] = [
    { wch: 24 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 10 }, { wch: 10 }, { wch: 11 }, { wch: 18 }, { wch: 14 },
    { wch: 22 }, { wch: 11 }, { wch: 30 },
  ]
  XLSX.utils.book_append_sheet(wb, wsAp, 'Apparecchi')

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  triggerDownload(blob, `Diagnosi_${sanitizeFilename(building.nome)}.xlsx`)
}

// Genera lo .zip con le foto rinominate [NomeApparecchio]_[tipo]_[n].jpg
export async function exportPhotosZip(building) {
  const { default: JSZip } = await import('jszip')
  const appliances = await getAppliances(building.id)
  const zip = new JSZip()
  let total = 0

  for (const a of appliances) {
    const photos = await getPhotos(a.id)
    const counters = { targa: 0, contesto: 0 }
    for (const p of photos) {
      const tipo = p.tipo === 'targa' ? 'targa' : 'contesto'
      counters[tipo] += 1
      const filename = `${sanitizeFilename(a.nome)}_${tipo}_${counters[tipo]}.jpg`
      zip.file(filename, p.blob)
      total += 1
    }
  }

  if (total === 0) {
    return { count: 0 }
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, `Foto_${sanitizeFilename(building.nome)}.zip`)
  return { count: total }
}
