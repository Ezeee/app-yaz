import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { localDb } from "../../lib/localDb";
import type { Profile, Doctor } from "../../types";
import { Save, Plus, Trash2, User } from "lucide-react";

export default function ProfileTab() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from("profile").select("*").limit(1);
      if (data && data.length > 0) {
        setProfile(data[0]);
      }
    } else {
      const data = await localDb.getProfile();
      if (data) setProfile(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (isSupabaseConfigured && supabase) {
      if (profile.id) {
        await supabase.from("profile").update(profile).eq("id", profile.id);
      } else {
        const { data } = await supabase.from("profile").insert(profile).select();
        if (data && data.length > 0) setProfile(data[0]);
      }
    } else {
      await localDb.saveProfile(profile);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addDoctor = () => {
    if (!newDoctorName.trim()) return;
    const doctors = profile.doctors || [];
    setProfile({
      ...profile,
      doctors: [...doctors, { name: newDoctorName.trim(), specialty: newDoctorSpecialty.trim() }],
    });
    setNewDoctorName("");
    setNewDoctorSpecialty("");
  };

  const removeDoctor = (index: number) => {
    const doctors = profile.doctors || [];
    setProfile({
      ...profile,
      doctors: doctors.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-text-muted">Cargando...</div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Mi Perfil</h2>
        <button
          onClick={handleSave}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-vibrant transition-colors flex items-center gap-2"
        >
          <Save size={16} />
          Guardar
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-success text-center">
          Perfil guardado correctamente!
        </div>
      )}

      {/* Datos personales */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-text text-sm flex items-center gap-2">
          <User size={16} className="text-primary" /> Datos personales
        </h3>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1">Nombre</label>
          <input
            type="text"
            value={profile.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nombre de la persona"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Edad</label>
            <input
              type="text"
              value={profile.age || ""}
              onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="28"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Sexo</label>
            <select
              value={profile.gender || ""}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="">Seleccionar</option>
              <option value="Mujer">Mujer</option>
              <option value="Hombre">Hombre</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>
      </section>

      {/* Condiciones médicas */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-text text-sm">Condiciones médicas</h3>
        <textarea
          value={profile.medical_conditions || ""}
          onChange={(e) => setProfile({ ...profile, medical_conditions: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Ej: Hipertensión, migrañas crónicas, asma..."
        />
      </section>

      {/* Alergias */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-text text-sm">Alergias</h3>
        <textarea
          value={profile.allergies || ""}
          onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Ej: Penicilina, ibuprofeno, mariscos..."
        />
      </section>

      {/* Médicos de cabecera */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-text text-sm">Médicos de cabecera</h3>

        {profile.doctors && profile.doctors.length > 0 && (
          <div className="space-y-2">
            {profile.doctors.map((doc: Doctor, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-border">
                <div>
                  <p className="text-sm font-medium text-text">{doc.name}</p>
                  {doc.specialty && <p className="text-xs text-primary">{doc.specialty}</p>}
                </div>
                <button onClick={() => removeDoctor(i)} className="text-text-muted hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newDoctorName}
            onChange={(e) => setNewDoctorName(e.target.value)}
            placeholder="Nombre del médico"
            className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            value={newDoctorSpecialty}
            onChange={(e) => setNewDoctorSpecialty(e.target.value)}
            placeholder="Especialidad"
            className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={addDoctor}
            className="bg-primary text-white p-2 rounded-xl hover:bg-primary-vibrant transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </section>

      {/* Restricciones para la IA */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-text text-sm">Restricciones para BiMO</h3>
        <p className="text-[10px] text-text-muted">Reglas especiales que la IA debe seguir al responder.</p>
        <textarea
          value={profile.restrictions || ""}
          onChange={(e) => setProfile({ ...profile, restrictions: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Ej: No recomendar remedios naturales. Siempre sugerir consultar al médico. No dar dosis de medicamentos."
        />
      </section>

      {/* Notas adicionales */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="font-bold text-text text-sm">Notas adicionales</h3>
        <textarea
          value={profile.notes || ""}
          onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Cualquier otra información relevante..."
        />
      </section>
    </div>
  );
}
