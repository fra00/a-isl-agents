---
name: a-isl-compile
description: >-
  Compile A-ISL / ISL specs to bin-<stack>/ using a coding agent (no paid
  isl-generator / Gemini / OpenAI). Use ONLY when the user explicitly asks to
  build, compile, or regenerate implementation from .isl.md after the Spec phase.
  Prefer preflight, queue --next, and light compile packets; agent writes
  bin-<stack> files. Never compile unprompted after Spec or UX chat.
---

# A-ISL Compile (in-agent compiler)

You emit `bin-<stackId>/` from ISL (default stack `react-js` → `bin-react-js`). **Builder / queue / packet / lock / preflight** CLIs are allowed. Paid `isl-generator` / Gemini / OpenAI are **forbidden**.

Works with any coding agent that loads this skill (Cursor, Claude Code, GitHub Copilot, …). Same npm runtime from the **repo root**.

## User-request gate (non-negotiable)

**La modifica alla bin viene fatta solo tramite compile e solo ovviamente su richiesta dell'utente.**

1. Enter this skill / write under `bin-*` **only** when the human explicitly asks to compile (e.g. `compila`, `/a-isl-compile`, “build bin”, “regenerate implementation”, “run compile for …”).
2. Spec-only messages, NL feature ideas, or UX tweaks **without** an explicit compile request MUST NOT trigger implementation writes — send them to **a-isl-spec-author** (or Spec phase) and stop.
3. Do **not** auto-compile after Spec edits “because the demo would break” or “to finish the loop”.
4. Implementation folders are updated **only** through this Compile workflow (packet → write → lock). Do not treat ad-hoc patches under `bin-*` as the A-ISL path unless the human explicitly asks for a one-off exception.
5. If the human has not asked to compile: refuse to edit `bin-*` and say they need an explicit compile request.

## When to use

- Human finished Spec phase and **asks** to build/compile/regenerate
- Aligning a project’s `bin-<stack>/` to updated `*.isl.md` **because the human requested Compile**

## Hard constraints

1. **Do not** run paid generators or API codegen clients.
2. **You** write each implementation file under the stack bin dir from the packet `targetPath` (full code, no TODO stubs).
3. Bumping `gen-lock.json` alone is **not** compilation — only lock after real writes under `bin-<stack>/`.
4. If ISL is ambiguous or contradictory: **stop** and tell the user to return to **a-isl-spec-author**. Do not invent requirements.
5. **Do not** open `vendor/isl-spec/` during Compile (Spec Agent only), unless the user explicitly asks.
6. Prefer **one unit at a time** via `queue --next` + **light packet**. Do not load the full queue JSON or full `.build.md` by default.

## Output dir

Default: `bin-<stackId>` next to the specs (e.g. `--stack react-js` → `bin-react-js`). Override with `--bin` if needed. Same workspace can hold `bin-react-js` and `bin-csharp` side by side.

## Low-token workflow (default)

```text
preflight → builder (once) → loop: queue --next → packet → [tests then] write impl → (batch) lock
         → (optional) npm run verify
```

### 0. Preflight (once)

```bash
npm run preflight -- --root examples/connect-four-workspace
```

Structural/graph/lint gate only — **does not** prove implementation correctness. If it fails, fix Spec/lint before compiling.

### 1. Builder (once per batch)

```bash
npm run builder -- examples/connect-four-workspace
```

Topo order lives in `build/build-manifest.json` (script-owned). You do **not** invent compile order.

### 2. Next unit only

```bash
npm run queue -- --root examples/connect-four-workspace --next
```

Pass **`--stack <id>`** on every queue/packet call in the loop (default `react-js` → `bin-react-js/`):

```bash
npm run queue  -- --root <project> --next --stack blazor
npm run packet -- --root <project> --next --stack blazor
```

Ids: `react-js`, `blazor`, `winforms`, `csharp` (library-only), `python`, `python-fastapi`. Optional `--bin <path>` overrides the output folder.

**Targeted recompile** — when the human asks to regenerate one or a few units (lock would otherwise skip them):

```bash
npm run queue  -- --root <project> --next --only dungeon --stack react-js
npm run packet -- --root <project> --next --only dungeon --stack react-js
# or packet by name:
npm run packet -- --root <project> --only dungeon --stack react-js
```

`--only` may be repeated. Tokens: unit basename (`dungeon`), `dungeon.isl.md`, or `./dungeon`. Reason in queue JSON: `force-only`. Do **not** use workspace-wide `--force` when only a subset is requested.

Use `next.buildFile` / `next.targetPath`. If `next` is `null`, stop (queue empty).  
Use full `--json` queue only when the human asks for an overview.

### 3. Light packet (default context)

```bash
npm run packet -- --root examples/connect-four-workspace --build-file "<abs.build.md>"
# or
npm run packet -- --root examples/connect-four-workspace --next
```

Packet includes: **SOURCE** markdown for this unit, target path, stack constraint subset, **paths** to dependency files in the same `bin-<stack>/`.  
It **excludes** inlined `.ref.md` blobs.

**Write files from the packet** (see EXT-001 order below). Import real dependency modules from the listed paths.

### 3a. Dependency declaration lookup (EXT-002)

When you need the **exact declaration** of a dependency symbol (method / function / type) before writing this unit:

```bash
npm run lookup-decl -- --stack <id> --name <SpecOrCallName> --file <abs-or-rel-bin-path> [--workspace <project>]
# or scan a bin folder (generated *.test.* / *.Tests.cs skipped unless --include-tests):
npm run lookup-decl -- --stack <id> --name <Name> --dir <bin-<stack>> --workspace <project>
```

- Exit **0** = hit, **2** = `no_match`, **3** = usage / path / stack error.
- Read stdout JSON: use `candidates[selected]` (`signatureText`, `leadingContext`, `enclosingType`, per-candidate `kind`). Do **not** invent regexes or open the whole dep file to hunt signatures.
- Patterns and `callSymbol` live in stack config (`declaration-patterns.ts` / `stacks.config.ts`) — the skill must **only invoke** this CLI.
- Paths must resolve under `--workspace` and a `bin-*` segment (symlink escape → exit 3).

### 3b. EXT-001 generated tests (when Spec opts in)

Verify-eligible scenarios = Test Scenarios with both `` `id: …` `` and `- Call: …` (see `docs/isl-agent-profile.md`). Spec Author decides; any role may opt in.

**Per unit, same turn:**

1. If SOURCE has ≥1 eligible scenario: **overwrite** the generated test file **first** (path = impl basename + `stack.verify.testSuffix` under the same `bin-<stack>/`, e.g. `domain-sheet.test.js` / `domain-sheet.Tests.cs`). Assert **only** from Spec scenarios + Signature; map `Call` → symbol via `stack.verify.callSymbol` (`as-is` | `pascal-case` | `snake-case` in `stacks.config.ts`). **react-js Domain/Logic:** each Call MUST be a **named** export; tests MUST `import { <Call> } from "./<file>"` — never `import Unit from …; Unit().<Call>()`. If the workspace has `bench/call-map.json`, resolve `export` from `"<unit>.<Call>"` and import that name (same contract as frozen score). Do **not** invent cases for prose-only scenarios; do **not** open/edit the impl file before the test file is written.
2. Then write the **impl** at `targetPath` so it satisfies those tests and the Contract. **react-js Domain/Logic:** `export function <Call>` / `export const <Call>` for every Capability; FORBIDDEN default-export factory wrapping capabilities.
3. If zero eligible scenarios: write impl only; **delete** a previously generated test file for that unit if it still exists. Still use named capability exports for Domain/Logic.
4. On verify **fail**: you may `--only` recompile **impl only** (keep the test file). **MUST NOT** rewrite tests to make them pass (including changing named imports to default factories). If the scenario/Call/expected looks wrong → **STOP** and send the human to **a-isl-spec-author**.
5. After a Domain/Logic (or other eligible) batch, you **may suggest** `npm run verify -- --root <project> --stack <id>`; do **not** require green to lock. Lock stays a build-hash cache.

Full unit recompile after Spec change: regenerate the **entire** test file from current Spec, then impl (not a merge with old tests).

### 4. Lock (batch when possible)

After 1–5 successful writes:

```bash
npm run lock -- --root examples/connect-four-workspace --build-file "<abs1>" --build-file "<abs2>"
```

### 5. Agent batching by complexity (context hygiene)

One long agent session that compiles many units tends to **under-implement** later or large packets (context filled with prior bins). Prefer:

| Unit kind | How to compile |
|-----------|----------------|
| **Leaf / small** | Same agent, **batch** several `queue --next` → write → lock |
| **Heavy / hub** | **Fresh agent** / new chat: `--only <unit>` → packet → implement **every** capability in SOURCE → lock |
| **Repair** after review/playtest | Fresh agent + `--only` on the failing unit(s) only |

Treat a unit as **heavy** if any of these hold (stack-agnostic):

- Long SOURCE / many `####` capabilities in one `.isl.md`
- High fan-in: many other units Reference it, or it References many deps
- Presentation or Logic that **orchestrates** a large share of the graph (shell / facade / session boundary)
- Packet or prior compile of that unit has a history of omitted Flows

Do **not** spawn one agent per leaf by default (cost). Do **not** run an entire large workspace in one agent without refreshing on hubs.

Prompt for a heavy unit: repo root, `--stack`, `--only <unit>`, “implement every capability in SOURCE; no omitted Flows.” Follow `agent-skills/a-isl-compile/SKILL.md` (or the host copy under `.cursor/skills`, `.claude/skills`, or `.github/skills`).

## Escalation table (when light access is not enough)

| Situation | Action |
|-----------|--------|
| Packet ok, dep bins exist, ISL clear | **Light only** → write file |
| Packet exit / `missingDependencyBins` | **STOP** — fix queue/order; do not invent APIs |
| Need exact declaration/signature of a dep | `npm run lookup-decl` (EXT-002); use JSON `selected` — do not invent APIs |
| `lookup-decl` exit 2 (`no_match`) | Re-check Spec Call/name + dep path; do not invent signatures |
| Packet incomplete / no SOURCE marker | Read **this unit’s** `fullBuildFile` once |
| Ambiguous / contradictory ISL | **STOP** → Spec Agent; no vendor dive |
| Human requests full rebuild audit | `--force` / full queue `--json` allowed |

## Per-unit write rules

Header on every generated file:

```text
/**
 * DO NOT EDIT THIS FILE DIRECTLY
 * ----------------------------------
 * This file was generated by ISL Compiler.
 * Source: <basename-of-.isl.md>
 * Edit the ISL file instead.
 */
```

Follow stack rules (`react-js` default). Full implementation — no TODO stubs.

## Paths

| Tool | Entry |
|------|--------|
| Preflight | `npm run preflight -- --root <project>` |
| Builder | `npm run builder -- <project>` |
| Queue next | `npm run queue -- --root <project> --next` |
| Packet | `npm run packet -- --root <project> --next` |
| Lock | `npm run lock -- --root <project> --build-file <abs>…` |
| Verify | `npm run verify -- --root <project> [--stack <id>] [--only <unit>]` |
| Lookup decl | `npm run lookup-decl -- --stack <id> --name <Name> --file\|--dir … [--workspace <project>]` |
| Lint | `npm run lint -- <file.isl.md>` |
