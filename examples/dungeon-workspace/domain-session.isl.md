# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./domain-session

---

> **Reference**: @MapDefinition in `./domain-map.isl.md`
> **Reference**: @Hero, @Monster, @Item, @Equipment in `./domain-ruleset.isl.md`

## Component: GameDomainSession

### Role: Domain

## Domain Concepts

### 📦 Content/Structure

#### `HeroState`

- **Contract**: Specifies HeroState semantics and invariants for this unit.
Represents the dynamic state of a hero (@Hero) during a campaign (persistence).

- `heroId`: Reference to the static @Hero definition (Integer).
- `turnOrder`: Turn number (Integer).
- `currentBody`: Current Body Points (Integer).
- `currentMind`: Current Mind Points (Integer).
- `gold`: Accumulated gold (Integer) default: 0.
- `inventory`: List of IDs of possessed items (@Item) (List of Integer).
- `equipment`: List of IDs of owned equipment (@Equipment) (List of Integer).
- `equipped`: List of IDs of currently equipped equipment (@Equipment) (List of Integer).
- `availableSpells`: List of IDs of spells (@Spell) (List of Integer).
- `activeStatus`: List of active effects (e.g., "Courage", "RockSkin", "Invisible") (List of String).
- `isEscaped`: Boolean indicating if the hero has left the map through an exit (Default: false).
- `x`: Current X position on the map grid (Integer).
- `y`: Current Y position on the map grid (Integer).
- `bonusDefenseDiceNextCombat`: Extra defense dice granted by consumables (e.g. `Item.difesa`); applied on the next monster attack against this hero, then cleared (Integer, default 0).
- `bonusAttackDiceNextHeroAttack`: Extra attack dice granted by consumables (`Item.attacco`); applied on the hero's next melee/ranged attack roll, then cleared (Integer, default 0).
- `bonusMovementDiceNextRoll`: Extra movement dice granted by consumables (`Item.movimento`); applied on the hero's next movement roll only, then cleared (Integer, default 0).
- `bonusMeleeAttackQuota`: Minimum number of attack actions allowed in the next hero attack phase from consumables (`Item.natt`); cleared when that phase ends or the quota is exhausted (Integer, default 0).
- `hero`: Instance of hero definition (@Hero)

#### `MonsterState`

- **Contract**: Specifies MonsterState semantics and invariants for this unit.
Represents the dynamic state of a monster (@Monster) during a session.

- `id`: Unique instance identifier (Integer).
- `monster`: Instance of monster definition (@Monster)
- `x`: Current X position on the map grid (Integer).
- `y`: Current Y position on the map grid (Integer).
- `currentBody`: Current Body Points (Integer).
- `currentMind`: Current Mind Points (Integer).
- `activeStatus`: List of active effects (e.g., "Sleep", "Tempest", "Entangled") (List of String).

#### `ScriptImage`

- **Contract**: Specifies ScriptImage semantics and invariants for this unit.
Represents a temporary image placed on the board by a mission script.

- `x`: Current X position on the map grid (Integer).
- `y`: Current Y position on the map grid (Integer).
- `src`: Public image path rendered on the board (String).

#### `GameSession`

- **Contract**: Specifies GameSession semantics and invariants for this unit.
Represents the current active session state.

- `campaignName`: Name of the active campaign (String).
- `currentMap`: structure of the current map (@MapDefinition).
- `currentMissionIndex`: Index of the current mission (Integer).
- `heroes`: List of participating heroes (List of @HeroState).
- `monsters`: List of active monsters (List of @MonsterState) Default: [].
- `openedDoors`: List of coordinates "x,y" of doors that have been opened (List of String) Default: [].
- `spawnedLocations`: List of coordinates "x,y" where monsters have already spawned (List of String).
- `currentTurn` :Num of the current turn (Integer) default: 1.
- `isHeroOrderConfirmed`: Flag indicating if the turn order has been selected (Boolean) default: false.
- `lastAttack`: Object containing details of the last attack for potential UI display (Object with hero, monster, combatResult) default:null.
- `treasureDeck`: List of treasure cards available in the session (List of @TreasureCard).
- `triggeredScripts`: List of stable keys for one-time mission scripts already executed (List of String) default: [].
- `scriptImages`: List of board overlays created by mission scripts (List of @ScriptImage) default: [].

#### `TurnPhase`

- **Contract**: Specifies TurnPhase semantics and invariants for this unit.
Object representing the possible activity of a hero's turn.

- `HasMoved`: Turn started, waiting for movement roll or action.
- `HasPerformedAction`: The hero have searched for secret passage, trap , treasure or have attacked.
- `IsTurnFinished`: The hero have ended the turn, waiting for next hero turn or monster turn in future.

### 🚨 Constraints

- Each declared domain construct MUST preserve its own identity/property invariants.
- Domain-level definitions MUST reject contradictory or ambiguous semantics at the capability scope.
- Domain capabilities `HeroState`, `MonsterState`, `ScriptImage`, `GameSession`, `TurnPhase` MUST remain deterministic for equivalent domain inputs.

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
