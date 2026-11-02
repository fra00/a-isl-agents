# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-map-query

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component is the canonical read-only boundary for map topology queries and exposes enough session context for movement rules to evaluate temporary traversal effects.

## Component: useDungeonMapQuery

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession
- `visibilityMap`: @VisibilityMap (Nullable).

### ⚡ Capabilities

#### initialize

- **Contract**: Safely initializes internal structures, handling potential null `visibilityMap`.

#### getMapCell

- **Contract**: Retrieves from `@MapDefinition` data cell at coordinates `@GameSession.currentMap.grid[]`.
  Search for all cells with matching `x` and `y`. Returns null if not found.
- **Signature**: `(x: Integer, y: Integer) -> @MapCell | null`

#### getVisibilityCell

- **Contract**: Retrieves the (`@VisibilityCell`) visibility data from (`@VisibilityMap.data`).
  Search for all cells with matching `x` and `y`. Returns null if not found.
- **Signature**: `(x: Integer, y: Integer) -> @VisibilityCell | null`

#### isDoor

- **Contract**: Retrieves from `@MapDefinition` data cell at coordinates `@GameSession.currentMap.porte`.
  Search for all cells with matching `x` and `y`. Returns null if not found.
- **Signature**: `(x: Integer, y: Integer) -> Boolean`

#### isSecretPassage

- **Contract**: `getMapCell` (@MapCell) and Checks if a secret passage exists at the given coordinates.
- **Signature**: `(x: Integer, y: Integer) -> Boolean`

#### isBlockedByFurniture

- **Contract**: `getMapCell` (@MapCell) and checks if the cell is not traversable because of furniture or furniture footprint/invisible occupancy flags.
- **Signature**: `(x: Integer, y: Integer) -> Boolean`
- **Flow**:
  1. get the cell from `getMapCell` (@MapCell) with coordinates `x` and `y`.
  2. return TRUE if at least one of these conditions holds:
     - `cell.mobili.num` is not null (furniture anchor tile),
     - `cell.arnt.inv` is true (invisible non-transitable area),
     - `cell.mobili.flpo` is true (furniture footprint occupancy),
     - `cell.mobili.flpv` is true (hidden/secondary furniture footprint occupancy).
  3. otherwise return FALSE.

#### isBlockedByMonster

- **Contract**: `getMapCell` (@MapCell) Checks if the cell is occupied by a monster.
- **Signature**: `(x: Integer, y: Integer, excludeEntityId: Integer) -> Boolean`
- **Flow**:
  1. get the monster from the @GameSession.monsters list with coordinates `x` and `y` and id different from `excludeEntityId`.
  2. if monster exist and monster.hp > 0 return TRUE else FALSE.

#### isOccupiedByHero

- **Contract**: Checks if the cell is occupied by a **living** hero (defeated heroes with `currentBody` at or below zero do not block the cell).
- **Signature**: `(x: Integer, y: Integer, excludeEntityId: Integer) -> Boolean`
- **Flow**:
  1. IF `gameSession.heroes` is null RETURN false.
  2. RETURN true iff some hero has `x`, `y` matching, `heroId` different from `excludeEntityId`, and `currentBody` greater than 0.

#### isBlockedByRock

- **Contract**: Checks if the cell is blocked by rock .
- **Signature**: `(x: Integer, y: Integer) -> Boolean`
- **Flow**:
  1. get the cell from `getMapCell` (@MapCell) with coordinates `x` and `y`.
  2. if cell exist and cell.arnt.antroc is true return TRUE else FALSE.

#### getMapDimensions

- **Contract**: Returns the width and height of the map.
- **Signature**: `() -> { width: 26, height: 19 }`

#### exposedContext

- **Contract**: Exposes read-only session context alongside lookup helpers so downstream movement rules can resolve active hero statuses while pathfinding across fog or special traversal effects.
- `gameSession`: @GameSession
- `visibilityMap`: @VisibilityMap

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities initialize, getMapCell, getVisibilityCell, isDoor, isSecretPassage MUST avoid undefined side effects outside declared flow and side effects.

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
