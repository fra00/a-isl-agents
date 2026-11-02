# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-treasure-card-modal

---

> **Reference**: @TreasureCard in `./domain-ruleset.isl.md`

## Component: TreasureCardModal

### Role: Presentation

**Signature**:

- `isOpen`: Boolean (Controls visibility).
- `card`: @TreasureCard (The card to display).
- `onClose`: () -> void (Callback to close the modal).

### 🔍 Appearance

- **Overlay**: Fixed full-screen container with semi-transparent backdrop (bg-black/80), z-index 60.
- **Dialog**: Centered container.
- **Image**: The card image.

### 📦 Content

**Guard**: IF card IS NULL, render 'EmptyState' or return null to prevent runtime crash.

- **Card Image**:
  - Source: `/img/cartetesoro/` + `card.immagine`.
  - Alt: `card.effetto`.
  - OnError: Display placeholder image '/img/placeholder.png'.
  - Click on image or overlay triggers `onClose`.

### ⚡ Capabilities

#### handleClose

- **Contract**: Closes the modal.
- **Trigger**: Click on overlay or image.
- **Flow**:
  - IF modalState IS NOT 'closing' THEN set modalState to 'closing' AND trigger onClose.

### 🚨 Constraints

- handleClose MUST close the modal at most once while in the same open cycle.
- Null or invalid card input MUST be handled safely without runtime crash.
- Close interaction MUST NOT mutate treasure deck or hero state directly.

### 🚨 Global Constraints

- Card visual/alt/fallback behavior MUST remain consistent with provided card data.
- Overlay and image click interactions MUST map to a single coherent close behavior.
- Component MUST remain Presentation-only and MUST NOT apply treasure effects/business rules.

### ✅ Acceptance Criteria

- [ ] handleClose respects local idempotency and null-safety constraints.
- [ ] Component-level card rendering and fallback semantics remain deterministic.
- [ ] Role boundary remains Presentation-only without gameplay mutation logic.

### 🧪 Test Scenarios

1. **Capability Constraint - Close Idempotency**:
   - Target: handleClose
   - Input: repeated overlay/image clicks while modal is open
   - Expected: close flow executes once per open cycle

2. **Capability Constraint - Null Card Guard**:
   - Target: handleClose + render guard
   - Input: card = null
   - Expected: safe empty/placeholder behavior and no crash

3. **Global Constraint - Visual/Interaction Coherence**:
   - Target: TreasureCardModal as component
   - Input: same card and isOpen props across renders
   - Expected: same image/fallback output and same close interaction semantics
