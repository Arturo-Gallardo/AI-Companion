import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import "@fontsource/plus-jakarta-sans/latin-400.css";
import "@fontsource/plus-jakarta-sans/latin-500.css";
import "@fontsource/plus-jakarta-sans/latin-600.css";
import "@fontsource/plus-jakarta-sans/latin-700.css";
import App from "./App";
import "./index.css";

const windowLabel = getCurrentWebviewWindow().label;

// per-instance windows use companion-<id> / companion-speech-<id> labels
const isCompanionSpeechWindow =
  windowLabel === "companion-speech" ||
  windowLabel.startsWith("companion-speech-");
const isCompanionSpriteWindow =
  windowLabel === "companion" ||
  (windowLabel.startsWith("companion-") &&
    windowLabel !== "companion-menu" &&
    !isCompanionSpeechWindow);

if (isCompanionSpriteWindow) {
  document.documentElement.classList.add("companion-root");
}

if (isCompanionSpeechWindow) {
  document.documentElement.classList.add("companion-speech-root");
}

if (windowLabel === "companion-menu") {
  document.documentElement.classList.add("companion-menu-root");
}

if (windowLabel === "walk-picker") {
  document.documentElement.classList.add("walk-picker-root");
}

const isOverlayWebview =
  isCompanionSpriteWindow ||
  isCompanionSpeechWindow ||
  windowLabel === "companion-menu" ||
  windowLabel === "walk-picker";

const app = <App />;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  isOverlayWebview ? app : <React.StrictMode>{app}</React.StrictMode>,
);
