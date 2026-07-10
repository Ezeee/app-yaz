import { useState } from "react";
import { Bell, X } from "lucide-react";
import { requestPermission, hasNotificationSupport } from "../lib/notifications";
import { rescheduleAll } from "../lib/notificationScheduler";

export default function NotificationBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible || !hasNotificationSupport() || Notification.permission !== "default") {
    return null;
  }

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      await rescheduleAll();
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <div className="bg-primary-light border border-primary/20 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="bg-primary rounded-full p-2 shrink-0">
          <Bell size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text">Activá los recordatorios</p>
          <p className="text-xs text-text-muted mt-0.5">
            Recibí alertas cuando sea hora de tomar tu medicación o para tus turnos.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleEnable}
              className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-vibrant transition-colors"
            >
              Activar
            </button>
            <button
              onClick={handleDismiss}
              className="text-text-muted text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-text-muted hover:text-text shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
