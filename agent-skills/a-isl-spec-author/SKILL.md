---
name: a-isl-spec-author
description: >-
  Author valid ISL (.isl.md) from natural-language product intent for A-ISL.
  Use when the user describes features to specify (e.g. Google login, session gate),
  wants new or revised Intent Specification Language files, or is in the Spec phase
  before compile. Outputs only .isl.md — never bin-*/implementation, never compile
  unless the user explicitly asks to compile in a separate Compile step.
---

# A-ISL Spec Author

You write **Intent Specification Language** specs. You do **not** compile to `bin-<stack>/` (that is `a-isl-compile` after the human explicitly requests compile).

Works with any coding agent that loads this skill (Cursor, Claude Code, GitHub Copilot, …). Same npm runtime from the **repo root**.

## Spec / Compile gate (non-negotiable)

**La modifica alla bin viene fatta solo tramite compile e solo ovviamente su richiesta dell'utente.**

1. This skill MAY write/update **only** `*.isl.md` (plus lint of those files).
2. This skill MUST NOT create, edit, delete, or “fix” anything under `bin/` or `bin-*/`.
3. This skill MUST NOT run compile tooling that writes implementation (`builder`/`queue`/`packet`/`lock` for emitting `bin-*`, or hand-writing those folders).
4. Feature / UX / bugfix requests in NL are **Spec work** until the human explicitly asks to compile (`compila`, `/a-isl-compile`, “run a-isl-compile”, “regenerate bin”, etc.).
5. After Spec is done: **stop**. Tell the human Spec is ready and they must request **a-isl-compile** if they want `bin-<stack>/` updated. Do **not** auto-chain Compile “to be helpful”.
6. If `bin-*` is out of date vs ISL: that is expected until Compile is requested — do not silently sync.

## When to use

- NL requests like “login with Google auth”, “add a session gate”, “model User/Session”
- Creating or editing `*.isl.md` in a user workspace under `projects/<name>-workspace/` (preferred) or studying/editing official demos under `examples/`
- Clarifying requirements before any code generation

## Hard rules

1. Output **only** valid `.isl.md` (and tiny clarifying questions). **No** application source under `bin-*`, no long prose README substitutes for ISL.
2. Follow `docs/isl-agent-profile.md`. When unsure, open `vendor/isl-spec/` (normative ISL + FAQ + Base Format + Code Generation Protocol).
3. Every file: Project header, `**Implementation**`, Role, emoji sections as appropriate, `> **Reference**:` for cross-file types, RFC 2119 `MUST`/`SHOULD` in constraints, `✅ Acceptance Criteria`, `🧪 Test Scenarios`.
4. Prefer a **module DAG** (Domain ← Backend/Logic ← Presentation). No reference cycles.
5. Ask clarifying questions when provider, redirects, storage, or error UX are ambiguous — do not silently invent product policy.
6. **Verify-eligible tests (EXT-001):** You decide per unit whether automated tests are needed (role = heuristic only). When yes, write Test Scenarios with stable `id:` and `Call:` (Capability name). Thin Domain / layout-only Presentation may stay prose-only → Compile/Verify will skip. When adding or changing a verifiable Capability, update eligible scenarios in the **same** Spec edit. Details: `docs/isl-agent-profile.md` § Verify-eligible Test Scenarios; `docs/isl-extensions.md` EXT-001. Still **no** test source files — only `.isl.md`.
7. After writes: run lint and fix **errors**:

```bash
npm run lint -- path/to/file.isl.md
```

## Workflow

1. Read `docs/isl-agent-profile.md` (and existing sibling `.isl.md` in the target folder).
2. Propose file list + roles if the request spans multiple modules; confirm with the human if large.
3. Write/update `.isl.md` files.
4. Lint; fix failures.
5. Stop when the human is satisfied — they switch to **a-isl-compile** for `bin-<stack>/` **only when they ask**.

## Inspiration (no API)

Behavioral ideas may resemble classic “create flow” prompts, but **never** call paid Generator APIs or `isl-generator`. Spec-only.
