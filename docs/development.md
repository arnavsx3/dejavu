# Development

## Requirements

- Rust 1.99.0 with Clippy and rustfmt. Rustup reads `rust-toolchain.toml`.
- Node.js 24.21.0 (also in `.node-version`) and npm 11.
- The frontend uses React, TypeScript, Vite, and Tailwind. `npm ci` installs the
  exact dependency versions from the shared lockfile.
- Platform libraries for native builds, as described in the
  [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

On Ubuntu or Debian, install native prerequisites with:

```sh
sudo apt update
sudo apt install build-essential pkg-config libwebkit2gtk-4.1-dev \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

The browser preview, core tests, and server do not need those desktop libraries.

## First run

From the repository root:

```sh
npm ci
npm run dev
```

This opens a development server at `http://127.0.0.1:1420`. Visit it in a browser
to preview the interface; native commands are unavailable there. To use the
desktop host instead, stop that preview process and run:

```sh
npm run desktop:dev
```

Tauri starts Vite itself. Do not run both commands at the same time: the Vite port
is deliberately fixed so a collision produces an error rather than silently
changing the native app's URL.

## Local HTTP service

```sh
cargo server
curl --fail http://127.0.0.1:4783/api/health
```

The desktop app does not need this process yet. The response includes service
status and shared application metadata. Ctrl+C or SIGTERM stops it gracefully.

| Setting       | Default          | Purpose                                           |
| ------------- | ---------------- | ------------------------------------------------- |
| `DEJAVU_ADDR` | `127.0.0.1:4783` | Listener socket address; loopback only            |
| `RUST_LOG`    | `info`           | Tracing filter, for example `dejavu_server=debug` |

Variables are read from the process environment. `.env` files are ignored by
Git but are **not** loaded automatically. Use `export` in your shell or your
editor's environment configuration. The code does not log note content.

## Checks and builds

```sh
npm run check
npm run build
```

`check` verifies Prettier formatting, strict TypeScript checks, type-aware ESLint
rules (including React hooks and Fast Refresh), Rust formatting, all core/server
tests, and Clippy with warnings treated as errors. It uses the checked-in
lockfiles. `build` creates the frontend assets only.

For a native change, also run:

```sh
cargo clippy --workspace --all-targets --locked -- -D warnings
npm run desktop:build -- --debug --no-bundle
```

The latter compiles the native desktop executable without creating installers.
GitHub CI runs these native checks on Ubuntu 24.04 with the platform libraries
installed. macOS and Windows are not yet verified by CI.

Useful individual commands:

```sh
npm run format                  # Format web files, JSON, YAML, and Markdown
cargo fmt --all                 # Format Rust
cargo test --locked             # Core and service tests
cargo lint                      # Core and service Clippy checks
npm run typecheck               # TypeScript only
npm run lint                    # Typed ESLint and React checks
```

## Dependencies and generated files

Use `npm ci` for a clean install. Change dependencies intentionally with
`npm install`, then commit `package-lock.json`. Cargo changes must include the
root `Cargo.lock`; normal builds and CI use `--locked`. Keep shared Rust
dependencies in the root workspace manifest when multiple crates need them.
Keep TypeScript within the supported peer range of typescript-eslint; update
the compiler and lint tooling together rather than overriding dependency checks.

`target/`, `node_modules/`, frontend `dist/`, Tauri's generated schemas, and local
data are ignored. Application icons are intentionally tracked inputs for native
builds. Their source is `apps/desktop/public/icon.svg`; regenerate them with
`tauri icon` from the desktop package when the identity changes.

Use focused commits, stage explicit paths, inspect the staged diff, and push each
completed chunk. Avoid force-pushes or rewriting published history.
