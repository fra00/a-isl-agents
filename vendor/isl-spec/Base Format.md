# Project: [Nome Progetto]

[Breve descrizione del progetto]

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: YYYY-MM-DD

---

## Domain Concepts

> **Reference**: (Optional) Core entities are defined in [`./shared-domain.isl.md`](./shared-domain.isl.md).

### [EntityName]

**Identity**: How uniquely identified
**Properties**:

- property1: description
  **Relationships**:
- Relationship to Entity (cardinality)

---

## Component: [Nome Componente]

[Descrizione sintetica del ruolo del componente]

### Role: Presentation / Backend (REQUIRED)

### 📐 Appearance / Interface (OPTIONAL)

- [Presentation: CSS, colors, layout]
- [Backend: Routes, schemas, headers]

### 📦 Content / Structure (OPTIONAL)

- [Presentation: DOM structure]
- [Backend: Dependencies, class members]

---

### ⚡ Capabilities / Methods (OPTIONAL)

#### [Nome Capability] (OPTIONAL)

- **Signature:** (OPTIONAL)
  - **input**: {param: type}
  - **output**: {result: type} | {error: type}

**Contract**: Cosa promette di fare questa azione

**Trigger**: Evento di attivazione

**Flow**: (REQUIRED if multi-step)

1. Step 1
2. Step 2

**Side Effect**: Modifiche allo stato

**Cleanup**: Azioni di finalizzazione

**💡 Implementation Hint**: Suggerimenti non normativi

**🚨 Constraint**: Regole normative (MUST/MUST NOT)

**✅ Acceptance Criteria**:

- [ ] Criterio 1
- [ ] Criterio 2

**🧪 Test Scenarios**:

1. **Scenario**: Input -> Expected

---

## 💡 Global Implementation Hints (OPTIONAL)

- Note architetturali

## 🚨 Global Constraints (OPTIONAL)

- Vincoli globali

## ✅ Acceptance Criteria (OPTIONAL)

- [ ] Criterio componente 1

## 🧪 Test Scenarios (OPTIONAL)

1. **Integration Scenario**: Descrizione

# ISL Canonical Rules v1.6.2 (Summary)

1. **Interpretation**: ⚡ 🚨 ✅ 🧪 are NORMATIVE.
2. **Precedence**: Capability > Global > Contract > Hint.
3. **Determinism**: Same ISL -> Same Code.
4. **Boundary**: Describe intent, NOT implementation steps.
5. **Roles**: Presentation ≠ Business Logic.
6. **Optionality**: OPTIONAL = may omit, not ignore.
7. **Reference Integrity**: Referenced files MUST be present.
