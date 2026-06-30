-- BiMO - Migración 002: Tabla profile
-- Ejecutar en Supabase SQL Editor

create table if not exists profile (
  id uuid default gen_random_uuid() primary key,
  name text,
  age text,
  gender text,
  medical_conditions text,
  allergies text,
  doctors jsonb default '[]'::jsonb,
  restrictions text,
  notes text,
  created_at timestamptz default now()
);

grant select, insert, update, delete on public.profile to anon;
