# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-04-12
**Implementation**: ./dungeon-script-runtime

---

> **Reference**: @GameSession, @HeroState, @MonsterState, @ScriptImage in `./domain-session.isl.md`
> **Reference**: @MapDefinition, @MapCell, @MapScript, @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @CombatResult in `./dungeon-use-combat.isl.md`

## Component: DungeonScriptRuntime

### Role: Business Logic

**Signature**: Pure module exporting deterministic snapshot helpers and the recovered mission-script interpreter.

### Domain Concepts

#### `MissionScriptEvent`

- **Contract**: Enumerates the recovered Dungeon event ids interpreted by the runtime.

- `1`: Movement trigger matched against the previous hero position.
- `2`: Attack trigger matched against monster type and death-state context.
- `3`: Treasure-room search trigger matched against the active hero area.
- `4`: Trap-search trigger matched against the active hero area.
- `5`: Secret-passage-search trigger matched against the active hero area.
- `6`: Mission-start trigger executed during session initialization.
- `7`: Mission-end trigger executed on retreat or victory save paths.
- `8`: Room-entry trigger evaluated after movement changes room.

#### `ScriptConditionKeyword`

- **Contract**: Enumerates the condition opcodes supported by recovered mission scripts.

- `serand`: Random gated branch with execution-scoped memoization by variable id.
- `sestanza`: Room/area gate using `context.roomId` or current hero visibility cell.
- `seogg`: Inventory gate for the active hero.
- `searma`: Equipment gate for the active hero.

#### `ScriptCommandKeyword`

- **Contract**: Enumerates the imperative opcodes supported by the runtime.

- `pospsg`
- `possta`
- `msg`
- `posroc`
- `img`
- `posrocinv`
- `posmostro`
- `posps`
- `posporta`
- `aggogg`
- `aggarma`
- `aggoroid`
- `rimogg`
- `rrndogg`
- `fineturno`
- `aggoro`
- `agghppsg`
- `agghp`
- `att`
- `noatt`
- `noattarma`

#### `DungeonScriptEffects`

- **Contract**: Describes the declarative runtime effects returned to callers together with the mutated session snapshot.

- `attackBlocked`: Attack may not proceed (Boolean) default: false.
- `forceFinishTurn`: Caller must immediately exhaust the current hero turn (Boolean) default: false.
- `movementDelta`: Additional movement delta applied after script execution (Integer) default: 0.
- `stopMovement`: Caller must stop consuming the active path immediately (Boolean) default: false.
- `activeHeroPosition`: Final active hero position after all script side effects (`{x: Integer, y: Integer} | null`).

#### `DungeonScriptResult`

- **Contract**: Describes the pure execution result returned by the runtime.

- `session`: Full mutated game snapshot (@GameSession).
- `handled`: At least one script matched and executed (Boolean).
- `notifications`: Messages to be forwarded by the caller (List of String).
- `revealPoints`: Board points that must be revealed by the caller (List of `{x: Integer, y: Integer}`).
- `effects`: Declarative runtime side effects (@DungeonScriptEffects).

### ⚡ Capabilities

#### buildScriptKey

- **Contract**: Builds a stable identity for one-time scripts so the same recovered entry is not executed twice after persistence.
- **Signature**: `(script: @MapScript, index: Integer) -> String`
- **Flow**:
  - Combine script `index`, `evento`, `x`, `y`, `idmosc`, `morto`, `unavolta`, and raw `text` into a single stable string key.
  - Normalize all numeric and boolean fields using the same loose conversions used by the runtime parser so repaired legacy JSON values remain stable.

#### getRoomIdFromVisibilityMap

- **Contract**: Resolves the room/area id (`valo`) for a board coordinate.
- **Signature**: `(visibilityMap: @VisibilityMap | null, x: Integer, y: Integer) -> String | null`
- **Flow**:
  - Search `visibilityMap.data` for the matching coordinate.
  - IF no cell exists OR `valo` is null RETURN null.
  - RETURN `valo` coerced to String.

#### moveCurrentHeroInSession

- **Contract**: Produces a cloned session snapshot where only the active hero position changes.
- **Signature**: `(session: @GameSession, nextX: Integer, nextY: Integer) -> @GameSession`
- **Flow**:
  - Deep-clone the provided session.
  - Find the active hero by `turnOrder == currentTurn`.
  - IF no active hero exists RETURN the cloned session unchanged.
  - Replace only that hero with a copy at `nextX`, `nextY`.

#### resolveHeroAttackInSession

- **Contract**: Produces a cloned session snapshot with hero attack consequences already applied.
- **Signature**: `(session: @GameSession, { monsterId: Integer, combatResult: @CombatResult, statusesToRemove?: List<String>, consumedWeaponId?: Integer | null }) -> @GameSession`
- **Flow**:
  - Deep-clone the provided session.
  - Resolve the active hero and targeted monster instance by `monsterId`.
  - IF either lookup fails RETURN the cloned session unchanged.
  - Remove `consumedWeaponId` from the active hero `equipped` and `equipment` lists when provided.
  - IF `activeHero.bonusAttackDiceNextHeroAttack` is greater than 0:
    - Set `activeHero.bonusAttackDiceNextHeroAttack` to 0 (consumable attack-dice buff spent on this attack).
  - Subtract `combatResult.damageDealt` from the targeted monster body points.
  - Remove every status in `statusesToRemove` from the targeted monster.
  - IF the monster reaches 0 or fewer body points remove that monster instance entirely.
  - Refresh `lastAttack` with the updated hero, updated monster snapshot, and `combatResult`.

#### executeDungeonScripts

- **Contract**: Executes recovered Dungeon mission scripts against a supplied session snapshot and returns a new snapshot plus caller-facing side effects.
- **Signature**: `({ session: @GameSession, eventType: Integer, context?: Object, visibilityMap?: @VisibilityMap, random?: () -> Number }) -> @DungeonScriptResult`
- **Flow**:
  - Deep-clone the provided `session` so caller state is never mutated in place.
  - Ensure `triggeredScripts` and `scriptImages` are always present as arrays on the cloned session.
  - Initialize `effects` with `attackBlocked = false`, `forceFinishTurn = false`, `movementDelta = 0`, `stopMovement = false`, and `activeHeroPosition` equal to the current active hero position when available.
  - Initialize empty `notifications`, `revealPoints`, and execution-scoped random memoization storage.
  - Iterate `session.currentMap.scripts` in map order.
  - For each script entry, skip it when any of the following is true:
    - `script.evento` does not match `eventType`.
    - `script.text` is empty after trim.
    - `script.unavolta` is true and its `buildScriptKey(...)` is already present in `triggeredScripts`.
    - The event-specific matcher rejects the entry.
  - Mark `handled = true` for every matched script.
  - Parse the raw script text into nested command/condition entries.
  - Execute those parsed entries depth-first against the cloned session.
  - IF the matched script is one-time append its key to `triggeredScripts` unless already present.
  - After all scripts complete, refresh `effects.activeHeroPosition` from the final active hero coordinates.
  - Return `{ session, handled, notifications, revealPoints, effects }`.

#### parserSemantics

- **Contract**: Preserves the quirks of recovered original DG script text instead of imposing a stricter modern syntax.
- **Flow**:
  - Tokenize a statement name by reading until whitespace or `;`.
  - Treat `end` as the closing marker for the current nested condition block.
  - Treat `serand`, `sestanza`, `seogg`, and `searma` as block-opening conditions whose body extends until the matching `end`.
  - Read command arguments until `;`.
  - Also stop the current statement on newline when the following line begins with any known script keyword; this preserves repaired DG data that omitted a `;` before the next command.
  - IF a statement starts with an unknown keyword, coerce the whole statement into an implicit `msg` command so free-text original scripts remain executable.

#### eventMatchingRules

- **Contract**: Reproduces the runtime eligibility rules for each event type before any command is executed.
- **Flow**:
  - Event `1`: Match only when `script.x` and `script.y` equal `context.previousPosition.x` and `context.previousPosition.y`.
  - Event `2`: Match only when `script.idmosc` equals `context.monsterTypeId` and `script.morto` equals `context.onDeath`.
  - Events `3`, `4`, `5`: Match only when the active hero and the script coordinate belong to the same `visibilityMap` room id.
  - Events `3`, `4`, `5`: IF the shared room id is `"1"`, also require that no rock wall (`arnt.antroc`) blocks the straight corridor/path segment between script coordinate and active hero coordinate.
  - Events `6` and `7`: Always match once the generic checks pass.
  - Event `8`: Accept the script generically; finer room gating is expected to be expressed inside the script body through `sestanza` and similar conditions.

#### conditionSemantics

- **Contract**: Evaluates nested script conditions using the same loose legacy coercions as the runtime.
- **Flow**:
  - `serand a,b,c`: Reuse one memoized value per variable id `a` during a single execution run. Generate the value with `floor((b + 1) * random())`; the block executes only when that memoized value equals `c`.
  - `sestanza roomId`: Compare the expected room id against `context.roomId` when provided, otherwise against the active hero visibility cell `valo`.
  - `seogg itemId`: Execute the block only when the active hero inventory contains `itemId`.
  - `searma equipmentId`: Execute the block only when the active hero owned equipment or currently equipped list contains `equipmentId`.

#### commandSemantics

- **Contract**: Applies every supported opcode directly to the cloned session or to the declarative result payload.
- **Flow**:
  - `pospsg x,y,allowOverlap`: Move the active hero to `x,y`; when `allowOverlap` is false and another hero occupies the destination, emit `"Casella occupata spostamento impossibile"` and do nothing else. When `allowOverlap` is true and another hero occupies the destination, also subtract 1 body point from that other hero. Always set `effects.stopMovement = true`, `effects.movementDelta -= 1`, and `effects.activeHeroPosition = {x,y}` when movement succeeds.
  - `possta x,y`: Add `{x,y}` to `revealPoints` unless already present.
  - `msg text`: Append `text` to `notifications` when non-empty.
  - `posroc x,y`: Set `currentMap.grid[x,y].arnt.antroc = true`.
  - `img src,x,y`: Normalize `src` to public-path form with forward slashes and a leading `/`, then append a unique `@ScriptImage` at `x,y`.
  - `posrocinv x,y`: Set `currentMap.grid[x,y].arnt.inv = true`.
  - `posmostro monsterId,x,y`: Mark the target cell as containing monster type `monsterId` and remove any temporary script image already occupying that cell.
  - `posps oriz,x,y`: Mark a secret passage on the target cell with `ps = 1` and `oriz = (oriz == 1)`.
  - `posporta oriz,x,y`: Append a unique door definition at `x,y` with `oriz = (oriz == 1)`.
  - `aggogg itemId`: Append `itemId` to the active hero inventory.
  - `aggarma equipmentId`: Append `equipmentId` to the active hero owned equipment list.
  - `aggoroid heroIndex,goldDelta`: Add `goldDelta` to the hero at array index `heroIndex` when that index exists.
  - `rimogg itemId`: Remove the first matching `itemId` from the active hero inventory.
  - `rrndogg`: Remove one random inventory entry from the active hero when the inventory is not empty.
  - `fineturno`: Set `effects.stopMovement = true` and `effects.forceFinishTurn = true`.
  - `aggoro goldDelta`: Add `goldDelta` to the active hero gold.
  - `agghppsg heroIndex,healthDelta`: Add `healthDelta` to the body points of the hero at array index `heroIndex`, but only if that hero is still alive.
  - `agghp healthDelta`: Add `healthDelta` to the active hero body points, but only if the active hero is still alive.
  - `att`: Explicitly clear any previous attack block by setting `effects.attackBlocked = false`.
  - `noatt`: Set `effects.attackBlocked = true` for the current attack resolution.
  - `noattarma weaponId`: Set `effects.attackBlocked = true` unless the active hero currently has `weaponId` equipped.

### 🚨 Constraints

- Each capability MUST enforce its own transition/decision constraints explicitly.
- Capability-level state changes MUST be bounded and deterministic for equivalent inputs/state.
- Capabilities `MissionScriptEvent`, `ScriptConditionKeyword`, `ScriptCommandKeyword`, `DungeonScriptEffects`, `DungeonScriptResult` MUST avoid undefined side effects outside declared flow and side effects.

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
