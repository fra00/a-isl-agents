# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-game-over

---

## Component: DungeonGameOver

### Role: Presentation

**Signature**:

- `isOpen`: Boolean (Controls visibility).
- `onExit`: () -> void (Callback to return to the main menu).

### 🔍 Appearance

- **Overlay**: Fixed full-screen backdrop (bg-black), z-index 90.
- **Layout**: Centered flex container.
- **Typography**:
  - "GAME OVER" in large, blood-red gothic font.
  - Dramatic animation (fade in and scale).

### 📦 Content

- **Title**: "Tutti gli eroi sono caduti..."
- **Message**: "L'Oscurità ha trionfato. Il mondo precipita nell'oscurità."
- **Actions**:
  - Button "Torna al Menu": Triggers `onExit`.

### ⚡ Capabilities

#### handleExit

- **Contract**: Specifies handleExit semantics and invariants for this unit.
- **Trigger**: User clicks the exit button.
- **Flow**:
  - Trigger `onExit`.

### 🚨 Constraints

- handleExit MUST invoke onExit exactly once per user action.
- Exit interaction MUST be available only when isOpen is true.
- Exit flow MUST NOT mutate gameplay/session state directly.

### 🚨 Global Constraints

- Component MUST present a deterministic terminal-state UI for equivalent isOpen values.
- Overlay, message, and exit action MUST remain semantically coherent as a single game-over interaction surface.
- Component MUST remain Presentation-only and MUST NOT implement mission/session business transitions.

### ✅ Acceptance Criteria

- [ ] handleExit respects local capability constraints for visibility and single invocation semantics.
- [ ] Game-over surface remains visually and behaviorally coherent across renders.
- [ ] Component boundary remains strictly Presentation-oriented.

### 🧪 Test Scenarios

1. **Capability Constraint - Exit Action**:
   - Target: handleExit
   - Input: isOpen = true, user clicks exit button
   - Expected: one onExit invocation and no extra side effects

2. **Capability Constraint - Hidden State**:
   - Target: handleExit
   - Input: isOpen = false
   - Expected: no interactive exit behavior is exposed

3. **Global Constraint - Terminal UI Consistency**:
   - Target: DungeonGameOver as component
   - Input: repeated renders with same props
   - Expected: identical overlay/message/action semantics
