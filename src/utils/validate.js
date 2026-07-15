// Validazioni per gli apparecchi.
// Ritorna un oggetto { campo: messaggio } con gli errori bloccanti.
export function validateAppliance(app) {
  const errors = {}

  if (!app.nome || !app.nome.trim()) {
    errors.nome = 'Inserire un identificativo.'
  }

  const potenza = Number(app.potenza)
  if (!(potenza > 0)) {
    errors.potenza = 'La potenza deve essere maggiore di 0.'
  }

  const quantita = Number(app.quantita)
  if (!Number.isFinite(quantita) || quantita < 1) {
    errors.quantita = 'La quantità deve essere almeno 1.'
  }

  const ore = Number(app.orePerGiorno)
  if (!Number.isFinite(ore) || ore < 0 || ore > 24) {
    errors.orePerGiorno = 'Le ore/giorno devono essere tra 0 e 24.'
  }

  const giorni = Number(app.giorniPerAnno)
  if (!Number.isFinite(giorni) || giorni < 0 || giorni > 365) {
    errors.giorniPerAnno = 'I giorni/anno devono essere tra 0 e 365.'
  }

  return errors
}

export function hasErrors(errors) {
  return Object.keys(errors || {}).length > 0
}
