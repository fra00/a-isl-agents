# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./dungeon-use-secret-passages

---

> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @MapCellPassage in `./domain-map.isl.md`
> **Reference**: @useVisibilityCalc in `./dungeon-use-visibility-calc.isl.md`
> **Reference**: @useDungeonSessionManager in `./dungeon-use-session-manager.isl.md`

## Domain Concepts

- `foundPassages`: Runtime collection of secret passages already revealed to the player and still eligible for rendering when visible.

## Component: useSecretPassages

### Role: Business Logic

**Signature**:

- `gameSession`: @GameSession
- `visibilityMap`: @VisibilityMap
- `onNotify`: (message: String) -> void (Callback to show notification).
- `onActionDone`: () -> void (Callback to mark turn action as done).
- `onForceTurnEnd`: () -> void (Callback to exhaust the current turn immediately when a mission script requests it).
- `sessionManager`: @useDungeonSessionManager

### ⚡ Capabilities

#### internalState

- **Contract**: Stores locally revealed secret passages while leaving persistent mission mutations to the dungeon session boundary.
- `foundPassages`: List of {x: Integer, y: Integer, img: String} (Stores discovered secret passages).
- `visibilityCalc`: @useVisibilityCalc (Hook instance for visibility calculations).

#### searchPassages

- **Contract**: Scans visible area for secret passages and marks them as discovered if adjacent to revealed cells.
- **Trigger**: User clicks "Cerca Passaggi" during hero turn.
- **Flow**:
  - Call `sessionManager.executeMissionScripts({ baseSession: gameSession, eventType: 5, visibilityMap })` before normal secret-passage discovery.
  - Let `activeSession` = the script result session when scripts were handled, otherwise `gameSession`.
  - Find current hero in `gameSession.heroes` (turnOrder == currentTurn).
  - Call `visibilityCalc.calculateVisibleCells(hero.x, hero.y)` to get `visibleCells`.
  - Initialize `foundInThisSearch` as false.
  - Iterate through all potential passages in `activeSession.currentMap.grid` (cells where `psgg.ps > 0`).
  - FOR EACH `potentialPassage`:
    - Let `px` = `potentialPassage.x`, `py` = `potentialPassage.y`.
    - // Determine if this passage is adjacent to any currently visible cell.
    - Let `isDiscoverable` = false.
    - IF `potentialPassage.psgg.oriz` is true (Horizontal):
      - IF `{x: px, y: py-1}` OR `{x: px, y: py+1}` is in `visibleCells`: Set `isDiscoverable` to true.
    - ELSE (Vertical):
      - IF `{x: px-1, y: py}` OR `{x: px+1, y: py}` is in `visibleCells`: Set `isDiscoverable` to true.
    - IF `isDiscoverable` is true AND `{x: px, y: py}` NOT in `foundPassages`:
      - Determine Image:
        - IF `potentialPassage.psgg.oriz` is true THEN `img` = "pso.png".
        - ELSE `img` = "psv.png".
      - Add {x: px, y: py, img: img} to `foundPassages`.
      - Set `foundInThisSearch` to true.
  - IF the mission script result is `handled` true:
    - Persist any newly discoverable passages from `activeSession` into local `foundPassages`.
    - IF the runtime requests `forceFinishTurn`, trigger `onForceTurnEnd()`.
    - ELSE trigger `onActionDone()`.
    - RETURN.
  - IF `foundInThisSearch` is true:
    - Trigger `onNotify("Hai trovato un passaggio segreto!")`.
    - Trigger `onActionDone()`.
  - ELSE:
    - Trigger `onNotify("Nessun passaggio segreto trovato.")`.
    - Trigger `onActionDone()`.

#### getFoundPassages

- **Contract**: Returns the list of visible secret passages.
- **Signature**: getFoundPassages(): { visiblePassages: [{x:int, y:int, img:string}] }
- **Flow**:
  - Initialize `visiblePassages` as an empty list.
  - FOR EACH `passage` in `foundPassages`:
    - Let `isVisible` = false.
    - // A passage is visible if its own cell OR either side of its boundary is revealed.
    - Let `cellsToCheck` = List containing `{x: passage.x, y: passage.y}`.
    - IF `passage.oriz` is true: Add `{x: x, y: y-1}` and `{x: x, y: y+1}` to `cellsToCheck`.
    - ELSE: Add `{x: x-1, y: y}` and `{x: x+1, y: y}` to `cellsToCheck`.
    - FOR EACH `coord` in `cellsToCheck`:
      - Find `visCell` in `boardVisibilityMap.data` matching `coord.x` and `coord.y`.
      - IF `visCell` exists AND `visCell.fog` is false: Set `isVisible` to true AND BREAK.
    - IF `isVisible` is true: Add `passage` to `visiblePassages`.

  - RETURN `visiblePassages`.

### 🚨 Constraints

- **searchPassages MUST NOT execute if any monster is currently visible to the active hero.** (Precondition: filter visible monsters; cancel action with message if any exist.)
- Discovered passages are persisted in `foundPassages` and remain visible across future hero turns.
- A passage is discoverable ONLY if it is adjacent to a cell that is already revealed (fog == false).
- Only hero actions (explicit user click on "Cerca Passaggi") trigger discovery; monsters cannot discover passages.

### ⚙ Logic & Execution Rules (operational semantics — normative execution constraints)

#### Adjacency Definition

- **Contract**: Specifies Adjacency Definition semantics and invariants for this unit.
- A secret passage (cell at x, y) is adjacent to visible cells if:
  - For horizontal passage: cells at (x, y-1) or (x, y+1) have fog == false
  - For vertical passage: cells at (x-1, y) or (x+1, y) have fog == false

#### Discovery Persistence

- **Contract**: Specifies Discovery Persistence semantics and invariants for this unit.
- Once a passage is added to `foundPassages`, it persists across all future turns until the mission ends.
- Passages discovered via mission script (eventType: 5) are applied immediately without adjacency checks.

#### State Consistency

- **Contract**: Specifies State Consistency semantics and invariants for this unit.
- `foundPassages` in memory MUST match what is displayed on the board via `getFoundPassages()`.
- If a passage cell becomes fogged again (dynamic fog changes), the passage remains in `foundPassages` but is not rendered.

### 🚨 Global Constraints

- MUST preserve component-level determinism across all state transitions and orchestration flows.
- MUST ensure all capability-level mutations respect declared shared state boundaries.
- MUST keep cross-capability outcomes consistent with declared domain references and invariants.

### ✅ Acceptance Criteria

- Passage discovery succeeds only when adjacent to revealed cells.
- Discovered passages persist and are visible until mission end.
- No new passages are discovered if any monster is visible.
- Mission script discovery (eventType: 5) bypasses adjacency rules.
- UI correctly hides passages when their adjacent cells are fogged.

### 🧪 Test Scenarios

#### No Visible Monsters

- **Contract**: Specifies No Visible Monsters semantics and invariants for this unit.
- Given: Hero at (5, 5), no visible monsters, passage at (6, 5) adjacent to revealed cell (6, 4)
- When: User clicks "Cerca Passaggi"
- Then: Passage is discovered and added to `foundPassages`

#### Visible Monster Present

- **Contract**: Specifies Visible Monster Present semantics and invariants for this unit.
- Given: Hero at (5, 5), visible monster at (7, 7), passage at (6, 5) adjacent to revealed cell
- When: User clicks "Cerca Passaggi"
- Then: Action is cancelled with notification "Non puoi cercare con i mostri visibili!"
