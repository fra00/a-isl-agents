# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./domain-core

---

## Component: GameDomainCore

### Role: Domain

## Domain Concepts

### 📦 Content/Structure

#### `PageNavigationEnum`

- **Contract**: Specifies PageNavigationEnum semantics and invariants for this unit.
define the possibile PageView for navigation.

- `MAIN_MENU`: principal menu (Default).
- `PLAY_GAME`: game area.
- `EDITOR_GAME`: editor for game.
- `SHOP`: equipment shop.
- `DUNGEON`: game board view.
- `DUNGEON_DESCRIPTION`: description of the current mission.

#### `NavigationStatus`

- **Contract**: Specifies NavigationStatus semantics and invariants for this unit.
contain current status of navigation.

- `currentPageView`: Current page view (@PageNavigationEnum).

### 🚨 Constraints

- Each declared domain construct MUST preserve its own identity/property invariants.
- Domain-level definitions MUST reject contradictory or ambiguous semantics at the capability scope.
- Domain capabilities `PageNavigationEnum`, `NavigationStatus` MUST remain deterministic for equivalent domain inputs.

### 🚨 Global Constraints

- The component MUST provide one coherent domain vocabulary across all declared entities and structures.
- Cross-entity relationships and invariants MUST remain globally consistent within the component.
- The domain component MUST remain implementation-agnostic and free from UI orchestration concerns.

### ✅ Acceptance Criteria

- [ ] Capability-level domain constraints are explicit and non-contradictory.
- [ ] Component-level domain invariants remain consistent across all declared structures.
- [ ] Domain scope remains independent from UI/infra implementation choices.

### 🧪 Test Scenarios

1. **Capability Constraint - Domain Invariant**:
   - Target: first declared domain capability
   - Input: representative domain values including edge/boundary cases
   - Expected: invariant-preserving deterministic outcome

2. **Capability Constraint - Ambiguity Rejection**:
   - Target: domain capability-level semantics
   - Input: conflicting or incomplete domain definition case
   - Expected: explicit rejection or normalized deterministic interpretation

3. **Global Constraint - Vocabulary Coherence**:
   - Target: full domain component
   - Input: cross-reference usage across all entities
   - Expected: globally coherent identities, relationships, and terminology
