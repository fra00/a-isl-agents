# Project: Dungeon React

Map editor screen (intentionally deferred MVP).

**Version**: 1.0.1
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./editor-game

---

> **Reference**: PageNavigationEnum in `./domain-core.isl.md`

## Component: EditorGame

Fullscreen placeholder for the future map editor. Navigation may route here when the main-menu editor plaque is enabled; this component MUST NOT mutate maps or sessions until a full editor specification exists.

### Role: Presentation

**Signature**:

- `onChangePageView`: (page: @PageNavigationEnum) -> void

### 🔍 Appearance

- Full-screen dark fantasy panel coherent with MainMenu (stone, bronze, ember accents).
- Centered title and short status copy; no map canvas yet.

### 📦 Content

- Title: `Editor mappe` (or equivalent).
- Status message: editor is not available in this build / coming soon.
- Primary control: `Torna al menu` button.

### ⚡ Capabilities

#### goBack

- **Contract**: Returns to the main menu without changing game data.
- **Trigger**: User clicks `Torna al menu`.
- **Flow**:
  - Call `onChangePageView(@PageNavigationEnum.MAIN_MENU)`.

### 🚨 Constraints

- MUST NOT load, edit, or persist map JSON.
- MUST NOT mutate `@GameSession` or campaign progression.
- `goBack` MUST be the only navigation side effect.

### 🚨 Global Constraints

- MUST keep UI behavior consistent with declared capabilities and triggers.
- MUST NOT embed business/domain decisions that belong to Backend or Business Logic components.
- MUST preserve interaction determinism for equivalent user actions and state.

### ✅ Acceptance Criteria

- [ ] Screen renders a clear deferred-editor state with a working back action.
- [ ] No map/session mutation occurs while visiting this page.
- [ ] Presentation boundary is preserved.

### 🧪 Test Scenarios

1. **Capability Constraint - Back Navigation**:
   - Target: `goBack`
   - Input: user clicks back
   - Expected: navigates to `MAIN_MENU` only

2. **Global Constraint - No Side Effects**:
   - Target: `EditorGame` as component
   - Input: open page, idle, then back
   - Expected: no map files written and no session changes
