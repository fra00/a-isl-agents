# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-turn-logic

---

> **Reference**: @GameSession, @TurnPhase in `./domain-session.isl.md`
> **Reference**: @MapDefinition in `./domain-map.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @usePathfinding in `./dungeon-use-pathfinding.isl.md`
> **Reference**: @useCombatLogic in `./dungeon-use-combat.isl.md`
> **Reference**: @useTraps in `./dungeon-use-traps.isl.md`
> **Reference**: @useHeroStats in `./dungeon-use-hero-stats.isl.md`
> **Reference**: @useVisibilityCalc in `./dungeon-use-visibility-calc.isl.md`
> **Reference**: @useMapInteraction in `./dungeon-use-map-interaction.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component owns turn orchestration and tactical validation while delegating all persisted `@GameSession` mutations to the dungeon session boundary.

## Component: useTurnLogic

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession (Current session state).
- `visibilityMap`: @VisibilityMap (The static board configuration).
- `onNotify`: (message: String) -> void (Callback to show notification).
- `trapsLogic`: @useTraps (Hook instance for trap management).
- `heroStatsLogic`: @useHeroStats (Hook instance for stat calculations).
- `hooksPathfinding`: @usePathfinding (Hook instance for pathfinding).
- `combatLogic`: @useCombatLogic (Hook instance for combat resolution).
- `mapInteractionLogic`: @useMapInteraction (Hook instance for door/passage interaction).
- `visibilityCalc`: @useVisibilityCalc (Hook instance for LOS calculation).
- `sessionManager`: @useDungeonSessionManager (Dungeon boundary for persisted session mutations).

### ⚡ Capabilities

#### internalState

- **Contract**: Tracks transient turn UI state for movement, attack availability, and interaction affordances.
- `turnPhase`: @TurnPhase (Current phase of the turn).
- `movementPoints`: Integer (Remaining movement steps) Default: null.
- `hoveredPath`: List of {x, y} (The valid path to the hovered cell, empty if invalid).
- `hoveredPathVariant`: "valid" | "blocked-by-second-wall" | null (Visual state for the currently previewed movement path).
- `canAttack`: Boolean (True if there is at least one visible monster in attack range).
- `attacksPerformed`: Integer (Number of attacks performed in the current turn) Default: 0.
- `isMoving`: Boolean (True if hero is currently animating movement).
- `isMovingStarted`: Boolean (True if hero has started moving).
- `canOpenDoor`: { found: Boolean, destination: {x, y}, passageCell: {x, y} } | null (Info about nearby door).
- `activePath`: List of {x, y} (The path currently being traversed).

#### checkMissionObjective

- **Contract**: Verifies if the current mission goal is completed.
- **Signature**: `() -> Boolean`
- **Flow**:
  - Let `header` = `gameSession.currentMap.header`.
  - Let `currentMap` = `gameSession.currentMap`.
  - IF `header` is null OR `currentMap` is null RETURN false (objectives cannot be evaluated; mission MUST NOT be treated as complete).
  - Resolve `bossObjectiveId` from `header.mostro_uscita` only when it is a positive integer.
  - Resolve `itemObjectiveId` from `header.oggetto_f` only when it is a positive integer.
  - Resolve `weaponObjectiveId` from `header.arma_f` only when it is a positive integer.
  - Resolve `treasureTarget` from `header.tesoro_finale`.
  - Let `hasTreasureObjective` be true only when `treasureTarget` is defined and is NOT the sentinel `{ x: 0, y: 0 }`.
  - IF no boss, final-treasure, item, or weapon objective is active RETURN true.
  - **Condition: Kill Boss**:
    - IF `bossObjectiveId` is active:
      - Find the static boss spawn cell in `currentMap.grid` where `mostab.mos` is true and `mostab.mosid` matches `bossObjectiveId`.
      - Let `bossAlive` = any live monster in `gameSession.monsters` whose `monster.id` matches `bossObjectiveId`.
      - Let `bossHiddenButUnspawned` = the static boss spawn cell exists and its coordinate is NOT yet listed in `gameSession.spawnedLocations`.
      - The boss objective is complete only when `bossAlive` is false AND `bossHiddenButUnspawned` is false.
  - **Condition: Final Treasure**:
    - IF `hasTreasureObjective` is true:
      - Find the target cell at `tesoro_finale.x`, `tesoro_finale.y`.
      - The treasure objective is complete only when the target cell exists and its `tes` payload no longer contains gold, item, weapon, or trap values greater than 0.
  - **Condition: Recover Item**:
    - IF `itemObjectiveId` is active:
      - Let `itemStillOnMap` = any map cell still contains `tes.ogg == itemObjectiveId`.
      - Let `itemOwned` = any hero inventory contains `itemObjectiveId`.
      - The item objective is complete only when `itemStillOnMap` is false AND `itemOwned` is true.
  - **Condition: Recover Weapon**:
    - IF `weaponObjectiveId` is active:
      - Let `weaponStillOnMap` = any map cell still contains `tes.arma == weaponObjectiveId`.
      - Let `weaponOwned` = any hero `equipment` contains `weaponObjectiveId`.
      - The weapon objective is complete only when `weaponStillOnMap` is false AND `weaponOwned` is true.
  - RETURN true only when every active mission objective above is complete.
  - Expose the current result as `isMissionObjectiveCompleted` in the returned hook API so the container can distinguish victory from retreat.

#### updateCanAttack

- **Contract**: Updates the `canAttack` state and checks for "Courage" spell expiration.
- **Trigger**: When `@GameSession` changes or hero position changes.
- **Flow**:
  - Initialize `canAttack` to false.
  - Find `hero` in `gameSession.heroes` where `turnOrder` == `gameSession.currentTurn`.
  - Let `stats` = `heroStatsLogic.calculateStats(hero)`.
  - Iterate through @GameSession.monsters:
    - IF `turnPhase.hasPerformedAction` is true return false
    - Let `dx` = absolute(`hero.x` - `monster.x`).
    - Let `dy` = absolute(`hero.y` - `monster.y`).
    - Let `dist` = `dx` + `dy`.
    - IF `dist` <= 1: Set `canAttack` to true.
    - ELSE IF `dx` == 1 AND `dy` == 1 AND `stats.canAttackDiagonal` is true:
      - IF `visibilityCalc` is NOT null AND `visibilityCalc.hasLineOfSight(hero.x, hero.y, monster.x, monster.y)` is true: Set `canAttack` to true.
    - ELSE IF `stats.canAttackRanged` is true:
      - IF `visibilityCalc` is NOT null AND `visibilityCalc.hasLineOfSight(hero.x, hero.y, monster.x, monster.y)` is true: Set `canAttack` to true.
    - IF `canAttack` is true: BREAK loops.
  - Update internal state with new value of `canAttack`.
  - **Courage Check**:
    - Let `visibleMonsters` = Filter `gameSession.monsters` where the corresponding cell in `visibilityMap.data` has `fog` set to false.
    - IF `visibleMonsters` is empty:
      - Let `courageRemoved` = any hero in `gameSession.heroes` whose `activeStatus` contains "Courage".
      - IF `courageRemoved` is true:
        - Trigger `onNotify("L'effetto di Coraggio svanisce: non ci sono più mostri in vista.")`.
        - Call `sessionManager.clearHeroStatusEverywhere("Courage")`.

#### rollMovement

- **Contract**: Rolls 2d6 to determine movement points.
- **Trigger**: User clicks "Roll Movement".
- **Flow**:
  - Find `hero` in `gameSession.heroes` where `turnOrder` == `gameSession.currentTurn`.
  - IF `hero` is null OR `hero.currentBody` <= 0 OR `hero.isEscaped` is true RETURN.
  - Let `stats` = `heroStatsLogic.calculateStats(hero)`.
  - Let `diceCount` = `stats.movimento`.
  - IF `diceCount` < 1, set `diceCount` to 1.
  - Add `hero.bonusMovementDiceNextRoll` to `diceCount` when that pending bonus is greater than zero (consumable movement dice).
  - Roll `diceCount` d6.
  - Set `movementPoints` to the result of the roll.
  - IF a movement bonus was consumed:
    - Call `sessionManager.clearBonusMovementDiceForHero(hero.heroId)` and optionally notify the player.

#### handleBoardHover

- **Contract**: Calculates path preview when mouse hovers a cell.
- **Signature**: `(x: Integer, y: Integer)`
- **Flow**:
  - IF `movementPoints` is null OR `movementPoints` <= 0 OR `isMoving` is true:
    - Set `hoveredPath` to empty.
    - Set `hoveredPathVariant` to null.
    - RETURN.
  - Find current hero in `gameSession.heroes` where `turnOrder` == `gameSession.currentTurn`.
  - IF current hero is null OR `currentHero.currentBody` <= 0 OR `currentHero.isEscaped` is true:
    - Set `hoveredPath` to empty.
    - Set `hoveredPathVariant` to null.
    - RETURN.
  - Call `hooksPathfinding.calculatePath(hero.x, hero.y, x, y, movementPoints, hero.heroId)` and store result in `path`.
  - IF `path` is not empty:
    - Prepend `{x: hero.x, y: hero.y}` to `path` (to include start).
    - Set `hoveredPath` to `path`.
    - Count true wall crossings in the preview path:
      - A true wall crossing is a step where `oldVis.valo != newVis.valo` and the step is NOT a door or discovered passage transition.
    - IF `hero.activeStatus` contains `WallPass` AND true wall crossings > 1:
      - Set `hoveredPathVariant` to `blocked-by-second-wall`.
    - ELSE:
      - Set `hoveredPathVariant` to `valid`.
  - ELSE: Set `hoveredPath` to empty.
    - Set `hoveredPathVariant` to null.

#### handleBoardClick

- **Contract**: Executes movement along the calculated path.
- **Signature**: `(x: Integer, y: Integer)`
- **Flow**:
  - IF `isMoving` is true OR `movementPoints` <= 0 RETURN.
  - Set `isMovingStarted` to true.
  - Find `currentHero` in `gameSession.heroes` where `turnOrder` == `gameSession.currentTurn`.
  - IF `currentHero` is null OR `currentHero.currentBody` <= 0 OR `currentHero.isEscaped` is true RETURN.
  - Initialize `path` with `hoveredPath`.
  - Initialize `pathVariant` with `hoveredPathVariant`.
  - **Robustness Check**: IF `path` is empty OR last point of `path` is NOT (x, y):
    - Calculate path from `currentHero` to (x, y) using `hooksPathfinding`.
    - IF calculated path is valid (length > 0):
      - Set `path` to [`currentHero` position, ...calculated path].
  - IF `path` length > 1 AND last point of `path` is (x, y):
    - IF `pathVariant` == `blocked-by-second-wall`:
      - Trigger `onNotify("Passapareti permette di attraversare un solo muro.")`.
      - Set `canOpenDoor` to `mapInteractionLogic.isFrontOfDoor(currentHero.x, currentHero.y, null)`.
      - RETURN.
    - Set `canOpenDoor` to null.
    - Set `isMoving` to true.
    - Set `activePath` to a copy of `path`.
    - Set `hoveredPath` to empty.
    - Set `hoveredPathVariant` to null.
  - ELSE:
    - // Restore/re-check door interaction if movement didn't happen
    - Set `canOpenDoor` to `mapInteractionLogic.isFrontOfDoor(currentHero.x, currentHero.y, null)`.

#### movementEffect

- **Contract**: Handles the step-by-step movement animation and logic.
- **Trigger**: `activePath` changes.
- **Flow**:
  - IF `activePath` length < 2 Finished moving to destination:
    - IF `isMoving` is true:
      - Set `isMoving` to false.
      - Set `activePath` to empty.
    - **Exit Check**:
      - Call `attemptExitFromCurrentCell()`.
      - IF it returns true RETURN.
    - **Update Final Interactive State**:
      - Let `hero` = find current hero.
      - Set `canOpenDoor` to `mapInteractionLogic.isFrontOfDoor(hero.x, hero.y, null)`.
    - IF `movementPoints` <= 0 No movement left, mark action as done:
      - Set `turnPhase.hasMoved` to true.
    - RETURN.
  - ELSE (`activePath` length >= 2):
    - Wait 300ms.
    - Let `nextPos` = `activePath[1]` and `oldPos` = current hero coordinates.
    - Decrement movement points and clear manual door state for this step.
    - Resolve automatic door opening when crossing area boundaries (`valo`) and consume `WallPass` when required.
    - Resolve trap checks for `nextPos`; if a trap interrupts movement: apply `resolveMovementTrap`, register the trap, call `forceTurnExhausted` at the trap cell (movement points MUST become 0 and remaining turn actions consumed), then `endTurn(true)` so the hero passes immediately.
    - Persist hero movement through `sessionManager.moveCurrentHeroTo(nextPos.x, nextPos.y, gameSession)`.
    - Execute movement scripts (`eventType = 1`) and room-entry scripts (`eventType = 8`) when room changes.
    - Apply script outcomes (`movementDelta`, `stopMovement`, `forceFinishTurn`) deterministically.
    - Consume current path step only when movement was not interrupted.
    - Refresh `canOpenDoor` from the final hero position.

#### attemptExitFromCurrentCell

- **Contract**: Resolves stairs exit for the active hero, including mission-complete escape and confirmed retreat.
- **Signature**: `() -> Boolean`
- **Flow**:
  - Find the current hero from `gameSession.heroes` using `currentTurn`.
  - Find `mapCell` at the current hero coordinates.
  - IF the current cell is not a stairs cell (`fine` is empty or zero) RETURN false.
  - Let `missionObjectiveCompleted` = `checkMissionObjective()`.
  - IF `missionObjectiveCompleted` is false:
    - Open a confirmation dialog asking whether the player wants to leave through the stairs even without completing the mission.
    - IF the user cancels:
      - Trigger `onNotify("Uscita annullata. Completa la missione o conferma la ritirata dalle scale.")`.
      - RETURN false.
  - Call `sessionManager.markCurrentHeroEscaped()`.
  - Set `turnPhase.IsTurnFinished` to true.
  - IF `missionObjectiveCompleted` is true:
    - Trigger `onNotify(currentHero.hero.classe + " è uscito dal dungeon!")`.
  - ELSE:
    - Trigger `onNotify(currentHero.hero.classe + " si ritira dalle scale.")`.
  - Trigger `endTurn(true)` so the turn advances immediately even if the exit is being resolved during movement cleanup and `isMoving` has not been committed to false yet.
  - RETURN true.

#### forceTurnExhausted

- **Contract**: Consumes the rest of the current hero turn immediately without advancing to the next hero.
- **Signature**: `(positionOverride?: {x: Integer, y: Integer}) -> void`
- **Flow**:
  - Set `movementPoints` to 0.
  - Clear `hoveredPath`, `hoveredPathVariant`, and `activePath`.
  - Set `isMoving` and `isMovingStarted` to false.
  - Set `turnPhase.hasMoved` and `turnPhase.hasPerformedAction` to true.
  - Recompute `canOpenDoor` using `positionOverride` when provided, otherwise the current hero coordinates.

#### handleMonsterClick

- **Contract**: Executes attack action on clicked monster if in range.
- **Signature**: `(monsterId: Integer)`
- **Flow**:
  - Find monster in `@GameSession.monsters` by `monsterId`.
  - Find current hero in `@GameSession.heroes` where `turnOrder` == `@GameSession.currentTurn`.
  - IF `hero.currentBody` <= 0 OR `hero.isEscaped` is true RETURN without attack resolution.
  - **Validate Target**:
    - Let `stats` = `heroStatsLogic.calculateStats(hero)`.
    - Let `dx` = absolute(`hero.x` - `monster.x`).
    - Let `dy` = absolute(`hero.y` - `monster.y`).
    - Let `dist` = `dx` + `dy`.
    - Initialize `isValidTarget` to false.
    - IF `dist` <= 1:
      - Let `heroCellVis` = visibility cell at (`hero.x`, `hero.y`), `monsterCellVis` = visibility cell at (`monster.x`, `monster.y`).
      - IF `heroCellVis.valo` == `monsterCellVis.valo`: Set `isValidTarget` to true.
      - ELSE allow melee only when at least one of the two cells is an opened door cell (its coordinate key is present in `gameSession.openedDoors`).
    - ELSE IF `dx` == 1 AND `dy` == 1 AND `stats.canAttackDiagonal` is true:
      - IF `visibilityCalc` is null: treat target as invalid and RETURN without attack resolution.
      - IF `visibilityCalc.hasLineOfSight(hero.x, hero.y, monster.x, monster.y)` is true: Set `isValidTarget` to true.
    - ELSE IF `stats.canAttackRanged` is true:
      - IF `visibilityCalc` is null: treat target as invalid and RETURN without attack resolution.
      - IF `visibilityCalc.hasLineOfSight(hero.x, hero.y, monster.x, monster.y)` is true: Set `isValidTarget` to true.

  - IF monster is found AND hero is found AND `isValidTarget` is true AND `isMoving` is false AND `turnPhase.hasPerformedAction` is false:
    - Call `sessionManager.executeMissionScripts({ baseSession: gameSession, eventType: 2, context: { monsterTypeId: monster.monster.id, onDeath: false }, visibilityMap })` before rolling combat dice.
    - Let `attackBaseSession` = the script result session when scripts were handled, otherwise `gameSession`.
    - IF the script runtime returns `attackBlocked` true RETURN without consuming the hero action.
    - Let `attackDice` = `heroStatsLogic.calculateAttackDice(hero, monster.monster)`.
    - Let `defenseDice` = `monster.monster.difesa`.
    - **Special Ability: Gargoyle Defense**:
      - IF `monster.monster.nome` == "Gargoyle":
        - Add 2 to `defenseDice`.
        - Trigger `onNotify("Il Gargoyle ha una difesa di pietra! (+2 dadi)")`.
    - IF `monster.activeStatus` contains "Tempest":
      - Set `defenseDice` to 0.
      - Trigger `onNotify(monster.monster.nome + " è travolto dalla tempesta e non può difendersi!")`.

    - Call `combatLogic.resolveCombat(attackDice, defenseDice, false)` to get `combatResult`.
    - Calculate `newBody` = `monster.currentBody` - `combatResult.damageDealt`.
    - Initialize `statusesToRemove` as an empty list.
    - IF `monster.activeStatus` contains "Sleep" AND `newBody` > 0:
      - Add "Sleep" to `statusesToRemove`.
      - Trigger `onNotify(monster.monster.nome + " si è svegliato!")`.
    - IF `monster.activeStatus` contains "Tempest":
      - Add "Tempest" to `statusesToRemove`.
    - Increment `attacksPerformed`.
    - Let `canDouble` = `heroStatsLogic.canAttackTwice(hero, monster.monster)`.
    - Let `quota` = `hero.bonusMeleeAttackQuota` (consumable extra attacks).
    - Let `attackCap` = the greater of `(canDouble ? 2 : 1)` and `quota` when `quota` > 0, otherwise `(canDouble ? 2 : 1)`.
    - IF `attacksPerformed` < `attackCap`:
      - Notify for consumable extra attacks or double-attack equipment as appropriate; do not set `hasPerformedAction` yet.
    - ELSE:
      - Set `turnPhase.hasPerformedAction` to true.
      - IF `quota` > 0:
        - Call `sessionManager.clearBonusMeleeAttackQuotaForHero(hero.heroId)`.
    - IF the Hero has started to move before attack set `turnPhase.hasMoved` as true.
    - Set `lastAttack` on session to {hero:@HeroState,monster:@MonsterState,combatResult: @CombatResult} for potential UI display.
    - // Re-calculate door interaction (Attack doesn't prevent opening doors)
    - Set `canOpenDoor` to `mapInteractionLogic.isFrontOfDoor(hero.x, hero.y, null)`.
    - **Handle Weapon Consumption**:
      - Determine if it is a ranged attack: `dist` > 1 OR (`dx` == 1 AND `dy` == 1 AND `stats.canAttackDiagonal` is false).
      - IF it is a ranged attack:
        - Request `consumedId` from `heroStatsLogic.getConsumableWeaponId(hero)`.
        - IF `consumedId` is NOT null:
          - Trigger `onNotify("Hai lanciato l'arma e l'hai persa!")`.
    - Call `sessionManager.resolveHeroAttack(monsterId, combatResult, statusesToRemove, consumedId, attackBaseSession)`.
    - Build `afterAttackSession` from the same `attackBaseSession` plus the resolved combat result.
    - IF the target monster was killed:
      - Call `sessionManager.executeMissionScripts({ baseSession: afterAttackSession, eventType: 2, context: { monsterTypeId: monster.monster.id, onDeath: true }, visibilityMap })`.
    - `onDeath` scripts MUST use `afterAttackSession` as `baseSession`, and MUST NOT use the pre-resolution `attackBaseSession`.

#### handleOpenDoor

- **Contract**: Manually opens a door when adjacent.
  - IF `canOpenDoor` is NOT null:
    - Call `mapInteractionLogic.openPassage(canOpenDoor.passageCell.x, canOpenDoor.passageCell.y, canOpenDoor.destination.x, canOpenDoor.destination.y)`.
    - Let `hero` = find current hero.
    - Set `canOpenDoor` to `mapInteractionLogic.isFrontOfDoor(hero.x, hero.y, null)`.

#### markActionDone

- **Contract**: Manually marks the turn action as completed (e.g., after searching).
- **Signature**: `()`
- **Flow**:
  - Set `turnPhase.hasPerformedAction` true.
  - if `isMovingStarted` is true set `turnPhase.hasMoved` as true.
  - Let `hero` = find current hero.
  - Set `canOpenDoor` to `mapInteractionLogic.isFrontOfDoor(hero.x, hero.y, null)`.

#### endTurn

- **Contract**: Passes turn to the next hero.
- **Trigger**: User clicks "End Turn".
- **Flow**:
  - IF `isMoving` is true RETURN.
  - Find current hero in `gameSession.heroes` where `turnOrder` == `gameSession.currentTurn`.
  - IF `currentHero` is found AND `currentHero.activeStatus` contains "InvisiblePassage":
    - Trigger `onNotify("L'effetto di Passaggio Invisibile svanisce.")`.
  - IF `currentHero` is found AND `currentHero.activeStatus` contains "FoggyMist":
    - Trigger `onNotify("L'effetto di Nebbia Caliginosa svanisce.")`.
  - IF `currentHero` is found AND `currentHero.bonusMeleeAttackQuota` > 0:
    - Call `sessionManager.clearBonusMeleeAttackQuotaForHero(currentHero.heroId)` to expire unused consumable attack quota when the hero ends the turn without using all bonus attacks.

  - **Next Hero Selection**:
    - Let `nextTurn` = `gameSession.currentTurn`.
    - Find the next hero in turn order who has NOT escaped AND is NOT dead (currentBody > 0).
    - IF no such hero exists:
      - // All heroes escaped or died, Dungeon component handles global win/loss.
    - Increment `nextTurn`.
  - // Note: If currentTurn > heroes.length, Dungeon component will trigger hooksMonsterAI.runMonsterTurn().
  - Reset all the prop in the object `turnPhase` (@TurnPhase) to false.
  - Reset `movementPoints` to null.
  - Clear `activePath`.
  - Clear `hoveredPath`.
  - Set `hoveredPathVariant` to null.
  - Set `isMoving` to false.
  - Set `isMovingStarted` to false.
  - Set `attacksPerformed` to 0.
  - Let `nextHero` = find hero in `gameSession.heroes` where `turnOrder` == `nextTurn`.
  - IF `nextHero` is found:
    - Set `canOpenDoor` to `mapInteractionLogic.isFrontOfDoor(nextHero.x, nextHero.y, null)`.
  - IF `currentHero` is found AND `currentHero.activeStatus` contains "FoggyMist":
    - Call `sessionManager.advanceTurn(nextTurn, "FoggyMist")`.
    - IF `currentHero.activeStatus` contains "InvisiblePassage":
      - Call `sessionManager.clearCurrentHeroStatus("InvisiblePassage")`.
  - ELSE IF `currentHero` is found AND `currentHero.activeStatus` contains "InvisiblePassage":
    - Call `sessionManager.advanceTurn(nextTurn, "InvisiblePassage")`.
  - ELSE:
    - Call `sessionManager.advanceTurn(nextTurn, null)`.

#### syncTurnTransientStateOnTurnChange

- **Contract**: Guarantees that transient UI turn state is reset whenever the active turn owner changes, even if turn advancement did not originate from `endTurn` (e.g., external/boundary updates, monster phase completion, forced transitions).
- **Trigger**: When `gameSession.currentTurn` OR active hero identity changes.
- **Flow**:
  - Compute `activeTurnKey` from the current active hero identity (`heroId` or `turnOrder`) and `gameSession.currentTurn`.
  - Compare against `previousActiveTurnKey`.
  - IF `activeTurnKey` differs from `previousActiveTurnKey`:
    - Reset `turnPhase` to all false (`HasMoved`, `HasPerformedAction`, `IsTurnFinished`).
    - Reset `movementPoints` to `null`.
    - Reset `attacksPerformed` to `0`.
    - Reset `isMoving` to `false`.
    - Reset `isMovingStarted` to `false`.
    - Clear `activePath`.
    - Clear `hoveredPath`.
    - Set `hoveredPathVariant` to `null`.
    - Recompute `canOpenDoor` from the new active hero position.
    - Store `activeTurnKey` as `previousActiveTurnKey`.
  - ELSE:
    - Keep current transient state unchanged.

- **Return**: `{ turnPhase, movementPoints, hoveredPath, hoveredPathVariant, isMoving, canOpenDoor, handleOpenDoor, rollMovement, handleBoardHover, handleBoardClick, handleMonsterClick, markActionDone, forceTurnExhausted, endTurn }`

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities internalState, checkMissionObjective, updateCanAttack, rollMovement, handleBoardHover MUST avoid undefined side effects outside declared flow and side effects.
- The "Roll Movement" availability MUST be tied to the active hero turn context; stale transient state from a previous turn MUST NOT disable movement for the next hero.
- A hero with `currentBody` <= 0 MUST be treated as dead: cannot roll movement, cannot move, cannot attack, and cannot consume turn actions.
- Hero melee attacks (`dist` <= 1) MUST respect topological adjacency: crossing different `valo` cells is forbidden unless one of the two adjacent cells is an opened door cell.
- Dead or escaped heroes MUST be skipped by turn progression; `currentTurn` MUST advance to the next living, non-escaped hero.
- `InvisiblePassage` MUST expire automatically at the end of the affected hero turn and MUST NOT persist across subsequent turns unless recast.

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
