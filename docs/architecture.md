# Architecture

dejavu is a desktop home for personal memories. Its complete capture flows include
text and photo moments: create, reopen, edit, and remove a moment locally.

```text
dejavu/
├── apps/desktop/
│   ├── src/                 React + TypeScript and Tailwind theme
│   │   ├── components/      Shelf, reader, editor, and dialogs
│   │   ├── lib/             Typed native bridges and errors
│   │   └── test/            Browser-test setup (no real personal data)
│   ├── public/              Local static assets and source icon
│   └── src-tauri/           Tauri lifecycle, state, and asynchronous commands
├── crates/
│   ├── core/                Validated notes, moments, and application metadata
│   ├── server/              Independent Axum adapter and Tokio process
│   └── store/               SQLite persistence and versioned migrations
├── docs/                    Architecture, development, and usage
└── .github/                 CI and pull request template
```

## Boundaries

`dejavu-core` has no UI, network, or storage dependency. `TextNote` trims surrounding
whitespace, rejects blank notes, and limits text to 16,000 Unicode scalar values
rather than UTF-16 code units or grapheme clusters. `Moment` combines validated
text, photo metadata, a UUID, and UTC creation/update timestamps. A moment with
photos may have an empty caption; a text-only moment cannot be blank. Core defines
the six-photo limit.

`dejavu-store` owns SQLite and migration SQL. It validates moment contents, uses
parameterized queries, and returns typed moments. Schema 2 adds ordered photo BLOBs
and cascading ownership; schema 1 text memories migrate without changing IDs or
timestamps. Caption changes, photo additions, and photo removals share one
transaction, with ownership and revision checks. Full images and thumbnails are
read separately from the metadata list. New databases use schema 2;
newer schemas or unreadable data produce errors rather than a reset. Writes use
SQLite's durability guarantees. Stable creation order and IDs survive edits.
Atomic revision checks reject stale edits and deletes, including changes from
another app instance. Unix database files are owner-readable and owner-writable.

The native host resolves the application-data location once. Commands validate
text in Rust and use blocking workers to open the store and perform an operation,
keeping filesystem, image decoding, and SQLite work off the UI thread. Each operation closes its
connection afterward. The frontend cannot choose a database path or execute SQL.
The file picker reads only files selected by the user. Its draft stores base64
alongside the selected `File`; the native importer checks actual format, compressed
size, dimensions, and decoder allocation limits before normalizing orientation
and encoding a full-size JPEG plus a 640-pixel thumbnail. Only JPEG, PNG, and WebP
decoders are enabled. No arbitrary filesystem path or asset protocol is exposed.
Original file names and EXIF metadata are not stored. The database owns all image
bytes, so failed transactions and cascading deletes cannot leave attachment files.
`secure_delete` clears freed SQLite content; this is not a forensic erasure promise
for WAL files, backups, or filesystem snapshots.

Errors have stable codes and safe messages without note contents or private paths.

The independent Axum service still exposes only `GET /api/health` and accepts
loopback listeners. Desktop storage uses Tauri commands directly and does not need
that service. Phone pairing and authenticated LAN capture are future work.

## Frontend

Vite builds React with Tailwind's Vite plugin. `index.html` is the entry document;
`src/main.tsx` mounts `App` in Strict Mode. The shelf loads from Rust on each launch
and supports manual refresh. A failed load remains a visible error, not a false
empty collection. Saving and deleting update the shelf only after native success.

`MomentShelf` arranges up to three thumbnail prints per moment with CSS rotations,
magnets, and caption scraps; the reader includes every attached photo.
`MomentDialog` handles reading, caption/photo editing, deletion confirmation, and
unsaved-draft protection. `PhotoViewer` uses a separate native dialog for full
images, keyboard navigation, zoom, and focus restoration. Pending writes disable repeat actions and dismissal. Failed saves keep
the draft available for retry or copying. User text is rendered through React text
nodes, never HTML interpolation. Successful saves return focus to the keep button.

`src/lib/moments.ts` centralizes IPC names, payloads, revisions, and error handling.
Photo bytes travel through binary IPC responses. `PhotoImage` creates object URLs
for its mounted image and revokes them on close or replacement, ignoring late
responses after unmount. CSP permits these local `blob:` images without allowing
remote image hosts or broad filesystem access.

Browser previews explicitly disable persistence; there is no second browser-only
storage implementation. Real data lives in SQLite. `src/styles.css` holds Tailwind
tokens and a few repeated styles; component layout uses utility classes.

The window has no filesystem, shell, or plugin permissions. The Rust command
surface is explicit. Production has a restrictive content security policy; the
separate development policy supports Vite and React refresh. Assets are local.

## Workspaces and checks

The Cargo workspace shares metadata, dependencies, lints, and one lockfile.
Default members are core, store, and server, so headless checks do not require
platform UI libraries. `--workspace` includes the native host. The npm workspace
has one desktop package and one root lockfile.

Store tests use temporary synthetic databases and verify reopening, CRUD, ordering,
stale-write protection, schema compatibility, and corrupt data handling. Native
worker tests run without opening windows. Vitest and Testing Library cover IPC,
the editor, draft protection, failure/retry paths, and the complete shelf flow.
CI also compiles the Linux desktop executable.

## Next slices

Voice recordings, song links, phone pairing, pagination, and rediscovery
remain future work. Add them as complete user flows rather than placeholder UI.
