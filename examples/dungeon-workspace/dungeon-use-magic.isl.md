# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-magic

---

> **Reference**: @GameSession, @HeroState, @MonsterState in `./domain-session.isl.md`
> **Reference**: @Spell, @Hero, @Monster in `./domain-ruleset.isl.md`
> **Reference**: @useCombatLogic in `./dungeon-use-combat.isl.md`
> **Reference**: @useMapInteraction in `./dungeon-use-map-interaction.isl.md`
> **Reference**: @useFogOfWar in `./dungeon-use-fog-of-war.isl.md`
> **Reference**: @useHeroStats in `./dungeon-use-hero-stats.isl.md`

## Component: useMagicLogic

### Role: Business Logic

## Domain Concepts

### 📦 Content/Structure

- This component owns spell targeting and effect resolution while persisting all spell-driven session mutations through the shared session update entrypoint.

**Signature**:

- `gameSession`: @GameSession
- `onUpdateSession`: `(session: @GameSession) -> void` OR `((previousSession: @GameSession) -> @GameSession) -> void`
- `onNotify`: (message: String) -> void
- `onActionDone`: () -> void
- `staticSpells`: List<@Spell>
- `combatLogic`: @useCombatLogic
- `mapInteractionLogic`: @useMapInteraction
- `fogOfWarLogic`: @useFogOfWar
- `heroStatsLogic`: @useHeroStats

### ⚡ Capabilities

#### commitSessionUpdate

- **Contract**: Persists spell-driven session mutations against the latest available session snapshot so damage, status changes, and spell consumption are committed atomically.
- **Signature**: `(updater: (@GameSession) -> @GameSession) -> Boolean`
- **Flow**:
  - IF `onUpdateSession` is not available RETURN false.
  - Trigger `onUpdateSession` with a functional updater.
  - The updater MUST receive the latest available `previousSession`.
  - Let `baseSession` = `previousSession` when available, otherwise `gameSession`.
  - IF `baseSession` is null RETURN `previousSession` unchanged.
  - RETURN `updater(baseSession)`.
  - RETURN true.

#### castSpell

- **Contract**: Executes the effect of a chosen spell.
- **Signature**: `(spellId: Integer, targetHeroId: Integer | null, targetMonsterId: Integer | null, targetX: Integer | null, targetY: Integer | null)`
- **Flow**:
  - Find `currentHero` in `gameSession.heroes` where `turnOrder` == `gameSession.currentTurn`.
  - IF `currentHero` is null, RETURN.
  - Find `spell` in `staticSpells` matching `spellId`.
  - IF spell is null: onActionDone(); RETURN.

  - **Apply Spell Effect**:
    - Initialize `wasCastSuccessful` to false.
    - Let `targetCoord` = null.
    - IF `targetMonsterId` is NOT null:
      - Let `m` = Find `targetMonster` in `gameSession.monsters` matching `targetMonsterId`.
      - IF `m` is found: SET `targetCoord` to {x: `m.x`, y: `m.y`}.
    - ELSE IF `targetHeroId` is NOT null:
      - Let `h` = Find `targetHero` in `gameSession.heroes` matching `targetHeroId`.
      - IF `h` is found: SET `targetCoord` to {x: `h.x`, y: `h.y`}.
    - ELSE IF `targetX` is NOT null AND `targetY` is NOT null:
      - SET `targetCoord` to {x: `targetX`, y: `targetY`}.

    - Let `hasLOS` = true.
    - IF `spell.effetto` != "Genio" AND `spell.targetType` != "Self" AND `targetCoord` is NOT null:
      - SET `hasLOS` to `fogOfWarLogic.visibilityCalc.hasLineOfSight(currentHero.x, currentHero.y, targetCoord.x, targetCoord.y)`.

    - IF `hasLOS` is true:
      - Call `commitSessionUpdate` with an updater.
      - Inside the updater create `nextSession` from the provided current session, cloning `heroes` and `monsters`.
      - Resolve `currentHero` again from the provided current session.
      - SWITCH `spell.effetto`:
      - CASE "Palla di Fuoco":
        - Find `targetMonster` in the current session `monsters` matching `targetMonsterId`.
        - IF `targetMonster` is found:
          - Let `damage` = 2.
          - Update `targetMonster.currentBody` by subtracting `damage`.
          - Trigger `onNotify(targetMonster.monster.nome + " subisce " + damage + " danni!")`.
          - IF `targetMonster.currentBody` <= 0:
            - Remove `targetMonster` from `nextSession.monsters`.
          - ELSE:
            - IF `targetMonster.activeStatus` contains "Sleep":
              - Remove "Sleep" from `targetMonster.activeStatus`.
              - Trigger `onNotify(targetMonster.monster.nome + " si è svegliato!")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Frecce di Fuoco":
        - Find `targetMonster` in the current session `monsters` matching `targetMonsterId`.
        - IF `targetMonster` is found:
          - Let `damage` = 1.
          - Update `targetMonster.currentBody` by subtracting `damage`.
          - Trigger `onNotify(targetMonster.monster.nome + " subisce " + damage + " danni!")`.
          - IF `targetMonster.currentBody` <= 0:
            - Remove `targetMonster` from `nextSession.monsters`.
          - ELSE:
            - IF `targetMonster.activeStatus` contains "Sleep":
              - Remove "Sleep" from `targetMonster.activeStatus`.
              - Trigger `onNotify(targetMonster.monster.nome + " si è svegliato!")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Coraggio":
        - Find `targetHero` in the current session `heroes` matching `targetHeroId`.
        - IF `targetHero` is found:
          - Add "Courage" to `targetHero.activeStatus` (if not already present).
          - Trigger `onNotify(targetHero.hero.classe + " si sente più coraggioso!")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Acqua Guaritrice":
        - Find `targetHero` in the current session `heroes` matching `targetHeroId`.
        - IF `targetHero` is found:
          - Let `previousBody` = `targetHero.currentBody`.
          - Let `healAmount` = `spell.valore` (e.g., 4).
          - Add `healAmount` to `targetHero.currentBody`.
          - Clamp `targetHero.currentBody` to max `targetHero.hero.corpo`.
          - Let `actualRecovered` = `targetHero.currentBody - previousBody`.
          - Trigger `onNotify(targetHero.hero.classe + " recupera " + actualRecovered + " Punti Corpo! (" + targetHero.currentBody + "/" + targetHero.hero.corpo + ")")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Nebbia Caliginosa":
        - Find `targetHero` in the current session `heroes` matching `targetHeroId`.
        - IF `targetHero` is found:
          - Add "FoggyMist" to `targetHero.activeStatus`.
          - Trigger `onNotify(targetHero.hero.classe + " è avvolto dalla Nebbia Caliginosa!")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Sonno":
        - Find `targetMonster` in the current session `monsters` matching `targetMonsterId`.
        - IF `targetMonster` is found:
          - **Immunity Check**:
            - IF `targetMonster.monster.nonmorto` is true:
              - Trigger `onNotify("I non-morti non possono dormire!")`.
              - Set `wasCastSuccessful` to false.
              - BREAK this spell case without mutating session state.
          - **Mental Resistance Test**:
            - Roll a standard 6-sided die for each point of `targetMonster.currentMind`.
            - IF any die result is 6:
              - Trigger `onNotify(targetMonster.monster.nome + " ha resistito all'incantesimo Sonno!")`.
            - ELSE:
              - Add "Sleep" to `targetMonster.activeStatus`.
              - Trigger `onNotify(targetMonster.monster.nome + " cade in un sonno profondo!")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Genio":
        - IF `targetMonsterId` is NOT null:
          - Find `targetMonster` in the current session `monsters` matching `targetMonsterId`.
          - IF `targetMonster` is found:
            - Let `genieAttackDice` = 5.
            - Let `monsterDefenseDice` = `targetMonster.monster.difesa`.
            - IF `targetMonster.activeStatus` contains "Tempest":
              - Set `monsterDefenseDice` to 0.
              - Remove "Tempest" from `targetMonster.activeStatus`.
              - Trigger `onNotify(targetMonster.monster.nome + " è travolto dalla tempesta e non può difendersi!")`.

            - Let `combatResult` = `combatLogic.resolveCombat(genieAttackDice, monsterDefenseDice, false)`.
            - Apply `combatResult.damageDealt` to `targetMonster.currentBody`.
            - Set `nextSession.lastAttack` to {hero: currentHero, monster: targetMonster, combatResult: combatResult}.
            - Trigger `onNotify("Il Genio attacca " + targetMonster.monster.nome + "!")`.
            - IF `targetMonster.currentBody` <= 0:
              - Remove `targetMonster` from `nextSession.monsters`.
            - ELSE:
              - IF `targetMonster.activeStatus` contains "Sleep":
                - Remove "Sleep" from `targetMonster.activeStatus`.
                - Trigger `onNotify(targetMonster.monster.nome + " si è svegliato!")`.
            - Set `wasCastSuccessful` to true.

        - ELSE IF `targetX` is NOT null AND `targetY` is NOT null:
          - Let `doorCheck` = `mapInteractionLogic.isFrontOfDoor(targetX, targetY)`.
          - IF `doorCheck.found` is true:
            - Call `mapInteractionLogic.openPassage(doorCheck.passageCell.x, doorCheck.passageCell.y, doorCheck.destination.x, doorCheck.destination.y)`.
            - Trigger `onNotify("Il Genio apre la porta!")`.
            - Set `wasCastSuccessful` to true.
          - ELSE:
            - Trigger `onNotify("Il Genio non trova alcuna porta da aprire qui.")`.

      - CASE "Tempesta":
        - Find `targetMonster` in the current session `monsters` matching `targetMonsterId`.
        - IF `targetMonster` is found:
          - Add "Tempest" to `targetMonster.activeStatus`.
          - Trigger `onNotify(targetMonster.monster.nome + " è bloccato dalla tempesta!")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Passaggio Invisibile":
        - Find `targetHero` in the current session `heroes` matching `targetHeroId`.
        - IF `targetHero` is found:
          - Add "InvisiblePassage" to `targetHero.activeStatus`.
          - Trigger `onNotify(targetHero.hero.classe + " può attraversare muri e occupanti durante il movimento!")`.
          - The status is temporary and MUST expire automatically at the end of the affected hero turn.
          - Set `wasCastSuccessful` to true.
      - CASE "Pelle di Pietra":
        - Find `targetHero` in the current session `heroes` matching `targetHeroId`.
        - IF `targetHero` is found:
          - // Effetto: Aumenta la difesa di 1 dado. Dura finché non subisce danno.
          - Add "RockSkin" to `targetHero.activeStatus`.
          - Trigger `onNotify(targetHero.hero.classe + " ha la pelle dura come roccia! (+1 dado difesa)")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Passapareti":
        - Find `targetHero` in the current session `heroes` matching `targetHeroId`.
        - IF `targetHero` is found:
          - // Effetto: Permette all'eroe bersaglio di attraversare un solo muro durante il movimento.
          - Add "WallPass" to `targetHero.activeStatus`.
          - Trigger `onNotify(targetHero.hero.classe + " può attraversare un muro con Passapareti!")`.
          - Set `wasCastSuccessful` to true.
      - CASE "Intralcio":
        - Find `targetMonster` in the current session `monsters` matching `targetMonsterId`.
        - IF `targetMonster` is found:
          - // Effetto: Riduce il movimento del mostro a 1 sola casella nel suo prossimo turno.
          - IF `targetMonster.activeStatus` does NOT contain "Entangled":
            - Add "Entangled" to `targetMonster.activeStatus`.
          - Trigger `onNotify(targetMonster.monster.nome + " è intralciato!")`.
          - Set `wasCastSuccessful` to true.

  - **Consumption**:
    - IF `wasCastSuccessful` is true:
      - Remove `spellId` from the current-session copy of `currentHero.availableSpells`.
      - Trigger `onNotify(currentHero.hero.classe + " lancia " + spell.nome + "!")`.
      - RETURN the fully updated `nextSession`, ensuring monster damage, status changes, and spell consumption persist in a single atomic commit.
    - ELSE:
      - Trigger `onNotify("Bersaglio non valido.")`.
      - RETURN the current session unchanged.
  - After `commitSessionUpdate`, call `onActionDone()` exactly once.

#### removeExpiredEffects

- **Contract**: Removes temporary spell effects from entities.
- **Signature**: `(heroId: Integer | null, monsterId: Integer | null, effect: String)`
- **Flow**:
  - Call `commitSessionUpdate` with an updater.
  - Inside the updater, clone `heroes` and `monsters` from the current session.
  - IF `heroId` is NOT null:
    - Find `hero` in the current session `heroes` matching `heroId`.
    - IF `hero.activeStatus` contains `effect`:
      - Remove `effect` from the cloned hero `activeStatus`.
  - IF `monsterId` is NOT null:
    - Find `monster` in the current session `monsters` matching `monsterId`.
    - IF `monster.activeStatus` contains `effect`:
      - Remove `effect` from the cloned monster `activeStatus`.
  - RETURN the updated session only if at least one status changed; otherwise RETURN the current session unchanged.

### 🚨 Constraints

- `castSpell` MUST persist damage, status updates, `lastAttack`, and spell consumption in a single session commit.
- Spell consumption MUST be derived from the latest available hero snapshot, not from a stale closure of `gameSession`.
- `InvisiblePassage` MUST NOT be permanent: it applies only for the current hero turn and MUST be removed automatically when that hero turn ends.
- **Monster-targeting spells (Palla di Fuoco, Frecce di Fuoco, Sonno, Tempesta, Genio attack)**: Target monster MUST have `fog = false` in the current `boardVisibilityMap`. If the monster is under fog (not visible), the spell MUST be rejected and `onNotify("Il bersaglio non è visibile!")` MUST be triggered.
- **Monster-targeting spells**: MUST require BOTH `hasLineOfSight` (geometric LOS check) AND target visibility (`fog = false`). Failure of either check cancels the spell.
- **Hero-targeting spells**: MUST verify that the target hero and the caster are in the same room/area (`sourceValo === targetValo`), unless the spell is "Self" or "Point" type.

### ⚙ Logic & Execution Rules

#### Spell Target Validation

- **Contract**: Specifies Spell Target Validation semantics and invariants for this unit.
- **For Monster Targets** (`targetMonsterId` != null):
  1. Locate the target monster in `gameSession.monsters` by matching `targetMonsterId`.
  2. Locate the visibility cell for the target monster's coordinates `{x, y}` in `boardVisibilityMap.data`.
  3. IF the visibility cell found has `fog = true`:
     - CANCEL the spell.
     - Trigger `onNotify("Il bersaglio non è visibile!")`.
     - Call `onActionDone()`.
     - RETURN without executing the spell effect.
  4. IF `fog = false`:
     - PROCEED to LOS check via `hasLineOfSight`.
  5. IF `hasLineOfSight` is false:
     - CANCEL the spell.
     - Trigger appropriate "No LOS" notification.
     - RETURN.
  6. IF both `fog = false` AND `hasLineOfSight = true`:
     - PROCEED to spell effect execution.

- **For Hero Targets** (`targetHeroId` != null):
  1. Locate the target hero in `gameSession.heroes` by matching `targetHeroId`.
  2. Locate visibility cell for caster (currentHero) and target hero.
  3. IF both heroes are in the same `valo` OR spell is "Self" type:
     - PROCEED to effect execution.
  4. ELSE:
     - CANCEL spell.
     - Trigger `onNotify("Bersaglio fuori portata!")`.
     - RETURN.

### 🚨 Global Constraints

- MUST preserve component-level determinism across all state transitions and orchestration flows.
- MUST ensure all capability-level mutations respect declared shared state boundaries.
- MUST keep cross-capability outcomes consistent with declared domain references and invariants.

### ✅ Acceptance Criteria

- [ ] Specification is internally consistent (roles, contracts, and constraints do not conflict).
- [ ] Declared capabilities are represented with deterministic behavior.
- [ ] Document is aligned to ISL v1.6.2 conventions.

### 🧪 Test Scenarios

1. **Contract Conformance**:
   - Input: representative valid domain/state inputs
   - Expected: outputs and side effects satisfy declared contracts

2. **Constraint Enforcement**:
   - Input: boundary and invalid inputs
   - Expected: constraints are enforced and violations are handled explicitly

