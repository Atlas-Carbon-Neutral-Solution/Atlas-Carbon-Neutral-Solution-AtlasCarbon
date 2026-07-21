// Validazioni per le utenze monitorate.
// Ritorna un oggetto { campo: messaggio } con gli errori.
export function validateUtenza(u) {
  const errors = {}

  if (!u.denominazione || !u.denominazione.trim()) {
    errors.denominazione = 'Inserire una denominazione.'
  }

  if (!(Number(u.potenza) > 0)) {
    errors.potenza = 'La potenza deve essere maggiore di 0.'
  }

  const quantita = Number(u.quantita)
  if (!Number.isFinite(quantita) || quantita < 1) {
    errors.quantita = 'La quantità deve essere almeno 1.'
  }

  if (u.fattoreCarico !== '' && u.fattoreCarico != null) {
    const fc = Number(u.fattoreCarico)
    if (!Number.isFinite(fc) || fc < 0 || fc > 1) {
      errors.fattoreCarico = 'Il fattore di carico deve essere tra 0 e 1.'
    }
  }

  if (u.rendimento !== '' && u.rendimento != null) {
    const r = Number(u.rendimento)
    if (!Number.isFinite(r) || r <= 0 || r > 1) {
      errors.rendimento = 'Il rendimento deve essere tra 0 e 1.'
    }
  }

  const ore = Number(u.orePerGiorno)
  if (!Number.isFinite(ore) || ore < 0 || ore > 24) {
    errors.orePerGiorno = 'Le ore/giorno devono essere tra 0 e 24.'
  }

  const giorni = Number(u.giorniPerAnno)
  if (!Number.isFinite(giorni) || giorni < 0 || giorni > 365) {
    errors.giorniPerAnno = 'I giorni/anno devono essere tra 0 e 365.'
  }

  return errors
}

// Validazioni per le bollette mensili.
export function validateBolletta(b) {
  const errors = {}
  const anno = Number(b.anno)
  if (!Number.isFinite(anno) || anno < 1990 || anno > 2100) {
    errors.anno = 'Anno non valido.'
  }
  const mese = Number(b.mese)
  if (!Number.isFinite(mese) || mese < 1 || mese > 12) {
    errors.mese = 'Mese non valido.'
  }
  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors || {}).length > 0
}
