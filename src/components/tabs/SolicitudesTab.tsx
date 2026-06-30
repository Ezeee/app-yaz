import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { localDb } from "../../lib/localDb";
import type { Solicitud } from "../../types";
import { ClipboardList, Trash2, CheckCircle, Clock, Plus, CalendarDays } from "lucide-react";
import SolicitudForm from "../SolicitudForm";

export default function SolicitudesTab() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Solicitud | null>(null);

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("solicitudes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setSolicitudes(data as Solicitud[]);
    } else {
      const { data } = await localDb.from("solicitudes").select();
      setSolicitudes(((data || []) as Solicitud[]).reverse());
    }
    setLoading(false);
  };

  const handleSave = async (data: Omit<Solicitud, "id" | "created_at">) => {
    if (isSupabaseConfigured && supabase) {
      if (editing) {
        await supabase.from("solicitudes").update(data).eq("id", editing.id);
      } else {
        await supabase.from("solicitudes").insert(data);
      }
    } else {
      if (editing) {
        await localDb.from("solicitudes").update(data).eq("id", editing.id);
      } else {
        await localDb.from("solicitudes").insert(data);
      }
    }
    setShowForm(false);
    setEditing(null);
    loadSolicitudes();
  };

  const toggleStatus = async (sol: Solicitud) => {
    const newStatus = sol.status === "pendiente" ? "completada" : "pendiente";
    if (isSupabaseConfigured && supabase) {
      await supabase.from("solicitudes").update({ status: newStatus }).eq("id", sol.id);
    } else {
      await localDb.from("solicitudes").update({ status: newStatus }).eq("id", sol.id);
    }
    loadSolicitudes();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar esta solicitud?")) {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("solicitudes").delete().eq("id", id);
      } else {
        await localDb.from("solicitudes").delete().eq("id", id);
      }
      loadSolicitudes();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Solicitudes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white p-2 rounded-xl hover:bg-primary-vibrant transition-colors"
          title="Nueva solicitud"
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

      {!loading && solicitudes.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
          <p>No tenés solicitudes guardadas</p>
          <p className="text-xs mt-1">Tocá el + para agregar una nueva</p>
        </div>
      )}

      <div className="space-y-3">
        {solicitudes.map((sol) => (
          <div
            key={sol.id}
            className={`bg-card border rounded-2xl p-4 shadow-sm transition-opacity ${
              sol.status === "completada" ? "border-border opacity-60" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => setEditing(sol)}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text text-sm">{sol.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                      sol.status === "pendiente"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-green-100 text-success"
                    }`}
                  >
                    {sol.status === "pendiente" ? (
                      <><Clock size={10} /> Pendiente</>
                    ) : (
                      <><CheckCircle size={10} /> Completada</>
                    )}
                  </span>
                </div>
                {sol.doctor_name && (
                  <p className="text-xs text-primary font-medium mt-1">{sol.doctor_name}</p>
                )}
                {sol.study_date && (
                  <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                    <CalendarDays size={10} />
                    Fecha: {new Date(sol.study_date + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {sol.institution && (
                  <p className="text-[10px] text-text-muted mt-1">{sol.institution}</p>
                )}
                {sol.description && (
                  <p className="text-xs text-text-muted mt-2 italic">{sol.description}</p>
                )}
                {sol.notes && (
                  <p className="text-[10px] text-text-muted mt-1">{sol.notes}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleStatus(sol)}
                  className="text-text-muted hover:text-success p-1"
                  title={sol.status === "pendiente" ? "Marcar completada" : "Marcar pendiente"}
                >
                  <CheckCircle size={14} />
                </button>
                <button
                  onClick={() => handleDelete(sol.id)}
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
        <SolicitudForm
          item={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
