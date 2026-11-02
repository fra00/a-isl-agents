# Documentation

## Read in this order

1. [What is A-ISL](./what-is-a-isl.md) — definition, responsibility, boundaries  
2. [Why A-ISL](./why-a-isl.md) — spec-driven model, fit, tradeoffs  
3. [Same Spec, many stacks](./same-spec-many-stacks.md) — one sheet Spec → React, Blazor, WinForms  
4. [Getting started](./getting-started.md) — install, demos, skills  
5. [Tutorial: first project](./tutorial-first-project.md) — Spec → Compile once  
6. [Review a Spec without knowing ISL](./review-spec.md) — product checklist before Compile  
7. [Change and fix via Spec](./change-via-spec.md) — evolve / repair with `--only`  
8. [Workflow](./workflow.md) — human gate between skills  
9. [How it works](./how-it-works.md) — builder, queue, packet, lock, [verify](./how-it-works.md#verify-optional)  
10. [Evaluation](./evaluation.md) — what we measured (pipeline generation quality)  
11. [ISL extensions](./isl-extensions.md) — A-ISL deltas (EXT-001, EXT-002)  

## Guides

- [Review a Spec without knowing ISL](./review-spec.md)  
- [Change and fix via Spec](./change-via-spec.md)  
- [Working with the skills](./guide-using-skills.md) — `--stack`, [`--only`](./guide-using-skills.md#targeted-recompile---only)  
- [Same Spec, many stacks](./same-spec-many-stacks.md)  
- [How it works](./how-it-works.md)  
- [ISL Agent Profile](./isl-agent-profile.md)  
- [ISL extensions (A-ISL)](./isl-extensions.md)  
- [Evaluation](./evaluation.md)  
- Normative language: `vendor/isl-spec/` (do not fork; track deltas in [isl-extensions](./isl-extensions.md))

## Projects, examples, benchmarks

| Path | Role |
|------|------|
| [projects/](../projects/README.md) | **Your** workspaces |
| [sheet-workspace](../examples/sheet-workspace/README.md) | Demo: formulas + cycles; React / Blazor / WinForms |
| [connect-four-workspace](../examples/connect-four-workspace/README.md) | Demo: rules, modes, UI |
| [dungeon-workspace](../examples/dungeon-workspace/README.md) | Demo: larger game Spec, **react-js** only |
| [benchmarks/](../benchmarks/README.md) | Internal measure suites |
| [benchmarks/tariffe](../benchmarks/tariffe/README.md) | Smoke pipeline |
| [benchmarks/tariffe-v2](../benchmarks/tariffe-v2/README.md) | Evaluation suite + replicas |
| [Evaluation write-up](./evaluation.md) | Results vs single-prompt baseline |

Root: [README.md](../README.md)
