# dejavu

*Little things, felt again.*

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

The Rust workspace contains `crates/core` (shared types and validation) and
`crates/server` (the local Axum adapter). The desktop shell is coming next.

```sh
cargo test --workspace --locked
cargo server
```

The service listens on `127.0.0.1:4783`; `GET /api/health` reports its status.
`DEJAVU_ADDR` can select another loopback address. Network access and phone
pairing are not enabled yet. Use `RUST_LOG=debug` for detailed service logs.

Before committing, run `cargo fmt --all -- --check` and `cargo lint`.

Early development. Saving moments, storage, and phone capture are not implemented yet.
