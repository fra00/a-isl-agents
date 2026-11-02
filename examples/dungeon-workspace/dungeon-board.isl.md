# Project: Dungeon React

**Version**: 1.0.2
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./dungeon-board

---

> **Reference**: @PageNavigationEnum in `./domain-core.isl.md`
> **Reference**: @GameSession in `./domain-session.isl.md`
> **Reference**: @MapDefinition, @VisibilityMap in `./domain-map.isl.md`
> **Reference**: @HeroState, @MonsterState in `./domain-session.isl.md`
> **Reference**: @Hero, @Monster in `./domain-ruleset.isl.md`
> **Reference**: @Spell in `./domain-ruleset.isl.md`
> **Reference**: @useDungeonFurniture in `./dungeon-use-furniture.isl.md`
> **Reference**: @useDungeonDoors in `./dungeon-use-doors.isl.md`
> **Reference**: @useDungeonVisibleMonsters in `./dungeon-use-visible-monsters.isl.md`
> **Reference**: @useVisibilityCalc in `./dungeon-use-visibility-calc.isl.md`

## Domain Concepts

- `triggeredTraps`: Visible trap markers already revealed on the board, including detected traps that remain active until disarmed or triggered.

## Component: DungeonBoard

### Role: Presentation

**Signature**:

- `gameSession`: @GameSession (Current session state).
- `boardVisibilityMap`: @VisibilityMap (The calculated visibility map with fog status passed from parent).
- `onCellClick`: (x: Integer, y: Integer) -> void (Callback when a cell is clicked).
- `onCellHover`: (x: Integer, y: Integer) -> void (Callback when a cell is hovered).
- `onMonsterClick`: (monsterId: Integer) -> void (Callback when a monster is clicked).
- `hoveredPath`: List of {x, y} (Path to highlight).
- `hoveredPathVariant`: "valid" | "blocked-by-second-wall" | null (Visual state for the currently previewed movement path).
- `secretPassages`: List of {x: Integer, y: Integer, img: String} (List of discovered secret passages).
- `treasures`: List of {x: Integer, y: Integer, img: String} (List of discovered treasures).
- `triggeredTraps`: List of {x: Integer, y: Integer, tipo: Integer} (List of traps that have been activated).
- `targetingSpell`: @Spell (The spell currently being targeted, null if none).
- `visibilityCalc`: @useVisibilityCalc (Hook instance for LOS calculation).

### 🔍 Appearance

- **Layout**: Relative container width 884px and height 646px of the board dimensions center content vertically and horizzontaly (no padding, no border, no margin). The board container MUST use hidden overflow so any mist content extending beyond the board edges stays clipped.
- **Board**: The board image `/img/tabellone/default.bmp` (884x646px) as the bottom background layer.
- **Fog of war**: no border. Fogged cells stay black, while two slow mist image layers drift over the entire board, with the second image rotated by 180 degrees. The mist layers MUST extend beyond the board bounds so the moving image borders never become visible.
- **Atmosphere Pass**: The board SHOULD add a subtle vignette and inner grading so the edges feel deeper and the center remains slightly warmer, without reducing tactical readability.

### 📦 Content

- **Board Image**: Displays `/img/tabellone/default.bmp`.
- **Grid**: Absolute Overlay container (top:0, left:0) covering the entire board.
  - **Visibility**: Use `boardVisibilityMap` prop (@VisibilityMap).
  - **Cells**: Divs representing the grid squares (26x19 0-indexed) width:34px, height:34px.
    - **Cursor**:
      - IF `targetingSpell` is NOT null AND (`targetingSpell.targetType` IN ["Point", "Door"] OR `targetingSpell.effetto` == "Genio") THEN `cursor-crosshair`.
      - ELSE IF `targetingSpell` is NOT null THEN `cursor-default`.
      - ELSE `cursor-pointer`.
    - **Fog of War Layer**: Each cell MUST render a black background overlay by default.
    - **Mist Effect**: The board MUST render two global `/img/mist.jpeg` layers over the entire board area.
    - **Mist Layering**:
      - The mist layers MUST be rendered as a dedicated global overlay and MUST NOT be rendered inside individual cells.
      - The mist layers MUST be stacked ABOVE the per-cell black fog overlays.
      - The mist layers MUST remain visible on top of both fogged and revealed cells.
      - A fogged cell MUST appear as black fog with moving mist above it, never as flat black only.
      - The mist layers SHOULD remain BELOW entity tokens, interaction highlights, and the targeting tracer unless a more specific visual rule overrides this order.
    - **Mist Geometry**:
      - Each mist layer MUST be positioned with `top: -100px` and `left: -100px`.
      - Each mist layer MUST use `width: calc(100% + 200px)` and `height: calc(100% + 200px)`.
      - Each mist layer MUST use `background-repeat: no-repeat`, `background-position: center`, and `background-size: 100% 100%`.
      - Each mist layer MUST remain clipped by the board container hidden overflow so the image borders stay outside the visible board area.
    - **Mist Opacity**: Both mist layers MUST use opacity `0.1`.
    - **Mist Rotation**: The second mist layer MUST be rotated by 180 degrees.
    - **Mist Motion**: Both mist layers MUST move slowly but remain visibly animated during normal gameplay.
    - **Mist Animation Parameters**:
      - The first mist layer MUST animate with keyframes `translate3d(-28px, -18px, 0)` to `translate3d(16px, 12px, 0)` to `translate3d(34px, -20px, 0)` over `14s` with `ease-in-out`, `infinite`, and `alternate`.
      - The second mist layer MUST animate with keyframes `rotate(180deg) translate3d(-32px, 18px, 0)` to `rotate(180deg) translate3d(14px, -12px, 0)` to `rotate(180deg) translate3d(30px, 22px, 0)` over `18s` with `ease-in-out`, `infinite`, and `alternate`.
    - **Unfogging Logic**: The black overlay MUST disappear ONLY IF the corresponding cell in `boardVisibilityMap.data` (matching x+1, y+1) has `fog` set to `false`. The mist layers remain global and visible across both revealed and fogged areas.
    - **Layer Order**: The visual stack MUST be, from back to front: board background, per-cell black fog overlays, global mist overlay, board entities, targeting tracer.
    - **Ambient Grading**: The board SHOULD add a faint global amber-to-shadow grading above the board image and below gameplay entities, creating a stronger dungeon atmosphere while leaving cells readable.
    - **Path Highlight**:
      - IF cell {x+1, y+1} is in `hoveredPath` AND `hoveredPathVariant` == "valid", add a semi-transparent green overlay.
      - IF cell {x+1, y+1} is in `hoveredPath` AND `hoveredPathVariant` == "blocked-by-second-wall", add a semi-transparent red overlay.
      - This preview MUST remain visible even when the destination cell is fogged, provided the path itself is being previewed by movement logic.
    - **Targeting Highlight**:
      - IF `targetingSpell` is NOT null:
        - Let `activeHero` = Hero in `gameSession.heroes` where `turnOrder` == `gameSession.currentTurn` AND `currentBody` > 0.
        - Let `hasLOS` = `visibilityCalc.hasLineOfSight(activeHero.x, activeHero.y, x + 1, y + 1)`.
        - IF `targetingSpell.effetto` == "Genio" AND cell contains a Monster or a closed Door: add a pulsing blue/purple border or overlay (bg-blue-500/30 animate-pulse).
        - ELSE IF mouse is over a valid target for the current `targetingSpell.targetType`:
          - IF `hasLOS` is true: add a stronger highlight (bg-blue-400/50).
          - ELSE: add a red warning highlight (bg-red-500/40).
- **Furniture**: Visual elements for map furniture.
  - **Data Source**: Derive `visibleFurniture` using `useDungeonFurniture(@GameSession, @VisibilityMap)`.
  - **Render**: Image at x,y coordinates(start from 1). Src: `/img/mobili/` + `img`. Use intrinsic asset dimensions; do not force 34x34 scaling. Static board entities SHOULD cast a soft drop shadow so they feel grounded on the board.
- **Doors**: Visual elements for map doors.
  - **Data Source**: Derive `visibleDoors` using `useDungeonDoors(@GameSession, @VisibilityMap)`.
  - **Render**: Image at x,y coordinates(start from 1). Src: `/img/cell/` + `img`. Use intrinsic asset dimensions; do not force 34x34 scaling. Static board entities SHOULD cast a soft drop shadow so they feel grounded on the board.
- **Monsters**: Visual tokens for `@GameSession.monsters` (@MonsterState) at their x,y coordinates (start from 1).
  - **Data Source**: Derive `visibleMonsters` using `useDungeonVisibleMonsters(@GameSession, @VisibilityMap)`.
  - **Image**: `/img/mostri/` + `@MonsterState.monster.immagine` (max-width:34px).
  - **Hover Label**:
    - Hovering a visible monster token MUST show immediate UI feedback including current monster HP and current Mind points.
    - The hover label MUST include `@MonsterState.currentBody` and SHOULD include max HP reference `@MonsterState.monster.corpo` when available.
    - The hover label MUST include `@MonsterState.currentMind` and SHOULD include max Mind reference `@MonsterState.monster.mente` when available.
    - Hovering a visible monster token MUST also show the monster name (`@MonsterState.monster.nome`).
    - The label can be rendered through native tooltip/title or an equivalent lightweight hover tooltip, but it MUST be readable without opening other panels.
    - If `monster.nome` is missing or empty, fallback label MUST be `"Mostro"`.
  - **Cursor**:
    - IF `targetingSpell` is NOT null AND (`targetingSpell.targetType` == "Monster" OR `targetingSpell.effetto` == "Genio") THEN `cursor-crosshair`.
    - ELSE IF `targetingSpell` is NOT null THEN `cursor-default`.
    - ELSE `cursor-pointer`.
  - **Status Effects**:
    - IF `@MonsterState.activeStatus` contains "Sleep":
      - Apply a pulsing blue outer glow (aura) and a small "Zzz" icon overlay.
    - IF `@MonsterState.activeStatus` contains "Tempest":
      - Apply a pulsing gray swirling outer glow (aura/vortex).
    - IF `@MonsterState.activeStatus` contains "Entangled":
      - Apply a green web overlay icon.
- **Secret Passages**: Visual elements for discovered secret passages.
  - **Data Source**: `secretPassages` prop.
  - **Render**: Image at x,y coordinates (start from 1). Src: `/img/cell/` + `img`. Use intrinsic asset dimensions; do not force 34x34 scaling. Static board entities SHOULD cast a soft drop shadow so they feel grounded on the board.
- **Treasures**: Visual elements for discovered treasures.
  - **Data Source**: `treasures` prop.
  - **Render**: Image at x,y coordinates (start from 1). Src: `/img/cell/` + `img`. Use intrinsic asset dimensions; do not force 34x34 scaling. Static board entities SHOULD cast a soft drop shadow so they feel grounded on the board.
- **Script Images**: Temporary overlays created by mission scripts.
  - **Data Source**: `gameSession.scriptImages`.
  - **Render**: Image at x,y coordinates (start from 1) using `src` exactly as stored in session state.
  - **Visibility Rule**: Render only when the related board cell is currently visible (`fog == false`).
- **Activated Traps**: Visual elements for triggered traps.
  - **Data Source**: `triggeredTraps` prop.
  - **Render**:
    - IF `tipo` == 1 (Abisso) THEN Image at x,y with Src: `/img/cell/caduta.png`, using intrinsic asset dimensions.
    - IF `tipo` == 2 (Lancia) THEN Image at x,y with Src: `/img/cell/lancia.png`, using intrinsic asset dimensions.
    - IF `tipo` == 3 (Masso cadente) THEN Image at x,y with Src: `/img/cell/rocciacad.png`, using intrinsic asset dimensions.
  - Triggered trap markers SHOULD cast a soft drop shadow so they remain legible over the board texture.
- **Heroes**: Visual tokens for **living** `@GameSession.heroes` (`currentBody` greater than 0) at their x,y coordinates (start from 1). Defeated heroes MUST NOT render a board token.
  - **Image**: `/img/eroi/` + `@Hero.miniature` (max-width:34px).
  - **Depth**: Hero tokens SHOULD use a soft shadow to separate them from the board artwork.
  - **Body Points Indicator**:
    - Render the current hero body points as a compact badge on the hero token using `@HeroState.currentBody` and `@Hero.corpo`.
    - The badge MUST update when `currentBody` changes so healing and damage are visible immediately on the board.
    - The hero token tooltip/title SHOULD expose the same `currentBody` / max body information.
  - **square selection**: square selection on the current hero who has the turn where (`@GameSession.currentTurn` == `@HeroState.turnOrder`)
  - **Turn Aura**: The active hero SHOULD also receive a soft amber ground glow so the current turn reads immediately even before the square border is noticed.
  - **Targeting Interaction**:
    - IF `targetingSpell.targetType` == "Hero", hovering a hero token MUST update the same targeting preview used for the underlying board cell.
    - IF `targetingSpell.targetType` == "Hero", clicking a hero token MUST forward selection using that hero's board coordinates exactly as if the underlying cell had been clicked.
    - Hero tokens MUST NOT swallow click or hover events needed to target hero-only spells.
  - **Cursor**:
    - IF `targetingSpell` is NOT null AND `targetingSpell.targetType` == "Hero" THEN `cursor-crosshair`.
    - ELSE `cursor-default`.
  - **Status Effects**:
    - IF `@HeroState.activeStatus` contains "FoggyMist":
      - Apply 50% opacity and a pulsing white outer glow (aura).
    - IF `@HeroState.activeStatus` contains "RockSkin":
      - Apply a pulsing gray/brown outer glow (aura).
    - IF `@HeroState.activeStatus` contains "Courage":
      - Apply a pulsing red/orange outer glow (aura).
    - IF `@HeroState.activeStatus` contains "WallPass":
      - Apply a pulsing earthy amber glow (aura) so Passapareti is immediately visible on the target hero.
    - IF `@HeroState.activeStatus` contains "InvisiblePassage":
      - Apply a pulsing cyan glow (aura).
  - **Style**: Apply CSS transition `top 0.3s linear, left 0.3s linear` to the container for smooth movement.
- **Targeting Tracer**:
  - Visible ONLY IF `targetingSpell` is NOT null AND `hoveredCell` is NOT null.
  - Let `activeHero` = Hero in `gameSession.heroes` where `turnOrder` == `gameSession.currentTurn` AND `currentBody` > 0.
  - **Color**:
    - IF `targetingSpell.effetto` == "Genio" THEN magic-blue (Genie ignores Line of Sight).
    - ELSE IF `visibilityCalc.hasLineOfSight(activeHero.x, activeHero.y, hoveredCell.x + 1, hoveredCell.y + 1)` is false THEN red.
    - ELSE magic-blue.
  - Render an SVG line overlay connecting the center of `activeHero` to the center of the `hoveredCell`.
  - Style: Thin dashed line with a pulsing glow, a brighter outer bloom, and a circular reticle on the hovered target cell.
- **Immediate Attack Feedback**:
  - IF `gameSession.lastAttack` is available:
    - Render a short-lived warm pulse near the attacker position.
    - Render a pulsing impact ring on the defender position.
    - Display a small floating badge over the defender showing either `-N HP` or `Parata` when damage is zero.

### ⚡ Capabilities

#### internalState

- **Contract**: Tracks local hover state used by board interactions and targeting preview.

- `hoveredCell`: {x: Integer, y: Integer} | null (Coordinates of the cell currently under the mouse for targeting preview).

#### initialize

- **Contract**: Sets isLoaded to true when `@VisibilityMap` is available.
- **Trigger**: On Mount or when `boardVisibilityMap` changes.

#### onCellClick

- **Contract**: Trigger `onCellClick` callback with 1-indexed coordinates.
- **Trigger**: When a cell is clicked.
- **Flow**:
  - Convert 0-indexed (x, y) to 1-indexed by adding 1.
  - Trigger `onCellClick(x + 1, y + 1)`.

#### onCellHover

- **Contract**: Trigger `onCellHover` callback with 1-indexed coordinates.
- **Trigger**: When a cell is hovered.
- **Flow**:
  - Set `hoveredCell` to {x, y}.
  - Convert 0-indexed (x, y) to 1-indexed by adding 1.
  - Trigger `onCellHover(x + 1, y + 1)`.

#### onHeroTargetHover

- **Contract**: Keeps hero-target spell preview active when the pointer is over a hero token instead of the empty grid.
- **Trigger**: Pointer enters a hero token while `targetingSpell.targetType` == "Hero".
- **Flow**:
  - Convert hero token board coordinates from 1-indexed to 0-indexed.
  - Set `hoveredCell` to the hero token cell.
  - Trigger `onCellHover` using the hero token coordinates as 1-indexed board coordinates.

#### onHeroTargetClick

- **Contract**: Selects a hero-target spell target by clicking the hero token directly.
- **Trigger**: Hero token click while `targetingSpell.targetType` == "Hero".
- **Flow**:
  - Prevent the hero token from blocking the board click flow.
  - Forward the hero token coordinates through `onCellClick` as 1-indexed board coordinates.
  - The forwarded coordinates MUST be identical to the underlying grid cell coordinates.

#### onMouseLeaveBoard

- **Contract**: Clears targeting visualization when the mouse leaves the board area.
- **Trigger**: When the mouse leaves the grid container.
- **Flow**:
  - Set `hoveredCell` to null.

#### handleMonsterHover

- **Contract**: Show immediate monster hover feedback with name, HP, and Mind (current and optional maxima).
- **Trigger**: When a monster token is hovered.
- **Flow**:
  - Resolve hovered monster label from `@MonsterState.monster.nome`.
  - Resolve hovered monster HP from `@MonsterState.currentBody` and optional max from `@MonsterState.monster.corpo`.
  - Resolve hovered monster Mind from `@MonsterState.currentMind` and optional max from `@MonsterState.monster.mente`.
  - Display a lightweight tooltip/title anchored to the token containing name + HP + Mind.
  - IF resolved name label is null/empty, display fallback label `"Mostro"` while preserving HP and Mind display.
  - IF `targetingSpell` is NULL:
    - Show "Attackable" status and change cursor to indicate physical attack.

### 🚨 Constraints

- Each capability MUST honor its declared trigger and contract without hidden side effects.
- Capability-level interactions MUST be null-safe and reject invalid UI/input states explicitly.
- Capabilities internalState, initialize, onCellClick, onCellHover, onHeroTargetHover MUST remain deterministic for equivalent props/state and user actions.
- Monster token hover MUST expose at least the monster name in UI feedback (tooltip/title or equivalent), without requiring clicks.
- Monster token hover MUST preserve HP and Mind visibility (`currentBody` / `currentMind`, each with optional `/max` from `monster.corpo` / `monster.mente`) and MUST NOT regress to name-only feedback.

### 🚨 Global Constraints

- MUST keep UI behavior consistent with declared capabilities and triggers.
- MUST NOT embed business/domain decisions that belong to Backend or Business Logic components.
- MUST preserve interaction determinism for equivalent user actions and state.
- The outer wrapper div containing hero and monster tokens MUST have `pointer-events: none` (CSS class `pointer-events-none`) so that mouse events pass through to the underlying grid cells. Individual hero and monster token elements MUST have `pointer-events: auto` (CSS class `pointer-events-auto`) to remain independently interactive. Failure to apply `pointer-events-none` on the wrapper causes grid cell `onMouseEnter`/`onClick` events to be silently swallowed for all empty cells, breaking movement path preview and board interaction entirely.

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

4. **Monster Hover Label Regression**:
   - Target: Monsters rendering + `handleMonsterHover`
   - Input: visible monster token with `monster.nome = "Orco"`, `currentBody = 4`, `monster.corpo = 8`, `currentMind = 2`, `monster.mente = 3`
   - Expected: hover feedback shows `"Orco"`, HP (4/8 or equivalent), and Mind (2/3 or equivalent) immediately; if name is missing, fallback `"Mostro"` is shown while HP and Mind remain visible
