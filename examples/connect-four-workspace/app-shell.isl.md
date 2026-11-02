# Project: Connect Four Workspace

App shell wires GameService, aiOpponent, useGame, HUD, and board (hot-seat or vs PC).

**Version**: 1.2.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./app-shell

---

> **Reference**: GameService in `./game-service.isl.md`.
> **Reference**: aiOpponent in `./ai-opponent.isl.md`.
> **Reference**: useGame in `./use-game.isl.md`.
> **Reference**: BoardView in `./board-view.isl.md`.
> **Reference**: GameHud in `./game-hud.isl.md`.

## Component: AppShell

### Role: Presentation

**Signature**:

- `gameService`: GameService
- `aiOpponent`: aiOpponent

### 🗂 Internal State

- Snapshot from `useGame({ gameService, aiOpponent })` — **external** via hook

### 🔍 Appearance

- Centered playfield: title, GameHud (with mode), BoardView.
- Board `disabled` when NOT `boardInputEnabled` (game over, AI turn / aiPending, or BoardView mid-fall gating).
- Drop fall animation is owned by BoardView over `state.lastMove` (shell does not animate).

### 📦 Content

- Title “Connect Four”
- GameHud
- BoardView

### ⚡ Capabilities

#### bootShell

- **Contract**: Boots the game hook on mount.
- **Signature**: bootShell(): void
- **Trigger**: Mount.
- **Flow**:
  1. useGame.boot().

#### onPlayColumn

- **Contract**: Forwards a column drop to the hook immediately (state updates before/while BoardView animates).
- **Signature**: onPlayColumn(col: Number): void
- **Flow**:
  1. IF NOT boardInputEnabled: ignore.
  2. useGame.playColumn(col).

#### onReset

- **Contract**: Forwards reset to the hook.
- **Signature**: onReset(): void
- **Flow**:
  1. useGame.resetGame().

#### onSetMode

- **Contract**: Forwards mode selection to the hook (resets match).
- **Signature**: onSetMode(mode: @GameMode): void
- **Flow**:
  1. useGame.setMode(mode).

### 🚨 Constraints

- Shell MUST NOT implement boardRules, win detection, or AI heuristics.
- Demo MAY inject in-memory GameService and aiOpponent({ boardRules }).
- Shell MUST pass mode, aiPending, onSetMode into GameHud.
- Shell MUST disable BoardView when `boardInputEnabled` is false.
- Shell MUST NOT duplicate drop animation; BoardView owns fall visuals and mid-fall click gating.

### ✅ Acceptance Criteria

- [ ] Two-player: humans alternate drops until win or draw.
- [ ] Single: human (red) plays; computer (yellow) replies automatically.
- [ ] Mode control switches between two_player and single and resets the board.
- [ ] Each successful play shows a falling disc on BoardView that lands on `lastMove`.
- [ ] Winning line is visible on BoardView when present (after drop settles).
- [ ] Reset starts a new in_progress game in the current mode and clears any fall visual.

### 🧪 Test Scenarios

1. **Play path two-player**:
   - Input: mode two_player; several legal clicks
   - Expected: discs fall then stack; turn flips after each applied play; no AI moves

2. **Play path single**:
   - Input: mode single; one legal human click
   - Expected: red disc falls; then yellow AI disc falls; input disabled during AI

3. **Reset**:
   - Input: mid-game Reset
   - Expected: empty board; red to move; mode unchanged; no leftover falling disc

4. **Switch mode**:
   - Input: mid-game select the other mode
   - Expected: empty board; red to move; mode updated
