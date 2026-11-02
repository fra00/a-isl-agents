# How A-ISL works

End-to-end picture: what ISL is, what each skill does, and how the runtime turns specs into `bin/` in dependency order.

Hands-on steps: [Tutorial](./tutorial-first-project.md). Human gate rules: [Workflow](./workflow.md). Day-to-day tips: [Guide: skills](./guide-using-skills.md).

## Big picture

```text
You (NL)  →  Spec Author skill  →  *.isl.md
                ↓
         Human review (gate)
                ↓
You (compila) →  Compile skill  →  runtime tools  →  agent writes bin/
```

| Layer | Role |
|-------|------|
| **ISL** | Intent language (`.isl.md`) — contracts, not app source |
| **Skills** | Tell the coding agent *what phase* it is in and which tools to run (same text for Cursor / Claude Code / Copilot) |
| **Runtime** | Deterministic graph/build/queue/packet/lock (no paid generator API; agent-agnostic) |
| **Agent** | Writes each `bin/` file from a light packet |

**Why this shape:** specs stay reviewable; code is regenerated from contracts; modules compile in an order that respects imports; the human decides when `bin/` may change.

## ISL in short

An `.isl.md` file is a **unit of intent**: one Domain Concepts pack or one component (Logic / Backend / Presentation).

Typical pieces:

- Project header + `**Implementation**: ./kebab-name` (maps to `bin-<stack>/kebab-name…`)
- Role (Domain, Business Logic, Backend, Presentation, …)
- Capabilities with contracts / flows
- RFC 2119 constraints (`MUST` / `SHOULD`)
- Acceptance criteria and test scenarios
- Cross-file links: `> **Reference**: … in \`./other.isl.md\``

Those **Reference** lines form a **DAG**: Presentation depends on Logic/Backend; those depend on Domain. Cycles are invalid for build order.

Authoring rules: [ISL Agent Profile](./isl-agent-profile.md). Normative grammar: `vendor/isl-spec/`.

## Skill: Spec Author (`a-isl-spec-author`)

**Input:** natural language (“counter that can’t go below zero”).  
**Output:** only `*.isl.md` (+ lint).  
**Must not:** write `bin/`, run compile tooling that emits implementation, or auto-chain into Compile.

Roughly what the agent does:

1. Read the profile / sibling specs
2. Propose or update modules (roles + references)
3. Write valid ISL
4. Lint and fix errors
5. **Stop** for human review

**Why:** keep product policy in a readable contract before any generated code exists.

## Skill: Compile (`a-isl-compile`)

**Input:** explicit ask (`compila`, `/a-isl-compile`, “build bin”, …).  
**Output:** implementation under `bin-<stackId>/` (default stack `react-js` → `bin-react-js`), then `gen-lock.json` updates.  
**Must not:** invent requirements if ISL is ambiguous (send back to Spec); call paid Generator APIs.

The skill orchestrates **runtime CLIs**, then the **agent** writes each file. Builder/queue/packet do **not** emit application JS by themselves.

## Compile pipeline (runtime + agent)

```text
preflight  →  builder (once)  →  loop: queue --next → packet → write bin-<stack>/  →  lock (batch)
```

### 1. Preflight

`npm run preflight -- --root <workspace>`

Checks structure before trusting a compile: `.isl.md` present, manifest/impl paths, topo list, lint **errors** clean.

Does **not** prove that `bin/` matches behavior — only gates.

### 2. Builder

`npm run builder -- <workspace>`

**Does not write `bin/`.** It analyzes `.isl.md` and writes under `build/`:

| Artifact | Purpose |
|----------|---------|
| `*.ref.md` | Extracted “interface” view of a unit |
| `*.build.md` | Build context for that unit (includes SOURCE marker + spec body) |
| `build-manifest.json` | Ordered list of units + content hash + `implementationPath` |

**Topological order (why):**

1. Scan all `.isl.md` (skip `bin/`, `bin-*`, `build/`, `node_modules`, …)
2. Build a graph from `> **Reference**:` edges
3. Kahn-style sort: **dependencies first** (e.g. `domain-game` → `board-rules` → … → `app-shell`)
4. Emit ref/build files in that order into the manifest

So when the agent later implements unit N, dependency bins are expected to already exist (or be next in queue ahead of N).

If the graph has a cycle, builder fails — fix Spec references.

### 3. Queue (`--next`)

`npm run queue -- --root <workspace> --next`

Compares manifest hashes to `build/gen-lock.json` and existing targets under `bin-<stack>/`.

- **Stale / missing** → enqueued  
- **Unchanged** (hash + file present) → skipped  

`--next` returns **one** unit in topo order. That keeps compile incremental and low-token.

### 4. Light packet

`npm run packet -- --root <workspace> --next` (or `--build-file …`)

Add **`--stack <id>`** on queue and packet when you are not using the default. Default is `react-js` → `bin-react-js/`.

```bash
npm run queue  -- --root examples/sheet-workspace --next --stack blazor
npm run packet -- --root examples/sheet-workspace --next --stack blazor
```

Known ids (see `runtime/compile-plan/stacks.config.ts`): `react-js`, `blazor`, `winforms`, `csharp` (library-only), `python`, `python-fastapi`. How to ask the agent: [Guide: choosing the stack](./guide-using-skills.md#choosing-the-stack---stack).

**Targeted recompile** (`--only <unit>`, repeatable): re-queues selected units even if unchanged in `gen-lock`. See [Guide: targeted recompile](./guide-using-skills.md#targeted-recompile---only).

**Agent batching by complexity:** one long Compile agent that walks an entire large workspace tends to under-implement later or oversized units (context filled with prior bins). Practical split:

- **Leaf / small** units → same agent, several `queue --next` in a batch  
- **Heavy / hub** units (long SOURCE, many capabilities, high fan-in/out, orchestration shells) → **fresh agent** (or subagent) with `--only <unit>`  
- **Repair** after review → fresh agent + `--only` on the failing unit(s)

Heuristics and prompts live in skill `a-isl-compile` (Agent batching by complexity) and the [skills guide](./guide-using-skills.md#targeted-recompile---only). This is operational guidance for the Compile agent, not a change to ISL or the builder graph.

Builds a compact prompt for the agent:

- **SOURCE** markdown for this unit only
- **targetPath** under `bin-<stackId>/`
- **Stack** constraints for that profile — same ISL intent, different codegen rules, extensions, and output folder
- Paths to **dependency files in that stack’s bin** (import these — do not re-invent APIs)
- Escalation hints if a dep bin is missing

Full `.ref.md` blobs are **not** inlined by default (token savings). Escalate to the full `.build.md` only when needed.

### 5. Agent writes `bin-<stack>/`

The Compile skill instructs the agent to emit a full implementation file (header “DO NOT EDIT… Source: …isl.md”), importing real deps from the packet paths. No TODO stubs.

### 6. Lock

`npm run lock -- --root <workspace> --build-file <abs>…`

Records the current build hash for that unit in `gen-lock.json` so a later queue can skip unchanged work.

Lock without a real write under `bin-<stack>/` is **not** a successful compile.

### 7. Verify (optional) {#verify-optional}

`npm run verify -- --root <workspace> [--stack <id>] [--only <unit>]`

Runs **generated** tests for units whose Spec has verify-eligible scenarios (`id` + `Call`). Writes `build/verify-status.json` with per-unit `pass` | `fail` | `stale` | `skipped`. Does **not** clear or update `gen-lock.json`.

- **Compile order when eligible:** test file first (from Spec), then impl. See [EXT-001](./isl-extensions.md#ext-001-spec--compile-tests--verify).
- **stale:** last status was `pass` but impl/test hashes on disk differ — verify re-runs and refreshes the file.
- **skipped:** no eligible scenarios, or eligible but test file missing (listed explicitly).
- Fix-loop: recompile **impl** only on fail; bad scenarios → Spec Author (do not soften tests).

### 8. Lookup declaration (optional) {#lookup-decl-optional}

`npm run lookup-decl -- --stack <id> --name <Name> --file <path> | --dir <bin-*> [--workspace <root>]`

Deterministic declaration/type span search under `bin-*` (EXT-002). Compile uses this instead of classic ISL LLM `.sign` files. Patterns and name mapping live in stack config — not in the skill prompt.

- Exit `0` / `2` / `3` → hit / no_match / usage-or-path error.
- JSON: `selected` + `candidates[]` (`kind`, `signatureText`, `leadingContext`, …).
- Appends `build/lookup-log.jsonl` for measure; see [EXT-002](./isl-extensions.md#ext-002-dependency-declaration-lookup) for the **>10%** multi-candidate / truncated AST threshold.

## Artifacts on disk

New work: `projects/<name>-workspace/` ([projects/README](../projects/README.md)). Official demos stay under `examples/`.

```text
projects/<name>-workspace/   (or examples/<demo>-workspace/)
  *.isl.md                 Intent (source of truth for product)
  build/
    *.ref.md               Builder-extracted interfaces
    *.build.md             Per-unit build contexts
    build-manifest.json    Topo order + hashes
    gen-lock.json          What was last compiled successfully
    verify-status.json     Optional EXT-001 verify results (not a lock)
    lookup-log.jsonl       Optional EXT-002 lookup measure lines
  bin-react-js/            Implementation (+ *.test.js when Spec opts in)
  bin-csharp/              Implementation (+ *.Tests.cs when Spec opts in)
  verify/                  Versioned test harness (vitest / dotnet) when used
  demo/                    Optional app that imports the chosen bin-* folder
```

## Worked micro-example

Connect Four (simplified):

```text
domain-game.isl.md
  → board-rules.isl.md
  → game-service.isl.md / ai-opponent.isl.md
  → use-game.isl.md
  → board-view / game-hud
  → app-shell.isl.md
```

1. Spec Author edits `board-view.isl.md` (drop animation) — `bin/` untouched.  
2. You ask Compile.  
3. Builder rebuilds contexts; queue may skip unchanged domain/rules and stop on stale presentation/shell.  
4. Packet for `board-view` points at existing `domain-game` under `bin-react-js`; agent rewrites `bin-react-js/board-view.jsx`; lock updates.

**Why topo + lock:** you recompile what changed (and dependents if their build hash changed), with deps already available to import.

## What each part is *for*

| Piece | Why it exists |
|-------|----------------|
| Split Spec / Compile skills | Human gate; no silent `bin/` churn |
| ISL + references | Explicit module boundaries and compile graph |
| Builder | Deterministic order and hashed build contexts |
| Queue | Incremental, one unit at a time |
| Light packet | Enough context to implement without dumping the whole graph |
| Agent write | Flexible codegen without a paid API black box |
| Lock | Skip work that is already up to date |
| Verify | Optional acceptance check vs Spec scenarios (separate from lock) |
| Lookup-decl | Deterministic dep declaration span (no LLM `.sign`) |

## Related

- [What is A-ISL](./what-is-a-isl.md) · [Why A-ISL](./why-a-isl.md) (including limitations)  
- [ISL extensions](./isl-extensions.md) · [Workflow](./workflow.md) · [Guide: skills](./guide-using-skills.md)  
- Runtime entrypoints: `npm run preflight|builder|queue|packet|lock|verify|lint`
