# dejavu

_Little things, felt again._

A local home for the ordinary moments worth keeping: a photo, a few words, a
voice note, or a song link. Collect them on a personal shelf and return whenever
you like.

## Getting started

Use Rust (selected by `rust-toolchain.toml`), Node.js 24, and npm 11.

```sh
npm ci
npm run dev
```

Preview the interface at `http://127.0.0.1:1420`. For the native app, install the
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/), stop the browser
preview process, and run `npm run desktop:dev`.

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
npm run check    # Formatting, TypeScript, ESLint, Rust tests, and Clippy
npm run build    # Frontend production build
cargo server     # Standalone local service
```

The service exposes `GET http://127.0.0.1:4783/api/health`. It runs separately
from the desktop host. Default Cargo commands check the core and server without
desktop system dependencies. Use `--workspace` to include the native crate.

See the [development guide](docs/development.md), [architecture](docs/architecture.md),
and [contribution guide](CONTRIBUTING.md) for full commands and commit conventions.
GitHub CI checks the code and compiles the Linux desktop app.

## Where we are

The foundation includes a quiet desktop shelf illustration, an About dialog,
shared metadata, text-note validation, and the local health endpoint.

Saving moments, persistent storage, photos, voice capture, phone pairing, and
rediscovery are planned. The shelf does not contain saved content yet.
