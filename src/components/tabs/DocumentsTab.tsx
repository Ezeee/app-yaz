import { useState, useEffect } from "react";
import { Plus, FileText, Search } from "lucide-react";
import { storage } from "../../lib/storage";
import type { MedicalDocument } from "../../types";
import DocumentCard from "../DocumentCard";
import DocumentViewer from "../DocumentViewer";
import DocumentUploader from "../DocumentUploader";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "image", label: "Imágenes" },
  { id: "pdf", label: "PDFs" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export default function DocumentsTab() {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [viewing, setViewing] = useState<MedicalDocument | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await storage.list();
      setDocuments(docs);
    } catch {
      console.error("Error loading documents");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este documento?")) return;
    try {
      await storage.remove(id);
      loadDocuments();
    } catch {
      console.error("Error deleting document");
    }
  };

  const filtered = documents.filter((doc) => {
    if (filter !== "all" && doc.file_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (!storage.isConfigured()) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text">Mis Documentos</h2>
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <FileText size={32} className="mx-auto mb-2 text-text-muted" />
          <p className="text-sm text-text font-medium">Supabase no configurado</p>
          <p className="text-xs text-text-muted mt-1">
            Configurá VITE_SUPABASE_URL y VITE_SUPABASE_KEY en .env para subir documentos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Mis Documentos</h2>
        <button
          onClick={() => setShowUploader(true)}
          className="bg-primary text-white p-2 rounded-full hover:bg-primary-vibrant transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar documentos..."
          className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === f.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-text-muted border-border hover:border-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8 text-text-muted">Cargando...</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <FileText size={48} className="mx-auto mb-3 opacity-30" />
          <p>No tenés documentos guardados</p>
          <p className="text-xs mt-1">Subí resultados de análisis, recetas o estudios</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            onView={setViewing}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {showUploader && (
        <DocumentUploader
          onSave={loadDocuments}
          onClose={() => setShowUploader(false)}
        />
      )}

      {viewing && (
        <DocumentViewer doc={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
