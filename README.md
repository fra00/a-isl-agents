# A-ISL for agents

**Status:** experimental prototype — usable demos and an internal bench; APIs, skills, and claims can still change.

A-ISL is an experimental take on **[spec-driven development](docs/why-a-isl.md#spec-driven-by-design)** (same family as tools like GitHub Spec Kit or Kiro): the Spec is the contract; implementation is derived. Here the Spec is classic [ISL](https://github.com/fra00/isl-specification) (`.isl.md`).

**Agents write both halves.** You do **not** hand-author ISL or the app. In your coding agent you describe the product in natural language; the agent, guided by the **`a-isl-spec-author`** skill, writes valid `*.isl.md`. After you review that Spec, you explicitly ask to compile; the agent, guided by **`a-isl-compile`**, regenerates `bin-<stack>/` (React, Blazor, WinForms, C# library, …). Same Spec can ship on more than one stack without rewriting intent.

**Human-in-the-loop by design** — not an autopilot. You steer product intent and accept the Spec; the agent fills in ISL structure and code. Spec never auto-chains into `bin/`.

You do **not** need to know ISL grammar or a programming language. You **do** need to decide what the product should do and accept the Spec before compile. A-ISL does not invent the product for you — it translates **your** declared intent into regenerable code. Details: [Who decides what](docs/what-is-a-isl.md#who-decides-what-responsibility).

**When it pays off:** modules, evolution, multi-stack. For a one-shot script or a single UI patch, a normal prompt is enough — Spec→Compile costs more turns/tokens on purpose. Fit / non-fit: [Why A-ISL](docs/why-a-isl.md#when-it-fits).

**A-ISL** = **A**gent-compilable **I**ntent **S**pecification **L**anguage: runtime + **agent skills** on classic ISL (no paid Generator API; not a language fork; not `isl-generator`). The **runtime is agent-agnostic**. Skills ship for **Cursor**, **Claude Code**, and **GitHub Copilot** (canonical source: `agent-skills/`; synced copies under `.cursor/skills/`, `.claude/skills/`, `.github/skills/`).

```text
You (NL product intent)
        ↓
Coding agent + skill a-isl-spec-author  →  *.isl.md   (you review; you do not write ISL)
        ↓  explicit “compile”
Coding agent + skill a-isl-compile      →  bin-<stack>/
```

### See it

Same sheet Spec, three hosts:

```bash
# React
cd examples/sheet-workspace && npm install && npm run dev

# Blazor
dotnet run --project examples/sheet-workspace/demo-blazor/SheetBlazor.csproj

# WinForms (Windows)
dotnet run --project examples/sheet-workspace/demo-winforms/SheetWinForms.csproj
```

Background: [Same Spec, many stacks](docs/same-spec-many-stacks.md).

### Start here

1. [What is A-ISL](docs/what-is-a-isl.md) — definition, responsibility, boundaries  
2. [Getting started](docs/getting-started.md) — install + agent skills  
3. [First-project tutorial](docs/tutorial-first-project.md) — Spec → Compile once  
4. [Review Spec](docs/review-spec.md) · [Change via Spec](docs/change-via-spec.md) · [Evaluation](docs/evaluation.md)  
5. [Why A-ISL](docs/why-a-isl.md) · [Workflow](docs/workflow.md) · [Docs index](docs/README.md)

### Two skills (human gate between them)

These are Agent Skills: the **coding agent** runs them; you invoke them with NL (e.g. `/a-isl-spec-author`, `/a-isl-compile`).

| Skill | Who writes | Job |
|-------|------------|-----|
| `a-isl-spec-author` | **Agent** | Your NL → valid `*.isl.md` only (no `bin-*`) |
| `a-isl-compile` | **Agent** | Builder → packet → write `bin-<stack>/` → lock |

The gate is a **principle**, not a shortcut: ask to compile (`compila`, `/a-isl-compile`, …) only after you accept the Spec the agent wrote. Stack flag: [Choosing the stack](docs/guide-using-skills.md#choosing-the-stack---stack). Workflow: [docs/workflow.md](docs/workflow.md).

| Host | Skills path |
|------|-------------|
| Cursor | `.cursor/skills/` |
| Claude Code | `.claude/skills/` |
| GitHub Copilot | `.github/skills/` |

Canonical: [`agent-skills/`](agent-skills/README.md). After editing there: `npm run sync-skills`.

### Setup

```bash
npm install
npm --prefix runtime/lint install
npm run sync-skills   # refresh host skill copies
```

Open this folder in your agent IDE; invoke `/a-isl-spec-author` then (after review) `/a-isl-compile`.

### Demos

| Example | What it shows |
|---------|----------------|
| [`examples/sheet-workspace`](examples/sheet-workspace) | Formulas + cycles; one Spec → React, Blazor, WinForms |
| [`examples/connect-four-workspace`](examples/connect-four-workspace) | Rules, modes, UI from Spec → Compile |
| [`examples/dungeon-workspace`](examples/dungeon-workspace) | Larger game Spec (**react-js** only) |

### Evaluation (what we measured)

Internal bench of **A-ISL pipeline generation quality** vs a single-prompt baseline on a frozen Domain/Logic oracle (not a proof that “spec-driven” is valid).

| Campaign | Stack | First full-pass | Final |
|----------|-------|----------------:|------:|
| A-ISL series-2 | react-js | 5/5 @ 27/27 | 5/5 |
| Baseline prompt | react-js | 5/5 @ 27/27 | 5/5 |
| A-ISL series-csharp | csharp | 5/5 @ 27/27 | 5/5 |
| Baseline csharp (open DTO) | csharp | **1/5** | 5/5 |
| Baseline csharp + record DTO rule | csharp | **5/5** | 5/5 |

**Reading:** JS parity (ceiling tie). On C#, A-ISL beat an open-DTO prompt on first-pass (interop/shape); with the same prefer-`record` rule in the prompt, baseline **tied** A-ISL at 5/5 — the gap was DTO guidance, not Spec→Compile on this oracle. Cost (Spec phase, turns/tokens) unmeasured. Full honesty: **[Evaluation](docs/evaluation.md)**.

```bash
npm run bench          # smoke (tariffe)
npm run bench:v2       # after /a-isl-compile benchmarks/tariffe-v2
```

### Runtime scripts

| Script | Purpose |
|--------|---------|
| `npm run builder -- <project>` | Deterministic `.build.md` / manifest |
| `npm run queue -- --root <project> --next [--stack <id>] [--only <unit>]` | Next unit (topo) |
| `npm run packet -- --root <project> --next [--stack <id>] [--only <unit>]` | Light compile packet |
| `npm run preflight -- --root <project>` | Structure/graph/lint gate |
| `npm run lock -- --root <project> --build-file <abs>…` | Update `gen-lock.json` after `bin/` writes |
| `npm run verify -- --root <project> [--stack <id>]` | Spec-eligible generated tests |
| `npm run lint -- <file.isl.md>` | Spec structure lint |
| `npm test` | Unit + CLI smoke |

### Layout

```text
docs/                 what / why, getting-started, workflow
vendor/isl-spec/      normative ISL (vendored)
runtime/              builder, compile-plan, cli, lint
agent-skills/         canonical Spec/Compile/Bench skills (sync to hosts)
.cursor/skills/       Cursor copies
.claude/skills/       Claude Code copies
.github/skills/       GitHub Copilot copies
projects/             your workspaces (see projects/README.md; gitignored contents)
examples/             official demos only (sheet, connect-four, dungeon)
benchmarks/           internal evaluation suites
```

### License

[MIT](LICENSE) — Copyright (c) 2026 fra00.

Normative ISL text lives in `vendor/isl-spec/` (same author; also published as [fra00/isl-specification](https://github.com/fra00/isl-specification)).
