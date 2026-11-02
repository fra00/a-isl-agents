# A-ISL extensions to ISL

A-ISL **does not fork** the Intent Specification Language. Normative grammar stays in [`vendor/isl-spec/`](../vendor/isl-spec/). This document tracks **A-ISL deltas**: conventions, runtime behavior, and candidates to propose upstream.

| ID | Summary | Status | Notes |
|----|---------|--------|-------|
| [EXT-001](#ext-001-spec--compile-tests--verify) | Spec → Compile (tests then impl) → Verify for eligible scenarios | adopted | Piloted on sheet Domain/Logic (`react-js` + `csharp`); operationalizes classic ISL automatable scenarios without a new DSL |
| [EXT-002](#ext-002-dependency-declaration-lookup) | Deterministic `lookup-decl` CLI for dep signatures (stack patterns; no LLM `.sign`) | adopted | Patterns in `declaration-patterns.ts`; Compile skill invokes CLI only |

Statuses: `draft` → `adopted` → `upstreamed` (when accepted into classic ISL docs).

---

## EXT-001: Spec → Compile (tests) → Verify

Classic ISL already requires Test Scenarios to be implementable as automated tests. A-ISL makes that **operational**:

1. **Spec Author** decides per unit whether to emit **verify-eligible** scenarios (`id` + `Call`). Role is a heuristic, not a hard gate.
2. **Compile** (when eligible scenarios exist): write the stack **test file first**, then the implementation — both from Spec, not by reverse-engineering the bin.
3. **`gen-lock.json`** stays a build-hash cache only.
4. **Verify** (`npm run verify`) runs generated tests and writes `build/verify-status.json` (`pass` | `fail` | `stale` | `skipped`). Failure does not clear the lock.
5. No custom test DSL; optional JSON vectors under a scenario are fine. Stack runners: vitest / xUnit. Call → symbol mapping lives in `stacks.config.ts`.

Token cost: roughly one extra codegen chunk per eligible unit at Compile; Verify is local (near-zero LLM tokens). See [Why A-ISL](./why-a-isl.md) and [How it works](./how-it-works.md#verify-optional).

**Upstream candidate:** document eligible-scenario shape (`id`, `Call`) as a recommended Test Scenarios pattern in classic ISL.

---

## EXT-002: Dependency declaration lookup

Classic ISL injects dependency **realities** via LLM-written `.sign.ts` files. A-ISL does **not** emit `.sign` in this slice. Instead, Compile asks a **deterministic CLI** when it needs an exact declaration span from an existing `bin-*` file.

1. **`npm run lookup-decl`** — `--stack`, `--name` (Spec/Call name), `--file` and/or `--dir`, optional `--workspace`, `--kind value|type|any`, `--include-tests`.
2. **Stack config** owns declaration/type templates, file extensions, test-exclude globs, and `callSymbol` (`as-is` | `pascal-case` | `snake-case`). The Compile skill **must not** hardcode language regex tables.
3. **Exit codes:** `0` hit, `2` `no_match`, `3` usage / path / stack error (including symlink escape outside workspace / non-`bin-*`).
4. **JSON:** `selected` (index into sorted `candidates[]`), each candidate has `kind`, `path`, `line`, `signatureText`, `leadingContext`, `enclosingType`, optional `spanTruncated`.
5. **Defaults:** `--dir` skips generated tests (`*.test.js`, `*.Tests.cs`, …) unless `--include-tests`. Blazor/Razor scans `@code` / `@functions` with brace balance.
6. **Measure:** each run appends one line to `<workspace>/build/lookup-log.jsonl` (`stackId`, `reason`, `candidateCount`, `spanTruncatedAny`, `durationMs`).

**Future AST threshold (pre-declared):** if for a given stack **>10%** of lookup calls show `candidateCount > 1` **or** `spanTruncated`, consider Babel/Roslyn (or equivalent) extractors. Do not invent a new threshold after seeing data.

**Out of scope for this slice:** full AST, `.sign.json` emit, packet schema changes.

See [How it works — Lookup](./how-it-works.md#lookup-decl-optional).
