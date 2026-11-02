# Project: Connect Four Workspace

Pure AI column picker for single-player yellow seat (heuristic, no search tree required).

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-11-01
**Implementation**: ./ai-opponent

---

> **Reference**: @GameState, @PlayerId, @CellState in `./domain-game.isl.md`.
> **Reference**: boardRules in `./board-rules.isl.md`.

## Component: aiOpponent

### Role: Business Logic

**Signature**: aiOpponent({ boardRules })

### ⚡ Capabilities

#### pickColumn

- **Contract**: Chooses a legal column for the computer seat `"yellow"` given an in-progress state whose `currentPlayer` is `"yellow"`.
- **Signature**: pickColumn(state: @GameState): Number
- **Flow**:
  1. legal = boardRules.legalColumns(state).
  2. IF legal empty: MUST NOT be called (caller guards); if reached, yield column `0` as unreachable fallback.
  3. IF any col in legal where applying yellow wins immediately: yield that col (first such).
  4. IF any col in legal where applying red would win next: yield a blocking col (first such).
  5. Prefer cols nearer the center (order preference: 3, 2, 4, 1, 5, 0, 6) among remaining legal.
  6. Yield the first preferred legal column.

### ⚙ Logic & Execution Rules

- Win/block checks MUST use boardRules.applyMove / checkWin on copies (pure; no service I/O).
- Picker MUST only return a member of legalColumns.
- Strength is intentionally shallow (one-ply win/block + center bias); no difficulty enum in this workspace.

### 🚨 Constraints

- Module MUST be pure (no timers, no React, no GameService).
- Module MUST NOT mutate input state.
- Module MUST assume actor color `"yellow"` for the computer.
- Module MUST NOT be used when mode is `"two_player"`.

### ✅ Acceptance Criteria

- [ ] pickColumn returns only legal columns.
- [ ] Immediate yellow win is preferred over other heuristics.
- [ ] Immediate red threat is blocked when no yellow win exists.
- [ ] Otherwise a center-biased legal column is chosen.

### 🧪 Test Scenarios

1. **Take win**:
   - Input: yellow can complete four in one legal col
   - Expected: that col

2. **Block red**:
   - Input: no yellow win; red would win next in col 2 if ignored
   - Expected: col 2

3. **Center bias**:
   - Input: empty board, yellow to move, all cols legal
   - Expected: col 3
