# Same Spec, many stacks

One sheet Spec (`examples/sheet-workspace/*.isl.md`) compiles to three runnable UIs in two languages. Product intent stays in the `.isl.md` files; the stack profile chooses how compile writes `bin-<stackId>/`.

## Outputs

| Stack | Language | Output | Host |
|-------|----------|--------|------|
| `react-js` | JavaScript | `bin-react-js/` | Vite `demo/` |
| `blazor` | C# + Razor | `bin-blazor/` (UI and engine) | `demo-blazor/` |
| `winforms` | C# + WinForms | `bin-winforms/` (UI and engine) | `demo-winforms/` |

Behavior matches across hosts: formulas, A1 refs, cycle → `cycle`, parse fail → `parse_error`.

## What changes at compile time

| Unchanged | Chosen per compile |
|-----------|-------------------|
| Sheet `*.isl.md` | `--stack` (`react-js` / `blazor` / `winforms`) |
| Domain / formula rules | Thin host that mounts that stack’s `bin-*` |

`--stack csharp` is optional and **library-only** (classes / smoke). Full apps use `blazor` or `winforms` so UI and engine sit in one `bin-<stackId>/`, as with `react-js`.

## Run

```bash
# React
cd examples/sheet-workspace && npm install && npm run dev

# Blazor
dotnet run --project examples/sheet-workspace/demo-blazor/SheetBlazor.csproj

# WinForms (Windows)
dotnet run --project examples/sheet-workspace/demo-winforms/SheetWinForms.csproj
```

To regenerate a stack after Spec is accepted, ask Compile explicitly and pass **`--stack`** on queue/packet:

```bash
npm run queue  -- --root examples/sheet-workspace --next --stack blazor
npm run packet -- --root examples/sheet-workspace --next --stack blazor
```

```text
/a-isl-compile
Compile examples/sheet-workspace with --stack blazor
```

Full flag table: [Guide: choosing the stack](./guide-using-skills.md#choosing-the-stack---stack). Also [How it works](./how-it-works.md), [sheet README](../examples/sheet-workspace/README.md).

## Role in A-ISL

Code generation alone is not the point. The Spec is the reviewable contract; stacks are compile profiles. You accept intent once, then produce side-by-side implementations under `bin-<stackId>/`.
