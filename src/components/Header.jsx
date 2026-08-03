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
            <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20512%20512%22%20width%3D%22512%22%20height%3D%22512%22%3E%20%3Crect%20width%3D%22512%22%20height%3D%22512%22%20rx%3D%2296%22%20fill%3D%22%230F2418%22%2F%3E%20%3Cpath%20d%3D%22M256%2096%20L400%20400%20H336%20L256%20224%20L176%20400%20H112%20Z%22%20fill%3D%22%236FBF7A%22%2F%3E%20%3Crect%20x%3D%22216%22%20y%3D%22330%22%20width%3D%2280%22%20height%3D%2234%22%20fill%3D%22%233A7D44%22%2F%3E%20%3C%2Fsvg%3E" alt="Atlas" className="h-8 w-8" />
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
