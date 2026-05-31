import { invoke } from "@tauri-apps/api/core";

export interface ScreenActivityAnalysis {
  description: string;
}

export async function analyzeScreenActivity(): Promise<ScreenActivityAnalysis> {
  return invoke<ScreenActivityAnalysis>("analyze_screen_activity");
}
