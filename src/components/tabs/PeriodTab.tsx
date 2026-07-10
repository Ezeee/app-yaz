import { useState, useEffect } from "react";
import { Droplets, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { localDb } from "../../lib/localDb";
import {
  getCurrentPhase,
  getNextPeriodDate,
  getOvulationDate,
  getAvgCycleLength,
  getDaysUntil,
  formatDateShort,
  toDateString,
  getPhaseInfo,
} from "../../lib/cycleCalc";
import type { Period, CycleSymptom } from "../../types";
import CycleCircle from "../CycleCircle";
import SymptomLogger from "../SymptomLogger";

export default function PeriodTab() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [todaySymptom, setTodaySymptom] = useState<CycleSymptom | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data: periodData } = await supabase
          .from("periods")
          .select("*")
          .order("start_date", { ascending: false });
        setPeriods(periodData || []);

        const today = toDateString(new Date());
        const { data: symptomData } = await supabase
          .from("cycle_symptoms")
          .select("*")
          .eq("date", today)
          .maybeSingle();
        setTodaySymptom(symptomData);
      } else {
        const { data: periodData } = await localDb.from("periods").select();
        setPeriods(
          (periodData || []).sort(
            (a: Period, b: Period) =>
              new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          )
        );

        const today = toDateString(new Date());
        const { data: symptomData } = await localDb.from("cycle_symptoms").select();
        const todayEntry = (symptomData || []).find((s: CycleSymptom) => s.date === today);
        setTodaySymptom(todayEntry || null);
      }
    } catch {
      console.error("Error loading cycle data");
    }
    setLoading(false);
  };

  const handleStartPeriod = async () => {
    const today = toDateString(new Date());
    const newPeriod = { start_date: today, end_date: null };

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("periods").insert(newPeriod);
        if (error) throw error;
      } else {
        await localDb.from("periods").insert(newPeriod);
      }
      await loadData();
    } catch (err) {
      console.error("Error starting period:", err);
    }
  };

  const handleEndPeriod = async () => {
    if (periods.length === 0) return;
    const latest = periods[0];
    if (latest.end_date) return;

    const today = toDateString(new Date());
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("periods").update({ end_date: today }).eq("id", latest.id);
        if (error) throw error;
      } else {
        await localDb.from("periods").update({ end_date: today }).eq("id", latest.id);
      }
      await loadData();
    } catch (err) {
      console.error("Error ending period:", err);
    }
  };

  const handleSaveSymptom = async (data: {
    date: string;
    flow_intensity: "light" | "medium" | "heavy" | null;
    symptoms: string[];
    notes: string;
  }) => {
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("cycle_symptoms").upsert(data, { onConflict: "date" });
        if (error) throw error;
      } else {
        await localDb.fromUpsert("cycle_symptoms", "date").upsert(data);
      }
      setShowSymptomLogger(false);
      await loadData();
    } catch (err) {
      console.error("Error saving symptom:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const { phase, dayInCycle, totalCycleDays } = getCurrentPhase(periods);
  const phaseInfo = getPhaseInfo(phase);
  const nextPeriod = getNextPeriodDate(periods);
  const ovulation = getOvulationDate(periods);
  const avgCycle = getAvgCycleLength(periods);
  const daysUntilNext = getDaysUntil(nextPeriod);
  const latestPeriod = periods[0];
  const isOnPeriod = latestPeriod && !latestPeriod.end_date;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text">Mi Ciclo</h2>

      <div className="bg-card border border-border rounded-2xl p-5">
        <CycleCircle phase={phase} dayInCycle={dayInCycle} totalCycleDays={totalCycleDays} />
        <p className="text-xs text-text-muted text-center mt-3">{phaseInfo.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {daysUntilNext !== null && (
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-[10px] text-text-muted uppercase font-medium">Próximo período</p>
            <p className="text-sm font-bold text-text mt-0.5">
              {daysUntilNext <= 0 ? "Hoy" : `En ${daysUntilNext} días`}
            </p>
            <p className="text-[10px] text-text-muted">{formatDateShort(nextPeriod!.toISOString())}</p>
          </div>
        )}
        {ovulation && (
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-[10px] text-text-muted uppercase font-medium">Ovulación</p>
            <p className="text-sm font-bold text-text mt-0.5">
              {getDaysUntil(ovulation) !== null && getDaysUntil(ovulation)! <= 0
                ? "Ahora"
                : `En ${getDaysUntil(ovulation)} días`}
            </p>
            <p className="text-[10px] text-text-muted">{formatDateShort(ovulation.toISOString())}</p>
          </div>
        )}
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] text-text-muted uppercase font-medium">Duración ciclo</p>
          <p className="text-sm font-bold text-text mt-0.5">{avgCycle} días</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] text-text-muted uppercase font-medium">Ciclos registrados</p>
          <p className="text-sm font-bold text-text mt-0.5">{periods.length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {!isOnPeriod ? (
          <button
            onClick={handleStartPeriod}
            className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-vibrant transition-colors flex items-center justify-center gap-2"
          >
            <Droplets size={16} />
            Empezó mi período
          </button>
        ) : (
          <button
            onClick={handleEndPeriod}
            className="flex-1 border border-primary text-primary py-2.5 rounded-xl text-sm font-medium hover:bg-primary-light transition-colors flex items-center justify-center gap-2"
          >
            <Droplets size={16} />
            Terminó mi período
          </button>
        )}
      </div>

      <div
        className="bg-card border border-border rounded-xl p-3 cursor-pointer hover:border-primary transition-colors"
        onClick={() => setShowSymptomLogger(true)}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Síntomas de hoy</p>
            {todaySymptom && todaySymptom.symptoms.length > 0 ? (
              <p className="text-xs text-text-muted mt-0.5">
                {todaySymptom.symptoms.length} registrado(s)
              </p>
            ) : (
              <p className="text-xs text-text-muted mt-0.5">Tocá para registrar</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {todaySymptom && todaySymptom.symptoms.length > 0 && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: phaseInfo.color }}
              />
            )}
            <ChevronRight size={16} className="text-text-muted" />
          </div>
        </div>
      </div>

      {periods.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-text mb-2">Historial</h3>
          <div className="space-y-2">
            {periods.slice(0, 6).map((p) => {
              const start = new Date(p.start_date + "T00:00:00");
              let duration = "?";
              if (p.end_date) {
                const end = new Date(p.end_date + "T00:00:00");
                duration = String(
                  Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                );
              }
              return (
                <div
                  key={p.id}
                  className="bg-card border border-border rounded-xl px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-text">
                      {start.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatDateShort(p.start_date)}
                      {p.end_date ? ` - ${formatDateShort(p.end_date)}` : " - en curso"} ·{" "}
                      {duration} días
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {periods.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <Droplets size={32} className="mx-auto mb-2 text-text-muted" />
          <p className="text-sm text-text font-medium">Sin registros</p>
          <p className="text-xs text-text-muted mt-1">
            Presioná "Empezó mi período" para comenzar a registrar tu ciclo
          </p>
        </div>
      )}

      {showSymptomLogger && (
        <SymptomLogger
          phase={phase}
          existing={todaySymptom}
          onSave={handleSaveSymptom}
          onClose={() => setShowSymptomLogger(false)}
        />
      )}
    </div>
  );
}
