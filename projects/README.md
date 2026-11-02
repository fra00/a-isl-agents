# User projects

Put **your** A-ISL workspaces here — not under `examples/` or `benchmarks/`.

| Path | Role |
|------|------|
| `projects/<name>-workspace/` | Your Spec (`.isl.md`) + `bin-<stack>/` + optional `demo/` |
| `examples/` | Official demos of this repo only (sheet, connect-four, dungeon, …) |
| `benchmarks/` | Internal evaluation suites |

## New project

From the repo root in Cursor:

```text
/a-isl-spec-author

Create <what you want> under projects/<name>-workspace.
Spec only — do not compile.
```

Then review ([Review Spec](../docs/review-spec.md)) and explicitly compile:

```text
/a-isl-compile

Compile projects/<name>-workspace
```

CLI tools use `--root projects/<name>-workspace` the same way as examples.

## Git

Workspace contents under `projects/` (except this README) are gitignored by default so forks do not commit personal apps upstream. Force-add if you intentionally version a shared sample here.
