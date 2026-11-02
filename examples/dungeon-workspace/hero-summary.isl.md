# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./hero-summary

---

> **Reference**: Hero in `./domain-ruleset.isl.md`
> **Reference**: HeroState in `./domain-session.isl.md`
> **Reference**: Equipment in `./domain-ruleset.isl.md`

## Component: HeroSummary

### Role: Presentation

## Domain Concepts

### 📦 Content/Structure

#### `HeroSummarySection`

- **Contract**: Represents the distinct content blocks displayed in the hero dossier panel.

- `SELECTOR`: Hero selection control.
- `PORTRAIT`: Hero portrait area.
- `GOLD`: Gold summary card.
- `EQUIPMENT`: Owned equipment list.

**Signature**:

- `heroes`: List<HeroState> (Dynamic states from session).
- `staticHeroes`: List<Hero> (Static definitions loaded from JSON).
- `selectedIndex`: Integer (Index of the currently selected hero).
- `onSelect`: (index: Integer) -> void (Callback when a hero is selected).

### 🛡️ Guards

- IF heroes.length == 0 THEN RETURN 'No Heroes Available'
- IF selectedIndex >= heroes.length THEN SET selectedIndex = 0

### 🔍 Appearance

- **Layout**: Dark gothic hero dossier panel.
- **Hero Selector**: Bronze/dark dropdown to switch between heroes.
- **Portrait**: Framed image area for the hero portrait.
- **Stats**: Compact gold summary card with reduced visual footprint.
- **Inventory**: Scrollable list of owned equipment shown as dark list entries.

### 📦 Content

- **Selector**: Renders names of all heroes in the session.
- **Portrait**: Image sourced from `/img/eroi/` + `staticHero.portrait`.
- **Gold**: Compact text displaying `heroState.gold` in gold coins.
- **Equipment List**: List of names of equipment currently owned by the hero. Use id to find the Equipment "nome" from static Equipment list

### ⚡ Capabilities

#### handleSelect

- **Contract**: Propagates selection event.
- **Trigger**: User clicks on a hero in the selector.
- **Flow**:
  - Trigger `onSelect(index)`.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities `HeroSummarySection`, handleSelect MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: `HeroSummarySection`
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
