import { useEffect, useRef, useState } from "react";
import type { Photo } from "../lib/moments";
import { PhotoImage } from "./PhotoImage";

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  caption: string;
  onClose: () => void;
}

export function PhotoViewer({ photos, initialIndex, caption, onClose }: PhotoViewerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(false);
  const photo = photos[index];
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  function move(step: number) {
    setIndex((current) => (current + step + photos.length) % photos.length);
    setZoom(false);
  }
  if (!photo) return null;
  return (
    <dialog
      ref={ref}
      onClose={(event) => {
        event.stopPropagation();
        onClose();
      }}
      onCancel={(event) => event.stopPropagation()}
      aria-labelledby="photo-title"
      className="photo-viewer"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <header className="flex items-center justify-between gap-4 border-b border-white/15 p-5">
        <h2 id="photo-title" className="font-serif text-xl">
          Photo {index + 1} of {photos.length}
        </h2>
        <button
          className="viewer-button"
          type="button"
          onClick={() => ref.current?.close()}
          autoFocus
        >
          Back to moment ×
        </button>
      </header>
      <div
        className="photo-viewport"
        tabIndex={0}
        aria-label={zoom ? "Full-size photo, scroll to explore" : "Full photo"}
      >
        <PhotoImage
          key={photo.id}
          id={photo.id}
          thumbnail={false}
          alt={`Photo ${index + 1}, full view`}
          className={zoom ? "photo-original" : "photo-fitted"}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <div className="flex items-center gap-4">
          <button
            className="viewer-button"
            type="button"
            disabled={photos.length < 2}
            onClick={() => move(-1)}
            aria-label="Previous photo"
          >
            ←
          </button>
          <span className="text-xs text-white/60">
            {photo.width} × {photo.height}
          </span>
          <button
            className="viewer-button"
            type="button"
            disabled={photos.length < 2}
            onClick={() => move(1)}
            aria-label="Next photo"
          >
            →
          </button>
        </div>
        <button
          className="viewer-button"
          type="button"
          onClick={() => setZoom((current) => !current)}
        >
          {zoom ? "Fit whole photo" : "Explore full size"}
        </button>
      </div>
      {caption && (
        <p className="max-h-28 overflow-auto px-6 pb-6 font-serif text-lg text-white/80 [overflow-wrap:anywhere]">
          {caption}
        </p>
      )}
    </dialog>
  );
}
