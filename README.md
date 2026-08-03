# Atlas — Rilievo Diagnosi Energetica

Web-app **single-page** per la raccolta dati durante i sopralluoghi di
**diagnosi energetica** (D.Lgs 102/2014 · UNI CEI EN 16247), pensata per
l'uso da **smartphone in campo**.

Tutto è **client-side**: nessun backend. I dati e le foto sono salvati
localmente in **IndexedDB** e l'applicazione funziona **offline** dopo il
primo caricamento (PWA con service worker).

## Stack

- **React + Vite**
- **Tailwind CSS**
- **IndexedDB** (via [`idb`](https://github.com/jakearchibald/idb))
- **SheetJS/xlsx** per l'export Excel
- **JSZip** per l'archivio delle foto
- **vite-plugin-pwa** per il funzionamento offline

## Avvio

```bash
npm install
npm run dev
```

Build di produzione: `npm run build && npm run preview`.

## Modello dati

Rispecchia il modello di diagnosi energetica (Info Azienda, Utenze
Monitorate, Consumi per vettore, Bollette):

- **Azienda / Sito** (livello principale): ragione sociale, indirizzo,
  P.IVA, codice ATECO, settore, anno di riferimento, superficie, prezzi dei
  vettori energetici (€/kWh, €/Smc, €/litro), note.
  - **Apparecchio** (child): denominazione, area (attività
    principali / servizi ausiliari / servizi generali), categoria, tipologia
    (elettrica/termica), marca, modello, **potenza nominale kW**, quantità,
    **fattore di carico**, **rendimento**, ore/giorno, giorni/anno, **tipo di
    misura** (continuo/spot/calcolo), ubicazione, stato, note.
    - **Foto** (child): blob immagine, tipo (targa dati / contesto),
      timestamp.
  - **Automezzo** (child): identificativo/targa, tipo mezzo (pala,
    escavatore, autocarro, dumper, muletto, macchina operatrice…),
    alimentazione (gasolio/benzina/GPL/metano/elettrico), consumo annuo,
    km/anno, fattore di conversione in **tep**, prezzo unitario.
  - **Vettore / Consumo** (child): vettore energetico, valore, u.m., fattore
    di conversione in **tep**, prezzo unitario. Consumo in tep e costo €
    calcolati automaticamente.
  - **Bolletta mensile** (child): anno, mese, energia attiva TOT/F1/F2/F3,
    energia reattiva, potenza max, costo netto/IVA, POD; €/kWh medio
    calcolato.

## Funzionalità

1. **Elenco siti** in home con card (ragione sociale, indirizzo, ATECO,
   n° utenze, consumo elettrico stimato e tep totale) + creazione / modifica /
   eliminazione.
2. **Dettaglio azienda** a schede: **Anagrafica**, **Apparecchi**,
   **Automezzi**, **Consumi** (vettori), **Bollette**. Riepilogo in testa con
   n° apparecchi, consumo elettrico stimato e tep totali.
3. **Apparecchi**: tabella ordinabile per consumo stimato, con totale
   e percentuale di ciascun apparecchio. Consumo annuo calcolato:
   `kWh/anno = potenza × quantità × fattore di carico × ore/giorno ×
   giorni/anno`.
4. **Automezzi aziendali**: mezzi a carburante/elettrici con consumo annuo,
   conversione in **tep** e costo.
5. **Form apparecchio** con sezione foto: `capture="environment"` per la
   fotocamera, upload multiplo, anteprime a griglia, eliminazione singola.
   Immagini **compresse lato client** (max 1600px, JPEG q=0.8).
6. **Vettori energetici**: consumi annui per vettore con **conversione
   automatica in tep** e valorizzazione economica.
7. **Bollette elettriche mensili** con dettaglio fasce F1/F2/F3, reattiva,
   costi e €/kWh medio.
8. **Export per azienda**: file `.xlsx` con fogli *Azienda*, *Apparecchi*,
   *Automezzi*, *Vettori*, *Bollette* + archivio `.zip` con le foto rinominate
   `[Denominazione]_[targa|contesto]_[n].jpg`.
9. **Backup**: export/import dell'intero database in **JSON** (foto in
   base64), in modalità *unisci* o *sostituisci*.
10. **Validazioni** (potenza > 0, quantità ≥ 1, fattore di carico e rendimento
    0–1, ore/giorno ≤ 24, giorni/anno ≤ 365) e avviso **non bloccante** se
    un apparecchio è privo della foto della targa dati.

## Build artefatto (single-file)

`npm run build:artifact` produce `dist-artifact/atlas-app.html`, una singola
pagina autonoma (CSS/JS inline, senza service worker, con fallback storage in
memoria) pubblicabile come Artifact.

## Note d'uso

- **Salvataggio automatico** a ogni modifica; stato ("Salvo…"/"Salvato")
  visibile nell'intestazione.
- Per installare l'app sul telefono: "Aggiungi a schermata Home".
- I dati risiedono solo sul dispositivo: usare il **backup** per non
  perderli.
