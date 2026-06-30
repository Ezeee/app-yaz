-- BiMO - Migración 003: Tabla solicitudes
-- Ejecutar en Supabase SQL Editor

create table if not exists solicitudes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  doctor_name text,
  specialty text,
  institution text,
  status text default 'pendiente',
  notes text,
  created_at timestamptz default now()
);

grant select, insert, update, delete on public.solicitudes to anon;
