# Project: Connect Four Workspace

Business Logic hook: bind GameService + optional AI to UI with mode, legal columns, and stable mutators.

**Version**: 1.1.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./use-game

---

> **Reference**: @GameState, @PlayerId, @MoveError, @GameMode in `./domain-game.isl.md`.
> **Reference**: GameService in `./game-service.isl.md`.
> **Reference**: aiOpponent in `./ai-opponent.isl.md`.

## Component: useGame

### Role: Business Logic

**Signature**: useGame({ gameService: GameService, aiOpponent: aiOpponent })

### 🗂 Internal State

- `state`: @GameState — **internal**
- `mode`: @GameMode — **internal** (Default: `"two_player"`)
- `legalColumns`: Number[] — **calculated**
- `lastError`: @MoveError | null — **internal**
- `aiPending`: Boolean — **internal** (true while waiting to apply / applying computer move)
- `humanSeat`: @PlayerId — **constant** `"red"` (single-player human)

### ⚡ Capabilities

#### boot

- **Contract**: Loads state from service.
- **Signature**: boot(): void
- **Flow**: set state from getState(); mode stays default or prior; refresh legalColumns; clear lastError; clear aiPending.

#### setMode

- **Contract**: Selects two-player or single and starts a fresh match.
- **Signature**: setMode(next: @GameMode): void
- **Flow**:
  1. Cancel any scheduled AI turn; clear aiPending.
  2. Set mode = next.
  3. state = gameService.reset(); clear lastError; refresh legalColumns.

#### playColumn

- **Contract**: Attempts a human-controlled drop in `col`.
- **Signature**: playColumn(col: Number): void
- **Flow**:
  1. IF aiPending: ignore.
  2. IF mode `"single"` AND state.currentPlayer ≠ humanSeat: ignore.
  3. result = gameService.play({ col, actor: state.currentPlayer }).
  4. IF error: set lastError; keep state; RETURN.
  5. set state; clear lastError; refresh legalColumns.
  6. IF mode `"single"` AND state.status `"in_progress"` AND state.currentPlayer `"yellow"`: schedule `runAiTurn` after a short delay (SHOULD ~450–600ms so BoardView drop can settle).

#### runAiTurn

- **Contract**: Applies one computer drop for yellow in single mode.
- **Signature**: runAiTurn(): void
- **Trigger**: Scheduled after a successful human play leaves yellow to move; MUST NOT run in two_player.
- **Flow**:
  1. IF mode ≠ `"single"` OR state.status ≠ `"in_progress"` OR state.currentPlayer ≠ `"yellow"`: clear aiPending; RETURN.
  2. Set aiPending true.
  3. col = aiOpponent.pickColumn(state).
  4. result = gameService.play({ col, actor: `"yellow"` }).
  5. IF error: set lastError; clear aiPending; keep state; RETURN.
  6. set state; clear lastError; refresh legalColumns; clear aiPending.
  7. MUST NOT chain another AI turn (human is next, or game over).

#### resetGame

- **Contract**: Resets match; keeps current mode.
- **Signature**: resetGame(): void
- **Flow**: cancel scheduled AI; clear aiPending; state = gameService.reset(); clear lastError; refresh legalColumns.

#### getSnapshot

- **Contract**: UI snapshot.
- **Signature**: getSnapshot(): { state: @GameState, mode: @GameMode, legalColumns: Number[], lastError: @MoveError | null, aiPending: Boolean, boardInputEnabled: Boolean }
- **Flow**:
  1. boardInputEnabled = status in_progress AND NOT aiPending AND (mode `"two_player"` OR currentPlayer `"red"`).

### 🚨 Constraints

- Hook MUST use a single config object; top-level React hooks only.
- Hook MUST NOT call boardRules directly (service / aiOpponent boundary).
- In `"two_player"`, human plays alternate seats via currentPlayer (hot-seat).
- In `"single"`, only `"red"` MAY be played via playColumn; `"yellow"` MUST come from runAiTurn.
- Changing mode MUST reset the board.
- Exposed mutators MUST be referentially stable.
- Hook MUST cancel pending AI work on setMode, resetGame, and unmount.

### ✅ Acceptance Criteria

- [ ] boot yields in_progress empty board; default mode two_player.
- [ ] setMode(`"single"`) resets board and enables AI after red moves.
- [ ] In single, after red plays, yellow is played by AI without a second human click.
- [ ] In two_player, both seats are human; AI never plays.
- [ ] playColumn illegal sets lastError.
- [ ] resetGame clears board and error; keeps mode.
- [ ] boardInputEnabled false while aiPending or yellow turn in single.

### 🧪 Test Scenarios

1. **Boot**:
   - Expected: status in_progress; mode two_player; 7 legal columns

2. **Hot-seat flip**:
   - Input: mode two_player; two successful playColumn calls
   - Expected: currentPlayer returns to red after yellow; aiPending never true

3. **Single AI reply**:
   - Input: mode single; playColumn legal as red
   - Expected: after delay, yellow disc placed; currentPlayer red (or game over)

4. **Single ignores yellow click**:
   - Input: mode single; force currentPlayer yellow without aiPending clear
   - Expected: playColumn ignored

5. **Mode switch resets**:
   - Input: mid-game setMode to the other mode
   - Expected: empty board; red to move; no pending AI
