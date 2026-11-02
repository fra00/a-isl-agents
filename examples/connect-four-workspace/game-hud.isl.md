# Project: Connect Four Workspace

HUD: mode selector, turn indicator, status (won/draw), last error, reset control.

**Version**: 1.1.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./game-hud

---

> **Reference**: @GameState, @MoveError, @GameMode in `./domain-game.isl.md`.

## Component: GameHud

### Role: Presentation

**Signature**:

- `state`: @GameState
- `mode`: @GameMode
- `lastError`: @MoveError | null
- `aiPending`: Boolean (Default: false)
- `onReset`: () => void
- `onSetMode`: (mode: @GameMode) => void

### 🔍 Appearance

- Compact header strip above the board.
- Mode control: two options — “Two players” / “Single (vs PC)”.
- Clear turn / winner / draw copy; in single, yellow turn MAY show “Computer thinking…” when aiPending.
- Error live region when lastError set.
- Reset button always available.

### 📦 Content

- Mode selector bound to `mode`
- IF status `in_progress` AND mode `two_player`: “Turn: {currentPlayer}”
- IF status `in_progress` AND mode `single` AND currentPlayer `red`: “Your turn (red)”
- IF status `in_progress` AND mode `single` AND currentPlayer `yellow`: “Computer (yellow)…”
- IF status `won`: “Winner: {winner}” (in single, MAY clarify You/Computer)
- IF status `draw`: “Draw”
- Error message if any
- Reset control

### ⚡ Capabilities

#### clickReset

- **Contract**: Requests new game (same mode).
- **Flow**: onReset()

#### selectMode

- **Contract**: Requests mode change (parent resets match).
- **Signature**: selectMode(next: @GameMode): void
- **Flow**:
  1. IF next equals mode: ignore.
  2. onSetMode(next).

### 🚨 Constraints

- MUST NOT compute win itself (displays state only).
- Error copy MUST use lastError.message only.
- MUST NOT call GameService or aiOpponent.
- Mode selector MUST remain usable mid-game (changing mode resets via parent).

### ✅ Acceptance Criteria

- [ ] in_progress shows currentPlayer / human-or-computer copy per mode.
- [ ] Selecting the other mode calls onSetMode once.
- [ ] Selecting current mode does nothing.
- [ ] won shows winner.
- [ ] Reset calls onReset.

### 🧪 Test Scenarios

1. **Turn display two-player**:
   - Input: mode two_player; currentPlayer yellow
   - Expected: HUD indicates yellow turn

2. **Select single**:
   - Input: mode two_player; select Single
   - Expected: onSetMode("single")

3. **Reset**:
   - Input: click Reset
   - Expected: onReset once
