import { Eye, Trash2, FileText, Link } from "lucide-react";
import { storage } from "../lib/storage";
import type { MedicalDocument } from "../types";

interface DocumentCardProps {
  doc: MedicalDocument;
  onView: (doc: MedicalDocument) => void;
  onDelete: (id: string) => void;
}

export default function DocumentCard({ doc, onView, onDelete }: DocumentCardProps) {
  const url = storage.getUrl(doc);
  const isPdf = doc.file_type === "pdf";

  return (
    <div className="bg-card border border-border rounded-2xl p-3 shadow-sm">
      <div className="flex gap-3">
        <button
          onClick={() => onView(doc)}
          className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center"
        >
          {isPdf ? (
            <FileText size={24} className="text-red-400" />
          ) : (
            <img
              src={url}
              alt={doc.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-text truncate">{doc.title}</h3>
              {doc.description && (
                <p className="text-[10px] text-text-muted truncate">{doc.description}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => onView(doc)}
                className="text-text-muted hover:text-primary p-1"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={() => onDelete(doc.id)}
                className="text-text-muted hover:text-red-500 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isPdf
                  ? "bg-red-100 text-red-600"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              {isPdf ? "PDF" : "IMG"}
            </span>

            {doc.tags && doc.tags.length > 0 && (
              <>
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary-light text-primary capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </>
            )}

            {doc.solicitud_id && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 flex items-center gap-1">
                <Link size={8} /> Vinculado
              </span>
            )}
          </div>

          <p className="text-[10px] text-text-muted mt-1">
            {new Date(doc.created_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
