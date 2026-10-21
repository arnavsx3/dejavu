import { useState } from "react";
import { AboutDialog } from "./components/AboutDialog";
import { ShelfScene } from "./components/ShelfScene";

export function App() {
  const [aboutOpen, setAboutOpen] = useState(false);

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
          <h1 className="mt-[22px] mb-5 font-serif text-[clamp(42px,5.5vw,68px)] font-normal leading-[1.07] tracking-[-1.6px] sm:tracking-[-2.5px]">
            Some days are worth
            <br />
            keeping a piece of.
          </h1>
          <p className="text-sm leading-[1.9] text-muted sm:text-[15px]">
            The walk home. A familiar voice. Something you almost forgot.
            <br className="hidden sm:block" /> A little home for the things that make a life.
          </p>
          <ShelfScene />
        </main>

        <footer className="flex justify-between border-t border-line py-[22px] text-[11px] tracking-[0.2px] text-muted">
          <span>Little things, felt again.</span>
          <span>Take your time.</span>
        </footer>
      </div>

      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
    </>
  );
}
