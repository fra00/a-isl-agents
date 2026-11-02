# Project: Sheet Workspace

Pure dependency graph: build edges and detect cycles.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./dependency-graph

---

> **Reference**: @CellAddr, @SheetError, @SheetErrorCode, formatA1 in `./domain-sheet.isl.md`.

## Component: dependencyGraph

### Role: Business Logic

**Signature**: dependencyGraph()

### ⚡ Capabilities

#### build

- **Contract**: Builds adjacency map from cells’ declared dependency lists.
- **Signature**: build(input: { edges: { from: @CellAddr, to: @CellAddr[] }[] }): { adj: Object }
- **Flow**:
  1. For each `from`, record outgoing edges to each `to` (A1 keys).
  2. RETURN adjacency object keyed by formatA1(from).

#### detectCycle

- **Contract**: Returns a cycle path if the directed graph has a cycle; otherwise null.
- **Signature**: detectCycle(adj: Object): { cycle: String[] | null, error: @SheetError | null }
- **Flow**:
  1. DFS with colors (white/gray/black) over adjacency keys.
  2. IF back-edge to gray node: reconstruct cycle address list; RETURN SheetError `cycle` with message naming the cycle (e.g. `A1 → B1 → A1`).
  3. ELSE RETURN `{ cycle: null, error: null }`.

#### wouldCreateCycle

- **Contract**: Checks whether setting `from` → `deps` introduces a cycle in the existing graph.
- **Signature**: wouldCreateCycle(input: { adj: Object, from: @CellAddr, deps: @CellAddr[] }): Boolean
- **Flow**:
  1. Clone adj; replace outgoing edges of `from` with `deps`.
  2. RETURN true IFF detectCycle reports an error.

### ⚙ Logic & Execution Rules

- Graph direction: formula cell → referenced cells (edge means “depends on”).
- Detection MUST be pure and deterministic.

### 🚨 Constraints

- Module MUST NOT parse or evaluate formulas.
- Cycle errors MUST use @SheetErrorCode `"cycle"`.

### ✅ Acceptance Criteria

- [ ] A1→B1, B1→A1 detected as cycle.
- [ ] Acyclic A1→B1, B1→C1 → no error.
- [ ] wouldCreateCycle true when adding closing edge.

### 🧪 Test Scenarios

1. **Simple cycle** `id: detectCycle-simple`
   - Call: detectCycle
   - Input: edges A1→[B1], B1→[A1]
   - Expected: cycle error

```json
{
  "setup": {
    "edges": [
      { "from": { "col": "A", "row": 1 }, "to": [{ "col": "B", "row": 1 }] },
      { "from": { "col": "B", "row": 1 }, "to": [{ "col": "A", "row": 1 }] }
    ]
  },
  "expected": { "errorCode": "cycle" }
}
```

2. **No cycle** `id: detectCycle-none`
   - Call: detectCycle
   - Input: A1→[B1], B1→[]
   - Expected: error null

```json
{
  "setup": {
    "edges": [
      { "from": { "col": "A", "row": 1 }, "to": [{ "col": "B", "row": 1 }] },
      { "from": { "col": "B", "row": 1 }, "to": [] }
    ]
  },
  "expected": { "error": null }
}
```
