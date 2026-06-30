-- BiMO - Migración inicial
-- Ejecutar en Supabase SQL Editor

create table if not exists medications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  dosage text,
  frequency text,
  times jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid default gen_random_uuid() primary key,
  doctor_name text not null,
  specialty text,
  date timestamptz not null,
  location text,
  notes text,
  source text default 'manual',
  created_at timestamptz default now()
);

create table if not exists chat_history (
  id uuid default gen_random_uuid() primary key,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Habilitar acceso anónimo (sin auth por ahora)
grant select, insert, update, delete on public.medications to anon;
grant select, insert, update, delete on public.appointments to anon;
grant select, insert, update, delete on public.chat_history to anon;
