# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./domain-ruleset

---

## Component: GameDomainRuleset

### Role: Domain

## Domain Concepts

### 📦 Content/Structure

#### `Hero`

- **Contract**: Specifies Hero semantics and invariants for this unit.
Represents a playable hero character definition.

- `id`: Unique identifier (Integer).
- `classe`: Name of the hero class (String).
- `attacco`: Attack value (Integer).
- `difesa`: Defense value (Integer).
- `movimento`: Movement value (Integer).
- `mente`: Mind points (Integer).
- `corpo`: Body points (Integer).
- `miniature`: Image filename for the hero miniature (String).
- `miniatureDeath`: Image filename for the dead hero miniature (String).
- `portrait`: Image filename for the hero portrait (String).

#### `Monster`

- **Contract**: Specifies Monster semantics and invariants for this unit.
Represents a monster definition.

- `id`: Unique identifier (Integer).
- `nome`: Name of the monster (String).
- `movimento`: Movement value (Integer).
- `attacco`: Attack value (Integer).
- `difesa`: Defense value (Integer).
- `corpo`: Body points (Integer).
- `mente`: Mind points (Integer).
- `immagine`: Image filename (String).
- `immalarge`: Large image filename (String).
- `nonmorto`: Indicates if the monster is undead (Boolean).

#### `Equipment`

- **Contract**: Specifies Equipment semantics and invariants for this unit.
Represents an equipment item definition.

- `id`: Unique identifier (Integer).
- `nome`: Name of the equipment (String).
- `dadatt`: Attack dice number (Integer).
- `daddif`: Defense dice number (Integer).
- `daddifex`: Extra defense dice (Integer).
- `numdadicontr`: Attack dice counter when attacking specific monsters (Integer).
- `targetMonster`: ID(s) of the monster(s) that trigger `numdadicontr` (Integer or String for multiple IDs).
- `doppioatt`: Allows double attack (Boolean).
- `mosdoppio`: ID of the monster(s) that trigger `doppioatt` (Integer).
- `puntimente`: Mind points bonus (Integer).
- `doppiamag`: Allows double magic usage (Boolean).
- `movim`: Movement number dice modifier (-1 remove one dice) (Integer).
- `noogg`: Incompatible equipment ID (e.g. 11 for Shield) (Integer).
- `diago`: Allows diagonal attacks (Boolean).
- `tiro`: Allows ranged attacks (Boolean).
- `tirounavo`: Single use thrown weapon (Boolean).
- `disinnesc`: Allows disarming traps (Boolean).
- `nopsg`: Forbidden for specific character class (@Hero) (Boolean).
- `nopsgid`: ID of the forbidden character class (@Hero) (Integer).
- `solopsg`: Exclusive to specific character class (@Hero) (Boolean).
- `solopsgid`: ID of the exclusive character class (@Hero) (Integer).
- `prezzo`: Cost in gold (Integer).
- `immagine`: Image filename (String).

#### `Item`

- **Contract**: Specifies Item semantics and invariants for this unit.
Represents a consumable item or special object definition.

- `id`: Unique identifier (Integer).
- `nome`: Name of the item (String).
- `hp`: Health points modifier (Integer).
- `mp`: Mind points modifier (Integer).
- `targetType`: "Self" | "Monster" (Determines if the item is used on self or targeted at an enemy).
- `movimento`: Movement modifier (Integer).
- `attacco`: Attack modifier (Integer).
- `difesa`: Defense modifier (Integer).
- `natt`: Number of attacks modifier (Integer).
- `acqua`: Indicates if the item is holy water (Boolean).
- `danni`: Damage value (Integer).

#### `Spell`

- **Contract**: Specifies Spell semantics and invariants for this unit.
Represents a magic spell definition.

- `id`: Unique identifier (Integer).
- `nome`: Name of the spell (String).
- `elemento`: "Fuoco" | "Acqua" | "Aria" | "Terra".
- `descrizione`: Text effect description (String).
- `immagine`: Image filename for the card face (String).
- `dorso`: Image filename for the card back (String).
- `targetType`: "Self" | "Hero" | "Monster" | "Point" | "Door".
- `effetto`: Internal logic key for the effect (String).
- `valore`: Numeric value associated with the effect (Integer).

#### `TreasureCard`

- **Contract**: Specifies TreasureCard semantics and invariants for this unit.
Represents a treasure card definition.

- `id`: Unique identifier (Integer).
- `effetto`: Effect script or code (String).
- `azione`: Action type identifier (String) can be: ("mostro_errante"|"aggiungi_oggetto"|"aggiungi_oro"|"modifica_hp"|"nessuna"|"trappola_e_fine").
- `valore`: Value associated with the action (Integer).
- `immagine`: Image filename (String).

### 🚨 Constraints

- Each declared domain construct MUST preserve its own identity/property invariants.
- Domain-level definitions MUST reject contradictory or ambiguous semantics at the capability scope.
- Domain capabilities `Hero`, `Monster`, `Equipment`, `Item`, `Spell` MUST remain deterministic for equivalent domain inputs.

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
