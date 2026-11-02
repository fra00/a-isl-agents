# Project: Dungeon React

Home screen: campaign entry and optional editor plaque.

**Version**: 1.0.2
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./main-menu

---

> **Reference**: Core entities are defined in `./domain-core.isl.md`.

## Domain Concepts

- `menu action plaque`: primary clickable card for one destination of the home screen.
- `active backdrop`: full-screen atmospheric backdrop treatment that changes with the selected action and defaults to the `GIOCA` entry.
- `compact viewport mode`: low-height home variant for heights up to about `720px`; it reduces spacing and card height so title and both main actions remain inside the fixed runtime stage.
- `ultra-compact viewport mode`: very-low-height branch for heights up to about `460px`; it removes non-essential copy, shrinks badges, and forces the main action plaque(s) into a compact action row.
- `editor menu visibility`: product flag (implementation: `SHOW_EDITOR_MENU`). When `false`, the `EDITOR` / `PageNavigationEnum.EDITOR_GAME` plaque and its dedicated active backdrop layer MUST NOT be rendered; only `GIOCA` remains until the flag is set to `true`.

## Component: MainMenu

Main Menu Screen

### Role: Presentation

**Signature**:

- `onChangePageView`: (page: @PageNavigationEnum) -> void

### 🔍 Appearance

- Full width landing screen with dark fantasy styling.
- Height: exactly the viewport height.
- Overflow: hidden. The home screen MUST stay inside the fixed runtime stage and MUST NOT require page scrollbars.
- `ActiveBackdropLayer` (only): light atmospheric gradients crossfading over the **global** full-game background image. MUST NOT use a full-screen opaque or black-to-bottom base layer; gradient stops MUST fade toward **transparent** so `img/background.png` (from `MainContent`) remains visible.
  - Default state uses the `GIOCA` warm ember/campaign tint.
  - When `editor menu visibility` is enabled: hover/focus on `EDITOR` switches the active backdrop to a colder forge/steel tint; when disabled, only the `GIOCA` backdrop layer is present.
- `AtmosphereLayer`: sparse ember particles and warm glow accents. Decorative only; they must not make the screen visually noisy.
- `HeaderPlaque`: compact top block with:
  - eyebrow text `Portale del Regno`
  - main title `Dungeon`
  - one short instruction line
- `ActiveStatePill`: small capsule that shows the currently active area label and short hint.
- `ActionArea`: one or two large menu plaques (see `editor menu visibility`), no secondary long-form text column.
  - `GIOCA` plaque (always)
  - `EDITOR` plaque (only when `editor menu visibility` is enabled)
  - Each plaque shows only: eyebrow, main label, short teaser, short hint, ordinal badge.
  - Long descriptive paragraphs and oversized preview cards MUST NOT be used here.
- Tall viewport layout:
  - two plaques can sit side by side
  - a small optional status plaque may appear to the right
- Compact viewport layout:
  - active when the viewport height falls to about `720px` or below
  - padding, title size, and plaque height compress aggressively
  - `GIOCA` (and `EDITOR` when enabled) remain visible in the first frame together with the title block
- Ultra-compact viewport layout:
  - active when the viewport height falls to about `460px` or below
  - the short instructional line under the title is removed
  - each plaque hides non-essential secondary hint copy and the `Entra` chip
  - the visible menu plaques MUST switch to a compact multi-column action row when more than one plaque exists to reduce total height
  - the active-state pill remains visible, but its spacing and typography compress further

### 📦 Content

- `HeaderPlaque`
  - eyebrow: `Portale del Regno`
  - title: `Dungeon`
  - short line inviting the user to choose a path, omitted in ultra-compact mode
- `ActiveStatePill`
  - shows `Campagna` or `Forgia` (when editor plaque exists)
  - shows a short active hint
- `ActionArea`
  - `GIOCA` `destination` => PageNavigationEnum.PLAY_GAME
    - eyebrow => `Campagna`
    - teaser => compact campaign/dungeon hint
  - `EDITOR` `destination` => PageNavigationEnum.EDITOR_GAME (only when `editor menu visibility` is enabled)
    - eyebrow => `Forgia`
    - teaser => compact tooling hint
- `StatusPlaque` (desktop-only optional)
  - heading => `Scena attiva`
  - shows the active menu label and short hint

### ⚡ Capabilities

#### clickMenuItems

**Contract**:
Handles navigation when the user activates a menu action plaque.

**Trigger**:
Click su voce di menu

**Side Effects**:

- IF `isProcessing` is true: ignore the action.
- IF `destination` is not a valid `PageNavigationEnum` value: ignore the action.
- ELSE:
  - set `isProcessing` = TRUE
  - call `onChangePageView(destination)`
  - keep further actions blocked until navigation state changes or component unmount/reset

#### mouseOverMenuItems

**Contract**:
Updates the active visual state when the user hovers or focuses a menu action plaque.

**Trigger**:
Mouse over or focus voce di menu

**Side Effects**:

- Marks the hovered item as active.
- Updates the active backdrop treatment.
- Updates the active state pill and optional status plaque.

#### clearPreviewState

**Contract**:
Restores the default active visual state when the user leaves a menu action plaque.

**Trigger**:
Mouse leave or blur on menu item.

**Side Effects**:

- Clear hovered state.
- Active backdrop returns to the primary `GIOCA` palette.
- Active state pill returns to the primary `GIOCA` hint.

#### compactViewportResolution

**Contract**:
Switches the menu into compact or ultra-compact mode on short viewports.

**Trigger**:
Initial render and viewport resize.

**Side Effects**:

- IF viewport height <= about `720px`:
  - Reduce spacing and title scale.
  - Reduce plaque height.
- IF viewport height <= about `460px`:
  - Remove the short instructional line below the title.
  - Remove non-essential secondary hint copy inside plaques.
  - Remove the `Entra` chip inside plaques.
  - Switch the action area to a two-column row.
- Keep title and both main menu plaques visible in the fixed stage without scroll.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities clickMenuItems, mouseOverMenuItems, clearPreviewState, compactViewportResolution MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: clickMenuItems
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
