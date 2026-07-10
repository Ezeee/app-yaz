-- BiMO - Migración 004: Ciclo menstrual
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cycle_symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  flow_intensity text,
  symptoms jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon full access periods" ON periods FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access cycle_symptoms" ON cycle_symptoms FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT ALL ON periods TO anon;
GRANT ALL ON cycle_symptoms TO anon;

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS study_date date;
