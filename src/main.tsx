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

if (windowLabel === "companion") {
  document.documentElement.classList.add("companion-root");
}

if (windowLabel === "companion-speech") {
  document.documentElement.classList.add("companion-speech-root");
}

if (windowLabel === "companion-menu") {
  document.documentElement.classList.add("companion-menu-root");
}

if (windowLabel === "walk-picker") {
  document.documentElement.classList.add("walk-picker-root");
}

const isOverlayWebview =
  windowLabel === "companion" ||
  windowLabel === "companion-speech" ||
  windowLabel === "companion-menu" ||
  windowLabel === "walk-picker";

const app = <App />;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  isOverlayWebview ? app : <React.StrictMode>{app}</React.StrictMode>,
);
