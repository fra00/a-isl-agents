# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-hero-stats

---

> **Reference**: @HeroState in `./domain-session.isl.md`
> **Reference**: @Equipment in `./domain-ruleset.isl.md`
> **Reference**: @Monster in `./domain-ruleset.isl.md`

## Domain Concepts

- `effective hero stats`: The derived combat and utility values obtained from base hero data, equipped items, and active statuses.
- `trap disarm capability`: Boolean ability granted natively to the Dwarf (`Nano`) or by equipment with `disinnesc = true`.

## Component: useHeroStats

### Role: Business Logic

**Signature**:

- `staticEquipment`: List<@Equipment>

### ⚡ Capabilities

#### calculateStats

- **Contract**: Calculates the total stats for a hero based on their base stats and equipped items.
- **Signature**: `(heroState: @HeroState) -> { attacco: Integer, difesa: Integer, movimento: Integer, mente: Integer, corpo: Integer, canAttackDiagonal: Boolean, canAttackRanged: Boolean, canDisarmTraps: Boolean, hasDoubleAttack: Boolean }`
- **Flow**:
  - IF `heroState` is null OR `heroState.hero` is null:
    - RETURN a zeroed stats object with all numeric fields set to 0 and all capability flags set to false.
  - Get `hero` from `heroState.hero`.
  - Initialize `stats` with base values:
    - `attacco`: `hero.attacco`.
    - `difesa`: `hero.difesa`.
    - `movimento`: `hero.movimento`.
    - `mente`: `hero.mente`.
    - `corpo`: `hero.corpo`.
    - `canAttackDiagonal`: false.
    - `canAttackRanged`: false.
    - `canDisarmTraps`: true only if `hero.classe.toLowerCase()` is `"nano"`, otherwise false.
    - `hasDoubleAttack`: false.
  - Filter `staticEquipment` to find items where `id` is in `heroState.equipped`.
  - FOR each `item` in equipped items:
    - **Attack**:
      - IF `item.dadatt` > 0:
        - Set `stats.attacco` to `item.dadatt` (💡 Rule: Weapon dice values strictly REPLACE base hero attack value, do not sum).
    - **Defense**:
      - IF `item.daddif` > 0:
        - Add `item.daddif` to `stats.difesa`.
      - IF `item.daddifex` > 0:
        - Add `item.daddifex` to `stats.difesa`.
    - **Movement**:
      - Add `item.movim` to `stats.movimento`.
    - **Mind**:
      - Add `item.puntimente` to `stats.mente`.
    - **Capabilities**:
      - IF `item.diago` is true: Set `stats.canAttackDiagonal` to true.
      - IF `item.tiro` is true OR `item.tirounavo` is true: Set `stats.canAttackRanged` to true.
      - IF `item.disinnesc` is true: Set `stats.canDisarmTraps` to true, allowing any non-Dwarf hero with the correct equipment to disarm traps.
      - IF `item.doppioatt` is true: Set `stats.hasDoubleAttack` to true.
  - **Status Modifiers**:
    - IF `heroState.activeStatus` contains "RockSkin":
      - Add 1 to `stats.difesa`.
    - IF `heroState.activeStatus` contains "Courage":
      - Add 2 to `stats.attacco`.
    - IF `heroState.bonusDefenseDiceNextCombat` is greater than 0:
      - Add `heroState.bonusDefenseDiceNextCombat` to `stats.difesa` (consumable prep; cleared when the monster next resolves an attack against this hero).
  - RETURN `stats`.

#### calculateAttackDice

- **Contract**: Calculates the attack dice count considering the specific target monster and equipment bonuses.
- **Signature**: `(heroState: @HeroState, monster: @Monster) -> Integer`
- **Flow**:
  - Let `baseStats` = `calculateStats(heroState)`.
  - Let `dice` = `baseStats.attacco`.
  - Filter `staticEquipment` to find items where `id` is in `heroState.equipped`.
  - FOR each `item` in equipped items:
    - IF `item.numdadicontr` > 0 AND `item.targetMonster` is NOT null:
      - Let `isTarget` = false.
      - IF `item.targetMonster` is Integer AND `item.targetMonster` == `monster.id`: Set `isTarget` to true.
      - ELSE IF `item.targetMonster` is String:
        - Split `item.targetMonster` by "," into `targets`.
        - IF `monster.id` (as string) is in `targets`: Set `isTarget` to true.
      - IF `isTarget` is true:
        - Set `dice` to `item.numdadicontr`.
  - IF `heroState.bonusAttackDiceNextHeroAttack` is greater than 0:
    - Add it to `dice` (consumable attack bonus; cleared when the hero attack resolves in session).
  - RETURN `dice`.

#### canAttackTwice

- **Contract**: Checks if the hero can perform a double attack against the specific monster.
- **Signature**: `(heroState: @HeroState, monster: @Monster) -> Boolean`
- **Flow**:
  - Filter `staticEquipment` to find items where `id` is in `heroState.equipped`.
  - FOR each `item` in equipped items:
    - IF `item.doppioatt` is true:
      - IF `item.mosdoppio` is NOT null AND `item.mosdoppio` > 0:
        - IF `item.mosdoppio` == `monster.id`: RETURN true.
      - ELSE:
        - RETURN true.
  - RETURN false.

#### getConsumableWeaponId

- **Contract**: Identifies the ID of an equipped weapon that should be consumed after a ranged attack.
- **Signature**: `(heroState: @HeroState) -> Integer | null`
- **Flow**:
  - Filter `staticEquipment` to find items where `id` is in `heroState.equipped`.
  - FOR EACH `item` in equipped items:
    - IF `item.tirounavo` is true:
      - RETURN `item.id`.
  - RETURN null.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities calculateStats, calculateAttackDice, canAttackTwice, getConsumableWeaponId MUST avoid undefined side effects outside declared flow and side effects.

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
