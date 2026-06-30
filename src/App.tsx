import { useState } from "react";
import Layout from "./components/Layout";
import CalendarTab from "./components/tabs/CalendarTab";
import MedicationsTab from "./components/tabs/MedicationsTab";
import ChatTab from "./components/tabs/ChatTab";
import SolicitudesTab from "./components/tabs/SolicitudesTab";
import PeriodTab from "./components/tabs/PeriodTab";
import ProfileTab from "./components/tabs/ProfileTab";
import type { TabId } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");

  const renderTab = () => {
    switch (activeTab) {
      case "calendar":
        return <CalendarTab />;
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
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderTab()}
    </Layout>
  );
}
