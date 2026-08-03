// Estrazione dati bolletta elettrica da PDF, interamente lato client.
// - Il testo viene estratto con PDF.js (nessun invio a server, funziona offline).
// - I campi vengono riconosciuti con euristiche (best-effort): i layout delle
//   bollette variano molto, perciò i valori vanno sempre rivisti dall'utente.
// Funziona sui PDF "digitali" (testo selezionabile); i PDF scansionati/foto
// non contengono testo e non sono supportati (servirebbe l'OCR).

let pdfjsPromise = null
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist')
      // Worker inline: self-contained, offline e compatibile col build single-file.
      const Worker = (
        await import('pdfjs-dist/build/pdf.worker.min.mjs?worker&inline')
      ).default
      pdfjs.GlobalWorkerOptions.workerPort = new Worker()
      return pdfjs
    })()
  }
  return pdfjsPromise
}

export async function extractPdfText(arrayBuffer) {
  const pdfjs = await loadPdfjs()
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    text += content.items.map((i) => i.str).join(' ') + '\n'
  }
  try {
    await doc.destroy()
  } catch {
    /* ignore */
  }
  return text
}

// Converte un numero in formato italiano ("1.234,56") in Number.
function itNum(s) {
  if (s == null) return null
  const cleaned = String(s).trim().replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

const MESI_NOMI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

function firstMatch(text, re) {
  const m = text.match(re)
  return m ? m[1] : null
}

// Analizza il testo estratto e ritorna { fields, found } dove found elenca
// i campi effettivamente riconosciuti.
export function parseBollettaText(rawText) {
  const text = (rawText || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ')
  const low = text.toLowerCase()
  const fields = {}
  const found = {}
  const set = (k, v) => {
    if (v != null && v !== '' && !Number.isNaN(v)) {
      fields[k] = v
      found[k] = true
    }
  }

  // POD (formato italiano: IT + 3 cifre + E + 8/9 cifre)
  set('pod', firstMatch(text, /\b(IT\d{3}E\d{8,9}[A-Z0-9]?)\b/i))

  // Potenza impegnata/disponibile (kW)
  const potenza = firstMatch(
    low,
    /potenza\s*(?:impegnata|disponibile|contrattual\w*|prelevata)?[^0-9]{0,20}([\d.,]+)\s*kw/,
  )
  set('potenzaMax', itNum(potenza))

  // Energia attiva per fascia (kWh)
  set('attivaF1', itNum(firstMatch(low, /\bf1\b[^0-9]{0,25}([\d.,]+)\s*kwh/)))
  set('attivaF2', itNum(firstMatch(low, /\bf2\b[^0-9]{0,25}([\d.,]+)\s*kwh/)))
  set('attivaF3', itNum(firstMatch(low, /\bf3\b[^0-9]{0,25}([\d.,]+)\s*kwh/)))

  // Energia attiva totale (se assente, somma delle fasce)
  let tot = itNum(
    firstMatch(low, /energia attiva[^0-9]{0,40}([\d.,]+)\s*kwh/) ||
      firstMatch(low, /totale (?:energia|consumi|prelievi)[^0-9]{0,25}([\d.,]+)\s*kwh/),
  )
  if (tot == null) {
    const s =
      (fields.attivaF1 || 0) + (fields.attivaF2 || 0) + (fields.attivaF3 || 0)
    if (s > 0) tot = s
  }
  set('attivaTot', tot)

  // Energia reattiva (kvarh)
  set(
    'reattivaTot',
    itNum(firstMatch(low, /energia reattiva[^0-9]{0,40}([\d.,]+)\s*kvar/)),
  )

  // Importi (€)
  set(
    'costoIvato',
    itNum(
      firstMatch(
        low,
        /totale (?:bolletta|fattura|da pagare|a pagare|documento)[^0-9€]{0,20}€?\s*([\d.,]+)/,
      ),
    ),
  )
  set(
    'costoNetto',
    itNum(
      firstMatch(low, /totale imponibile[^0-9€]{0,20}€?\s*([\d.,]+)/) ||
        firstMatch(low, /imponibile[^0-9€]{0,20}€?\s*([\d.,]+)/),
    ),
  )

  // Periodo → mese/anno (usa la data finale del periodo "dal … al gg/mm/aaaa")
  const periodo = text.match(
    /dal\s+\d{1,2}\/\d{1,2}\/\d{2,4}\s+al\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i,
  )
  if (periodo) {
    let anno = periodo[3]
    if (anno.length === 2) anno = '20' + anno
    set('mese', Number(periodo[2]))
    set('anno', anno)
  } else {
    // Fallback: nome mese + anno
    const idx = MESI_NOMI.findIndex((m) => low.includes(m))
    if (idx >= 0) set('mese', idx + 1)
    const anno = firstMatch(text, /\b(20\d{2})\b/)
    if (anno) set('anno', anno)
  }

  return { fields, found }
}

// Pipeline completa: File PDF -> { fields, found, textLength }
export async function estraiBollettaDaPdf(file) {
  const buf = await file.arrayBuffer()
  const text = await extractPdfText(buf)
  const { fields, found } = parseBollettaText(text)
  return { fields, found, textLength: text.trim().length }
}
