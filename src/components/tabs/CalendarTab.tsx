import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { localDb } from "../../lib/localDb";
import type { Appointment } from "../../types";
import AppointmentForm from "../AppointmentForm";
import { Plus, Calendar, MapPin, Trash2, Edit3, Bell } from "lucide-react";
import { rescheduleAll } from "../../lib/notificationScheduler";
import { hasNotificationSupport } from "../../lib/notifications";

export default function CalendarTab() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("date", { ascending: true });
      if (!error && data) setAppointments(data);
    } else {
      const { data } = await localDb.from("appointments").select();
      setAppointments(
        ((data || []) as Appointment[]).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
    }
    setLoading(false);
  };

  const handleSave = async (data: Omit<Appointment, "id" | "created_at">) => {
    if (isSupabaseConfigured && supabase) {
      if (editing) {
        await supabase.from("appointments").update(data).eq("id", editing.id);
      } else {
        await supabase.from("appointments").insert(data);
      }
    } else {
      if (editing) {
        await localDb.from("appointments").update(data).eq("id", editing.id);
      } else {
        await localDb.from("appointments").insert(data);
      }
    }
    setShowForm(false);
    setEditing(null);
    loadAppointments();
    rescheduleAll();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este turno?")) {
      if (isSupabaseConfigured && supabase) {
        await supabase.from("appointments").delete().eq("id", id);
      } else {
        await localDb.from("appointments").delete().eq("id", id);
      }
      loadAppointments();
      rescheduleAll();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Mis Turnos</h2>
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

      {!loading && appointments.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p>No tenés turnos agendados</p>
          <p className="text-xs mt-1">Tocá + para agregar uno</p>
        </div>
      )}

      <div className="space-y-3">
        {appointments.map((apt) => (
          <div key={apt.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-text">{apt.doctor_name}</h3>
                {apt.specialty && (
                  <p className="text-xs text-primary font-medium">{apt.specialty}</p>
                )}
                <p className="text-sm text-text-muted mt-1">{formatDate(apt.date)}</p>
                {apt.location && (
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {apt.location}
                  </p>
                )}
                {apt.notes && (
                  <p className="text-xs text-text-muted mt-2 italic">{apt.notes}</p>
                )}
                {apt.source === "scanned" && (
                  <span className="inline-block mt-1 text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full">
                    Escaneado
                  </span>
                )}
                {hasNotificationSupport() && Notification.permission === "granted" && new Date(apt.date) > new Date() && (
                  <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                    <Bell size={10} /> Recordatorio
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(apt)}
                  className="text-text-muted hover:text-primary p-1"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(apt.id)}
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
        <AppointmentForm
          appointment={editing}
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
