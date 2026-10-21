import { invoke, isTauri } from "@tauri-apps/api/core";

export interface Photo {
  id: string;
  width: number;
  height: number;
}

export interface Moment {
  id: string;
  body: string;
  photos: Photo[];
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

export interface DraftPhoto {
  id: string;
  file: File;
  encoded: string;
}

export function readPhoto(id: string, thumbnail = true): Promise<ArrayBuffer> {
  return command("read_photo", { id, thumbnail });
}

export function savePhotoMoment(
  moment: Moment | null,
  body: string,
  keepPhotoIds: string[],
  photos: DraftPhoto[],
): Promise<Moment> {
  return command("save_photo_moment", {
    id: moment?.id ?? null,
    expectedUpdatedAt: moment?.updatedAt ?? null,
    body,
    keepPhotoIds,
    photos: photos.map((photo) => photo.encoded),
  });
}

export async function preparePhotos(files: File[], remaining: number): Promise<DraftPhoto[]> {
  if (files.length > remaining)
    throw new MomentError("validation", "Keep up to six photos in one moment.");
  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new MomentError("validation", "Choose JPEG, PNG, or WebP photos.");
    }
    if (file.size > 10 * 1024 * 1024)
      throw new MomentError("validation", "Each photo must be 10 MB or smaller.");
  }
  const photos: DraftPhoto[] = [];
  for (const file of files) {
    const encoded = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () =>
        reject(
          new MomentError("validation", "That photo could not be read. Please choose it again."),
        );
      reader.onload = () => {
        if (typeof reader.result === "string")
          resolve(reader.result.slice(reader.result.indexOf(",") + 1));
        else reject(new MomentError("validation", "That photo could not be read."));
      };
      reader.readAsDataURL(file);
    });
    photos.push({ id: crypto.randomUUID(), file, encoded });
  }
  return photos;
}
