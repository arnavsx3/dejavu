import { useEffect, useRef, useState } from "react";
import { createMoment, deleteMoment, momentError, updateMoment } from "../lib/moments";
import type { Moment } from "../lib/moments";

interface MomentDialogProps {
  moment: Moment | null;
  onSaved: (moment: Moment) => void;
  onRemoved: (id: string) => void;
  onClose: () => void;
}

const NOTE_LIMIT = 16_000;

export function MomentDialog({ moment, onSaved, onRemoved, onClose }: MomentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<"view" | "edit" | "delete">(moment ? "view" : "edit");
  const [body, setBody] = useState(moment?.body ?? "");
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discard, setDiscard] = useState(false);
  const length = Array.from(body.trim()).length;
  const dirty = mode === "edit" && body !== (moment?.body ?? "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    if (mode === "edit" && !discard) textareaRef.current?.focus();
  }, [mode, discard]);

  function close() {
    dialogRef.current?.close();
  }

  function requestClose() {
    if (pending) return;
    if (dirty) setDiscard(true);
    else close();
  }

  async function save() {
    if (pending || length === 0 || length > NOTE_LIMIT) return;
    setPending("save");
    setError(null);
    try {
      const saved = moment ? await updateMoment(moment, body) : await createMoment(body);
      close();
      onSaved(saved);
    } catch (cause) {
      setError(momentError(cause).message);
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    if (pending || !moment) return;
    setPending("delete");
    setError(null);
    try {
      await deleteMoment(moment);
      close();
      onRemoved(moment.id);
    } catch (cause) {
      setError(momentError(cause).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="moment-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      className="m-auto max-h-[90vh] w-[calc(100vw-2rem)] max-w-[620px] overflow-y-auto rounded-xl border border-line bg-paper p-6 text-ink shadow-[0_20px_80px_#26201826] backdrop:bg-[#26201855] sm:p-9"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="eyebrow">A LITTLE PIECE OF YOUR LIFE</span>
        <button
          className="quiet-button disabled:cursor-wait disabled:opacity-50"
          type="button"
          onClick={requestClose}
          disabled={pending !== null}
          aria-label="Close moment"
        >
          Close ×
        </button>
      </div>

      {discard ? (
        <>
          <h2 id="moment-title" className="font-serif text-3xl">
            Leave these words behind?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            These changes haven't been saved yet.
          </p>
          <div className="mt-7 flex flex-wrap justify-end gap-4">
            <button className="quiet-button" type="button" onClick={close}>
              Discard changes
            </button>
            <button className="primary-button" type="button" onClick={() => setDiscard(false)}>
              Keep writing
            </button>
          </div>
        </>
      ) : mode === "edit" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h2 id="moment-title" className="font-serif text-4xl">
            {moment ? "A little revision." : "Keep a moment."}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A few words are enough. The little things count.
          </p>
          <label className="mt-7 block text-xs font-medium text-muted" htmlFor="moment-body">
            Your moment
          </label>
          <textarea
            ref={textareaRef}
            id="moment-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="What would you like to remember?"
            disabled={pending !== null}
            aria-describedby="moment-limit"
            aria-invalid={length > NOTE_LIMIT}
            className="mt-2 min-h-52 w-full resize-y rounded-lg border border-line bg-white/40 p-4 font-serif text-xl leading-relaxed text-ink placeholder:font-sans placeholder:text-sm placeholder:text-muted/75 focus:outline-2 focus:outline-offset-2 focus:outline-moss disabled:opacity-70"
          />
          <p
            id="moment-limit"
            className={`mt-2 text-right text-xs ${length > NOTE_LIMIT ? "text-clay" : "text-muted"}`}
          >
            {length.toLocaleString()} / {NOTE_LIMIT.toLocaleString()} characters
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm leading-relaxed text-clay">
              {error} Your draft is still here.
            </p>
          )}
          <div className="mt-7 flex items-center justify-end gap-5">
            <button
              className="quiet-button"
              type="button"
              disabled={pending !== null}
              onClick={requestClose}
            >
              Cancel
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={pending !== null || length === 0 || length > NOTE_LIMIT}
            >
              {pending === "save" ? "Keeping…" : moment ? "Save changes" : "Keep this moment"}
            </button>
          </div>
        </form>
      ) : mode === "delete" ? (
        <>
          <h2 id="moment-title" className="font-serif text-3xl">
            Let this moment go?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            This will permanently remove it from your shelf. You can't undo this.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm leading-relaxed text-clay">
              {error}
            </p>
          )}
          <div className="mt-7 flex flex-wrap justify-end gap-5">
            <button
              className="quiet-button"
              type="button"
              disabled={pending !== null}
              onClick={() => {
                setMode("view");
                setError(null);
              }}
            >
              Keep it
            </button>
            <button
              className="rounded-full bg-clay px-5 py-3 text-sm text-white disabled:opacity-50"
              type="button"
              disabled={pending !== null}
              onClick={() => {
                void remove();
              }}
            >
              {pending === "delete" ? "Removing…" : "Remove for good"}
            </button>
          </div>
        </>
      ) : (
        moment && (
          <>
            <h2 id="moment-title" className="font-serif text-3xl">
              A moment, kept.
            </h2>
            <time className="mt-3 block text-xs text-muted" dateTime={moment.createdAt}>
              {new Date(moment.createdAt).toLocaleDateString(undefined, { dateStyle: "long" })}
            </time>
            <p className="my-8 whitespace-pre-wrap font-serif text-[23px] leading-relaxed [overflow-wrap:anywhere]">
              {moment.body}
            </p>
            <div className="flex items-center justify-between gap-5 border-t border-line pt-5">
              <button
                className="quiet-button text-clay"
                type="button"
                onClick={() => setMode("delete")}
              >
                Remove moment
              </button>
              <button className="primary-button" type="button" onClick={() => setMode("edit")}>
                Edit moment
              </button>
            </div>
          </>
        )
      )}
    </dialog>
  );
}
