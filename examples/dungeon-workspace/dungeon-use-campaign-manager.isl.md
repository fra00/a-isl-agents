# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-campaign-manager

---

> **Reference**: @HeroState in `./domain-session.isl.md`

## Component: useCampaignManager

### Role: Business Logic

### ⚡ Capabilities

#### saveCampaign

- **Contract**: Saves the current state of heroes and mission progress to LocalStorage.
- **Signature**: `(heroes: List<@HeroState>, nextMissionIndex: Integer)`
- **Flow**:
  - Create `campaignData` object: `{ heroes: heroes, nextMissionIndex: nextMissionIndex, timestamp: Date.now() }`.
  - Serialize `campaignData` to JSON string.
  - TRY:
    - Save string to LocalStorage with key `"dg_campaign_data"`.
  - CATCH:
    - Log error to console.
    - Trigger UI notification "Could not save progress".

#### loadCampaign

- **Contract**: Retrieves the saved campaign data.
- **Signature**: `() -> { heroes: List<@HeroState>, nextMissionIndex: Integer } | null`
- **Flow**:
  - Get item `"dg_campaign_data"` from LocalStorage.
  - IF item is null OR empty: RETURN null.
  - TRY:
    - Parse JSON string to `campaignData`.
  - CATCH: RETURN null.
  - RETURN `campaignData`.

#### hasSavedCampaign

- **Contract**: Checks if a saved campaign exists.
- **Signature**: `() -> Boolean`
- **Flow**:
  - Get item `"dg_campaign_data"` from LocalStorage.
  - RETURN true if item exists, false otherwise.

#### resetCampaign

- **Contract**: Deletes the saved campaign data.
- **Signature**: `()`
- **Flow**:
  - Remove item `"dg_campaign_data"` from LocalStorage.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities saveCampaign, loadCampaign, hasSavedCampaign, resetCampaign MUST avoid undefined side effects outside declared flow and side effects.

### 🚨 Global Constraints

- Component MUST keep orchestration semantics coherent across all capabilities and shared state references.
- Cross-capability execution MUST preserve declared domain invariants and mutation boundaries.
- Component MUST expose deterministic behavior at the system boundary for equivalent scenarios.

### ✅ Acceptance Criteria

- [ ] Capability-level constraints are satisfied for declared orchestration methods.
- [ ] Component-level global constraints hold across multi-capability execution paths.
- [ ] State boundary and domain reference consistency are preserved end-to-end.

### 🧪 Test Scenarios

1. **Capability Constraint - Deterministic Method Behavior**:
   - Target: first declared capability
   - Input: equivalent inputs/state across repeated runs
   - Expected: same transition/output and bounded side effects

2. **Capability Constraint - Boundary Handling**:
   - Target: capability-level constraints
   - Input: invalid or boundary conditions
   - Expected: explicit handling without undefined mutations

3. **Global Constraint - Cross-Capability Orchestration**:
   - Target: component capability sequence
   - Input: realistic multi-step flow
   - Expected: coherent state progression respecting global boundaries
