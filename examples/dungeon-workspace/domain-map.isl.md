# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./domain-map

---

> **Reference**: @Monster, @Item, @Equipment in `./domain-ruleset.isl.md`

## Component: GameDomainMap

### Role: Domain

## Domain Concepts

### 📦 Content/Structure

#### `MapDefinition`

- **Contract**: Specifies MapDefinition semantics and invariants for this unit.
Represents the full definition of a game map/mission loaded from JSON.

- `header`: Map metadata (@MapHeader).
- `grid`: The grid of cells composing the map (List of @MapCell).
- `eroi_start`: Starting positions for heroes (List of @MapHeroStart).
- `porte`: List of doors on the map (List of @MapDoor).
- `scripts`: List of event scripts (List of @MapScript).

#### `MapHeader`

- **Contract**: Specifies MapHeader semantics and invariants for this unit.
Metadata for the map.

- `descrizione`: Description text of the mission (String).
- `mostro_uscita`: ID of the monster (@Monster) that must be defeated to complete the mission (Integer, sentinel `-1` means no monster objective).
- `tesoro_finale`: Coordinate of the treasure cell that must be found to complete the mission (@MapObjectiveCoordinate). Sentinel `{ x: 0, y: 0 }` means no final-treasure objective.
- `oggetto_f`: ID of the quest item (@Item) that must be recovered to complete the mission (Integer, sentinel `-1` means no item objective).
- `arma_f`: ID of the quest weapon (@Equipment) that must be recovered to complete the mission (Integer, sentinel `-1` means no weapon objective).
- `merr`: ID of the wandering monster (@Monster) used by the quest when a wandering-monster card is drawn (Integer). Default `1` preserves the historical Orc fallback; sentinel `-1` means the quest uses a special wandering event with no standard monster spawn.
- `nfine`: End condition identifier (Integer).

#### `MapObjectiveCoordinate`

- **Contract**: Specifies MapObjectiveCoordinate semantics and invariants for this unit.
Coordinate of a mission objective cell.

- `x`: X coordinate (Integer).
- `y`: Y coordinate (Integer).

#### `MapCell`

- **Contract**: Specifies MapCell semantics and invariants for this unit.
Represents a single cell in the map grid.

Legacy JSON field names (kept for asset compatibility):

| Field | Meaning |
|-------|---------|
| `arnt` | Area / rock transit blocks |
| `mobili` | Furniture |
| `mostab` | Monster spawn / presence |
| `tes` | Treasure / loot / search square |
| `psgg` | Secret passage |
| `trpl` | Trap |
| `fine` | Exit / end marker |

- `x`: X coordinate (Integer).
- `y`: Y coordinate (Integer).
- `arnt`: Area not transitable properties (@BlockCellArea).
- `mobili`: Furniture properties (@MapCellFurniture).
- `mostab`: Monster properties (@MapCellMonster).
- `tes`: Treasure properties (@MapCellTreasure).
- `psgg`: Secret passage properties (@MapCellPassage).
- `trpl`: Trap properties (@MapCellTrap).
- `fine`: End point indicator (String).

#### `BlockCellArea`

- **Contract**: Specifies BlockCellArea semantics and invariants for this unit.
- `antroc`: Rock block transition (Boolean).
- `inv`: Invisible block transition (Boolean).

#### `MapCellFurniture`

- **Contract**: Specifies MapCellFurniture semantics and invariants for this unit.
- `num`: Furniture ID (Integer nullable).
- `img`: Image filename (String).

#### `MapCellMonster`

- **Contract**: Specifies MapCellMonster semantics and invariants for this unit.
- `mosid`: Monster ID (@Monster) (Integer).
- `mos`: Monster present flag (Boolean).
- `corpo`: Specific body points for this monster instance (Integer).

#### `MapCellTreasure`

- **Contract**: Specifies MapCellTreasure semantics and invariants for this unit.
- `ts`: Board treasure-search square marker (Integer). `1` marks a cell as a designated “search for treasure” spot on the map (it may still be empty when all loot fields are zero); `0` means not a designated treasure square.
- `mon`: Gold amount (Integer).
- `ogg`: Specific item ID (@Item) (Integer).
- `arma`: Specific weapon ID (@Equipment) (Integer).
- `trp`: Trap ID if search fails (Integer).

#### `MapCellPassage`

- **Contract**: Specifies MapCellPassage semantics and invariants for this unit.
- `ps`: Passage ID/Type (Integer?) Default:null
- `oriz`: Orientation (Boolean).

#### `MapCellTrap`

- **Contract**: Specifies MapCellTrap semantics and invariants for this unit.
- `tipo`: Trap type (Integer).
- `rccadex`: X coordinate of falling rock trap (Integer).
- `rccadey`: Y coordinate of falling rock trap (Integer).

#### `MapHeroStart`

- **Contract**: Specifies MapHeroStart semantics and invariants for this unit.
Starting position for a hero.

- `id`: Hero ID (Integer).
- `x`: X coordinate (Integer).
- `y`: Y coordinate (Integer).

#### `MapDoor`

- **Contract**: Specifies MapDoor semantics and invariants for this unit.
Definition of a door.

- `x`: X coordinate (Integer).
- `y`: Y coordinate (Integer).
- `oriz`: Indicates if the door is horizontal (Boolean).

#### `MapScript`

- **Contract**: Specifies MapScript semantics and invariants for this unit.
Event script location and data.

- `x`: X coordinate (Integer).
- `y`: Y coordinate (Integer).
- `text`: Text of the script (String).
- `evento`: Event ID (Integer).
- `unavolta`: Indicates if the script can run only once (Boolean).
- `morto`: Indicates if an attack script must trigger on monster death (Boolean).
- `idmosc`: Monster ID bound to attack events (Integer).

#### `Campaign`

- **Contract**: Specifies Campaign semantics and invariants for this unit.
Represents a campaign definition containing a sequence of missions.

- `nome_campagna`: Name of the campaign (String).
- `missioni`: List of missions in the campaign (List of @Mission).

#### `Mission`

- **Contract**: Specifies Mission semantics and invariants for this unit.
Represents a single mission within a campaign.

- `ordine`: Order of the mission in the campaign (Integer).
- `file`: Filename of the mission map (String).
- `titolo`: Title of the mission (String).

#### `VisibilityMap`

- **Contract**: Specifies VisibilityMap semantics and invariants for this unit.
Represents the visibility/fog-of-war configuration for the game board.

- `source`: Source filename (String).
- `image`: Background image filename (String).
- `data`: List of visibility data for each cell (List of @VisibilityCell).

#### `VisibilityCell`

- **Contract**: Specifies VisibilityCell semantics and invariants for this unit.
Represents visibility properties for a specific grid coordinate.

- `x`: X coordinate (Integer).
- `y`: Y coordinate (Integer).
- `valo`: Room/Area ID this cell belongs to (String).
- `vis1`: ID of the first area visible from this cell (String).
- `vis2`: ID of the second area visible from this cell (String).
- `fog`: cell is under fog of war (boolean) default true

#### `GameScript`

- **Contract**: Specifies GameScript semantics and invariants for this unit.
Represents an interactive script action.

- `command`: The instruction command (e.g., aggoro, merr) (String).
- `params`: Associated numeric value (Integer).
- `isOneTime`: Indicates if the script is removed after execution (Boolean).

### 🚨 Constraints

- Each declared domain construct MUST preserve its own identity/property invariants.
- Domain-level definitions MUST reject contradictory or ambiguous semantics at the capability scope.
- Domain capabilities `MapDefinition`, `MapHeader`, `MapObjectiveCoordinate`, `MapCell`, `BlockCellArea` MUST remain deterministic for equivalent domain inputs.

### 🚨 Global Constraints

- The component MUST provide one coherent domain vocabulary across all declared entities and structures.
- Cross-entity relationships and invariants MUST remain globally consistent within the component.
- The domain component MUST remain implementation-agnostic and free from UI orchestration concerns.

### ✅ Acceptance Criteria

- [ ] Capability-level domain constraints are explicit and non-contradictory.
- [ ] Component-level domain invariants remain consistent across all declared structures.
- [ ] Domain scope remains independent from UI/infra implementation choices.

### 🧪 Test Scenarios

1. **Capability Constraint - Domain Invariant**:
   - Target: first declared domain capability
   - Input: representative domain values including edge/boundary cases
   - Expected: invariant-preserving deterministic outcome

2. **Capability Constraint - Ambiguity Rejection**:
   - Target: domain capability-level semantics
   - Input: conflicting or incomplete domain definition case
   - Expected: explicit rejection or normalized deterministic interpretation

3. **Global Constraint - Vocabulary Coherence**:
   - Target: full domain component
   - Input: cross-reference usage across all entities
   - Expected: globally coherent identities, relationships, and terminology
