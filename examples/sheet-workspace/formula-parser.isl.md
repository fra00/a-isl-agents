# Project: Sheet Workspace

Pure parser: formula text → dependency addresses + arithmetic AST (demo subset).

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./formula-parser

---

> **Reference**: @CellAddr, @SheetError, @SheetErrorCode, parseA1 in `./domain-sheet.isl.md`.

## Component: formulaParser

### Role: Business Logic

**Signature**: formulaParser()

### ⚡ Capabilities

#### parse

- **Contract**: Parses a formula string (with or without leading `=`).
- **Signature**: parse(raw: String): { ok: Boolean, dependencies: @CellAddr[], ast: Object | null, error: @SheetError | null }
- **Flow**:
  1. Strip leading `=`; trim.
  2. IF empty: RETURN parse_error.
  3. Tokenize numbers, A1 refs, and operators `+` `-` `*` `/` and parentheses.
  4. Build a left-associative binary AST for the demo grammar: `expr := term (('+'|'-') term)*`; `term := factor (('*'|'/') factor)*`; `factor := number | A1 | '(' expr ')'`.
  5. Collect unique @CellAddr dependencies from A1 tokens.
  6. IF tokenize/parse fails: RETURN `{ ok: false, dependencies: [], ast: null, error: parse_error }`.
  7. ELSE RETURN `{ ok: true, dependencies, ast, error: null }`.

### ⚙ Logic & Execution Rules

- Parser MUST be pure (no I/O).
- Unsupported functions (SUM, etc.) MUST fail as `parse_error` in this workspace.
- Dependencies MUST list each referenced address once.

### 🚨 Constraints

- Module MUST NOT evaluate numeric results (evaluator owns that).
- Module MUST NOT detect cycles (dependency graph owns that).

### ✅ Acceptance Criteria

- [ ] `=A1+B2` yields deps A1 and B2 and a non-null ast.
- [ ] `=A1+` yields parse_error.
- [ ] `=SUM(A1)` yields parse_error in this demo.

### 🧪 Test Scenarios

1. **Add refs**:
   - Input: `=A1+B2`
   - Expected: ok true; dependencies include A1, B2

2. **Bad syntax**:
   - Input: `=A1*`
   - Expected: parse_error
