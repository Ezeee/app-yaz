import { supabase, isSupabaseConfigured } from "./supabase";
import type { MedicalDocument } from "../types";

const BUCKET = "medical-documents";

function getFileType(file: File): "image" | "pdf" {
  if (file.type === "application/pdf") return "pdf";
  return "image";
}

async function compressImage(file: File, maxDim = 1920): Promise<File> {
  if (file.type === "application/pdf" || file.size < 2 * 1024 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(new File([blob!], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85
      );
    };
    img.src = url;
  });
}

export const storage = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  async upload(
    file: File,
    title: string,
    description: string,
    tags: string[],
    solicitudId?: string | null
  ): Promise<MedicalDocument> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase no está configurado. Agregá VITE_SUPABASE_URL y VITE_SUPABASE_KEY en .env");
    }

    const processed = await compressImage(file);
    const fileType = getFileType(processed);
    const ext = processed.name.split(".").pop();
    const filePath = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, processed, { contentType: processed.type });

    if (uploadError) throw uploadError;

    const doc = {
      title,
      description,
      file_name: file.name,
      file_type: fileType,
      mime_type: processed.type,
      file_path: filePath,
      solicitud_id: solicitudId || null,
      tags,
    };

    const { data, error } = await supabase
      .from("documents")
      .insert(doc)
      .select()
      .single();

    if (error) throw error;
    return data as MedicalDocument;
  },

  async list(): Promise<MedicalDocument[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as MedicalDocument[];
  },

  async getBySolicitud(solicitudId: string): Promise<MedicalDocument[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("solicitud_id", solicitudId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as MedicalDocument[];
  },

  async remove(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: doc } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", id)
      .single();

    if (doc) {
      await supabase.storage.from(BUCKET).remove([doc.file_path]);
    }

    await supabase.from("documents").delete().eq("id", id);
  },

  getUrl(doc: MedicalDocument): string {
    if (!isSupabaseConfigured || !supabase) return "";
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(doc.file_path);
    return data.publicUrl;
  },
};
