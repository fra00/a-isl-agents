# Project: Connect Four Workspace

Shared Connect Four domain: players, board cells, game status, modes, and move errors.

**Version**: 1.1.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./domain-game

---

## Domain Concepts

### PlayerId

Closed set of seats.

- **Identity**: Enumerated player id.
- **Properties**:
  - Values: `"red"` | `"yellow"`

### CellState

Closed occupier of a slot.

- **Identity**: Enumerated cell state.
- **Properties**:
  - Values: `"empty"` | `"red"` | `"yellow"`

### GameStatus

Closed match lifecycle.

- **Identity**: Enumerated status.
- **Properties**:
  - Values: `"in_progress"` | `"won"` | `"draw"`

### GameMode

How seats are controlled for a match session.

- **Identity**: Enumerated play mode.
- **Properties**:
  - Values: `"two_player"` | `"single"`
  - `"two_player"`: hot-seat; both seats controlled by humans alternating on the same device
  - `"single"`: human controls `"red"`; computer controls `"yellow"`

### BoardSize

Fixed Connect Four geometry for this workspace.

- **Identity**: Constant geometry.
- **Properties**:
  - `rows`: Number (MUST be 6)
  - `cols`: Number (MUST be 7)

### MoveErrorCode

Machine-readable illegal move reasons.

- **Identity**: Enumerated code.
- **Properties**:
  - Values: `"out_of_bounds"` | `"column_full"` | `"game_over"` | `"wrong_turn"` | `"unknown"`

### MoveError

Structured refusal for HUD.

- **Identity**: code + message.
- **Properties**:
  - `code`: @MoveErrorCode
  - `message`: String

### GameState

Full match snapshot.

- **Identity**: Board + turn + status.
- **Properties**:
  - `cells`: @CellState[][] (rows×cols; row 0 is top)
  - `currentPlayer`: @PlayerId
  - `status`: @GameStatus
  - `winner`: @PlayerId | null
  - `lastMove`: { col: Number, row: Number } | null
  - `winningLine`: { row: Number, col: Number }[] | null

## Component: GameDomain

### Role: Domain

### ⚡ Capabilities

#### emptyBoard

- **Contract**: Creates a 6×7 board of `"empty"`.
- **Signature**: emptyBoard(): @CellState[][]

#### MoveError

- **Contract**: Factory for @MoveError.
- **Signature**: MoveError(data: { code: @MoveErrorCode, message: String }): @MoveError

#### GameState

- **Contract**: Factory for initial @GameState.
- **Signature**: GameState(data?: Partial): @GameState
- **Flow**:
  1. Default board emptyBoard; currentPlayer `"red"`; status `"in_progress"`; winner null; lastMove null; winningLine null.

### 🚨 Constraints

- Geometry MUST be 6 rows × 7 columns.
- Domain MUST NOT apply moves or detect wins (board-rules owns that).
- Domain MUST NOT choose AI columns (ai-opponent owns that).
- Enumerations MUST stay closed for this workspace.
- @GameMode MUST NOT live inside @GameState (session config owned by useGame / HUD).

### ✅ Acceptance Criteria

- [ ] emptyBoard is 6×7 all empty.
- [ ] GameState() starts with red to move, in_progress.
- [ ] GameMode exposes only two_player and single.

### 🧪 Test Scenarios

1. **Fresh state**:
   - Input: GameState()
   - Expected: currentPlayer red; status in_progress
