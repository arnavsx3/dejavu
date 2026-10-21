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
    <dialog ref={dialogRef} aria-labelledby="about-title" onClose={onClose}>
      <form method="dialog">
        <button className="quiet-button close-button" aria-label="Close about dialog">
          Close ×
        </button>
      </form>
      <span className="eyebrow">A LITTLE HOME FOR YOUR MEMORIES</span>
      <h2 id="about-title">Hello, again.</h2>
      <p>
        A photo, a few words, a voice you love. dejavu is a place to keep the ordinary things that
        turn out to matter.
      </p>
      <p className="app-details" role="status" aria-live="polite">
        {details}
      </p>
    </dialog>
  );
}
