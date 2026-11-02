# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./shop-inventory

---

> **Reference**: Equipment in `./domain-ruleset.isl.md`

## Component: ShopInventory

### Role: Presentation

## Domain Concepts

### 📦 Content/Structure

#### `ShopInventorySection`

- **Contract**: Represents the distinct visual sections of the armory inventory panel.

- `LIST`: Scrollable list of purchasable items.
- `PREVIEW`: Selected item preview card.
- `ACTIONS`: Purchase and navigation buttons.

**Signature**:

- `items`: List<Equipment> (List of available shop items).
- `selectedItemId`: Integer (ID of the currently selected item).
- `canBuy`: Boolean (Whether the selected item can be purchased).
- `buyReason`: String (Reason if purchase is disabled).
- `onSelect`: (id: Integer) -> void (Callback when item is selected).
- `onBuy`: () -> void (Callback to buy item).
- `onEnterDungeon`: () -> void (Callback to start mission).
- `onExit`: () -> void (Callback to exit shop).

### 🔍 Appearance

- **Layout**: Dark gothic inventory panel that becomes a two-column internal structure on wide screens.
- **List**: Scrollable list of items occupying the main inventory column.
- **Preview**: Smaller preview card in a dedicated side column.
- **Actions**: Gothic action buttons stacked under the preview on wide screens.
- Combined with the hero dossier column, the armory reads as a three-column composition on large screens.

### 📦 Content

- **Item List**: Iterates over `items`.
  - Displays Name and Price.
  - Highlights if `id` matches `selectedItemId`.
  - Visual indication (e.g., opacity) if item is not affordable/compatible (logic handled by parent).
  - Must scroll vertically when the list exceeds available space.
- **Preview**: Image sourced from `/img/equip/` + `selectedItem.immagine`.
- **Validation Feedback**: When the selected item cannot be bought, show `buyReason` / item reason in the preview panel.
- **Buttons**:
  - "Acquista" (Disabled if `!canBuy`, tooltip shows `buyReason`).
  - "Entra nel dungeon".
  - "Indietro".

### ⚡ Capabilities

#### handleInteraction

- **Contract**: Delegates actions to parent.
- **Trigger**: User clicks buttons or items.
- **Flow**:
  - IF Item clicked -> IF items.find(i => i.id === id) == null THEN return; ELSE Trigger onSelect(id).
  - IF "Acquista" clicked AND `canBuy` -> Trigger `onBuy()`.
  - IF "Entra nel dungeon" clicked -> Trigger `onEnterDungeon()`.
  - IF "Indietro" clicked -> Trigger `onExit()`.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities `ShopInventorySection`, handleInteraction MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: `ShopInventorySection`
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
