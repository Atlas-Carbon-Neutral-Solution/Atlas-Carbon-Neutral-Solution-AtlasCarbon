import SaveIndicator from './SaveIndicator'

export default function Header({ saveState, onBack, subtitle }) {
  return (
    <header className="sticky top-0 z-20 bg-atlas-dark text-white shadow-md">
      <div
        className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Indietro"
            className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-white active:bg-white/10"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center">
            <img src="/icon.svg" alt="Atlas" className="h-8 w-8" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold leading-tight">
            Atlas — Rilievo Diagnosi Energetica
          </h1>
          {subtitle ? (
            <p className="truncate text-xs text-atlas-light">{subtitle}</p>
          ) : null}
        </div>

        <SaveIndicator state={saveState} />
      </div>
    </header>
  )
}
