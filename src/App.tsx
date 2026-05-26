import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { CompanionWindow } from "./components/companion/CompanionWindow";
import { DashboardShell } from "./components/dashboard/DashboardShell";

function App() {
  const [windowLabel, setWindowLabel] = useState<string | null>(null);

  useEffect(() => {
    setWindowLabel(getCurrentWebviewWindow().label);
  }, []);

  if (windowLabel === null) {
    return null;
  }

  if (windowLabel === "companion") {
    return <CompanionWindow />;
  }

  return <DashboardShell />;
}

export default App;
