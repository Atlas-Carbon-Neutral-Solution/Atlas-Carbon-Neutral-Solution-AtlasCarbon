-- Schema Supabase per la sincronizzazione di Atlas — Rilievo Diagnosi Energetica.
-- Eseguire una volta nel SQL Editor del progetto Supabase.
--
-- Modello: un'unica tabella "records". Ogni riga è un record dell'app
-- (azienda, utenza/apparecchio, automezzo, vettore, bolletta, foto) salvato
-- come JSONB, con id (uuid), tipo (kind), flag di eliminazione e timestamp
-- per la sincronizzazione last-write-wins.

create table if not exists public.records (
  id uuid primary key,
  kind text not null,
  data jsonb not null default '{}',
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists records_updated_at_idx
  on public.records (updated_at);

-- Row Level Security: accesso ai soli utenti autenticati (dati condivisi).
alter table public.records enable row level security;

create policy "records_select" on public.records
  for select to authenticated using (true);

create policy "records_insert" on public.records
  for insert to authenticated with check (true);

create policy "records_update" on public.records
  for update to authenticated using (true) with check (true);

create policy "records_delete" on public.records
  for delete to authenticated using (true);

-- Nota: gli account dei tecnici si creano da Authentication > Users nel
-- pannello Supabase, oppure via registrazione dall'app (se le iscrizioni
-- email sono abilitate nel progetto).
