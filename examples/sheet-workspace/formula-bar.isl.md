# Project: Sheet Workspace

Formula bar: edit raw text for the selected cell and commit.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./formula-bar

---

> **Reference**: @CellAddr, @SheetError, formatA1 in `./domain-sheet.isl.md`.

## Component: FormulaBar

### Role: Presentation

**Signature**:

- `selectedLabel`: String (A1, `B:B`, `3:3`, `A1:C3`, or empty)
- `value`: String
- `error`: @SheetError | null
- `disabled`: Boolean (Default: false; true when no sheet selection — value textbox and Enter MUST be inert)
- `focusRequest`: Number (Default: 0; when this value changes, focus the input)
- `insertRequest`: Number (Default: 0; when this value changes, insert `insertText` at caret)
- `insertText`: String (Default: `""`; A1 fragment to insert, already uppercase)
- `onChange`: (text: String) => void
- `onCommit`: () => void
- `onCancel`: () => void
- `onFocusChange`: (focused: Boolean) => void

### 🔍 Appearance

- Single-line input with leading address chip.
- Error text under the input when `error` non-null.
- When `disabled` is true, the value input and Enter control look inactive (not editable / not pressable).

### 📦 Content

- Address chip from `selectedLabel` (may show `—` when disabled / no selection)
- Text input bound to `value` (disabled when `disabled`)
- Enter button (disabled when `disabled`)
- Optional error message

### ⚡ Capabilities

#### typeText

- **Contract**: Updates draft via parent; letters are always uppercased (A1 refs stay valid).
- **Signature**: typeText(text: String): void
- **Flow**:
  1. IF `disabled` is true: RETURN.
  2. Let `normalized` = `text` with every Latin letter forced to uppercase (`toUpperCase`).
  3. onChange(normalized)

#### pressEnter

- **Contract**: Commits draft then leaves the formula textbox (blur), so ref-pick mode ends like Excel after confirm.
- **Signature**: pressEnter(): void
- **Trigger**: Enter key on the input, or the Enter button.
- **Flow**:
  1. IF `disabled` is true: RETURN.
  2. onCommit()
  3. Blur the text input DOM node (remove keyboard focus).
  4. reportFocus(false) via the resulting blur (or call onFocusChange(false) if blur does not fire).
  5. Blur after Enter MUST NOT run blurAssign again (commit already done).

#### pressEscape

- **Contract**: Cancels in-progress edits (Excel Esc): restores the previous committed value via parent, then blurs without assigning the draft.
- **Signature**: pressEscape(): void
- **Trigger**: Escape key while the formula input is focused.
- **Flow**:
  1. onCancel() — parent restores `formulaDraft` to the selection’s last committed raw (anchor cell).
  2. Suppress blurAssign for the upcoming blur (do not onCommit).
  3. Blur the text input DOM node.
  4. onFocusChange(false) via blur (or call it if blur does not fire).

#### focusInput

- **Contract**: Moves keyboard focus into the formula text input and selects its contents for quick overwrite.
- **Signature**: focusInput(): void
- **Trigger**: `focusRequest` prop changes (non-zero transition or any new value).
- **Flow**:
  1. IF `disabled` is true: RETURN (do not focus).
  2. Focus the text input DOM node.
  3. Select all current text (so typing replaces the draft).

#### reportFocus

- **Contract**: Tells the shell whether the formula input currently has keyboard focus (Excel-style ref picking).
- **Signature**: reportFocus(focused: Boolean): void
- **Trigger**: input `focus` / `blur`.
- **Flow**:
  1. IF `focused` is false AND blurAssign is not suppressed (not after Enter/Escape cancel): run blurAssign first.
  2. onFocusChange(focused)

#### blurAssign

- **Contract**: When the textbox loses focus normally, assign the draft to the current selection if it is a valid value (Excel-like confirm on leave).
- **Signature**: blurAssign(): void
- **Trigger**: input `blur` that is not caused by pressEscape cancel (and not a redundant post-Enter assign).
- **Flow**:
  1. IF `disabled` is true: RETURN.
  2. Let `draft` = trimmed `value`.
  3. IF `draft` is empty: RETURN (do not assign / do not clear via blur alone).
  4. Treat non-empty draft as a valid value to assign (literal or formula text); call onCommit().
  5. MUST NOT re-focus the input.

#### insertAtCaret

- **Contract**: Inserts an A1 token into the draft at the caret (replacing any selection), keeps focus, places caret after the insert — Excel-like cell pick while editing.
- **Signature**: insertAtCaret(fragment: String): void
- **Trigger**: `insertRequest` prop changes while `insertText` is non-empty.
- **Flow**:
  1. Read caret `start`/`end` from the input (selection).
  2. Build `next` = value before start + uppercase(fragment) + value after end.
  3. onChange(next).
  4. Focus input; set selection to after the inserted fragment.

### 🚨 Constraints

- MUST NOT write the store directly.
- MUST NOT evaluate formulas.
- Typed / pasted draft text MUST be uppercased before calling `onChange` (so `=a1*2` becomes `=A1*2` in the controlled value).
- Inserted fragments MUST be uppercased before merge.
- After a successful pressEnter (keyboard Enter or Enter button), the formula text input MUST NOT retain focus.
- When the textbox blurs with a non-empty draft (and cancel was not requested), that draft MUST be assigned via onCommit (blurAssign).
- Blur with an empty draft MUST NOT call onCommit.
- Escape MUST call onCancel, MUST blur, and MUST NOT call onCommit / blurAssign.
- When `disabled` is true, the value textbox MUST NOT accept typing and Enter/Escape/commit/blurAssign MUST NOT assign.

### ✅ Acceptance Criteria

- [ ] Enter calls onCommit then blurs the text input.
- [ ] Blur with non-empty value calls onCommit (assign).
- [ ] Blur with empty value does not call onCommit.
- [ ] Escape calls onCancel then blurs; onCommit is not called.
- [ ] When `disabled` is true, the value input cannot be edited and onChange/onCommit are not fired from typing/Enter.
- [ ] Error message visible when error set.
- [ ] When `focusRequest` increments and not disabled, the text input receives focus.
- [ ] Typing or pasting lowercase letters yields uppercase in the draft (e.g. `a1` → `A1`).
- [ ] When `insertRequest` bumps with `insertText` `B2` and caret after `=`, value becomes `=B2` and input stays focused.

### 🧪 Test Scenarios

1. **Commit and blur**:
   - Input: press Enter while input focused
   - Expected: onCommit; input is not focused afterward

1b. **Blur assigns**:
   - Input: value `10`; input blurs (click outside / Tab)
   - Expected: onCommit once with that draft applied by parent

1c. **Escape cancel**:
   - Input: draft changed from `10` to `99`; press Escape
   - Expected: onCancel once; no onCommit; input not focused

1d. **Disabled without selection**:
   - Input: disabled true; attempt to type
   - Expected: no onChange

2. **Focus request**:
   - Input: focusRequest goes from 0 to 1
   - Expected: input is focused

3. **Uppercase refs**:
   - Input: type `=b2+1`
   - Expected: onChange receives `=B2+1`

4. **Insert at caret**:
   - Input: value `=`, caret at end; insertRequest with insertText `C3`
   - Expected: onChange `=C3`; caret after `C3`
