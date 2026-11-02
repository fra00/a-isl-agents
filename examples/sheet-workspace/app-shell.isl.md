# Project: Sheet Workspace

App shell composes sheet hook, formula bar, and grid.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./app-shell

---

> **Reference**: SheetStore in `./sheet-store.isl.md`.
> **Reference**: useSheet in `./use-sheet.isl.md`.
> **Reference**: FormulaBar in `./formula-bar.isl.md`.
> **Reference**: StyleBar in `./style-bar.isl.md`.
> **Reference**: GridPage in `./grid-page.isl.md`.
> **Reference**: formatA1, formatSelection in `./domain-sheet.isl.md`.

## Component: AppShell

### Role: Presentation

**Signature**:

- `sheetStore`: SheetStore

### 🗂 Internal State

- Snapshot from `useSheet({ sheetStore })` — **external** via hook
- `focusRequest`: Number — **internal** (incremented to ask FormulaBar to focus)
- `formulaBarFocused`: Boolean — **internal** (true while formula input has focus)
- `insertRequest`: Number — **internal** (bumped to ask FormulaBar to insert)
- `insertText`: String — **internal** (A1 fragment pending insert)
- `refPickActive`: Boolean — **calculated**: true only when formula bar is focused **and** `formulaDraft` trimmed starts with `=` (Excel formula-edit mode)

### 🔍 Appearance

- Full-height workspace: title header, FormulaBar, StyleBar, GridPage.
- lastError / cell errors surfaced via bar and grid tinting.
- Formula-bar chip shows `A1`, `B:B`, `3:3`, or `A1:C3` via formatSelection.
- StyleBar reflects `styleDraft` for the selection.

### 📦 Content

- Header “Sheet Workspace”
- FormulaBar bound to selection label + draft + commit + cancel (Esc) + focus/insert; **disabled when `selection` is null**
- StyleBar bound to styleDraft + applyStyle (disabled when no selection)
- GridPage bound to matrix + selection + row/col/range multi-select + begin-edit + ref-pick mode

### ⚡ Capabilities

#### bootShell

- **Contract**: Boots the sheet hook on mount.
- **Signature**: bootShell(): void
- **Trigger**: Mount.
- **Flow**:
  1. useSheet.boot().

#### onSelectCell

- **Contract**: Forwards grid cell selection to the hook (when not picking a formula ref).
- **Signature**: onSelectCell(addr: @CellAddr): void
- **Flow**:
  1. useSheet.selectCell(addr).

#### onSelectColumn

- **Contract**: Forwards column-header selection to the hook.
- **Signature**: onSelectColumn(col: String): void
- **Flow**:
  1. useSheet.selectColumn(col).

#### onSelectRow

- **Contract**: Forwards row-header selection to the hook.
- **Signature**: onSelectRow(row: Number): void
- **Flow**:
  1. useSheet.selectRow(row).

#### onSelectRange

- **Contract**: Forwards rectangular multi-cell selection to the hook.
- **Signature**: onSelectRange(input: { start: @CellAddr, end: @CellAddr }): void
- **Flow**:
  1. useSheet.selectRange(input).

#### onExtendSelection

- **Contract**: Forwards Shift+click / drag-end extension to the hook.
- **Signature**: onExtendSelection(addr: @CellAddr): void
- **Flow**:
  1. useSheet.extendSelectionTo(addr).

#### onBeginEditCell

- **Contract**: After grid double-click, ensures selection then focuses the formula bar.
- **Signature**: onBeginEditCell(addr: @CellAddr): void
- **Flow**:
  1. useSheet.selectCell(addr).
  2. Increment `focusRequest` so FormulaBar.focusInput runs.

#### onFormulaFocusChange

- **Contract**: Tracks whether the formula bar input is focused (enables Excel-style cell ref picking).
- **Signature**: onFormulaFocusChange(focused: Boolean): void
- **Flow**:
  1. Set `formulaBarFocused` = focused.

#### onPickRefCell

- **Contract**: While editing in the formula bar, a grid cell pick inserts that cell’s A1 address into the draft (does not change the edited selection).
- **Signature**: onPickRefCell(addr: @CellAddr): void
- **Flow**:
  1. Set `insertText` = formatA1(addr).
  2. Increment `insertRequest` so FormulaBar.insertAtCaret runs.
  3. MUST NOT change useSheet selection.

#### onChangeDraft

- **Contract**: Forwards formula bar typing to the hook.
- **Signature**: onChangeDraft(text: String): void
- **Flow**:
  1. useSheet.setFormulaDraft(text).

#### onCommit

- **Contract**: Forwards formula bar commit to the hook (fills column/row/range when those are selected).
- **Signature**: onCommit(): void
- **Flow**:
  1. useSheet.commitSelected().

#### onCancelEdit

- **Contract**: Forwards Escape cancel: restore previous committed draft, no assign.
- **Signature**: onCancelEdit(): void
- **Flow**:
  1. useSheet.cancelEdit().

#### onChangeStyle

- **Contract**: Applies style-bar changes to the current selection (cell / column / row / range).
- **Signature**: onChangeStyle(style: @CellStyle): void
- **Flow**:
  1. useSheet.applyStyle(style).

### 🚨 Constraints

- Shell MUST compose useSheet; MUST NOT evaluate formulas inline.
- Demo MAY inject in-memory SheetStore.
- Double-click edit MUST land keyboard focus in the formula bar input (not in-cell editing).
- GridPage `refPickActive` MUST be true only in formula-edit mode (`formulaBarFocused` and draft starts with `=`): cell picks insert A1 into the draft; selection stays.
- When the formula bar is focused but the draft is a **literal** (does not start with `=`), a grid cell click MUST NOT use ref-pick: the input blurs, blurAssign commits the draft to the previous selection, then the click MUST select the new cell (Excel leave-edit).
- Ref pick MUST NOT change selection (cell / column / row / range stays).
- Formula bar `selectedLabel` MUST use formatSelection(selection).
- FormulaBar MUST receive `disabled={selection == null}` so the value textbox is inert until a cell/column/row/range is selected.

### ✅ Acceptance Criteria

- [ ] User can select A1, type `10`, commit, see display 10.
- [ ] User can set B1 to `=A1*2` and see 20.
- [ ] Mutual refs show cycle on both cells.
- [ ] Double-click a cell focuses the formula bar text input with that cell’s draft selected.
- [ ] With formula bar focused and draft `=`, clicking C2 inserts `C2` into the draft; selection chip stays on the edited target.
- [ ] With formula bar focused and draft `10` (literal) on A1, clicking B2 commits `10` to A1 and selects B2.
- [ ] Click column header B selects `B:B`; committing `=A1*2` fills every row in B with shifted formulas.
- [ ] Click column header C; commit `=A1+B1` → every row shows Cn = An + Bn (Excel column formula).
- [ ] With a cell selected, StyleBar bold + yellow fill updates that cell’s style in the grid.
- [ ] With column C selected, StyleBar fill applies to every cell in C.
- [ ] Drag or Shift+click selects a range `A1:B2`; chip shows `A1:B2`; style/formula apply to all cells in the range.
- [ ] Escape in the formula bar restores the previous cell value and blurs without committing.
- [ ] With no selection, the formula value textbox is disabled.

### 🧪 Test Scenarios

1. **Literal + formula**:
   - Input: A1=10, B1==A1*2
   - Expected: B1 shows 20

2. **Cycle demo**:
   - Input: A1==B1, B1==A1
   - Expected: cycle errors visible

3. **Double-click edit**:
   - Input: double-click B2
   - Expected: B2 selected; formula bar input focused

4. **Excel ref pick**:
   - Input: select A1; focus formula bar; type `=`; click B1
   - Expected: draft `=B1`; selection remains A1; input still focused

4b. **Leave edit by clicking another cell**:
   - Input: select A1; type `10` in formula bar; click B2
   - Expected: A1 committed `10`; selection B2; formula bar not focused (or draft shows B2 raw)

5. **Column fill**:
   - Input: click header B; enter `=A1*2`; Enter
   - Expected: each Bn displays An*2

6. **Column C = A + B**:
   - Input: values in A and B; click header C; enter `=A1+B1`; Enter / blur-commit
   - Expected: each Cn displays An+Bn; raws are `=An+Bn`

7. **Style cell**:
   - Input: select A1; toggle Bold; pick fill yellow
   - Expected: A1 appears bold on yellow; value unchanged

8. **Multi-select**:
   - Input: drag A1 to B2; chip `A1:B2`; apply yellow fill
   - Expected: A1,A2,B1,B2 all yellow

9. **Escape cancel**:
   - Input: A1 value `10`; edit draft to `99`; press Escape
   - Expected: draft back to `10`; store unchanged; formula bar not focused

10. **No selection disables value box**:
   - Input: fresh boot, no cell clicked
   - Expected: formula value input disabled until a cell (or header) is selected
