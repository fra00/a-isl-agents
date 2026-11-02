# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-inventory-logic

---

> **Reference**: @HeroState, @GameSession in `./domain-session.isl.md`
> **Reference**: @Equipment in `./domain-ruleset.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component validates equipment metadata and delegates persistent equip state changes to the dungeon session boundary.

## Component: useInventoryLogic

### Role: Business Logic

**Signature**:

- `staticEquipment`: List<@Equipment>
- `sessionManager`: @useDungeonSessionManager

### ⚡ Capabilities

#### isItemCompatibleWithHero

- **Contract**: Checks if a specific equipment item can be used by a hero based on class restrictions.
- **Signature**: `(hero: @HeroState, item: @Equipment) -> Boolean`
- **Flow**:
  - IF `item.solopsg` is true AND `item.solopsgid` is NOT equal to `hero.heroId`:
    - RETURN false.
  - IF `item.nopsg` is true AND `item.nopsgid` is EQUAL to `hero.heroId`:
    - RETURN false.
  - RETURN true.

#### toggleEquipItem

- **Contract**: Requests the dungeon session boundary to equip or unequip an item after the consumer provides the active `gameSession` context.
- **Signature**: `(heroId: Integer, itemId: Integer, gameSession: @GameSession) -> Boolean`
- **Flow**:
  - IF `gameSession` is null RETURN false.
  - RETURN `sessionManager.toggleEquipItem(heroId, itemId, staticEquipment)`.

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
