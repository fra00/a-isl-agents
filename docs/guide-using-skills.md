# Guide: working with the skills

How Spec Author and Compile behave, what to review, and how to evolve a workspace.  
New apps go under [`projects/`](../projects/README.md); `examples/` is for official demos.  
Short path: [Tutorial: first project](./tutorial-first-project.md).  
Technical flow (builder, topo, packet): [How it works](./how-it-works.md).

## The two skills

| Skill | You say | Agent writes |
|-------|---------|----------------|
| `a-isl-spec-author` | What the product should do (NL) | `*.isl.md` only |
| `a-isl-compile` | Explicit compile request | `bin-<stack>/` (+ lock) |

A-ISL does **not** auto-chain Spec → Compile. See [Workflow](./workflow.md).

You usually do **not** need to list module filenames. Describe the behavior; the Spec agent proposes the DAG. Name files yourself only when you care about layout.

## Spec phase tips

- Keep the first project small (a few units).
- Say “Spec only — do not compile” if you want a hard stop.
- Prefer product rules in NL (“decrement must not go below 0”) over implementation details.

### What to review in `.isl.md`

Product sense first (no ISL required): [Review a Spec without knowing ISL](./review-spec.md).

Also skim:

- Header + `**Implementation**`
- Roles and `MUST` constraints
- Acceptance criteria / test scenarios
- `> **Reference**:` links with no cycles

Authoring shape: [ISL Agent Profile](./isl-agent-profile.md).

### Lint

The Spec agent should lint after writes. To run yourself from the repo:

```bash
npm run lint -- examples/<workspace>/<file>.isl.md
```

## Compile phase tips

Explicit requests include: `compila`, `/a-isl-compile`, “build bin”, “regenerate implementation”.

Default agent loop:

```text
preflight → builder → queue --next → packet → [tests then] write bin-<stack>/ → lock
         → (optional) npm run verify
```

### Verify (`npm run verify`)

After Compile, optionally check Spec scenarios that have `id` + `Call`:

```bash
npm run verify -- --root examples/sheet-workspace --stack react-js
npm run verify -- --root examples/sheet-workspace --stack csharp --only domain-sheet
```

Writes `build/verify-status.json` (`pass` | `fail` | `stale` | `skipped`). Lock is unchanged. Details: [How it works — Verify](./how-it-works.md#verify-optional), [EXT-001](./isl-extensions.md#ext-001-spec--compile-tests--verify).

### Lookup declaration (`npm run lookup-decl`)

During Compile, resolve a dependency symbol without opening the whole graph:

```bash
npm run lookup-decl -- --stack react-js --name CalculateSheet --file examples/sheet-workspace/bin-react-js/domain-sheet.js --workspace examples/sheet-workspace
```

Exit `0` / `2` / `3`. Details: [How it works — Lookup](./how-it-works.md#lookup-decl-optional), [EXT-002](./isl-extensions.md#ext-002-dependency-declaration-lookup).

### Choosing the stack (`--stack`)

Default stack is **`react-js`** → output folder **`bin-react-js/`**.

Pass the same `--stack <id>` on **queue** and **packet** (and tell the Compile agent which stack you want):

```bash
# examples
npm run queue -- --root examples/sheet-workspace --next --stack blazor
npm run packet -- --root examples/sheet-workspace --next --stack blazor

npm run queue -- --root examples/sheet-workspace --next --stack winforms
npm run packet -- --root examples/sheet-workspace --next --stack winforms

npm run queue -- --root examples/dungeon-workspace --next --stack react-js
npm run packet -- --root examples/dungeon-workspace --next --stack react-js
```

| `--stack` | Output dir | Role |
|-----------|------------|------|
| `react-js` (default) | `bin-react-js/` | Full app (JS/React) |
| `blazor` | `bin-blazor/` | Full app (Razor + C#) |
| `winforms` | `bin-winforms/` | Full app (WinForms + C#) |
| `csharp` | `bin-csharp/` | Library / classes only |
| `python` / `python-fastapi` | `bin-python/` / `bin-python-fastapi/` | Python stacks |

Optional: `--bin <path>` to override the output folder. Profiles live in `runtime/compile-plan/stacks.config.ts`. Pipeline detail: [How it works](./how-it-works.md#compile-pipeline-runtime--agent).

### Targeted recompile (`--only`)

Re-queue **specific** units even if `gen-lock` says they are unchanged (does not force the whole workspace):

```bash
# next unit among the selected set
npm run queue  -- --root examples/dungeon-workspace --next --only dungeon --stack react-js
npm run packet -- --root examples/dungeon-workspace --next --only dungeon --stack react-js

# several units (walk with --next)
npm run queue -- --root examples/dungeon-workspace --next \
  --only dungeon --only dungeon-use-turn-logic --stack react-js

# packet for exactly one unit by name (no --next)
npm run packet -- --root examples/dungeon-workspace --only dungeon --stack react-js
```

`--only` accepts basename (`dungeon`), `dungeon.isl.md`, or Implementation path (`./dungeon`). Repeat the flag for multiple units.

**Agents by complexity:** compile **leaf** units in one agent batch; give **heavy / hub** units a **fresh agent** with `--only` (heuristics in skill `a-isl-compile` § Agent batching — no product-specific names).

**What to say to the Compile agent** (examples):

```text
/a-isl-compile
Compile examples/sheet-workspace with --stack blazor

/a-isl-compile
Compile examples/dungeon-workspace (react-js)

/a-isl-compile
Recompile only <unit> in <workspace> (--stack …).
Use --only <unit> on queue/packet. Implement every capability in SOURCE; fresh agent if the unit is heavy/hub.
```

If preflight fails, fix Spec first — do not treat hand-patched `bin-*` as the A-ISL path.

## Optional demo UI

Copy the pattern from `examples/connect-four-workspace/demo/`:

- Vite + React `package.json`
- `demo/main.jsx` importing `../bin-react-js/app-shell.jsx`
- `npm install` && `npm run dev` inside the workspace

## Evolving a project

Step-by-step (including `--only` and bugfix): [Change and fix via Spec](./change-via-spec.md).

1. Spec Author — describe the change  
2. Review / lint  
3. Explicit Compile for affected units (`--only`)  

Examples to study: [connect-four-workspace](../examples/connect-four-workspace/README.md), [sheet-workspace](../examples/sheet-workspace/README.md).
