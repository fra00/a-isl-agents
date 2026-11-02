# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-visible-monsters

---

> **Reference**: @GameSession, @MonsterState in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`

## Component: useDungeonVisibleMonsters

### Role: Business Logic

**Signature**: `useDungeonVisibleMonsters({ gameSession: GameSession, boardVisibilityMap: VisibilityMap })`

### ⚡ Capabilities

#### visibleMonsters

- **Contract**: Returns a list of monsters currently visible to the player.
- **Flow**:
  - IF `gameSession.monsters` OR `boardVisibilityMap` is missing, RETURN empty list.
  - Iterate through `gameSession.monsters`.
  - Find the VisibilityCell for the monster's (x, y).
  - IF no cell exists or cell.fog is true, treat as not visible.
  - ELSE, include in the returned list.
  - RETURN list of visible monsters.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities visibleMonsters MUST avoid undefined side effects outside declared flow and side effects.

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
