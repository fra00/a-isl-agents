# Project: Sheet Workspace

Shared spreadsheet domain: addresses, cell values, formula text, and evaluation errors.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./domain-sheet

---

## Domain Concepts

### CellAddr

Grid address in A1 notation (columns A–Z, rows 1–99 for this demo).

- **Identity**: Pair of column letter + row number.
- **Properties**:
  - `col`: String (required; single uppercase letter `A`–`Z`)
  - `row`: Number (required; integer 1–99)

### CellKind

Closed kind of cell content.

- **Identity**: Enumerated kind.
- **Properties**:
  - Values: `"empty"` | `"literal"` | `"formula"`

### SelectionKind

Closed kind of sheet selection (Excel-style).

- **Identity**: Enumerated selection mode.
- **Properties**:
  - Values: `"cell"` | `"col"` | `"row"` | `"range"`

### SheetSelection

Current edit/selection target: one cell, one whole column, one whole row, or a contiguous rectangular multi-cell range.

- **Identity**: Discriminated by `kind`.
- **Properties**:
  - `kind`: @SelectionKind (required)
  - `col`: String | null (required when kind is `cell` or `col`; letter `A`–`Z`; null for `row` / unused for `range`)
  - `row`: Number | null (required when kind is `cell` or `row`; integer 1–99; null for `col` / unused for `range`)
  - `start`: @CellAddr | null (required when kind is `range`; inclusive anchor / top-left after normalize)
  - `end`: @CellAddr | null (required when kind is `range`; inclusive opposite corner after normalize)

### SheetErrorCode

Machine-readable evaluation / edit failures.

- **Identity**: Enumerated error code.
- **Properties**:
  - Values: `"parse_error"` | `"cycle"` | `"ref_error"` | `"div_zero"` | `"type_error"` | `"out_of_bounds"` | `"unknown"`

### SheetError

Structured failure for formula bar and cells.

- **Identity**: Pair of `code` + human `message`.
- **Properties**:
  - `code`: @SheetErrorCode
  - `message`: String (safe for UI)

### CellFill

Closed background fill tokens for cells (demo palette — not free hex).

- **Identity**: Enumerated fill.
- **Properties**:
  - Values: `"none"` | `"yellow"` | `"green"` | `"blue"` | `"pink"` | `"gray"`

### CellTextColor

Closed text color tokens for cells (not font size).

- **Identity**: Enumerated text color.
- **Properties**:
  - Values: `"default"` | `"red"` | `"blue"` | `"green"`

### CellFontSize

Closed font size tokens for cells (Excel-light; not free px).

- **Identity**: Enumerated font size.
- **Properties**:
  - Values: `"sm"` | `"md"` | `"lg"`
  - Meaning for Presentation: `sm` smaller than default grid text, `md` default, `lg` larger / more prominent.

### CellAlign

Horizontal alignment inside a cell.

- **Identity**: Enumerated align.
- **Properties**:
  - Values: `"left"` | `"center"` | `"right"`

### CellStyle

Presentation style for one cell (Excel-light closed set).

- **Identity**: Style bundle on a @Cell.
- **Properties**:
  - `bold`: Boolean (Default: false)
  - `fill`: @CellFill (Default: `"none"`)
  - `textColor`: @CellTextColor (Default: `"default"`)
  - `fontSize`: @CellFontSize (Default: `"md"`)
  - `align`: @CellAlign (Default: `"left"`)

### Cell

One spreadsheet cell.

- **Identity**: Unique @CellAddr.
- **Properties**:
  - `addr`: @CellAddr (required)
  - `kind`: @CellKind (required)
  - `raw`: String (required; user-entered text; formula starts with `=`)
  - `display`: String (calculated snapshot for UI; empty while unknown)
  - `numberValue`: Number | null (calculated; null when non-numeric / error)
  - `error`: @SheetError | null (calculated)
  - `style`: @CellStyle (required; defaults via CellStyle factory)

### EvalResult

Outcome of evaluating one cell.

- **Identity**: Value or error.
- **Properties**:
  - `numberValue`: Number | null
  - `display`: String
  - `error`: @SheetError | null
  - `dependencies`: @CellAddr[] (addresses this formula reads)

## Component: SheetDomain

### Role: Domain

### ⚡ Capabilities

#### CellAddr

- **Contract**: Factory for @CellAddr.
- **Signature**: CellAddr(data: { col: String, row: Number }): @CellAddr
- **Flow**:
  1. Require `col` matching `^[A-Z]$` and integer `row` in 1–99.
  2. RETURN plain object `{ col, row }`.

#### parseA1

- **Contract**: Parse `"B12"` into @CellAddr.
- **Signature**: parseA1(text: String): @CellAddr | null
- **Flow**:
  1. Trim; match `^([A-Z])([1-9][0-9]?)$`.
  2. IF match: RETURN CellAddr; ELSE null.

#### formatA1

- **Contract**: Format @CellAddr as A1 string.
- **Signature**: formatA1(addr: @CellAddr): String

#### SheetSelection

- **Contract**: Factory for @SheetSelection.
- **Signature**: SheetSelection(data: { kind: @SelectionKind, col?: String | null, row?: Number | null, start?: @CellAddr | null, end?: @CellAddr | null }): @SheetSelection
- **Flow**:
  1. Require `kind` in `cell` | `col` | `row` | `range`.
  2. IF kind `cell`: require valid `col` and `row`; `start`/`end` null.
  3. IF kind `col`: require valid `col`; `row`/`start`/`end` null.
  4. IF kind `row`: require valid `row`; `col`/`start`/`end` null.
  5. IF kind `range`: require `start` and `end` @CellAddr; **normalize** so `start` is top-left and `end` is bottom-right (min/max col letters and rows); IF start equals end, keep a one-cell `range` (or coerce to kind `cell` — either is acceptable).
  6. RETURN plain object.

#### formatSelection

- **Contract**: Label for formula-bar chip / UI (`B2`, `B:B`, `3:3`, `A1:C3`).
- **Signature**: formatSelection(selection: @SheetSelection): String
- **Flow**:
  1. IF kind `cell`: RETURN formatA1.
  2. IF kind `col`: RETURN `` `${col}:${col}` ``.
  3. IF kind `row`: RETURN `` `${row}:${row}` ``.
  4. IF kind `range`: RETURN `` `${formatA1(start)}:${formatA1(end)}` `` (a one-cell range may return a single A1 label).

#### selectionContains

- **Contract**: Whether an address lies inside the selection (for grid highlight / fill iteration helpers).
- **Signature**: selectionContains(selection: @SheetSelection, addr: @CellAddr): Boolean
- **Flow**:
  1. IF kind `cell`: equal col+row.
  2. IF kind `col`: addr.col matches.
  3. IF kind `row`: addr.row matches.
  4. IF kind `range`: addr within inclusive rectangle start..end.

#### shiftFormulaRaw

- **Contract**: Relocate A1 references inside a formula (or leave literals unchanged) by row/col deltas — Excel relative fill when applying one template to a whole column or row (e.g. `=A1+B1` with rowDelta 2 → `=A3+B3`).
- **Signature**: shiftFormulaRaw(input: { raw: String, rowDelta?: Number, colDelta?: Number }): String
- **Flow**:
  1. IF `raw` does not start with `=` (after trim): RETURN `raw` unchanged (literal fill).
  2. Replace each A1 token `([A-Z])([1-9][0-9]?)` by shifting col letter by `colDelta` and row by `rowDelta`.
  3. IF a shifted address would leave A–Z / 1–99: keep the original token (do not invent out-of-bounds refs).
  4. RETURN the rewritten string.

#### SheetError

- **Contract**: Factory for @SheetError.
- **Signature**: SheetError(data: { code: @SheetErrorCode, message: String }): @SheetError

#### CellStyle

- **Contract**: Factory for @CellStyle with defaults.
- **Signature**: CellStyle(data?: { bold?: Boolean, fill?: @CellFill, textColor?: @CellTextColor, fontSize?: @CellFontSize, align?: @CellAlign }): @CellStyle
- **Flow**:
  1. Default `bold` false, `fill` `"none"`, `textColor` `"default"`, `fontSize` `"md"`, `align` `"left"`.
  2. IF provided enums are outside closed sets: treat as defaults for those fields.

#### Cell

- **Contract**: Factory for @Cell with defaults.
- **Signature**: Cell(data: { addr: @CellAddr, kind?: @CellKind, raw?: String, display?: String, numberValue?: Number | null, error?: @SheetError | null, style?: @CellStyle }): @Cell
- **Flow**:
  1. Require `addr`.
  2. Default `kind` `"empty"`, `raw` `""`, `display` `""`, `numberValue` null, `error` null, `style` CellStyle().

### 🚨 Constraints

- Address space MUST stay within A–Z and rows 1–99 for this workspace.
- Domain MUST NOT evaluate formulas or touch storage.
- @SheetErrorCode MUST remain closed until explicitly extended.
- Column fill MUST treat the typed formula as written for row `1`; row fill MUST treat it as written for column `A`.
- Multi-cell selection MUST be a single contiguous rectangle (`range`); non-contiguous (Ctrl+click islands) are out of scope until explicitly extended.
- @CellFill / @CellTextColor / @CellFontSize / @CellAlign MUST remain closed until explicitly extended (no free-form CSS/hex/px in Domain).

### ✅ Acceptance Criteria

- [ ] parseA1(`"C3"`) yields col C row 3.
- [ ] Invalid A1 returns null.
- [ ] Cell factory defaults empty fields including default @CellStyle.
- [ ] formatSelection col `B` yields `B:B`.
- [ ] shiftFormulaRaw(`=A1*2`, rowDelta 2) yields `=A3*2`.

### 🧪 Test Scenarios

1. **parseA1 valid** `id: parseA1-valid`
   - Call: parseA1
   - Input: `"A1"`
   - Expected: `{ col: "A", row: 1 }`

```json
{ "input": "A1", "expected": { "col": "A", "row": 1 } }
```

2. **parseA1 invalid** `id: parseA1-invalid`
   - Call: parseA1
   - Input: `"AA1"`
   - Expected: null

```json
{ "input": "AA1", "expected": null }
```

3. **Shift formula down (Excel C=A+B row)** `id: shiftFormulaRaw-row-delta-1`
   - Call: shiftFormulaRaw
   - Input: raw `=A1+B1`, rowDelta 1
   - Expected: `=A2+B2`

```json
{ "input": { "raw": "=A1+B1", "rowDelta": 1 }, "expected": "=A2+B2" }
```
