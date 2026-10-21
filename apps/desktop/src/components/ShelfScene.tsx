export function ShelfScene() {
  return (
    <section className="shelf-scene" aria-labelledby="shelf-title">
      <div className="objects" aria-hidden="true">
        <div className="paper">
          <span className="paper-sun" />
          <i />
          <i />
          <i />
        </div>
        <div className="frame">
          <div className="landscape">
            <span />
          </div>
        </div>
        <div className="cassette">
          <div className="cassette-label">
            <span />
            <span />
          </div>
          <div className="cassette-slot" />
        </div>
      </div>
      <div className="shelf" aria-hidden="true" />
      <div className="shelf-caption">
        <span className="eyebrow">THE BEGINNING OF SOMETHING</span>
        <h2 id="shelf-title">Your shelf is waiting.</h2>
        <p>Soon, a place for your photographs, words, and familiar voices.</p>
      </div>
    </section>
  );
}
