# Project: Dungeon React

**Version**: 1.0.1
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./mission-card

---

> **Reference**: Mission in `./domain-map.isl.md`

## Component: MissionCard

### Role: Presentation

**Signature**:

- `mission`: Mission (The mission data object).
- `index`: Integer (The index of the mission in the list).
- `status`: String (One of: `LOCKED`, `AVAILABLE`, `COMPLETED` — same vocabulary as PlayGame `MissionArchiveStatus`).
- `isFocused`: Boolean (True when this card is the focused archive entry. Default: false).
- `onSelect`: (index: Integer) -> void (Callback triggered on selection/focus; MUST NOT start the mission by itself).

### 🔍 Appearance

- **Container**: Stone/parchment gothic card with bronze border and subtle inner glow, aligned with the PlayGame mission archive.
- **Focus**: When `isFocused` is true, strengthen the bronze border / glow so the focused card is visually distinct from siblings.
- **Styling by Status**:
  - **COMPLETED**: Completed seal treatment (bronze/emerald accent).
  - **AVAILABLE**: Highlighted “next” treatment (warm gold/bronze).
  - **LOCKED**: Reduced opacity, muted palette, cursor not-allowed.

### 📦 Content

- **Status seal / icon**: Checkmark for Completed, Play for Available, Lock for Locked.
- **Title**: Displays `mission.titolo`.
- **Subtitle**: Displays archive reference `mission.file` when present; otherwise `"Mission " + (mission.ordine or index + 1)`.
- **Status pill**: Centered label for the current `status` (`Locked` / `Available` / `Completed` or Italian equivalents used by PlayGame).
- MUST NOT expose a separate “Start mission” affordance that bypasses PlayGame’s detail-panel primary action.

### ⚡ Capabilities

#### handleInteraction

- **Contract**: Validates click and focuses the mission in the parent archive (does not start the mission).
- **Trigger**: User clicks the card (including status/title area).
- **Flow**:
  - IF `mission` IS NULL THEN RETURN.
  - IF `status` is `LOCKED`:
    - Do nothing (or prevent default).
  - ELSE:
    - Trigger `onSelect(index)` exactly once so the parent can run `focusMission`.

### 🚨 Constraints

- If `status` is `LOCKED`, `handleInteraction` MUST NOT call `onSelect`.
- If `mission` is null/undefined, interaction MUST be ignored safely without side effects.
- For selectable statuses (`AVAILABLE`, `COMPLETED`), `handleInteraction` MUST emit exactly one `onSelect(index)` per user action.
- `MissionCard` MUST NOT call mission bootstrap / `selectMission`; starting a mission remains a PlayGame detail-panel responsibility.

### 🚨 Global Constraints

- Visual status semantics (`LOCKED`, `AVAILABLE`, `COMPLETED`) MUST remain consistent across icon, styling, and interaction affordance.
- `MissionCard` MUST remain a pure presentation component and MUST NOT decide campaign progression rules.
- Equivalent props (`mission`, `index`, `status`, `isFocused`) MUST produce equivalent rendering and interaction outcomes.

### ✅ Acceptance Criteria

- [ ] `handleInteraction` satisfies local constraints for locked, selectable, and null-mission cases.
- [ ] Card click focuses only; it never starts a mission.
- [ ] Role boundary remains Presentation-only with no domain progression logic leakage.

### 🧪 Test Scenarios

1. **Capability Constraint - Locked Mission**:
   - Target: `handleInteraction`
   - Input: `status = LOCKED`, valid `mission`, valid `index`
   - Expected: no `onSelect` invocation

2. **Capability Constraint - Selectable Mission**:
   - Target: `handleInteraction`
   - Input: `status = AVAILABLE` (or `COMPLETED`), valid `mission`, valid `index`
   - Expected: one `onSelect(index)` invocation; no mission start side effects

3. **Global Constraint - Status Semantics Consistency**:
   - Target: `MissionCard` as component
   - Input: same props rendered repeatedly
   - Expected: same status visuals and same interaction behavior across renders
