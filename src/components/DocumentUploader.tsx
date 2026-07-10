import { useState, useEffect, useRef } from "react";
import { X, Upload, Camera, FileText, Check, Loader2 } from "lucide-react";
import { storage } from "../lib/storage";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { localDb } from "../lib/localDb";
import type { Solicitud } from "../types";

interface DocumentUploaderProps {
  onSave: () => void;
  onClose: () => void;
}

const TAGS = ["analisis", "ecografia", "radiografia", "receta", "estudio", "otro"];

export default function DocumentUploader({ onSave, onClose }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [solicitudId, setSolicitudId] = useState<string>("");
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from("solicitudes")
        .select("id, title")
        .order("created_at", { ascending: false });
      setSolicitudes((data || []) as Solicitud[]);
    } else {
      const { data } = await localDb.from("solicitudes").select();
      setSolicitudes(((data || []) as Solicitud[]).reverse());
    }
  };

  const handleFile = (selected: File) => {
    if (selected.size > 20 * 1024 * 1024) {
      setError("El archivo supera los 20MB");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!validTypes.includes(selected.type)) {
      setError("Formato no soportado. Usá JPG, PNG, WebP o PDF");
      return;
    }
    setFile(selected);
    setError(null);
    if (!title) {
      setTitle(selected.name.replace(/\.[^.]+$/, ""));
    }
    if (selected.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);

    try {
      await storage.upload(
        file,
        title.trim(),
        description.trim(),
        selectedTags,
        solicitudId || null
      );
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-text">Subir documento</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!file ? (
            <div className="space-y-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-border rounded-2xl text-text-muted hover:border-primary hover:text-primary transition-colors"
              >
                <Camera size={24} />
                <span className="text-sm font-medium">Tomar foto</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-border rounded-2xl text-text-muted hover:border-primary hover:text-primary transition-colors"
              >
                <Upload size={24} />
                <span className="text-sm font-medium">Elegir archivo</span>
              </button>

              <p className="text-[10px] text-text-muted text-center">
                JPG, PNG, WebP o PDF — Máximo 20MB
              </p>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-40 bg-red-50 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <FileText size={32} className="mx-auto text-red-400 mb-1" />
                      <p className="text-xs text-text-muted">{file.name}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { setFile(null); setPreview(null); setTitle(""); }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-text-muted mb-1 block">Título *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Análisis de sangre junio 2025"
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-muted mb-1 block">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-muted mb-2 block">Etiquetas</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                        selectedTags.includes(tag)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-text-muted border-border hover:border-primary"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {solicitudes.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-text-muted mb-1 block">
                    Vincular a solicitud
                  </label>
                  <select
                    value={solicitudId}
                    onChange={(e) => setSolicitudId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="">Sin vinculación</option>
                    {solicitudes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!title.trim() || uploading}
                className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-vibrant transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 size={16} className="animate-spin" /> Subiendo...</>
                ) : (
                  <><Check size={16} /> Subir documento</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
