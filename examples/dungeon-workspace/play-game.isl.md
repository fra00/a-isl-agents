# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./play-game

---

> **Reference**: PageNavigationEnum in `./domain-core.isl.md`
> **Reference**: Campaign, Mission in `./domain-map.isl.md`
> **Reference**: MapDefinition in `./domain-map.isl.md`
> **Reference**: Hero in `./domain-ruleset.isl.md`
> **Reference**: Equipment in `./domain-ruleset.isl.md`
> **Reference**: GameSession in `./domain-session.isl.md`
> **Reference**: HeroState in `./domain-session.isl.md`
> **Reference**: DungeonDescription in `./dungeon-description.isl.md`
> **Reference**: @MissionCard in `./mission-card.isl.md`
> **Reference**: @useCampaignManager in `./dungeon-use-campaign-manager.isl.md`

## Component: PlayGame

### Role: Presentation

## Domain Concepts

### 📦 Content/Structure

#### `MissionArchiveStatus`

- **Contract**: Classifies each mission card according to campaign progression for presentation and interaction rules.

Represents the visual progression state of a mission in the selection screen.

- `LOCKED`: Mission not yet available.
- `AVAILABLE`: Current next mission that can be started.
- `COMPLETED`: Mission already completed and replayable.

**Signature**:

- `gameSession`: @GameSession (Current state of the session, nullable).
- `onChangePageView`: (nextPage: @PageNavigationEnum) -> void (Callback to change page).
- `onUpdateSession`: `(session: @GameSession) -> void` OR `((previousSession: @GameSession) -> @GameSession) -> void` (Callback to update the session state).
- `campaign`: @Campaign (Provided by MainContent).
- `staticHeroes`: List<@Hero> (Provided by MainContent).
- `staticEquipment`: List<@Equipment> (Provided by MainContent).

### 🔍 Appearance

- A full-screen gothic mission archive aligned with the main menu visual language.
- Background: use an abstract black-stone gradient field with mist, ember haze, and warm bronze highlights. The page background must not depend on figurative or original franchise artwork.
- Title area: compact bronze/fantasy heading with reduced vertical footprint.
- **State: Mission List**:
  - A left column containing vertically stacked mission cards inside a dark panel.
  - Cards use a stone/parchment gothic treatment with bronze borders and subtle inner glow.
  - Visual distinction between **Completed**, **Available** (Next), and **Locked** missions.
  - Status pills inside the cards must remain horizontally centered and visually stable.
  - Click on a card updates the mission detail panel; hover alone must not change the selected mission.
- **State: Mission Details**:
  - A right panel shows the currently focused mission with title, archive file, status seal, atmospheric copy, and the primary action button.
  - Includes a dark "Back to Menu" button styled coherently with the main menu.
  - When vertical space is insufficient, the page and the detail/list panels must allow scroll instead of overflowing outside the container.
  - Scrollbars must use dark bronze/gothic colors coherent with the page palette.

### 📦 Content

- **Campaign Title**: Displays `nome_campagna` from the loaded JSON.
- **Mission List**: Iterates over `missioni` and renders one `@MissionCard` per entry.
  - **Props per card**:
    - `mission`: the `@Mission` entry.
    - `index`: mission index in `missioni`.
    - `status`: derived `@MissionArchiveStatus` from `index` vs `maxUnlockedMissionIndex` / saved progression (`LOCKED` | `AVAILABLE` | `COMPLETED`).
    - `isFocused`: true when `index` equals `focusedMissionIndex`.
    - `onSelect`: Trigger `focusMission` (card click focuses the detail panel; it MUST NOT start the mission).
- **Focused Mission Panel**:
  - Uses the currently focused mission index.
  - Shows `titolo`, archive `file`, and a status label derived from progression state.
  - Shows atmospheric helper text based on whether the mission is locked, completed, or available.
  - Primary action button starts the focused mission via `selectMission(focusedMissionIndex)` when status is `AVAILABLE` or `COMPLETED`; MUST be disabled for `LOCKED`.
- **Loading State**: Displays IF `campaign` or `staticHeroes` is null.

### ⚡ Capabilities

#### internal State

- **Contract**: Maintains the progression boundary, the currently focused mission, and access to persisted campaign progression.

- `maxUnlockedMissionIndex`: Integer (Highest mission index accessible).
- `focusedMissionIndex`: Integer (Mission currently highlighted in the archive panel).
- `campaignManager`: @useCampaignManager

#### initSession

- **Contract**: Initializes the local state using the provided campaign data.
- **Trigger**: On Component Mount.
- **Flow**:
  - **Campaign Check**:
    - Let `savedData` = `campaignManager.loadCampaign()`.
    - IF `savedData` is NOT null:
      - Set `maxUnlockedMissionIndex` to `savedData.nextMissionIndex`.
    - ELSE (Create Default Campaign):
      - Create `defaultHeroes` list by mapping `staticHeroes` to `HeroState`:
        - `heroId`: `Hero.id`.
        - `hero`: `Hero`.
        - `currentBody`: `Hero.corpo`.
        - `currentMind`: `Hero.mente`.
        - `gold`: 0.
        - `inventory`: [].
        - `availableSpells`: [].
        - `activeStatus`: [].
        - Let `initialEquipment` = List of equipment IDs resolved from `staticEquipment` by **name first**, falling back to the documented default IDs only when the name match is missing:
          - IF `Hero.classe` == "Barbaro": name `"Spada lunga"` (default id `13`).
          - IF `Hero.classe` == "Nano": name `"Ascia"` (default id `2`).
          - IF `Hero.classe` == "Elfo": name `"Daga"` (default id `12`).
          - IF `Hero.classe` == "Mago": name `"Bastone magico"` (default id `4`).
        - `equipment`: `initialEquipment`.
        - `equipped`: `initialEquipment`.
        - Constraint: default numeric IDs MUST stay aligned with `/jsonData/equipment.json`; name match is authoritative when present.
      - Call `campaignManager.saveCampaign(defaultHeroes, 0)`.
      - Set `maxUnlockedMissionIndex` to 0.

#### syncFocusedMission

- **Contract**: Keeps the focused mission index valid when the campaign or unlocked progress changes.
- **Trigger**: When `campaign` or `maxUnlockedMissionIndex` changes.
- **Flow**:
  - Determine mission count from `campaign.missioni`.
  - IF there are no missions THEN do nothing.
  - IF current `focusedMissionIndex` is still within bounds THEN preserve it.
  - ELSE set `focusedMissionIndex` to the highest valid mission index, preferring `maxUnlockedMissionIndex`.

#### selectMission

- **Contract**: Loads the selected mission map, updates the session
- **Signature**: `(index: Integer)`
- **Flow**:
  - Let `savedData` = `campaignManager.loadCampaign()`.
  - Determine `maxAccessibleIndex`:
    - `maxUnlockedMissionIndex` (initialized in `initSession`).
  - IF `index` <= `maxAccessibleIndex` AND `savedData` is NOT null THEN:
    - Let `isReplayOfCompletedMission` = `index` < `savedData.nextMissionIndex`.
    - Build `heroesForMission` from `savedData.heroes`:
      - IF `isReplayOfCompletedMission` is true:
        - Keep each hero snapshot unchanged except:
          - Set `currentBody` to the hero base maximum `hero.hero.corpo`.
          - Set `currentMind` to the hero base maximum `hero.hero.mente`.
      - ELSE:
        - Keep each hero snapshot unchanged (campaign progression must preserve persisted vitals).
    - Identify the mission file from `campaign.missioni[index].file`.
    - Fetch map data from `/jsonData/map/[filename]` (extension is included in the filename).
    - Parse into @MapDefinition.
    - Trigger `onUpdateSession` with a functional updater so the mission bootstrap merges onto the latest available session snapshot.
    - Inside that updater:
      - Start from `previousSession` when available, otherwise outer `gameSession`.
      - Set `campaignName` to `campaign.nome_campagna`.
      - Set `heroes` to `heroesForMission`.
      - Set `currentMap` to the loaded map.
      - Set `currentMissionIndex` to `index`.
      - Reset `monsters`, `openedDoors`, and `spawnedLocations` to empty lists.
      - Set `currentTurn` to 1.
      - Set `isHeroOrderConfirmed` to false.
      - Set `lastAttack` to `null`.
      - Set `treasureDeck` to an empty list so mission initialization owns deck seeding.
    - onChangePageView to @PageNavigationEnum.DUNGEON_DESCRIPTION
  - ELSE:
    - (Optional) Show visual feedback that the mission is locked.

#### focusMission

- **Contract**: Updates the mission detail panel without navigating away.
- **Signature**: `(index: Integer)`
- **Flow**:
  - Set `focusedMissionIndex` to `index`.
  - This capability is triggered by click on a mission card.
  - Selecting a card MUST NOT start the mission immediately; mission start remains on the primary action button in the detail panel.

#### goBack

- **Contract**: Returns to the main menu.
- **Trigger**: User clicks "Back" button.
- **Flow**:
  - onChangePageView to @PageNavigationEnum.MAIN_MENU.

### 🚨 Constraints

- **Progression Rule**: The user MUST NOT be able to start a mission with an index higher than `maxUnlockedMissionIndex`.
- **Default State**: If no `gameSession` exists, the user is treated as a new player (only @Mission 0 is unlocked).
- **Data Source**: Must load campaign structure strictly from `campagne.json`.
- **Replay Rule**: When starting a mission already completed (`index` < saved `nextMissionIndex`), heroes MUST start with `currentBody` and `currentMind` restored to base maxima (`hero.corpo`, `hero.mente`).
- **Progression Vital Rule**: When starting the current progression mission (`index` == saved `nextMissionIndex`), heroes MUST preserve persisted `currentBody`/`currentMind`.
- **Visual Direction**: The page must remain darker and more gothic than the main menu while preserving palette continuity with bronze, ember, shadow, and black-stone tones.
- **Layout Fit Rule**: The component must adapt to 100% of the available container height; content that exceeds available space must scroll vertically.
- **Overflow Rule**: Horizontal scrolling must be prevented at page level and inside mission/detail panels.

### 🚨 Global Constraints

- MUST keep component-wide navigation/rendering behavior coherent across all capabilities.
- MUST enforce UI-level consistency, accessibility intent, and deterministic interaction outcomes.
- MUST delegate business/domain decisions to referenced Business Logic or Backend components.

### ✅ Acceptance Criteria

- [ ] Mission list renders `@MissionCard` entries; card click only focuses (`focusMission`), never starts a mission.
- [ ] Detail-panel primary action alone starts an unlocked/replayable mission via `selectMission`.
- [ ] Progression, replay vitals, and locked-index rules remain enforced.

### 🧪 Test Scenarios

1. **Card Focus vs Start**:
   - Input: click an `AVAILABLE` `@MissionCard`
   - Expected: `focusedMissionIndex` updates; page stays on archive; no map fetch / dungeon navigation

2. **Detail Start**:
   - Input: focused available mission + primary action click
   - Expected: map loaded, session bootstrapped, navigation to `DUNGEON_DESCRIPTION`

3. **Locked Guard**:
   - Input: attempt to start index > `maxUnlockedMissionIndex`
   - Expected: mission does not start

