# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-14
**Implementation**: ./domain-spells-data

---

> **Reference**: Spell in `./domain-ruleset.isl.md`

## Domain Concepts

### 📦 Content/Structure

- This component is the authoritative catalog of spell metadata shown in UI and consumed by game logic.

## Component: GameSpellsData

### Role: Domain

### 📦 Content/Structure

#### `staticSpells`

- **Contract**: Static authoritative list of the 12 spell definitions available in the game, including targeting metadata and player-facing descriptions.

La lista autoritativa dei 12 incantesimi disponibili nel gioco.

- **Fuoco** (Set 1):
  - **1**: { nome: "Palla di Fuoco", elemento: "Fuoco", targetType: "Monster", effetto: "Palla di Fuoco", valore: 2, immagine: "Fuoco01.png", dorso: "Fuoco00_Dorso.png", descrizione: "Infligge 2 danni diretti a un mostro." }
  - **2**: { nome: "Frecce di Fuoco", elemento: "Fuoco", targetType: "Monster", effetto: "Frecce di Fuoco", valore: 1, immagine: "Fuoco02.png", dorso: "Fuoco00_Dorso.png", descrizione: "Infligge 1 danno diretto a un mostro." }
  - **3**: { nome: "Coraggio", elemento: "Fuoco", targetType: "Hero", effetto: "Coraggio", valore: 2, immagine: "Fuoco03.png", dorso: "Fuoco00_Dorso.png", descrizione: "Aumenta l'attacco di un eroe di 2 dadi finché sono presenti mostri." }

- **Acqua** (Set 2):
  - **4**: { nome: "Acqua Guaritrice", elemento: "Acqua", targetType: "Hero", effetto: "Acqua Guaritrice", valore: 4, immagine: "Acqua01.png", dorso: "Acqua00_Dorso.png", descrizione: "Recupera fino a 4 Punti Corpo dell'eroe bersaglio." }
  - **5**: { nome: "Nebbia Caliginosa", elemento: "Acqua", targetType: "Hero", effetto: "Nebbia Caliginosa", valore: 0, immagine: "Acqua02.png", dorso: "Acqua00_Dorso.png", descrizione: "Avvolge l'eroe bersaglio nella nebbia caliginosa fino alla fine del turno." }
  - **6**: { nome: "Sonno", elemento: "Acqua", targetType: "Monster", effetto: "Sonno", valore: 0, immagine: "Acqua03.png", dorso: "Acqua00_Dorso.png", descrizione: "Fa addormentare un mostro (salta il turno) finché non viene attaccato." }

- **Terra** (Set 3):
  - **7**: { nome: "Pelle di Pietra", elemento: "Terra", targetType: "Hero", effetto: "Pelle di Pietra", valore: 1, immagine: "Terra01.png", dorso: "Terra00_Dorso.png", descrizione: "Aumenta la difesa di 1 dado finché l'eroe non subisce danni." }
  - **8**: { nome: "Passapareti", elemento: "Terra", targetType: "Hero", effetto: "Passapareti", valore: 0, immagine: "Terra02.png", dorso: "Terra00_Dorso.png", descrizione: "Permette all'eroe bersaglio di attraversare un solo muro durante il movimento. Non assegna cariche o usi extra basati su dadi." }
  - **9**: { nome: "Genio", elemento: "Terra", targetType: "Monster", effetto: "Genio", valore: 5, immagine: "Terra03.png", dorso: "Terra00_Dorso.png", descrizione: "Evoca un Genio per attaccare (5 dadi) o aprire una porta a distanza." }

- **Aria** (Set 4):
  - **10**: { nome: "Tempesta", elemento: "Aria", targetType: "Monster", effetto: "Tempesta", valore: 0, immagine: "Aria01.png", dorso: "Aria00_Dorso.png", descrizione: "Il mostro viene avvolto dai venti e salta il suo prossimo turno." }
  - **11**: { nome: "Passaggio Invisibile", elemento: "Aria", targetType: "Hero", effetto: "Passaggio Invisibile", valore: 0, immagine: "Aria02.png", dorso: "Aria00_Dorso.png", descrizione: "Rende l'eroe in grado di attraversare muri e occupanti durante il movimento." }
  - **12**: { nome: "Intralcio", elemento: "Aria", targetType: "Monster", effetto: "Intralcio", valore: 1, immagine: "Aria03.png", dorso: "Aria00_Dorso.png", descrizione: "Riduce il movimento del mostro a 1 sola casella." }

### ⚡ Capabilities

#### getAllSpells

- **Contract**: Restituisce la lista completa dei 12 incantesimi.
- **Signature**: `() -> List<@Spell>`

#### getSpellsByElement

- **Contract**: Filtra gli incantesimi per elemento.
- **Signature**: `(elemento: String) -> List<@Spell>`

### 🚨 Constraints

- Each declared domain construct MUST preserve its own identity/property invariants.
- Domain-level definitions MUST reject contradictory or ambiguous semantics at the capability scope.
- Domain capabilities `staticSpells`, getAllSpells, getSpellsByElement MUST remain deterministic for equivalent domain inputs.

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
