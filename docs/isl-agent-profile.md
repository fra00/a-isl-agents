# ISL Agent Profile (compact)

Short rules for agents that **author** `.isl.md`. For full grammar, open `vendor/isl-spec/`. Normative language: **Intent Specification Language (ISL) v1.6.2**. A-ISL does not fork the language.

## Output contract

- Emit **only** valid `.isl.md` files (no app source under `bin-*`, no long prose docs).
- One component (or one Domain Concepts unit) per file unless the human asks otherwise.
- Prefer a **DAG** of small modules with `> **Reference**:` links over one monolithic file.

## Project header (every file)

```markdown
# Project: Auth Workspace

Short one-line purpose of this unit.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: YYYY-MM-DD
**Implementation**: ./kebab-name

---
```

`**Implementation**` is required for compile targets (relative path; emitted under `bin-<stack>/`).

## References

```markdown
> **Reference**: @User, @AuthSession in `./domain-auth.isl.md`.
> **Reference**: useAuthSession in `./use-auth-session.isl.md`.
```

Presentation → Logic/Backend → Domain. Never create cycles.

## Roles

| Role | Use for |
|------|---------|
| **Domain** | Entities, enums, shared vocabulary (`@Type`) |
| **Backend** | OAuth/API/persistence service boundaries |
| **Business Logic** | Hooks, gates, deterministic orchestration |
| **Presentation** | Pages/components, UI state, user events |
| **Test** | Fixtures and scenario packs (optional) |

## Symbol notation

- **`@TypeName`**: reusable domain contract (do not redefine elsewhere).
- **`` `localName` ``**: local field, param, or transient value.

## Mandatory shape (non-Domain)

1. `## Component: Name`
2. `### Role: …`
3. `**Signature**` when the unit has inputs/props
4. Role-appropriate emoji sections (see below)
5. `### ⚡ Capabilities` with `**Contract**`, and `**Flow**` / `**Trigger**` when behavior is non-trivial
6. `### 🚨 Constraints` using RFC 2119 (`MUST` / `SHOULD` / `MUST NOT`)
7. `### ✅ Acceptance Criteria`
8. `### 🧪 Test Scenarios`

## Emoji sections (common)

| Emoji | Section | Typical role |
|-------|---------|--------------|
| 🔍 | Appearance | Presentation |
| 📦 | Content | Presentation / Domain structure |
| ⚡ | Capabilities | All behavioral units |
| 🗂 | Internal State | Logic / Presentation |
| ⚙ | Logic & Execution Rules | Logic / Backend |
| 🚨 | Constraints | All |
| ✅ | Acceptance Criteria | All |
| 🧪 | Test Scenarios | All |
| 💡 | Implementation Hint | Optional, non-normative |

## Domain files

- Declare `## Domain Concepts` and entity subsections.
- Factory-friendly fields: clear types, enums, error codes.
- Constraints on identity and invariants with `MUST`.

## Verify-eligible Test Scenarios (EXT-001)

Spec Author **decides** whether a unit needs automated tests. Role is a heuristic, not a hard gate:

| Role | Heuristic |
|------|-----------|
| Domain | Prefer eligible scenarios for pure functions/factories with Signature; skip thin marker-only types |
| Business Logic / store | Prefer eligible scenarios for state transitions and pure helpers |
| Presentation | Default prose-only; add eligible scenarios only for exported pure helpers or clearly mockable Calls (not e2e clicks) |

A scenario is **verify-eligible** only when it has both:

- stable **`id:`** (e.g. `parseA1-valid`)
- **`Call:`** matching a Capability / Signature name (e.g. `parseA1`)

Optional: a fenced JSON block with `input` / `expected` for literal cases.

```markdown
1. **parseA1 valid** `id: parseA1-valid`
   - Call: parseA1
   - Input: `"A1"`
   - Expected: `{ col: "A", row: 1 }`
```

- If the unit has **no** eligible scenarios → Compile emits impl only; Verify reports `skipped`.
- If Spec adds/changes a surface that should be verified → update eligible scenarios in the **same** Spec edit.
- Do not invent a custom test DSL; see [ISL extensions](./isl-extensions.md#ext-001-spec--compile-tests--verify).

## Clarifying questions

Ask the human when auth provider, redirect URLs, session storage, or error UX are unspecified. Do not invent product requirements silently.

## After writes

Run vendored lint (`npm run lint -- <file.isl.md>`). Fix **errors** before handing off to the Compile agent.
