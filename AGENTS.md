# Working on dejavu

Read `README.md` and the relevant files in `docs/` before changing the project.
Keep the product warm, quiet, and local. Personal memories must not become test
fixtures, logs, analytics, or committed files.

## Boundaries

- `crates/core` owns application types and validation. It must not depend on
  Tauri, Axum, the filesystem, or a database.
- `crates/server` owns HTTP routing and the standalone Tokio process.
- `crates/store` owns SQLite persistence and migrations. Run database work on
  blocking workers, keep note validation in core, and never reset unreadable data.
- `apps/desktop/src-tauri` owns native commands and the desktop lifecycle.
- `apps/desktop/src` owns presentation through React components and Tailwind
  utilities. Keep shared visual tokens in `src/styles.css` and native bridge calls
  in `src/lib`. Put business rules in Rust.
- Add abstractions and dependencies when a concrete feature needs them. Avoid
  empty placeholder packages or speculative services.
- Keep the service on loopback until authenticated phone pairing is implemented.
- Keep desktop capabilities minimal and the production content security policy
  restrictive. Treat incoming text as text, not HTML.

## Checks

- After `npm ci`, `npm run check` runs formatting, TypeScript checks, typed ESLint
  and React hooks checks, frontend behavior tests, Rust tests, and Clippy for the headless workspace members.
- Run `npm run build` for frontend changes.
- With Tauri system libraries installed, run
  `cargo clippy --workspace --all-targets --locked -- -D warnings` and
  `npm run desktop:build -- --debug --no-bundle` for native changes. CI checks
  the Linux native build; report a local prerequisite limitation honestly.
- Add meaningful tests for behavior and failure cases. Do not add tests that
  merely restate static markup or configuration.
- Do not suppress a failing check to make it pass. Fix the cause or document an
  actual environment limitation.

## Commit hygiene

The owner requests frequent, focused commits and pushes.

- Complete one coherent chunk, run its relevant checks, inspect the staged diff,
  commit it, and push it before starting the next chunk.
- Use Conventional Commit titles, for example `feat(core): validate text notes`
  or `fix(server): reject invalid listener configuration`.
- Stage explicit paths. Never include unrelated changes or generated build output.
- Commit both application lockfiles when dependencies change.
- Keep commits buildable; include related tests and documentation together.
- Do not amend published commits, rewrite history, or force-push unless asked.
- Do not change repository visibility, create releases, or publish packages as
  part of ordinary development.

## Runtime and data hygiene

- Tests must use synthetic moments and temporary databases. Never clear or reseed
  a person's application-data folder as a testing shortcut.
- Stop any app or development server started for verification when finished,
  unless the user asks to leave it open. Keep system and unrelated app services
  running. Identify listener ownership before stopping a process.
- Keep browser previews explicit about their lack of native persistence. Do not
  create a second storage implementation just to make previews look functional.
