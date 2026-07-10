-- BiMO - Arreglo RLS: Políticas completas para todas las tablas
-- Ejecutar en Supabase SQL Editor

-- ========================================
-- medications
-- ========================================
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access medications" ON medications;
CREATE POLICY "Anon full access medications" ON medications FOR ALL TO anon USING (true) WITH CHECK (true);

-- ========================================
-- appointments
-- ========================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access appointments" ON appointments;
CREATE POLICY "Anon full access appointments" ON appointments FOR ALL TO anon USING (true) WITH CHECK (true);

-- ========================================
-- chat_history
-- ========================================
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access chat_history" ON chat_history;
CREATE POLICY "Anon full access chat_history" ON chat_history FOR ALL TO anon USING (true) WITH CHECK (true);

-- ========================================
-- profile
-- ========================================
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access profile" ON profile;
CREATE POLICY "Anon full access profile" ON profile FOR ALL TO anon USING (true) WITH CHECK (true);

-- ========================================
-- solicitudes
-- ========================================
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access solicitudes" ON solicitudes;
CREATE POLICY "Anon full access solicitudes" ON solicitudes FOR ALL TO anon USING (true) WITH CHECK (true);

-- ========================================
-- periods
-- ========================================
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access periods" ON periods;
CREATE POLICY "Anon full access periods" ON periods FOR ALL TO anon USING (true) WITH CHECK (true);

-- ========================================
-- cycle_symptoms
-- ========================================
ALTER TABLE cycle_symptoms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access cycle_symptoms" ON cycle_symptoms;
CREATE POLICY "Anon full access cycle_symptoms" ON cycle_symptoms FOR ALL TO anon USING (true) WITH CHECK (true);

-- ========================================
-- documents
-- ========================================
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon full access documents" ON documents;
CREATE POLICY "Anon full access documents" ON documents FOR ALL TO anon USING (true) WITH CHECK (true);
