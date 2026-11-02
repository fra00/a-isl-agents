# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-fog-of-war

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @MapCell in `./domain-map.isl.md`
> **Reference**: @useVisibilityCalc in `./dungeon-use-visibility-calc.isl.md`

## Domain Concepts

- `fogVisibilityMap`: Runtime visibility state that MUST preserve previously revealed cells and treat missing `fog` values from static JSON as still fogged.

## Component: useFogOfWar

### Role: Business Logic

**Signature**: `useFogOfWar({ gameSession: @GameSession, staticVisibilityMap: @VisibilityMap })`

- `gameSession`: @GameSession (Current session state containing heroes).
- `staticVisibilityMap`: @VisibilityMap (The static board configuration loaded from JSON).

### ⚡ Capabilities

#### internal state

- **Contract**: Stores the mutable fog-of-war map and the visibility calculator used to reveal cells.

- `fogVisibilityMap`: @VisibilityMap (The static visibility map loaded from the mission data, used as reference for calculations).
- `visibilityCalc`: @useVisibilityCalc (Hook instance for visibility calculations).

#### init fogVisibilityMap

- **Contract**: Initializes `fogVisibilityMap` with the provided `staticVisibilityMap` when the component mounts or when `staticVisibilityMap` changes.
- **Trigger**: On component mount and when `staticVisibilityMap` changes.
- **Flow**:
  - IF `staticVisibilityMap` is null, set `fogVisibilityMap` to null.
  - ELSE, create a deep copy of `staticVisibilityMap` and normalize every visibility cell so `fog` is `true` unless the source cell explicitly contains `fog: false`.
  - Set the normalized copy as the initial state for `fogVisibilityMap`.

#### calculateFog

- **Contract**: Computes the current visibility state of the board based on hero positions.
- **Trigger**: When @gameSession.heroes or `staticVisibilityMap` changes.
- **Flow**:
  - IF `fogVisibilityMap` is null OR `fogVisibilityMap.data` is null RETURN.
  - IF `gameSession.isHeroOrderConfirmed` is false, RETURN.
  - Find `heroInTurn` in `gameSession.heroes` matching `gameSession.currentTurn`.
  - IF `heroInTurn` is found:
    - Call `visibilityCalc.calculateVisibleCells(heroInTurn.x, heroInTurn.y)` to get `visibleCells`.
    - Iterate through `visibleCells`:
      - Find corresponding cell in `fogVisibilityMap`.
      - Set `fog` to `false`.
  - Return the processed `fogVisibilityMap`.

#### revealInitialVisibility

- **Contract**: Clears fog for all positioned heroes at once.
- **Flow**:
  - IF `fogVisibilityMap` is null OR `fogVisibilityMap.data` is null RETURN.
  - FOR EACH `hero` IN `gameSession.heroes`:
    - Call `visibilityCalc.calculateVisibleCells(hero.x, hero.y)` to get `visibleCells`.
    - Iterate through `visibleCells`:
      - Find corresponding cell in `fogVisibilityMap` and set `fog` to `false`.
  - Return `fogVisibilityMap`.

#### revealFromPoint

- **Contract**: Manually removes fog from a specific coordinate's visible area.
- **Signature**: `(x: Integer, y: Integer)`
- **Flow**:
  - Call `visibilityCalc.calculateVisibleCells(x, y)` to get `visibleCells`.
  - Iterate through `visibleCells`:
    - Find corresponding cell in `fogVisibilityMap` and set `fog` to `false`.

**🚨 Constraint**:

- When fog is removed from a cell, it MUST remain permanently visible for the rest of the session. This means that once a cell's `fog` is set to `false`, it must never revert back to `true` even if all heroes move away from it.

- **Return**: `fogVisibilityMap` (The map data with updated fog status).

### 🚨 Constraints

- Each capability MUST enforce deterministic transitions and bounded side effects.
- Capability-level guards MUST handle invalid or missing state explicitly.
- Capability behavior MUST remain consistent with declared contracts and references.

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
