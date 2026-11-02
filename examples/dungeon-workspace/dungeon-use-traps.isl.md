# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-traps

---

> **Reference**: @MapCellTrap in `./domain-map.isl.md`
> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @useVisibilityCalc in `./dungeon-use-visibility-calc.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

- `triggeredTraps`: Runtime collection of trap markers currently known to the player, each with coordinates, trap type, and status.
- `trap status`: One of `DETECTED`, `TRIGGERED`, or `DISARMED`.
  - `DETECTED`: revealed and active, but not yet sprung.
  - `TRIGGERED`: revealed, already sprung at least once, but still active until disarmed.
  - `DISARMED`: safe and no longer active.

## Component: useTraps

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession
- `visibilityMap`: @VisibilityMap
- `areMonstersVisible`: Boolean
- `onNotify`: (message: String) -> void
- `onActionDone`: () -> void
- `onForceTurnEnd`: () -> void
- `sessionManager`: @useDungeonSessionManager

### ⚡ Capabilities

#### internalState

- **Contract**: Maintains the local trap-reveal and disarm state for the current dungeon session.

- `triggeredTraps`: List of {x: Integer, y: Integer, tipo: Integer, status: String} (Stores traps. Status: 'DETECTED', 'TRIGGERED', 'DISARMED').
- `visibilityCalc`: @useVisibilityCalc (Hook instance for visibility calculations).

#### checkTrapActivation

- **Contract**: Determines if a trap at given coordinates should trigger.
- **Signature**: `(trap: @MapCellTrap, x: Integer, y: Integer) -> Boolean`
- **Flow**:
  - Check if `{x, y}` is already in `triggeredTraps`.
  - IF found:
    - IF `found.status` == 'DISARMED': RETURN false (Trap neutralized).
    - IF `found.status` == 'DETECTED' OR `found.status` == 'TRIGGERED': RETURN true (Trap revealed and still active until disarmed).
  - IF `trap.tipo` IN [1, 2, 3]:
    - RETURN true (Trap is active).
  - RETURN false.

#### isTrapVisible

- **Contract**: Checks if a trap at specific coordinates is already revealed/triggered .
- **Signature**: `(x: Integer, y: Integer) -> Boolean`
- **Flow**:
  - Check if `{x, y}` is already in `triggeredTraps`.
  - Return true only when found and `status` is NOT `DISARMED`.

#### registerTriggeredTrap

- **Contract**: Adds a trap to the triggered list.
- **Signature**: `(x: Integer, y: Integer, tipo: Integer)`
- **Flow**:
  - Check if `{x, y}` is in `triggeredTraps`.
  - IF found:
    - Set `found.status` to 'TRIGGERED'.
  - ELSE:
    - Add `{x, y, tipo, status: 'TRIGGERED'}` to `triggeredTraps`.

#### attemptDisarmTrap

- **Contract**: Attempts to disarm a known active trap.
- **Signature**: `(x: Integer, y: Integer, canDisarm: Boolean, onFail: () -> void)`
- **Flow**:
  - Find trap at `{x, y}` in `triggeredTraps`.
  - IF NOT found OR `trap.status` == 'DISARMED':
    - Trigger `onNotify("Non c'è una trappola disarmabile qui.")`.
    - Trigger `onActionDone()`.
    - RETURN.
  - IF `canDisarm` is false:
    - Trigger `onNotify("Non hai gli strumenti per disarmare questa trappola.")`.
    - Trigger `onActionDone()`.
    - RETURN.
  - Generate random number `roll` between 1 and 6 to approximate the Dungeon combat-die disarm check (only the worst result fails).
  - IF `roll` < 6:
    - Set `trap.status` to 'DISARMED'.
    - Trigger `onNotify("Trappola disarmata con successo!")`.
  - ELSE:
    - Set `trap.status` to 'TRIGGERED'.
    - Trigger `onNotify("Hai fatto scattare la trappola!")`.
    - Trigger `onFail()`.
    - Keep the trap visible and active so the hero may attempt to disarm it again on a later turn.
  - Trigger `onActionDone()`.

#### getAdjacentDisarmableTrap

- **Contract**: Finds the first revealed active trap that the active hero can attempt to disarm from an orthogonally adjacent square that is **not separated by a wall**.
- **Signature**: `(heroX: Integer, heroY: Integer) -> {x: Integer, y: Integer, tipo: Integer, status: String} | null`
- **Flow**:
  - Check the four adjacent squares in order Up, Down, Left, Right.
  - A candidate cell is reachable for disarm only when:
    - it shares the same visibility area (`valo`) as the hero cell, OR
    - an opened door occupies the hero cell or the trap cell (same topological rule as melee adjacency).
  - Skip candidates blocked by walls (different `valo` without an opened door on either cell).
  - Return the first trap in `triggeredTraps` with matching coordinates and `status != 'DISARMED'`.
  - If none exists, return `null`.

#### disarmAdjacentTrap

- **Contract**: Performs the disarm-trap action from the hero's current square, requiring a revealed adjacent trap and disarm capability.
- **Signature**: `(heroX: Integer, heroY: Integer, canDisarm: Boolean, onFail: (trap) -> void)`
- **Flow**:
  - Resolve `adjacentTrap` using `getAdjacentDisarmableTrap(heroX, heroY)`.
  - IF `adjacentTrap` is null:
    - Trigger `onNotify("Non c'è una trappola adiacente da disinnescare.")`.
    - Trigger `onActionDone()`.
    - RETURN.
  - Call `attemptDisarmTrap(adjacentTrap.x, adjacentTrap.y, canDisarm, onFail)`.

#### getTriggeredTraps

- **Contract**: Returns the list of triggered traps for rendering.
- **Return**: `triggeredTraps`.

#### searchTraps

- **Contract**: Scans the visible area for hidden traps.
- **Trigger**: User clicks "Search Traps".
- **Flow**:
  - IF `areMonstersVisible` is true:
    - Trigger `onNotify("Non puoi cercare trappole con mostri vicini!")`.
    - RETURN.
  - Find current hero in `gameSession.heroes` (turnOrder == currentTurn).
  - Call `sessionManager.executeMissionScripts({ baseSession: gameSession, eventType: 4, visibilityMap })` before normal trap discovery.
  - IF the mission script result is `handled` true:
    - IF the runtime requests `forceFinishTurn`, trigger `onForceTurnEnd()`.
    - ELSE trigger `onActionDone()`.
    - RETURN.
  - Call `visibilityCalc.calculateVisibleCells(hero.x, hero.y)` to get `visibleCells`.
  - Initialize `trapsFound` as false.
  - FOR each `cell` in `visibleCells`:
    - Find corresponding `mapCell` in `gameSession.currentMap.grid` at `cell.x`, `cell.y`.
    - IF `mapCell` exists AND `mapCell.trpl` exists and `map.Cell.trpl.tipo` > 0:
      - Check if `{cell.x, cell.y}` is NOT in `triggeredTraps`:
        - Add `{x: cell.x, y: cell.y, tipo: mapCell.trpl.tipo, status: 'DETECTED'}` to `triggeredTraps`.
        - Set `trapsFound` to true.
  - IF `trapsFound` is true:
    - Trigger `onNotify("Attenzione! Hai individuato delle trappole!")`.
  - ELSE:
    - Trigger `onNotify("Nessuna trappola trovata.")`.
  - Trigger `onActionDone()`.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities internalState, checkTrapActivation, isTrapVisible, registerTriggeredTrap, attemptDisarmTrap MUST avoid undefined side effects outside declared flow and side effects.

### 🚨 Global Constraints

- Component MUST keep orchestration semantics coherent across all capabilities and shared state references.
- Cross-capability execution MUST preserve declared domain invariants and mutation boundaries.
- Component MUST expose deterministic behavior at the system boundary for equivalent scenarios.

### ✅ Acceptance Criteria

- [ ] Capability-level constraints are satisfied for declared orchestration methods.
- [ ] Component-level global constraints hold across multi-capability execution paths.
- [ ] State boundary and domain reference consistency are preserved end-to-end.

### 🧪 Test Scenarios

1. **Capability Constraint - Deterministic Method Behavior**:
   - Target: first declared capability
   - Input: equivalent inputs/state across repeated runs
   - Expected: same transition/output and bounded side effects

2. **Capability Constraint - Boundary Handling**:
   - Target: capability-level constraints
   - Input: invalid or boundary conditions
   - Expected: explicit handling without undefined mutations

3. **Global Constraint - Cross-Capability Orchestration**:
   - Target: component capability sequence
   - Input: realistic multi-step flow
   - Expected: coherent state progression respecting global boundaries
