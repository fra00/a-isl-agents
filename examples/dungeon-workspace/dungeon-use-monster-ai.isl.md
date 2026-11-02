# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-monster-ai

---

> **Reference**: @GameSession, @MonsterState, @HeroState in `./domain-session.isl.md`
> **Reference**: @usePathfinding in `./dungeon-use-pathfinding.isl.md`
> **Reference**: @useCombatLogic in `./dungeon-use-combat.isl.md`
> **Reference**: @useHeroStats in `./dungeon-use-hero-stats.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component owns monster-turn orchestration while delegating all persistent `@GameSession` mutations to the dungeon session boundary.

## Component: useMonsterAI

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession
- `visibilityMap`: @VisibilityMap
- `onNotify`: (message: String) -> void
- `pathfinding`: @usePathfinding
- `combatLogic`: @useCombatLogic
- `heroStatsLogic`: @useHeroStats
- `sessionManager`: @useDungeonSessionManager

### ⚡ Capabilities

#### internal State

- **Contract**: Tracks whether the master phase is currently executing so monster turns cannot overlap.
- `isMonsterTurnInProgress`: Boolean (Default: false)

#### runMonsterTurn

- **Contract**: Orchestrates the actions of all monsters currently on the board.
- **Trigger**: Called by `Dungeon` when `currentTurn` exceeds the number of heroes.
- **Flow**:
  - IF `isMonsterTurnInProgress` is true, RETURN.
  - SET `isMonsterTurnInProgress` to true.
  - Trigger `onNotify("Turno del Master: i mostri si muovono...")`.
  - FOR EACH `monster` IN `gameSession.monsters`:
    - Wait 800ms (for visual clarity).
    - **Turn Skipping Status Checks**:
      - IF `monster.activeStatus` contains "Sleep":
        - Trigger `onNotify(monster.monster.nome + " sta dormendo e salta il turno.")`.
        - CONTINUE to next monster.
      - IF `monster.activeStatus` contains "Tempest":
        - Call `sessionManager.updateMonsterState(monster.id, null, null, ["Tempest"])`.
        - Trigger `onNotify(monster.monster.nome + " è bloccato dalla tempesta e salta il turno!")`.
        - CONTINUE to next monster.
      - **Targeting**: Find the nearest `hero` in `gameSession.heroes` that is NOT under fog (revealed area) using `findNearestHero`.
      - IF no visible hero is found, CONTINUE to next monster.
      - **Topological Adjacency Rule**: A monster and hero are considered adjacent for attack purposes only if they are orthogonally adjacent AND no wall boundary separates their two cells. A pure Manhattan distance of 1 is NOT sufficient across different `valo` areas unless the adjacency is mediated by a door or discovered secret passage cell.
      - **Surround Strategy**:
        - Identify all adjacent cells to `hero` (Up, Down, Left, Right).
        - Filter for cells that:
          - Are walkable (no walls/obstacles) AND NOT occupied by other entities.
          - Are themselves topologically valid melee positions relative to the hero.
        - IF `monster` is already topologically adjacent to `hero`:
          - Set `navigationTarget` to current `monster` position.
        - ELSE IF there are available adjacent cells:
          - Select `navigationTarget` as the unoccupied adjacent cell with the shortest valid path from `monster`.
        - ELSE:
          - Set `navigationTarget` to null (no valid melee approach cell available this turn).
      - **Critical Targeting Rule**:
        - Pathfinding for monster movement MUST target only unoccupied cells adjacent to the hero.
        - The hero-occupied cell MUST NOT be used as a movement/pathfinding destination candidate.
        - Topological adjacency checks for attack MUST be evaluated independently from pathfinding-to-hero-cell success.
    - **Movement**:
      - IF `navigationTarget` is null:
        - Skip movement for this monster.
      - ELSE IF `navigationTarget` is NOT current position:
        - Calculate `path` to `navigationTarget` using `pathfinding.calculatePath` (maxDepth: 100, ignoreEntities: false).
      - ELSE: Let `path` be an empty list.
      - IF path length > 0:
        - Traverse path in order and stop at the first cell where `fog` is true.
        - Let `movPoints` = `monster.monster.movimento`.
        - IF `monster.activeStatus` contains "Entangled":
          - Set `movPoints` to 1.
          - Trigger `onNotify(monster.monster.nome + " è intralciato e si muove a fatica.")`.
        - Let `reachablePath` = first N contiguous visible cells of that ordered path (where N is `movPoints`).
        - Initialize `statusesToRemove` as an empty list.
        - IF `monster.activeStatus` contains "Entangled":
          - Add "Entangled" to `statusesToRemove`.
        - Initialize `targetCell` to null.
        - **Occupancy Check**: Iterate `reachablePath` from end to start:
          - Check if cell (x, y) is occupied by any hero or ANY OTHER monster (excluding current `monster`) in `gameSession`.
          - IF NOT occupied:
            - Set `targetCell` to this cell.
            - BREAK loop.
        - IF `targetCell` is NOT null AND `targetCell` is NOT current position:
          - Call `sessionManager.updateMonsterState(monster.id, targetCell.x, targetCell.y, statusesToRemove)`.
        - ELSE IF `monster.activeStatus` contains "Entangled":
          - Call `sessionManager.updateMonsterState(monster.id, null, null, ["Entangled"])`.
        - Wait 400ms (allow movement animation).
    - **Combat**:
      - Check if `hero` is now topologically adjacent.
      - IF topologically adjacent:
        - Let `heroStats` = `heroStatsLogic.calculateStats(hero)`.
        - Let `combatResult` = `combatLogic.resolveCombat(monster.monster.attacco, heroStats.difesa, true)`.
        - IF `combatResult.damageDealt` > 0 AND `hero.activeStatus` contains "RockSkin":
          - Trigger `onNotify("La pelle di pietra di " + hero.hero.classe + " si frantuma!")`.
        - Trigger `onNotify(monster.monster.nome + " attacca " + hero.hero.classe + "!")`.
        - Call `sessionManager.resolveMonsterAttack(monster.id, hero.heroId, combatResult)`.
        - IF `hero.currentBody` - `combatResult.damageDealt` <= 0:
          - Trigger `onNotify(hero.hero.classe + " è caduto in battaglia!")`.
  - **End Phase**:
    - SET `isMonsterTurnInProgress` to false.
    - Call `sessionManager.startNextHeroRound()`.
    - Trigger `onNotify("Nuovo Turno! Tocca agli eroi.")`.

#### performInstantAttack

- **Contract**: Forces a monster to attack a hero immediately.
- **Signature**: `(monster: @MonsterState, hero: @HeroState)`
- **Flow**:
  - Trigger `onNotify("Il Mostro Errante (" + monster.monster.nome + ") attacca immediatamente!")`.
  - Let `heroStats` = `heroStatsLogic.calculateStats(hero)`.
  - Let `combatResult` = `combatLogic.resolveCombat(monster.monster.attacco, heroStats.difesa, true)`.
  - IF `combatResult.damageDealt` > 0 AND `hero.activeStatus` contains "RockSkin":
    - Trigger `onNotify("La pelle di pietra di " + hero.hero.classe + " si frantuma!")`.
  - Call `sessionManager.resolveMonsterAttack(monster.id, hero.heroId, combatResult)`.
  - IF `hero.currentBody` - `combatResult.damageDealt` <= 0:
    - Trigger `onNotify(hero.hero.classe + " è caduto sotto i colpi del Mostro Errante!")`.
  - Wait 1000ms (to let the player see the result).

#### findNearestHero

- **Contract**: Logic to determine which visible hero a monster should focus on, preferring the nearest reachable attack opportunity rather than raw Manhattan distance through walls.
- **Signature**: `(monster: @MonsterState) -> @HeroState`
- **Flow**:
  - Filter `gameSession.heroes` to find those whose (x, y) coordinates have `fog == false` in `visibilityMap`.
  - IF filtered list is empty, return NULL.
  - For each visible hero:
    - IF the monster is already topologically adjacent to that hero, treat the hero as having approach cost 0.
    - ELSE evaluate the hero's orthogonally adjacent cells and keep only those that are valid, unoccupied, and topologically adjacent to the hero for melee.
    - Use `pathfinding.calculatePath` to estimate the shortest valid approach toward one of those attack cells.
  - Prefer the hero with the smallest valid approach length.
  - IF no visible hero has a valid approach path, fall back to the smallest Manhattan distance only as a last resort.

### 🚨 Constraints

- Monsters MUST NOT move through walls or furniture.
- Monsters MUST NOT end their movement on a cell occupied by another entity (hero or monster).
- Monsters MUST NOT move into cells covered by fog (unrevealed areas).
- Monsters MUST NOT target the hero-occupied cell as a pathfinding destination; only free adjacent melee cells are valid approach destinations.
- `runMonsterTurn()` MUST increment `currentTurn` when complete so hero round begins next.
- Monsters MUST skip their turn if affected by "Sleep" or "Tempest" status.

### ⚙ Logic & Execution Rules (operational semantics — normative execution constraints)

#### Turn Sequencing

- **Contract**: Specifies Turn Sequencing semantics and invariants for this unit.
- `runMonsterTurn()` is called ONLY when `gameSession.currentTurn > gameSession.heroes.length`.
- Upon completion, `runMonsterTurn()` MUST call `sessionManager.startNextHeroRound()`, which increments turn counter.
- Overlapping turns are prevented by the `isMonsterTurnInProgress` guard.

#### Monument Activation Check

- **Contract**: Specifies Monument Activation Check semantics and invariants for this unit.
- For each monster, check `activeStatus` BEFORE any movement or attack.
- "Sleep" status: monster skips entire turn (no movement, no attack).
- "Tempest" status: monster skips entire turn, status is then removed.
- "Entangled" status: movement is restricted to 1 cell; status persists until next turn unless explicitly removed.

#### Targeting & Adjacency

- **Contract**: Specifies Targeting & Adjacency semantics and invariants for this unit.
- `findNearestHero()` filters by `fog == false`; invisible heroes are never targeted.
- Topological adjacency requires: orthogonal neighbor + no wall between cells + both in same or connected `valo`.
- Attack adjacency checks MUST NOT depend on whether pathfinding can reach the hero-occupied cell.
- Attack is triggered ONLY if topologically adjacent after movement.

#### Combat Resolution

- **Contract**: Specifies Combat Resolution semantics and invariants for this unit.
- If topologically adjacent to target hero after movement:
  - Calculate hero stats via `heroStatsLogic.calculateStats(hero)`.
  - Invoke `combatLogic.resolveCombat(monster.attacco, heroStats.difesa, true)`.
  - Apply damage and check for hero death (currentBody - damageDealt <= 0).
  - Persist result via `sessionManager.resolveMonsterAttack()`.

### 🧭 Decision Rules

- **Targeting Priority**: (1) Visible + topologically adjacent = attack now, (2) Visible + reachable = pursue, (3) Visible + no path = move toward last known position, (4) Not visible = patrol or wait.
- **Navigation Strategy**: Prefer shortest valid path to an unoccupied cell adjacent to hero (melee position) over moving directly to hero.
- **Occupancy Resolution**: Iterate reachable path from end to start; choose first unoccupied cell as final position.

### 🚨 Global Constraints

- MUST preserve component-level determinism across all state transitions and orchestration flows.
- MUST ensure all capability-level mutations respect declared shared state boundaries.
- MUST keep cross-capability outcomes consistent with declared domain references and invariants.

### ✅ Acceptance Criteria

- All monsters act in sequence during monster turn.
- Sleeping monsters skip turn; Tempest monsters skip and remove status.
- Monsters with valid paths move toward nearest visible hero.
- Adjacent monsters trigger combat immediately.
- Damage is correctly applied via `combatLogic.resolveCombat()`.
- Hero death is detected and notified.
- Monster turn completes and hero round begins automatically.

### 🧪 Test Scenarios

#### Normal Movement & Attack

- **Contract**: Specifies Normal Movement & Attack semantics and invariants for this unit.
- Given: Monster at (3, 3), hero at (5, 5), visible, pathing available
- When: Monster turn executes
- Then: Monster moves closer; if adjacent after move, combat resolves

#### Sleeping Monster

- **Contract**: Specifies Sleeping Monster semantics and invariants for this unit.
- Given: Monster with "Sleep" status
- When: Monster turn called
- Then: Monster takes no action, turn passes to next monster

#### No Valid Path

- **Contract**: Specifies No Valid Path semantics and invariants for this unit.
- Given: Monster at (3, 3), hero at (10, 10), pathfinding returns empty list
- When: Monster turn executes
- Then: Monster remains stationary, hero is not engaged
- Monsters MUST NOT open closed doors.
- The master phase should provide enough delay between actions so the player can see what is happening.

#### Adjacent Hero Must Be Attackable Without Targeting Hero Cell

- **Contract**: Specifies Adjacent Hero Must Be Attackable Without Targeting Hero Cell semantics and invariants for this unit.
- Given: Monster at (5, 5), hero at (5, 6), and no wall/door block between the two cells.
- When: Monster turn executes.
- Then: Monster MUST resolve combat against the adjacent hero even though the hero cell itself is an occupied destination and not a valid pathfinding target.

### ✅ Acceptance Criteria

- When the last hero ends their turn, the "Master Phase" begins automatically.
- Monsters move toward the nearest hero.
- Monsters attack if they are adjacent to a hero.
- Heroes defend using their total defense (base + equipment) and roll for white shields.
- Turn returns to Hero 1 after all monsters have acted.

