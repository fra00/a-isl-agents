# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-visibility-calc

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`

## Component: useVisibilityCalc

### Role: Business Logic

**Signature**: `useVisibilityCalc({ gameSession: GameSession, visibilityMap: VisibilityMap })`

### ⚡ Capabilities

#### calculateVisibleCells

- **Contract**: Calculates visible cells from a specific position using Room/Corridor logic.
- **Signature**: `(startX: Integer, startY: Integer) -> List<{x: Integer, y: Integer}>`
- **Flow**:
  - Initialize `visibleCells` list.
  - Find `startVisCell` in `visibilityMap` at `startX`, `startY`.
  - IF `startVisCell` is null, Return empty list.
  - Add `{x: startX, y: startY}` to `visibleCells`.
  - **Phase 1: Room Visibility**
    - IF `startVisCell.valo` is NOT "1" (Not a corridor):
      - Iterate through all cells in `visibilityMap.data`.
      - IF `cell.valo` == `startVisCell.vis1` OR `cell.valo` == `startVisCell.vis2` OR `cell.valo` == `startVisCell.valo`:
        - Add `{x: cell.x, y: cell.y}` to `visibleCells`.
      - Return `visibleCells`.
  - **Phase 2: Corridor Visibility (Ray Casting)**
    - Define `directions` as Up (0,-1), Down (0,1), Left (-1,0), Right (1,0).
    - FOR EACH `dir` in `directions`:
      - Set `currentX` = `startX`, `currentY` = `startY`.
      - WHILE true:
        - Increment `currentX` by `dir.x`, `currentY` by `dir.y`.
        - Find `visCell` in `visibilityMap` at `currentX`, `currentY`.
        - IF `visCell` is null: BREAK Loop.
        - **Rule 1: Room Boundary (Stop)**:
          - IF `visCell.valo` is NOT "1":
            - BREAK Loop.
        - **Rule 2: Obstacle (Stop)**:
          - Find `mapCell` in `gameSession.currentMap.grid` at `currentX`, `currentY`.
          - IF `mapCell` exists AND `mapCell.arnt.antroc` is true (Rock):
            - Add `{x: currentX, y: currentY}` to `visibleCells` (See the rock).
            - BREAK Loop.
        - **Rule 3: Corridor (Propagate)**:
          - Add `{x: currentX, y: currentY}` to `visibleCells`.
          - CONTINUE Loop.
  - Return `visibleCells`.

#### hasLineOfSight

- **Contract**: Determines if there is an unobstructed straight line between two grid positions.
- **Signature**: `(startX: Integer, startY: Integer, targetX: Integer, targetY: Integer) -> Boolean`
- **Flow**:
  - Trace a direct logical line between the start and target coordinates.
  - For each cell intersected by this line:
    - Check if the cell blocks Line of Sight:
      - IF transition between cells crosses a wall (Area ID `valo` changes without an open door).
      - IF cell contains Furniture.
      - IF cell contains a Rock block (`antroc`).
    - IF any obstruction is found, RETURN false.
  - RETURN true.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities calculateVisibleCells, hasLineOfSight MUST avoid undefined side effects outside declared flow and side effects.

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
