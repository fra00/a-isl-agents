# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-item-logic

---

> **Reference**: @HeroState, @GameSession in `./domain-session.isl.md`
> **Reference**: @Item in `./domain-ruleset.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component exposes consumable item intent while delegating persistent session writes to the dungeon session boundary.

## Component: useItemLogic

### Role: Business Logic

**Signature**:

- `staticItems`: List<@Item>
- `sessionManager`: @useDungeonSessionManager

### ⚡ Capabilities

#### useItem

- **Contract**: Delegates consumable item execution to the dungeon session boundary using the active `gameSession` context.
- **Signature**: `(heroId: Integer, itemId: Integer, gameSession: @GameSession, targetMonsterId: Integer | null) -> Boolean`
- **Flow**:
  - IF `gameSession` is null RETURN false.
  - RETURN `sessionManager.useItem(heroId, itemId, staticItems, targetMonsterId)`.

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
