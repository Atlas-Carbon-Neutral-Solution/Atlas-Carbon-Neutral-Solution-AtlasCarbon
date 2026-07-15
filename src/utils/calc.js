// Calcolo del consumo stimato annuo di un apparecchio.
// kWh/anno = potenza kW × quantità × ore/giorno × giorni/anno
export function consumoAnnuo(app) {
  if (!app) return 0
  const potenza = Number(app.potenza) || 0
  const quantita = Number(app.quantita) || 0
  const ore = Number(app.orePerGiorno) || 0
  const giorni = Number(app.giorniPerAnno) || 0
  const kwh = potenza * quantita * ore * giorni
  return Number.isFinite(kwh) ? kwh : 0
}

// Totale di consumo per una lista di apparecchi.
export function consumoTotale(appliances) {
  return (appliances || []).reduce((sum, a) => sum + consumoAnnuo(a), 0)
}

// Percentuale di un apparecchio sul totale dell'edificio.
export function percentualeSulTotale(app, totale) {
  const c = consumoAnnuo(app)
  if (!totale) return 0
  return (c / totale) * 100
}

// Formattazione numerica in stile italiano.
export function formatNumber(value, decimals = 0) {
  const n = Number(value) || 0
  return n.toLocaleString('it-IT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatKWh(value) {
  const n = Number(value) || 0
  if (n >= 1_000_000) return formatNumber(n / 1000, 0) + ' MWh'
  return formatNumber(n, 0) + ' kWh'
}
