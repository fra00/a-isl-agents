# Project: Connect Four Workspace

Backend boundary: holds authoritative @GameState; applies only validated moves.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./game-service

---

> **Reference**: @GameState, @PlayerId, @MoveError in `./domain-game.isl.md`.
> **Reference**: boardRules in `./board-rules.isl.md`.

## Component: GameService

### Role: Backend

**Signature**:

- `boardRules`: boardRules module API

### ⚡ Capabilities

#### getState

- **Contract**: Returns current @GameState snapshot.
- **Signature**: getState(): @GameState

#### reset

- **Contract**: Starts a fresh game (red to move).
- **Signature**: reset(): @GameState

#### play

- **Contract**: Attempts a drop for `actor` in `col`.
- **Signature**: play(input: { col: Number, actor: @PlayerId }): { state: @GameState, error: @MoveError | null }
- **Flow**:
  1. err = boardRules.assertMove({ state, col, actor }).
  2. IF err: RETURN `{ state: current, error: err }` (no mutation).
  3. next = boardRules.applyMove({ state, col }); persist; RETURN `{ state: next, error: null }`.

#### listLegalColumns

- **Contract**: Exposes legalColumns for UI hints.
- **Signature**: listLegalColumns(): Number[]

### 🚨 Constraints

- Service MUST fail closed on assertMove errors (no partial writes).
- Service MUST NOT implement win logic itself (delegates to boardRules).
- Presentation MUST NOT mutate state without play/reset.

### ✅ Acceptance Criteria

- [ ] play on full column returns column_full and unchanged board.
- [ ] Alternating successful plays flip currentPlayer.
- [ ] reset restores empty in_progress board.

### 🧪 Test Scenarios

1. **Happy drop**:
   - Input: red plays col 0
   - Expected: cell at bottom red; currentPlayer yellow

2. **Illegal full**:
   - Input: play on full col
   - Expected: error column_full
