CREATE TABLE periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE cycle_symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  flow_intensity text,
  symptoms jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now()
);

GRANT ALL ON periods TO anon;
GRANT ALL ON cycle_symptoms TO anon;

ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS study_date date;
