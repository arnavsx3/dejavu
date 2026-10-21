import type { Moment } from "../lib/moments";

interface MomentShelfProps {
  moments: Moment[];
  disabled: boolean;
  onOpen: (moment: Moment) => void;
}

const papers = ["bg-[#eee3cc]", "bg-[#e5e9dd]", "bg-[#ecdfd5]"];

export function MomentShelf({ moments, disabled, onOpen }: MomentShelfProps) {
  return (
    <section className="my-12" aria-labelledby="collection-title">
      <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-4">
        <h2 id="collection-title" className="font-serif text-3xl">
          Your shelf
        </h2>
        <span className="text-xs text-muted">
          {moments.length} {moments.length === 1 ? "moment" : "moments"}
        </span>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {moments.map((moment, index) => (
          <li key={moment.id}>
            <button
              type="button"
              onClick={() => onOpen(moment)}
              disabled={disabled}
              aria-label={`Open moment: ${moment.body.slice(0, 100)}`}
              className={`flex min-h-56 w-full cursor-pointer flex-col rounded-sm border border-ink/10 p-6 text-left shadow-sm motion-safe:transition-transform enabled:hover:-translate-y-1 disabled:cursor-wait disabled:opacity-60 ${papers[index % papers.length] ?? papers[0]}`}
            >
              <time
                className="text-[10px] font-medium tracking-wider text-muted"
                dateTime={moment.createdAt}
              >
                {new Date(moment.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <p className="mt-5 line-clamp-6 whitespace-pre-wrap font-serif text-xl leading-relaxed [overflow-wrap:anywhere]">
                {moment.body}
              </p>
              <span className="mt-auto pt-6 text-[11px] text-muted">A moment, kept. ↗</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
