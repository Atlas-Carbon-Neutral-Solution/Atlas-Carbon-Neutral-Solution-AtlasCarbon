import { getUtenze, getVettori, getBollette, getPhotos } from '../db'
import {
  AREE,
  CATEGORIE,
  STATI,
  TIPOLOGIE,
  TIPI_MISURA,
  MESI,
  VETTORI,
  labelOf,
} from '../constants'
import {
  consumoUtenza,
  consumoTotaleUtenze,
  percentualeSulTotale,
  vettoreTep,
  vettoreCosto,
  euroPerKwh,
} from './calc'

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

// Genera il file .xlsx con fogli Azienda / Utenze / Vettori / Bollette.
export async function exportXlsx(azienda) {
  const XLSX = await import('xlsx')
  const [utenze, vettori, bollette] = await Promise.all([
    getUtenze(azienda.id),
    getVettori(azienda.id),
    getBollette(azienda.id),
  ])
  const totaleEE = consumoTotaleUtenze(utenze)

  /* --- Foglio Azienda --- */
  const aziendaRows = [
    ['Campo', 'Valore'],
    ['Ragione sociale', azienda.ragioneSociale || ''],
    ['Indirizzo', azienda.indirizzo || ''],
    ['P.IVA', azienda.piva || ''],
    ['Codice ATECO', azienda.ateco || ''],
    ['Settore merceologico', azienda.settore || ''],
    ['Anno di riferimento', azienda.annoRiferimento || ''],
    ['Superficie (m²)', azienda.superficie || ''],
    ['Prezzo energia elettrica (€/kWh)', azienda.prezzoEE || ''],
    ['Prezzo gas naturale (€/Smc)', azienda.prezzoGas || ''],
    ['Prezzo gasolio (€/litro)', azienda.prezzoGasolio || ''],
    ['Note', azienda.note || ''],
    ['Numero utenze monitorate', utenze.length],
    ['Consumo elettrico stimato utenze (kWh/anno)', Math.round(totaleEE)],
  ]

  /* --- Foglio Utenze --- */
  const utenzeRows = [
    [
      'Denominazione',
      'Area',
      'Categoria',
      'Tipologia',
      'Marca',
      'Modello',
      'Potenza nominale (kW)',
      'Quantità',
      'Fattore di carico',
      'Rendimento',
      'Ore/giorno',
      'Giorni/anno',
      'Tipo misura',
      'Ubicazione',
      'Stato',
      'Consumo stimato (kWh/anno)',
      '% sul totale',
      'Note',
    ],
  ]
  for (const u of utenze) {
    utenzeRows.push([
      u.denominazione || '',
      labelOf(AREE, u.area),
      labelOf(CATEGORIE, u.categoria),
      labelOf(TIPOLOGIE, u.tipologia),
      u.marca || '',
      u.modello || '',
      Number(u.potenza) || 0,
      Number(u.quantita) || 0,
      Number(u.fattoreCarico) || 0,
      Number(u.rendimento) || 0,
      Number(u.orePerGiorno) || 0,
      Number(u.giorniPerAnno) || 0,
      labelOf(TIPI_MISURA, u.tipoMisura),
      u.ubicazione || '',
      labelOf(STATI, u.stato),
      Math.round(consumoUtenza(u)),
      Number(percentualeSulTotale(u, totaleEE).toFixed(1)),
      u.note || '',
    ])
  }

  /* --- Foglio Vettori / Consumi --- */
  const vettoriRows = [
    [
      'Vettore energetico',
      'Valore',
      'u.m.',
      'Fattore conversione (tep/u.m.)',
      'Consumo (tep)',
      'Prezzo unitario (€/u.m.)',
      'Costo (€)',
    ],
  ]
  for (const v of vettori) {
    vettoriRows.push([
      labelOf(VETTORI, v.vettore),
      Number(v.valore) || 0,
      v.um || '',
      Number(v.fattoreTep) || 0,
      Number(vettoreTep(v).toFixed(3)),
      Number(v.prezzoUnitario) || 0,
      Math.round(vettoreCosto(v)),
    ])
  }

  /* --- Foglio Bollette --- */
  const bolletteRows = [
    [
      'Anno',
      'Mese',
      'Attiva TOT (kWh)',
      'F1',
      'F2',
      'F3',
      'Reattiva (kvarh)',
      'Potenza max (kW)',
      'Costo netto (€)',
      'Costo IVA incl. (€)',
      '€/kWh',
      'POD',
    ],
  ]
  for (const b of bollette) {
    bolletteRows.push([
      b.anno || '',
      labelOf(MESI, Number(b.mese)),
      Number(b.attivaTot) || 0,
      Number(b.attivaF1) || 0,
      Number(b.attivaF2) || 0,
      Number(b.attivaF3) || 0,
      Number(b.reattivaTot) || 0,
      Number(b.potenzaMax) || 0,
      Number(b.costoNetto) || 0,
      Number(b.costoIvato) || 0,
      Number(euroPerKwh(b).toFixed(4)),
      b.pod || '',
    ])
  }

  const wb = XLSX.utils.book_new()
  const add = (rows, name, cols) => {
    const ws = XLSX.utils.aoa_to_sheet(rows)
    if (cols) ws['!cols'] = cols
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  add(aziendaRows, 'Azienda', [{ wch: 38 }, { wch: 40 }])
  add(utenzeRows, 'Utenze', [
    { wch: 26 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 16 }, { wch: 9 }, { wch: 14 }, { wch: 11 },
    { wch: 10 }, { wch: 11 }, { wch: 18 }, { wch: 18 }, { wch: 13 },
    { wch: 20 }, { wch: 11 }, { wch: 28 },
  ])
  add(vettoriRows, 'Vettori', [
    { wch: 22 }, { wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 14 },
    { wch: 18 }, { wch: 14 },
  ])
  add(bolletteRows, 'Bollette', [
    { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 10 }, { wch: 18 },
  ])

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  triggerDownload(blob, `Diagnosi_${sanitizeFilename(azienda.ragioneSociale)}.xlsx`)
}

// Genera lo .zip con le foto rinominate [Denominazione]_[targa|contesto]_[n].jpg
export async function exportPhotosZip(azienda) {
  const { default: JSZip } = await import('jszip')
  const utenze = await getUtenze(azienda.id)
  const zip = new JSZip()
  let total = 0

  for (const u of utenze) {
    const photos = await getPhotos(u.id)
    const counters = { targa: 0, contesto: 0 }
    for (const p of photos) {
      const tipo = p.tipo === 'targa' ? 'targa' : 'contesto'
      counters[tipo] += 1
      const filename = `${sanitizeFilename(u.denominazione)}_${tipo}_${counters[tipo]}.jpg`
      zip.file(filename, p.blob)
      total += 1
    }
  }

  if (total === 0) return { count: 0 }

  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, `Foto_${sanitizeFilename(azienda.ragioneSociale)}.zip`)
  return { count: total }
}
