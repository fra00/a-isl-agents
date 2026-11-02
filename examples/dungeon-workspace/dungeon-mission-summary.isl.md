# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-mission-summary

---

> **Reference**: @HeroState in `./domain-session.isl.md`
> **Reference**: @Equipment, @Item in `./domain-ruleset.isl.md`

## Component: DungeonMissionSummary

### Role: Presentation

**Signature**:

- `isOpen`: Boolean (Controls visibility).
- `heroes`: List of @HeroState (The heroes at the end of the mission).
- `allEquipment`: List of @Equipment (To map IDs to names).
- `allItems`: List of @Item (To map IDs to names).
- `onClose`: () -> void (Callback to finalize mission and exit).

### 🔍 Appearance

- **Overlay**: Fixed full-screen backdrop (bg-black/95), z-index 80.
- **Dialog**: Large centered container, parchment or gothic stone theme.
- **Title**: Large golden text "MISSIONE COMPIUTA".
- **Hero Grid**: Grid displaying columns for each hero.

### 📦 Content

- **Title Section**: Displays "Riepilogo Missione".
- **Hero List**: For each hero who has not died (`currentBody` > 0):
  - **Portrait**: `hero.hero.portrait`.
  - **Name & Class**: `hero.hero.nome` - `hero.hero.classe`.
  - **Gold Section**: Icon and text showing `hero.gold` (Total gold).
  - **Loot Section**:
    - **Items**: List names of `@Item` found in `hero.inventory`.
    - **Equipment**: List names of `@Equipment` found in `hero.equipment`.
- **Actions**:
  - Button "Torna al Villaggio": Large button to trigger `onClose`.

### ⚡ Capabilities

#### handleFinalize

- **Contract**: Triggers the exit process.
- **Trigger**: User clicks the main button.
- **Flow**:
  - Trigger `onClose`.

### 🚨 Constraints

- handleFinalize MUST invoke onClose exactly once per finalize action.
- Finalize interaction MUST be available only when summary modal is open.
- Finalize flow MUST NOT alter hero loot/gold data directly.

### 🚨 Global Constraints

- Mission summary MUST present hero outcome data consistently with provided heroes, llItems, and llEquipment.
- Dead heroes filtering and loot rendering MUST remain deterministic for equivalent inputs.
- Component MUST remain Presentation-only and MUST NOT decide campaign progression outcomes.

### ✅ Acceptance Criteria

- [ ] handleFinalize enforces local constraints for visibility, single invocation, and no state mutation.
- [ ] Component-level hero/loot summary semantics are stable and deterministic.
- [ ] Presentation boundary is respected with no progression logic leakage.

### 🧪 Test Scenarios

1. **Capability Constraint - Finalize Action**:
   - Target: handleFinalize
   - Input: isOpen = true, user clicks finalize button
   - Expected: one onClose call and no direct data mutation

2. **Capability Constraint - Closed Modal**:
   - Target: handleFinalize
   - Input: isOpen = false
   - Expected: finalize interaction is not exposed

3. **Global Constraint - Summary Determinism**:
   - Target: DungeonMissionSummary as component
   - Input: same heroes/items/equipment props across renders
   - Expected: same filtered hero list and same loot presentation
