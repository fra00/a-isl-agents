# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-inventory-modal

---

> **Reference**: @HeroState in `./domain-session.isl.md`
> **Reference**: @Item, @Equipment in `./domain-ruleset.isl.md`

## Component: DungeonInventoryModal

### Role: Presentation

**Signature**:

- `isOpen`: Boolean (Controls visibility).
- `hero`: @HeroState (The hero whose inventory is displayed).
- `allItems`: List<@Item> (Registry used to resolve inventory IDs to human-readable labels).
- `allEquipment`: List<@Equipment> (Registry used to resolve equipment IDs to human-readable labels).
- `onToggleEquip`: (heroId: Integer, itemId: Integer) -> void (Callback to equip/unequip owned equipment).
- `onUseItem`: (heroId: Integer, itemId: Integer) -> void (Callback to consume/use an inventory item).
- `onClose`: () -> void (Callback to close the modal).

### 🔍 Appearance

- **Overlay**: Fixed full-screen backdrop (bg-black/70), z-index 50.
- **Dialog**: Centered container, dark theme (`bg-gray-900`), white text, rounded corners, shadow-2xl, max-width 500px.
- **Header**: Title "Inventario" and a close icon.

### 📦 Content

- **Hero Identity**:
  - Image: `/img/personaggi/` + `hero.hero.immagine`.
  - Name: `hero.hero.nome` (Heading style).
  - Class: `hero.hero.classe` (Subheading).
- **Gold Balance**:
  - Display: "Monete d'Oro: " + `hero.gold`.
- **Items Grid (Oggetti)**:
  - List: Iterate `hero.inventory`.
    - Guard: IF item exists in `allItems`: display item `nome` (or `descrizione` when available) and image.
    - IF item is missing in registry: display localized fallback `"Oggetto ID <id>"` (never English `"Unknown Item"` text).
    - Render action button "Usa" that calls `onUseItem(hero.heroId, itemId)`.
- **Equipment List (Equipaggiamento)**:
  - List: Iterate `hero.equipment`.
    - IF equipment exists in `allEquipment`: display equipment `nome` (or `descrizione` when available) and image.
    - IF equipment is missing in registry: display localized fallback `"Equipaggiamento ID <id>"` (never English `"Unknown equipment"` text).
    - Render action button:
      - IF `itemId` is in `hero.equipped`: show "Equipaggiato".
      - ELSE: show "Equipaggia".
    - Button click must call `onToggleEquip(hero.heroId, itemId)`.

### ⚡ Capabilities

#### handleClose

- **Contract**: Triggers the close callback.
- **Trigger**: User clicks the close button or the overlay.
- **Flow**:
  - Trigger `onClose`.

### 🚨 Constraints

- handleClose MUST trigger onClose without mutating hero inventory/equipment data.
- Item/equipment buttons MUST delegate to callbacks (`onUseItem`, `onToggleEquip`) and MUST NOT mutate session state locally.
- Close interaction MUST be available only while isOpen is true.
- Modal close MUST be idempotent for repeated close gestures in the same visible state.

### 🚨 Global Constraints

- Inventory rendering MUST remain consistent with provided hero, llItems, and llEquipment references.
- Unknown/missing item or equipment mappings MUST be handled gracefully without runtime failure.
- Inventory/equipment labels shown to the user MUST be human-readable and localized; raw IDs are allowed only as explicit fallback labels (`"Oggetto ID <id>"`, `"Equipaggiamento ID <id>"`).
- The component MUST NOT display English technical placeholders such as `"Unknown Item"` or `"Unknown equipment"` in the final UI.
- Component MUST remain Presentation-only and MUST NOT perform inventory business updates.

### ✅ Acceptance Criteria

- [ ] handleClose satisfies local constraints for visibility, idempotency, and no data mutation.
- [ ] Inventory/equipment presentation remains stable and null-safe for equivalent props.
- [ ] Component-level role boundary excludes business logic.

### 🧪 Test Scenarios

1. **Capability Constraint - Close Interaction**:
   - Target: handleClose
   - Input: isOpen = true, close button or overlay click
   - Expected: onClose emitted with no inventory mutation

2. **Capability Constraint - Repeated Close Gesture**:
   - Target: handleClose
   - Input: multiple close gestures during same open cycle
   - Expected: deterministic close behavior without duplicated side effects

3. **Global Constraint - Mapping Resilience**:
   - Target: DungeonInventoryModal as component
   - Input: missing item/equipment IDs in registries
   - Expected: graceful fallback rendering without crash
