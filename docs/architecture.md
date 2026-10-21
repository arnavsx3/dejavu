# Architecture

dejavu is a desktop home for personal memories, with a future phone capture
interface. Start with clear boundaries and add infrastructure as real features
need it.

```text
dejavu/
├── apps/desktop/
│   ├── src/                 TypeScript interface and visual theme
│   ├── public/              Local static assets and source icon
│   └── src-tauri/           Tauri host, commands, and capabilities
├── crates/
│   ├── core/                Shared types and application validation
│   └── server/              Axum router and standalone Tokio process
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

## Data and trust boundaries

There is no persistence layer yet. `TextNote` is validated in memory; no UI or
HTTP route saves it. Actual storage and attachment handling belong to a future
feature, with data kept in the platform application-data directory rather than
the checkout. Reserve `.local/` for ignored, disposable developer data.

The HTTP listener accepts loopback addresses only. LAN capture will need an
explicit lifecycle, short-lived pairing, request limits, and validated uploads
before the listener can be exposed to a phone.

The native window has no filesystem, shell, or plugin permissions. Application
commands are registered explicitly. Production assets use a content security
policy, with a separate development policy for Vite hot reload. Do not load
remote code or render user content through HTML interpolation.

## Current slice and next slice

Implemented: a desktop shelf illustration and About dialog, shared metadata,
text validation, and a health endpoint. The illustration is decorative and does
not represent saved content.

Next: persist one text moment, show it on the shelf, restart the app, and verify
that it survives. Build that end-to-end flow before adding photos, recordings,
QR pairing, or rediscovery.
