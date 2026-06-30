import type { CyclePhase } from "../types";
import { getPhaseInfo } from "../lib/cycleCalc";

interface CycleCircleProps {
  phase: CyclePhase;
  dayInCycle: number;
  totalCycleDays: number;
}

export default function CycleCircle({ phase, dayInCycle, totalCycleDays }: CycleCircleProps) {
  const phaseInfo = getPhaseInfo(phase);
  const radius = 80;
  const strokeWidth = 12;
  const phases: { key: CyclePhase; start: number; end: number; color: string }[] = [
    { key: "menstrual", start: 0, end: 5 / totalCycleDays, color: "#E8607C" },
    { key: "follicular", start: 5 / totalCycleDays, end: 13 / totalCycleDays, color: "#7C5CE8" },
    { key: "ovulation", start: 13 / totalCycleDays, end: 15 / totalCycleDays, color: "#E8A87C" },
    { key: "luteal", start: 15 / totalCycleDays, end: 1, color: "#7CA8E8" },
  ];

  const cx = 100;
  const cy = 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {phases.map((p) => {
            const startAngle = p.start * 360 - 90;
            const endAngle = p.end * 360 - 90;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);
            const largeArc = endAngle - startAngle > 180 ? 1 : 0;
            return (
              <path
                key={p.key}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                stroke={p.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={p.key === phase ? 1 : 0.25}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl">{phaseInfo.emoji}</span>
          <span className="text-2xl font-bold text-text mt-1">{dayInCycle}</span>
          <span className="text-xs text-text-muted">de {totalCycleDays}</span>
        </div>
      </div>

      <div
        className="mt-2 px-4 py-1.5 rounded-full text-sm font-medium"
        style={{ backgroundColor: phaseInfo.bgColor, color: phaseInfo.color }}
      >
        {phaseInfo.label}
      </div>
    </div>
  );
}
