import { useState } from "react";
import { X, Check, Plus } from "lucide-react";
import type { CycleSymptom, CyclePhase } from "../types";
import { SYMPTOMS_BY_PHASE } from "../lib/cycleCalc";

interface SymptomLoggerProps {
  phase: CyclePhase;
  existing?: CycleSymptom | null;
  onSave: (data: {
    date: string;
    flow_intensity: "light" | "medium" | "heavy" | null;
    symptoms: string[];
    notes: string;
  }) => void;
  onClose: () => void;
}

const FLOW_OPTIONS = [
  { id: "light", label: "Leve", color: "bg-pink-200" },
  { id: "medium", label: "Normal", color: "bg-pink-400" },
  { id: "heavy", label: "Abundante", color: "bg-pink-600" },
] as const;

export default function SymptomLogger({ phase, existing, onSave, onClose }: SymptomLoggerProps) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(existing?.date || today);
  const [flow, setFlow] = useState<"light" | "medium" | "heavy" | null>(
    existing?.flow_intensity || null
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    (existing?.symptoms || []).filter((s) => !s.startsWith("custom:"))
  );
  const [customSymptoms, setCustomSymptoms] = useState<string[]>(
    (existing?.symptoms || []).filter((s) => s.startsWith("custom:")).map((s) => s.replace("custom:", ""))
  );
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState("");
  const [notes, setNotes] = useState(existing?.notes || "");

  const symptoms = SYMPTOMS_BY_PHASE[phase] || [];

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const addCustomSymptom = () => {
    const trimmed = customText.trim();
    if (trimmed && !customSymptoms.includes(trimmed)) {
      setCustomSymptoms((prev) => [...prev, trimmed]);
    }
    setCustomText("");
    setShowCustomInput(false);
  };

  const removeCustomSymptom = (text: string) => {
    setCustomSymptoms((prev) => prev.filter((s) => s !== text));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allSymptoms = [
      ...selectedSymptoms,
      ...customSymptoms.map((s) => `custom:${s}`),
    ];
    onSave({
      date: selectedDate,
      flow_intensity: phase === "menstrual" ? flow : null,
      symptoms: allSymptoms,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-text">Registrar síntomas</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {phase === "menstrual" && (
            <div>
              <label className="text-xs font-medium text-text-muted mb-2 block">
                Intensidad del flujo
              </label>
              <div className="flex gap-2">
                {FLOW_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFlow(flow === opt.id ? null : opt.id)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      flow === opt.id
                        ? `${opt.color} text-white border-transparent`
                        : "bg-white text-text-muted border-border hover:border-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block">Síntomas</label>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s: { id: string; label: string }) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSymptom(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedSymptoms.includes(s.id)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-muted border-border hover:border-primary"
                  }`}
                >
                  {s.label}
                </button>
              ))}

              {customSymptoms.map((text) => (
                <button
                  key={`custom-${text}`}
                  type="button"
                  onClick={() => removeCustomSymptom(text)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary-light text-primary border border-primary flex items-center gap-1"
                >
                  {text}
                  <X size={12} />
                </button>
              ))}

              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-text-muted hover:border-primary hover:text-primary flex items-center gap-1 transition-all"
                >
                  <Plus size={12} />
                  Otro
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomSymptom();
                      }
                      if (e.key === "Escape") {
                        setShowCustomInput(false);
                        setCustomText("");
                      }
                    }}
                    placeholder="Escribí lo que sentís..."
                    autoFocus
                    className="px-3 py-1.5 rounded-full text-xs border border-primary focus:outline-none focus:ring-1 focus:ring-primary w-36"
                  />
                  <button
                    type="button"
                    onClick={addCustomSymptom}
                    className="text-primary hover:text-primary-vibrant p-1"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCustomInput(false); setCustomText(""); }}
                    className="text-text-muted hover:text-text p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Algo que quieras registrar..."
              className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-vibrant transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Guardar
          </button>
        </form>
      </div>
    </div>
  );
}
