# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-spell-cast-modal

---

> **Reference**: @HeroState in `./domain-session.isl.md`
> **Reference**: @Spell in `./domain-ruleset.isl.md`

## Domain Concepts

- `available spell card`: A visual spell entry derived from `hero.availableSpells`, resolved against `allSpells`, and rendered only when the spell definition exists.
- `arcane element accent`: Presentation theme derived from `spell.elemento` so each spell card can visually differentiate fire, water, earth, and air.
- `short viewport overlay`: A constrained-height viewport where the spell-cast dialog may exceed the visible area and must remain reachable through overlay scrolling.

## Component: DungeonSpellCastModal

### Role: Presentation

**Signature**:

- `isOpen`: Boolean (Controls visibility).
- `hero`: @HeroState (The hero whose spells are displayed).
- `allSpells`: List of @Spell (Reference data for spell details).
- `onCastSpell`: (spellId: Integer) -> void (Callback when a spell is selected).
- `onClose`: () -> void (Callback to close the modal).

### 🔍 Appearance

- **Overlay**: Fixed full-screen backdrop (bg-black/85), z-index 65.
- **Dialog**: Large stone-and-bronze fantasy plaque aligned with the rest of the dungeon UI, with serif typography, ornamental corners, and a ceremonial header.
- **Responsive Layout**: The overlay MUST remain vertically scrollable when the dialog height exceeds the viewport.
- **Grid**: Responsive spell grid that collapses to fewer columns on narrow layouts while keeping the full card action reachable.
- **Spell Card**:
  - **Layout**: Vertical stack with image panel on top, badges for element and target, descriptive text, and a bottom action plaque.
  - **Element Theme**: Each card SHOULD apply a color accent derived from `spell.elemento`.
  - **Typography**:
    - **Name**: Bold amber spell title.
    - **Description**: Dedicated readable text block that explains the spell effect.
  - **Target Info**: Compact plaque-like badge indicating the target type (for example `Su se stessi`, `Mostro`, `Personaggio`).

### 📦 Content

- **Header**: Title "Lancia Incantesimo", the hero's class name, optional hero portrait, and a compact count of remaining available spells.
- **Spell Grid**:
  - IF `hero.availableSpells.length` == 0:
    - Display: "Non hai più incantesimi disponibili per questa missione."
  - ELSE:
    - For each `spellId` in `hero.availableSpells`:
      - Let `spell` = Find in `allSpells` where `id` == `spellId`.
      - Guard: IF `spell` is null, skip rendering.
      - **Card Face**:
        - Image: `/img/cinc/` + `spell.immagine`.
        - Name: `spell.nome`.
        - Description: `spell.descrizione`.
        - Target Info: Display text based on `spell.targetType` (e.g., "Bersaglio: Mostro" or "Bersaglio: Personaggio").
        - Action: Button "Lancia" -> Trigger `handleCast(spell.id)`.

### ⚡ Capabilities

#### handleCast

- **Contract**: Forwards the selected spell id to the parent flow when the player activates a spell card.
- **Signature**: `(spellId: Integer)`
- **Flow**:
  - Trigger `onCastSpell(spellId)`.

#### handleClose

- **Contract**: Triggers the close callback.
- **Trigger**: User clicks close or backdrop.
- **Flow**:
  - Trigger `onClose`.

#### resolveSpellCards

- **Contract**: Maps `hero.availableSpells` against `allSpells` and filters out missing spell references before presentation.
- **Flow**:
  - Read `hero.availableSpells` as the list of spell ids to render.
  - Resolve each id against `allSpells`.
  - Skip any unresolved spell definition.

#### maintainScrollableViewportLayout

- **Contract**: Keeps the full spell-cast dialog reachable on short viewports.
- **Flow**:
  - Allow the overlay container to scroll vertically when the dialog exceeds the viewport height.
  - Keep the close action reachable without relying on clipped internal scrolling.
  - Preserve reachable cast buttons for every rendered spell card.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities handleCast, handleClose, resolveSpellCards, maintainScrollableViewportLayout MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: handleCast
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
