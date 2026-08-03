// Opzioni per i menu a tendina e relative etichette in italiano.
// Modello dati: Azienda/Sito -> (Utenze monitorate, Vettori/Consumi, Bollette).

export const AREE = [
  { value: 'principali', label: 'Attività principali' },
  { value: 'ausiliari', label: 'Servizi ausiliari' },
  { value: 'generali', label: 'Servizi generali' },
]

export const TIPOLOGIE = [
  { value: 'elettrica', label: 'Elettrica' },
  { value: 'termica', label: 'Termica' },
]

export const TIPI_MISURA = [
  { value: 'continuo', label: 'Continuo (misurato)' },
  { value: 'spot', label: 'Spot (misura istantanea)' },
  { value: 'calcolo', label: 'Calcolo (stima)' },
]

export const CATEGORIE = [
  { value: 'illuminazione', label: 'Illuminazione' },
  { value: 'hvac', label: 'HVAC/Climatizzazione' },
  { value: 'motori', label: 'Motori/Pompe' },
  { value: 'refrigerazione', label: 'Refrigerazione' },
  { value: 'aria_compressa', label: 'Aria compressa' },
  { value: 'produzione', label: 'Macchina di produzione' },
  { value: 'ict', label: 'ICT' },
  { value: 'acs', label: 'Produzione ACS' },
  { value: 'altro', label: 'Altro' },
]

export const STATI = [
  { value: 'buono', label: 'Buono' },
  { value: 'obsoleto', label: 'Obsoleto' },
  { value: 'sostituire', label: 'Da sostituire' },
]

export const TIPI_FOTO = [
  { value: 'targa', label: 'Targa dati' },
  { value: 'contesto', label: 'Contesto' },
]

// Mesi (per le bollette).
export const MESI = [
  { value: 1, label: 'Gennaio' },
  { value: 2, label: 'Febbraio' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Aprile' },
  { value: 5, label: 'Maggio' },
  { value: 6, label: 'Giugno' },
  { value: 7, label: 'Luglio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Settembre' },
  { value: 10, label: 'Ottobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Dicembre' },
]

// Vettori energetici standard con fattore di conversione in tep
// (rif. tabella "Consumi effettivi" del Modello di Diagnosi Energetica,
// FIRE/ENEA). Il fattore è modificabile a livello di singolo record.
// tep = valore [u.m.] × fattoreTep
export const VETTORI = [
  { value: 'ee', label: 'Energia elettrica', um: 'kWh', fattoreTep: 0.000187 },
  { value: 'gas', label: 'Gas naturale', um: 'Smc', fattoreTep: 0.000825 },
  { value: 'calore', label: 'Calore (teleriscald.)', um: 'kWht', fattoreTep: 0.000086 },
  { value: 'gasolio', label: 'Gasolio', um: 'litri', fattoreTep: 0.00085 },
  { value: 'gpl', label: 'GPL', um: 'kg', fattoreTep: 0.0011 },
  { value: 'olio', label: 'Olio combustibile', um: 'kg', fattoreTep: 0.00098 },
  { value: 'biomassa', label: 'Biomassa', um: 'ton', fattoreTep: 0.4 },
  { value: 'coke', label: 'Coke di petrolio', um: 'kg', fattoreTep: 0.00083 },
  { value: 'altro', label: 'Altro', um: '', fattoreTep: 0 },
]

export function labelOf(options, value) {
  const found = options.find((o) => String(o.value) === String(value))
  return found ? found.label : ''
}

export function vettoreDef(code) {
  return VETTORI.find((v) => v.value === code) || VETTORI[VETTORI.length - 1]
}

/* ------------------------------------------------------------------ */
/* Record vuoti                                                       */
/* ------------------------------------------------------------------ */

export function emptyAzienda(id) {
  return {
    id,
    ragioneSociale: '',
    indirizzo: '',
    piva: '',
    ateco: '',
    settore: '',
    annoRiferimento: String(new Date().getFullYear() - 1),
    superficie: '',
    // prezzi dei vettori energetici (per la valorizzazione economica)
    prezzoEE: '',
    prezzoGas: '',
    prezzoGasolio: '',
    note: '',
  }
}

export function emptyUtenza(id, aziendaId) {
  return {
    id,
    aziendaId,
    denominazione: '',
    area: 'principali',
    categoria: 'motori',
    tipologia: 'elettrica',
    marca: '',
    modello: '',
    potenza: '',
    quantita: '1',
    fattoreCarico: '1',
    rendimento: '1',
    orePerGiorno: '',
    giorniPerAnno: '',
    tipoMisura: 'calcolo',
    ubicazione: '',
    stato: 'buono',
    note: '',
  }
}

export function emptyVettore(id, aziendaId) {
  const def = VETTORI[0]
  return {
    id,
    aziendaId,
    vettore: def.value,
    um: def.um,
    valore: '',
    fattoreTep: String(def.fattoreTep),
    prezzoUnitario: '',
  }
}

export function emptyBolletta(id, aziendaId, anno) {
  return {
    id,
    aziendaId,
    anno: String(anno || new Date().getFullYear() - 1),
    mese: 1,
    attivaTot: '',
    attivaF1: '',
    attivaF2: '',
    attivaF3: '',
    reattivaTot: '',
    potenzaMax: '',
    costoNetto: '',
    costoIvato: '',
    pod: '',
  }
}

// Badge di colore per lo stato dell'utenza.
export const STATO_BADGE = {
  buono: 'bg-atlas-light/30 text-atlas-dark',
  obsoleto: 'bg-yellow-100 text-yellow-800',
  sostituire: 'bg-red-100 text-red-800',
}
