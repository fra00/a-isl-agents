# A-ISL — notes for coding agents

This repo’s **runtime is agent-agnostic**. Product work goes through two skills:

1. **`a-isl-spec-author`** — NL → `*.isl.md` only (no `bin-*`)
2. **`a-isl-compile`** — only when the human explicitly asks to compile → `bin-<stack>/`

Canonical skill text: `agent-skills/`. Host copies: `.cursor/skills/`, `.claude/skills/`, `.github/skills/` (`npm run sync-skills`).

Prefer new apps under `projects/<name>-workspace/`. Do not auto-chain Spec → Compile.
