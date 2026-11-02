# Why A-ISL?

Agents are good at writing code and bad at silently inventing product policy. A-ISL puts a **readable contract** between your intent and `bin/`.

## Spec-driven (by design)

A-ISL is a **spec-driven** workflow, not “chat until the UI looks right”:

| Rule | Practice |
|------|----------|
| Intent is source of truth | Product behavior lives in `.isl.md` |
| Implementation is derived | `bin-<stack>/` comes from Compile, not from ad-hoc edits as the main path |
| Human gate | You review Spec, then **explicitly** ask to compile |
| Change the Spec to change the product | Update ISL → recompile affected units |
| Stack ≠ rewrite | Same Spec, different `--stack` → different `bin-*` |

It is *practical* spec-driven (reviewable ISL + regenerable bins), not formal verification. Preflight/lint check structure and graph; **you** still judge that the app behaves as intended.

**Boundary:** A-ISL does not choose the product — you declare intent; Spec quality is yours (agent-assisted). You need neither ISL nor a programming language to drive the loop; you need a clear “what should it do?” Details: [What is A-ISL — Who decides what](./what-is-a-isl.md#who-decides-what-responsibility).

## The problem

Without an explicit spec, a chat-driven agent tends to:

- Mix rules, storage, and UI in one place
- Invent error handling, turn order, or “obvious” defaults
- Patch the UI until it looks fine — with nothing durable to review as the source of truth

## What you gain

1. **You speak product; the agent writes ISL** — Describe behavior in natural language. The Spec skill drafts modules, roles, and constraints; **you** accept the intent. You need neither ISL grammar nor a programming language to ship a change — only a clear product decision.
2. **Clear module boundaries** — Domain, Logic, Backend, and Presentation stay separated in a DAG. Rules stay testable; UI stays thin.
3. **Intent separate from stack** — `.isl.md` describes behavior, not “only React.” Compile applies a **stack** profile (e.g. `react-js`, `python`) and writes `bin-<stackId>/` (e.g. `bin-react-js`, `bin-csharp`). Same Spec, side-by-side outputs.
4. **Human gate by design** — You accept Spec, then explicitly ask Compile. Implementation folders do not drift on their own. Lint/preflight keep the graph and ISL shape sound; you (or later automation) judge that the product behaves as intended — same as any AI-generated code, with a clearer contract to rework against.
5. **Control without editing `bin-*`** — Feature work can be zero hand-written implementation lines.
6. **Change via Spec, not random patches** — Update intent, recompile the units that own it.
7. **Incremental compile** — Queue and light packets keep generation one unit at a time. Details: [How it works](./how-it-works.md).

Stack profiles include `react-js`, Python variants, `csharp` (library / classes only), and full-app stacks `blazor` / `winforms` (UI + engine in the same `bin-<stackId>/`, same idea as React). Host wiring mounts the chosen `bin-*` — not a substitute for Spec.

## When it fits

- Non-trivial rules (moves, formulas, gates, error codes)
- An app that will grow and should keep clean boundaries
- Agent-assisted work where you want intent reviewable before `bin/` changes

## When it does not fit

- Throwaway scripts or one-shot UI
- Pure visual work with almost no domain rules
- You want a single chat turn that only patches JSX and never pauses for Spec → Compile

## Tradeoffs

**Two phases cost more wall-clock and more tokens than one JSX patch.**  
Spec, then Compile. You pay more agent turns (and typically more tokens) for a durable contract and cleaner modules. That cost is structural to spec-driven work, not a misconfiguration. Light packets, `queue --next`, and skipping unchanged units via lock reduce waste; they do not make Spec+Compile as cheap as a single UI patch.

**Optional Verify (EXT-001)** adds roughly one extra codegen chunk per Spec-opted unit (test file before impl); running tests is local (`npm run verify`) and near-zero LLM cost. Units without eligible scenarios stay skipped.

**Unclear asks still yield guesses.**  
If you omit details, the agent may pick defaults (timing, copy, AI strength, …). They show up in `.isl.md` and are easy to revise — they are not mind-reading. Same class of issue as plain agent coding; here the guess is reviewable in Spec.

## Example: Connect Four

In `examples/connect-four-workspace`, drop animation and single-player mode were driven as NL → Spec → Compile: rules stay in Logic, modes/AI in their modules, animation in Presentation — without hand-editing `bin-react-js/`.

## Example: Sheet (multi-stack)

Same Spec → React, Blazor, and WinForms: [Same Spec, many stacks](./same-spec-many-stacks.md).

## What we measured (and did not)

Internal benches are a **regression check**, not a leaderboard: whether Spec→Compile stays same-or-better than a single-prompt agent on a frozen Domain/Logic oracle — not whether “spec-driven” is valid in the abstract. On react-js, match at 5/5 (intended on a small closed task). On csharp, open-DTO prompts lost first-pass; the same prefer-record rule closed the gap. The intended payoff is on **large / multi-module projects** and **change-via-Spec** — **not demonstrated** by this small-oracle bench. Turns/tokens unmeasured; ease-of-use out of scope so far.

Full tables, limits, and defects found: **[Evaluation](./evaluation.md)**.

## Bottom line

A-ISL is **spec-driven**: intent as source of truth, agents as Spec author and compiler under a short human gate. You decide what to build; agents draft `.isl.md` and `bin-<stack>/` for you to review and regenerate. You accept higher token/turn cost in exchange for a reviewable contract — not a substitute for your product judgment.

## Next

- [What is A-ISL](./what-is-a-isl.md)
- [Review a Spec without knowing ISL](./review-spec.md)
- [Change and fix via Spec](./change-via-spec.md)
- [Evaluation](./evaluation.md)
- [Getting started](./getting-started.md)
- [Tutorial: first project](./tutorial-first-project.md)
- [How it works](./how-it-works.md)
