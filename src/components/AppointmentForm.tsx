import { useState } from "react";
import type { Appointment } from "../types";
import { X, Save } from "lucide-react";

interface AppointmentFormProps {
  appointment?: Appointment | null;
  onSave: (data: Omit<Appointment, "id" | "created_at">) => void;
  onClose: () => void;
}

export default function AppointmentForm({ appointment, onSave, onClose }: AppointmentFormProps) {
  const [doctorName, setDoctorName] = useState(appointment?.doctor_name || "");
  const [specialty, setSpecialty] = useState(appointment?.specialty || "");
  const [date, setDate] = useState(
    appointment?.date ? new Date(appointment.date).toISOString().slice(0, 16) : ""
  );
  const [location, setLocation] = useState(appointment?.location || "");
  const [notes, setNotes] = useState(appointment?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      doctor_name: doctorName,
      specialty,
      date: new Date(date).toISOString(),
      location,
      notes,
      source: appointment?.source || "manual",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-text">
            {appointment ? "Editar Turno" : "Nuevo Turno"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Nombre del médico
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Dr. Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Especialidad
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Cardiología"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Lugar
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Clínica Santa María"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Traer estudios previos..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primary-vibrant transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {appointment ? "Guardar cambios" : "Agregar turno"}
          </button>
        </form>
      </div>
    </div>
  );
}
