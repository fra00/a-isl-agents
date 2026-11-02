# Project: Connect Four Workspace

Pure rules engine: legal columns, apply drop, win/draw detection.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./board-rules

---

> **Reference**: @GameState, @PlayerId, @CellState, @GameStatus, @MoveError, @MoveErrorCode in `./domain-game.isl.md`.

## Component: boardRules

### Role: Business Logic

**Signature**: boardRules()

### ⚡ Capabilities

#### legalColumns

- **Contract**: Lists column indexes (0–6) where a disc may be dropped for the current in-progress state.
- **Signature**: legalColumns(state: @GameState): Number[]
- **Flow**:
  1. IF status ≠ `"in_progress"`: RETURN [].
  2. For each col 0..6: IF top cell (row 0) is empty OR any empty slot exists in column → include col when the column has at least one empty cell (standard: drop into lowest empty row).
  3. RETURN those columns.

#### dropRow

- **Contract**: Returns the landing row for a disc in `col`, or null if column full / invalid.
- **Signature**: dropRow(input: { cells: @CellState[][], col: Number }): Number | null
- **Flow**:
  1. IF col out of 0..6: RETURN null.
  2. Scan from bottom row (5) upward; RETURN first empty row index; IF none null.

#### assertMove

- **Contract**: Validates a column drop for `actor` matching currentPlayer.
- **Signature**: assertMove(input: { state: @GameState, col: Number, actor: @PlayerId }): @MoveError | null
- **Flow**:
  1. IF status ≠ in_progress → `game_over`.
  2. IF actor ≠ currentPlayer → `wrong_turn`.
  3. IF col ∉ 0..6 → `out_of_bounds`.
  4. IF dropRow null → `column_full`.
  5. ELSE null.

#### applyMove

- **Contract**: Returns next @GameState after a legal drop (caller MUST assertMove first).
- **Signature**: applyMove(input: { state: @GameState, col: Number }): @GameState
- **Flow**:
  1. Place currentPlayer disc at dropRow.
  2. Set lastMove { col, row }.
  3. IF checkWin → status won, winner currentPlayer, winningLine set.
  4. ELSE IF board full → draw.
  5. ELSE flip currentPlayer; keep in_progress.

#### checkWin

- **Contract**: Detects four-in-a-row for a player after a move.
- **Signature**: checkWin(input: { cells: @CellState[][], player: @PlayerId }): { won: Boolean, line: { row: Number, col: Number }[] | null }
- **Flow**:
  1. Scan horizontal, vertical, both diagonals for 4 consecutive `player` cells.
  2. RETURN first winning line found or won false.

### ⚙ Logic & Execution Rules

- All capabilities MUST be pure (no I/O).
- Gravity: discs occupy the lowest empty row in the column.
- Win length MUST be exactly 4.

### 🚨 Constraints

- Module MUST NOT mutate the input state in place (return new cells/state).
- Module MUST NOT own turn UI or timers.

### ✅ Acceptance Criteria

- [ ] Full column is not in legalColumns.
- [ ] Four horizontal red → won red with line length 4.
- [ ] Full board without four → draw after applyMove path.

### 🧪 Test Scenarios

1. **Legal empty column**:
   - Input: fresh board, col 3
   - Expected: assertMove null; dropRow 5

2. **Column full**:
   - Input: column filled
   - Expected: assertMove column_full

3. **Vertical win**:
   - Input: four yellow in one column
   - Expected: checkWin won true
