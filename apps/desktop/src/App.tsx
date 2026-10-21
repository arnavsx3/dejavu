import { useEffect, useRef, useState } from "react";
import { AboutDialog } from "./components/AboutDialog";
import { MomentDialog } from "./components/MomentDialog";
import { MomentShelf } from "./components/MomentShelf";
import { ShelfScene } from "./components/ShelfScene";
import { listMoments, momentError } from "./lib/moments";
import type { Moment, MomentError } from "./lib/moments";

interface ShelfState {
  status: "loading" | "ready" | "error";
  moments: Moment[];
  error: MomentError | null;
}

export function App() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [editor, setEditor] = useState<{ moment: Moment | null } | null>(null);
  const [shelf, setShelf] = useState<ShelfState>({ status: "loading", moments: [], error: null });
  const [refresh, setRefresh] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const keepButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    void listMoments()
      .then((moments) => {
        if (active) setShelf({ status: "ready", moments, error: null });
      })
      .catch((cause: unknown) => {
        if (active)
          setShelf((previous) => ({ ...previous, status: "error", error: momentError(cause) }));
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  function refreshShelf() {
    setShelf((previous) => ({ ...previous, status: "loading", error: null }));
    setRefresh((previous) => previous + 1);
  }

  function saved(moment: Moment) {
    setShelf((previous) => ({
      status: "ready",
      error: null,
      moments: [...previous.moments.filter((item) => item.id !== moment.id), moment].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id),
      ),
    }));
    setEditor(null);
    setAnnouncement("A moment, kept.");
    keepButtonRef.current?.focus();
  }

  function removed(id: string) {
    setShelf((previous) => ({
      ...previous,
      moments: previous.moments.filter((item) => item.id !== id),
    }));
    setEditor(null);
    setAnnouncement("Moment removed.");
    keepButtonRef.current?.focus();
  }

  const preview = shelf.error?.code === "desktop_required";

  return (
    <>
      <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6 sm:px-16">
        <header className="flex items-center justify-between border-b border-line py-6 sm:py-[34px]">
          <a
            className="font-serif text-[35px] font-semibold tracking-[-2px] text-ink no-underline"
            href="/"
            aria-label="dejavu home"
          >
            dejavu
            <span
              className="ml-[9px] inline-block align-middle font-sans text-[23px] font-normal tracking-normal text-clay"
              aria-hidden="true"
            >
              ✳
            </span>
          </a>
          <button className="quiet-button" type="button" onClick={() => setAboutOpen(true)}>
            A little about dejavu
          </button>
        </header>

        <main className="flex-1 pt-[45px] sm:pt-16">
          <div className="eyebrow">
            <span
              className="mr-2 inline-block size-1.5 rounded-full bg-moss align-[1px]"
              aria-hidden="true"
            />
            YOUR OWN LITTLE CORNER
          </div>
          <h1 className="mt-[22px] mb-5 font-serif text-[clamp(38px,5vw,60px)] font-normal leading-[1.07] tracking-[-1.6px] sm:tracking-[-2px]">
            Some days are worth
            <br />
            keeping a piece of.
          </h1>
          <p className="text-sm leading-[1.9] text-muted sm:text-[15px]">
            The walk home. A familiar voice. Something you almost forgot.
            <br className="hidden sm:block" /> A little home for the things that make a life.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-5">
            <button
              ref={keepButtonRef}
              className="primary-button"
              type="button"
              disabled={shelf.status !== "ready"}
              onClick={() => {
                setAnnouncement("");
                setEditor({ moment: null });
              }}
            >
              Keep a moment <span aria-hidden="true">＋</span>
            </button>
            {!preview && (
              <button
                className="quiet-button disabled:opacity-50"
                type="button"
                onClick={refreshShelf}
                disabled={shelf.status === "loading"}
              >
                Refresh shelf
              </button>
            )}
          </div>
          {announcement && (
            <p className="mt-4 text-xs text-moss" role="status">
              {announcement}
            </p>
          )}
          {shelf.status === "loading" && (
            <p className="my-10 text-sm text-muted" role="status">
              Finding your moments…
            </p>
          )}
          {shelf.error && (
            <div
              className="mt-7 rounded-lg border border-line bg-white/30 p-5"
              role={preview ? "status" : "alert"}
            >
              <p className="text-sm leading-relaxed text-muted">{shelf.error.message}</p>
              {!preview && (
                <button className="quiet-button mt-2" type="button" onClick={refreshShelf}>
                  Try again
                </button>
              )}
            </div>
          )}
          {shelf.moments.length > 0 ? (
            <MomentShelf
              moments={shelf.moments}
              disabled={shelf.status !== "ready"}
              onOpen={(moment) => {
                setAnnouncement("");
                setEditor({ moment });
              }}
            />
          ) : (
            (shelf.status === "ready" || preview) && <ShelfScene />
          )}
        </main>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-line py-[22px] text-[11px] tracking-[0.2px] text-muted">
          <span>Little things, felt again.</span>
          <span>{preview ? "A little preview." : "Kept on this device."}</span>
        </footer>
      </div>
      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
      {editor && (
        <MomentDialog
          moment={editor.moment}
          onSaved={saved}
          onRemoved={removed}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  );
}
