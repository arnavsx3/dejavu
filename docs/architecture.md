# Architecture

dejavu is a desktop home for personal memories, with a future phone capture
interface. Start with clear boundaries and add infrastructure as real features
need it.

```text
dejavu/
├── apps/desktop/
│   ├── src/                 React + TypeScript and Tailwind theme
│   ├── public/              Local static assets and source icon
│   └── src-tauri/           Tauri host, commands, and capabilities
├── crates/
│   ├── core/                Shared types and application validation
│   └── server/              Axum router and standalone Tokio process
│   └── store/               SQLite persistence and migrations
├── docs/                    Architecture and development guides
└── .github/                 CI and pull request template
```

## Dependency direction

Both native commands and HTTP handlers depend on `dejavu-core`. The core has no
knowledge of either transport. Domain validation runs at construction boundaries,
so adapters can share the same rules. The first domain type is `TextNote`: it
rejects blank text and limits notes to 16,000 Unicode scalar values after trimming
surrounding whitespace. This is not a grapheme-cluster count.

The desktop UI calls the narrow `app_info` Tauri command. It does not make HTTP
requests. The Axum service currently runs independently and exposes only
`GET /api/health`. Tauri owns its desktop runtime; the standalone service owns
its Tokio runtime. They are separate processes today.

The root Cargo workspace shares metadata, dependencies, lint rules, and one
lockfile. Default members are core and server, allowing ordinary tests to run
without platform UI libraries. `--workspace` includes the native host.
The npm workspace has one desktop package and one root lockfile.

## Frontend

Vite builds the React application and integrates Tailwind through its Vite
plugin. `index.html` is the document entry point; the interface itself lives in
React components. `src/main.tsx` mounts the app in Strict Mode, and `src/App.tsx`
composes the shell. `src/components` holds the shelf scene, decorative SVG art,
and the accessible native HTML dialog. The dialog keeps the browser's modal
focus behavior and Escape handling.

`src/styles.css` imports Tailwind, defines the shared color and font tokens, and
contains a small set of base and repeated component styles. Layout and responsive
styling use utility classes. `src/lib/app-info.ts` is the native metadata bridge;
components do not need to know how Tauri is called. Browser previews show a
preview message rather than pretending native commands are available.

## Data and trust boundaries

`crates/store` persists validated text moments in SQLite. Its versioned schema
keeps stable UUIDs and creation/update timestamps. Atomic revision checks reject
stale edits and deletes. Reopening the database preserves all changes; unreadable
data or a newer schema produces an error instead of resetting the database.
The database is private to its owner on Unix. Native commands and the shelf UI
are the next integration step. Data belongs in the platform application-data
directory rather than the checkout. Reserve `.local/` for ignored, disposable
developer data.

The HTTP listener accepts loopback addresses only. LAN capture will need an
explicit lifecycle, short-lived pairing, request limits, and validated uploads
before the listener can be exposed to a phone.

The native window has no filesystem, shell, or plugin permissions. Application
commands are registered explicitly. Production assets use a content security
policy, with a separate development policy for Vite hot reload and React's
development preamble. Do not load
remote code or render user content through HTML interpolation.

## Current slice and next slice

Implemented: a desktop shelf illustration and About dialog, shared metadata,
text validation, and a health endpoint. The illustration is decorative and does
not represent saved content.

Next: persist one text moment, show it on the shelf, restart the app, and verify
that it survives. Build that end-to-end flow before adding photos, recordings,
QR pairing, or rediscovery.
