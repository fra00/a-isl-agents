# Sheet workspace (A-ISL demo)

Spreadsheet demo: **A1 literals + `=A1+B2` arithmetic**, with **cycle detection** as a domain error. Showcases pure parser / graph / evaluator modules vs store and UI.

## NL brief

> Editable grid (A–H × 1–20). Formula bar commits raw text. Formulas support `+ - * /`, parentheses, and A1 refs. If formulas form a reference cycle, affected cells show `cycle` and are not numerically evaluated. Parse failures surface `parse_error`.

## Modules

| File | Role |
|------|------|
| `domain-sheet.isl.md` | Domain |
| `formula-parser.isl.md` | Business Logic |
| `dependency-graph.isl.md` | Business Logic |
| `formula-evaluator.isl.md` | Business Logic |
| `sheet-store.isl.md` | Backend |
| `use-sheet.isl.md` | Business Logic |
| `formula-bar.isl.md` | Presentation |
| `grid-page.isl.md` | Presentation |
| `app-shell.isl.md` | Presentation |

## Why this showcases A-ISL

- Cycle check is an explicit Logic unit (`dependency-graph`), not buried in UI
- Parser and evaluator stay pure; store stays dumb
- Changing cycle policy or grammar → recompile only those units

## Smoke

```bash
npm run lint -- examples/sheet-workspace/domain-sheet.isl.md
npm run builder -- examples/sheet-workspace
npm run queue -- --root examples/sheet-workspace --json
```

Compile with skill `a-isl-compile` when Spec is accepted.

### Verify (EXT-001)

Pilot units `domain-sheet`, `formula-evaluator`, and `dependency-graph` have verify-eligible scenarios (`id` + `Call`). Generated tests live beside impl (`*.test.js` / `*.Tests.cs`). Harness under `verify/`.

```bash
npm run verify -- --root examples/sheet-workspace --stack react-js
npm run verify -- --root examples/sheet-workspace --stack csharp
```

Other units without eligible scenarios are reported as `skipped`.

## Run demo UI (react-js)

```bash
cd examples/sheet-workspace
npm install
npm run dev
```

Opens a Vite app on port 5174 that mounts `bin-react-js/app-shell.jsx` with an in-memory `SheetStore`.

Multi-stack story (React + Blazor + WinForms): [Same Spec, many stacks](../../docs/same-spec-many-stacks.md).

## Stack model (.NET)

| Stack | Role |
|-------|------|
| `csharp` | Library / headless only — classes + smoke (`bin-csharp/`) |
| `blazor` | Full app in one folder — Razor UI **and** engine (`.cs`) in `bin-blazor/` |
| `winforms` | Full desktop app in one folder — Forms **and** engine in `bin-winforms/` |

Same idea as `react-js`: an **app** stack owns UI + logic. Use `csharp` when you only want classes, not a UI host.

### Blazor app (monolithic)

`bin-blazor/` holds UI (`.razor`) **and** engine (`.cs`). Host mounts only that folder (no `bin-csharp`):

```bash
dotnet run --project examples/sheet-workspace/demo-blazor/SheetBlazor.csproj
```

### WinForms app (monolithic)

`bin-winforms/` holds UI (Forms/controls) **and** engine (`.cs`). Host mounts only that folder (no `bin-csharp` / `bin-blazor`):

```bash
dotnet run --project examples/sheet-workspace/demo-winforms/SheetWinForms.csproj
```

Requires Windows + a .NET SDK with Windows Forms targeting (`net10.0-windows`).

### C# library (optional)

After `--stack csharp` compile:

```bash
dotnet run --project examples/sheet-workspace/bin-csharp/Sheet.Core.csproj
```

Compile (pass the same flag on queue and packet):

```bash
npm run queue  -- --root examples/sheet-workspace --next --stack blazor
npm run packet -- --root examples/sheet-workspace --next --stack blazor
```

| `--stack` | Output |
|-----------|--------|
| `react-js` (default) | `bin-react-js/` |
| `blazor` | `bin-blazor/` |
| `winforms` | `bin-winforms/` |
| `csharp` | `bin-csharp/` (library only) |

How to ask the agent: [Choosing the stack](../../docs/guide-using-skills.md#choosing-the-stack---stack).
