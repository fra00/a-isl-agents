# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./dungeon-description

---

> **Reference**: PageNavigationEnum in `./domain-core.isl.md`
> **Reference**: GameSession in `./domain-session.isl.md`

## Component: DungeonDescription

### Role: Presentation

## Domain Concepts

### 📦 Content/Structure

#### `BriefingAction`

- **Contract**: Represents the navigation actions available from the mission briefing screen.

- `ENTER`: Starts the dungeon.
- `SHOP`: Opens the armory before the mission.
- `BACK`: Returns to mission selection.

**Signature**:

- `gameSession`: GameSession (Current session state).
- `onChangePageView`: (nextPage: PageNavigationEnum) -> void (Callback to navigate).
- `onUpdateSession`: (session: GameSession) -> void (Callback to update session).

### 🔍 Appearance

- **Layout**: Full-page dark gothic briefing screen visually aligned with the mission selection page.
- **Background**: Use an abstract black-stone gradient field with mist, low-contrast rune haze, and warm bronze highlights. The page background must not depend on figurative or original franchise artwork.
- **Title**: Large fantasy/bronze heading for the mission briefing.
- **Text**: The `description` text from the current map in `@gameSession.currentMap.header.descrizione`, scrollable if long.
- **Actions**: Compact action row near the bottom of the panel.
  - "Entra nel dungeon" (Primary action).
  - "Armeria" (Secondary action).
  - "Indietro" (Tertiary action).
- Scrollbars must use the same dark bronze palette as the surrounding page.
- Horizontal scrolling must never appear.

### 📦 Content

- **Description Text**: Displays `gameSession.currentMap.header.descrizione`.
- **Briefing Header**: Shows a mission title/briefing heading.
- **Buttons**:
  - Enter Button.
  - Shop Button.
  - Back Button.

### ⚡ Capabilities

#### handleInteraction

- **Contract**: Delegates user actions to parent callbacks.
- **Trigger**: User clicks one of the buttons.
- **Flow**:
  - IF "Entra nel dungeon" clicked -> - onChangePageView to @PageNavigationEnum.DUNGEON.
  - IF "Armeria" clicked -> - onChangePageView to @PageNavigationEnum.SHOP.
  - IF "Indietro" clicked -> - onChangePageView to @PageNavigationEnum.PLAY_GAME.

### 🚨 Constraints

- The component must adapt to 100% of the available container height.
- The main component container must not scroll vertically.
- If the mission description is too long, only the briefing text area must scroll vertically within the panel.
- The visual treatment must remain coherent with the dark bronze Dungeon navigation flow.

### 🚨 Global Constraints

- MUST keep component-wide navigation/rendering behavior coherent across all capabilities.
- MUST enforce UI-level consistency, accessibility intent, and deterministic interaction outcomes.
- MUST delegate business/domain decisions to referenced Business Logic or Backend components.

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

