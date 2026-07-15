# Atlas — Rilievo Diagnosi Energetica

Web-app **single-page** per la raccolta dati durante i sopralluoghi di
diagnosi energetica (audit **UNI CEI EN 16247**), pensata per l'uso da
**smartphone in campo**.

Tutto è **client-side**: nessun backend. I dati e le foto sono salvati
localmente in **IndexedDB** e l'applicazione funziona **offline** dopo il
primo caricamento (PWA con service worker).

## Stack

- **React + Vite**
- **Tailwind CSS**
- **IndexedDB** (via [`idb`](https://github.com/jakearchibald/idb)) per la
  persistenza locale di dati e foto
- **SheetJS/xlsx** per l'export Excel
- **JSZip** per l'archivio delle foto
- **vite-plugin-pwa** per il funzionamento offline

## Avvio

```bash
npm install
npm run dev
```

Build di produzione:

```bash
npm run build
npm run preview
```

## Funzionalità

1. **Elenco edifici** in home con creazione / modifica / eliminazione. Ogni
   card mostra nome, indirizzo, numero di apparecchi censiti e consumo
   stimato totale.
2. **Dettaglio edificio**: form anagrafica + tabella apparecchi ordinabile
   per consumo stimato. Il consumo annuo è calcolato automaticamente:
   `kWh/anno = potenza kW × quantità × ore/giorno × giorni/anno`, con totale
   di edificio e percentuale di ciascun apparecchio sul totale.
3. **Form apparecchio** con sezione foto: input `capture="environment"` per
   aprire direttamente la fotocamera, upload multiplo, anteprime a griglia ed
   eliminazione singola. Le immagini vengono **compresse lato client** (max
   1600px sul lato lungo, JPEG q=0.8) prima del salvataggio.
4. **Export per edificio**: un file `.xlsx` con due fogli — *Edificio*
   (anagrafica) e *Apparecchi* (una riga per apparecchio con consumo stimato)
   — e, in parallelo, uno `.zip` con le foto rinominate
   `[NomeApparecchio]_[targa|contesto]_[n].jpg`.
5. **Backup**: export/import dell'intero database in **JSON** (foto in
   base64) per trasferire i dati su un altro dispositivo, in modalità *unisci*
   o *sostituisci*.
6. **Validazioni**: potenza > 0, quantità ≥ 1, ore/giorno ≤ 24, giorni/anno
   ≤ 365; avviso **non bloccante** se un apparecchio è privo della foto della
   targa dati.

## Modello dati

- **Edificio** → **Apparecchio** (child) → **Foto** (child).
- Eliminando un edificio o un apparecchio, i figli e le foto associate
  vengono rimossi a cascata.

## Note d'uso

- Il **salvataggio è automatico** a ogni modifica; lo stato ("Salvo…" /
  "Salvato") è visibile nell'intestazione.
- Per installare l'app sul telefono usare "Aggiungi a schermata Home" dal
  browser.
- I dati risiedono solo sul dispositivo: usare la funzione di **backup** per
  non perderli (es. reinstallazione, cambio dispositivo).
