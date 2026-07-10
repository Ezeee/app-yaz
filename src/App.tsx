import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import CalendarTab from "./components/tabs/CalendarTab";
import MedicationsTab from "./components/tabs/MedicationsTab";
import ChatTab from "./components/tabs/ChatTab";
import SolicitudesTab from "./components/tabs/SolicitudesTab";
import PeriodTab from "./components/tabs/PeriodTab";
import ProfileTab from "./components/tabs/ProfileTab";
import DocumentsTab from "./components/tabs/DocumentsTab";
import NotificationBanner from "./components/NotificationBanner";
import { rescheduleAll } from "./lib/notificationScheduler";
import type { TabId } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");

  useEffect(() => {
    rescheduleAll();
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "calendar":
        return (
          <>
            <NotificationBanner />
            <CalendarTab />
          </>
        );
      case "medications":
        return <MedicationsTab />;
      case "chat":
        return <ChatTab />;
      case "solicitudes":
        return <SolicitudesTab />;
      case "period":
        return <PeriodTab />;
      case "settings":
        return <ProfileTab />;
      case "documents":
        return <DocumentsTab />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </Layout>
  );
}
