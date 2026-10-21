import { useEffect, useState } from "react";
import { readPhoto } from "../lib/moments";

interface PhotoImageProps {
  id: string;
  file?: File;
  thumbnail?: boolean;
  alt: string;
  className?: string;
}

/** Object URLs belong to one mounted image and are released on close or change. */
export function PhotoImage({ id, file, thumbnail = true, alt, className = "" }: PhotoImageProps) {
  const [result, setResult] = useState<{ key: string; url?: string; failed?: boolean } | null>(
    null,
  );
  const key = `${id}:${String(thumbnail)}`;
  useEffect(() => {
    let active = true;
    let url: string | undefined;
    const source = file
      ? Promise.resolve(file)
      : readPhoto(id, thumbnail).then((bytes) => new Blob([bytes], { type: "image/jpeg" }));
    void source
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setResult({ key, url });
      })
      .catch(() => {
        if (active) setResult({ key, failed: true });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, file, thumbnail, key]);

  if (result?.key === key && result.url) {
    return (
      <img
        src={result.url}
        alt={alt}
        className={className}
        draggable={false}
        onError={() => setResult({ key, failed: true })}
      />
    );
  }
  return (
    <span className={`photo-placeholder ${className}`} role="img" aria-label={alt}>
      {result?.key === key && result.failed
        ? "Photo unavailable. Reopen to try again."
        : "Developing a little memory…"}
    </span>
  );
}
