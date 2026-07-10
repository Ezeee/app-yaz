import { supabase, isSupabaseConfigured } from "./supabase";
import { localDb } from "./localDb";
import { scheduleNotification, getPermission, hasNotificationSupport } from "./notifications";
import type { Medication, Appointment } from "../types";

const STORAGE_KEY = "bimo_scheduled_reminders";
const SETTINGS_KEY = "bimo_notification_settings";

export interface NotificationSettings {
  medications: boolean;
  appointments: boolean;
  cycle: boolean;
}

export interface ScheduledReminder {
  id: string;
  type: "medication" | "appointment";
  sourceId: string;
  timeoutId: number;
  scheduledFor: string;
}

let activeReminders: ScheduledReminder[] = [];

export function getSettings(): NotificationSettings {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") || {
      medications: true,
      appointments: true,
      cycle: true,
    };
  } catch {
    return { medications: true, appointments: true, cycle: true };
  }
}

export function saveSettings(settings: NotificationSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getStoredReminders(): { id: string; type: string; sourceId: string; scheduledFor: string }[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function storeReminder(reminder: { id: string; type: string; sourceId: string; scheduledFor: string }): void {
  const all = getStoredReminders();
  all.push(reminder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function removeStoredReminder(id: string): void {
  const all = getStoredReminders().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function computeDelayMs(targetDate: Date): number {
  return targetDate.getTime() - Date.now();
}

function getNextOccurrence(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export async function rescheduleAll(): Promise<void> {
  if (!hasNotificationSupport() || getPermission() !== "granted") return;

  cancelAll();

  const settings = getSettings();

  if (settings.medications) {
    await scheduleMedicationReminders();
  }

  if (settings.appointments) {
    await scheduleAppointmentReminders();
  }
}

async function scheduleMedicationReminders(): Promise<void> {
  let meds: Medication[] = [];

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("active", true);
    meds = (data || []) as Medication[];
  } else {
    const { data } = await localDb.from("medications").select();
    meds = ((data || []) as Medication[]).filter((m) => m.active);
  }

  for (const med of meds) {
    for (const time of med.times) {
      const nextDate = getNextOccurrence(time);
      const delay = computeDelayMs(nextDate);

      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        const id = `med_${med.id}_${time}`;
        const timeoutId = scheduleNotification(delay, "Hora de tu medicamento", {
          body: `Es hora de tomar ${med.name}${med.dosage ? ` - ${med.dosage}` : ""}`,
          tag: id,
        });
        const reminder: ScheduledReminder = {
          id,
          type: "medication",
          sourceId: med.id,
          timeoutId,
          scheduledFor: nextDate.toISOString(),
        };
        activeReminders.push(reminder);
        storeReminder({ id, type: "medication", sourceId: med.id, scheduledFor: nextDate.toISOString() });
      }
    }
  }
}

async function scheduleAppointmentReminders(): Promise<void> {
  let apts: Appointment[] = [];

  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .order("date", { ascending: true });
    apts = (data || []) as Appointment[];
  } else {
    const { data } = await localDb.from("appointments").select();
    apts = ((data || []) as Appointment[]).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  const now = new Date();

  for (const apt of apts) {
    const aptDate = new Date(apt.date);
    if (aptDate.getTime() <= now.getTime()) continue;

    const oneHourBefore = new Date(aptDate.getTime() - 60 * 60 * 1000);
    const oneDayBefore = new Date(aptDate.getTime() - 24 * 60 * 60 * 1000);

    if (oneHourBefore.getTime() > now.getTime()) {
      const delay = computeDelayMs(oneHourBefore);
      if (delay > 0 && delay < 25 * 60 * 60 * 1000) {
        const id = `apt_1h_${apt.id}`;
        const timeoutId = scheduleNotification(delay, "Turno en 1 hora", {
          body: `Tu turno con ${apt.doctor_name} es en 1 hora${apt.location ? ` en ${apt.location}` : ""}`,
          tag: id,
        });
        activeReminders.push({ id, type: "appointment", sourceId: apt.id, timeoutId, scheduledFor: oneHourBefore.toISOString() });
        storeReminder({ id, type: "appointment", sourceId: apt.id, scheduledFor: oneHourBefore.toISOString() });
      }
    }

    if (oneDayBefore.getTime() > now.getTime()) {
      const delay = computeDelayMs(oneDayBefore);
      if (delay > 0 && delay < 25 * 60 * 60 * 1000) {
        const id = `apt_1d_${apt.id}`;
        const hora = aptDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        const timeoutId = scheduleNotification(delay, "Turno mañana", {
          body: `Mañana tenés turno con ${apt.doctor_name} a las ${hora}${apt.location ? ` en ${apt.location}` : ""}`,
          tag: id,
        });
        activeReminders.push({ id, type: "appointment", sourceId: apt.id, timeoutId, scheduledFor: oneDayBefore.toISOString() });
        storeReminder({ id, type: "appointment", sourceId: apt.id, scheduledFor: oneDayBefore.toISOString() });
      }
    }
  }
}

export function cancelAll(): void {
  for (const r of activeReminders) {
    clearTimeout(r.timeoutId);
    removeStoredReminder(r.id);
  }
  activeReminders = [];
}

export function cancelBySource(sourceId: string): void {
  const toCancel = activeReminders.filter((r) => r.sourceId === sourceId);
  for (const r of toCancel) {
    clearTimeout(r.timeoutId);
    removeStoredReminder(r.id);
  }
  activeReminders = activeReminders.filter((r) => r.sourceId !== sourceId);
}

export function getActiveReminders(): ScheduledReminder[] {
  return [...activeReminders];
}

export function hasReminder(sourceId: string): boolean {
  return activeReminders.some((r) => r.sourceId === sourceId);
}
