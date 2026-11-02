# Project: Bench Tariffe Smoke

Pure case status transitions: state in, state or error out (no mutable entity).

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-11-01
**Implementation**: ./logic-case-status

---

## Domain Concepts

### CaseState

Closed status set.

- **Identity**: Enumerated state.
- **Properties**:
  - Values: `"draft"` | `"issued"` | `"paid"` | `"overdue"`

### CaseEvent

Closed event set.

- **Identity**: Enumerated event.
- **Properties**:
  - Values: `"issue"` | `"pay"` | `"mark_overdue"`

## Component: logicCaseStatus

### Role: Business Logic

**Signature**: logicCaseStatus()

### ⚡ Capabilities

#### transitionCase

- **Contract**: Pure function `(state, event) → result`. Allowed: draft+issue→issued; issued+pay→paid; issued+mark_overdue→overdue; overdue+pay→paid. Unknown `state` → `{ ok: false, code: "unknown_state" }`. Disallowed pair → `{ ok: false, code: "invalid_transition" }`. Success → `{ ok: true, state }`. No internal mutable case object; JSON strings only; MUST NOT throw.
- **Signature**: transitionCase(input: { state: String, event: String }): { ok: true, state: String } | { ok: false, code: String }
- **Flow**:
  1. Look up transition table for `state`.
  2. IF missing state: RETURN unknown_state.
  3. IF event not allowed: RETURN invalid_transition.
  4. RETURN next state.

### 🚨 Constraints

- MUST be a pure function of input only.
- MUST NOT throw; errors are `{ ok: false, code }`.

### ✅ Acceptance Criteria

- [ ] draft+issue → issued.
- [ ] paid+issue → invalid_transition.

### 🧪 Test Scenarios

1. **Issue draft** `id: st-issue`
   - Call: transitionCase
   - Input: draft + issue
   - Expected: `{ ok: true, state: "issued" }`

```json
{ "input": { "state": "draft", "event": "issue" }, "expected": { "ok": true, "state": "issued" } }
```
