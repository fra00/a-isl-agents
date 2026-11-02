# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-notification

---

## Domain Concepts

- `notification tone`: A small visual taxonomy derived from message semantics, used to style the toast as arcane, loot-related, warning, or generic narration.

## Component: DungeonNotification

### Role: Presentation

**Signature**:

- `message`: String (The message to display. If null or empty, component is hidden).
- `duration`: Integer (Duration in ms, default 3000).
- `onClose`: () -> void (Callback to clear the message).

### 🔍 Appearance

- **Position**: Fixed, centered near the top of the screen.
- **Style**:
  - Background: Stone-and-metal plaque with a dark translucent body and decorative fantasy corners.
  - Border: Contextual accent border based on the notification tone.
  - Text: White/stone high-contrast headline text with a small uppercase category label.
  - Leading Badge: A compact icon badge at the left side of the toast.
  - Width: Responsive plaque, centered, wider than the previous simple toast.
  - Padding: Comfortable panel padding suitable for multi-word alerts.
  - Rounded corners.
  - Z-Index: 100 (Always on top).
- **Animation**: Brief slide/fade entrance.

### 📦 Content

- Display `message`.
- Derive a contextual tone from the message semantics:
  - Arcane/spell targeting messages use an indigo accent.
  - Treasure/find messages use an amber accent.
  - Warning/cancel/invalid-target messages use a rose accent.
  - Generic system narration uses a neutral amber-stone accent.
- Display a short uppercase tone label (for example `Arcano`, `Bottino`, `Avviso`, `Cronaca`).

### ⚡ Capabilities

#### deriveTone

- **Contract**: Classifies the visual tone of the notification from the message text so the toast immediately communicates whether the event is arcane, loot-related, cautionary, or generic narration.
- **Trigger**: During render when `message` is present.
- **Flow**:
  - Inspect the lowercase message.
  - Match it against a small keyword taxonomy.
  - Return badge, label, border accent, and background treatment consistent with the inferred tone.

#### autoClose

- **Contract**: Automatically closes the notification after `duration`.
- **Trigger**: When `message` changes and is not null.
- **Flow**:
  - Set a timeout for `duration` ms.
  - On timeout, trigger `onClose`.
  - Cleanup timeout on unmount or if message changes.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities deriveTone, autoClose MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: deriveTone
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
