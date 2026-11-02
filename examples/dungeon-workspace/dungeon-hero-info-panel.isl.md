# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-04-12
**Implementation**: ./dungeon-hero-info-panel

---

> **Reference**: @HeroState in `./domain-session.isl.md`

## Domain Concepts

- `currentHeroStats`: Effective hero stats already resolved by business logic, including equipment bonuses and temporary effects such as `RockSkin` and `Courage`.
- `activeEffects`: The list of current hero status effects from `currentHero.activeStatus`, used to surface temporary spell effects such as `WallPass`, `FoggyMist`, `RockSkin`, and `Courage`.

## Component: DungeonHeroInfoPanel

### Role: Presentation

**Signature**:

- `currentHero`: @HeroState (The hero currently taking the turn).
- `currentHeroStats`: { attacco: Integer, difesa: Integer, movimento: Integer, mente: Integer, corpo: Integer, canAttackDiagonal: Boolean, canAttackRanged: Boolean, canDisarmTraps: Boolean, hasDoubleAttack: Boolean } | null.
- `movementPoints`: Integer | null.

### 🔍 Appearance

- **Type**: Fixed floating status panel.
- **Position**: Initially on the right side of the viewport, occupying the space previously used by the obsolete debug panel, but user-draggable afterward.
- **Styling**: Stone-and-bronze gothic panel visually matched to `DungeonTurnControls`, with ornamental corners, decorative dividers, plaque-like stat cards, and a more ceremonial hero portrait frame.
- **Width**: Around 290-310px.
- **Cursor**: `grab` on header, `grabbing` while dragging.

### 📦 Content

- **Header**:
  - Text: "Scheda Eroe".
  - Behavior: Acts as the drag handle.
  - Decoration: Includes a narrow ornamental divider and a compact subtitle line.
- **Hero Summary**:
  - Display `currentHero.hero.classe` (or "Sconosciuto" if null).
  - Display the hero portrait when available using `img/eroi/` + `currentHero.hero.portrait`.
  - Display `movementPoints` inside a small highlighted movement chip.
- **Stats Section**:
  - Display Gold.
  - Display Health.
  - Display Intelligence.
  - Display Attack using `currentHeroStats.attacco` when available; otherwise fall back to the base hero value.
  - Display Defense using `currentHeroStats.difesa` when available; otherwise fall back to the base hero value.
  - Each stat SHOULD render inside a dedicated plaque card rather than as plain text rows.
- **Active Effects**:
  - Display the active temporary effects from `currentHero.activeStatus`, if any.
  - Effects SHOULD render as distinct status chips; when there are no effects, show a neutral `Nessuno` chip instead of a plain text sentence.

### ⚡ Capabilities

#### renderGuard

- **Contract**: Avoids rendering the panel when no active hero is available.
- **Flow**:
  - IF `currentHero` is null RETURN null.

#### renderPanel

- **Contract**: Renders the floating right-side hero information panel so the left action panel can stay focused on buttons only.
- **Flow**:
  - Build a compact portrait-and-summary header.
  - Render movement and resolved hero statistics in a two-column card grid.
  - Render active effects in a dedicated footer section.

#### initializePosition

- **Contract**: Initializes the panel position from persisted storage when available, otherwise starts near the right edge of the viewport.
- **Trigger**: On mount.
- **Flow**:
  - Read `localStorage['dungeonHeroInfoPanelPosition']`.
  - IF the stored value is valid JSON with numeric `x` and `y`, restore it.
  - Clamp the restored coordinates so the panel remains inside the current viewport.
  - ELSE compute a default position near the right side with a safe top offset.

#### beginDrag

- **Contract**: Starts header-driven drag movement for the hero info panel.
- **Trigger**: Mouse down on the header.
- **Flow**:
  - Set dragging state to true.
  - Store the pointer offset from the current panel origin.

#### persistDragPosition

- **Contract**: Updates panel position while dragging and persists the final coordinates when the drag ends.
- **Trigger**: Global mouse move and mouse up while dragging.
- **Flow**:
  - On mouse move, update `left` and `top` using the stored offset.
  - Clamp the coordinates so the panel cannot be dragged fully off-screen.
  - On mouse up, stop dragging and persist the final coordinates into `localStorage['dungeonHeroInfoPanelPosition']`.

#### handleViewportResize

- **Contract**: Keeps the hero info panel visible when the viewport changes after a saved drag position has been restored.
- **Trigger**: Window resize.
- **Flow**:
  - Clamp the current position against the updated viewport bounds.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities renderGuard, renderPanel, initializePosition, beginDrag, persistDragPosition MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: renderGuard
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
