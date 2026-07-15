// Indicatore dello stato di salvataggio (autosave).
// state: 'idle' | 'saving' | 'saved'
export default function SaveIndicator({ state }) {
  if (!state || state === 'idle') {
    return <div className="w-16" aria-hidden="true" />
  }

  if (state === 'saving') {
    return (
      <div className="flex w-16 items-center justify-end gap-1 text-xs text-atlas-light">
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
        </svg>
        <span>Salvo…</span>
      </div>
    )
  }

  return (
    <div className="flex w-16 items-center justify-end gap-1 text-xs text-atlas-light">
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>Salvato</span>
    </div>
  )
}
