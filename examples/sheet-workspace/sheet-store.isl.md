# Project: Sheet Workspace

Backend boundary: in-memory grid of @Cell keyed by A1.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./sheet-store

---

> **Reference**: @Cell, @CellAddr, @CellKind, @CellStyle, @SheetError, formatA1, Cell, CellStyle in `./domain-sheet.isl.md`.

## Component: SheetStore

### Role: Backend

**Signature**:

- `rows`: Number (Default: 20)
- `cols`: Number (Default: 8; maps to A…)

### ⚡ Capabilities

#### getCell

- **Contract**: Returns the cell at addr (empty cell if never set).
- **Signature**: getCell(addr: @CellAddr): @Cell

#### setRaw

- **Contract**: Writes user raw text and provisional kind; clears computed fields pending recompute; **preserves** existing `style`.
- **Signature**: setRaw(input: { addr: @CellAddr, raw: String }): @Cell
- **Flow**:
  1. IF addr out of bounds → MUST throw/return via caller policy as out_of_bounds (store rejects).
  2. Classify kind: empty / formula (`=` prefix) / literal.
  3. Persist Cell with display `""`, numberValue null, error null until engine recomputes; keep prior `style` (or default CellStyle if new).

#### setStyle

- **Contract**: Writes @CellStyle for an address without changing raw/computed value fields (may materialize an empty cell that only has style).
- **Signature**: setStyle(input: { addr: @CellAddr, style: @CellStyle }): @Cell
- **Flow**:
  1. IF addr out of bounds → reject as out_of_bounds.
  2. Merge onto existing cell (or empty Cell at addr); set `style` to the provided @CellStyle.
  3. RETURN updated @Cell.

#### listCells

- **Contract**: Returns all non-empty cells (raw non-empty **or** non-default style).
- **Signature**: listCells(): @Cell[]

#### replaceComputed

- **Contract**: Writes computed display/number/error for an address after evaluation; **MUST preserve** `style` and `raw`/`kind`.
- **Signature**: replaceComputed(input: { addr: @CellAddr, display: String, numberValue: Number | null, error: @SheetError | null }): @Cell

#### snapshotMatrix

- **Contract**: Returns rows×cols of @Cell for the viewport (empty fillers allowed, each with @CellStyle).
- **Signature**: snapshotMatrix(): @Cell[][]

### 🚨 Constraints

- Store MUST NOT parse or evaluate formulas.
- Store MUST NOT detect cycles.
- Presentation MUST NOT call replaceComputed (only the sheet engine / hook).
- setRaw / replaceComputed MUST NOT wipe `style`.

### ✅ Acceptance Criteria

- [ ] setRaw(`A1`,`=B1+1`) stores kind formula.
- [ ] getCell never-set returns empty Cell with default style.
- [ ] snapshotMatrix dimensions match rows×cols.
- [ ] setStyle then setRaw keeps the style.

### 🧪 Test Scenarios

1. **Set formula raw**:
   - Input: A1 `=B1+1`
   - Expected: kind formula; error null until recompute

2. **Empty get**:
   - Input: getCell Z9 on fresh store
   - Expected: kind empty

3. **Style survives raw**:
   - Input: setStyle A1 bold; setRaw A1 `10`
   - Expected: raw `10`; style.bold true
