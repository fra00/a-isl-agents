# Project: Dungeon React

**Version**: 1.0.1
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./dungeon

---

> **Reference**: @PageNavigationEnum in `./domain-core.isl.md`
> **Reference**: @GameSession, @TurnPhase in `./domain-session.isl.md`
> **Reference**: @MapDefinition, @VisibilityMap, @Campaign in `./domain-map.isl.md`
> **Reference**: @Item, @Equipment in `./domain-ruleset.isl.md`
> **Reference**: @Spell in `./domain-ruleset.isl.md`
> **Reference**: @DungeonBoard in `./dungeon-board.isl.md`
> **Reference**: @DungeonHeroOrder in `./dungeon-hero-order.isl.md`
> **Reference**: @useTurnLogic in `./dungeon-use-turn-logic.isl.md`
> **Reference**: @usePathfinding in `./dungeon-use-pathfinding.isl.md`
> **Reference**: @useCombatLogic in `./dungeon-use-combat.isl.md`
> **Reference**: @useHeroStats in `./dungeon-use-hero-stats.isl.md`
> **Reference**: @useFogOfWar in `./dungeon-use-fog-of-war.isl.md`
> **Reference**: @useDungeonMonsters in `./dungeon-use-monsters.isl.md`
> **Reference**: @CombatResultModal in `./dungeon-combat-result-modal.isl.md`
> **Reference**: @DungeonTurnControls in `./dungeon-turn-controls.isl.md`
> **Reference**: @DungeonHeroInfoPanel in `./dungeon-hero-info-panel.isl.md`
> **Reference**: @useSecretPassages in `./dungeon-use-secret-passages.isl.md`
> **Reference**: @useTreasureSearch in `./dungeon-use-treasure.isl.md`
> **Reference**: @useInventoryLogic in `./dungeon-use-inventory-logic.isl.md`
> **Reference**: @useItemLogic in `./dungeon-use-item-logic.isl.md`
> **Reference**: @useMapInteraction in `./dungeon-use-map-interaction.isl.md`
> **Reference**: @DungeonNotification in `./dungeon-notification.isl.md`
> **Reference**: @TreasureCard in `./domain-ruleset.isl.md`
> **Reference**: @TreasureCardModal in `./dungeon-treasure-card-modal.isl.md`
> **Reference**: @DungeonInventoryModal in `./dungeon-inventory-modal.isl.md`
> **Reference**: @useTraps in `./dungeon-use-traps.isl.md`
> **Reference**: @DungeonGameOver in `./dungeon-game-over.isl.md`
> **Reference**: @DungeonSpellSelectionModal in `./dungeon-spell-selection-modal.isl.md`
> **Reference**: @useMagicLogic in `./dungeon-use-magic.isl.md`
> **Reference**: @DungeonMissionSummary in `./dungeon-mission-summary.isl.md`
> **Reference**: @useCampaignManager in `./dungeon-use-campaign-manager.isl.md`
> **Reference**: @DungeonSpellCastModal in `./dungeon-spell-cast-modal.isl.md`
> **Reference**: @useMonsterAI in `./dungeon-use-monster-ai.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component composes transient dungeon UI state with domain hooks and delegates persistent session writes to the dungeon session boundary.

## Component: Dungeon

### Role: Presentation

**Signature**:

- `gameSession`: @GameSession (Current session state).
- `onChangePageView`: (nextPage: @PageNavigationEnum) -> void (Callback to navigate).
- `onUpdateSession`: (session: @GameSession) -> void (Callback to update session).
- `staticMonsters`: List<@Monster>
- `staticVisibilityMap`: @VisibilityMap
- `staticEquipment`: List<@Equipment>
- `staticItems`: List<@Item>
- `staticSpells`: List<@Spell>
- `treasureDeck`: List<@TreasureCard>

### 🔍 Appearance

- **Layout**: 100% of the screen container.
- **Environment Frame**: The dungeon scene SHOULD sit inside a larger chamber-like screen treatment, with a dark stone backdrop, subtle rune/torch glows at the sides, and an ornate frame around the board so the play area feels embedded in the page instead of floating on a flat background.
- **Board Shell**: `DungeonBoard` SHOULD be wrapped by a decorative outer frame with bronze corners and a small centered plaque label, while preserving the exact board interaction area.
- **Turn Marker**: When hero order is confirmed, the framed board shell SHOULD show a small ornamental turn marker near the bottom center using `gameSession.currentTurn`.

### 📦 Content

- **Hero Order**: Displays `DungeonHeroOrder` IF `isMissionInitialized` is true AND `gameSession.isHeroOrderConfirmed` is false.
  - **Props**:
    - `heroes`: `gameSession.heroes`.
    - `onConfirmOrder`: Trigger `confirmHeroOrder`.

- **Spell Selection**: Displays `DungeonSpellSelectionModal` if `gameSession.isHeroOrderConfirmed` is true AND `isSpellSelectionRequired` is true.
  - **Props**:
    - `heroes`: `gameSession.heroes`.
    - `allSpells`: `staticSpells`.
    - `onConfirmSelection`: Trigger `confirmSpellSelection`.
- **Dungeon Board**: Displays `DungeonBoard` with props:
  - `boardVisibilityMap`: `boardVisibilityMap`.
  - `hoveredPath`: `hooksTurnLogic.hoveredPath`.
  - `hoveredPathVariant`: `hooksTurnLogic.hoveredPathVariant`.
  - `secretPassages`: `hooksSecretPassages.foundPassages`.
  - `treasures`: `hooksTreasure.foundTreasures`.
  - `triggeredTraps`: `hooksTraps.getTriggeredTraps()` filtered to exclude traps whose status is `DISARMED`, so a disarmed trap miniature disappears immediately.
  - `targetingSpell`: `targetingSpell`.
  - `visibilityCalc`: `hooksVisibilityCalc`.
  - `visibilityCalc` MUST be the live `hooksVisibilityCalc` instance and MUST NOT be `null` while the board supports line-of-sight highlights, targeting previews, or tracer rendering.
  - `hoveredPath` MUST be passed together with `hoveredPathVariant`; passing only the variant is invalid because the board highlight is driven by the actual path coordinates.
- **Turn Controls**:
  - Displays `@DungeonTurnControls` IF `gameSession.isHeroOrderConfirmed` is true AND `currentHero` is NOT null AND `currentHero.currentBody` > 0 AND `currentHero.isEscaped` is false (equivalently: `currentHero` is non-null as defined in **internal state**, then `isEscaped` is false).
  - **Props**:
    - `currentHero`: the derived **active** hero (`turnOrder` == `currentTurn` and `currentBody` > 0), NOT a raw lookup by turn only.
    - `currentHeroStats`: `hooksHeroStats.calculateStats(currentHero)`.
    - `movementPoints`: `hooksTurnLogic.movementPoints`.
    - `turnPhase`: `hooksTurnLogic.turnPhase`.
    - `isMoving`: `hooksTurnLogic.isMoving`.
    - `onRollMovement`: `hooksTurnLogic.rollMovement`.
    - `onEndTurn`: `hooksTurnLogic.endTurn`.
    - `onSearchPassages`: `hooksSecretPassages.searchPassages`.
    - `onSearchTreasure`: `hooksTreasure.searchTreasure`.
    - `onSearchTraps`: `hooksTraps.searchTraps`.
    - `canDisarmTrap`: true only when the active hero is adjacent to a revealed active trap (`DETECTED` or `TRIGGERED`) and `hooksHeroStats.calculateStats(currentHero).canDisarmTraps` is true.
    - `onDisarmTrap`: Trigger `handleDisarmTrap`, applying the trap consequence if the disarm attempt fails.
    - `onOpenMagic`: Trigger `openMagicModal`.
    - `isTargeting`: `targetingSpell` is NOT null.
    - `onCancelTargeting`: Trigger `cancelTargeting`.
    - `canOpenDoor`: `hooksTurnLogic.canOpenDoor` is NOT null.
    - `onOpenDoor`: `hooksTurnLogic.handleOpenDoor`.
    - `onOpenInventory`: Trigger `openInventory`.
    - `audioMuted`: dungeon audio mute flag read from LocalStorage key `dungeonAudioMuted` (`true` when muted).
    - `onToggleAudioMuted`: toggles mute and persists to LocalStorage.
    - `onExitMap`: after user confirmation in parent, applies retreat-style mission end (`leaveDungeonAfterRetreat`) and navigates to `PLAY_GAME`.
- **Hero Info Panel**:
  - Displays `@DungeonHeroInfoPanel` IF `gameSession.isHeroOrderConfirmed` is true AND `currentHero` is NOT null AND `currentHero.currentBody` > 0.
  - **Props**:
    - `currentHero`: the derived **active** hero (same rule as **internal state** `currentHero`).
    - `currentHeroStats`: `hooksHeroStats.calculateStats(currentHero)`.
    - `movementPoints`: `hooksTurnLogic.movementPoints`.
- **Combat Result**: Displays `CombatResultModal` if `gameSession.lastAttack` is not null.
  - **Props**:
    - `isOpen`: true.
    - `combatResult`: `gameSession.lastAttack.combatResult`.
    - `attacker`: `gameSession.lastAttack.hero`.
    - `defender`: `gameSession.lastAttack.monster`.
    - `onClose`: Trigger `closeCombatResult`.
- **Notification**: Displays `DungeonNotification` if `notificationMessage` is not null.
  - **Props**:
    - `message`: `notificationMessage`.
    - `onClose`: Trigger `handleCloseNotification`.
- **Treasure Card Modal**: Displays `TreasureCardModal` if `drawnTreasureCard` is not null.
  - **Props**:
    - `isOpen`: true.
    - `card`: `drawnTreasureCard`.
    - `onClose`: Trigger `closeTreasureCardModal`.

- **Inventory Modal**: Displays `DungeonInventoryModal` if `isInventoryOpen` is true.
  - **Props**:
    - `isOpen`: true.
    - `hero`: `currentHero`.
    - `onToggleEquip`: wrapper that calls `hooksInventoryLogic.toggleEquipItem(heroId, itemId, gameSession)`.
    - `onUseItem`: `handleUseItem` (supports both immediate-use items and monster-target items such as Holy Water).
    - `onClose`: Trigger `closeInventory`.

- **Spell Casting Modal**: Displays `DungeonSpellCastModal` if `isSpellCastModalOpen` is true.
  - **Props**:
    - `isOpen`: true.
    - `hero`: `currentHero`.
    - `allSpells`: `staticSpells`.
    - `onCastSpell`: Trigger `handleCastSpell`.
    - `onClose`: Trigger `closeMagicModal`.

- **Mission Summary**: Displays `DungeonMissionSummary` if `isMissionSummaryOpen` is true.
  - **Props**:
    - `isOpen`: true.
    - `heroes`: `gameSession.heroes`.
    - `allEquipment`: `staticEquipment`.
    - `allItems`: `staticItems`.
    - `onClose`: Trigger `completeMission`.

- **Game Over**: Displays `DungeonGameOver` if `isGameOverOpen` is true.
  - **Props**:
    - `isOpen`: true.
    - `onExit`: Trigger `handleGameOverExit`.

### ⚡ Capabilities

#### internal state

- **Contract**: Declares the transient UI state and hook instances required to orchestrate dungeon gameplay without directly owning persistent session mutations.

- `isMissionInitialized`: Boolean (Tracks if hero placement is done. Default false).
- `isInventoryOpen`: Boolean (Tracks if inventory modal is visible. Default false).
- `isSpellSelectionRequired`: Boolean (Tracks if spell selection is needed. Default false).
- `isSpellCastModalOpen`: Boolean (Tracks if the spell casting modal is visible. Default false).
- `isMissionSummaryOpen`: Boolean (Tracks if the victory summary is visible. Default false).
- `isGameOverOpen`: Boolean (Tracks if the defeat screen is visible. Default false).
- `targetingSpell`: @Spell (The spell currently being targeted, null if none).
- `targetingItem`: @Item (The item currently being targeted, null if none).
- `boardVisibilityMap`: current visibility map derived from `hooksFogOfWar`.
- `drawnTreasureCard`: @TreasureCard (The currently displayed treasure card, null if none).
- `notificationMessage`: String (Current message to display to the user, null if none).
- `turnPhaseActionBridge`: Late-bound handles for `markActionDone` and `forceTurnExhausted`. Required because traps/secret-passage (and similar) hooks must call turn-phase updates even though they are composed before `@useTurnLogic` is available. Handles MUST always invoke the **current** turn-logic APIs (no stale bindings).
- `monsterAIBridge`: Late-bound handle to the current `@useMonsterAI` instance. Required because treasure-search wandering-monster flow is composed before monster AI; `handleWanderingMonster` MUST invoke `performInstantAttack` only through this bridge (see **compositionBridges**).
- `currentHero`: Derived `@HeroState | null` — the single hero in `gameSession.heroes` where `turnOrder` equals `gameSession.currentTurn` **and** `currentBody` is greater than 0. If no hero matches (defeated turn holder, etc.), `currentHero` is null. Used for turn controls, hero info panel, inventory spell modal hero prop, and any UI that must not treat a defeated hero as active.
- `hooksFogOfWar`: @useFogOfWar logic for calculating visibility based on hero positions and map data.
- `hooksSessionManager`: @useDungeonSessionManager passing `gameSession`, `onUpdateSession`, `setNotificationMessage`, `hooksFogOfWar`, `staticEquipment`, and `staticItems`.
- `hooksInventoryLogic`: @useInventoryLogic passing `staticEquipment` and `hooksSessionManager`.
- `hooksItemLogic`: @useItemLogic passing `staticItems` and `hooksSessionManager`.
- `hooksCampaignManager`: @useCampaignManager.
- `hooksVisibilityCalc`: @useVisibilityCalc passing `gameSession` and `boardVisibilityMap` (the live fog-adjusted @VisibilityMap from `hooksFogOfWar`, not only `staticVisibilityMap`).
  - MUST be instantiated through `@useVisibilityCalc` and MUST NOT be hardcoded to `null`.
  - MUST be propagated as-is to both `hooksTurnLogic` and `DungeonBoard` as `visibilityCalc`.
- `hooksTraps`: @useTraps passing `gameSession`, `boardVisibilityMap`, `areMonstersVisible`, `setNotificationMessage`, turn-phase actions via `turnPhaseActionBridge`, and `hooksSessionManager`. The board-facing trap markers MUST be read through `getTriggeredTraps()`.
- `hooksMagicLogic`: @useMagicLogic passing `gameSession`, `onUpdateSession`, `setNotificationMessage`, turn-phase `markActionDone` (live turn-logic API), `staticSpells`, `hooksCombatLogic`, `hooksMapInteraction`, `hooksFogOfWar`, and `hooksHeroStats`.
- `hooksMapInteraction`: @useMapInteraction passing `gameSession`, `hooksSecretPassages.getFoundPassages().visiblePassages`, and `hooksSessionManager`.
- `hooksHeroStats`: @useHeroStats passing `staticEquipment`.
- `hooksPathfinding`: @usePathfinding passing `gameSession`, `staticVisibilityMap`, and `hooksSecretPassages.getFoundPassages().visiblePassages`.
- `hooksCombatLogic`: @useCombatLogic.
- `hooksTurnLogic`: @useTurnLogic passing `gameSession`, `boardVisibilityMap`, `setNotificationMessage`, `hooksTraps`, `hooksHeroStats`, `hooksPathfinding`, `hooksCombatLogic`, `hooksMapInteraction`, `hooksVisibilityCalc`, and `hooksSessionManager`.
- `missionObjectiveCompleted`: Boolean derived from `hooksTurnLogic.isMissionObjectiveCompleted`.
- `hooksMonsters`: @useDungeonMonsters passing `gameSession`, `boardVisibilityMap`, `onUpdateSession`, `setNotificationMessage`, and `staticMonsters`.
- `hooksMonsterAI`: @useMonsterAI passing `gameSession`, `boardVisibilityMap`, `setNotificationMessage`, `hooksPathfinding`, `hooksCombatLogic`, `hooksHeroStats`, and `hooksSessionManager`.
- `hooksSecretPassages`: @useSecretPassages passing `gameSession`, `boardVisibilityMap`, `setNotificationMessage`, turn-phase actions via `turnPhaseActionBridge`, and `hooksSessionManager`.
- `hooksTreasure`: @useTreasureSearch passing `gameSession`, `boardVisibilityMap`, `setNotificationMessage`, turn-phase actions via `turnPhaseActionBridge`, `hooksSessionManager`, `handleTreasureCardDrawn`, and `handleWanderingMonster`. It exposes `applyTreasureEffect`.
- `areMonstersVisible`: Boolean (Derived: True if any monster in `gameSession.monsters` is on a cell where `boardVisibilityMap.fog` is false).

#### compositionBridges

- **Contract**: Resolves composition-order dependencies between dungeon hooks without baking framework-specific APIs into the intent.
- **Constraint**: Treasure-search wandering-monster handling MUST reach `@useMonsterAI` only through `monsterAIBridge`, because treasure search is composed before monster AI is available as a stable dependency.
- **Constraint**: Hooks that need turn-phase updates before `@useTurnLogic` exists (`hooksTraps`, `hooksSecretPassages`, and equivalents) MUST receive `turnPhaseActionBridge` handles that always forward to the live turn-logic `markActionDone` / `forceTurnExhausted`.
- **Flow**:
  1. Provide no-op-safe turn-phase bridges first; once `@useTurnLogic` is ready, bridges MUST forward to its current APIs.
  2. Provide a monster-AI bridge before treasure search; once `@useMonsterAI` is ready, the bridge MUST forward to its current instance.
  3. Implementation MAY use the host framework’s late-binding mechanism (e.g. mutable handles) but MUST preserve the observable contracts above.

#### combatSound

- **Contract**: Plays a one-shot sound effect whenever a combat result is resolved, selecting the audio file based on outcome and attack type.
- **Trigger**: When `gameSession.lastAttack` changes to a non-null value containing a `combatResult`.
- **Flow**:
  - Let `hit` = `gameSession.lastAttack.combatResult.damageDealt` > 0.
  - Let `ranged` = `gameSession.lastAttack.isRanged` is true.
  - IF `ranged` AND `hit`: play `/audio/tiro.mp3`.
  - IF `ranged` AND NOT `hit`: play `/audio/tirom.mp3`.
  - IF NOT `ranged` AND `hit`: play `/audio/danno.mp3`.
  - IF NOT `ranged` AND NOT `hit`: play `/audio/parata.mp3`.
  - IF `audioMuted` is true: skip playback (user preference persisted in LocalStorage key `dungeonAudioMuted`).
  - Errors MUST be silently caught (browser autoplay policy).
- **Constraint**: The sound MUST fire exactly once per new `lastAttack` result. It MUST NOT replay when the modal is closed or when unrelated state changes.
- **Constraint**: `isRanged` is set by `resolveHeroAttack` when the attacker's distance is > 1 (ranged weapon used). Monster attacks always have `isRanged = false`.

#### monsterAlertSound

- **Contract**: Plays `/audio/mostri.mp3` once when the first monster becomes visible on the map.
- **Trigger**: When `areMonstersVisible` transitions from `false` to `true`.
- **Flow**:
  - Track the previous value of `areMonstersVisible` using a ref.
  - IF `areMonstersVisible` is `true` AND previous value was `false`: IF NOT `audioMuted`, create a new `Audio` instance for `/audio/mostri.mp3` and call `play()`. Errors MUST be silently caught.
  - Update the ref to the current value of `areMonstersVisible`.
- **Constraint**: The sound MUST fire at most once per false→true transition. It MUST NOT play again for each additional monster that becomes visible in the same or subsequent reveals until `areMonstersVisible` resets to `false` first.

#### backgroundMusic

- **Contract**: Plays `/audio/gioco.mp3` in a continuous loop for the entire dungeon session, honoring user mute preference.
- **Trigger**: On Mount; volume updates when `audioMuted` changes.
- **Flow**:
  - Initialize `audioMuted` from LocalStorage key `dungeonAudioMuted` (`'true'` means muted).
  - Create an `Audio` instance pointing to `/audio/gioco.mp3`.
  - Set `loop` to true and `volume` to 0 if `audioMuted`, otherwise `BACKGROUND_MUSIC_VOLUME` (default 0.25).
  - Call `play()`. Errors MUST be silently caught (browser autoplay policy).
  - When `audioMuted` toggles via turn controls, update `volume` accordingly without restarting the track.
- **Cleanup**: On Unmount, pause the audio and clear its `src` to release the resource.

#### exitMapFromOptions

- **Contract**: Allows voluntary retreat from the dungeon via turn-control options, matching retreat mission end.
- **Trigger**: User confirms in `handleExitMapFromOptions` after choosing "Esci dalla mappa".
- **Flow**:
  - Show browser confirm; IF user cancels, RETURN.
  - ELSE call `leaveDungeonAfterRetreat` (same as all heroes escaped without objective).

#### initializeMission

- **Contract**: Initializes hero positions and map vision once the mission starts.
- **Guard**: IF `isMissionInitialized` is true RETURN.
- **Trigger**: On Mount (after `gameSession` is available).
- **Flow**:
  - Call `hooksSessionManager.initializeMission(treasureDeck)`.
    - The boundary MUST also execute mission start scripts (`eventType = 6`) against the initialized snapshot before gameplay begins.
    - SET `isMissionInitialized` to true.

#### confirmHeroOrder

- **Contract**: Before start show a `DungeonHeroOrder`` when user can select the order turn of Heroes
- **Guard**: IF `gameSession.isHeroOrderConfirmed` is true RETURN.
- **Signature**: `(orderedHeroIds: List<Integer>) -> void`
- **Flow**:
  - Call `hooksSessionManager.confirmHeroOrder(orderedHeroIds)`.
  - **Magic Check**:
    - IF any `hero` in `gameSession.heroes` has `hero.hero.classe.toLowerCase()` matching "mago" or "elfo":
      - Set `isSpellSelectionRequired` to true.

#### confirmSpellSelection

- **Contract**: Updates heroes with selected spells and closes the selection modal.
- **Signature**: `(selection: Map<Integer, List<Integer>>)`
- **Flow**:
  - Create a deep copy of `gameSession.heroes` as `updatedHeroes`.
  - For each `hero` in `updatedHeroes`:
    - IF `selection` has a value for key `hero.heroId`:
      - Set `hero.availableSpells` to `selection.get(hero.heroId)`.
  - Set `isSpellSelectionRequired` to false.
  - Trigger `onUpdateSession` with updated `gameSession` containing `updatedHeroes`.

#### closeCombatResult

- **Contract**: Clears the last attack state to close the combat result modal.
- **Trigger**: `onClose` from `CombatResultModal`.
- **Flow**:
  - Call `hooksSessionManager.clearLastAttack()`.

#### handleTreasureCardDrawn

- **Contract**: Sets the drawn treasure card to display the modal.
- **Signature**: `(card: @TreasureCard)`
- **Flow**:
  - Set `drawnTreasureCard` to `card`.

#### closeTreasureCardModal

- **Contract**: Closes the treasure card modal.
- **Flow**:
  - IF `drawnTreasureCard` is NOT null:
    - Call `hooksTreasure.applyTreasureEffect(drawnTreasureCard)`.
  - Set `drawnTreasureCard` to `null`.

#### notifyMissionObjectiveCompleted

- **Contract**: Surfaces a player-facing notification the first time the mission objective becomes complete during the run (e.g. boss defeated, quest item recovered), without opening the victory summary yet.
- **Trigger**: When `missionObjectiveCompleted` transitions from false to true while the mission is initialized and hero order is confirmed.
- **Flow**:
  - Notify: `"Obiettivo della missione completato! Dirigetevi alle scale per uscire."`
  - MUST NOT open `DungeonMissionSummary` here; summary remains gated by the escape/victory check in `monitorTurn`.

#### monitorTurn

- **Contract**: Monitors turn changes to trigger Master Turn automatically.
- **Trigger**: When `gameSession.currentTurn` changes.
- **Flow**:
  - Let `currentTurnHero` = hero where `turnOrder` equals `gameSession.currentTurn`.
  - IF `currentTurnHero` exists AND (`currentTurnHero.currentBody` <= 0 OR `currentTurnHero.isEscaped` is true):
    - Trigger `hooksTurnLogic.endTurn(true)` to immediately skip unusable turns.
    - RETURN.
  - Let `activeHeroes` = heroes where `currentBody` > 0.
  - **Defeat Check**:
    - IF `activeHeroes` length is 0:
      - Set `isGameOverOpen` to true.
      - RETURN.
  - **Victory Check**:
    - Let `escapedHeroes` = heroes where `isEscaped` is true.
    - IF `activeHeroes` length > 0 AND `activeHeroes` length EQUALS `escapedHeroes` length:
      - IF `missionObjectiveCompleted` is true:
        - Set `isMissionSummaryOpen` to true.
      - ELSE:
        - Trigger `leaveDungeonAfterRetreat()` so the party retreats without unlocking the next mission.
      - RETURN.
  - IF `gameSession.currentTurn` > `gameSession.heroes.length`:
    - Trigger `hooksMonsterAI.runMonsterTurn()`.

#### leaveDungeonAfterRetreat

- **Contract**: Persists hero progress after a voluntary retreat without advancing the campaign unlock index.
- **Flow**:
  - Build `preEndHeroVitalsById` from current `gameSession.heroes` as a map keyed by `heroId` containing `{ currentBody, currentMind }`.
  - Execute mission end scripts (`eventType = 7`) against the current session using retreat context.
  - Let `missionEndSession` = the returned script session when handled, otherwise `gameSession`.
  - Build `heroesToPersist` by mapping `missionEndSession.heroes`:
    - For each hero, IF `preEndHeroVitalsById` contains the same `heroId`:
      - Keep all fields from the mission-end hero snapshot.
      - Override only `currentBody` and `currentMind` with the corresponding values from `preEndHeroVitalsById`.
    - ELSE keep the mission-end hero snapshot unchanged.
  - Load the existing campaign save, when available.
  - Preserve the highest unlocked mission index already saved.
  - Trigger `hooksCampaignManager.saveCampaign(heroesToPersist, preservedMissionIndex)`.
  - Navigate back to @PageNavigationEnum.PLAY_GAME.

#### completeMission

- **Contract**: Saves progress and returns to mission selection.
- **Flow**:
  - Build `preEndHeroVitalsById` from current `gameSession.heroes` as a map keyed by `heroId` containing `{ currentBody, currentMind }`.
  - Execute mission end scripts (`eventType = 7`) against the current session using victory context.
  - Let `missionEndSession` = the returned script session when handled, otherwise `gameSession`.
  - Build `heroesToPersist` by mapping `missionEndSession.heroes`:
    - For each hero, IF `preEndHeroVitalsById` contains the same `heroId`:
      - Keep all fields from the mission-end hero snapshot.
      - Override only `currentBody` and `currentMind` with the corresponding values from `preEndHeroVitalsById`.
    - ELSE keep the mission-end hero snapshot unchanged.
  - Load the existing campaign save, when available.
  - Let `nextMissionIndex` = the greater of the already unlocked mission index and `missionEndSession.currentMissionIndex + 1`.
  - Call `hooksCampaignManager.saveCampaign(heroesToPersist, nextMissionIndex)`.
  - Set `isMissionSummaryOpen` to false.
  - onChangePageView to @PageNavigationEnum.PLAY_GAME.

#### handleGameOverExit

- **Contract**: Handles exit after defeat.
- **Flow**:
  - Set `isGameOverOpen` to false.
  - onChangePageView to @PageNavigationEnum.MAIN_MENU.

#### handleWanderingMonster

- **Contract**: Orchestrates the wandering monster appearance and immediate attack on the drawing hero.
- **Signature**: `(x: Integer, y: Integer)`
- **Flow**:
  - Let `newMonster` = `hooksMonsters.spawnWanderingMonster(x, y)`.
  - IF `newMonster` is null RETURN.
  - Find `hero` in `gameSession.heroes` whose coordinates match `(x, y)`.
  - IF `hero` is null RETURN.
  - Resolve the current monster-AI instance through `monsterAIBridge`.
  - IF the bridge target is available AND exposes `performInstantAttack`: invoke `performInstantAttack(newMonster, hero)` (async fire-and-forget is acceptable).
  - MUST NOT bind directly to a composition-time `hooksMonsterAI` value that may be unavailable; MUST use `monsterAIBridge` per **compositionBridges**.

#### openMagicModal

- **Contract**: Opens the spell casting modal.
- **Flow**:
  - Set `isSpellCastModalOpen` to true.

#### closeMagicModal

- **Contract**: Closes the spell casting modal.
- **Flow**:
  - Set `isSpellCastModalOpen` to false.

#### handleUseItem

- **Contract**: Handles the logic of using an item, checking if it requires targeting.
- **Signature**: `(heroId: Integer, itemId: Integer)`
- **Flow**:
  - Find `item` in `staticItems` matching `itemId`.
  - Let `requiresMonsterTarget` = (`item.targetType` EQUALS "Monster") OR (`item.acqua` is true).
  - IF `requiresMonsterTarget` is true:
    - Set `targetingItem` to `item`.
    - Set `isInventoryOpen` to false.
    - Set `notificationMessage` to "Seleziona un mostro bersaglio per " + `item.nome`.
  - ELSE:
    - Call `hooksItemLogic.useItem(heroId, itemId, gameSession, null)`.

#### handleCastSpell

- **Contract**: Determines if a spell requires targeting or can be cast immediately.
- **Signature**: `(spellId: Integer)`
- **Flow**:
  - Find `spell` in `staticSpells` matching `spellId`.
  - IF `spell.targetType` EQUALS "Self":
    - Find `currentHero` using the same rule as **internal state** `currentHero` (`turnOrder` == `currentTurn` AND `currentBody` > 0).
    - IF `currentHero` is null:
      - Set `notificationMessage` to "Nessun eroe attivo disponibile.".
      - RETURN.
    - Call `hooksMagicLogic.castSpell(spellId, currentHero.heroId, null, null, null)`.
    - Set `isSpellCastModalOpen` to false.
  - ELSE:
    - Set `targetingSpell` to `spell`.
    - Set `isSpellCastModalOpen` to false.
    - IF `spell.effetto` EQUALS "Genio":
      - Set `notificationMessage` to "Il Genio attende: Clicca su un mostro per attaccare (5 dadi) o su una porta per aprirla.".
    - ELSE:
      - Set `notificationMessage` to "Seleziona un bersaglio per " + `spell.nome` + " (Clicca sulla mappa o su un mostro)".

#### handleBoardClick

- **Contract**: Intercepts map clicks for spell targeting or movement.
- **Signature**: `(x: Integer, y: Integer)`
- **Flow**:
  - IF `targetingSpell` is NOT null:
    - Find `currentHero` using the same rule as **internal state** `currentHero` (`turnOrder` == `currentTurn` AND `currentBody` > 0).
    - IF `currentHero` is null:
      - Set `notificationMessage` to "Nessun eroe attivo disponibile.".
      - RETURN.
    - IF `targetingSpell.targetType` EQUALS "Point":
      - Call `hooksMagicLogic.castSpell(targetingSpell.id, null, null, x, y)`.
      - Set `targetingSpell` to `null`.
      - Set `notificationMessage` to `null`.
    - ELSE IF `targetingSpell.targetType` EQUALS "Hero":
      - Find `hero` in `gameSession.heroes` at coordinates `x, y`.
      - IF `hero` is found:
        - Call `hooksMagicLogic.castSpell(targetingSpell.id, hero.heroId, null, x, y)`.
        - Set `targetingSpell` to `null`.
        - Set `notificationMessage` to `null`.
      - ELSE:
        - Set `notificationMessage` to "Devi selezionare un Eroe come bersaglio!".
    - ELSE:
      - Set `notificationMessage` to "Bersaglio non valido per questo incantesimo!".
  - ELSE:
    - Call `hooksTurnLogic.handleBoardClick(x, y)`.

#### handleMonsterClick

- **Contract**: Intercepts monster clicks for spell targeting or physical attack.
- **Signature**: `(monsterId: Integer)`
- **Flow**:
  - IF `targetingItem` is NOT null:
    - Find `currentHero` using the same rule as **internal state** `currentHero` (`turnOrder` == `currentTurn` AND `currentBody` > 0).
    - IF `currentHero` is null:
      - Set `notificationMessage` to "Nessun eroe attivo disponibile.".
      - RETURN.
    - Call `hooksItemLogic.useItem(currentHero.heroId, targetingItem.id, gameSession, monsterId)`.
    - Set `targetingItem` to `null`.
    - Set `notificationMessage` to `null`.
    - RETURN.
  - IF `targetingSpell` is NOT null:
    - Find `currentHero` using the same rule as **internal state** `currentHero` (`turnOrder` == `currentTurn` AND `currentBody` > 0).
    - IF `currentHero` is null:
      - Set `notificationMessage` to "Nessun eroe attivo disponibile.".
      - RETURN.
    - Find `monster` in `gameSession.monsters` by `monsterId`.
    - IF `monster` is null:
      - Set `notificationMessage` to "Mostro bersaglio non valido.".
      - RETURN.
    - IF `targetingSpell.targetType` EQUALS "Monster" OR `targetingSpell.effetto` EQUALS "Genio":
      - Call `hooksMagicLogic.castSpell(targetingSpell.id, null, monsterId, null, null)`.
      - Set `targetingSpell` to `null`.
      - Set `notificationMessage` to `null`.
    - ELSE:
      - Set `notificationMessage` to "Questo incantesimo non può essere lanciato su un mostro!".
  - ELSE:
    - Call `hooksTurnLogic.handleMonsterClick(monsterId)`.

#### cancelTargeting

- **Contract**: Aborts the spell targeting mode.
- **Flow**:
  - Set `targetingSpell` to `null`.
  - Set `notificationMessage` to "Lancio incantesimo annullato.".

#### openInventory

- **Contract**: Opens the inventory modal.
- **Flow**:
  - Set `isInventoryOpen` to true.

#### closeInventory

- **Contract**: Closes the inventory modal.
- **Flow**:
  - Set `isInventoryOpen` to false.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities internal state, initializeMission, confirmHeroOrder, confirmSpellSelection, closeCombatResult MUST remain deterministic for equivalent props/state and user actions.
- Campaign persistence paths (`completeMission`, `leaveDungeonAfterRetreat`) MUST persist the mission-end hero snapshot without restoring `currentBody`/`currentMind` to base hero maxima.
- `backgroundMusic` MUST stop and release the audio resource on unmount. It MUST NOT throw if the browser blocks autoplay.

### 🚨 Global Constraints

- MUST keep UI behavior consistent with declared capabilities and triggers.
- MUST NOT embed business/domain decisions that belong to Backend or Business Logic components.
- MUST preserve interaction determinism for equivalent user actions and state.

### ✅ Acceptance Criteria

- [ ] Capability-level constraints are satisfied for all declared interaction handlers.
- [ ] Component-level global constraints remain valid across capability sequences.
- [ ] Presentation boundary is preserved (no business/domain mutation logic in UI handlers).

### 🧪 Test Scenarios

1. **Capability Constraint - Handler Determinism**:
   - Target: internal state
   - Input: repeated equivalent user actions with same props/state
   - Expected: same observable UI outcome and side effects

2. **Capability Constraint - Invalid Input Guard**:
   - Target: declared interaction handlers
   - Input: null/missing/invalid interaction context
   - Expected: safe handling without runtime crash or undefined behavior

3. **Global Constraint - Cross-Capability Coherence**:
   - Target: component capability sequence
   - Input: realistic interaction flow spanning multiple handlers
   - Expected: consistent rendering semantics and preserved component boundary
