# Project: Sheet Workspace

Pure evaluator: AST + cell number lookup → EvalResult (no cycle check).

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./formula-evaluator

---

> **Reference**: @CellAddr, @EvalResult, @SheetError, @SheetErrorCode, formatA1 in `./domain-sheet.isl.md`.

## Component: formulaEvaluator

### Role: Business Logic

**Signature**: formulaEvaluator()

### ⚡ Capabilities

#### evaluateAst

- **Contract**: Evaluates a parser AST given a resolve(addr) → number | null callback.
- **Signature**: evaluateAst(input: { ast: Object, resolve: Function, dependencies: @CellAddr[] }): @EvalResult
- **Flow**:
  1. Recursively evaluate numbers and binary `+ - * /`.
  2. IF ref resolve returns null: RETURN error `ref_error`.
  3. IF division by zero: RETURN `div_zero`.
  4. IF non-finite: RETURN `type_error`.
  5. ELSE RETURN `{ numberValue, display: String(number), error: null, dependencies }`.

#### evaluateLiteral

- **Contract**: Parses a non-formula raw string as number or text display.
- **Signature**: evaluateLiteral(raw: String): @EvalResult
- **Flow**:
  1. Trim; IF empty → empty display, numberValue null.
  2. IF raw matches a finite number: numberValue that number.
  3. ELSE display raw text; numberValue null (text literal; formulas that ref it → ref_error/type as resolve decides).

### ⚙ Logic & Execution Rules

- Evaluator MUST be pure given resolve.
- Evaluator MUST NOT walk the whole sheet or detect cycles.

### 🚨 Constraints

- Module MUST NOT call storage or parser.
- Errors MUST use @SheetErrorCode values.

### ✅ Acceptance Criteria

- [ ] AST `A1+B1` with resolve A1=1,B1=2 → 3.
- [ ] Division by zero → div_zero.
- [ ] Missing ref → ref_error.

### 🧪 Test Scenarios

1. **Add** `id: evaluateAst-add`
   - Call: evaluateAst
   - Input: A1=2, B1=3, ast A1+B1
   - Expected: numberValue 5

```json
{
  "input": {
    "ast": {
      "type": "binary",
      "op": "+",
      "left": { "type": "ref", "addr": { "col": "A", "row": 1 } },
      "right": { "type": "ref", "addr": { "col": "B", "row": 1 } }
    },
    "resolveMap": { "A1": 2, "B1": 3 },
    "dependencies": [{ "col": "A", "row": 1 }, { "col": "B", "row": 1 }]
  },
  "expected": { "numberValue": 5 }
}
```

2. **Div zero** `id: evaluateAst-div-zero`
   - Call: evaluateAst
   - Input: A1/B1 with B1=0
   - Expected: div_zero

```json
{
  "input": {
    "ast": {
      "type": "binary",
      "op": "/",
      "left": { "type": "ref", "addr": { "col": "A", "row": 1 } },
      "right": { "type": "ref", "addr": { "col": "B", "row": 1 } }
    },
    "resolveMap": { "A1": 1, "B1": 0 },
    "dependencies": [{ "col": "A", "row": 1 }, { "col": "B", "row": 1 }]
  },
  "expected": { "errorCode": "div_zero" }
}
```
