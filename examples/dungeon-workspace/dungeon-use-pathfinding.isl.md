# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-pathfinding

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @useDungeonMapQuery in `./dungeon-map-query.isl.md`
> **Reference**: @useDungeonMovementRules in `./dungeon-movement-rules.isl.md`

## Component: usePathfinding

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession (Current session state).
- `visibilityMap`: @VisibilityMap (The static board configuration loaded from JSON).
- `foundPassages`: List of {x: Integer, y: Integer} (Discovered secret passages from useSecretPassages).

### ⚡ Capabilities

#### internal State

- **Contract**: Specifies internal State semantics and invariants for this unit.
- hooksDungeonMapQuery: @useDungeonMapQuery passing `gameSession` and `visibilityMap`.
- hooksDungeonMovementRules: @useDungeonMovementRules passing `mapQuery` and `foundPassages`.

#### calculatePath

- **Contract**: Calculates the shortest path between two points on the grid using BFS, considering obstacles.
- **Signature**: `(startX: Integer, startY: Integer, targetX: Integer, targetY: Integer, maxDepth: Integer, excludeEntityId: Integer) -> List<{x, y}>`
- **Flow**:
  - Initialize `mapQuery` using `hooksDungeonMapQuery`.
  - Initialize `movementRules` using `hooksDungeonMovementRules` providing `mapQuery` and `foundPassages`.
  - **Pre-check**: IF `movementRules.isValidDestination(targetX, targetY, excludeEntityId)` is FALSE, Return empty path.
  - **BFS Algorithm**:
    - Initialize `queue` with start node `{x: startX, y: startY, path: []}`.
    - Initialize `visited` set with start coordinates.
    - WHILE `queue` is not empty:
      - Dequeue `current` node.
      - IF `current` is target, Return `current.path`.
      - IF `current.path.length` >= `maxDepth`, Continue.
      - FOR EACH neighbor (Up, Down, Left, Right):
        - IF neighbor not visited AND `movementRules.isWalkable(current.x, current.y, neighbor.x, neighbor.y, excludeEntityId, foundPassages)`:
          - Mark neighbor as visited.
          - Enqueue neighbor with updated path.
  - Return empty path if no path found.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities internal State, calculatePath MUST avoid undefined side effects outside declared flow and side effects.

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
