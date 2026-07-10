-- BiMO - Migración 005: Documentos médicos
-- Ejecutar en Supabase SQL Editor

CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_type text NOT NULL,
  mime_type text NOT NULL,
  file_path text NOT NULL,
  solicitud_id uuid REFERENCES solicitudes(id) ON DELETE SET NULL,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anon upload" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Anon read" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'medical-documents');

CREATE POLICY "Anon delete" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'medical-documents');

GRANT ALL ON documents TO anon;
