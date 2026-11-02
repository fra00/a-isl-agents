# Project: Dungeon React

**Version**: 1.0.1
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./main-content

---

> **Reference**: PagePresentation are defined in `./page-presentation.isl.md`.
> **Reference**: @Monster, @Equipment, @Item, @Spell, @TreasureCard in `./domain-ruleset.isl.md`.
> **Reference**: @Campaign in `./domain-map.isl.md`.
> **Reference**: @VisibilityMap in `./domain-map.isl.md`.
> **Reference**: @GameSpellsData in `./domain-spells-data.isl.md`.

## Domain Concepts

- `globalBoardData`: Application-wide visibility map normalized before gameplay starts so fog-of-war logic can rely on explicit boolean `fog` values.
- `full-game backdrop`: A fixed full-viewport background image layer (`/img/background.png`) implemented in `game-theme.jsx` as `GameBackgroundLayer`, rendered as the first child of every `MainContent` branch (loading, error, ready) so it sits behind all pages. Child screens use transparent root backgrounds so this layer remains visible.

## Component: MainContent

Componente fullscreen sarà l'entry point e il contenitore principale dell'applicativo
**signature**:()=>void

### Role: Presentation

### @State

- `isAppReady`: Boolean (Default: false)
- `globalMonsters`: List<@Monster> (Default: [])
- `globalHeroes`: List<@Hero> (Default: [])
- `globalBoardData`: @VisibilityMap (Default: null)
- `globalEquipment`: List<@Equipment> (Default: [])
- `globalItems`: List<@Item> (Default: [])
- `globalSpells`: List<@Spell> (Default: [])
- `globalTreasureDeck`: List<@TreasureCard> (Default: [])
- `globalCampaign`: @Campaign (Default: null)

### 🔍 Appearance

width: full width

- height: `100vh` (minimum)
- fullscreen shell with hidden overflow: a **full-game backdrop** image behind content; outer wrapper is not opaque black
- loading and fatal-error screens stay centered in the viewport
- ready-state content is hosted inside the fixed runtime stage

### 📦 Content

IF `isAppReady` is false:

- visualizza Schermata di caricamento con scritta "Inizializzazione Sistema..."
  ELSE:
- `PagePresentation` passing all `globalAssets` as props.

### ⚡ Capabilities

#### bootstrap

- **Contract**: Loads all required JSON assets before starting the app.
- **Trigger**: On Mount.
- **Flow**:
  - TRY:
    - Fetch in parallel: `/jsonData/monsters.json`, `/jsonData/heroes.json`, `/jsonData/tabellone/default.json`, `/jsonData/equipment.json`, `/jsonData/items.json`, `/jsonData/treasure-card.json`, `/jsonData/campagne.json`.
    - Parse and update `globalMonsters`, `globalHeroes`, `globalEquipment`, `globalItems`, `globalTreasureDeck`, `globalCampaign`.
    - Normalize `boardData` through `@VisibilityMap` before assigning it to `globalBoardData`, so every visibility cell starts with `fog: true` unless explicitly revealed.
    - Initialize `globalSpells` using the static data from `@GameSpellsData.getAllSpells()`.
    - SET `isAppReady` to true.
  - CATCH Error:
    - Display critical error: "Errore durante il caricamento degli asset: " + error.message.

### 🚨 Constraints

- All required startup assets MUST be loaded (or a fatal loading error MUST be surfaced explicitly).
- `isAppReady` MUST become true only after assets and derived state (`globalBoardData`, `globalSpells`) are initialized coherently.
- Asset loading failures MUST NOT produce partially initialized runtime states presented as ready.

### 🚨 Global Constraints

- All rendering branches of `MainContent` MUST be mutually exclusive (`loading` vs `ready`) and deterministic.
- Component-level global assets passed to child presentation layers MUST remain structurally consistent across re-renders.
- MainContent MUST act as application bootstrap/presentation boundary and MUST NOT own gameplay business rules.

### ✅ Acceptance Criteria

- [ ] `bootstrap` enforces its local constraints for both success and failure paths.
- [ ] `MainContent` global constraints remain valid across loading and ready states.
- [ ] Role, references, and state boundary are consistent with Presentation responsibility.

### 🧪 Test Scenarios

1. **Capability Constraint - Successful Bootstrap**:
   - Target: `bootstrap`
   - Input: all required JSON assets available and valid
   - Expected: all global assets initialized coherently, `isAppReady = true`, ready view rendered

2. **Capability Constraint - Fatal Bootstrap Error**:
   - Target: `bootstrap`
   - Input: at least one required asset fetch fails
   - Expected: explicit critical loading error shown, `isAppReady` remains false, no fake-ready state

3. **Global Constraint - Rendering Exclusivity**:
   - Target: `MainContent` as component
   - Input: state transitions `isAppReady false -> true`
   - Expected: loading and ready branches never overlap and child receives a coherent asset bundle
