import { X, Download, ExternalLink } from "lucide-react";
import { storage } from "../lib/storage";
import type { MedicalDocument } from "../types";

interface DocumentViewerProps {
  doc: MedicalDocument;
  onClose: () => void;
}

export default function DocumentViewer({ doc, onClose }: DocumentViewerProps) {
  const url = storage.getUrl(doc);
  const isPdf = doc.file_type === "pdf";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h3 className="font-bold text-text truncate">{doc.title}</h3>
            {doc.description && (
              <p className="text-xs text-text-muted truncate">{doc.description}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <button
              onClick={handleDownload}
              className="text-text-muted hover:text-primary p-1.5 rounded-lg hover:bg-primary-light transition-colors"
              title="Descargar"
            >
              <Download size={16} />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary p-1.5 rounded-lg hover:bg-primary-light transition-colors"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink size={16} />
            </a>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isPdf ? (
            <iframe
              src={url}
              className="w-full h-[60vh] rounded-xl border border-border"
              title={doc.title}
            />
          ) : (
            <img
              src={url}
              alt={doc.title}
              className="w-full rounded-xl object-contain max-h-[60vh]"
            />
          )}
        </div>

        <div className="p-3 border-t border-border shrink-0 flex items-center justify-between text-[10px] text-text-muted">
          <span>{doc.file_name}</span>
          <span>
            {new Date(doc.created_at).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
