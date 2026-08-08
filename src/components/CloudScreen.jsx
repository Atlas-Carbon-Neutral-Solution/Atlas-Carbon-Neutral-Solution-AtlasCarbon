import { useState } from 'react'
import Header from './Header'
import { TextField } from './Field'
import { useCloud } from '../cloud/CloudProvider'
import { testConnection } from '../sync/supabaseSync'

const SCHEMA_SQL = `-- Esegui una volta nel SQL Editor di Supabase
create table if not exists public.records (
  id uuid primary key,
  kind text not null,
  data jsonb not null default '{}',
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists records_updated_at_idx
  on public.records (updated_at);

alter table public.records enable row level security;

create policy "records_select" on public.records
  for select to authenticated using (true);
create policy "records_insert" on public.records
  for insert to authenticated with check (true);
create policy "records_update" on public.records
  for update to authenticated using (true) with check (true);
create policy "records_delete" on public.records
  for delete to authenticated using (true);`

function Row({ children }) {
  return <div className="mt-3">{children}</div>
}

export default function CloudScreen({ onBack }) {
  const cloud = useCloud()
  const [url, setUrl] = useState(cloud.config?.url || '')
  const [anonKey, setAnonKey] = useState(cloud.config?.anonKey || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  function flash(text, error = false) {
    setMsg({ text, error })
    setTimeout(() => setMsg(null), 4000)
  }

  async function run(fn, okText) {
    setBusy(true)
    try {
      await fn()
      if (okText) flash(okText)
    } catch (e) {
      flash(e?.message || String(e), true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-atlas-bg">
      <Header saveState="idle" onBack={onBack} subtitle="Sincronizzazione cloud" />
      <main className="mx-auto max-w-3xl px-3 py-4">
        {msg ? (
          <div
            className={`mb-3 rounded-lg px-3 py-2 text-sm font-semibold ${
              msg.error ? 'bg-red-50 text-red-700' : 'bg-atlas-light/25 text-atlas-dark'
            }`}
          >
            {msg.text}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-bold text-atlas-dark">
            Database cloud (Supabase)
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            L'app resta utilizzabile offline: i dati sono salvati sul dispositivo
            e sincronizzati con il cloud quando sei connesso e autenticato.
          </p>

          {/* Configurazione connessione */}
          <Row>
            <TextField
              label="URL progetto Supabase"
              value={url}
              onChange={setUrl}
              placeholder="https://xxxx.supabase.co"
            />
          </Row>
          <Row>
            <TextField
              label="Anon key (public)"
              value={anonKey}
              onChange={setAnonKey}
              placeholder="eyJhbGciOi..."
            />
          </Row>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={busy || !url || !anonKey}
              onClick={() =>
                run(async () => {
                  cloud.saveConfig(url, anonKey)
                }, 'Configurazione salvata.')
              }
            >
              Salva connessione
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || !cloud.configured}
              onClick={() => run(testConnection, 'Connessione riuscita.')}
            >
              Verifica connessione
            </button>
          </div>

          <details className="mt-3 rounded-lg bg-atlas-bg p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-atlas-dark">
              Schema SQL da creare in Supabase (una volta)
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] leading-snug text-gray-700">
              {SCHEMA_SQL}
            </pre>
          </details>
        </section>

        {/* Autenticazione / sync */}
        {cloud.configured ? (
          <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            {cloud.user ? (
              <>
                <h2 className="text-base font-bold text-atlas-dark">
                  Accesso effettuato
                </h2>
                <p className="mt-1 text-sm text-gray-600">{cloud.user.email}</p>

                <div className="mt-3">
                  <button
                    type="button"
                    className="btn-primary w-full"
                    disabled={cloud.syncing}
                    onClick={() => run(cloud.sync)}
                  >
                    {cloud.syncing ? 'Sincronizzo…' : 'Sincronizza ora'}
                  </button>
                </div>

                {cloud.lastSync ? (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    {cloud.lastSync.error
                      ? `Ultima sincronizzazione fallita: ${cloud.lastSync.error}`
                      : `Ultima sincronizzazione: ${cloud.lastSync.pulled} scaricati, ${cloud.lastSync.pushed} inviati.`}
                  </p>
                ) : null}

                <button
                  type="button"
                  className="btn-secondary mt-3 w-full"
                  onClick={() => run(cloud.signOut)}
                >
                  Esci dall'account
                </button>
              </>
            ) : (
              <>
                <h2 className="text-base font-bold text-atlas-dark">
                  {mode === 'login' ? 'Accedi' : 'Crea account'}
                </h2>
                <Row>
                  <TextField
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    type="email"
                  />
                </Row>
                <Row>
                  <label className="block">
                    <span className="field-label">Password</span>
                    <input
                      type="password"
                      className="field-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                </Row>
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn-primary w-full"
                    disabled={busy || !email || !password}
                    onClick={() =>
                      run(
                        () =>
                          mode === 'login'
                            ? cloud.signIn(email, password)
                            : cloud.signUp(email, password),
                        mode === 'login'
                          ? 'Accesso in corso…'
                          : 'Registrazione inviata: controlla l’email per confermare.',
                      )
                    }
                  >
                    {mode === 'login' ? 'Accedi' : 'Registrati'}
                  </button>
                </div>
                <button
                  type="button"
                  className="mt-3 w-full text-sm font-semibold text-atlas-green"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                >
                  {mode === 'login'
                    ? 'Non hai un account? Registrati'
                    : 'Hai già un account? Accedi'}
                </button>
              </>
            )}

            <button
              type="button"
              className="btn-danger mt-4 w-full"
              onClick={() => run(cloud.disconnect, 'Cloud disconnesso.')}
            >
              Disconnetti cloud (rimuovi configurazione)
            </button>
          </section>
        ) : null}
      </main>
    </div>
  )
}
