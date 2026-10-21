import { useState } from "react";
import { AboutDialog } from "./components/AboutDialog";
import { ShelfScene } from "./components/ShelfScene";

export function App() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <div className="room">
        <header className="masthead">
          <a className="wordmark" href="/" aria-label="dejavu home">
            dejavu<span aria-hidden="true">✳</span>
          </a>
          <button className="quiet-button" type="button" onClick={() => setAboutOpen(true)}>
            A little about dejavu
          </button>
        </header>

        <main>
          <div className="eyebrow">
            <span className="small-dot" aria-hidden="true" /> YOUR OWN LITTLE CORNER
          </div>
          <h1>
            Some days are worth
            <br />
            keeping a piece of.
          </h1>
          <p className="intro">
            The walk home. A familiar voice. Something you almost forgot.
            <br className="wide-break" /> A little home for the things that make a life.
          </p>
          <ShelfScene />
        </main>

        <footer>
          <span>Little things, felt again.</span>
          <span>Take your time.</span>
        </footer>
      </div>

      {aboutOpen && <AboutDialog onClose={() => setAboutOpen(false)} />}
    </>
  );
}
