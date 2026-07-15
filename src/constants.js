// Opzioni per i menu a tendina e relative etichette in italiano.

export const DESTINAZIONI = [
  { value: 'uffici', label: 'Uffici' },
  { value: 'industriale', label: 'Industriale' },
  { value: 'commerciale', label: 'Commerciale' },
  { value: 'residenziale', label: 'Residenziale' },
  { value: 'pubblico', label: 'Pubblico' },
  { value: 'altro', label: 'Altro' },
]

export const CATEGORIE = [
  { value: 'illuminazione', label: 'Illuminazione' },
  { value: 'hvac', label: 'HVAC/Climatizzazione' },
  { value: 'motori', label: 'Motori/Pompe' },
  { value: 'refrigerazione', label: 'Refrigerazione' },
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

export function labelOf(options, value) {
  const found = options.find((o) => o.value === value)
  return found ? found.label : ''
}

export function emptyBuilding(id) {
  return {
    id,
    nome: '',
    indirizzo: '',
    destinazione: 'uffici',
    annoCostruzione: '',
    superficie: '',
    volume: '',
    occupanti: '',
    oreOccupazione: '',
    pod: '',
    pdr: '',
    potenzaImpegnata: '',
    note: '',
  }
}

export function emptyAppliance(id, edificioId) {
  return {
    id,
    edificioId,
    nome: '',
    categoria: 'illuminazione',
    marca: '',
    modello: '',
    potenza: '',
    quantita: '1',
    orePerGiorno: '',
    giorniPerAnno: '',
    ubicazione: '',
    stato: 'buono',
    note: '',
  }
}

// Badge di colore per lo stato dell'apparecchio.
export const STATO_BADGE = {
  buono: 'bg-atlas-light/30 text-atlas-dark',
  obsoleto: 'bg-yellow-100 text-yellow-800',
  sostituire: 'bg-red-100 text-red-800',
}
