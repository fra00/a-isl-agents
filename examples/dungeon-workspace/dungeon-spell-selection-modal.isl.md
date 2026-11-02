# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-spell-selection-modal

---

> **Reference**: @Spell in `./domain-ruleset.isl.md`
> **Reference**: @HeroState in `./domain-session.isl.md`

## Domain Concepts

- `spell selection flow`: Pre-turn overlay that assigns three spell schools to the Wizard, or one school to the Elf when no Wizard is present.
- `short viewport overlay`: A constrained-height viewport where the full spell-selection modal may exceed the visible area and must remain reachable through vertical scrolling.

## Component: DungeonSpellSelectionModal

### Role: Presentation

**Signature**:

- `heroes`: List of @HeroState (The heroes in the mission).
- `allSpells`: List of @Spell (The full list of 12 spells).
- `onConfirmSelection`: (selection: Map<heroId, List<spellId>>) -> void

### 🔍 Appearance

- **Overlay**: Fixed full-screen backdrop (bg-black/90), z-index 70.
- **Layout**: Centered spell-selection plaque on large screens; on short viewports the full-screen overlay MUST scroll vertically so the entire modal remains reachable.
- **Grid**: Two columns on narrow layouts, four columns on wider layouts, with centered cards and reduced spacing on compact screens.
- **Card Backs**: Large images of element backs (`/img/cinc/Fuoco00_Dorso.png`, etc.).
- **Compact Responsiveness**: Spell cards and labels SHOULD scale down on smaller viewports so the player can still see and select the full set without clipping.

### 📦 Content

- **Title**: "Selezione Incantesimi".
- **Instruction**: Displays whose turn it is to pick (Wizard first, then Elf).
- **Element Grid**:
  - Shows the 4 element backs (Source: `/img/cinc/` + `[Element]00_Dorso.png`).
  - Elements already picked are greyed out or hidden.
  - Each element card SHOULD remain fully clickable across the whole card area.

### ⚡ Capabilities

#### internalState

- **Contract**: Tracks which elemental schools are already taken and which magical hero is currently allowed to pick.

- `pickedElements`: List of String ("Fuoco", "Acqua", etc.).
- `currentHeroPicking`: @HeroState (Wizard or Elf).

#### initialize

- **Contract**: Resolves the active magical hero for the current mission setup and resets any previous picks.

- Identify hero in `heroes` where `hero.hero.classe.toLowerCase()` == "mago".
- IF Wizard is found:
  - Set `currentHeroPicking` to Wizard.
- ELSE:
  - Identify hero in `heroes` where `hero.hero.classe.toLowerCase()` == "elfo".
  - IF Elf is found:
    - Set `currentHeroPicking` to Elf.
  - ELSE:
    - Set `currentHeroPicking` to null.
- Set `pickedElements` to empty.

#### selectElement

- **Contract**: Assigns an elemental school, blocks duplicates, and finalizes the spell map as soon as the active selection rule is satisfied.
- **Signature**: `(elemento: String)`
- **Flow**:
  - IF `currentHeroPicking` is null RETURN.
  - IF `pickedElements` contains `elemento` RETURN.
  - Add `elemento` to `pickedElements`.
    - BRANCH:
      - IF `currentHeroPicking.hero.classe` == "Mago" AND `pickedElements.length` == 3:
      - // Auto-assign remaining element to Elf if present
        - Let `elf` = Find hero in `heroes` where `hero.hero.classe` == "Elfo".
      - IF `elf` is found:
        - Let `allElements` = ["Fuoco", "Acqua", "Terra", "Aria"].
        - Let `remaining` = Find element in `allElements` NOT IN `pickedElements`.
        - Add `remaining` to `pickedElements`.
      - // Finalize selection
      - Let `wizardId` = `currentHeroPicking.heroId`.
      - Let `wizardSpells` = Filter `allSpells` where `spell.elemento` is in the first 3 `pickedElements` -> map to `id`.
      - Let `selectionMap` = New Map.
      - Add `wizardId -> wizardSpells` to `selectionMap`.
      - IF `elf` is found:
        - Let `elfSpells` = Filter `allSpells` where `spell.elemento` is the 4th `pickedElements` -> map to `id`.
        - Add `elf.heroId -> elfSpells` to `selectionMap`.
      - Trigger `onConfirmSelection(selectionMap)`.
      - IF `currentHeroPicking.hero.classe` == "Elfo" AND `pickedElements.length` == 1:
        - Let `elfId` = `currentHeroPicking.heroId`.
        - Let `elfSpells` = Filter `allSpells` where `spell.elemento` == `elemento` -> map to `id`.
        - Let `selectionMap` = New Map.
        - Add `elfId -> elfSpells` to `selectionMap`.
        - Trigger `onConfirmSelection(selectionMap)`.

#### maintainScrollableViewportLayout

- **Contract**: Keeps the spell-selection modal usable on short viewports.
- **Flow**:
  - Allow the overlay container to scroll vertically when the modal natural height exceeds the viewport.
  - Reduce the visual footprint of card backs and labels on compact screens.
  - Preserve full-card click targets for every elemental choice.

**💡 Implementation Hint**: The Wizard picks 3 elements, leaving exactly one for the Elf automatically.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities internalState, initialize, selectElement, maintainScrollableViewportLayout MUST remain deterministic for equivalent props/state and user actions.

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
