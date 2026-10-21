# dejavu

_Little things, felt again._

A local home for the ordinary moments worth keeping: a photo, a few words, a
voice note, or a song link. Collect them on a personal shelf and return whenever
you like.

## Getting started

Use Rust (selected by `rust-toolchain.toml`), Node.js 24, and npm 11.

```sh
npm ci
npm run desktop:dev
```

Install the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) before
launching the native app. To preview the interface in a browser instead, use
`npm run dev` at `http://127.0.0.1:1420`. Browser preview does not save moments.
Stop one development command before starting the other.

## Repository

| Path                     | Responsibility                               |
| ------------------------ | -------------------------------------------- |
| `crates/core`            | Shared Rust application types and validation |
| `crates/server`          | Local Axum HTTP adapter, powered by Tokio    |
| `crates/store`           | Local SQLite persistence and migrations      |
| `apps/desktop/src`       | React + TypeScript, Vite, and Tailwind       |
| `apps/desktop/src-tauri` | Tauri host and native commands               |
| `docs`                   | Development setup and architecture           |

## Development

```sh
npm run check    # Formatting, types, lint, frontend/Rust tests, and Clippy
npm run build    # Frontend production build
cargo server     # Standalone local service
```

The service exposes `GET http://127.0.0.1:4783/api/health`. It runs separately
from the desktop host. Default Cargo commands check the core, store, and server without
desktop system dependencies. Use `--workspace` to include the native crate.

See the [development guide](docs/development.md), [architecture](docs/architecture.md),
and [contribution guide](CONTRIBUTING.md) for full commands and commit conventions.
GitHub CI checks the code and compiles the Linux desktop app.

## Keep your first moment

Choose **Keep a moment**, add photos, write a few words, or keep both together.
Your collection becomes a wall of overlapping prints, magnets, and paper notes.
Open a moment to read, edit, or remove it; open a print to see the whole photo. Close and reopen dejavu: saved moments stay on your shelf.
The app stores them in SQLite in your application-data folder, outside the repo.
See the [usage guide](docs/usage.md) for storage details and handling unsaved drafts.

Text and photo moments are implemented. Each moment can hold six JPEG, PNG, or
WebP photos, with an optional caption. Recordings, song links, phone capture,
and rediscovery remain planned.
