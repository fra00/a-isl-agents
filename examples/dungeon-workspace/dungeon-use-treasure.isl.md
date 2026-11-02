# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-treasure

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @MapCellTreasure in `./domain-map.isl.md`
> **Reference**: @useVisibilityCalc in `./dungeon-use-visibility-calc.isl.md`
> **Reference**: @TreasureCard in `./domain-ruleset.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component owns treasure-search flow state while delegating persistent session mutations to the dungeon session boundary.

## Component: useTreasureSearch

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession
- `visibilityMap`: @VisibilityMap
- `onNotify`: (message: String) -> void
- `onActionDone`: () -> void
- `onForceTurnEnd`: () -> void
- `sessionManager`: @useDungeonSessionManager
- `onTreasureCardDrawn`: (card: @TreasureCard) -> void
- `onWanderingMonster`: (x: Integer, y: Integer) -> void

### ⚡ Capabilities

#### internalState

- **Contract**: Stores local treasure-discovery UI state and helper logic without owning persistent session writes.
- `foundTreasures`: List of {x: Integer, y: Integer, img: String} (Stores discovered treasures).
- `visibilityCalc`: @useVisibilityCalc (Hook instance for visibility calculations).

#### searchTreasure

- **Contract**: Scans the current area for treasures.
- **Trigger**: User clicks "Search Treasure".
- **Flow**:
  - IF `gameSession.monsters` is NOT empty:
    - Trigger `onNotify("Non puoi cercare tesori con mostri vicini!")`
    - RETURN.
  - Find current hero in `gameSession.heroes` (turnOrder == currentTurn).
  - Call `sessionManager.executeMissionScripts({ baseSession: gameSession, eventType: 3, visibilityMap })` before scanning static visible treasures.
  - IF the runtime reports `handled` true:
    - IF the runtime reports `forceFinishTurn` true call `onForceTurnEnd()`.
    - ELSE call `onActionDone()`.
    - RETURN.
  - Call `visibilityCalc.calculateVisibleCells(hero.x, hero.y)` to get `visibleCells`.
  - Initialize `treasureFound` as false.
  - Initialize `treasureCollectionFailed` as false.
  - FOR each `cell` in `visibleCells`:
    - Find corresponding `mapCell` in `gameSession.currentMap.grid` at `cell.x`, `cell.y`.
    - IF `mapCell` exists AND `mapCell.tes` is NOT null:
      - Let `hasLoot` = (`mapCell.tes.mon` > 0 OR `mapCell.tes.ogg` > 0 OR `mapCell.tes.arma` > 0 OR `mapCell.tes.trp` > 0).
      - Let `isTreasureSquare` = (`mapCell.tes.ts` == 1).
      - IF `isTreasureSquare` AND NOT `hasLoot`:
        - IF (`mapCell.x`, `mapCell.y`) NOT in `foundTreasures`, add `{x: mapCell.x, y: mapCell.y, img: "tesoro.png"}` to `foundTreasures` so the empty chest is still rendered on the board.
        - Trigger `onNotify("Il tesoro è vuoto.")`.
        - Set `treasureFound` to true.
        - BREAK the loop (consume the search action without `collectTreasureAtCell`, without drawing a treasure card, and without mutating map or hero state).
      - IF `hasLoot`:
        - Check if already found: IF (`mapCell.x`, `mapCell.y`) NOT in `foundTreasures`:
          - Find `currentHero` in `gameSession.heroes` matching `gameSession.currentTurn`.
          - IF `currentHero` is found:
            - Let `didCollectTreasure` = `sessionManager.collectTreasureAtCell(currentHero.heroId, mapCell.x, mapCell.y)`.
            - IF `didCollectTreasure` is true:
              - Set `treasureFound` to true.
              - Add `{x: mapCell.x, y: mapCell.y, img: "tesoro.png"}` to `foundTreasures`.
            - ELSE:
              - Set `treasureCollectionFailed` to true.
              - Trigger `onNotify("Errore durante la raccolta del tesoro.")`.
        - BREAK the loop (only one map treasure pickup per search action).
  - IF `treasureFound` is false AND `treasureCollectionFailed` is false:
    - IF `gameSession.treasureDeck` is not empty:
      - Call `sessionManager.drawTreasureCard()` -> `drawnCard`.
      - IF `drawnCard` is not null:
        - Trigger `onTreasureCardDrawn(drawnCard)`.
    - ELSE:
      - Trigger `onNotify("Nessuna carta tesoro rimasta.")`.
  - Trigger `onActionDone()`.

#### getFoundTreasures

- **Contract**: Returns the list of visible treasures.
- **Return**: `foundTreasures`.

#### applyTreasureEffect

- **Contract**: Applies the effect of a treasure card to the current hero.
- **Signature**: `(card: @TreasureCard)`
- **Flow**:
  - Find `currentHero` in `gameSession.heroes` matching `gameSession.currentTurn`.
  - IF `currentHero` is found:
    - Call `sessionManager.applyTreasureCardEffect(currentHero.heroId, card, onWanderingMonster)`.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities internalState, searchTreasure, getFoundTreasures, applyTreasureEffect MUST avoid undefined side effects outside declared flow and side effects.
- Collectible map loot (`hasLoot`) MUST be applied only through `collectTreasureAtCell`, and `searchTreasure` MUST add a local `foundTreasures` marker only after a successful pickup with loot.
- When `mapCell.tes.ts` == 1 and there is no collectible loot (`hasLoot` is false), `searchTreasure` MUST render the chest marker in local `foundTreasures`, MUST notify `"Il tesoro è vuoto."`, MUST set `treasureFound` so the same action does not draw a treasure card, and MUST NOT call `collectTreasureAtCell` or mutate session state for that branch.

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
