import { useState } from "react";
import { X, Save } from "lucide-react";
import type { Solicitud } from "../types";

interface SolicitudFormProps {
  item?: Solicitud | null;
  onSave: (data: Omit<Solicitud, "id" | "created_at">) => void;
  onClose: () => void;
}

export default function SolicitudForm({ item, onSave, onClose }: SolicitudFormProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [doctorName, setDoctorName] = useState(item?.doctor_name || "");
  const [institution, setInstitution] = useState(item?.institution || "");
  const [studyDate, setStudyDate] = useState(item?.study_date || "");
  const [description, setDescription] = useState(item?.description || "");
  const [notes, setNotes] = useState(item?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      doctor_name: doctorName.trim(),
      specialty: "",
      institution: institution.trim(),
      study_date: studyDate || null,
      description: description.trim(),
      status: item?.status || "pendiente",
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-text">
            {item ? "Editar solicitud" : "Nueva solicitud"}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Nombre del estudio *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Holter, ecocardiograma, análisis de sangre"
              required
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Fecha del estudio
            </label>
            <input
              type="date"
              value={studyDate}
              onChange={(e) => setStudyDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Médico solicitante
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Ej: Dr. García"
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Institución
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Ej: Sanatorio Mitre, Lab Acuario"
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Diagnóstico / Motivo
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Por qué se pide el estudio..."
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Preparación, teléfono, horarios..."
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-vibrant transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {item ? "Guardar cambios" : "Agregar solicitud"}
          </button>
        </form>
      </div>
    </div>
  );
}
