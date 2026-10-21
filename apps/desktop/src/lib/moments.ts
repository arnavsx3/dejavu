import { invoke, isTauri } from "@tauri-apps/api/core";

export interface Moment {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export class MomentError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "MomentError";
  }
}

export function momentError(error: unknown): MomentError {
  if (error instanceof MomentError) return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string" &&
    ["validation", "conflict", "not_found", "storage", "newer_schema", "internal"].includes(
      error.code,
    )
  ) {
    return new MomentError(error.code, error.message);
  }
  return new MomentError("unknown", "That action couldn't be completed. Please try again.");
}

async function command<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new MomentError("desktop_required", "Open the dejavu desktop app to keep your moments.");
  }
  try {
    return await invoke<T>(name, args);
  } catch (error) {
    throw momentError(error);
  }
}

export function listMoments(): Promise<Moment[]> {
  return command("list_moments");
}

export function createMoment(body: string): Promise<Moment> {
  return command("create_moment", { body });
}

export function updateMoment(moment: Moment, body: string): Promise<Moment> {
  return command("update_moment", { id: moment.id, body, expectedUpdatedAt: moment.updatedAt });
}

export function deleteMoment(moment: Moment): Promise<void> {
  return command("delete_moment", { id: moment.id, expectedUpdatedAt: moment.updatedAt });
}
