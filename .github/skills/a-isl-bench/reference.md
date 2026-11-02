# a-isl-bench — reference

## Layout

```text
benchmarks/tariffe-v2/results/
  reference-report.json
  integrity-freeze.json       # start/end check surface
  report-<iso>.json
  replicas/
    run-01/
      meta.json               # model, first/final, recompileCount, integrity
      report.json
      bin-react-js/           # impl + *.test.js
      pre-wipe/               # optional archived residues
    aggregate.json / .md
    mutations.json            # per-run-id hand-sample kills
    SUMMARY.md
```

## Subagent compile prompt (verbatim — nothing else)

```text
Workspace root: <absolute-repo-root>
Skill file to read: .cursor/skills/a-isl-compile/SKILL.md
Task: compile from zero for project benchmarks/tariffe-v2 stack react-js.
Steps: preflight → builder → loop (queue --next → packet → write EXT-001 tests then impl → lock) until queue next is null.
Write only under benchmarks/tariffe-v2/bin-react-js/ and refresh build/ via builder/lock.
Do not read results/, oracle/, vectors.json, or any results/replicas/**.
Do not edit *.isl.md.
When done: print list of files written under bin-react-js and stop.
```

## Residue list (`prepare-clean-bin`)

- `bin-react-js/`
- `build/gen-lock.json`
- `build/verify-status.json`
- `build/*.build.md`, `build/*.ref.md`

Default = check and **exit 1** if any exist. `--wipe` moves them under `results/replicas/<run-id>/pre-wipe/` then asserts empty.

## Interpreting aggregate

- Prefer `4/5` over percentages.
- Compare `passRateFirstCompile` vs `passRateFinal` to see fix-loop inflation.
- Invalidated runs (integrity fail) are excluded from valid denominators.
- If firstCompileFullPass is `5/5` with `recompileCount=0` everywhere → task may be too easy → v3.
