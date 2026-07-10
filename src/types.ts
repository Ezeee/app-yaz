export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_name: string;
  specialty: string;
  date: string;
  location: string;
  notes: string;
  source: "manual" | "scanned";
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Doctor {
  name: string;
  specialty: string;
}

export interface Profile {
  id: string;
  name: string;
  age: string;
  gender: string;
  medical_conditions: string;
  allergies: string;
  doctors: Doctor[];
  restrictions: string;
  notes: string;
  created_at: string;
}

export interface Solicitud {
  id: string;
  title: string;
  description: string;
  doctor_name: string;
  specialty: string;
  institution: string;
  study_date: string | null;
  status: "pendiente" | "completada";
  notes: string;
  created_at: string;
}

export type TabId = "calendar" | "medications" | "chat" | "solicitudes" | "period" | "settings" | "documents";

export interface Period {
  id: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface CycleSymptom {
  id: string;
  date: string;
  flow_intensity: "light" | "medium" | "heavy" | null;
  symptoms: string[];
  notes: string;
  created_at: string;
}

export type CyclePhase = "menstrual" | "follicular" | "ovulation" | "luteal";

export interface MedicalDocument {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_type: "image" | "pdf";
  mime_type: string;
  file_path: string;
  solicitud_id: string | null;
  tags: string[];
  created_at: string;
}
