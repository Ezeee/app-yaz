import { useState } from "react";
import type { Medication } from "../types";
import { X, Save, Plus, Trash2 } from "lucide-react";

interface MedicationFormProps {
  medication?: Medication | null;
  onSave: (data: Omit<Medication, "id" | "created_at">) => void;
  onClose: () => void;
}

export default function MedicationForm({ medication, onSave, onClose }: MedicationFormProps) {
  const [name, setName] = useState(medication?.name || "");
  const [dosage, setDosage] = useState(medication?.dosage || "");
  const [frequency, setFrequency] = useState(medication?.frequency || "");
  const [times, setTimes] = useState<string[]>(medication?.times || ["08:00"]);

  const addTime = () => setTimes([...times, ""]);
  const removeTime = (index: number) => setTimes(times.filter((_, i) => i !== index));
  const updateTime = (index: number, value: string) => {
    const updated = [...times];
    updated[index] = value;
    setTimes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      dosage,
      frequency,
      times: times.filter((t) => t),
      active: medication?.active ?? true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-text">
            {medication ? "Editar Medicamento" : "Nuevo Medicamento"}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Nombre del medicamento
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ibuprofeno 600mg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Dosis
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="1 pastilla"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Frecuencia
            </label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Cada 8 horas"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">
              Horarios
            </label>
            <div className="space-y-2">
              {times.map((time, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateTime(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTime(index)}
                      className="text-red-400 hover:text-red-600 px-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTime}
                className="text-primary text-xs font-medium flex items-center gap-1 hover:text-primary-vibrant"
              >
                <Plus size={14} /> Agregar horario
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primary-vibrant transition-colors flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {medication ? "Guardar cambios" : "Agregar medicamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
