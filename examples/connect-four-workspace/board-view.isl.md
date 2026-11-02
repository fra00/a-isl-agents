# Project: Connect Four Workspace

Board presentation: 6×7 slots, clickable columns, drop animation, highlight winning line.

**Version**: 1.1.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./board-view

---

> **Reference**: @GameState, @CellState, @PlayerId in `./domain-game.isl.md`.

## Component: BoardView

### Role: Presentation

**Signature**:

- `state`: @GameState
- `legalColumns`: Number[]
- `disabled`: Boolean (Default: false)
- `onPlayColumn`: (col: Number) => void

### 🗂 Internal State

- `dropAnim`: { col: Number, row: Number, player: @PlayerId } | null — **internal**; active falling disc, or null when idle
- `settledKey`: String | null — **internal**; last consumed `lastMove` identity so the same move does not re-trigger

### 🔍 Appearance

- Vertical columns of circular slots; red/yellow/empty disc colors.
- Illegal / full columns appear inert; legal columns afford click/hover.
- On a successful drop, the played disc MUST visually fall from above the column (or from row 0) down to the landing slot `lastMove.row`, then rest there.
- While `dropAnim` is non-null, column clicks look inert (same as disabled).
- If `winningLine` present, those slots are highlighted only after the drop animation has settled (or immediately if there is no active drop for that move).

### 📦 Content

- 7 columns × 6 rows grid reflecting `state.cells`
- Optional column drop targets above the board
- Transient falling disc overlay for `dropAnim` (same color as `player`)

### ⚡ Capabilities

#### clickColumn

- **Contract**: Requests a drop when enabled, idle, and col is legal.
- **Signature**: clickColumn(col: Number): void
- **Flow**:
  1. IF disabled OR dropAnim ≠ null OR col not in legalColumns: ignore.
  2. onPlayColumn(col).

#### syncDropAnimation

- **Contract**: Starts a column-fall animation when `state.lastMove` describes a new successful drop.
- **Signature**: syncDropAnimation(): void
- **Trigger**: `state` / `state.lastMove` change (after parent applies a successful play).
- **Flow**:
  1. IF `state.lastMove` is null: clear dropAnim; set settledKey null; RETURN.
  2. Let key = `"${lastMove.col}:${lastMove.row}"` (or equivalent stable identity).
  3. IF key equals settledKey: RETURN (already consumed).
  4. Resolve `player` from `state.cells[lastMove.row][lastMove.col]` (MUST be `"red"` or `"yellow"`).
  5. Set dropAnim { col: lastMove.col, row: lastMove.row, player }.
  6. Animate the disc from the top of that column to row `lastMove.row`. Duration SHOULD be ~300–450ms and MAY scale slightly with travel distance (higher landing row → shorter fall).
  7. On animation end: clear dropAnim; set settledKey = key.

#### renderCell

- **Contract**: Renders a slot without double-drawing the disc mid-fall.
- **Signature**: renderCell(row: Number, col: Number): visual
- **Flow**:
  1. IF dropAnim matches this col AND this row is the landing row: show empty slot under the falling overlay (static disc hidden until settle).
  2. ELSE show `state.cells[row][col]` as usual.
  3. Winning-line highlight applies only when dropAnim is null (or this move’s settle already recorded).

#### resetVisuals

- **Contract**: Clears animation bookkeeping when the match is reset or remounted with a fresh board.
- **Signature**: resetVisuals(): void
- **Trigger**: `state` becomes a fresh empty board (e.g. after reset) or `lastMove` becomes null after having been set.
- **Flow**: clear dropAnim; clear settledKey.

### 🚨 Constraints

- MUST NOT mutate GameState.
- MUST NOT call GameService.
- MUST only offer columns present in `legalColumns` when status is in_progress and dropAnim is null.
- MUST NOT invent a landing row: fall target MUST be `state.lastMove.row` / `state.lastMove.col`.
- MUST keep game logic and turn state owned by the parent; animation is presentation-only over already-applied cells.
- MUST ignore further column clicks while dropAnim is active.
- Animation MUST complete to the exact landing slot (no overshoot past `lastMove.row`).
- On reset / cleared `lastMove`, animation MUST cancel immediately (no orphan falling disc).

### ✅ Acceptance Criteria

- [ ] Click legal column (idle) calls onPlayColumn.
- [ ] Click illegal column does nothing.
- [ ] After a successful play, the disc falls down the played column and stops in `lastMove`’s cell.
- [ ] During the fall, further column clicks do not call onPlayColumn.
- [ ] After the fall ends, the resting disc matches `state.cells` and winning line (if any) can show.
- [ ] Reset clears any in-flight fall and shows an empty board.
- [ ] Winning line slots highlighted when provided and drop has settled.

### 🧪 Test Scenarios

1. **Legal click**:
   - Input: legalColumns [0,1], dropAnim null, click 1
   - Expected: onPlayColumn(1)

2. **Disabled**:
   - Input: disabled true
   - Expected: no onPlayColumn

3. **Drop fall to bottom**:
   - Input: empty board play; lastMove { col: 3, row: 5 }; cells[5][3] red
   - Expected: dropAnim starts for col 3; disc animates to row 5; then dropAnim null; static red disc visible at (5,3)

4. **Drop fall onto stack**:
   - Input: column 0 already has discs in rows 5 and 4; new lastMove { col: 0, row: 3 }
   - Expected: disc falls and stops at row 3 only (not lower)

5. **Clicks blocked mid-fall**:
   - Input: dropAnim non-null; click a legal column
   - Expected: onPlayColumn not called

6. **Reset mid-fall**:
   - Input: dropAnim active; then state resets (empty board, lastMove null)
   - Expected: dropAnim cleared; no falling disc; empty slots
