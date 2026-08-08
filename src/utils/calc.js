import { vettoreDef, alimentazioneDef } from '../constants'

// Consumo elettrico/termico stimato annuo di un'utenza monitorata.
// kWh/anno = potenza kW × quantità × fattore di carico × ore/giorno × giorni/anno
export function consumoUtenza(u) {
  if (!u) return 0
  const potenza = Number(u.potenza) || 0
  const quantita = Number(u.quantita) || 0
  const fc = u.fattoreCarico === '' || u.fattoreCarico == null
    ? 1
    : Number(u.fattoreCarico)
  const ore = Number(u.orePerGiorno) || 0
  const giorni = Number(u.giorniPerAnno) || 0
  const kwh = potenza * quantita * (Number.isFinite(fc) ? fc : 1) * ore * giorni
  return Number.isFinite(kwh) ? kwh : 0
}

export function consumoTotaleUtenze(utenze) {
  return (utenze || []).reduce((s, u) => s + consumoUtenza(u), 0)
}

export function percentualeSulTotale(u, totale) {
  const c = consumoUtenza(u)
  if (!totale) return 0
  return (c / totale) * 100
}

// tep di un vettore = valore × fattore di conversione
export function vettoreTep(v) {
  if (!v) return 0
  const valore = Number(v.valore) || 0
  const f = Number(v.fattoreTep)
  const fattore = Number.isFinite(f) ? f : vettoreDef(v.vettore).fattoreTep
  return valore * fattore
}

export function vettoreCosto(v) {
  if (!v) return 0
  const valore = Number(v.valore) || 0
  const prezzo = Number(v.prezzoUnitario) || 0
  return valore * prezzo
}

export function tepTotale(vettori) {
  return (vettori || []).reduce((s, v) => s + vettoreTep(v), 0)
}

export function costoTotaleVettori(vettori) {
  return (vettori || []).reduce((s, v) => s + vettoreCosto(v), 0)
}

// tep di un automezzo = consumo × fattore di conversione
export function automezzoTep(m) {
  if (!m) return 0
  const consumo = Number(m.consumo) || 0
  const f = Number(m.fattoreTep)
  const fattore = Number.isFinite(f) ? f : alimentazioneDef(m.alimentazione).fattoreTep
  return consumo * fattore
}

export function automezzoCosto(m) {
  if (!m) return 0
  const consumo = Number(m.consumo) || 0
  const prezzo = Number(m.prezzoUnitario) || 0
  return consumo * prezzo
}

export function tepTotaleAutomezzi(automezzi) {
  return (automezzi || []).reduce((s, m) => s + automezzoTep(m), 0)
}

export function costoTotaleAutomezzi(automezzi) {
  return (automezzi || []).reduce((s, m) => s + automezzoCosto(m), 0)
}

// €/kWh medio di una bolletta (costo netto / energia attiva totale)
export function euroPerKwh(b) {
  const kwh = Number(b.attivaTot) || 0
  const costo = Number(b.costoNetto) || 0
  if (!kwh) return 0
  return costo / kwh
}

/* ------------------------------------------------------------------ */
/* Formattazione (stile italiano)                                     */
/* ------------------------------------------------------------------ */

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

export function formatTep(value) {
  return formatNumber(value, 2) + ' tep'
}

export function formatEuro(value) {
  const n = Number(value) || 0
  return n.toLocaleString('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
}
