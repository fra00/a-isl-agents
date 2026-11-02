# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-map-interaction

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component resolves passage geometry and delegates any persistent door mutation to the dungeon session boundary.

## Component: useMapInteraction

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession
- `foundPassages`: List of {x: Integer, y: Integer} (Discovered secret passages from useSecretPassages).
- `sessionManager`: @useDungeonSessionManager

### ⚡ Capabilities

#### isFrontOfDoor

- **Contract**: Checks if coordinates are on or adjacent to a passage (door or revealed secret passage) and calculates the logical destination.
- **Signature**: `(x: Integer, y: Integer) -> { found: Boolean, destination: {x: Integer, y: Integer}, passageCell: {x: Integer, y: Integer} } | null`
- **Flow**:
  - Search for a valid Passage at the provided `(x, y)` coordinates or its 4 cardinal neighbors (Up, Down, Left, Right).
  - **🚨 Constraint**: Diagonals MUST be ignored.
    - A Passage is valid if it is a Door or a Secret Passage that has been previously discovered AND it is NOT in `gameSession.openedDoors`.
  - IF no Passage is found:
    - RETURN null.
  - Identify the orientation of the found Passage (Horizontal or Vertical).
  - Find the hero whose turn it is in `gameSession`.
  - IF hero is null RETURN null.
  - **Orientation Validation**:
    - IF Passage is **Horizontal** (`oriz` is true):
      - Valid ONLY IF hero is at `passage.x, passage.y` OR `passage.x, passage.y-1` OR `passage.x, passage.y+1`.
    - ELSE IF Passage is **Vertical** (`oriz` is false):
      - Valid ONLY IF hero is at `passage.x, passage.y` OR `passage.x-1, passage.y` OR `passage.x+1, passage.y`.
    - IF not valid for orientation: RETURN null.
  - **Determine Candidate Sides Robustly**:
    - Build candidate side cells from map grid around passage:
      - IF **Horizontal**: candidates are (passage.x, passage.y - 1) and (passage.x, passage.y + 1).
      - IF **Vertical**: candidates are (passage.x - 1, passage.y) and (passage.x + 1, passage.y).
    - Keep only candidates that exist in `gameSession.currentMap.grid`.
    - IF less than 2 valid candidates exist RETURN null.
    - Let `heroArea` be `valo` of hero cell.
    - Let `heroSide` = candidate whose `valo` equals `heroArea` when available; if both match, choose the nearest by Manhattan distance to hero.
    - Let `destinationSide` = the other candidate with a different coordinate than `heroSide`.
    - IF `heroSide` is null OR `destinationSide` is null RETURN null.
  - **Destination Guard**:
    - IF `destinationSide` is blocked (`arnt.antroc` is true OR `arnt.inv` is true) RETURN null.
  - Return the Passage location and the calculated Destination.

#### openPassage

- **Contract**: Validates the requested passage opening and delegates the session mutation to the dungeon session boundary.
- **Signature**: `(passageX: Integer, passageY: Integer, destinationX: Integer, destinationY: Integer) -> Boolean`
- **Flow**:
  - IF `gameSession` is null OR `gameSession.currentMap` is null RETURN false.
  - IF NOT (gameSession.currentMap.porte.exists(p => p.x == passageX AND p.y == passageY) OR foundPassages.exists(p => p.x == passageX AND p.y == passageY)) THEN RETURN false.
  - RETURN `sessionManager.openPassage(passageX, passageY, destinationX, destinationY, foundPassages)`.

### 🚨 Constraints

- Each capability MUST enforce deterministic transitions and bounded side effects.
- Capability-level guards MUST handle invalid or missing state explicitly.
- Capability behavior MUST remain consistent with declared contracts and references.
- Destination side resolution for a door MUST be orientation-aware and symmetric with respect to the hero side; opening from either side of the same door MUST resolve to the opposite traversable side.
- `isFrontOfDoor` MUST return null when side detection is ambiguous or invalid, rather than returning a potentially wrong destination.

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
