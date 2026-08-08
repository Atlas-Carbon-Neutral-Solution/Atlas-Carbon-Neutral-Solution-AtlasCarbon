// Mostra lo stato dell'archiviazione dati, in modo onesto:
// - memory: avviso forte (i dati NON vengono salvati)
// - indexeddb: conferma che i dati sono salvati sul dispositivo
export default function StorageBanner({ status }) {
  if (!status) return null

  if (status.mode === 'memory') {
    return (
      <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
        <svg
          className="mt-0.5 h-4 w-4 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <span>
          <strong>Archiviazione non disponibile in questo ambiente.</strong> I
          dati inseriti restano solo in memoria e verranno persi al
          ricaricamento. Per salvarli in modo permanente apri l'app installata
          sul dispositivo (“Aggiungi a schermata Home”) o la versione locale, ed
          esporta un backup.
        </span>
      </div>
    )
  }

  // mode === 'indexeddb'
  return (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-atlas-light/50 bg-atlas-light/15 px-3 py-2 text-sm text-atlas-dark">
      <svg
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-atlas-green"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>
        I dati sono salvati su questo dispositivo
        {status.persisted ? ' (archiviazione permanente attiva)' : ''}.
        {status.persisted
          ? ''
          : ' Suggerimento: installa l’app (“Aggiungi a schermata Home”) per renderla permanente.'}{' '}
        Usa il backup per trasferirli su un altro dispositivo.
      </span>
    </div>
  )
}
