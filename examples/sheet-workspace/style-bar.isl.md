# Project: Sheet Workspace

Style bar: change closed cell style for the current selection (Excel-light toolbar).

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./style-bar

---

> **Reference**: @CellStyle, @CellFill, @CellTextColor, @CellFontSize, @CellAlign in `./domain-sheet.isl.md`.

## Component: StyleBar

### Role: Presentation

**Signature**:

- `style`: @CellStyle (current selection style draft)
- `disabled`: Boolean (Default: false; true when no selection)
- `onChange`: (style: @CellStyle) => void

### 🔍 Appearance

- Compact toolbar under or beside the formula bar: Bold, Fill, **Color** (text color), **Size** (font size), Align.
- Labels MUST say `Color` for @CellTextColor and `Size` for @CellFontSize (do not label color as “Text” — that was confusing with font size).
- Controls disabled when `disabled` is true.
- Size buttons MUST show a visible hierarchy (e.g. S / M / L with different label sizes).

### 📦 Content

- Bold button (pressed when `style.bold`)
- Fill chips for each @CellFill
- Color chips for each @CellTextColor (labeled Color)
- Size buttons for each @CellFontSize (`sm`/`md`/`lg`, labeled Size)
- Align buttons for each @CellAlign

### ⚡ Capabilities

#### toggleBold

- **Contract**: Toggles bold on the draft style and notifies parent.
- **Flow**: onChange({ ...style, bold: !style.bold })

#### pickFill

- **Contract**: Sets fill token.
- **Signature**: pickFill(fill: @CellFill): void
- **Flow**: onChange({ ...style, fill })

#### pickTextColor

- **Contract**: Sets text **color** token (not font size).
- **Signature**: pickTextColor(textColor: @CellTextColor): void
- **Flow**: onChange({ ...style, textColor })

#### pickFontSize

- **Contract**: Sets font size token; grid MUST render a visibly different text size.
- **Signature**: pickFontSize(fontSize: @CellFontSize): void
- **Flow**: onChange({ ...style, fontSize })

#### pickAlign

- **Contract**: Sets horizontal align.
- **Signature**: pickAlign(align: @CellAlign): void
- **Flow**: onChange({ ...style, align })

### 🚨 Constraints

- MUST NOT write the store directly (parent / hook applies style to selection).
- MUST NOT invent fill/color/size tokens outside Domain closed sets.
- MUST NOT evaluate formulas.

### ✅ Acceptance Criteria

- [ ] Toggle bold calls onChange with inverted bold.
- [ ] Pick fill `yellow` calls onChange with fill yellow.
- [ ] Pick size `lg` calls onChange with fontSize `lg`.
- [ ] Color controls are labeled Color (not Text-as-size).
- [ ] When disabled, controls do not call onChange.

### 🧪 Test Scenarios

1. **Bold**:
   - Input: click Bold while style.bold false
   - Expected: onChange with bold true

2. **Fill**:
   - Input: pick green
   - Expected: onChange fill `green`

3. **Font size**:
   - Input: pick `lg`
   - Expected: onChange fontSize `lg`
