# Getting started

Overview: [What is A-ISL](./what-is-a-isl.md). Multi-stack demo: [Same Spec, many stacks](./same-spec-many-stacks.md). Index: [Docs](./README.md).

## Prerequisites

- Node.js 18+
- A coding agent that loads project skills, e.g. [Cursor](https://cursor.com) (`.cursor/skills/`), [Claude Code](https://code.claude.com) (`.claude/skills/`), or [GitHub Copilot](https://docs.github.com/en/copilot) (`.github/skills/`). Primary testing so far: **Cursor**; other hosts use the same skill text but are not separately validated yet.
- For Blazor / WinForms demos: a .NET SDK (WinForms needs Windows targeting)

## Install

```bash
npm install
npm --prefix runtime/lint install
```

## Run the sheet demos (bins already present)

Same Spec, three hosts — no compile required to try them:

```bash
# React
cd examples/sheet-workspace && npm install && npm run dev

# Blazor
dotnet run --project examples/sheet-workspace/demo-blazor/SheetBlazor.csproj

# WinForms (Windows)
dotnet run --project examples/sheet-workspace/demo-winforms/SheetWinForms.csproj
```

More context: [Same Spec, many stacks](./same-spec-many-stacks.md).

## Where projects go

| Path | Role |
|------|------|
| [`projects/`](../projects/README.md) | **Your** workspaces (`projects/<name>-workspace/`) |
| `examples/` | Official demos of this repo only |
| `benchmarks/` | Internal evaluation |

Do not put personal apps under `examples/`.

## Use the skills

1. Open this folder in your agent host; ensure skills are synced (`npm run sync-skills` if you edited `agent-skills/`).
2. **Spec:** skill `a-isl-spec-author` — the **agent** writes/edits `*.isl.md` under `projects/<name>-workspace/` (or study an `examples/` demo).
3. Review the Spec ([checklist](./review-spec.md)).
4. **Compile:** skill `a-isl-compile` — only after an explicit ask; the **agent** writes `bin-<stack>/` next to the Spec.
   Default stack is `react-js`. For another profile, say which stack and use `--stack` on queue/packet (e.g. `--stack blazor`). See [Choosing the stack](./guide-using-skills.md#choosing-the-stack---stack).

Gate rules: [Workflow](./workflow.md).  
Hands-on: [Tutorial: first project](./tutorial-first-project.md).  
Day-to-day: [Guide: skills](./guide-using-skills.md).

## Tooling smoke (optional)

Checks graph/lint/queue — not a substitute for running the UIs:

```bash
npm run lint -- examples/connect-four-workspace/domain-game.isl.md
npm run builder -- examples/connect-four-workspace
npm run queue -- --root examples/connect-four-workspace --json
```

## Tests

```bash
npm test
```
