# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-furniture

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @MapCellFurniture, @MapCell in `./domain-map.isl.md`

## Component: useDungeonFurniture

hooks for manage visibility for furniture

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession (Current session state containing the map definition).
- `boardVisibilityMap`: @VisibilityMap (The calculated visibility map with fog status).

### ⚡ Capabilities

#### visibleFurniture

- **Contract**: Returns a list of furniture items (@MapCellFurniture) that are currently visible to the player.
- **Signature**: () -> List<{x: Integer, y: Integer, img: String}>
- **Trigger**: When `gameSession.currentMap` or `boardVisibilityMap` changes.
- **Flow**:
  - IF `gameSession.currentMap` OR `boardVisibilityMap` is missing RETURN empty list.
  - Initialize `visibleFurniture` as an empty list.
  - Iterate through each `mapCell` in `gameSession.currentMap.grid`:
    - Find the corresponding cell in `boardVisibilityMap` (matching x, y).
    - IF the visibility cell exists AND `fog` is false:
      - IF `mapCell.arnt.antroc` is true AND `mapCell.arnt.inv` is false:
        - Add `{ x: mapCell.x, y: mapCell.y, img: "../cell/pietra.png" }` to `visibleFurniture`.
      - ELSE IF `mapCell.mobili.num` is NOT null:
        - Add `{ x: mapCell.x, y: mapCell.y, img: mapCell.mobili.img }` to `visibleFurniture`.
- **Return**: List of objects `{ x, y, img }`.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities visibleFurniture MUST avoid undefined side effects outside declared flow and side effects.

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
