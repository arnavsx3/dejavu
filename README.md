# dejavu

_Little things, felt again._

A local home for the ordinary moments worth keeping: a photo, a few words, a voice note, or a song link. Collect them on a personal shelf and return whenever you like.

## Planned stack

- **Rust** for the application core.
- **Tauri** for the desktop app.
- **Axum** for a phone capture page on your local network.
- **Tokio** for uploads, connections, and background tasks.

## First steps

- A shelf of saved moments.
- Text, photos, and short voice recordings.
- Capture from your phone by scanning a QR code.
- Rediscover an old moment at random.

## Development

The Rust workspace contains `crates/core` (shared types and validation),
`crates/server` (the local Axum adapter), and `apps/desktop/src-tauri` (the native
desktop shell). The desktop interface uses TypeScript and Vite.

Use Node.js 24 and the Rust toolchain selected by `rust-toolchain.toml`.

```sh
npm ci
npm run dev          # Browser preview
npm run desktop:dev  # Native app; requires Tauri system prerequisites
```

Native development requires the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).
The desktop shell currently contains an empty shelf and an About dialog.
The desktop app does not start the HTTP service automatically.

```sh
cargo test --locked
cargo server
```

The service listens on `127.0.0.1:4783`; `GET /api/health` reports its status.
`DEJAVU_ADDR` can select another loopback address. Network access and phone
pairing are not enabled yet. Use `RUST_LOG=debug` for detailed service logs.

Before committing, run `cargo fmt --all -- --check`, `cargo lint`, and
`npm run typecheck`. Default Cargo commands test the core and server without
requiring desktop libraries; use `--workspace` to include the desktop crate.

Early development. Saving moments, storage, and phone capture are not implemented yet.
