# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-04-09
**Implementation**: ./dungeon-use-session-manager

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @HeroState, @MonsterState in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @TreasureCard in `./domain-ruleset.isl.md`
> **Reference**: @Equipment in `./domain-ruleset.isl.md`
> **Reference**: @Item in `./domain-ruleset.isl.md`
> **Reference**: @CombatResult in `./dungeon-use-combat.isl.md`
> **Reference**: @useFogOfWar in `./dungeon-use-fog-of-war.isl.md`
> **Reference**: @DungeonScriptResult in `./dungeon-script-runtime.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component centralizes deterministic `@GameSession` mutations owned by the dungeon domain.

## Component: useDungeonSessionManager

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession
- `onUpdateSession`: `(session: @GameSession) -> void` OR `((previousSession: @GameSession) -> @GameSession) -> void`
- `onNotify`: (message: String) -> void
- `fogOfWarLogic`: @useFogOfWar
- `staticEquipment`: List<@Equipment>
- `staticItems`: List<@Item>

### ⚡ Capabilities

#### commitSessionUpdate

- **Contract**: Persists a dungeon session mutation against the latest available session snapshot so sequential asynchronous updates cannot overwrite each other with stale state.
- **Signature**: `(updater: (@GameSession) -> @GameSession) -> Boolean`
- **Flow**:
  - IF `onUpdateSession` is not available RETURN false.
  - Trigger `onUpdateSession` with a functional updater.
  - The functional updater MUST receive the latest available `previousSession`.
  - Let `baseSession` = `previousSession` when available, otherwise `gameSession`.
  - IF `baseSession` is null RETURN `previousSession` unchanged.
  - RETURN `updater(baseSession)`.
  - RETURN true.

#### initializeMission

- **Contract**: Initializes persistent mission session data that must be owned by the dungeon boundary before interactive gameplay starts.
- **Signature**: `(treasureDeck: List<@TreasureCard>) -> void`
- **Flow**:
  - IF `gameSession` is null OR `gameSession.currentMap` is null RETURN.
  - Create `placedHeroes` by mapping `gameSession.heroes`.
  - FOR EACH `heroState` in `placedHeroes`:
    - Let `defaultEquipped`:
      - IF `heroState.equipped` exists and is not empty, keep it.
      - ELSE initialize it from `heroState.equipment` (owned default gear starts equipped).
    - Find `spawnPoint` in `gameSession.currentMap.eroi_start` where `id` == `heroState.heroId`.
    - IF `spawnPoint` exists:
      - Set `heroState.x` to `spawnPoint.x`.
      - Set `heroState.y` to `spawnPoint.y`.
      - Set `heroState.isEscaped` to false.
      - Set `heroState.equipped` to `defaultEquipped`.
    - ELSE set `heroState.equipped` to `defaultEquipped`.
  - Build an initialized @GameSession preserving all unrelated properties, setting `heroes` to `placedHeroes`, and setting `treasureDeck` to `treasureDeck`.
  - Execute mission start scripts (`eventType = 6`) against that initialized snapshot.
  - Persist the resulting full-session snapshot through `commitSessionUpdate`.
  - Forward every script notification through `onNotify`.
  - Reveal every requested point through `fogOfWarLogic.revealFromPoint`.

#### confirmHeroOrder

- **Contract**: Commits the selected hero turn order inside the session boundary and triggers the initial visibility reveal.
- **Signature**: `(orderedHeroIds: List<Integer>) -> void`
- **Flow**:
  - IF `gameSession` is null OR `gameSession.isHeroOrderConfirmed` is true RETURN.
  - Call `fogOfWarLogic.revealInitialVisibility()`.
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, use the provided latest session snapshot.
  - IF the provided session is null OR `isHeroOrderConfirmed` is true RETURN the provided session unchanged.
  - Create `updatedHeroes` by mapping the provided session `heroes`.
  - For each `hero` in `updatedHeroes`:
    - Let `nextTurnOrder` = position of `hero.heroId` in `orderedHeroIds` + 1.
    - IF `nextTurnOrder` is greater than 0:
      - Set `hero.turnOrder` to `nextTurnOrder`.
  - RETURN a new @GameSession preserving all unrelated properties, setting `heroes` to `updatedHeroes`, and setting `isHeroOrderConfirmed` to true.

#### clearLastAttack

- **Contract**: Clears the last combat result without mutating unrelated session branches.
- **Signature**: `() -> void`
- **Flow**:
  - IF `gameSession` is null OR `gameSession.lastAttack` is null RETURN.
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, IF the provided session is null OR `lastAttack` is null RETURN the provided session unchanged.
  - RETURN a new @GameSession preserving all unrelated properties and setting `lastAttack` to `null`.

#### openPassage

- **Contract**: Opens a valid door or revealed secret passage, reveals the destination area, and persists the door state atomically.
- **Signature**: `(passageX: Integer, passageY: Integer, destinationX: Integer, destinationY: Integer, foundPassages: List<{x: Integer, y: Integer}>) -> Boolean`
- **Flow**:
  - IF `gameSession` is null OR `gameSession.currentMap` is null RETURN false.
  - Let `coordKey` = `passageX + "," + passageY`.
  - Let `isKnownDoor` = `gameSession.currentMap.porte.exists(p => p.x == passageX AND p.y == passageY)`.
  - Let `isKnownPassage` = `foundPassages.exists(p => p.x == passageX AND p.y == passageY)`.
  - IF `isKnownDoor` is false AND `isKnownPassage` is false RETURN false.
  - IF `gameSession.openedDoors` contains `coordKey` RETURN false.
  - TRY:
    - Call `fogOfWarLogic.revealFromPoint(destinationX, destinationY)`.
    - Validate reveal outcome on the live fog map:
      - Let `revealedCell` = cell at (`destinationX`,`destinationY`) in `fogOfWarLogic.fogVisibilityMap.data`.
      - IF `revealedCell` is null OR `revealedCell.fog` is still true:
        - Trigger `onNotify("Impossibile aprire la porta da questa posizione.")`.
        - RETURN false.
    - Call `commitSessionUpdate` with an updater.
    - Inside the updater, IF the provided session is null RETURN the provided session unchanged.
    - Let `existingDoors` = the provided session `openedDoors` or an empty list.
    - IF `existingDoors` already contains `coordKey` RETURN the provided session unchanged.
    - RETURN a new @GameSession preserving all unrelated properties and setting `openedDoors` to `existingDoors` plus `coordKey`.
    - Trigger `onNotify("Porta aperta.")`.
    - RETURN true.
  - CATCH:
    - LOG "Errore durante l'apertura della porta o rivelazione nebbia."
    - RETURN false.

#### toggleEquipItem

- **Contract**: Equips or unequips owned equipment while preserving class restrictions and incompatibility rules inside the session boundary.
- **Signature**: `(heroId: Integer, itemId: Integer, staticEquipment: List<@Equipment>) -> Boolean`
- **Flow**:
  - IF `gameSession` is null OR `gameSession.heroes` is null RETURN false.
  - Find `hero` in `gameSession.heroes` matching `heroId`.
  - Find `item` in `staticEquipment` matching `itemId`.
  - IF `hero` is null RETURN false.
  - IF `item` is null:
    - Trigger `onNotify("Oggetto non trovato.")`.
    - RETURN false.
  - IF `item.solopsg` is true AND `item.solopsgid` is NOT equal to `hero.heroId`:
    - Trigger `onNotify("La tua classe non può equipaggiare questo oggetto.")`.
    - RETURN false.
  - IF `item.nopsg` is true AND `item.nopsgid` is EQUAL to `hero.heroId`:
    - Trigger `onNotify("La tua classe non può equipaggiare questo oggetto.")`.
    - RETURN false.
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, use the provided latest session snapshot.
  - Find `currentHero` in the provided session `heroes` matching `heroId`.
  - IF `currentHero` is null RETURN the provided session unchanged.
  - Create `updatedEquipped` as a copy of `currentHero.equipped`.
  - IF `updatedEquipped` contains `itemId`:
    - Remove `itemId` from `updatedEquipped`.
  - ELSE:
    - IF `item.noogg` > 0:
      - Remove `item.noogg` from `updatedEquipped`.
    - FOR EACH `equippedId` in `updatedEquipped`:
      - Find `equippedItem` in `staticEquipment`.
      - IF `equippedItem.noogg` is EQUAL to `itemId`:
        - Remove `equippedId` from `updatedEquipped`.
        - Trigger `onNotify("Hai rimosso " + equippedItem.nome + " perché incompatibile.")`.
    - Add `itemId` to `updatedEquipped`.
  - Create `updatedHeroes` as a copy of the provided session `heroes`.
  - Replace the matching hero with a new hero state whose `equipped` is `updatedEquipped`.
  - RETURN a new @GameSession preserving all unrelated properties and setting `heroes` to `updatedHeroes`.
  - RETURN true.

#### useItem

- **Contract**: Applies the effects of a consumable item inside the dungeon session boundary and removes exactly one matching inventory instance.
- **Signature**: `(heroId: Integer, itemId: Integer, staticItems: List<@Item>, targetMonsterId: Integer | null) -> Boolean`
- **Flow**:
  - IF `gameSession` is null OR `gameSession.heroes` is null RETURN false.
  - Find `hero` in `gameSession.heroes` matching `heroId`.
  - Find `itemDef` in `staticItems` matching `itemId`.
  - IF `hero` is null OR `itemDef` is null RETURN false.
  - Find the first index of `itemId` in `hero.inventory`.
  - IF item index is less than 0 RETURN false.
  - IF the item has no usable numeric flags (`hp`, `mp`, `difesa`, `attacco`, `movimento`, `natt` all zero) AND `acqua` is false:
    - Trigger `onNotify` explaining the item has no usable in-mission effect.
    - RETURN false without consuming inventory.
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, use the provided latest session snapshot.
  - Find `currentHero` in the provided session `heroes` matching `heroId`.
  - IF `currentHero` is null RETURN the provided session unchanged.
  - Create `currentInventory` as a copy of `currentHero.inventory`.
  - Find the first index of `itemId` in `currentInventory`.
  - IF item index is less than 0 RETURN the provided session unchanged.
  - Create `updatedHero` as a copy of `currentHero`.
  - Create `updatedMonsters` as a copy of the provided session `monsters`.
  - IF `itemDef.hp` is NOT 0:
    - Add `itemDef.hp` to `updatedHero.currentBody`.
    - Clamp `updatedHero.currentBody` to max `updatedHero.hero.corpo`.
  - IF `itemDef.mp` is NOT 0:
    - Add `itemDef.mp` to `updatedHero.currentMind`.
    - Clamp `updatedHero.currentMind` to max `updatedHero.hero.mente`.
  - IF `itemDef.difesa` is NOT 0:
    - Add `itemDef.difesa` to `updatedHero.bonusDefenseDiceNextCombat` (stacking with any prior pending bonus).
  - IF `itemDef.attacco` is NOT 0:
    - Add `itemDef.attacco` to `updatedHero.bonusAttackDiceNextHeroAttack`.
  - IF `itemDef.movimento` is NOT 0:
    - Add `itemDef.movimento` to `updatedHero.bonusMovementDiceNextRoll`.
  - IF `itemDef.natt` is NOT 0:
    - Add `itemDef.natt` to `updatedHero.bonusMeleeAttackQuota`.
  - IF `itemDef.acqua` is true:
    - IF `targetMonsterId` is NOT null:
      - Find `targetMonster` in `updatedMonsters` matching `targetMonsterId`.
      - IF `targetMonster` is found:
        - IF `targetMonster.monster.nonmorto` is true:
          - Let `holyDamage` = the greater of `itemDef.danni` and `targetMonster.currentBody` (lethal to undead even when `danni` is 0 in data).
          - Subtract `holyDamage` from `targetMonster.currentBody`.
          - Trigger `onNotify` that the holy water strikes the undead with lethal force.
          - IF `targetMonster.currentBody` <= 0:
            - Remove `targetMonster` from `updatedMonsters`.
          - ELSE:
            - Replace the matching monster in `updatedMonsters` with the damaged instance.
        - ELSE:
          - Trigger `onNotify("L'Acqua Santa non ha effetto su questa creatura.")`.
      - ELSE:
        - Trigger `onNotify("Hai usato l'Acqua Santa, ma non hai colpito nulla!")`.
    - ELSE:
      - Trigger `onNotify("Hai usato l'Acqua Santa, ma non hai colpito nulla!")`.
  - Remove the first matching `itemId` from `currentInventory` and assign the resulting inventory to `updatedHero.inventory`.
  - Trigger `onNotify` with "Hai usato " + itemDef.nome + "!" and append brief hints for any pending bonuses (`difesa`, `attacco`, `movimento`, `natt`, body/mind heals).
  - Create `updatedHeroes` as a copy of the provided session `heroes`.
  - Replace the matching hero with `updatedHero`.
  - RETURN a new @GameSession preserving all unrelated properties, setting `heroes` to `updatedHeroes`, and setting `monsters` to `updatedMonsters`.
  - RETURN true.

#### collectTreasureAtCell

- **Contract**: Applies a visible map treasure to a specific hero, clears the treasure cell, and persists the resulting session snapshot.
- **Signature**: `(heroId: Integer, treasureX: Integer, treasureY: Integer) -> Boolean`
- **Flow**:
  - IF `onUpdateSession` is null RETURN false.
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, use the provided latest session snapshot, not the outer `gameSession` closure.
  - IF the provided session is null OR `currentMap` is null RETURN the provided session unchanged.
  - Find `hero` in the provided session `heroes` matching `heroId`.
  - Find `mapCell` in the provided session `currentMap.grid` matching `treasureX`, `treasureY`.
  - IF `hero` is null OR `mapCell` is null OR `mapCell.tes` is null RETURN the provided session unchanged.
  - Let updater `treasure` = updater `mapCell.tes`.
  - IF `treasure.mon`, `treasure.ogg`, `treasure.arma`, and `treasure.trp` are all less than or equal to 0 RETURN the provided session unchanged.
  - Create `updatedHero` as a copy of `hero`.
  - Initialize `notificationParts` as an empty list.
  - Let `foundItem` = the entry in `staticItems` whose `id` matches `treasure.ogg`, when `treasure.ogg` is greater than 0.
  - Let `foundWeapon` = the entry in `staticEquipment` whose `id` matches `treasure.arma`, when `treasure.arma` is greater than 0.
  - IF `treasure.mon` > 0:
    - Add `treasure.mon` to `updatedHero.gold`.
    - Add "Hai trovato " + `treasure.mon` + " monete d'oro!" to `notificationParts`.
  - IF `treasure.ogg` > 0:
    - Add `treasure.ogg` to `updatedHero.inventory`.
    - Add "Hai trovato l'oggetto: " + (`foundItem.nome` when available, otherwise "ID " + `treasure.ogg`) + "!" to `notificationParts`.
  - IF `treasure.arma` > 0:
    - Add `treasure.arma` to `updatedHero.equipment`.
    - Add `treasure.arma` to `updatedHero.equipped` only if that weapon must become immediately owned-and-equipped by rule.
    - Add "Hai trovato l'arma: " + (`foundWeapon.nome` when available, otherwise "ID " + `treasure.arma`) + "!" to `notificationParts`.
  - IF `treasure.trp` > 0:
    - Subtract `treasure.trp` from `updatedHero.currentBody`.
    - Add "È una trappola! Subisci " + `treasure.trp` + " danni." to `notificationParts`.
  - Create `updatedHeroes` as a copy of the provided session `heroes`.
  - Replace the matching hero with `updatedHero`.
  - Create `updatedGrid` as a copy of the provided session `currentMap.grid`.
  - Replace the matching map cell with a copy whose `tes` has all numeric values reset to 0.
  - Create `updatedMap` as a copy of the provided session `currentMap`.
  - Set `updatedMap.grid` to `updatedGrid`.
  - IF `notificationParts` is not empty:
    - Trigger `onNotify` with `notificationParts` joined by a newline.
  - RETURN a new @GameSession preserving all unrelated properties, setting `heroes` to `updatedHeroes`, and setting `currentMap` to `updatedMap`.
  - RETURN true once the treasure collection request has been accepted for enqueueing; the method MUST NOT reject the request only because an outer `gameSession` closure is stale if the updater can still resolve the treasure from the latest session snapshot.

#### drawTreasureCard

- **Contract**: Draws the top treasure card and persists the shortened deck atomically.
- **Signature**: `() -> @TreasureCard | null`
- **Flow**:
  - IF outer `gameSession` is null OR outer `gameSession.treasureDeck` is empty RETURN null.
  - Let `drawnCard` = random element of the outer `gameSession.treasureDeck`.
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, IF the provided session is null OR `treasureDeck` is empty RETURN the provided session unchanged.
  - Setting `treasureDeck` to the provided session `treasureDeck` without `drawnCard`.
  - RETURN `drawnCard`.

#### applyTreasureCardEffect

- **Contract**: Applies a drawn treasure card to the current hero and persists any resulting session changes.
- **Signature**: `(heroId: Integer, card: @TreasureCard, onWanderingMonster: (x: Integer, y: Integer) -> void) -> Boolean`
- **Flow**:
  - IF `card` is null OR outer `gameSession` is null OR `onUpdateSession` is null RETURN false.
  - Find `hero` in the outer `gameSession.heroes` matching `heroId`.
  - IF `hero` is null RETURN false.
  - Initialize `wanderingMonsterCoords` as null.
  - Find `hero` in the provided session `heroes` matching `heroId`.
  - IF `hero` is null RETURN the provided session unchanged.
  - Create `updatedHero` as a copy of `hero`.
  - SWITCH `card.azione`:
    - CASE "aggiungi_oro":
      - Add `card.valore` to `updatedHero.gold`.
      - Trigger `onNotify("Hai trovato " + card.valore + " monete d'oro!")`.
    - CASE "aggiungi_oggetto":
      - Add `card.valore` to `updatedHero.inventory`.
      - Let `resolvedItem` = entry in `staticItems` where `id` == `card.valore`, when available.
      - Let `resolvedEquipment` = entry in `staticEquipment` where `id` == `card.valore`, when available.
      - Let `resolvedLabel`:
        - IF `resolvedItem` exists: (`resolvedItem.descrizione` when available, otherwise `resolvedItem.nome`).
        - ELSE IF `resolvedEquipment` exists: (`resolvedEquipment.descrizione` when available, otherwise `resolvedEquipment.nome`).
        - ELSE: "ID " + `card.valore`.
      - Trigger `onNotify("Hai trovato un oggetto: " + resolvedLabel)`.
    - CASE "modifica_hp":
      - Add `card.valore` to `updatedHero.currentBody`.
      - Trigger `onNotify("Punti Corpo modificati!")`.
    - CASE "trappola_e_fine":
      - Add `card.valore` to `updatedHero.currentBody`.
      - Trigger `onNotify("Trappola! Subisci danni.")`.
    - CASE "mostro_errante":
      - Set `wanderingMonsterCoords` to `{ x: updatedHero.x, y: updatedHero.y }`.
      - RETURN the provided session unchanged.
  - Create `updatedHeroes` as a copy of the provided session `heroes`.
  - Replace the matching hero with `updatedHero`.
  - RETURN a new @GameSession preserving all unrelated properties and setting `heroes` to `updatedHeroes`.
  - AFTER `commitSessionUpdate`, IF `wanderingMonsterCoords` is not null:
    - Trigger `onWanderingMonster(wanderingMonsterCoords.x, wanderingMonsterCoords.y)`.
  - RETURN true once the treasure-card request has been accepted for enqueueing.

#### updateMonsterState

- **Contract**: Persists a monster position update and/or removes temporary monster statuses against the latest available session snapshot.
- **Signature**: `(monsterId: Integer, nextX: Integer | null, nextY: Integer | null, statusesToRemove: List<String>) -> Boolean`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, find `monster` in the provided current session matching `id` = `monsterId`.
  - IF `monster` is null RETURN the current session unchanged.
  - IF `nextX` and `nextY` are both NOT null:
    - Search another living monster in the provided current session with different `id` and coordinates exactly matching (`nextX`, `nextY`).
    - IF such monster exists RETURN the current session unchanged.
  - Create `updatedMonster` as a copy of `monster`.
  - IF `nextX` is NOT null: Set `updatedMonster.x` to `nextX`.
  - IF `nextY` is NOT null: Set `updatedMonster.y` to `nextY`.
  - IF `statusesToRemove` is not empty:
    - Remove all entries in `statusesToRemove` from `updatedMonster.activeStatus`.
  - Create `updatedMonsters` as a copy of the current session `monsters`.
  - Replace the matching monster with `updatedMonster`.
  - RETURN a new @GameSession preserving all unrelated properties and setting `monsters` to `updatedMonsters`.

#### resolveMonsterAttack

- **Contract**: Applies monster combat damage to a hero, clears protective statuses when broken, and persists `lastAttack` against the latest available session snapshot.
- **Signature**: `(monsterId: Integer, heroId: Integer, combatResult: @CombatResult) -> Boolean`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, find `monster` in the provided current session matching `id` = `monsterId`.
  - Find `hero` in the provided current session `heroes` matching `heroId`.
  - IF `monster` is null OR `hero` is null RETURN the current session unchanged.
  - Create `updatedHero` as a copy of `hero`.
  - Subtract `combatResult.damageDealt` from `updatedHero.currentBody`.
  - IF `hero.bonusDefenseDiceNextCombat` is greater than 0:
    - Set `updatedHero.bonusDefenseDiceNextCombat` to 0 (consumable defense prep is spent on this attack resolution, even if damage is 0).
  - IF `combatResult.damageDealt` > 0 AND `updatedHero.activeStatus` contains "RockSkin":
    - Remove "RockSkin" from `updatedHero.activeStatus`.
  - Create `updatedHeroes` as a copy of the current session `heroes`.
  - Replace the matching hero with `updatedHero`.
  - RETURN a new @GameSession preserving all unrelated properties, setting `heroes` to `updatedHeroes`, and setting `lastAttack` to {hero: `updatedHero`, monster: `monster`, combatResult: `combatResult`}.

#### startNextHeroRound

- **Contract**: Ends the master phase by resetting the hero round state inside the session snapshot.
- **Contract**: Ends the master phase by resetting the hero round state inside the latest available session snapshot.
- **Signature**: `() -> void`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, create `updatedHeroes` by mapping the current session `heroes`.
  - FOR EACH `hero` in `updatedHeroes`:
    - Set `hero.turnPhase.HasMoved` to false.
    - Set `hero.turnPhase.HasPerformedAction` to false.
    - Set `hero.turnPhase.IsTurnFinished` to false.
  - RETURN a new @GameSession preserving all unrelated properties, setting `currentTurn` to 1, and setting `heroes` to `updatedHeroes`.

#### clearHeroStatusEverywhere

- **Contract**: Removes a status from every hero and persists the update only if at least one hero changed.
- **Contract**: Removes a status from every hero and persists the update only if at least one hero changed, using the latest available session snapshot.
- **Signature**: `(statusName: String) -> Boolean`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, initialize `didChange` as false.
  - Create `updatedHeroes` by mapping the current session `heroes`.
  - FOR EACH `hero` in `updatedHeroes`:
    - IF `hero.activeStatus` contains `statusName`:
      - Remove `statusName` from `hero.activeStatus`.
      - Set `didChange` to true.
  - IF `didChange` is false RETURN the current session unchanged.
  - RETURN a new @GameSession preserving all unrelated properties and setting `heroes` to `updatedHeroes`.

#### executeMissionScripts

- **Contract**: Executes recovered Dungeon mission scripts against a provided session snapshot, persists handled script effects, forwards their notifications, and reveals rooms requested by script commands such as `possta`.
- **Signature**: `({ baseSession?: @GameSession, eventType: Integer, context?: Object, visibilityMap?: @VisibilityMap, random?: () -> Number }) -> @DungeonScriptResult`
- **Flow**:
  - Let `baseSession` = `options.baseSession` when provided, otherwise `gameSession`.
  - IF `baseSession.currentMap.scripts` is empty RETURN a result with `handled` false.
  - Evaluate `@DungeonScriptRuntime.executeDungeonScripts(...)` using `baseSession`, `eventType`, `context`, and `visibilityMap`.
  - IF the runtime result is `handled` true:
    - Persist the returned full-session snapshot through `commitSessionUpdate`.
  - FOR EACH runtime notification:
    - Trigger `onNotify(notification)`.
  - FOR EACH runtime reveal point:
    - Trigger `fogOfWarLogic.revealFromPoint(x, y)`.
  - RETURN the full runtime result to the caller.

#### moveCurrentHeroTo

- **Contract**: Persists the active hero position update without mutating unrelated session branches.
- **Contract**: Persists the active hero position update against the latest available session snapshot without mutating unrelated session branches.
- **Signature**: `(nextX: Integer, nextY: Integer, baseSession?: @GameSession) -> Boolean`
- **Flow**:
  - Call `commitSessionUpdate` with an updater that receives `providedSession` (latest snapshot from the commit pipeline).
  - Let `sourceSession` = `providedSession` when not null, otherwise `baseSession` when provided, otherwise `gameSession`.
  - IF `sourceSession` is null RETURN `providedSession` unchanged (and the outer call yields false when no updater applied).
  - Build a full-session snapshot where only the active hero coordinates become `nextX`, `nextY` (via `moveCurrentHeroInSession` / equivalent).
  - RETURN that snapshot from the updater so sequential commits in the same tick (for example `clearCurrentHeroStatus` followed by this move) cannot restore stale hero fields such as `activeStatus`.
  - RETURN the Boolean from `commitSessionUpdate`.

#### clearCurrentHeroStatus

- **Contract**: Removes a named status from the active hero only and persists the update only if that hero currently has the status.
- **Signature**: `(statusName: String) -> Boolean`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, find `hero` in the current session `heroes` matching `turnOrder` = `currentTurn`.
  - IF `hero` is null RETURN the current session unchanged.
  - IF `hero.activeStatus` does NOT contain `statusName` RETURN the current session unchanged.
  - Create `updatedHero` as a copy of `hero` removing `statusName` from `activeStatus`.
  - Create `updatedHeroes` replacing only the active hero with `updatedHero`.
  - RETURN a new @GameSession preserving all unrelated properties and setting `heroes` to `updatedHeroes`.

#### resolveMovementTrap

- **Contract**: Applies trap consequences to the active hero, optionally blocks a falling-rock cell, and persists the interrupted movement state.
- **Contract**: Applies trap consequences to the active hero, optionally blocks a falling-rock cell, and persists the interrupted movement state against the latest available session snapshot.
- **Signature**: `(nextX: Integer, nextY: Integer, trapType: Integer, rockFallX: Integer | null, rockFallY: Integer | null) -> Boolean`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, IF the current session `currentMap` is null RETURN the current session unchanged.
  - Find `hero` in the current session `heroes` matching `turnOrder` = `currentTurn`.
  - IF `hero` is null RETURN the current session unchanged.
  - Create `updatedHero` as a copy of `hero`.
  - Set `updatedHero.x` to `nextX`.
  - Set `updatedHero.y` to `nextY`.
  - Subtract 1 from `updatedHero.currentBody`.
  - IF `updatedHero.activeStatus` contains "RockSkin":
    - Remove "RockSkin" from `updatedHero.activeStatus`.
  - Create `updatedHeroes` as a copy of the current session `heroes`.
  - Replace the matching hero with `updatedHero`.
  - Create `updatedMap` as a copy of the current session `currentMap`.
  - Create `updatedGrid` as a copy of the current session `currentMap.grid`.
  - IF `trapType` == 3 AND `rockFallX` is NOT null AND `rockFallY` is NOT null:
    - Find the grid cell matching `rockFallX`, `rockFallY`.
    - Replace it with a copy whose `arnt.antroc` is true.
  - Set `updatedMap.grid` to `updatedGrid`.
  - RETURN a new @GameSession preserving all unrelated properties, setting `heroes` to `updatedHeroes`, and setting `currentMap` to `updatedMap`.

#### markCurrentHeroEscaped

- **Contract**: Marks the active hero as escaped and finishes their persisted turn state.
- **Contract**: Marks the active hero as escaped and finishes their persisted turn state against the latest available session snapshot.
- **Signature**: `() -> Boolean`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, find `hero` in the current session `heroes` matching `turnOrder` = `currentTurn`.
  - IF `hero` is null RETURN the current session unchanged.
  - Create `updatedHero` as a copy of `hero`.
  - Set `updatedHero.isEscaped` to true.
  - Set `updatedHero.turnPhase.IsTurnFinished` to true.
  - Create `updatedHeroes` as a copy of the current session `heroes`.
  - Replace the matching hero with `updatedHero`.
  - RETURN a new @GameSession preserving all unrelated properties and setting `heroes` to `updatedHeroes`.

#### resolveHeroAttack

- **Contract**: Applies hero attack results to a target monster, updates `lastAttack`, and removes any consumed thrown weapon.
- **Contract**: Applies hero attack results to a target monster, updates `lastAttack`, and removes any consumed thrown weapon against the latest available session snapshot.
- **Signature**: `(monsterId: Integer, combatResult: @CombatResult, statusesToRemove: List<String>, consumedWeaponId: Integer | null, baseSession?: @GameSession) -> Boolean`
- **Flow**:
  - Let `sourceSession` = `baseSession` when provided, otherwise `gameSession`.
  - IF `sourceSession` is null RETURN false.
  - Build a full-session snapshot that:
    - removes `consumedWeaponId` from the active hero when required,
    - subtracts `combatResult.damageDealt` from the targeted monster,
    - removes any `statusesToRemove`,
    - removes the monster entirely when its body points reach 0,
    - refreshes `lastAttack`.
  - Persist that snapshot through `commitSessionUpdate`.
  - RETURN true.

#### advanceTurn

- **Contract**: Persists the next hero turn index and optionally clears one expiring status from the current hero.
- **Contract**: Persists the next hero turn index and optionally clears one expiring status from the current hero against the latest available session snapshot.
- **Signature**: `(nextTurn: Integer, clearStatusName: String | null) -> Boolean`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, find `hero` in the current session `heroes` matching `turnOrder` = `currentTurn`.
  - Create `updatedHeroes` as a copy of the current session `heroes`.
  - IF `hero` is NOT null AND `clearStatusName` is NOT null AND `hero.activeStatus` contains `clearStatusName`:
    - Create `updatedHero` as a copy of `hero`.
    - Remove `clearStatusName` from `updatedHero.activeStatus`.
    - Replace the matching hero with `updatedHero`.
  - RETURN a new @GameSession preserving all unrelated properties, setting `heroes` to `updatedHeroes`, and setting `currentTurn` to `nextTurn`.

### 🚨 Constraints

- All capabilities MUST create a new `@GameSession` snapshot when persisting state; they MUST NOT rely on mutating `gameSession` in place.
- Capabilities that can run during chained or asynchronous dungeon flows MUST persist through `commitSessionUpdate`, so they always compute from the latest available session snapshot rather than a stale closure.
- A capability MUST call `onUpdateSession` only if the requested mutation produces a valid session state transition.
- `openPassage` MUST reveal fog before persisting the opened door coordinate, so failed reveal logic cannot leave the session half-updated.
- `openPassage` MUST emit "Porta aperta." only after destination reveal succeeds and the door-open state is persisted.
- If destination reveal fails or keeps fog unchanged, the operation MUST return false and MUST NOT append the door to `openedDoors`.
- `initializeMission` MUST preserve `currentMap`, `currentMissionIndex`, `monsters`, `openedDoors`, and all other unrelated branches of `@GameSession`.
- `toggleEquipItem` MUST only change the targeted hero `equipped` list; it MUST preserve `equipment`, `inventory`, `gold`, and all unrelated session branches.
- `useItem` MUST remove only one inventory instance per invocation and MUST preserve unrelated heroes, map data, and door state.
- `collectTreasureAtCell`, `resolveMovementTrap`, and `resolveHeroAttack` MUST preserve all unrelated heroes, monsters, map rows, and door state while updating only the affected branches.
- Treasure notifications MUST prefer human-readable labels (`descrizione`/`nome`) resolved from `staticItems`/`staticEquipment`; raw numeric IDs MUST be used only as fallback when no matching definition exists.
- `startNextHeroRound` and `advanceTurn` MUST remain the only persisted turn-index mutations inside the dungeon boundary.

### 🚨 Global Constraints

- MUST preserve component-level determinism across all state transitions and orchestration flows.
- MUST ensure all capability-level mutations respect declared shared state boundaries.
- MUST keep cross-capability outcomes consistent with declared domain references and invariants.

### ✅ Acceptance Criteria

- [ ] Specification is internally consistent (roles, contracts, and constraints do not conflict).
- [ ] Declared capabilities are represented with deterministic behavior.
- [ ] Document is aligned to ISL v1.6.2 conventions.

### 🧪 Test Scenarios

1. **Contract Conformance**:
   - Input: representative valid domain/state inputs
   - Expected: outputs and side effects satisfy declared contracts

2. **Constraint Enforcement**:
   - Input: boundary and invalid inputs
   - Expected: constraints are enforced and violations are handled explicitly

