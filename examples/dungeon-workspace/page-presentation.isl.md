# Project: Dungeon React

**Version**: 1.0.1
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./page-presentation

---

> **Reference**: PageNavigationEnum in `./domain-core.isl.md`
> **Reference**: GameSession in `./domain-session.isl.md`
> **Reference**: PlayGame in `./play-game.isl.md`
> **Reference**: EditorGame in `./editor-game.isl.md`
> **Reference**: MainMenu in `./main-menu.isl.md`
> **Reference**: Armory in `./armory.isl.md`
> **Reference**: Dungeon in `./dungeon.isl.md`
> **Reference**: DungeonDescription in `./dungeon-description.isl.md`
> **Reference**: @Monster, @Equipment, @Item, @Spell, @TreasureCard in `./domain-ruleset.isl.md`.
> **Reference**: @Campaign in `./domain-map.isl.md`.

## Component: PageContent

Contenitore delle pagine, al suo interno vengono visualizzate le varie `PageView` tramite naviagazione

### Role: Presentation

## Domain Concepts

### 📦 Content/Structure

- This component owns the top-level `gameSession` state and exposes `updateSession` as the single session update entrypoint shared by page-level children.

**Signature**:

- `monsters`: List<@Monster>
- `heroes`: List<@Hero>
- `boardData`: @VisibilityMap
- `equipment`: List<@Equipment>
- `items`: List<@Item>
- `spells`: List<@Spell>
- `treasureDeck`: List<@TreasureCard>
- `campaign`: @Campaign

### 🔍 Appearance

- Outer shell: full width, **transparent** background (the global `MainContent` backdrop image shows through).
- Height: fixed viewport shell (`100vh`).
- Overflow: hidden, because the runtime keeps every page inside the fullscreen stage.
- Content width: full width, constrained to `2/3` on large layouts.

### 📦 Content

- current `PageView`
- `gameSession` state (GameSession object).

### ⚡ Capabilities

#### FirstLoad

**Contract**: Inizializzazione della pagina

**Trigger**:
caricamento della pagina

**Side Effects**:
showPageView se la pagina corrente è vuota visualizza quella di default

#### changePageView

**Contract**: Cambia la `PageView` corrente
**Signature**: `(nextPageView: @PageNavigationEnum) -> void`
**Side Effects**:
Setta in `NavigationStatus` nextPageView la valore passato in input

#### updateSession

- **Contract**: Updates the global game session state, accepting either a complete session snapshot or a functional updater when child flows need to commit against the latest available state.
- **Signature**: `(session: GameSession | ((previousSession: GameSession) -> GameSession)) -> void`
- **Flow**:
  - IF the provided argument is a function:
    - Invoke it with the latest local `gameSession`.
    - Replace local `gameSession` with the returned value.
  - ELSE:
    - Replace local `gameSession` with the provided session.

#### startMission

- **Contract**: Handles the start of a mission.
- **Signature**: `(missionIndex: Integer) -> void`
- **Flow**:
  - Log or handle mission start logic.

#### showPageView

**Contract**: Mostra la `PageView` corrente
**Trigger**:
Quando cambia currentPageView su `NavigationStatus`
**Side Effects**:
Carica il componente PageView visualizzare
**Flow**:

1. SWITCH currentPageView (PageNavigationEnum)
   CASE `MAIN_MENU` Render `@MainMenu` with `onChangePageView` = `changePageView`.
   CASE `PLAY_GAME` Render `@PlayGame` with `onChangePageView` = `changePageView`, `gameSession` = `gameSession`, `onUpdateSession` = `updateSession`, `campaign` = `campaign`, `staticHeroes` = `heroes`, `staticEquipment` = `equipment`.
   CASE `EDITOR_GAME` Render `@EditorGame`.
   CASE `SHOP` Render `@Armory` with `onChangePageView` = `changePageView`, `gameSession` = `gameSession`, `onUpdateSession` = `updateSession`.
   CASE `DUNGEON` Render `@Dungeon` with `onChangePageView` = `changePageView`, `gameSession` = `gameSession`, `onUpdateSession` = `updateSession`, `staticMonsters` = `monsters`, `staticVisibilityMap` = `boardData`, `staticEquipment` = `equipment`, `staticItems` = `items`, `staticSpells` = `spells`, `treasureDeck` = `treasureDeck`.
   CASE `DUNGEON_DESCRIPTION` Render `@DungeonDescription` with `onChangePageView` = `changePageView`, `gameSession` = `gameSession`, `onUpdateSession` = `updateSession`.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities FirstLoad, changePageView, updateSession, startMission, showPageView MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: FirstLoad
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
