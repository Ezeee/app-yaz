import type { Period, CyclePhase } from "../types";

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const OVULATION_OFFSET = 14;

export function getAvgCycleLength(periods: Period[]): number {
  if (periods.length < 2) return DEFAULT_CYCLE_LENGTH;
  const sorted = [...periods].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  let total = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].start_date).getTime();
    const curr = new Date(sorted[i].start_date).getTime();
    total += (curr - prev) / (1000 * 60 * 60 * 24);
  }
  return Math.round(total / (sorted.length - 1));
}

export function getAvgPeriodLength(periods: Period[]): number {
  const withEnd = periods.filter((p) => p.end_date);
  if (withEnd.length === 0) return DEFAULT_PERIOD_LENGTH;
  let total = 0;
  for (const p of withEnd) {
    const start = new Date(p.start_date).getTime();
    const end = new Date(p.end_date!).getTime();
    total += (end - start) / (1000 * 60 * 60 * 24) + 1;
  }
  return Math.round(total / withEnd.length);
}

export function getLastPeriodStart(periods: Period[]): string | null {
  if (periods.length === 0) return null;
  const sorted = [...periods].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
  return sorted[0].start_date;
}

export function getNextPeriodDate(periods: Period[]): Date | null {
  const lastStart = getLastPeriodStart(periods);
  if (!lastStart) return null;
  const avgCycle = getAvgCycleLength(periods);
  const next = new Date(lastStart);
  next.setDate(next.getDate() + avgCycle);
  return next;
}

export function getOvulationDate(periods: Period[]): Date | null {
  const nextPeriod = getNextPeriodDate(periods);
  if (!nextPeriod) return null;
  const ovulation = new Date(nextPeriod);
  ovulation.setDate(ovulation.getDate() - OVULATION_OFFSET);
  return ovulation;
}

export function getFertileWindow(periods: Period[]): { start: Date; end: Date } | null {
  const ovulation = getOvulationDate(periods);
  if (!ovulation) return null;
  const start = new Date(ovulation);
  start.setDate(start.getDate() - 2);
  const end = new Date(ovulation);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function getCurrentPhase(periods: Period[]): {
  phase: CyclePhase;
  dayInCycle: number;
  totalCycleDays: number;
} {
  const lastStart = getLastPeriodStart(periods);
  if (!lastStart) {
    return { phase: "menstrual", dayInCycle: 1, totalCycleDays: DEFAULT_CYCLE_LENGTH };
  }
  const avgCycle = getAvgCycleLength(periods);
  const avgPeriod = getAvgPeriodLength(periods);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(lastStart);
  startDate.setHours(0, 0, 0, 0);
  const dayInCycle =
    Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let phase: CyclePhase;
  if (dayInCycle <= avgPeriod) {
    phase = "menstrual";
  } else if (dayInCycle <= OVULATION_OFFSET - 1) {
    phase = "follicular";
  } else if (dayInCycle <= OVULATION_OFFSET + 1) {
    phase = "ovulation";
  } else {
    phase = "luteal";
  }

  return { phase, dayInCycle, totalCycleDays: avgCycle };
}

export function getDaysUntil(date: Date | null): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPhaseInfo(phase: CyclePhase): {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  emoji: string;
} {
  switch (phase) {
    case "menstrual":
      return {
        label: "Menstruación",
        description: "Tu cuerpo está eliminando el revestimiento uterino. Es normal sentir calambres y fatiga.",
        color: "#E8607C",
        bgColor: "#FFF0F3",
        emoji: "🩸",
      };
    case "follicular":
      return {
        label: "Folicular",
        description: "Tu energía está aumentando. Tus ovarios están preparando un óvulo.",
        color: "#7C5CE8",
        bgColor: "#F3F0FF",
        emoji: "🌱",
      };
    case "ovulation":
      return {
        label: "Ovulación",
        description: "Momento de mayor fertilidad del ciclo. El óvulo es liberado.",
        color: "#E8A87C",
        bgColor: "#FFF5F0",
        emoji: "✨",
      };
    case "luteal":
      return {
        label: "Lútea",
        description: "Fase pre-menstrual. Es común experimentar cambios de humor y hinchazón.",
        color: "#7CA8E8",
        bgColor: "#F0F5FF",
        emoji: "🌙",
      };
  }
}

export const SYMPTOMS_BY_PHASE: Record<CyclePhase, { id: string; label: string }[]> = {
  menstrual: [
    { id: "calambres", label: "Calambres" },
    { id: "fatiga", label: "Fatiga" },
    { id: "dolor_cabeza", label: "Dolor de cabeza" },
    { id: "hinchazon", label: "Hinchazón" },
    { id: "cambio_humor", label: "Cambios de humor" },
    { id: "dolor_espalda", label: "Dolor de espalda" },
    { id: "antojos", label: "Antojos" },
    { id: "nauseas", label: "Náuseas" },
  ],
  follicular: [
    { id: "energia_alta", label: "Energía alta" },
    { id: "buen_animio", label: "Buen ánimo" },
    { id: "piel_mejorada", label: "Piel mejorada" },
    { id: "concentracion", label: "Buena concentración" },
    { id: "dolor_cabeza", label: "Dolor de cabeza" },
  ],
  ovulation: [
    { id: "dolor_leve", label: "Dolor leve" },
    { id: "aumento_flujo", label: "Aumento de flujo" },
    { id: "sensibilidad_senos", label: "Sensibilidad en senos" },
    { id: "energia_alta", label: "Energía alta" },
    { id: "buen_animio", label: "Buen ánimo" },
  ],
  luteal: [
    { id: "pms", label: "PMS" },
    { id: "hinchazon", label: "Hinchazón" },
    { id: "sensibilidad_senos", label: "Sensibilidad en senos" },
    { id: "cambio_humor", label: "Cambios de humor" },
    { id: "antojos", label: "Antojos" },
    { id: "fatiga", label: "Fatiga" },
    { id: "acne", label: "Acné" },
    { id: "insomnio", label: "Insomnio" },
  ],
};

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}
