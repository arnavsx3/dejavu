import { useEffect, useRef, useState } from "react";
import { getAppDetails } from "../lib/app-info";

interface AboutDialogProps {
  onClose: () => void;
}

export function AboutDialog({ onClose }: AboutDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [details, setDetails] = useState("Just a moment…");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    let active = true;

    void getAppDetails()
      .then((message) => {
        if (active) setDetails(message);
      })
      .catch(() => {
        if (active) {
          setDetails("Couldn't load app details. Please close this dialog and try again.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="about-title"
      onClose={onClose}
      className="m-auto w-[calc(100vw-2.5rem)] max-w-[450px] rounded-lg border border-line bg-paper p-[30px] text-ink shadow-[0_20px_80px_#26201826] backdrop:bg-[#26201855]"
    >
      <form method="dialog" className="mb-[25px] flex justify-end">
        <button className="quiet-button" aria-label="Close about dialog">
          Close ×
        </button>
      </form>
      <span className="eyebrow">A LITTLE HOME FOR YOUR MEMORIES</span>
      <h2 id="about-title" className="my-[15px] font-serif text-4xl font-normal">
        Hello, again.
      </h2>
      <p className="text-sm leading-[1.8] text-muted">
        A photo, a few words, a voice you love. dejavu is a place to keep the ordinary things that
        turn out to matter.
      </p>
      <p className="mt-[25px] text-xs leading-[1.8] text-muted" role="status" aria-live="polite">
        {details}
      </p>
    </dialog>
  );
}
