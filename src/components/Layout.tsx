import type { ReactNode } from "react";
import { Calendar, Pill, MessageCircle, Droplets, Settings, ClipboardList } from "lucide-react";
import type { TabId } from "../types";

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Calendar }[] = [
  { id: "calendar", label: "Turnos", icon: Calendar },
  { id: "medications", label: "Pastillas", icon: Pill },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "period", label: "Período", icon: Droplets },
];

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-bg">
      <header className="bg-primary text-white px-4 py-3 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">BiMO</h1>
          <p className="text-xs opacity-80">Tu asistente de salud</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange("solicitudes" as TabId)}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "solicitudes"
                ? "bg-white/20 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            title="Solicitudes"
          >
            <ClipboardList size={20} />
          </button>
          <button
            onClick={() => onTabChange("settings" as TabId)}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "settings"
                ? "bg-white/20 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            title="Configuración"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">{children}</main>

      <nav className="bg-white border-t border-border flex justify-around py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? "text-primary-vibrant bg-primary-light"
                  : "text-text-muted hover:text-primary"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
