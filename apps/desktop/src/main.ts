import { invoke, isTauri } from "@tauri-apps/api/core";
import "./styles.css";

interface AppInfo {
  name: string;
  version: string;
  tagline: string;
}

const aboutButton = document.querySelector<HTMLButtonElement>("#about-button");
const aboutDialog = document.querySelector<HTMLDialogElement>("#about-dialog");
const appDetails = document.querySelector<HTMLParagraphElement>("#app-details");

if (!aboutButton || !aboutDialog || !appDetails) {
  throw new Error("The app shell is missing its about controls.");
}

aboutButton.addEventListener("click", () => {
  aboutDialog.showModal();
  void loadAppDetails(appDetails);
});

async function loadAppDetails(element: HTMLParagraphElement): Promise<void> {
  if (!isTauri()) {
    element.textContent = "You're visiting a preview. Make yourself at home.";
    return;
  }

  element.textContent = "Just a moment…";
  try {
    const app = await invoke<AppInfo>("app_info");
    element.textContent = `${app.name} · ${app.version}`;
  } catch {
    element.textContent = "Couldn't load app details. Please close this dialog and try again.";
  }
}
