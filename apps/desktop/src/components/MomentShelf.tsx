import type { Moment } from "../lib/moments";
import { PhotoImage } from "./PhotoImage";

interface MomentShelfProps {
  moments: Moment[];
  disabled: boolean;
  onOpen: (moment: Moment) => void;
}

export function MomentShelf({ moments, disabled, onOpen }: MomentShelfProps) {
  return (
    <section className="memory-wall my-12" aria-labelledby="collection-title">
      <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 id="collection-title" className="font-serif text-3xl">
            Your little collection
          </h2>
          <p className="mt-2 text-xs text-muted">
            No perfect days required. Just pieces you want to keep.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {moments.length} {moments.length === 1 ? "moment" : "moments"}
        </span>
      </div>
      <ul className="memory-grid">
        {moments.map((moment) => {
          const photoCount = moment.photos.length;
          return (
            <li key={moment.id} className={photoCount ? "memory-item has-photos" : "memory-item"}>
              <button
                type="button"
                onClick={() => onOpen(moment)}
                disabled={disabled}
                aria-label={`Open moment: ${moment.body.slice(0, 100) || `${photoCount} ${photoCount === 1 ? "photo" : "photos"}`}`}
                className={photoCount ? "memory-card photo-moment" : "memory-card paper-moment"}
              >
                {photoCount > 0 ? (
                  <>
                    <span
                      className={`print-cluster ${photoCount === 1 ? "single-print" : ""}`}
                      aria-hidden="true"
                    >
                      {moment.photos.slice(0, 3).map((photo) => (
                        <span className="collage-print" key={photo.id}>
                          <PhotoImage id={photo.id} alt="" className="h-full w-full object-cover" />
                          <span className="print-mark">dejavu / a little piece of then</span>
                        </span>
                      ))}
                      <span className="fridge-magnet" />
                      {moment.body && (
                        <span className="caption-scrap">
                          <span className="line-clamp-3 whitespace-pre-wrap [overflow-wrap:anywhere]">
                            {moment.body}
                          </span>
                        </span>
                      )}
                    </span>
                    <span className="mt-3 flex w-full items-center justify-between gap-3 text-[10px] text-muted">
                      <time dateTime={moment.createdAt}>{dateLabel(moment.createdAt)}</time>
                      <span>
                        {photoCount} {photoCount === 1 ? "print" : "prints"} · open a little memory
                        ↗
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="paper-tape" aria-hidden="true" />
                    <span className="mb-6 text-[10px] tracking-widest text-muted">
                      A THOUGHT TO COME BACK TO
                    </span>
                    <p className="line-clamp-7 whitespace-pre-wrap font-serif text-[23px] leading-relaxed [overflow-wrap:anywhere]">
                      {moment.body}
                    </p>
                    <span className="mt-auto flex w-full items-center justify-between gap-3 pt-8 text-[10px] text-muted">
                      <time dateTime={moment.createdAt}>{dateLabel(moment.createdAt)}</time>
                      <span>kept in words ↗</span>
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
