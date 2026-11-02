# Project: Sheet Workspace

Grid presentation: matrix of cells, selection highlight, shows display or error mark.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./grid-page

---

> **Reference**: @Cell, @CellAddr, @CellStyle, @SheetSelection, formatA1, selectionContains in `./domain-sheet.isl.md`.

## Component: GridPage

### Role: Presentation

**Signature**:

- `matrix`: @Cell[][]
- `selection`: @SheetSelection | null
- `refPickActive`: Boolean (Default: false; when true — formula-edit mode only — cell press inserts a ref instead of changing selection / committing via blur)
- `onSelect`: (addr: @CellAddr) => void
- `onSelectColumn`: (col: String) => void
- `onSelectRow`: (row: Number) => void
- `onExtendSelection`: (addr: @CellAddr) => void
- `onSelectRange`: (input: { start: @CellAddr, end: @CellAddr }) => void
- `onBeginEdit`: (addr: @CellAddr) => void
- `onPickRef`: (addr: @CellAddr) => void

### 🔍 Appearance

- Spreadsheet grid with column headers A… and row headers 1… (headers are clickable).
- Selected cell / entire selected column / entire selected row / rectangular **range** visually distinct (all cells where selectionContains is true).
- Cells with error show a marker / error-tinted display; otherwise show `display` or empty.
- Each cell MUST reflect its `@CellStyle`: bold weight, fill background token, text color token, **font size** (`sm`/`md`/`lg` visibly different), and text alignment.

### 📦 Content

- Header row of column letters (click → select column)
- Body rows with row index (click → select row) + cell buttons/fields (display-only in grid; editing via formula bar)

### ⚡ Capabilities

#### clickCell

- **Contract**: Selects a single cell (normal mode only).
- **Signature**: clickCell(addr: @CellAddr): void
- **Flow**:
  1. IF `refPickActive` is true: RETURN (ref pick already handled on press).
  2. onSelect(addr)

#### shiftClickCell

- **Contract**: Extends selection to a rectangular range ending at this cell (Excel Shift+click).
- **Signature**: shiftClickCell(addr: @CellAddr): void
- **Trigger**: Click with Shift held (and not ref-pick).
- **Flow**:
  1. IF `refPickActive` is true: RETURN.
  2. onExtendSelection(addr)

#### dragSelectRange

- **Contract**: Pointer drag across cells creates/updates a contiguous range selection (Excel click-drag).
- **Signature**: dragSelectRange(input: { start: @CellAddr, end: @CellAddr }): void
- **Trigger**: mousedown on a cell (not ref-pick) then pointermove over other cells until mouseup.
- **Flow**:
  1. IF `refPickActive` is true: RETURN.
  2. On drag start: remember `start` addr (optionally call onSelect(start) first).
  3. On drag over / mouseup: onSelectRange({ start, end }) or onExtendSelection(end).

#### clickColumnHeader

- **Contract**: Selects the whole column.
- **Signature**: clickColumnHeader(col: String): void
- **Trigger**: Click on a column letter header.
- **Flow**:
  1. IF `refPickActive` is true: RETURN.
  2. onSelectColumn(col)

#### clickRowHeader

- **Contract**: Selects the whole row.
- **Signature**: clickRowHeader(row: Number): void
- **Trigger**: Click on a row number header.
- **Flow**:
  1. IF `refPickActive` is true: RETURN.
  2. onSelectRow(row)

#### pressCellForRef

- **Contract**: In formula-edit mode only, picking a cell inserts its A1 address into the draft (Excel-style) without stealing focus from the input.
- **Signature**: pressCellForRef(addr: @CellAddr): void
- **Trigger**: `mousedown` / pointer down on a cell when `refPickActive` is true.
- **Flow**:
  1. Prevent default browser focus change (so the formula input does not blur).
  2. onPickRef(addr)

#### leaveEditByCellClick

- **Contract**: When `refPickActive` is false, a cell press MUST allow the formula input to blur (so blurAssign can commit a literal) and then select that cell — do **not** preventDefault on mousedown.
- **Signature**: (behavior constraint on clickCell / drag start)
- **Flow**:
  1. IF `refPickActive` is false: normal select / drag paths; browser may blur the formula bar first.
  2. MUST NOT call onPickRef.

#### doubleClickCell

- **Contract**: Selects the cell and asks the shell to focus the formula bar for editing.
- **Signature**: doubleClickCell(addr: @CellAddr): void
- **Trigger**: Double-click on a cell.
- **Flow**:
  1. IF `refPickActive` is true: RETURN (do not retarget the edited cell mid-formula).
  2. onSelect(addr)
  3. onBeginEdit(addr)

### 🚨 Constraints

- Grid MUST NOT commit edits (formula bar owns commit).
- Grid MUST NOT call SheetStore.
- Grid MUST NOT focus the formula bar DOM itself (shell + FormulaBar own focus).
- When `refPickActive` is true, cell press MUST call `onPickRef` and MUST preventDefault on mousedown; drag/shift multi-select MUST NOT run.
- When `refPickActive` is false, cell mousedown MUST NOT preventDefault solely to keep formula-bar focus (literal leave-edit must blur + commit + select).
- Header clicks MUST NOT run while `refPickActive` (avoid dropping formula-bar focus / selection mid-edit).
- Multi-select MUST only produce contiguous rectangles (no Ctrl+disjoint islands in this version).

### ✅ Acceptance Criteria

- [ ] Click cell calls onSelect with that addr when refPickActive is false.
- [ ] Shift+click B3 after A1 selected calls onExtendSelection B3 (range A1:B3).
- [ ] Drag from A1 to C2 calls onSelectRange / extend covering A1:C2.
- [ ] Click column header `C` calls onSelectColumn(`C`).
- [ ] Click row header `4` calls onSelectRow(4).
- [ ] When selection kind is `col` for B, every cell in column B is highlighted.
- [ ] When selection kind is `range` A1:B2, those four cells are highlighted.
- [ ] When refPickActive is true, mousedown on a cell calls onPickRef and does not call onSelect.
- [ ] When refPickActive is false, clicking a cell calls onSelect (blur/commit of formula bar is allowed to happen).
- [ ] Double-click cell calls onSelect then onBeginEdit with that addr when not picking refs.
- [ ] Error cells visually distinct.
- [ ] A cell with style fill `yellow` and bold true is visually bold on a yellow-tinted background.
- [ ] A cell with fontSize `lg` renders larger text than `md` / `sm`.

### 🧪 Test Scenarios

1. **Select**:
   - Input: click B2 (refPickActive false)
   - Expected: onSelect B2

2. **Begin edit**:
   - Input: double-click C3 (refPickActive false)
   - Expected: onSelect C3 then onBeginEdit C3

3. **Pick ref**:
   - Input: refPickActive true; mousedown on D4
   - Expected: onPickRef D4; onSelect not called

4. **Select column**:
   - Input: click header B
   - Expected: onSelectColumn B

5. **Multi-select drag**:
   - Input: drag A1 → B2
   - Expected: onSelectRange start A1 end B2 (or equivalent extend)
