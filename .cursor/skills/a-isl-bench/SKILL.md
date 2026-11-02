---
name: a-isl-bench
description: >-
  Run the A-ISL evaluation bench (tariffe-v2): freeze integrity hashes, N
  isolated clean compiles via a-isl-compile subagents, measure, archive
  replicas, mutate specific replica bins, aggregate vector×run. Use when the
  user asks for bench replicas, freeze reference-report, /a-isl-bench, or
  mutation score — not Spec authoring.
---

# A-ISL Bench (agent evaluator)

Orchestrator **measures** a frozen suite. Compiles go only through **a-isl-compile**.
Default project: `benchmarks/tariffe-v2`.

Works with any coding agent that loads this skill. Prefer spawning a **fresh** compile agent/chat per replica that only reads the compile skill.

## Honesty (always state in SUMMARY)

- Same agent authored Spec, oracle, and vectors (bias).
- Closed rules: measures **adherence**, not open interpretation.
- `dependencyUsage` is **syntactic** (imports + forbid `* bps / 10000`).
- Report **N**, **model id**, first vs final as fractions; split **forma** (export) vs **logica** on first-fail.
- Model from `series.json` is declared, not runtime-verified (`subagentModelExplicit: false`).
- Mutations: report `killed` / `survived` / `non_applicabile`; kill rate = applied only.

## Hard isolation rules

1. **Orchestrator must NOT** edit `*.isl.md`, `oracle/`, or `bench/*.mjs` during replicas.
2. **Integrity** hashes the whole bench tree except `bin-react-js/`, `build/`, `results/` — any stray write (oracle, bench scripts, Specs, call-map, …) invalidates the replica.
3. Before/after each run: `integrity --check` against the freeze snapshot.
4. **`prepare-clean-bin`**: without `--wipe` **fails** on residues. Always `--wipe` after acknowledging.
5. Residues wiped: `bin-react-js/`, `build/gen-lock.json`, `build/verify-status.json`, `build/*.build.md`, `build/*.ref.md`.
6. Subagent prompt is **only** the compile contract — no scores, no `results/`, no vectors. **Limit:** this is prompt-only; FS access to `oracle/` is still possible. Declare it in SUMMARY/README. Prefer post-check via integrity (unexpected reads that rewrite files are caught; pure reads are not).
7. **Model:** set once in `results/replicas/series.json` via `init-series.mjs`; archive copies it — do not pass a different `--model` per run.
8. Mutations: `--run-id` or `--all-replicas` only.

## Modes

| Ask | Mode |
|-----|------|
| freeze | `freeze` |
| measure current bin | `measure` |
| N compile da zero | `replicas` (default N=5) |
| mutations | `mutations --all-replicas` |
| full | freeze → replicas → mutations → aggregate |

## Scripts

```bash
npm run bench:v2
npm run bench:v2:freeze -- --from-report <report.json> --model <real-model-id>
node benchmarks/tariffe-v2/bench/integrity.mjs --write-snapshot results/integrity-freeze.json
node benchmarks/tariffe-v2/bench/integrity.mjs --check results/integrity-freeze.json
node benchmarks/tariffe-v2/bench/prepare-clean-bin.mjs --run-id run-01           # fail if dirty
node benchmarks/tariffe-v2/bench/prepare-clean-bin.mjs --run-id run-01 --wipe   # wipe + assert clean
node benchmarks/tariffe-v2/bench/archive-replica.mjs --run-id run-01 --model <id> \
  --pass-first N --pass-final N --total 26 --recompile-count K [--turns T]
npm run bench:v2:mutations -- --all-replicas
# or: node …/mutation-check.mjs --run-id run-03
npm run bench:v2:aggregate
```

`--model` must be a **real model id** (never a placeholder).

## Workflow: replicas

```text
Bench progress:
- [ ] 0. Freeze + integrity snapshot (no Spec/oracle/script edits after this)
- [ ] 1. For run-01..run-0N:
        integrity --check → wipe → compile subagent → measure first →
        optional ≤2 repair compiles → measure final → integrity --check → archive
- [ ] 2. Aggregate
- [ ] 3. Mutations --all-replicas
- [ ] 4. SUMMARY.md
```

### 0. Freeze + series + integrity

Write `results/replicas/EXPECTATIONS.md` **before** any compile (how you will read outcomes).

```bash
node benchmarks/tariffe-v2/bench/init-series.mjs --model <real-model-id> --n 5 --force
npm run bench:v2:freeze -- --model <same-id>
node benchmarks/tariffe-v2/bench/integrity.mjs --write-snapshot benchmarks/tariffe-v2/results/integrity-freeze.json
```

Abort if Spec `**Version**` ≠ `1.1.0` unless human accepts bump.

### 1. Per replica

**Integrity (start)** — must pass:

```bash
node benchmarks/tariffe-v2/bench/integrity.mjs --check benchmarks/tariffe-v2/results/integrity-freeze.json
```

**Clean** — check then wipe:

```bash
node benchmarks/tariffe-v2/bench/prepare-clean-bin.mjs --run-id run-0K
# if residues_present:
node benchmarks/tariffe-v2/bench/prepare-clean-bin.mjs --run-id run-0K --wipe
```

**Compile subagent** — fresh agent/chat, **verbatim prompt only** (no other context):

```text
Workspace root: <absolute-repo-root>
Skill file to read: agent-skills/a-isl-compile/SKILL.md
Task: compile from zero for project benchmarks/tariffe-v2 stack react-js.
Steps: preflight → builder → loop (queue --next → packet → write EXT-001 tests then impl → lock) until queue next is null.
Write only under benchmarks/tariffe-v2/bin-react-js/ and refresh build/ via builder/lock.
Do not read results/, oracle/, vectors.json, or any results/replicas/**.
Do not edit *.isl.md.
When done: print list of files written under bin-react-js and stop.
```

Do **not** paste prior run outcomes into the subagent.

**Measure first compile** (before any repair):

```bash
npm run bench:v2
```

Record `passedFirst` from score (`passed` field). Max **2** repair recompiles (`a-isl-compile --only` failing units only). Then measure again → `passedFinal`. `recompileCount` = number of repair rounds (0–2).

**Integrity (end)** — must still pass; else archive with `--integrity-ok false` (replica **invalidated**).

**Archive** (model from `series.json`; turns/tokens omit → "non misurato"):

```bash
node benchmarks/tariffe-v2/bench/archive-replica.mjs --run-id run-0K \
  --pass-first <passedFirst> --pass-final <passedFinal> --total <total> \
  --recompile-count <K> \
  --integrity-ok true --integrity-snapshot benchmarks/tariffe-v2/results/integrity-freeze.json
```

Archive copies full `bin-react-js` including `*.test.js` + copies `series.json`.

### 2–4. Aggregate, mutations, SUMMARY

```bash
npm run bench:v2:aggregate
npm run bench:v2:mutations -- --all-replicas
```

SUMMARY uses fractions only (`4/5 run a 26/26`), includes model, freeze hash short ids, first vs final, mutation kills per `run-id`.

Update README status blurb when N>1.

## Anti-patterns

- Silent clean without `--wipe`
- Subagent that can see previous replica scores or vectors
- Counting repaired runs as first-compile success
- Mutations on unnamed “current” bin
- Editing Spec/oracle/scripts mid-series
- Decimal percentages on N≤5

## Related

- `agent-skills/a-isl-compile/SKILL.md`
- `benchmarks/tariffe-v2/README.md`
- `reference.md` (layout)
