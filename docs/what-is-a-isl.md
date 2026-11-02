# What is A-ISL?

**A-ISL** (**A**gent-compilable **I**ntent **S**pecification **L**anguage) is a **spec-driven** kit: describe product behavior in natural language, keep it as reviewable ISL (`.isl.md`), and — when you ask — compile that Spec into `bin-<stack>/` with Cursor agents. Stacks are compile profiles (e.g. React, Blazor, WinForms), not a rewrite of the Spec.

This repo is skills + runtime on classic ISL. It does not use paid Generator APIs. Why this shape (and the token/turn tradeoff): [Why A-ISL](./why-a-isl.md#spec-driven-by-design).

## A-ISL vs ISL

| | |
|--|--|
| **ISL** | The language: markdown contracts (`.isl.md`) that describe domain, logic, and UI intent. Source of truth: [fra00/isl-specification](https://github.com/fra00/isl-specification). |
| **A-ISL** | This repository: agent skills + runtime so an agent can **author** valid ISL and **compile** it to `bin/`. |

A-ISL does **not** fork the language. It consumes classic ISL (vendored under `vendor/isl-spec/`).

## What this repo ships

- **Skills** (`.cursor/skills/`): `a-isl-spec-author` (NL → `.isl.md` only) and `a-isl-compile` (packet → write `bin/` → lock)
- **Runtime**: builder, queue, light compile packet, preflight, lint, gen-lock
- **Normative ISL** markdown under `vendor/isl-spec/`
- **Examples** under `examples/` that show module DAGs and runnable demos

## What A-ISL is not

- Not a language fork (ISL stays upstream)
- Not the paid `isl-generator` / cloud API codegen path
- Not an auto-orchestrator: the human **reviews Spec**, then **explicitly** asks to compile
- Not a product oracle: it does **not** decide what to build

## Who decides what (responsibility)

**A-ISL does not decide what to build — you do.** It translates a **declared** intent into code in a reviewable, regenerable way.

| Role | Responsibility |
|------|----------------|
| You | Decide product behavior; accept or correct the Spec before Compile |
| Spec agent | Draft valid `.isl.md` from your natural language (assistant, not owner of intent) |
| Compile agent | Derive `bin-<stack>/` from the accepted Spec |
| Lint / preflight / verify | Structure, graph, eligible tests — **not** “the product is right” |

**Spec quality is yours**, with agent assistance. A wrong Spec that compiles cleanly yields a wrong-but-faithful `bin/`. Fix intent in `.isl.md`, then recompile — do not treat silent `bin-*` patches as the A-ISL path.

You do **not** need to know ISL grammar or a programming language: describe behavior in natural language; the agents write Spec and implementation. You still need to know **what the system should do** and to accept that intent before Compile. Practical checklist: [Review a Spec without knowing ISL](./review-spec.md). Later changes: [Change and fix via Spec](./change-via-spec.md).

## Anatomy of a workspace

**Your** apps: `projects/<name>-workspace/` ([projects/README](../projects/README.md)).  
**Repo demos:** `examples/` (do not use for personal work).

A typical workspace looks like:

```text
*.isl.md          Intent specs (Domain → Logic/Backend → Presentation)
build/            Builder output: .build.md, manifest, gen-lock
bin-<stackId>/    Generated implementation (e.g. bin-react-js, bin-blazor, bin-winforms)
demo/             Optional app that mounts the stack’s bin folder
```

Flow:

```text
Natural language  →  a-isl-spec-author  →  *.isl.md
Human review
Explicit compile  →  a-isl-compile      →  bin-<stack>/
```

## Next

- [Why A-ISL](./why-a-isl.md) — when it helps  
- [Review a Spec without knowing ISL](./review-spec.md)  
- [Change and fix via Spec](./change-via-spec.md)  
- [Evaluation](./evaluation.md) — what we measured  
- [Getting started](./getting-started.md) — install and skills  
- [Workflow](./workflow.md) — Spec gate → Compile loop  
- [Docs index](./README.md)
