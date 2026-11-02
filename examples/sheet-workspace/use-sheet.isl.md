# Project: Sheet Workspace

Business Logic hook: edit cells, recompute with cycle detection, expose matrix + selection.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./use-sheet

---

> **Reference**: @Cell, @CellAddr, @CellStyle, @SheetSelection, @SheetError, @EvalResult, formatA1, formatSelection, shiftFormulaRaw, SheetSelection, CellStyle in `./domain-sheet.isl.md`.
> **Reference**: SheetStore in `./sheet-store.isl.md`.
> **Reference**: formulaParser in `./formula-parser.isl.md`.
> **Reference**: dependencyGraph in `./dependency-graph.isl.md`.
> **Reference**: formulaEvaluator in `./formula-evaluator.isl.md`.

## Component: useSheet

### Role: Business Logic

**Signature**: useSheet({ sheetStore: SheetStore })

### 🗂 Internal State

- `matrix`: @Cell[][] — **calculated** from store snapshot after recompute
- `selection`: @SheetSelection | null — **internal** (cell, column, row, or rectangular range)
- `formulaDraft`: String — **internal** (formula bar text while editing)
- `styleDraft`: @CellStyle — **internal** (style bar draft for current selection)
- `status`: `"ready"` | `"recomputing"` — **internal**
- `lastError`: @SheetError | null — **internal** (sheet-level; cell errors live on @Cell)

### ⚡ Capabilities

#### boot

- **Contract**: Loads matrix from store and runs initial recompute.
- **Signature**: boot(): void

#### selectCell

- **Contract**: Selects one cell and loads its `raw` / `style` into drafts.
- **Signature**: selectCell(addr: @CellAddr): void
- **Flow**:
  1. Set selection to SheetSelection kind `cell` for addr.
  2. formulaDraft = store.getCell(addr).raw.
  3. styleDraft = store.getCell(addr).style.

#### selectColumn

- **Contract**: Selects an entire column (header click). Drafts load from the top cell (row 1).
- **Signature**: selectColumn(col: String): void
- **Flow**:
  1. Set selection kind `col` with that `col`.
  2. Load formulaDraft and styleDraft from getCell({ col, row: 1 }).

#### selectRow

- **Contract**: Selects an entire row (header click). Drafts load from the leftmost cell (column A).
- **Signature**: selectRow(row: Number): void
- **Flow**:
  1. Set selection kind `row` with that `row`.
  2. Load formulaDraft and styleDraft from getCell({ col: "A", row }).

#### selectRange

- **Contract**: Selects a contiguous rectangular multi-cell range (Excel multi-select). Drafts load from the **anchor** = normalized `start` (top-left).
- **Signature**: selectRange(input: { start: @CellAddr, end: @CellAddr }): void
- **Flow**:
  1. Set selection to SheetSelection kind `range` with normalized start/end.
  2. IF start equals end after normalize: set kind `cell` (preferred) or keep a one-cell `range`.
  3. Load formulaDraft and styleDraft from getCell(start).

#### extendSelectionTo

- **Contract**: Extends the current selection into a range ending at `addr` (Shift+click / drag end). Anchor stays the original cell/range start.
- **Signature**: extendSelectionTo(addr: @CellAddr): void
- **Flow**:
  1. IF no selection: selectCell(addr); RETURN.
  2. Let `anchor` = current cell addr, or range.start, or for col/row the first cell of that header selection (col → row 1; row → col A).
  3. selectRange({ start: anchor, end: addr }).

#### setFormulaDraft

- **Contract**: Updates the formula bar draft only (no commit).
- **Signature**: setFormulaDraft(text: String): void

#### cancelEdit

- **Contract**: Discards in-progress formula bar edits (Excel Esc): restores `formulaDraft` to the selection anchor’s last committed `raw` from the store; does not write the store.
- **Signature**: cancelEdit(): void
- **Flow**:
  1. IF no selection: set formulaDraft `""`; RETURN.
  2. Let `anchor` = cell addr / col→row1 / row→colA / range.start.
  3. formulaDraft = sheetStore.getCell(anchor).raw (even if empty).
  4. lastError = that cell’s error (or null).
  5. MUST NOT call setRaw / commitSelected / recomputeAll.

#### applyStyle

- **Contract**: Applies a @CellStyle to the current selection immediately (cell, column, row, or every cell in a range), then refreshes matrix.
- **Signature**: applyStyle(style: @CellStyle): void
- **Flow**:
  1. IF no selection: RETURN.
  2. Set styleDraft = style.
  3. IF kind `cell`: sheetStore.setStyle({ addr, style }).
  4. IF kind `col`: FOR each row `r` in 1..rows → setStyle({ col, row: r }, style).
  5. IF kind `row`: FOR each column in bounds → setStyle on that row.
  6. IF kind `range`: FOR each addr in inclusive rectangle start..end → setStyle({ addr, style }).
  7. Refresh `matrix` from snapshotMatrix (style-only change MUST still update matrix).

#### commitSelected

- **Contract**: Commits formulaDraft to the selection (one cell, or fill column/row/range with Excel-style relative refs), then recomputes.
- **Signature**: commitSelected(): void
- **Flow**:
  1. IF no selection: RETURN.
  2. IF kind `cell`: setRaw({ addr, raw: formulaDraft }).
  3. IF kind `col`: Treat `formulaDraft` as written for **row 1** (Excel fill-down). FOR each row `r` in 1..sheetStore.rows:
     - `raw` = shiftFormulaRaw({ raw: formulaDraft, rowDelta: r - 1, colDelta: 0 })
     - setRaw({ addr: { col: selection.col, row: r }, raw })
     - Example: selection col `C`, draft `=A1+B1` → C1 `=A1+B1`, C2 `=A2+B2`, … Cn `=An+Bn`.
  4. IF kind `row`: Treat `formulaDraft` as written for **column A** (Excel fill-right). FOR each column index `i` in 0..sheetStore.cols-1:
     - `colLetter` = A+i
     - `raw` = shiftFormulaRaw({ raw: formulaDraft, rowDelta: 0, colDelta: i })
     - setRaw({ addr: { col: colLetter, row: selection.row }, raw })
  5. IF kind `range`: Treat `formulaDraft` as written for the **start** (top-left) cell. FOR each addr in the rectangle:
     - `rowDelta` = addr.row - start.row; `colDelta` = colIndex(addr.col) - colIndex(start.col)
     - `raw` = shiftFormulaRaw({ raw: formulaDraft, rowDelta, colDelta })
     - setRaw({ addr, raw })
  6. recomputeAll().
  7. Update lastError from the anchor cell (cell; col → row 1; row → col A; range → start) when cycle/parse_error; else clear when clean.
  8. Keep formulaDraft as the template text the user typed (do not replace with a shifted cell raw).

#### recomputeAll

- **Contract**: Rebuilds dependency graph, rejects cycles per formula, evaluates acyclic cells.
- **Signature**: recomputeAll(): void
- **Flow**:
  1. Set status recomputing.
  2. For each formula cell: parse → collect deps; IF parse fails, replaceComputed with parse_error.
  3. Build graph via dependencyGraph.build; IF detectCycle → for each formula on the cycle path, replaceComputed with `cycle` error (numberValue null); skip eval of those nodes.
  4. Topologically order remaining formula cells (or iterate with memo); evaluateAst with resolve(addr) reading literal numbers / already computed values; IF resolve hits a cell with error → ref_error.
  5. Literals: evaluateLiteral + replaceComputed.
  6. Refresh `matrix` from snapshotMatrix; status ready.

### 🚨 Constraints

- Hook MUST call React hooks only at top level; config is a single object.
- Hook MUST run cycle detection before evaluating a formula that would close a cycle.
- Hook MUST NOT invent formula languages beyond formulaParser.
- Mutators MUST be referentially stable.
- Column fill MUST apply a relatively shifted formula to every row (Excel fill-down); row fill MUST apply a relatively shifted formula to every column in bounds (Excel fill-right).
- Column formula template MUST be authored as for row 1 (e.g. `=A1+B1` on column C means every row `Cn=An+Bn`).
- Literal drafts (no leading `=`) MUST be written identically to every target cell in the fill.
- applyStyle on a column/row/range MUST set the same @CellStyle on every target cell (no relative shift — style is absolute).
- Range multi-select MUST be contiguous only; formula fill on a range MUST relatively shift from the top-left template cell.
- cancelEdit MUST restore the pre-edit committed raw and MUST NOT persist the discarded draft.

### ✅ Acceptance Criteria

- [ ] Enter `=A1+1` in B1 with A1 literal `2` → B1 displays 3.
- [ ] A1=`=B1` and B1=`=A1` → both show cycle error.
- [ ] Bad formula `=A1+` → parse_error on that cell.
- [ ] Select column B, commit `=A1*2` → B1..Bn show A1*2, A2*2, … respectively.
- [ ] Select column C, commit `=A1+B1` → each row `Cn` raw is `=An+Bn` and displays An+Bn (Excel column formula).
- [ ] Select row 2, commit `=A1` → A2 gets `=A1` shifted by col for B2=`=B1`, etc.
- [ ] applyStyle bold+yellow on A1 → matrix cell A1 shows that style; raw unchanged.
- [ ] applyStyle on column C → every cell in C gets that style.
- [ ] selectRange A1:B2 then commit `=10` → A1,A2,B1,B2 all get literal `10`.
- [ ] selectRange A1:A2 then commit `=B1` → A1 `=B1`, A2 `=B2`.
- [ ] After editing draft away from committed raw, cancelEdit restores the committed raw without store writes.

### 🧪 Test Scenarios

1. **Acyclic add**:
   - Input: A1 `2`, B1 `=A1+3`, commit
   - Expected: B1 display `5`

2. **Cycle**:
   - Input: A1 `=B1`, B1 `=A1`
   - Expected: both cells error code `cycle`

3. **Parse error**:
   - Input: A1 `=A1*`
   - Expected: parse_error on A1

4. **Column fill**:
   - Input: select col B; draft `=A1*2`; commit; A1=`10`, A2=`3`
   - Expected: B1 display `20`, B2 display `6`

5. **Excel column C = A + B**:
   - Input: A1=`10`, B1=`5`, A2=`2`, B2=`3`; select col C; draft `=A1+B1`; commit
   - Expected: C1 raw `=A1+B1` display `15`; C2 raw `=A2+B2` display `5`

6. **Cell style**:
   - Input: select A1; applyStyle `{ bold: true, fill: "yellow" }`
   - Expected: A1.style.bold true; A1.style.fill yellow; A1.raw unchanged

7. **Multi-select range fill**:
   - Input: selectRange A1:B2; draft `=C1`; commit
   - Expected: A1 `=C1`, A2 `=C2`, B1 `=D1`, B2 `=D2`

8. **Cancel edit**:
   - Input: A1 committed `10`; setFormulaDraft `99`; cancelEdit
   - Expected: formulaDraft `10`; store A1 still `10`
