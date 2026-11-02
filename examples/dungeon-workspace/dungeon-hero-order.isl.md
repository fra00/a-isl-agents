# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-hero-order

---

> **Reference**: HeroState in `./domain-session.isl.md`
> **Reference**: Hero in `./domain-ruleset.isl.md`

## Component: DungeonHeroOrder

### Role: Presentation

## Domain Concepts

### 📦 Content/Structure

#### `HeroOrderSection`

- **Contract**: Represents the distinct visual areas in the hero turn order overlay.

- `CURRENT_ORDER`: Ordered slots already assigned.
- `AVAILABLE_HEROES`: Heroes still available for assignment.
- `CONFIRM_ACTION`: Final action to lock the order.

**Signature**:

- `heroes`: List of HeroState (The heroes available for the mission).
- `onConfirmOrder`: (orderedHeroIds: List<Integer>) -> void (Callback when order is confirmed).

### 🔍 Appearance

- **Overlay**: Fixed full-screen dark gothic overlay.
- **Modal**: Centered large dark bronze panel aligned with the Dungeon navigation flow.
- **Responsive Layout**: On short viewports, the overlay itself MUST remain vertically scrollable so the full hero-order modal stays reachable and all hero cards remain clickable without overlapping the header or confirm area.
- **Typography**: Bronze fantasy title, warm neutral body text, uppercase section labels.
- **Sections**: Two internal panels side by side on large screens.
  - `Current Order`
  - `Available Heroes`
- **Cards**: Hero cards with bronze/dark borders and hover overlays.
- Full-body hero artwork must remain fully contained inside each card with internal padding; it must never visually overflow or be cropped outside the card bounds.
- The user must always be able to reach the full order UI on short viewports, even if that requires scrolling the overlay container.
- Click targets for available heroes and assigned slots SHOULD use explicit interactive elements so the full card remains reliably clickable.

### 📦 Content

- **Title**: "Scegli l'Ordine degli Eroi".
- **Instructions**: Explain that clicking available heroes assigns initiative and clicking assigned slots removes them.
- **Current Order Section**:
  - Displays slots for the selected order (1 to 4).
  - Shows selected heroes (`HeroState`) with their portrait (`hero.portrait`) and class (`hero.classe`).
    path of image is `img/eroi/` + `portrait
  - Selected hero artwork must be scaled down to fit comfortably inside the slot while keeping the full figure visible.
  - Clicking a selected hero removes them from the order.
- **Available Heroes Section**:
  - Displays heroes not yet selected.
  - Hero artwork must stay fully visible inside each available card and align toward the bottom of the frame.
  - Clicking an available hero adds them to the next available slot in the order.
- **Confirm Button**:
  - Enabled only when all heroes are assigned an order.
  - Text: "Conferma Ordine".

### ⚡ Capabilities

#### internalState

- **Contract**: Tracks currently assigned hero ids and the list of heroes still available for selection.

- `selectedOrder`: List of Integer (Hero IDs in order).
- `availableHeroes`: List of HeroState (Heroes not yet selected).

#### initialize

- **Contract**: Sets up initial state based on props.
- **Trigger**: On Mount or when `heroes` prop changes.
- **Flow**:
  - Set `selectedOrder` to empty list.
  - Set `availableHeroes` to `heroes`.

#### selectHero

- **Contract**: Adds a hero to the turn order.
- **Signature**: `(heroId: Integer)`
- **Trigger**: User clicks on an available hero.

- **Flow**:
  - IF `heroId` is NOT in `selectedOrder` AND `selectedOrder.length` < `heroes.length`:
    - Add `heroId` to `selectedOrder`.
    - Remove hero with `heroId` from `availableHeroes`.

#### removeHero

- **Contract**: Removes a hero from the turn order.
- **Signature**: `(heroId: Integer)`
- **Trigger**: User clicks on a selected hero.
- **Flow**:
  - Remove `heroId` from `selectedOrder`.
  - Find hero in `heroes` by `heroId`.
  - Add hero back to `availableHeroes`.
  - Sort `availableHeroes` by ID (optional, for consistency).

#### confirm

- **Contract**: Finalizes the order selection.
- **Trigger**: User clicks "Confirm Order".
- **Flow**:
  - IF `selectedOrder.length` EQUALS `heroes.length`:
    - Call `onConfirmOrder(selectedOrder)`.

#### maintainScrollableViewportLayout

- **Contract**: Prevents hero cards from overlapping the overlay header/footer on short viewport heights so card hitboxes stay clickable.
- **Flow**:
  - Let the full-screen overlay scroll vertically when the viewport is too short for the full modal.
  - Keep the hero-order modal centered on larger screens but reachable from top to bottom on smaller ones.
  - Preserve full-card click targets for both available heroes and assigned slots.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities `HeroOrderSection`, internalState, initialize, selectHero, removeHero MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: `HeroOrderSection`
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
