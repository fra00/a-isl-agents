# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./shop-logic

---

> **Reference**: Hero, Equipment in `./domain-ruleset.isl.md`
> **Reference**: GameSession, HeroState in `./domain-session.isl.md`

## Component: ShopLogic

### Role: Business Logic

### ⚡ Capabilities

#### loadShopData

- **Contract**: Loads static data for Heroes and Equipment.
- **Signature**: `() -> { heroes: List<Hero>, items: List<Equipment> }`
- **Flow**:
  - Fetch `/jsonData/heroes.json`.
  - Fetch `/jsonData/equipment.json`.
  - Filter `items` to include only those with `prezzo` > 0.
  - Return combined data object.

#### validatePurchase

- **Contract**: Checks if a hero is allowed to buy a specific item.
- **Signature**: `(heroState: HeroState, item: Equipment) -> { allowed: Boolean, reason: String }`
- **Flow**:
  - IF `heroState.gold` < `item.prezzo` THEN Return `{ allowed: false, reason: "Not enough gold" }`.
  - IF `heroState.equipment` contains `item.id` THEN Return `{ allowed: false, reason: "Already owned" }`.
  - IF `item.nopsg` is true AND `item.nopsgid` == `heroState.heroId` THEN Return `{ allowed: false, reason: "Forbidden for class" }`.
  - IF `item.solopsg` is true AND `item.solopsgid` != `heroState.heroId` THEN Return `{ allowed: false, reason: "Exclusive to other class" }`.
  - Return `{ allowed: true, reason: "" }`.

#### executePurchase

- **Contract**: Performs the purchase transaction and returns the updated game session.
- **Signature**: `(session: GameSession, heroIndex: Integer, item: Equipment) -> GameSession`
- **Flow**:
  - Clone the `session` object to avoid mutation.
  - Retrieve the `HeroState` at `heroIndex`.
  - IF heroIndex < 0 OR heroIndex >= session.heroes.length THEN Return session (or throw Error to prevent corruption).
  - Create a new `HeroState` by spreading all current properties and updating:
    - `gold` = `currentGold` - `item.prezzo`.
    - `equipment` = `currentEquipment` + `item.id` (Added to backpack).
  - 💡 **Note**: Do NOT update `equipped` list. In Dungeon, items must be manually equipped from the inventory later.
  - Update the `session.heroes` list with the new `HeroState`.
  - Return the updated `session`.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities loadShopData, validatePurchase, executePurchase MUST avoid undefined side effects outside declared flow and side effects.

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
