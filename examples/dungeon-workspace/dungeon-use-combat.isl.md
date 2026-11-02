# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-combat

---

> **Reference**: @HeroState, @MonsterState in `./domain-session.isl.md`
> **Reference**: @Hero, @Monster in `./domain-ruleset.isl.md`

## Component: useCombatLogic

### Role: Business Logic

**Signature**: ()

### Domain Concepts

#### `CombatDiceResult`

- **Contract**: Specifies CombatDiceResult semantics and invariants for this unit.
Enum representing the face of a combat die.

- `SKULL`: Represents a hit (3/6 chance).
- `WHITE_SHIELD`: Represents a hero block (2/6 chance).
- `BLACK_SHIELD`: Represents a monster block (1/6 chance).

#### `CombatResult`

- **Contract**: Specifies CombatResult semantics and invariants for this unit.
Structure containing the details of a combat interaction.

- `attackerDice`: List of rolled faces (@CombatDiceResult).
- `defenderDice`: List of rolled faces (@CombatDiceResult).
- `skulls`: Total skulls rolled by attacker (Integer).
- `shields`: Total effective shields rolled by defender (Integer).
- `damageDealt`: Final damage to be applied (Integer).

### ⚡ Capabilities

#### resolveCombat

- **Contract**: Simulates dice rolls and calculates damage for an attack between any two entities (Hero or Monster).
- **Signature**: `(attackDiceCount: Integer, defenseDiceCount: Integer, defenderIsHero: Boolean) -> @CombatResult`
- **Flow**:
  - **Guard**:
    - IF attackDiceCount < 0 THEN attackDiceCount = 0
    - IF defenseDiceCount < 0 THEN defenseDiceCount = 0

  - **1. Roll Attack**:
    - Initialize `attackerDice` list.
    - Repeat `attackDiceCount` times:
      - Generate random integer 1-6.
      - IF 1,2,3: Add `SKULL`.
      - IF 4,5: Add `WHITE_SHIELD`.
      - IF 6: Add `BLACK_SHIELD`.
    - `skulls` = Count of `SKULL` in `attackerDice`.
  - **2. Roll Defense**:
    - Initialize `defenderDice` list.
    - Repeat `defenseDiceCount` times:
      - Generate random integer 1-6.
      - IF 1,2,3: Add `SKULL`.
      - IF 4,5: Add `WHITE_SHIELD`.
      - IF 6: Add `BLACK_SHIELD`.
    - `shields` = 0.
    - IF `defenderIsHero` is true: `shields` = Count of `WHITE_SHIELD` in `defenderDice`.
    - ELSE: `shields` = Count of `BLACK_SHIELD` in `defenderDice`.
  - **3. Calculate Outcome**:
    - `damageDealt` = Max(0, `skulls` - `shields`).
  - **4. Return**:
    - Create and return `@CombatResult` with `attackerDice`, `defenderDice`, `skulls`, `shields`, `damageDealt`.

- **Return**:`{ resolveCombat }`

### 🚨 Constraints

- Dice counts MUST be non-negative; negative values are clamped to 0.
- Damage MUST never be negative; result is clamped to max(0, damage).
- Combat result MUST be immutable after creation; no side effects on input entities.
- This component is a pure deterministic calculator; it does NOT apply damage to entities or persist state.

### ⚙ Logic & Execution Rules (operational semantics — normative execution constraints)

#### Die Roll Mapping

- **Contract**: Specifies Die Roll Mapping semantics and invariants for this unit.
- Roll 1-3 → SKULL (hit)
- Roll 4-5 → WHITE_SHIELD (hero defense)
- Roll 6 → BLACK_SHIELD (monster defense)

#### Shield Effectiveness

- **Contract**: Specifies Shield Effectiveness semantics and invariants for this unit.
- If `defenderIsHero` is true: WHITE_SHIELD counts as 1 effective shield; BLACK_SHIELD counts as 0.
- If `defenderIsHero` is false: BLACK_SHIELD counts as 1 effective shield; WHITE_SHIELD counts as 0.

#### Damage Calculation

- **Contract**: Specifies Damage Calculation semantics and invariants for this unit.
- Effective damage = max(0, skulls - shields)
- Rounding: none (integer arithmetic only)
- Clamping: final damage >= 0 (if result negative, clamp to 0)

#### Idempotency

- **Contract**: Specifies Idempotency semantics and invariants for this unit.
- Given identical RNG seed, `resolveCombat` with same parameters produces identical results.
- No external state is modified; output depends only on input.

### 🚨 Global Constraints

- MUST preserve component-level determinism across all state transitions and orchestration flows.
- MUST ensure all capability-level mutations respect declared shared state boundaries.
- MUST keep cross-capability outcomes consistent with declared domain references and invariants.

### ✅ Acceptance Criteria

- Random die rolls follow 1-6 distribution.
- SKULL, WHITE_SHIELD, BLACK_SHIELD are counted correctly.
- Damage = max(0, skulls - appropriateShields) is calculated correctly.
- Hero fights apply WHITE_SHIELD; monster fights apply BLACK_SHIELD.
- Result object contains all necessary fields for downstream processing.

### 🧪 Test Scenarios

#### Hero Attack vs Monster

- **Contract**: Specifies Hero Attack vs Monster semantics and invariants for this unit.
- Given: attackDiceCount = 3, defenseDiceCount = 1, defenderIsHero = false
- When: `resolveCombat` called
- Then: attackerDice has 3 rolls, defenderDice has 1 roll, shields counted from BLACK_SHIELD

#### Zero Damage

- **Contract**: Specifies Zero Damage semantics and invariants for this unit.
- Given: 1 skull rolled, 1+ shield rolled
- When: Damage calculated
- Then: damageDealt = max(0, 1 - 1) = 0

#### Negative Dice Clamped

- **Contract**: Specifies Negative Dice Clamped semantics and invariants for this unit.
- Given: attackDiceCount = -5, defenseDiceCount = -2
- When: `resolveCombat` called
- Then: Treated as attackDiceCount = 0, defenseDiceCount = 0

