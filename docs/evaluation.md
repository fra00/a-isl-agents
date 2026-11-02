# Evaluation (internal)

What we measured about **generation quality of the A-ISL pipeline** (Spec → Compile → score) — not whether “spec-driven” is a valid idea in the abstract (that is assumed). The question is whether **our** path delivers **same-or-better** vector adherence than a single-prompt agent on the same frozen oracle.

Raw archives: [`benchmarks/tariffe-v2/results/replicas/`](../benchmarks/tariffe-v2/results/replicas/SUMMARY.md). How to run: [`benchmarks/`](../benchmarks/README.md).

## What we measure

| In scope | Out of scope |
|----------|----------------|
| Adherence to **closed** Domain/Logic rules (frozen vectors) | Ease of use / “from scratch” UX |
| A-ISL Spec→Compile vs **single-prompt baseline** (same oracle) | End-to-end product “works for users” |
| Shape (named exports / C# static API surface) vs logic | “Any kind of project” |
| First-compile vs final (≤2 repairs) as fractions | Formal proof / open ambiguity |
| Syntactic `dependencyUsage` (imports / type-name mentions) | Call-site semantic use of Domain |

Honesty limits (always):

- Same authoring chain for Spec, oracle, and vectors (bias).
- Closed rules → measures **adherence**, not open interpretation.
- Replica isolation is **prompt-only** (FS reads of `oracle/` are not sandboxed).
- Model id in `series.json` is **declared**, not runtime-verified.
- **Cost is not free:** A-ISL always pays a Spec phase the baseline does not; turns and tokens were **not measured** (“non misurato” in replica meta). A better first-compile rate is not a claim of lower total cost.
- **Vector sensitivity is limited:** hand mutations on series-2 killed **10/10 applied**, but **15/25** patches were `non_applicabile` — only two mutation kinds were applied across all replicas. The 27 vectors’ ability to catch defects is only weakly probed.
- Spec quality remains the human’s responsibility; a wrong Spec that compiles is still “faithful.” See [Who decides what](./what-is-a-isl.md#who-decides-what-responsibility).

## Suite

**tariffe-v2** — invoicing / quotes / late penalties (6 units, DAG). Score: **27** frozen vectors. Stacks exercised: `react-js`, `csharp`.

- Smoke / pipeline: `benchmarks/tariffe` → `npm run bench`
- Evaluation suite: `benchmarks/tariffe-v2` → `npm run bench:v2` (after compile)

Series **1** (older freeze, **26** vectors) is **not** numerically comparable to later series (export rules / vectors changed after measuring a harness defect). Result that still matters as a **system** finding: [series-1](../benchmarks/tariffe-v2/results/replicas/series-1/SUMMARY.md) A-ISL react-js was **4/5** first full-pass — the miss was **shape** (`export default` factory → `missing_export`), invisible to generated verify, repaired to 26/26. That finding drove the named-export stack/skill fix before series-2.

## Results (N = 5 per cell, model declared `composer`)

| Campaign | Stack | First full-pass (27/27 + deps) | Final full-pass | Notes |
|----------|-------|-------------------------------:|----------------:|-------|
| [series-2](../benchmarks/tariffe-v2/results/replicas/series-2/SUMMARY.md) A-ISL | react-js | **5/5** | 5/5 | Named-export fix holds. run-04: 1 recompile for missing `vitest` import in generated EXT-001 tests — **score already 27/27** (test-gen defect, not logic). |
| [baseline-s1](../benchmarks/tariffe-v2/results/replicas/baseline-s1/SUMMARY.md) prompt only | react-js | **5/5** | 5/5 | Ceiling tie with A-ISL on this oracle (both arms maxed — comparison does not separate). |
| [series-csharp](../benchmarks/tariffe-v2/results/replicas/series-csharp/SUMMARY.md) A-ISL | csharp | **5/5** | 5/5 | See [Csharp series events](#csharp-series-events). Alternate if run-05 dropped for integrity: **4/4**. |
| [baseline-csharp-s1](../benchmarks/tariffe-v2/results/replicas/baseline-csharp-s1/SUMMARY.md) prompt only (open DTO) | csharp | **1/5** | 5/5 | First passed median **17**/27 (min 1, max 27); N=5, wide spread — see [Csharp reading](#csharp-reading) |
| [baseline-csharp-s2](../benchmarks/tariffe-v2/results/replicas/baseline-csharp-s2/SUMMARY.md) prompt + record DTO rule | csharp | **5/5** | 5/5 | Same `PROMPT-csharp.md` plus prefer-record / no JsonObject·Dictionary; all runs used `record` DTOs, 0 repairs |

### Baseline csharp first-pass detail

| run | first | final | repairs |
|-----|------:|------:|--------:|
| run-01 | 26/27 | 27/27 | 2 |
| run-02 | 17/27 | 27/27 | 1 |
| run-03 | 1/27 | 27/27 | 2 |
| run-04 | 4/27 | 27/27 | 1 |
| run-05 | 27/27 | 27/27 | 0 |

### Csharp series events

Declared so “5/5” is not read as a clean, uneventful campaign:

1. **Freeze reopen (score harness):** after run-01’s first score looked like 18/27, comparison was failing on extra `null` JSON fields from C# DTOs. The csharp score normalizer was updated to **drop null properties**, integrity freeze was rewritten, then re-score → 27/27 with **no agent recompile**. That reopen is part of the series history.
2. **run-05 integrity:** check failed because the orchestrator added `baseline/wipe-bin-csharp.mjs` during archive (not agent leakage). **Decision:** score **counted** (27/27); replica **not** invalidated for score; meta records `integrity.ok: false` with that reason (`series-csharp/run-05/meta.json`). Strict protocol (“integrity fail → invalidate”) was **not** applied; to remove that objection: excluding run-05 still leaves A-ISL csharp first full-pass **4/4** (and baseline remains 1/5 on its five runs).

## Defects found (bench value beyond pass rates)

| Finding | Where | Outcome |
|---------|-------|---------|
| Default-export factory passed EXT-001 verify but failed score (`missing_export`) | series-1 run-05 | Stack/skill named-export rules + call-map-aligned tests; series-2 0 missing_export |
| Grace edge weakly covered | pre–series-2 vectors | Hold-out `pen-grace-plus-cap` added when freeze reopened |
| Generated EXT-001 tests missing `vitest` import | series-2 run-04 | Repair recompile; score already green |
| Textual mutation patches often `non_applicabile` | series-2 mutations | Kill rate reported on **applied** only (10/10); sensitivity still weak |

## Csharp reading

**What the baseline prompt already contained.** [`baseline/PROMPT-csharp.md`](../benchmarks/tariffe-v2/baseline/PROMPT-csharp.md) already required namespace, file → static class → PascalCase methods, and “types that round-trip Spec-shaped JSON.” It was **not** a bare domain prompt without an API surface.

**What still differed (checked in archived bins).** A-ISL replicas used **typed records** (e.g. series-csharp run-01/run-03 `ApplyBpsInput`). Baseline often used `JsonObject` (run-01) or `Dictionary<string, object?>` (run-03/run-04) and failed first-pass on `JsonElement` → `long`/`string` casts — **shape/interop**, not business-rule mistakes. Counterexample: baseline run-05 also used `Dictionary` but passed **27/27** first (coercion done carefully) — so loose JSON I/O is failure-*prone*, not always fatal. After ≤2 repairs, all baseline finals were 27/27.

**Claims that hold:**

> On C#, a single prompt that stated the API surface but left DTO style open failed more often at first compile (**1/5** vs A-ISL **5/5**), mostly on JSON interop.

> Adding the same **prefer `record` DTOs** rule to that prompt ([baseline-csharp-s2](../benchmarks/tariffe-v2/results/replicas/baseline-csharp-s2/SUMMARY.md)) matched A-ISL first-pass (**5/5**, 0 repairs). So the s1 gap is explained by **DTO guidance**, not by Spec→Compile itself on this oracle.

That is an argument for encoding stack profiles (or pasting their DTO rules) once — not a blanket “A-ISL beats any prompt.”

## Reading (generation quality)

| Question | Answer from this data |
|----------|------------------------|
| Does Spec→Compile **regress** vs a normal prompt on closed JS rules? | **No on this oracle** — both arms **5/5** (ceiling tie; the task does not separate them) |
| On C#, did A-ISL win first-pass vs open-DTO baseline (s1)? | **Yes (5/5 vs 1/5)** — interop/shape |
| On C#, vs prompt + same record-DTO rule (s2)? | **Tie at ceiling (5/5 vs 5/5)** — DTO rule alone closed the gap |
| Is Spec→Compile free (no Spec cost)? | **No** — Spec phase + unmeasured turns/tokens |
| Does that prove “easy”, “any app”, or “never broken code”? | **No** — not measured |

**Claim we support:** on this oracle, A-ISL Spec→Compile did **not regress** vs single-prompt on react-js (**tied at ceiling**); on csharp it beat an open-DTO prompt on first-pass, and **matched** a prompt that included the same record-DTO rule, while keeping a reviewable Spec.

**Claim we do not support (yet):** A-ISL superiority independent of stack-profile / DTO content; universal project coverage; maintainability cost; zero non-working code without human product judgment.

## What would strengthen this

Done recently:

1. **Baseline “prompt + record DTO rule”** — [baseline-csharp-s2](../benchmarks/tariffe-v2/results/replicas/baseline-csharp-s2/SUMMARY.md) **5/5** first (vs s1 **1/5**).
2. **Bench isolation unit tests:** `tests/bench-isolation.test.ts` (`integrity` + `prepare-clean`).

Still open:

- Measuring **cost of a Spec change** (turns/tokens)

Then:

- Maintenance / fix-via-Spec series (wall-clock / turns, not only greenfield)
- Harder Spec (underspec / ambiguity) if the goal is Spec value under uncertainty
- Broader stacks / domains beyond tariffe-v2
- Declared model verification and stronger isolation than prompt-only
- Stronger mutation tooling (fewer `non_applicabile`) so vector sensitivity is measured on more than two applied kinds

## Related

- [Why A-ISL](./why-a-isl.md) — fit / non-fit, tradeoffs  
- [What is A-ISL](./what-is-a-isl.md) — responsibility boundary  
- [benchmarks/tariffe-v2/README.md](../benchmarks/tariffe-v2/README.md) — suite protocol  
- Skill: `agent-skills/a-isl-bench/` (synced to host skill folders)
