import { invoke, isTauri } from "@tauri-apps/api/core";

interface AppInfo {
  name: string;
  version: string;
  tagline: string;
}

/** Keep the native bridge outside presentation components. */
export async function getAppDetails(): Promise<string> {
  if (!isTauri()) {
    return "You're visiting a preview. Make yourself at home.";
  }

  const app = await invoke<AppInfo>("app_info");
  return `${app.name} · ${app.version}`;
}
