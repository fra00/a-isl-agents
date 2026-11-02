# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-combat-result-modal

---

> **Reference**: @CombatResult, @CombatDiceResult in `./dungeon-use-combat.isl.md`
> **Reference**: @HeroState, @MonsterState in `./domain-session.isl.md`
> **Reference**: @Hero, @Monster in `./domain-ruleset.isl.md`

## Domain Concepts

- `combat presentation state`: UI-only animation and severity cues derived from an existing combat result without mutating gameplay state.

## Component: CombatResultModal

### Role: Presentation

**Signature**:

- `isOpen`: Boolean (Controls visibility).
- `onClose`: () -> void (Callback to close the modal).
- `combatResult`: @CombatResult (The result of the combat containing dice rolls and damage).
- `attacker`: @HeroState | @MonsterState (The attacking entity).
- `defender`: @HeroState | @MonsterState (The defending entity).

### 🔍 Appearance

- **Overlay**: Fixed full-screen container with dark semi-transparent backdrop and a slight blur, z-index 50.
- **Dialog**: Centered container around 820x520px, relative, overflow hidden, rounded-2xl, shadow-2xl, with a bronze border.
- **Background Layout**:
  - **Backdrop**:
    - Stone-dark base with a warm red flare on the attacker side and a cold blue flare on the defender side.
    - Decorative bronze corner marks.
- **Attacker Portrait (Left)**
  - z-index: 2
  - only for barbarian use margin negative to move the image more to the center of the screen.
- **Defender Portrait (Right)**
- **Center Info**:
  - **Title Block**:
    - Result headline centered in the middle panel using localized text such as `Colpo a Segno`, `Impatto Devastante`, or `Attacco Respinto`.
    - Subtitle line naming attacker and defender.
  - **Dice Container**:
    - Position: Centered inside a stone/bronze plaque.
    - Layout: Flex column or grid.
  - **Result Text**:
    - Rendered as a dedicated damage medallion showing the localized label `Danni Inflitti` and the value.
  - **Close Button**:
    - Bottom center (below Result Text),
    - Button style uses amber/bronze fantasy UI and localized text `Chiudi`.
  - z-index: 3

### 📦 Content

- **Attacker Portrait (Left)**:
  - **Source**:
    - IF `attacker` has `hero`: `/img/eroi/` + `@Hero.portrait`.)
    - IF `attacker` has `monster`: `/img/mostri/` + `@Monster.immalarge`.
  - **Style**: Large image, positioned left-center, object-contain/cover, fade into background.
- **Defender Portrait (Right)**:
  - **Source**:
    - IF `defender` has `hero`: `/img/eroi/` + `@Hero.portrait`.
    - IF `defender` has `monster`: `/img/mostri/` + `@Monster.immalarge`.
  - **Style**: Large image, positioned right-center, object-contain/cover, fade into background.
- **Center Info**:
  - **Title Block**:
    - Text derived from combat outcome severity.
  - **Dice Container**:
    - **Attacker Dice Row**:
      - Label: "Attaccante".
      - Content: List of dice images based on `combatResult.attackerDice`.
        - IF `SKULL`: `/img/altro/teschio.png`.
        - IF `WHITE_SHIELD` : `/img/altro/scudo.png`.
        - IF `BLACK_SHIELD`: `/img/altro/scudo-nero.png`.
      - **Animation**: Each die slides in from the **Left** towards the center with a staggered delay (e.g., 0.1s per die).
    - **Defender Dice Row**:
      - Label: "Difensore".
      - Content: List of dice images based on `combatResult.defenderDice`.
        - IF `SKULL`: `/img/altro/teschio.png`.
        - IF `WHITE_SHIELD` : `/img/altro/scudo.png`.
        - IF `BLACK_SHIELD`: `/img/altro/scudo-nero.png`.
      - **Animation**: Each die slides in from the **Right** towards the center with a staggered delay (e.g., 0.1s per die).
  - **Result Text**:
    - Content: localized damage summary using `combatResult.damageDealt`.
  - **Close Button**:
    - Text: "Chiudi".
    - Action: onClick triggers `onClose`.

### ⚡ Capabilities

#### internalState

- **Contract**: Tracks the local animation gate that starts the staggered combat reveal after the modal opens.

- `animationActive`: Boolean (True when modal opens to trigger CSS animations).

#### syncAnimationGate

- **Contract**: Synchronizes the animation gate with modal open state and preserves the empty-state guard when combat data is missing.

- **Guard Clause**:
  - IF `combatResult` is null OR undefined:
    - Render a localized empty-state combat report.
    - Ensure `Close Button` remains functional to trigger `onClose`.
    - RETURN.

- **Trigger**: `isOpen` changes.
- **Flow**:
  - IF `isOpen` is true:
    - Set `animationActive` to true.
  - ELSE:
    - Set `animationActive` to false.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities `internalState` and `syncAnimationGate` MUST remain deterministic for equivalent props/state and user actions.

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
   - Target: internalState
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
