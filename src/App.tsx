import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { CompanionSpeechWindow } from "./components/companion/CompanionSpeechWindow";
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

  if (windowLabel === "companion-speech") {
    return <CompanionSpeechWindow />;
  }

  return <DashboardShell />;
}

export default App;
