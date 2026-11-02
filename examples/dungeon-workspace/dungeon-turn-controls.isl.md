# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-turn-controls

---

> **Reference**: @HeroState, @TurnPhase in `./domain-session.isl.md`

## Domain Concepts

- This component is the compact left-side action panel for the active hero turn.

## Component: DungeonTurnControls

### Role: Presentation

**Signature**:

- `currentHero`: @HeroState (The hero currently taking their turn).
- `currentHeroStats`: { attacco: Integer, difesa: Integer, movimento: Integer, mente: Integer, corpo: Integer, canAttackDiagonal: Boolean, canAttackRanged: Boolean, canDisarmTraps: Boolean, hasDoubleAttack: Boolean } | null (Precomputed effective hero stats, including equipment and temporary status effects).
- `movementPoints`: Integer (Current movement points available).
- `turnPhase`: @TurnPhase (info about the current activity of the turn).
- `canOpenDoor`: Boolean (Whether an adjacent door can be opened).
- `isTargeting`: Boolean (Whether a spell targeting mode is active).
- `isMoving`: Boolean (Whether the hero is currently animating movement).
- `onRollMovement`: () -> void (Callback to roll for movement).
- `onEndTurn`: () -> void (Callback to end the turn).
- `onSearchPassages`: () -> void (Callback to search for secret passages).
- `onSearchTreasure`: () -> void (Callback to search for treasure).
- `onSearchTraps`: () -> void (Callback to search for traps).
- `canDisarmTrap`: Boolean (Whether the current hero can currently disarm an adjacent detected trap).
- `onDisarmTrap`: () -> void (Callback to execute the disarm-trap action).
- `onOpenMagic`: () -> void (Callback to open magic selection).
- `onOpenInventory`: () -> void (Callback to open inventory modal).
- `onCancelTargeting`: () -> void (Callback to cancel spell targeting).
- `onOpenDoor`: () -> void (Callback to open an adjacent door).
- `audioMuted`: Boolean (Whether dungeon audio is muted; persisted by parent).
- `onToggleAudioMuted`: () -> void (Callback to toggle mute and persist preference).
- `onExitMap`: () -> void (Callback to leave the dungeon / mission from the options menu).

### 🔍 Appearance

- **Type**: Draggable Floating Dialog.
- **Position**: Fixed.
- **Styling**: Stone-and-bronze gothic panel aligned with the Armory and mission pages, with serif typography, amber dividers, a dark translucent body, small ornamental corner marks, and embossed plaque-like sections.
- **Width**: Compact floating panel around 235-250px.
- **Cursor**: `grab` on header, `grabbing` while dragging.
- **Action Layout**: The primary danger action `Fine Turno` must appear first in the action stack and remain visually anchored before all expandable feature buttons, so adding future actions does not move it downward.

### 📦 Content

- **Header**:
  - Text: "Controlli Turno".
  - Behavior: Acts as the drag handle.
  - Decoration: Includes a narrow ornamental divider and a compact subtitle line for the round actions.
- **Inventory Section**
  - Includes a small section divider label.
  - **Inventory button**
    - Style: Neutral stone utility plaque with bevel and subtle inset highlight.
    - OnClick: Trigger `onOpenInventory`.
- **Options Section** (between Inventory and Actions):
  - Section label: "Opzioni".
  - **Menu opzioni** button toggles visibility of an inner panel.
  - When expanded, the panel contains:
    - **Audio** toggle: shows "Audio: Attivo" or "Audio: Spento" according to `audioMuted`; OnClick triggers `onToggleAudioMuted`.
    - **Esci dalla mappa**: OnClick closes the options panel then triggers `onExitMap` (confirm/retreat logic is owned by parent).
- **Action Buttons**:
  - The actions block SHOULD begin with a small decorative section label.
  - **End Turn**:
    - Position: First action in the stack.
    - Style: Red danger plaque with stronger visual emphasis than the other actions.
    - Disabled IF `isMoving` is true.
    - OnClick: Trigger `onEndTurn`.
  - **Roll Movement**:
    - Disabled IF `turnPhase.HasMoved` is true OR `movementPoints` is NOT null.
    - Style: Bronze primary plaque.
    - OnClick: Trigger `onRollMovement`.
    - MUST be enabled at the beginning of each new active hero turn when `turnPhase.HasMoved` is false AND `movementPoints` is null.
  - **Search Passages**:
    - Disabled IF `turnPhase.HasPerformedAction` is true.
    - Style: Amber exploration plaque.
    - OnClick: Trigger `onSearchPassages`.
  - **Search Treasure**:
    - Disabled IF `turnPhase.HasPerformedAction` is true.
    - Style: Amber exploration plaque.
    - OnClick: Trigger `onSearchTreasure`.
  - **Search Trap**:
    - Disabled IF `turnPhase.HasPerformedAction` is true.
    - Style: Amber exploration plaque.
    - OnClick: Trigger `onSearchTraps`.
  - **Disarm Trap**:
    - Visible IF `canDisarmTrap` is true.
    - Disabled IF `turnPhase.HasPerformedAction` is true OR `isMoving` is true OR `isTargeting` is true.
    - Style: Orange utility plaque.
    - OnClick: Trigger `onDisarmTrap`.
  - **Magic**:
    - Visible IF `currentHero.hero.classe.toLowerCase()` IN ["mago", "elfo"].
    - Disabled IF `turnPhase.HasPerformedAction` is true OR `isMoving` is true OR `isTargeting` is true.
    - Style: Indigo accent plaque.
    - OnClick: Trigger `onOpenMagic`.
  - **Cancel Targeting**:
    - Visible IF `isTargeting` is true.
    - Style: Neutral secondary plaque.
    - OnClick: Trigger `onCancelTargeting`.
  - **Open Door**:
    - Visible IF `canOpenDoor` is NOT null AND `canOpenDoor.found` is true.
    - Style: Green success plaque.
    - OnClick: Trigger `onOpenDoor`.

### ⚡ Capabilities

#### internalState

- **Contract**: Stores the floating panel position used by the drag interaction lifecycle.
- `position`: {x: Integer, y: Integer} (Tracks the top-left coordinates of the dialog).
- `optionsOpen`: Boolean (Whether the options submenu is expanded).

#### initialize

- **Contract**: Loads the last known position from storage on mount.
- **Flow**:
  - Read string from LocalStorage key "dungeonTurnControlsPosition".
  - IF valid JSON, parse into `position`.
  - Clamp the restored coordinates so the panel remains inside the current viewport.
  - ELSE set `position` to default `{ x: 20, y: 20 }`.

#### handleDragInteraction

- **Contract**: Manages the drag-and-drop lifecycle.
- **Flow**:
  - **On Mouse Down** (Header):
    - Set internal dragging flag to true.
    - Calculate offset between mouse pointer and dialog top-left.
    - Add global event listeners for `mousemove` and `mouseup`.
  - **On Mouse Move** (Window):
    - IF dragging:
      - Calculate new `position` = mouse coordinates - offset.
      - Clamp the position so the panel cannot be dragged fully off-screen.
      - Update `position` state.
  - **On Mouse Up** (Window):
    - Set internal dragging flag to false.
    - Remove global event listeners.
    - Save current `position` to LocalStorage key "dungeonTurnControlsPosition".

- **On Unmount**: Remove all global event listeners for `mousemove` and `mouseup`.

#### handleViewportResize

- **Contract**: Keeps the panel visible when the viewport becomes smaller than the stored panel position.
- **Flow**:
  - On window resize, clamp the current `position` against the updated viewport bounds.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities internalState, initialize, handleDragInteraction, handleViewportResize MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: internalState
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
