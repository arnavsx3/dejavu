# Contributing

Start with the [development guide](docs/development.md) and
[architecture notes](docs/architecture.md).

Keep changes small enough to review as one idea. Include behavior, relevant
tests, and documentation in the same commit. Use Conventional Commit messages:

```text
feat(core): add a new application behavior
fix(server): handle a specific failure
docs: clarify local setup
chore(ci): update a development check
```

Run `npm run check` (including React and TypeScript linting) before committing
and `npm run build` when changing the
interface. Native changes also need the full Rust workspace checks and a Tauri
build on a machine with its prerequisites installed. See the development guide
for the exact commands.

Inspect the staged diff before committing. Keep build output, secrets, and
personal memories out of the repository. Commit and push each completed,
validated chunk; avoid collecting unrelated work into a large final commit.

When opening a pull request, explain the resulting behavior and how it was
verified. State any material limitation, including a native build you could not
run locally. Do not describe planned functionality as already implemented.
