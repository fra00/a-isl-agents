# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-movement-rules

---

> **Reference**: @useDungeonMapQuery in `./dungeon-map-query.isl.md`
> **Reference**: @MapCell, @VisibilityCell in `./domain-map.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component is the canonical shared validator for tile traversal, so hero movement and monster AI must obey the same blocking rules for occupants, walls, and terrain.

## Component: useDungeonMovementRules

### Role: Business Logic

**Signature**:

- `mapQuery`: Object (Result of @useDungeonMapQuery)
- `foundPassages`: List of {x: Integer, y: Integer} (Discovered secret passages from useSecretPassages)

### ⚡ Capabilities

#### isValidDestination

- **Contract**: Checks if a unit can end its movement at the target cell.
- **Signature**: `(x: Integer, y: Integer, excludeEntityId: Integer) -> Boolean`
- **Flow**:
  - Return FALSE if `mapQuery.getMapCell(x, y)` (@MapCell) is null.
  - Return FALSE if `mapQuery.isBlockedByFurniture(x, y)`.
  - Return FALSE if `mapQuery.isBlockedByMonster(x, y, excludeEntityId)`.
  - Return FALSE if `mapQuery.isOccupiedByHero(x, y, excludeEntityId)`.
  - Return FALSE if `mapQuery.isBlockedByRock(x, y)`.
  - Return TRUE.

#### isWalkable

- **Contract**: Checks if a unit can move from Source to Target (adjacent). Secret passages act as transparent cells unless discovered; once discovered they function as doors for cross-room movement.
- **Signature**: `(sourceX: Integer, sourceY: Integer, targetX: Integer, targetY: Integer, excludeEntityId: Integer, foundPassages: List) -> Boolean`
- **Flow**:
  - **Bounds Check**: Return FALSE if target coordinates are less than 1 or greater than the map dimensions (using `mapQuery.getMapDimensions`).
  - **Static Obstacles**: Return FALSE if `mapQuery.isBlockedByFurniture(targetX, targetY)`.
  - Resolve `movingHero` from `mapQuery.gameSession.heroes` with `heroId` matching `excludeEntityId`.
  - `movingHero` MUST be resolved from the `HeroState.heroId` field, not from a generic `id`, because movement permissions for allied-hero traversal depend on correctly identifying the active hero.
  - Resolve `isHeroMovement` as TRUE only if `movingHero` exists.
  - Resolve `canIgnoreOccupants` as TRUE only if `movingHero.activeStatus` contains "InvisiblePassage".
  - **Dynamic Obstacles**:
    - IF `mapQuery.isBlockedByMonster(targetX, targetY, excludeEntityId)` is TRUE:
      - IF `canIgnoreOccupants` is FALSE:
        - Return FALSE.
    - IF `mapQuery.isOccupiedByHero(targetX, targetY, excludeEntityId)` is TRUE:
      - IF `isHeroMovement` is FALSE AND `canIgnoreOccupants` is FALSE:
        - Return FALSE.
      - IF `isHeroMovement` is TRUE AND `canIgnoreOccupants` is FALSE:
        - // Hero movement may pass through allied heroes, but `isValidDestination` still forbids ending on an occupied hero cell.
      - ELSE IF `canIgnoreOccupants` is TRUE:
        - Return FALSE.
  - **Rock Obstacles**: Return FALSE if `mapQuery.isBlockedByRock(targetX, targetY)`.
  - **Room/Wall Logic**:
    - Get `sourceValo` from `mapQuery.getVisibilityCell(sourceX, sourceY)` (@VisibilityCell).
    - Get `targetValo` from `mapQuery.getVisibilityCell(targetX, targetY)` (@VisibilityCell).
    - IF sourceValo IS NULL OR targetValo IS NULL: RETURN TRUE (Assume open space if visibility data missing).
    - **(Crossing Rooms)**: IF `sourceValo` != `targetValo`:
      - IF `mapQuery.isDoor(sourceX, sourceY)` OR `mapQuery.isDoor(targetX, targetY)`:
        - Return TRUE.
      - **Secret Passage Check**: Only permit secret passage crossing if passage is discovered:
        - IF `mapQuery.isSecretPassage(sourceX, sourceY)` AND `{sourceX, sourceY}` is in `foundPassages`:
          - Return TRUE.
        - IF `mapQuery.isSecretPassage(targetX, targetY)` AND `{targetX, targetY}` is in `foundPassages`:
          - Return TRUE.
      - IF `movingHero` exists AND (`movingHero.activeStatus` contains "WallPass" OR `movingHero.activeStatus` contains "InvisiblePassage"):
        - Return TRUE.
      - Return FALSE.
  - Return TRUE.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities isValidDestination, isWalkable MUST avoid undefined side effects outside declared flow and side effects.

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
