import { useEffect, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { CompanionMenuWindow } from "./components/companion/CompanionMenuWindow";
import { CompanionSpeechWindow } from "./components/companion/CompanionSpeechWindow";
import { CompanionWindow } from "./components/companion/CompanionWindow";
import { WalkPickerWindow } from "./components/companion/WalkPickerWindow";
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

  if (windowLabel === "companion-menu") {
    return <CompanionMenuWindow />;
  }

  if (windowLabel === "walk-picker") {
    return <WalkPickerWindow />;
  }

  return <DashboardShell />;
}

export default App;
