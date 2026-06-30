import { supabase, isSupabaseConfigured } from "./supabase";
import { localDb } from "./localDb";
import type { Profile, Medication, Appointment } from "../types";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const BASE_PROMPT = `Sos BiMO, un asistente personal de salud y nutrici\u00f3n.

Tu rol:
- Respond\u00e9 y ayud\u00e9 en TODO lo que sea sobre salud, nutrici\u00f3n, ejercicios, bienestar y medicamentos.
- Si te piden recomendaciones (ejercicios, alimentos, h\u00e1bitos), dale opciones concretas y espec\u00edficas.
- Si algo NO es sobre salud o nutrici\u00f3n, dec\u00ed que solo pod\u00e9s ayudar con temas de salud.
- NO inventes datos ni informaci\u00f3n m\u00e9dica falsa.
- Si no sab\u00e9s algo, decilo honestamente.

Ten\u00e9s la capacidad de crear turnos m\u00e9dicos, agregar medicamentos y registrar solicitudes de estudios cuando el usuario te lo pida. Us\u00e1 las funciones disponibles para hacerlo.

IMPORTANTE: La zona horaria es Argentina (GMT-3). Cuando generes fechas, SIEMPRE inclu\u00ed la zona horaria -03:00. Por ejemplo, si el usuario dice "10 de la ma\u00f1ana", us\u00e1 "10:00:00-03:00", NO "10:00:00".

REGLAS PARA CREAR TURNOS:
Cuando el usuario pida agendar un turno, ANTES de llamar a la funci\u00f3n, asegurate de tener TODOS estos datos. Si falta alguno, preguntale al usuario:
- Nombre del m\u00e9dico (obligatorio)
- Fecha y hora exacta (obligatorio) - pregunt\u00e1 la hora si solo dice el d\u00eda
- Especialidad
- Lugar
- Notas (opcional, no es necesario preguntar)

Ejemplo: Si el usuario dice "agend\u00e1 un turno con el Dr. L\u00f3pez", preguntale: "\u00bfQu\u00e9 especialidad tiene el Dr. L\u00f3pez? \u00bfPara qu\u00e9 d\u00eda y hora lo agendamos? \u00bfEn qu\u00e9 lugar?"

REGLAS PARA CREAR MEDICAMENTOS:
Cuando el usuario pida agregar un medicamento, ANTES de llamar a la funci\u00f3n, asegurate de tener TODOS estos datos. Si falta alguno, preguntale al usuario:
- Nombre del medicamento (obligatorio)
- Dosis (obligatorio) - ej: 1 pastilla, 5ml
- Frecuencia (obligatorio) - ej: cada 8 horas, una vez por d\u00eda
- Horarios espec\u00edficos (obligatorio) - ej: 8:00, 16:00, 0:00

Ejemplo: Si el usuario dice "agreg\u00e1 ibuprofeno", preguntale: "\u00bfQu\u00e9 dosis? \u00bfCada cu\u00e1nto tiempo hay que tomarlo? \u00bfA qu\u00e9 horas?"

REGLAS PARA CREAR SOLICITUDES DE ESTUDIOS:
Cuando el usuario pida registrar una solicitud de estudio m\u00e9dico, ANTES de llamar a la funci\u00f3n, asegurate de tener TODOS estos datos. Si falta alguno, preguntale al usuario:
- Nombre del estudio (obligatorio) - ej: Holter, ecocardiograma, an\u00e1lisis de sangre
- Fecha del estudio (opcional) - cu\u00e1ndo se tiene que hacer, si ya tiene fecha asignada
- M\u00e9dico solicitante (opcional) - qui\u00e9n lo pide
- Instituci\u00f3n (opcional) - d\u00f3nde hacerse el estudio
- Diagn\u00f3stico o motivo (opcional) - por qu\u00e9 se pide
- Notas (opcional) - preparaci\u00f3n, tel\u00e9fono, horarios

Ejemplo: Si el usuario dice "agend\u00e1 un Holter", preguntale: "\u00bfQui\u00e9n lo solicit\u00f3? \u00bfYa ten\u00e9s fecha para hacerlo? \u00bfEn qu\u00e9 instituci\u00f3n?"

Formato de respuesta:
- Respond\u00e9 en espa\u00f1ol, tono c\u00e1lido y cercano.
- Us\u00e1 vi\u00f1etas o listas cuando des recomendaciones.
- S\u00e9 claro y completo, no cortes respuestas a mitad.

Reglas importantes:
- No hac\u00e9s diagn\u00f3sticos m\u00e9dicos, pero s\u00ed pod\u00e9s dar informaci\u00f3n general y recomendaciones.
- Si alguien describe s\u00edntomas, recomend\u00e1s consultar a un m\u00e9dico, pero primero dale informaci\u00f3n \u00fatil.
- Record\u00e1 las condiciones m\u00e9dicas y alergias de la persona para contextualizar tus respuestas, pero no las repitas en cada mensaje.`;

const createAppointmentDeclaration = {
  name: "create_appointment",
  description: "Agenda un turno m\u00e9dico cuando el usuario lo pide.",
  parameters: {
    type: "OBJECT",
    properties: {
      doctor_name: { type: "STRING", description: "Nombre del m\u00e9dico" },
      specialty: { type: "STRING", description: "Especialidad del m\u00e9dico" },
      date: { type: "STRING", description: "Fecha y hora en ISO 8601 con -03:00" },
      location: { type: "STRING", description: "Lugar del turno" },
      notes: { type: "STRING", description: "Notas adicionales" },
    },
    required: ["doctor_name", "date"],
  },
};

const createMedicationDeclaration = {
  name: "create_medication",
  description: "Agrega un medicamento cuando el usuario lo pide.",
  parameters: {
    type: "OBJECT",
    properties: {
      name: { type: "STRING", description: "Nombre del medicamento" },
      dosage: { type: "STRING", description: "Dosis" },
      frequency: { type: "STRING", description: "Frecuencia" },
      times: { type: "ARRAY", items: { type: "STRING" }, description: "Horarios HH:MM" },
    },
    required: ["name"],
  },
};

const createSolicitudDeclaration = {
  name: "create_solicitud",
  description: "Registra una solicitud de estudio m\u00e9dico.",
  parameters: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING", description: "Nombre del estudio" },
      study_date: { type: "STRING", description: "Fecha YYYY-MM-DD" },
      doctor_name: { type: "STRING", description: "M\u00e9dico solicitante" },
      institution: { type: "STRING", description: "Instituci\u00f3n" },
      description: { type: "STRING", description: "Diagn\u00f3stico o motivo" },
      notes: { type: "STRING", description: "Notas adicionales" },
    },
    required: ["title"],
  },
};

const tools = [
  { functionDeclarations: [createAppointmentDeclaration, createMedicationDeclaration, createSolicitudDeclaration] },
];

async function getProfile(): Promise<Profile | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("profile").select("*").limit(1);
    if (data && data.length > 0) return data[0] as Profile;
  }
  return await localDb.getProfile();
}

async function getMedications(): Promise<Medication[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("medications").select("*").eq("active", true).order("created_at", { ascending: true });
    return (data || []) as Medication[];
  }
  const { data } = await localDb.from("medications").select();
  return ((data || []) as Medication[]).filter((m) => m.active);
}

async function getAppointments(): Promise<Appointment[]> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.from("appointments").select("*").gte("date", now).order("date", { ascending: true }).limit(5);
    return (data || []) as Appointment[];
  }
  const { data } = await localDb.from("appointments").select();
  return ((data || []) as Appointment[])
    .filter((a) => new Date(a.date) >= new Date(now))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
}

export async function buildSystemPrompt(): Promise<string> {
  const profile = await getProfile();
  let context = "";

  if (profile) {
    context += "\n\nInformaci\u00f3n personal de la persona:\n";
    if (profile.name) context += `- Nombre: ${profile.name}\n`;
    if (profile.age) context += `- Edad: ${profile.age}\n`;
    if (profile.gender) context += `- Sexo: ${profile.gender}\n`;
    if (profile.medical_conditions) context += `- Condiciones m\u00e9dicas: ${profile.medical_conditions}\n`;
    if (profile.allergies) context += `- Alergias: ${profile.allergies}\n`;
    if (profile.doctors && profile.doctors.length > 0) {
      context += `- M\u00e9dicos de cabecera:\n`;
      profile.doctors.forEach((d) => { context += `  * ${d.name} (${d.specialty})\n`; });
    }
    if (profile.notes) context += `- Notas adicionales: ${profile.notes}\n`;
    if (profile.restrictions) context += `\nRestricciones especiales:\n${profile.restrictions}\n`;
  }

  const meds = await getMedications();
  if (meds.length > 0) {
    context += "\nMedicamentos actuales:\n";
    meds.forEach((m) => {
      context += `- ${m.name}`;
      if (m.dosage) context += ` - ${m.dosage}`;
      if (m.frequency) context += ` (${m.frequency})`;
      if (m.times && m.times.length > 0) context += ` - Horarios: ${m.times.join(", ")}`;
      context += "\n";
    });
  }

  const apts = await getAppointments();
  if (apts.length > 0) {
    context += "\nPr\u00f3ximos turnos m\u00e9dicos:\n";
    apts.forEach((a) => {
      const fecha = new Date(a.date).toLocaleDateString("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      context += `- ${fecha} - ${a.doctor_name}`;
      if (a.specialty) context += ` (${a.specialty})`;
      if (a.location) context += ` - ${a.location}`;
      context += "\n";
    });
  }

  return BASE_PROMPT + context;
}

export interface FunctionCallResult {
  type: "appointment" | "medication" | "solicitud";
  data: Record<string, unknown>;
}

async function executeFunctionCall(name: string, args: Record<string, unknown>): Promise<FunctionCallResult> {
  if (name === "create_appointment") {
    const appointment = {
      doctor_name: args.doctor_name as string,
      specialty: (args.specialty as string) || "",
      date: args.date as string,
      location: (args.location as string) || "",
      notes: (args.notes as string) || "",
      source: "chat" as const,
    };
    if (isSupabaseConfigured && supabase) {
      await supabase.from("appointments").insert(appointment);
    } else {
      await localDb.from("appointments").insert(appointment);
    }
    return { type: "appointment", data: appointment };
  }

  if (name === "create_medication") {
    const medication = {
      name: args.name as string,
      dosage: (args.dosage as string) || "",
      frequency: (args.frequency as string) || "",
      times: (args.times as string[]) || [],
      active: true,
    };
    if (isSupabaseConfigured && supabase) {
      await supabase.from("medications").insert(medication);
    } else {
      await localDb.from("medications").insert(medication);
    }
    return { type: "medication", data: medication };
  }

  if (name === "create_solicitud") {
    const solicitud = {
      title: args.title as string,
      doctor_name: (args.doctor_name as string) || "",
      specialty: "",
      institution: (args.institution as string) || "",
      study_date: (args.study_date as string) || null,
      description: (args.description as string) || "",
      status: "pendiente" as const,
      notes: (args.notes as string) || "",
    };
    if (isSupabaseConfigured && supabase) {
      await supabase.from("solicitudes").insert(solicitud);
    } else {
      await localDb.from("solicitudes").insert(solicitud);
    }
    return { type: "solicitud", data: solicitud };
  }

  throw new Error(`Unknown function: ${name}`);
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; id?: string; response: unknown };
  inline_data?: { mime_type: string; data: string };
}

interface GeminiMessage {
  role: string;
  parts: GeminiPart[];
}

async function callGemini(endpoint: string, payload: Record<string, unknown>): Promise<any> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.functions.invoke("gemini-proxy", {
      body: { endpoint, payload },
    });
    if (error) throw new Error(error.message);
    return data;
  }
  const response = await fetch(`${GEMINI_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.json();
}

export async function sendChatMessage(
  message: string,
  history: { role: string; content: string }[]
): Promise<{ text: string; created?: FunctionCallResult }> {
  const contents: GeminiMessage[] = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const systemPrompt = await buildSystemPrompt();

  const data = await callGemini("models/gemini-2.5-flash:generateContent", {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    tools,
    generationConfig: { maxOutputTokens: 800 },
  });

  if (data.error) throw new Error(data.error.message);

  const candidate = data.candidates?.[0];
  const parts: GeminiPart[] = candidate?.content?.parts || [];
  const functionCallPart = parts.find((p: GeminiPart) => p.functionCall);

  if (functionCallPart?.functionCall) {
    const { name, args } = functionCallPart.functionCall;
    const result = await executeFunctionCall(name, args);
    contents.push(candidate.content);
    contents.push({
      role: "user",
      parts: [{
        functionResponse: {
          name,
          response: {
            success: true,
            message: `Funci\u00f3n ejecutada correctamente. ${result.type === "appointment" ? "Turno" : result.type === "medication" ? "Medicamento" : "Solicitud"} creado.`,
          },
        },
      }],
    });

    const finalData = await callGemini("models/gemini-2.5-flash:generateContent", {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      tools,
      generationConfig: { maxOutputTokens: 800 },
    });

    if (finalData.error) throw new Error(finalData.error.message);

    const finalText =
      finalData.candidates?.[0]?.content?.parts?.[0]?.text ||
      (result.type === "appointment" ? "Turno guardado correctamente." : result.type === "medication" ? "Medicamento agregado correctamente." : "Solicitud registrada correctamente.");

    return { text: finalText, created: result };
  }

  const text = parts.find((p: GeminiPart) => p.text)?.text || "No pude generar una respuesta.";
  return { text };
}

export async function extractFromImage(base64Image: string, mimeType: string): Promise<string> {
  const data = await callGemini("models/gemini-2.5-flash:generateContent", {
    system_instruction: {
      parts: [{
        text: `Sos BiMO, un asistente de salud. Analiz\u00e1 esta imagen m\u00e9dica y clasific\u00e1 el tipo de documento.

Tipos posibles:
1. "solicitud" - Solicitud de estudio m\u00e9dico
2. "turno" - Turno o cita m\u00e9dica agendada
3. "receta" - Receta m\u00e9dica con indicaci\u00f3n de medicamentos

Respond\u00e9 SIEMPRE en formato JSON con tipo_documento, y los campos correspondientes.

Si no pod\u00e9s clasificar, respond\u00e9 con tipo_documento "desconocido".`,
      }],
    },
    contents: [{
      parts: [
        { inline_data: { mime_type: mimeType, data: base64Image } },
        { text: "Analiz\u00e1 esta imagen y extra\u00e1 toda la informaci\u00f3n m\u00e9dica que encuentres." },
      ],
    }],
  });

  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No pude leer la imagen.";
}

