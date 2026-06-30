import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { localDb } from "../../lib/localDb";
import type { Medication } from "../../types";
import MedicationForm from "../MedicationForm";
import { Plus, Pill, Trash2, Edit3, Clock } from "lucide-react";

export default function MedicationsTab() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("medications")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setMedications(data);
    } else {
      const { data } = await localDb.from("medications").select();
      setMedications(((data || []) as Medication[]).reverse());
    }
    setLoading(false);
  };

  const handleSave = async (data: Omit<Medication, "id" | "created_at">) => {
    if (isSupabaseConfigured && supabase) {
      if (editing) {
        await supabase.from("medications").update(data).eq("id", editing.id);
      } else {
        await supabase.from("medications").insert(data);
      }
    } else {
      if (editing) {
        await localDb.from("medications").update(data).eq("id", editing.id);
      } else {
        await localDb.from("medications").insert(data);
      }
    }
    setShowForm(false);
    setEditing(null);
    loadMedications();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este medicamento?")) {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("medications").delete().eq("id", id);
      } else {
        await localDb.from("medications").delete().eq("id", id);
      }
      loadMedications();
    }
  };

  const toggleActive = async (med: Medication) => {
    const updates = { active: !med.active };
    if (isSupabaseConfigured && supabase) {
      await supabase.from("medications").update(updates).eq("id", med.id);
    } else {
      await localDb.from("medications").update(updates).eq("id", med.id);
    }
    loadMedications();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Mis Medicamentos</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white p-2 rounded-full hover:bg-primary-vibrant transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="text-[10px] text-text-muted bg-primary-light rounded-xl px-3 py-1.5">
          Modo local — configurá Supabase en .env para sincronizar
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-text-muted">Cargando...</div>
      )}

      {!loading && medications.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Pill size={48} className="mx-auto mb-3 opacity-30" />
          <p>No tenés medicamentos registrados</p>
          <p className="text-xs mt-1">Tocá + para agregar uno</p>
        </div>
      )}

      <div className="space-y-3">
        {medications.map((med) => (
          <div
            key={med.id}
            className={`bg-card border rounded-2xl p-4 shadow-sm transition-opacity ${
              med.active ? "border-border" : "border-border opacity-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text">{med.name}</h3>
                  <button
                    onClick={() => toggleActive(med)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      med.active
                        ? "bg-green-100 text-success"
                        : "bg-gray-100 text-text-muted"
                    }`}
                  >
                    {med.active ? "Activo" : "Pausado"}
                  </button>
                </div>
                {med.dosage && (
                  <p className="text-sm text-text-muted">{med.dosage}</p>
                )}
                {med.frequency && (
                  <p className="text-xs text-text-muted mt-1">{med.frequency}</p>
                )}
                {med.times.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {med.times.map((time, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full flex items-center gap-1"
                      >
                        <Clock size={10} /> {time}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(med)}
                  className="text-text-muted hover:text-primary p-1"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(med.id)}
                  className="text-text-muted hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(showForm || editing) && (
        <MedicationForm
          medication={editing}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
