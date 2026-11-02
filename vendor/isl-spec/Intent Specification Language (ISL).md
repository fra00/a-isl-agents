# Intent Specification Language (ISL) v1.6.2

**Official Specification Document**

---

## Table of Contents

1. [Abstract](#abstract)
2. [Motivation](#motivation)
3. [Design Principles](#design-principles)
4. [Document Struct](#document-structure)
5. [Canonical Rules](#canonical-rules)
6. [Notation & Conventions](#notation--conventions)
7. [Section Reference](#section-reference)
8. [Complete Examples](#complete-examples)
9. [Best Practices](#best-practices)
10. [FAQ](<./Intent%20Specification%20Language%20(ISL).FAQ>)

---

## Abstract

**Intent Specification Language (ISL)** is a human-first, LLM-executable specification format designed for deterministic code generation. ISL enables developers to write high-level behavioral specifications in structured Markdown that can be consistently interpreted by Large Language Models to produce semantically identical code across multiple generations.

### Key Characteristics

- **Human-Writable**: Natural language in Markdown format
- **LLM-Executable**: Structured semantics for deterministic interpretation
- **Universal**: Supports frontend (Presentation), backend (Backend), domain (Domain), business logic (Business Logic), and test documents (Test)
- **Contract-Based**: Explicit input/output signatures with behavioral contracts
- **Test-Integrated**: Built-in acceptance criteria and test scenarios
- **Deterministic**: Canonical rules enforce consistent code generation

### Version Information

- **Current Version**: 1.6.2
- **Release Date**: April 2026
- **Status**: Stable
- **License**: MIT

---

## Motivation

### The Problem

Modern software development faces several challenges when translating requirements into code:

1. **Ambiguity**: Natural language specifications are often interpreted differently by different developers (or AI models)
2. **Non-Determinism**: LLM-generated code varies significantly between runs, even with identical inputs
3. **Incomplete Specifications**: Traditional documentation lacks formalized contracts, constraints, and test criteria
4. **Context Loss**: Implementation details are separated from behavioral intent
5. **Multi-Domain Friction**: Frontend and backend specifications use different formats and vocabularies

### The Solution: ISL

ISL addresses these challenges by providing:

- **Structured Natural Language**: Readable by humans, parseable by LLMs
- **Canonical Interpretation Rules**: Eliminates ambiguity in LLM code generation
- **Contract-Driven Design**: Explicit input/output signatures with behavioral promises
- **Integrated Testing**: Acceptance criteria and test scenarios embedded in specifications
- **Universal Format**: Single specification language for UI components, backend services, domain models, and tests
- **Deterministic Output**: Same specification → contractually equivalent code (contracts satisfied identically)

## ISL vs Other Formats

### ISL is NOT Pseudocode

**Pseudocode:**

- Describes algorithms step-by-step

- Close to the final code

- Shows implementation logic

**ISL:**

- Describes behavior and contracts

- Implementation-independent

- Shows WHAT, not HOW

---

### ISL is NOT Technical Design Document

**TDD:**

- Architecture, UML diagrams

- Detailed technology choices

- Implementation patterns

**ISL:**

- Behavioral contracts

- Constraints and requirements

- Suggested hints, not mandatory ones

### Target Users

- **Software Architects**: Define system components with precise contracts
- **Frontend Developers**: Specify UI components with behavioral guarantees
- **Backend Engineers**: Document API endpoints and service methods
- **QA Engineers**: Extract test scenarios directly from specifications
- **AI-Assisted Development**: Provide deterministic input for LLM code generators

---

## Design Principles

### 1. Human-First, Machine-Executable

**Principle**: Specifications should be written in natural language that humans find intuitive, while maintaining sufficient structure for deterministic machine interpretation.

**Implementation**:

- Markdown as the base format (universal, readable)
- Semantic emoji tags (📐 📦 ⚡ 🚨 ✅ 💡 🧪) for visual categorization
- Optional sections to avoid unnecessary verbosity

### 2. Contract-Based Behavior

**Principle**: Every capability must explicitly declare what it promises to do (contract), what triggers it, and what it produces.

**Implementation**:

- Mandatory `Contract` field for all capabilities
- Optional but recommended `Signature` (input/output) for type safety
- Clear separation between promise (contract) and implementation (hints)

### 3. Deterministic Interpretation

**Principle**: Given the same ISL specification, any compliant LLM must generate semantically equivalent code.

**Implementation**:

- Canonical Rules define interpretation precedence
- Normative sections (⚡ 🚨 ✅ 🧪) are mandatory to implement
- Domain Concepts enforce shared vocabulary

### 4. Separation of Concerns

**Principle**: Presentation logic and business logic must be clearly separated, and role boundaries should reflect the actual responsibilities of the component or document.

**Implementation**:

- Mandatory `Role` field (Presentation | Backend | Domain | Business Logic | Test)
- Role-specific validation rules (Rule 4 in Canonical Rules)
- Different section semantics based on role
- Existing Presentation/Backend documents remain valid; new roles are optional and additive

### 5. Test-Driven by Design

**Principle**: Specifications should directly generate testable assertions.

**Implementation**:

- Component-level Acceptance Criteria
- Capability-level Test Scenarios
- Clear expected outcomes for each scenario

### 6. Evolutionary Flexibility

**Principle**: The format must accommodate new patterns without breaking existing specifications.

**Implementation**:

- Most sections marked (OPTIONAL)
- Clear versioning strategy
- Extensible via custom sections

---

## Document Structure

### Hierarchical Organization

```
# Project
├─ Domain Concepts
│  └─ Entities (shared vocabulary)
├─ Component A
│  ├─ Role (context)
│  ├─ Appearance/Interface (visual/API)
│  ├─ Content/Structure (composition)
│  ├─ Capabilities/Methods (behaviors)
│  │  ├─ Signature (I/O types)
│  │  ├─ Contract (promise)
│  │  ├─ Trigger (activation)
│  │  ├─ Flow (steps)
│  │  ├─ Side Effect (mutations)
│  │  ├─ Cleanup (finalization)
│  │  ├─ Implementation Hint (guidance)
│  │  ├─ Constraint (limits)
│  │  └─ Acceptance + Tests (verification)
│  ├─ Global Implementation Hints
│  ├─ Global Constraints
│  ├─ Acceptance Criteria
│  └─ Test Scenarios
└─ Component B...
```

### Section Levels

| Level          | Markdown Syntax                 | Purpose                |
| -------------- | ------------------------------- | ---------------------- |
| **Project**    | `# Project: Name`               | Top-level container    |
| **Domain**     | `## Domain Concepts`            | Shared vocabulary      |
| **Component**  | `## Component: Name`            | Unit of implementation |
| **Subsection** | `### Role`, `### 📐 Appearance` | Component properties   |
| **Capability** | `#### CapabilityName`           | Individual behaviors   |

### Project Metadata Header

Every ISL file that declares `# Project: Name` SHOULD include metadata before the first section:

```markdown
# Project: ProjectName

**Version**: semantic version (e.g., 1.0.0)
**ISL Version**: target ISL language version (e.g., 1.6.2)
**Created**: ISO date (YYYY-MM-DD)
**Implementation**: path to generated/build output (if applicable)
```

**Interpretation:**

- **Version**: Semantic version of this specification document (bumped when spec changes)
- **ISL Version**: The ISL language version this document targets (e.g., 1.6.2)
- **Created**: ISO 8601 date when the specification was first authored
- **Implementation**: Optional path to the actual generated code or build output directory

**Example:**

```markdown
# Project: Dungeon React

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-02-09
**Implementation**: ./main-content
```

---

## Modular Specifications

ISL supports splitting specifications across multiple files to promote reuse and maintainability. While the **Document Structure** defines the _logical_ hierarchy, **Modular Specifications** define the _physical_ organization.

### External References

Components can reference entities defined in external files (e.g., a shared domain model) using the standard Markdown blockquote syntax with a specific label.

**Syntax:**
`> **Reference**: [Description] in Link`

**Example:**

```markdown
## Domain Concepts

> **Reference**: Core entities are defined in [`./shared-domain.isl.md`](./shared-domain.isl.md).
```

### Context Composition

When an ISL specification references external files, the interpreter (LLM or human) MUST treat the referenced content as if it were inline.

- **Shared Domain**: Entities defined in a referenced domain file are available globally in the referencing component.
- **Resolution**: If a term is defined both locally and externally, the **local definition** takes precedence (override).

---

## Canonical Rules

The Canonical Rules define how ISL documents MUST be interpreted by compliant LLM code generators. These rules are **normative** and override any ambiguity in the template structure.

### Rule 1: Interpretation Rules

**Sections marked with semantic emoji (⚡ 🚨 ✅ 🧪) are NORMATIVE.**

- ⚡ **Capabilities/Methods**: MUST be implemented exactly as specified
- 🚨 **Constraints**: MUST be enforced (violations are errors)
- ✅ **Acceptance Criteria**: Define completion (tests must pass)
- 🧪 **Test Scenarios**: MUST be implementable as automated tests

**Other sections (📐 📦 💡) are INFORMATIVE:**

- 📐 **Appearance/Interface**: Guidance for styling/API design
- 📦 **Content/Structure**: Recommended composition
- 💡 **Implementation Hints**: Suggested strategies (not mandatory)

**Interpretation:**

```
IF section has normative emoji (⚡ 🚨 ✅ 🧪) THEN
  Implementation MUST comply exactly
ELSE
  Implementation MAY adapt for target platform
```

### Rule 2: Precedence Hierarchy

When conflicts arise, apply this precedence order (highest to lowest):

1. **Capability-Level Constraints** (🚨 in specific capability)
2. **Global Constraints** (🚨 at component level)
3. **Acceptance Criteria** (✅)
4. **Contracts** (behavioral promises)
5. **Implementation Hints** (💡 suggestions)

**Example:**

```
🚨 Global Constraint: Use REST for all APIs

Component: WebSocketService
⚡ Capability: streamUpdates
🚨 Constraint: MUST use WebSocket protocol

→ Capability constraint wins (more specific)
```

### Rule 3: Determinism Requirements

**Requirement**: Given the same ISL specification, output code MUST be semantically identical across multiple generations.

**Semantic Equivalence Defined:**

- Same input → same output (function signatures match)
- Same side effects (state mutations equivalent)
- Same error handling (exception types match)
- Same API contracts (external interfaces identical)

**Semantic Equivalence ≠ Identical Code:**

- Same ISL does NOT imply byte-for-byte identical code text.

**Allowed Variations:**

- Variable names (if not specified in Domain Concepts)
- Code comments
- Whitespace and formatting
- Implementation internals (if contract satisfied)

**Naming Rule**:

- Entity names MUST follow Domain Concepts vocabulary
- Capability names MUST be preserved in generated code
- Type names MUST match or be semantically equivalent

**Verification Test**:

```
FOR i = 1 TO 10:
  code[i] = generateCode(sameISL)

ASSERT all(semanticallyEquivalent(code[i], code[1]))
```

### Rule 4: Nature of ISL (Boundary Rule)

**ISL (Intent Specification Language) defines intent, behavior, and constraints, not implementation details.**

**ISL MUST:**

- Define observable behavior, contracts, or effects

- Describe what the system does, not how it is implemented

- Express logic in terms of intent, rules, and outcomes

- Remain implementation-agnostic across technologies

**ISL MUST NOT:**

- Describe step-by-step algorithms equivalent to executable code

- Be written as pseudocode

- Act as a Technical Design Document (TDD)

- Contain low-level control flow (loops, variable mutation, conditionals tied to syntax)

Violation Examples:

```
❌ INVALID:
⚡ resizeNode
Flow:
  1. dx = mouse.x - prevMouse.x
  2. newWidth = node.width + dx
  3. if newWidth < 50 then newWidth = 50
  4. node.width = newWidth

→ Step-by-step algorithm (pseudocode)
→ Violates ISL boundary rule

✅ VALID:
⚡ resizeNode
Contract: Resize node while maintaining attached connections
Flow:
  1. User resizes node via bounding box
  2. Node dimensions update respecting minimum size
  3. Connections remain visually attached

🚨 Constraint:
- MUST enforce minimum size 50×50
- MUST update connections during resize

→ Describes behavior and constraints, not implementation
```

### Rule 5: Role Separation Rules

**Presentation Components (Role: Presentation)**:

**MUST:**

- Define visual appearance (CSS, layout, styling)
- Handle user interactions (clicks, keyboard, gestures)
- Render UI elements (HTML, JSX, templates)

**MUST NOT:**

- Implement business logic (validation, calculations)
- Directly access databases or external APIs
- Contain authentication/authorization logic

**Backend Components (Role: Backend)**:

**MUST:**

- Define API contracts (routes, methods, schemas)
- Implement business logic
- Handle data persistence and external integrations

**MUST NOT:**

- Define visual properties (colors, fonts, layouts)
- Contain UI rendering code
- Reference DOM elements

**Violation Examples:**

markdown

```markdown
❌ INVALID:
Component: LoginButton
Role: Presentation
⚡ validatePassword
Flow: 1. Check password length >= 8 2. Verify special characters
→ Business logic in Presentation (violates Rule 4)

✅ VALID:
Component: LoginButton
Role: Presentation
⚡ onClick
Contract: Trigger authentication via AuthService
Flow: 1. Collect form data 2. Call AuthService.login(email, password) 3. Handle response (redirect or show error)
→ Delegates business logic to Backend
```

### Rule 5: Optionality Semantics

**Definition of (OPTIONAL):**

- **May be omitted**: If a section is not needed, it can be left out entirely
- **May NOT be ignored**: If a section is present, it MUST be implemented

**Contrast with (REQUIRED):**

- **Must be present**: Section cannot be omitted
- **Must be implemented**: Content must be reflected in generated code

**Example:**

```markdown
### Role: Presentation (REQUIRED)

→ Must appear in every component specification

### 📐 Appearance (OPTIONAL)

- Button with blue background
  → If present, generated code MUST include blue background
  → If absent, default styling may be applied

💡 Implementation Hint (OPTIONAL)

- Use Tailwind utility classes
  → If present, Tailwind is RECOMMENDED but not mandatory
  → Other CSS solutions acceptable if contracts met
```

**Interpretation:**

```
IF section marked (OPTIONAL) AND section.isEmpty THEN
  Skip section
ELSE IF section marked (OPTIONAL) AND section.isPresent THEN
  Implement section content
ELSE IF section marked (REQUIRED) THEN
  Error if section.isEmpty
  Implement section content
```

### Rule 6: Error Handling (Supplementary)

**Constraint Violations:**

- LLM MUST NOT generate code that violates 🚨 Constraints
- If implementation is impossible, LLM MUST report error with reasons
- Silent failures are NOT permitted

**Ambiguity Resolution:**

- If specification is ambiguous, LLM MUST request clarification
- LLM MAY suggest interpretations but MUST NOT assume

**Unimplementable Requirements:**

- If technical limitation prevents implementation, LLM MUST:
  1. Report which requirement cannot be met
  2. Explain technical reason
  3. Suggest alternative approaches that preserve intent

**Example:**

```markdown
🚨 Constraint: Response time MUST be < 1ms

→ If physically impossible (network latency):
LLM reports: "1ms response time unachievable over network.
Suggest: local caching or relaxed constraint."
```

### Canonical Rules Availability

If an LLM is instructed using the official ISL documentation (e.g. via RAG, system prompt, or embedded knowledge), ISL Canonical Rules are assumed to be known and MUST NOT be restated in each prompt.

If ISL is explained informally or partially, Canonical Rules MUST be explicitly provided to avoid ambiguous interpretation.

---

## Notation & Conventions

### Semantic Emoji Tags

ISL uses emoji as semantic markers to categorize information:

| Emoji | Section              | Type          | Meaning                              |
| ----- | -------------------- | ------------- | ------------------------------------ |
| 📐    | Appearance/Interface | INFORMATIVE   | Visual properties or API structure   |
| 📦    | Content/Structure    | INFORMATIVE   | Component composition                |
| ⚡    | Capabilities/Methods | **NORMATIVE** | Behaviors that MUST be implemented   |
| 💡    | Implementation Hint  | INFORMATIVE   | Suggested strategies (not mandatory) |
| 🚨    | Constraint           | **NORMATIVE** | Hard limits that MUST be enforced    |
| ✅    | Acceptance Criteria  | **NORMATIVE** | Conditions for completion            |
| 🧪    | Test Scenarios       | **NORMATIVE** | Testable assertions                  |

### Required vs Optional Markers

markdown

```markdown
(REQUIRED) → Section MUST be present
(OPTIONAL) → Section MAY be omitted, but if present MUST be implemented
```

### RFC 2119 Keywords

ISL adopts RFC 2119 terminology for constraint specifications:

- **MUST** / **REQUIRED**: Absolute requirement
- **MUST NOT**: Absolute prohibition
- **SHOULD** / **RECOMMENDED**: Strong preference (may be ignored with justification)
- **SHOULD NOT**: Strong discouragement
- **MAY** / **OPTIONAL**: Truly optional

**Usage in Constraints:**

```markdown
🚨 Constraint:

- Password MUST be hashed (absolute)
- Email SHOULD be verified (strong recommendation)
- Nickname MAY contain emojis (truly optional)
```

### Type Notation

ISL uses TypeScript-like notation for types (adaptable to target language):

```markdown
**Signature:**

- **input**: {email: string, password: string}
- **output**: {token: string, expiresAt: datetime} | {error: string}
```

**Supported Notations:**

- **Primitives**: `string`, `number`, `boolean`, `datetime`, `uuid`
- **Collections**: `string[]`, `Array<User>`
- **Objects**: `{field1: type1, field2: type2}`
- **Unions**: `Type1 | Type2`
- **Optional**: `field?: type`
- **Enums**: `'value1' | 'value2' | 'value3'`

### Symbol Reference Notation

ISL uses two conventions to distinguish between stable domain types and transient local variables:

- **`@TypeName`**: Refers to a domain type, state structure, or reusable entity (e.g., `@GameSession`, `@HeroState`, `@Spell`)
- **`` `variableName` ``**: Refers to a local variable, parameter, or temporary value (e.g., `currentHero`, `damage`, `targetMonster`)

**Example:**

```markdown
### Role: Business Logic

**Signature:**

- `gameSession`: @GameSession
- `currentSpell`: @Spell

### Flow

1. Find `targetMonster` in `gameSession.monsters`.
2. Calculate `damageAmount` = `currentSpell.baseDamage`.
3. Apply `damageAmount` to `targetMonster.health`.
4. Persist via `commitSessionUpdate(@GameSession)`.
```

**Rationale:**

This distinction helps generators and readers understand:

- Which values are reusable contracts (should be referenced, not duplicated)
- Which values are local to the current flow (transient, scoped)

### Flow Notation

Flows use numbered steps with optional branching:

markdown

```markdown
**Flow:**

1. Step description
2. Conditional step:
   IF condition THEN
   a. Action A
   ELSE
   b. Action B
3. FOR EACH item IN collection:
   a. Process item
4. Final step
```

**Supported Control Structures:**

- `IF...THEN...ELSE`
- `FOR EACH...IN`
- `WHILE condition`
- `TRY...CATCH`
- `BRANCH: [conditions]`

### ISL Writing & Grammar Guidelines (for Humans)

This section defines editorial conventions for writing
ISL-compliant specifications. These rules improve clarity,
scanability, and deterministic interpretation.

#### Semantic Formatting

- **Bold (`**term**`)**  
  Indicates a semantic anchor:
  - Domain Concepts
  - Component names
  - Capabilities or entities defined elsewhere  
    Must NOT be used for generic emphasis.

- ***Bold + Italic (`***important***`)***  
  Indicates critical emphasis for clarification or edge cases.
  Must NOT replace normative sections (🚨 Constraints, ✅ Acceptance).

- UPPERCASE  
  Used only for temporary visual emphasis during review or discussion.
  Must NOT be used in finalized ISL documents.

#### Section Emojis (Visual Anchors)

ISL uses emojis as visual anchors to improve scanability
and reduce cognitive load.

- ⚡ Capabilities / behavior
- 🚨 Constraints (normative)
- ✅ Acceptance Criteria
- 🧪 Test Scenarios
- ⚠️ Warnings / notes (non-normative)
- 🔒 Security considerations (custom, optional)

**Rationale**:

- Emojis provide fast visual categorization
- They improve navigation in long specifications
- They reduce ambiguity for both humans and LLMs

---

## Section Reference

### Project Header

```markdown
# Project: [Name]

[Brief summary of the project (1-3 sentences)]
```

**Purpose**: Identifies the system being specified and provides context.

**Required Fields**:

- Project name
- Brief summary

**Optional Metadata** (recommended):

```markdown
# Project: E-Commerce Platform

**Version**: 1.0.0
**ISL Version**: 1.6
**Target Stack**: React 18 + Node.js + PostgreSQL
**Created**: 2026-01-15
**Updated**: 2026-01-20
```

---

### Domain Concepts

```markdown
## Domain Concepts

### [Entity Name]

**Identity**: How it's uniquely identified (e.g., UUID, composite key)
**Properties**: Semantic attributes (NOT implementation fields)
**Relationships**: Connections to other entities
```

**Purpose**: Establishes shared vocabulary for the entire specification. Ensures consistent naming across components.

**Guidelines**:

- Use business domain terminology, not technical implementation
- Focus on "what it represents" not "how it's stored"
- Define relationships explicitly (1:1, 1:N, N:M)

**Example:**

```markdown
## Domain Concepts

### User

**Identity**: UUID (universally unique identifier)
**Properties**:

- email: unique identifier for authentication
- displayName: user's chosen public name
- accountStatus: enum (active, suspended, deleted)
  **Relationships**:
- Has many Orders (1:N)
- Belongs to one Organization (N:1)

### Order

**Identity**: UUID
**Properties**:

- orderNumber: human-readable reference
- totalAmount: monetary value
- orderStatus: enum (pending, confirmed, shipped, delivered, cancelled)
  **Relationships**:
- Belongs to one User (N:1)
- Contains many OrderItems (1:N)
```

---

### Component Declaration

```markdown
## Component: [Component Name]

[Concise description of component's role (1-2 sentences)]

### Role: Presentation | Backend | Domain | Business Logic | Test (REQUIRED)
```

**Purpose**: Defines a unit of implementation (UI component, service, API endpoint, domain model, or test document)

**Role Values**:

- `Presentation`: UI components, visual elements, user interactions
- `Backend`: Services, APIs, business logic, data access
- `Domain`: Entities, shared concepts, value structures, enumerations
- `Business Logic`: Deterministic use cases, state transitions, orchestration rules, non-visual runtime behavior
- `Test`: Scenario specifications, fixtures, assertions, behavior validation inputs

**Naming Convention**:

- Use PascalCase for components: `LoginButton`, `UserService`
- Be specific: `UserProfileCard` better than `Card`
- Include role context if helpful: `UserAuthService`, `PaymentGateway`

---

### Appearance / Interface

```markdown
### 📐 Appearance / Interface (OPTIONAL)
```

**For Presentation (Role: Presentation)**:

```markdown
### 📐 Appearance

- Primary button styling
- Background: #3b82f6 (blue)
- Text color: white
- Border radius: 8px
- Padding: 12px 24px
- States:
  - Hover: background #2563eb (darker blue)
  - Active: background #1d4ed8
  - Disabled: background #9ca3af (gray), cursor not-allowed
```

**For Backend (Role: Backend)**:

```markdown
### 📐 Interface

- HTTP Method: POST
- Route: /api/auth/login
- Content-Type: application/json
- Request Schema: {email: string, password: string}
- Response Schema: {token: string, expiresAt: ISO8601} | {error: string, code: number}
- Headers Required: none
- Headers Optional: X-Client-Version
```

**Guidelines**:

- Presentation: Focus on visual properties, not implementation (e.g., "blue" not "`#3b82f6`" if exact color not critical)
- Backend: Define complete API contract (method, route, schemas)
- Use consistent terminology from Domain Concepts

---

### Content / Structure

```markdown
### 📦 Content / Structure (OPTIONAL)
```

**For Presentation**:

```markdown
### 📦 Content

- Form container
  - EmailInput (child component)
  - PasswordInput (child component)
  - SubmitButton (child component)
  - ErrorMessage (conditional, shown on validation failure)
```

**For Backend**:

```markdown
### 📦 Structure

**Dependencies**:

- UserRepository (data access)
- JWTService (token generation)
- EmailService (notifications)

**Class Members**:

- private userRepo: UserRepository
- private jwtService: JWTService
- private emailService: EmailService
```

**Guidelines**:

- Presentation: Describe DOM/component hierarchy
- Backend: List dependencies and class structure
- Keep implementation-agnostic (e.g., "token generation" not "JWT library v3.2")

---

### Capabilities / Methods

```markdown
### ⚡ Capabilities / Methods (OPTIONAL)

#### [Capability Name]
```

**Purpose**: Defines individual behaviors or methods. This is the core of ISL specifications.

**Structure** (all fields within a capability):

#### Signature (OPTIONAL but RECOMMENDED)

```markdown
**Signature:**

- **input**: {param1: type, param2: type}
- **output**: {result: type} | {error: type}
```

**When to include**:

- Always for Backend methods
- For Presentation when data flow is non-trivial
- Omit for simple event handlers with no parameters

#### Contract (REQUIRED)

```markdown
**Contract**: Clear statement of what this capability promises to do
```

**Guidelines**:

- Start with action verb: "Authenticate user", "Validate input", "Render chart"
- Be specific about outcome: "Generate JWT token valid for 24 hours"
- One sentence, clear and testable

#### Trigger (REQUIRED for Presentation, OPTIONAL for Backend)

```markdown
**Trigger**: Event that activates this capability
```

**Presentation Examples**:

- `Click on submit button`
- `DoubleClick on node`
- `KeyPress: Enter key`
- `MouseDown + Drag on canvas`

**Backend Examples**:

- `HTTP POST to /api/users`
- `Scheduled cron job (daily at 2:00 AM)`
- `Message received on Kafka topic: user-events`

#### Flow (OPTIONAL - REQUIRED if multi-step)

```markdown
**Flow:**

1. Step 1
2. Step 2
   IF condition THEN
   a. Branch A
   ELSE
   b. Branch B
3. Step 3
```

**Guidelines**:

- Use numbered steps for sequential operations
- Use IF/ELSE for conditional logic
- Use FOR EACH for iterations
- Keep steps at appropriate abstraction level (not too detailed)

**When to include**:

- Multi-step processes (login, checkout, data transformation)
- Complex algorithms
- Branching logic

**When to omit**:

- Single atomic operations ("toggle boolean", "return value")

#### Internal State (OPTIONAL)

```markdown
### 🗂 Internal State

- `isVisible` **internal**: local visibility toggle
- `currentPage` **external**: provided by parent navigation state
- `canSubmit` **calculated** from `formValues.isValid` and `isLoading`
```

**Purpose**: Clarify ownership and derivation of state values within a component or capability.

**Guidelines**:

- Use `**external**` for values provided by props, context, or shared engine state
- Use `**internal**` for values owned locally by the component
- Use `**calculated**` for values derived from other values and not stored independently unless required

#### Logic & Execution Rules (OPTIONAL)

```markdown
### ⚙ Logic & Execution Rules

#### DamageCalc

- Evaluation order: base -> additive -> multiplicative -> resistances.
- Rounding: apply `floor` after all multipliers.
- Clamp: final damage = max(0, floor(result)).
```

**Purpose**: Record normative execution constraints needed for deterministic behavior.

**Guidelines**:

- Specify order, idempotency, commit behavior, and synchronization guarantees
- Avoid implementation-specific code or API names
- Use `MUST` / `SHOULD` for normative rules and separate non-normative notes clearly

#### Effect Lifecycle (OPTIONAL)

```markdown
### 🔄 Effect Lifecycle

- `RockSkin`
  - Apply: when the spell is cast on a hero
  - Active While: hero has not yet suffered damage
  - Expires When: hero receives damage greater than 0
  - Cleanup: remove status from `activeStatus`
```

**Purpose**: Describe temporary effect lifecycles explicitly for buffs, debuffs, cooldowns, and transient states.

**Guidelines**:

- Define `Apply`, `Active While`, `Expires When`, and `Cleanup`
- Keep lifecycle rules tied to observable behavior and state transitions
- Avoid low-level implementation steps

#### Side Effect (OPTIONAL)

```markdown
**Side Effect**: State changes or external interactions
```

**Examples**:

- `Updates user.lastLogin timestamp`
- `Sends email notification via EmailService`
- `Triggers re-render of parent component`
- `Writes to database: users table`

#### Cleanup (OPTIONAL)

```markdown
**Cleanup**: Finalization actions
```

**Examples**:

- `Restore cursor to default`
- `Remove temporary DOM elements`
- `Close database connection`
- `Reset form fields`

#### Implementation Hint (OPTIONAL)

```markdown
**💡 Implementation Hint**:
A non-normative suggestion that MAY guide implementation,
without mandating specific technologies, libraries, or code.

Implementation Hints SHOULD be included ONLY when the intended
approach is not already clear from the Contract, Flow, or Constraints.
```

**Purpose**: Guides implementation without mandating specific code.

##### ✅ Good Hint Levels:

**Level 1 - Strategy (Preferred):**

```typescript
💡 Implementation Hint:
// Use database transactions for atomicity
// Hash passwords with bcrypt (cost ≥ 12)
// Generate tokens with crypto.randomBytes (32+ bytes)
```

**Level 2 - Pattern with Example (Acceptable):**

```typescript
💡 Implementation Hint:
// Transaction pattern:
await db.transaction(async (trx) => {
  // All DB operations here
});

// Password hashing example:
const hash = await bcrypt.hash(password, 12);
```

**Level 3 - Code Snippet (SHOULD be used only to illustrate a narrow,
isolated pattern that cannot be clearly expressed otherwise):**

```typescript
💡 Implementation Hint:
// Token generation example:
const token = crypto.randomBytes(32).toString('hex');
await store.set(`key:${token}`, value, TTL);

// Note: Adjust key prefix and TTL to your needs
```

#### ❌ Bad Hint Levels:

**Level 4 - Complete Function (TOO MUCH):**

```typescript
💡 Implementation Hint:
async function register(data) {
  // [15+ lines of complete implementation]
  // This is NOT a hint - it's the full solution
}
```

**Rule of Thumb:**

- Hint should fit in 5-7 lines maximum (excluding comments)
- Focus on STRATEGY, not full implementation
- Include code ONLY to illustrate a pattern
- If you're writing a complete function → it's NOT a hint

**Examples**:

```markdown
💡 Implementation Hint:

- Use bcrypt with cost factor 12 for password hashing
- Consider debouncing search input (300ms delay)
- Prefer CSS Grid over Flexbox for this layout
```

**With Code Snippet**:

````markdown
💡 Implementation Hint:

```javascript
// Suggested error handling pattern
try {
  const user = await authenticateUser(email, password);
  ...
  ...
  return {success: true, user};
} catch (error) {
  if (error instanceof AuthenticationError) {
    return {success: false, error: 'Invalid credentials'};
  }
  throw error; // Re-throw unexpected errors
}
```
````

```
**Guidelines**:

- Hints are SUGGESTIONS, not requirements (unless also in 🚨 Constraint)
- Include rationale: "Use bcrypt for OWASP compliance"
- Provide alternatives when appropriate
```

#### Constraint (OPTIONAL but RECOMMENDED)

**🚨 Constraint**: Hard limits and rules (NORMATIVE)

**Purpose**: Defines what MUST or MUST NOT happen. These are non-negotiable.

**Format**:

```markdown
🚨 Constraint:

- MUST [requirement]
- MUST NOT [prohibition]
- SHOULD [strong recommendation]
```

**Examples**:

```markdown
🚨 Constraint:

- Password MUST be hashed before storage (never plaintext)
- Response time MUST be < 200ms (99th percentile)
- MUST NOT modify node position during resize operation
- MUST validate all inputs before processing
- UI MUST remain responsive during long operations (show loading state)
```

**Guidelines**:

- Use RFC 2119 keywords (MUST, MUST NOT, SHOULD)
- Be specific and measurable
- Separate security, performance, and functional constraints

#### Acceptance Criteria (OPTIONAL but RECOMMENDED)

```markdown
**✅ Acceptance Criteria**: Conditions for completion
```

**Purpose**: Defines when this capability is considered "done".

**Format**:

```markdown
✅ Acceptance Criteria:

- [ ] Criterion 1 (testable condition)
- [ ] Criterion 2
```

**Examples**:

```markdown
✅ Acceptance Criteria:

- [ ] User can login with valid credentials
- [ ] Invalid credentials show error message
- [ ] Form is disabled during authentication
- [ ] Successful login redirects to dashboard
- [ ] Failed login increments attempt counter
```

**Guidelines**:

- Each criterion should be independently testable
- Use checkbox format for clarity
- Focus on observable behavior, not implementation

#### Test Scenarios (OPTIONAL but RECOMMENDED)

```markdown
**🧪 Test Scenarios**: Specific test cases
```

**Purpose**: Provides concrete test cases that can be automated.

**Format**:

```markdown
🧪 Test Scenarios:

1. **Scenario Name**: Input → Expected Output
2. **Edge Case Name**: Condition → Expected Behavior
```

**Examples**:

```markdown
🧪 Test Scenarios:

1. **Valid Login**:
   - Input: {email: "user@test.com", password: "Valid123!"}
   - Expected: {token: <JWT>, expiresAt: <timestamp>}

2. **Invalid Password**:
   - Input: {email: "user@test.com", password: "wrong"}
   - Expected: {error: "Invalid credentials"}

3. **Account Locked**:
   - Precondition: 5 failed login attempts
   - Input: valid credentials
   - Expected: {error: "Account locked", code: 423}

4. **Concurrent Logins**:
   - Input: Same user logs in from 2 devices
   - Expected: Both sessions valid, old session NOT invalidated
```

**Guidelines**:

- Include happy path, error cases, and edge cases
- Specify preconditions when relevant
- Define expected behavior clearly
- Use realistic test data

---

### Global Sections (Component-Level)

#### Global Implementation Hints

```markdown
### 💡 Global Implementation Hints (OPTIONAL)

- [Architectural notes]
- [Recommended libraries]
- [Performance considerations]
```

**Purpose**: Provides component-level implementation guidance.

**Examples**:

```markdown
### 💡 Global Implementation Hints

- Use React 18+ with TypeScript
- State management: Zustand (lightweight, < 1KB)
- Form validation: Zod schemas (type-safe)
- Consider memoization for expensive renders (useMemo, React.memo)
- Bundle size target: < 50KB gzipped
```

#### Global Constraints

```markdown
### 🚨 Global Constraints (OPTIONAL)

- [Component-wide limitations]
```

**Purpose**: Constraints that apply to the entire component, not just one capability.

**Examples**:

```markdown
### 🚨 Global Constraints

- Component MUST be accessible (WCAG 2.1 Level AA)
- All API calls MUST include authentication token
- Component MUST NOT directly access localStorage (use provided storage service)
- Maximum bundle size: 100KB
- Render time MUST be < 16ms (60fps)
```

#### Acceptance Criteria (Component-Level)

```markdown
### ✅ Acceptance Criteria (OPTIONAL)

- [ ] Component-wide completion criteria
```

**Purpose**: Overall conditions for component completion (beyond individual capabilities).

**Examples**:

```markdown
### ✅ Acceptance Criteria

- [ ] Component passes all accessibility audits
- [ ] Component has 80%+ test coverage
- [ ] Component works in Chrome, Firefox, Safari (latest versions)
- [ ] Component handles all error states gracefully
- [ ] Component documentation is complete
```

#### Test Scenarios (Component-Level)

```markdown
### 🧪 Test Scenarios (OPTIONAL)

1. **Integration Scenario**: Complex multi-capability test
```

**Purpose**: End-to-end or integration tests that span multiple capabilities.

**Examples**:

```markdown
### 🧪 Test Scenarios

1. **Complete Login Flow**:
   - User enters email
   - User enters password
   - User clicks submit
   - Loading state appears
   - Success: redirect to dashboard
   - Token stored securely

2. **Error Recovery**:
   - Network failure during login
   - User sees error message
   - User retries
   - Success on second attempt
```

---

## Complete Examples

### Example 1: Frontend Component (Presentation)

````markdown
# Project: Task Management App

Simple task tracking application with drag-and-drop kanban board.

---

## Domain Concepts

### Task

**Identity**: UUID
**Properties**:

- title: short description of task
- status: enum (todo, in-progress, done)
- priority: enum (low, medium, high)
- assignee: reference to User
  **Relationships**:
- Belongs to one Project (N:1)
- Assigned to zero or one User (N:0..1)

### User

**Identity**: UUID
**Properties**:

- email: unique, authentication identifier
- displayName: user's chosen name
  **Relationships**:
- Assigned to many Tasks (1:N)

---

## Component: TaskCard

Displays a single task in the kanban board with drag capability.

### Role: Presentation

### 📐 Appearance

- Card layout: white background, rounded corners (8px)
- Border: 1px solid #e5e7eb (gray-200)
- Padding: 16px
- Shadow on hover: 0 4px 6px rgba(0,0,0,0.1)
- Dragging state: opacity 0.5, cursor grabbing
- Priority indicator:
  - Low: blue dot
  - Medium: yellow dot
  - High: red dot

### 📦 Content

- Priority indicator (colored dot, top-left)
- Task title (bold, 16px)
- Assignee avatar (if assigned, bottom-right)
- Status badge (hidden, inferred from column)

---

### ⚡ Capabilities

#### dragStart

**Signature:**

- **input**: NONE (user-initiated)
- **output**: NONE (side effect only)

**Contract**: Initiate drag operation to move task between columns

**Trigger**: MouseDown on card + MouseMove (drag gesture)

**Flow**:

1. Capture card initial position
2. Create ghost element (semi-transparent copy)
3. Hide original card (opacity 0.5)
4. Ghost element follows cursor
5. On MouseUp:
   IF dropped on valid column THEN
   a. Update task.status
   b. Move card to new column
   ELSE
   a. Animate card back to original position

**Side Effect**:

- Task.status updated in application state
- Parent KanbanBoard re-renders affected columns
- Cursor changes to 'grabbing'

**Cleanup**:

- Remove ghost element
- Restore card opacity to 1.0
- Cursor restored to default

**💡 Implementation Hint**:

```javascript
// Use HTML5 Drag and Drop API
card.addEventListener("dragstart", (e) => {
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", task.id);
});
```
````

**🚨 Constraint**:

- MUST NOT allow drag if user lacks edit permission
- Drag operation MUST complete in < 100ms (perceived instant)
- MUST prevent text selection during drag

**✅ Acceptance Criteria**:

- [ ] Card is draggable with mouse
- [ ] Card is draggable with touch (mobile)
- [ ] Ghost element appears during drag
- [ ] Original card shows reduced opacity during drag
- [ ] Drop updates task status correctly

**🧪 Test Scenarios**:

1. **Successful Drag**:
   - User drags task from "Todo" to "In Progress"
   - Expected: task.status = "in-progress", card appears in new column

2. **Cancelled Drag**:
   - User drags task and releases outside valid drop zone
   - Expected: card animates back to original position, status unchanged

3. **Permission Denied**:
   - User without edit permission attempts drag
   - Expected: card does not move, cursor shows 'not-allowed'

---

#### editTitle

**Signature:**

- **input**: NONE (trigger shows inline editor)
- **output**: NONE (updates task.title)

**Contract**: Allow inline editing of task title

**Trigger**: DoubleClick on task title text

**Flow**:

1. Replace title text with input field
2. Input field pre-filled with current title
3. Input field focused automatically
4. User edits text
5. On Enter key: save changes
6. On Escape key: discard changes
7. On blur (click outside): save changes

**Side Effect**:

- Updates task.title in application state
- Input field replaces title text (temporarily)

**Cleanup**:

- Remove input field
- Restore title text display
- Re-enable card dragging (disabled during edit)

**🚨 Constraint**:

- Title MUST NOT be empty (min 1 character)
- Title MUST NOT exceed 200 characters
- MUST disable drag during edit mode
- Input field MUST prevent keyboard shortcuts from affecting card (e.g., Delete key shouldn't delete card)

**✅ Acceptance Criteria**:

- [ ] DoubleClick enters edit mode
- [ ] Enter saves changes
- [ ] Escape cancels changes
- [ ] Click outside saves changes
- [ ] Empty title rejected with error message

**🧪 Test Scenarios**:

1. **Edit and Save**:
   - DoubleClick title, type "New Title", press Enter
   - Expected: task.title = "New Title"
2. **Edit and Cancel**:
   - DoubleClick title, type "Changes", press Escape
   - Expected: task.title unchanged
3. **Empty Title Rejection**:
   - DoubleClick title, delete all text, press Enter
   - Expected: Error message shown, title unchanged

---

## 💡 Global Implementation Hints

- Use React 18+ functional component
- Props: {task: Task, onUpdate: (task: Task) => void, draggable: boolean}
- Consider using react-beautiful-dnd library for drag-and-drop
- Memoize component with React.memo (re-render only when task changes)

## 🚨 Global Constraints

- Component MUST be keyboard accessible (Tab navigation)
- Component MUST work on touch devices (mobile)
- Component MUST NOT make direct API calls (use provided onUpdate callback)

## ✅ Acceptance Criteria

- [ ] Component renders correctly with all task properties

- [ ] All capabilities functional on desktop and mobile

- [ ] Component accessible via keyboard

- [ ] No prop drilling (use context if needed)

- [ ] Component has 90%+ test coverage

  ```

  ```

### Example 2: Backend Component

````markdown
# Project: E-Commerce Platform

## Online store with product catalog, shopping cart, and checkout.

## Domain Concepts

### User

**Identity**: UUID
**Properties**:

- email: unique, for authentication
- passwordHash: bcrypt hashed password
- role: enum (customer, admin)
  **Relationships**:
- Has one Cart (1:1)
- Has many Orders (1:N)

### Cart

**Identity**: UUID
**Properties**:

- totalAmount: calculated sum of items
  **Relationships**:
- Belongs to one User (1:1)
- Contains many CartItems (1:N)

### CartItem

**Identity**: UUID
**Properties**:

- quantity: positive integer
- priceAtAdd: price snapshot when added
  **Relationships**:
- Belongs to one Cart (N:1)
- References one Product (N:1)

---

## Component: CartService

Manages shopping cart operations: add/remove items, calculate totals.

### Role: Backend

### 📐 Interface

- Service class (not HTTP endpoint)
- Used by CartController for HTTP API
- Methods return Promise<Result<T, Error>>

### 📦 Structure

**Dependencies**:

- CartRepository (database access)
- ProductRepository (product info)
- PricingService (price calculations, discounts)

**Class Members**:

```typescript
class CartService {
  constructor(
    private cartRepo: CartRepository,
    private productRepo: ProductRepository,
    private pricingService: PricingService,
  ) {}
}
```
````

---

### ⚡ Methods

#### addItem

**Signature:**

```typescript
- **input**: {
    userId: UUID,
    productId: UUID,
    quantity: number
  }
- **output**: {
    cart: Cart,
    item: CartItem
  } | {
    error: string,
    code: 'PRODUCT_NOT_FOUND' | 'INSUFFICIENT_STOCK' | 'INVALID_QUANTITY'
  }
```

**Contract**: Add product to user's cart with specified quantity, create cart if doesn't exist

**Flow**:

1.  **Validate Input**:
    Verify quantity is positive
    IF invalid → Error: 'INVALID_QUANTITY'

2.  **Verify Product Availability**:
    Check product exists
    IF not found → Error: 'PRODUCT_NOT_FOUND'

    Check sufficient stock available
    IF insufficient → Error: 'INSUFFICIENT_STOCK'

3.  **Retrieve or Create Cart**:
    Load user's cart from database
    IF cart doesn't exist THEN
    Create new cart for user

4.  **Update Cart Contents**:
    Search for product in cart items
    IF product already in cart THEN
    Increase existing item quantity by requested amount
    ELSE
    Create new cart item with:

        - Product reference
        - Requested quantity
        - Current product price (snapshot)

    Add item to cart

5.  **Finalize Transaction**:
    Recalculate cart total amount
    Persist updated cart to database

🚨 **Constraint**:

- Steps 4-5 MUST execute within single database transaction (atomic)
- Item price MUST be snapshotted at time of addition (not reference current price)
- Stock validation MUST occur before cart modification

**Side Effect**:

- Cart record created or updated in database
- CartItem record created or updated
- Product.reservedStock incremented (prevents overselling)

**Cleanup**: NONE

**💡 Implementation Hint**:

```typescript
// Use transaction for atomic cart updates
async addItem(userId, productId, quantity) {
  return await db.transaction(async (trx) => {
    // All operations within transaction
    const product = await productRepo.findById(productId, {trx});
    // ... rest of logic
    await cartRepo.save(cart, {trx});
  });
}
```

**🚨 Constraint**:

- MUST use database transaction (all-or-nothing)
- MUST validate product stock availability BEFORE adding
- MUST NOT allow quantity < 1
- MUST store price snapshot (priceAtAdd) for historical accuracy
- Operation MUST complete in < 500ms

**✅ Acceptance Criteria**:

- [ ] Successfully adds new product to cart
- [ ] Successfully updates quantity if product already in cart
- [ ] Rejects invalid quantity (< 1)
- [ ] Rejects non-existent product
- [ ] Rejects if insufficient stock
- [ ] Creates cart if user doesn't have one
- [ ] Calculates totalAmount correctly

**🧪 Test Scenarios**:

1. **Add New Item**:
   - Input: {userId: "user-1", productId: "prod-1", quantity: 2}
   - Precondition: User has empty cart
   - Expected: {cart: {items: [item], totalAmount: 39.98}, item: {quantity: 2}}

2. **Update Existing Item**:
   - Input: {userId: "user-1", productId: "prod-1", quantity: 3}
   - Precondition: Cart already contains prod-1 with quantity 2
   - Expected: {cart: {items: [item], totalAmount: 99.95}, item: {quantity: 5}}

3. **Insufficient Stock**:
   - Input: {userId: "user-1", productId: "prod-1", quantity: 100}
   - Precondition: Product has stock of 10
   - Expected: {error: "Insufficient stock", code: "INSUFFICIENT_STOCK"}

4. **Invalid Quantity**:
   - Input: {userId: "user-1", productId: "prod-1", quantity: 0}
   - Expected: {error: "Quantity must be at least 1", code: "INVALID_QUANTITY"}

---

#### removeItem

**Signature:**

```typescript
- **input**: {userId: UUID, itemId: UUID}
- **output**: {cart: Cart} | {error: string, code: 'ITEM_NOT_FOUND' | 'CART_NOT_FOUND'}
```

**Contract**: Remove item from cart and recalculate total

**Trigger**: User clicks remove button in cart UI

**Flow**:

1. **Retrieve Cart**:
   Load user's cart from database
   IF cart not found → Error: 'CART_NOT_FOUND'
2. **Locate Item**:
   Search for item in cart
   IF item not found → Error: 'ITEM_NOT_FOUND'
3. **Remove Item**:
   Delete item from cart
   Recalculate cart total amount
4. **Release reserved stock**
   Decrement product's reserved stock by item quantity
5. **Persist Changes**:
   Save updated cart to database

**Side Effect**:

- CartItem record deleted from database
- Recalculate totalAmount and updated
- Product.reservedStock decremented

**💡 Implementation Hint**:

```typescript
// Consider soft delete for audit trail
async removeItem(userId, itemId) {
  const item = await cartItemRepo.findById(itemId);
  item.deletedAt = new Date(); // Soft delete
  await cartItemRepo.save(item);
}
```

**🚨 Constraint**:

- MUST use database transaction
- MUST release product reserved stock
- MUST NOT allow removing items from other users' carts (authorization check)

**✅ Acceptance Criteria**:

- [ ] Successfully removes item from cart
- [ ] Recalculates totalAmount correctly
- [ ] Returns error if item not found
- [ ] Returns error if cart not found
- [ ] Prevents removing items from another user's cart

**🧪 Test Scenarios**:

1. **Remove Item**:
   - Precondition: Cart has 2 items
   - Input: {userId: "user-1", itemId: "item-1"}
   - Expected: {cart: {items: [remaining item], totalAmount: <updated>}}

2. **Item Not Found**:
   - Input: {userId: "user-1", itemId: "non-existent"}
   - Expected: {error: "Item not found", code: "ITEM_NOT_FOUND"}

---

## 💡 Global Implementation Hints

- Use dependency injection for repositories
- Consider implementing Result<T, E> type for error handling (no exceptions)
- Use TypeScript for type safety
- Cache cart data in Redis (invalidate on update)

## 🚨 Global Constraints

- All database operations MUST use transactions
- Service MUST NOT directly access HTTP request/response
- Service MUST be stateless (no instance variables for request data)
- All methods MUST be unit testable (mockable dependencies)

## ✅ Acceptance Criteria

- [ ] All methods have comprehensive unit tests
- [ ] Service integrates correctly with CartController
- [ ] Database queries are optimized (< 50ms per operation)
- [ ] Service handles concurrent cart updates correctly (pessimistic locking)

---

````
### Example 3: API Endpoint (Backend with Interface)

```markdown
# Project: Social Media Platform

---

## Domain Concepts

### Post
**Identity**: UUID
**Properties**:
- content: text (max 500 characters)
- authorId: reference to User
- createdAt: timestamp
- likesCount: integer (denormalized)
**Relationships**:
- Authored by one User (N:1)
- Has many Comments (1:N)
- Has many Likes (1:N)

---

## Component: CreatePostEndpoint
HTTP API endpoint for creating new posts.

### Role: Backend

### 📐 Interface
- **Method**: POST
- **Route**: /api/posts
- **Authentication**: Required (Bearer token)
- **Content-Type**: application/json
- **Rate Limit**: 10 posts per minute per user

**Request Schema**:
```json
{
  "content": "string (1-500 characters)",
  "attachments": ["url"] (optional, max 4 images)
}
````

**Response Schema (Success - 201)**:

```json
{
  "post": {
    "id": "uuid",
    "content": "string",
    "authorId": "uuid",
    "createdAt": "ISO8601 timestamp",
    "likesCount": 0,
    "attachments": ["url"]
  }
}
```

**Response Schema (Error - 4xx)**:

```json
{
  "error": {
    "message": "string",
    "code": "VALIDATION_ERROR | RATE_LIMIT_EXCEEDED | UNAUTHORIZED",
    "field": "string (optional, for validation errors)"
  }
}
```

---

### ⚡ Methods

#### handleRequest

**Signature:**

```typescript
- **input**: HTTPRequest {
    headers: {Authorization: "Bearer <token>"},
    body: {content: string, attachments?: string[]}
  }
- **output**: HTTPResponse {
    status: 201 | 400 | 401 | 429,
    body: {post: Post} | {error: ErrorDetails}
  }
```

**Contract**: Create new post after validating content and checking rate limits

**Trigger**: HTTP POST request to /api/posts

**Flow**:

1. **Authenticate request**:
   Extract bearer token from Authorization header
   Validate token with authentication service
   IF token invalid → Error: 401 'UNAUTHORIZED'

2. **Validate Content**:
   Verify content is not empty and within character limit
   IF content invalid → Error: 400 'VALIDATION_ERROR' (field: 'content')

   Verify attachments count does not exceed maximum
   IF too many attachments → Error: 400 'VALIDATION_ERROR' (field: 'attachments')

3. **Check Rate Limit**:
   Verify user has not exceeded post creation rate limit
   IF rate limit exceeded → Error: 429 'RATE_LIMIT_EXCEEDED'

4. **Create Post**:
   Create new post with validated content and attachments
   Associate post with authenticated user

5. 5. **Return Success**:
      Return created post with HTTP 201 status

**Side Effect**:

- Post record created in database
- User's post count incremented
- Rate limiter counter incremented
- Followers notified (async job queued)

**💡 Implementation Hint**:

```typescript
// Use Express.js middleware for auth and validation
router.post(
  "/api/posts",
  authenticateToken,
  validateRequestBody(createPostSchema),
  checkRateLimit,
  async (req, res) => {
    const post = await postService.create(req.body, req.user.id);
    res.status(201).json({ post });
  },
);
```

**🚨 Constraint**:

- MUST authenticate before processing
- MUST validate all inputs (never trust client)
- MUST enforce rate limits (prevent spam)
- MUST sanitize content (prevent XSS)
- MUST return appropriate HTTP status codes
- Response time MUST be < 300ms (p95)

**✅ Acceptance Criteria**:

- [ ] Creates post with valid authenticated request
- [ ] Returns 401 for unauthenticated requests
- [ ] Returns 400 for invalid content
- [ ] Returns 429 when rate limit exceeded
- [ ] Sanitizes content to prevent XSS
- [ ] Returns correct HTTP status codes

**🧪 Test Scenarios**:

1. **Successful Post Creation**:
   - Input: POST /api/posts, Auth: valid token, Body: {content: "Hello world"}
   - Expected: 201, {post: {id: uuid, content: "Hello world", ...}}

2. **Unauthorized Request**:
   - Input: POST /api/posts, Auth: missing or invalid, Body: {content: "Hello"}
   - Expected: 401, {error: {message: "Unauthorized", code: "UNAUTHORIZED"}}

3. **Content Too Long**:
   - Input: POST /api/posts, Auth: valid, Body: {content: <501 characters>}
   - Expected: 400, {error: {message: "Content must be 1-500 characters", code: "VALIDATION_ERROR", field: "content"}}

4. **Rate Limit Exceeded**:
   - Precondition: User has made 10 posts in last minute
   - Input: POST /api/posts, Auth: valid, Body: {content: "Another post"}
   - Expected: 429, {error: {message: "Rate limit exceeded...", code: "RATE_LIMIT_EXCEEDED"}}

---

## 💡 Global Implementation Hints

- Use Express.js or Fastify for HTTP server
- Apply helmet middleware for security headers
- Use express-validator for request validation
- Consider implementing request/response logging middleware

## 🚨 Global Constraints

- MUST use HTTPS in production (no plain HTTP)
- MUST include CORS headers for web clients
- MUST log all requests (for auditing)
- MUST implement request timeouts (30s max)
- API MUST be versioned (/api/v1/posts)

## ✅ Acceptance Criteria

- [ ] Endpoint passes security audit (OWASP Top 10)
- [ ] Endpoint has 95%+ test coverage
- [ ] Endpoint meets performance requirements (p95 < 300ms)
- [ ] Endpoint properly handles concurrent requests

---

````
---

## Best Practices

### 1. Writing Effective Contracts

**DO:**

- Start with action verb: "Authenticate user", "Calculate total"
- Be specific about outcome: "Generate JWT token valid for 24 hours"
- Make it testable: contract should directly translate to assertion

**DON'T:**

- Be vague: "Handle user login" (handle how?)
- Mix contract with implementation: "Use bcrypt to hash password" (that's a hint, not contract)
- Make it too high-level: "Make the user happy" (not testable)

**Examples:**

```markdown
❌ BAD:
**Contract**: Process the form

✅ GOOD:
**Contract**: Validate form inputs and save user profile data to database
````

---

### 2. Defining Precise Constraints

**DO:**

- Use RFC 2119 keywords (MUST, SHOULD, MAY)
- Be measurable: "< 200ms" not "fast"
- Separate concerns: security, performance, functional

**DON'T:**

- Use ambiguous terms: "should be quick", "reasonably secure"
- Conflate hints with constraints: "Consider using Redis" is a hint, not constraint

**Examples:**

```markdown
❌ BAD:
🚨 Constraint: The API should be fast and secure

✅ GOOD:
🚨 Constraint:

- Response time MUST be < 200ms (p95)
- MUST use TLS 1.3 or higher
- MUST validate all inputs before processing
- MUST NOT log sensitive data (passwords, tokens)
```

---

### 3. Scoping Flows Appropriately

**When to include Flow:**

- Multi-step processes (login, checkout, complex calculations)
- Branching logic (IF/ELSE conditions)
- Error handling paths
- Integration with multiple services

**When to omit Flow:**

- Simple atomic operations: "Toggle dark mode" → just flip boolean
- Single function call: "Get user by ID" → straightforward lookup
- Self-explanatory contracts: "Validate email format"

**Flow Abstraction Level:**

```markdown
❌ TOO DETAILED (implementation):
Flow:

1. Create bcrypt instance with cost 12
2. Call bcrypt.hash(password, salt)
3. Store result in user.passwordHash field

✅ GOOD (behavioral):
Flow:

1. Hash password using bcrypt (cost factor 12)
2. Store hash in database
3. Return success confirmation
```

**Guidelines**:

- `Flow` MAY be procedural when it captures observable sequencing or deterministic branching
- `Flow` MUST remain semantic, not line-by-line implementation pseudocode
- Include only behavior that affects outputs, state transitions, or external interactions
- Avoid framework-specific lifecycle or internal variable mutation details unless they change observable behavior

---

### 4. Balancing Hints vs Constraints

**Implementation Hint** (💡):

- Suggestions, best practices
- Can be ignored if alternative achieves same contract
- "Consider using...", "Recommended approach..."

**Constraint** (🚨):

- Mandatory requirements
- Cannot be violated
- "MUST", "MUST NOT"

**Examples:**

```markdown
💡 Implementation Hint:

- Consider using Redis for session storage (fast, scales well)
- Alternative: Memcached or in-memory store acceptable if performance requirements met

🚨 Constraint:

- Session data MUST persist across server restarts
- Session tokens MUST expire after 24 hours
```

**Rule of Thumb:**

- If violation breaks the system → Constraint
- If violation is suboptimal but workable → Hint

---

### 5. Writing Testable Acceptance Criteria

**DO:**

- Make each criterion independently verifiable
- Use observable behavior: "User sees error message"
- Include both happy path and error cases
- Be specific: "< 200ms" not "fast"

**DON'T:**

- Test implementation details: "Function uses bcrypt" (test contract instead)
- Make criteria too broad: "Everything works" (not actionable)
- Duplicate information already in constraints

**Examples:**

```markdown
❌ BAD:
✅ Acceptance Criteria:

- [ ] Code is written correctly
- [ ] No bugs
- [ ] Works well

✅ GOOD:
✅ Acceptance Criteria:

- [ ] User can submit form with valid inputs
- [ ] Invalid email shows error: "Please enter valid email"
- [ ] Form submission completes in < 500ms
- [ ] Success shows confirmation: "Profile updated"
- [ ] Network failure shows retry option
```

---

### 6. Defining Realistic Test Scenarios

**Components of Good Test Scenario:**

1. **Clear preconditions**: State of system before test
2. **Specific inputs**: Exact data used in test
3. **Expected outcomes**: Precise results (not "should work")
4. **Edge cases**: Boundary conditions, errors, race conditions

**Examples:**

```markdown
❌ BAD:
🧪 Test: User logs in and it works

✅ GOOD:
🧪 Test Scenarios:

1. **Successful Login**:
   - Precondition: User exists with email "test@example.com"
   - Input: {email: "test@example.com", password: "Valid123!"}
   - Expected: {token: <JWT>, expiresAt: <now + 24h>}

2. **Account Locked After 5 Failed Attempts**:
   - Precondition: User has 4 failed login attempts in last 10 minutes
   - Input: {email: "test@example.com", password: "wrong"}
   - Expected: {error: "Account locked for 10 minutes", code: "ACCOUNT_LOCKED"}

3. **Concurrent Login Attempts**:
   - Precondition: User credentials are valid
   - Input: 2 simultaneous login requests from different IPs
   - Expected: Both succeed, each gets unique session token
```

---

### 7. Domain Concepts Best Practices

**DO:**

- Use business terminology (User, Order, Payment)
- Define relationships clearly (1:1, 1:N, N:M)
- Keep properties semantic (what it represents, not how it's stored)
- Include enums for constrained values

**DON'T:**

- Use technical terms (UserEntity, OrderDTO, PaymentRecord)
- Include implementation details (database table names, column types)
- Mix data model with UI concerns

**Examples:**

```markdown
❌ BAD:

### UserEntity

**Properties**:

- user_id: integer (primary key)
- email_address: varchar(255)
- password_bcrypt: varchar(60)
- created_timestamp: datetime

✅ GOOD:

### User

**Identity**: UUID (universally unique identifier)
**Properties**:

- email: unique authentication identifier
- displayName: user's chosen public name
- accountStatus: enum (active, suspended, deleted)
- registrationDate: timestamp of account creation
  **Relationships**:
- Has many Orders (1:N)
```

---

### 8. Component Naming Conventions

**Frontend (Presentation):**

- Components: `UserProfileCard`, `LoginButton`, `TaskList`
- Capabilities: `onClick`, `onHover`, `dragStart`, `editTitle`
- Use action verbs for capabilities: `select`, `move`, `resize`

**Backend:**

- Services: `AuthenticationService`, `PaymentService`, `EmailService`
- Endpoints: `CreatePostEndpoint`, `GetUserEndpoint`
- Methods: `authenticateUser`, `processPayment`, `sendEmail`
- Use business domain verbs: `authenticate`, `authorize`, `validate`

**General Rules:**

- PascalCase for component names
- camelCase for capabilities/methods
- Be specific: `UserProfileCard` not `Card`
- Avoid abbreviations: `Authentication` not `Auth` (unless domain standard)

---

### 9. Versioning ISL Documents

**Include Version Metadata:**

```markdown
# Project: TaskManager

**Version**: 2.1.0
**ISL Version**: 1.6
**Last Updated**: 2026-01-20
**Breaking Changes**: None since 2.0.0
```

**Version Numbering:**

- **Major** (X.0.0): Breaking changes to Domain Concepts or component contracts
- **Minor** (0.X.0): New components or capabilities (backwards compatible)
- **Patch** (0.0.X): Clarifications, constraint additions, test improvements

**Document Changes:**

```markdown
## Changelog

### v2.1.0 (2026-01-20)

- Added Component: NotificationService
- Enhanced TaskCard: added priority indicator
- Clarified constraint on UserService.deleteAccount

### v2.0.0 (2026-01-10) - BREAKING

- Changed User.role from string to enum
- Renamed Component: TaskManager → TaskService
```

---

### 10. Common Pitfalls to Avoid

#### Pitfall 1: Mixing Levels of Abstraction

```markdown
❌ BAD (mixes intent with implementation):
**Contract**: Hash password with bcrypt cost 12 and store in PostgreSQL users table

✅ GOOD (separates layers):
**Contract**: Securely store user password
🚨 Constraint: Password MUST be hashed (never plaintext)
💡 Implementation Hint: Use bcrypt with cost factor 12
```

#### Pitfall 2: Over-Specifying Visual Details

```markdown
❌ BAD (too specific for intent spec):
📐 Appearance:

- Font: Inter, 14px, weight 500, line-height 1.5, letter-spacing -0.01em
- Margin: 16px top, 12px right, 8px bottom, 12px left
- Box shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)

✅ GOOD (intent-level):
📐 Appearance:

- Typography: Clear, readable body text
- Spacing: Comfortable padding and margins
- Elevation: Subtle shadow for card effect
  💡 Implementation Hint: Consider using Tailwind classes: text-sm font-medium shadow-sm p-4
```

#### Pitfall 3: Unclear Constraint Scope

```markdown
❌ BAD (ambiguous):
🚨 Constraint: Must be fast

✅ GOOD (measurable, scoped):
🚨 Constraint:

- Initial page load MUST complete in < 2 seconds (p95)
- API response time MUST be < 200ms (p95)
- UI MUST remain responsive during data loading (show loading state)
```

#### Pitfall 4: Test Scenarios Without Expected Outcomes

```markdown
❌ BAD:
🧪 Test: User clicks login button

✅ GOOD:
🧪 Test Scenarios:

1. **Login with Valid Credentials**:
   - Input: {email: "valid@test.com", password: "correct"}
   - Expected: Redirect to /dashboard, token stored in auth context
2. **Login with Invalid Credentials**:
   - Input: {email: "valid@test.com", password: "wrong"}
   - Expected: Error message "Invalid email or password", stay on login page
```

#### Pitfall 5: Forgetting Role Separation

```markdown
❌ BAD (business logic in Presentation):
Component: PriceDisplay
Role: Presentation
⚡ calculateDiscount
Flow: 1. IF user.isPremium THEN discount = 0.20 2. ELSE discount = 0.10 3. finalPrice = originalPrice \* (1 - discount)
→ Violates Rule 4 (business logic in Presentation)

✅ GOOD:
Component: PriceDisplay
Role: Presentation
⚡ displayPrice
**Contract**: Render formatted price with discount applied
**Input**: {originalPrice: number, finalPrice: number}
**Flow**: 1. Display originalPrice (strikethrough if discount applied) 2. Display finalPrice (prominent) 3. Show discount percentage if applicable
→ Calculation delegated to Backend (PricingService)
```

## Appendix A: Quick Reference Card

```markdown
# ISL Quick Reference

## Document Structure

# Project: Name

## Domain Concepts

### Entity

## Component: Name

### Role: Presentation | Backend | Domain | Business Logic | Test

### 📐 Appearance / Interface

### 📦 Content / Structure

### ⚡ Capabilities / Methods

#### CapabilityName

### 💡 Global Implementation Hints

### 🚨 Global Constraints

### ✅ Acceptance Criteria

### 🧪 Test Scenarios

## Capability Structure

#### CapabilityName

**Signature:**

- input: {params}
- output: {result} | {error}
  **Contract**: Promise
  **Trigger**: Event
  **Flow**: Steps
  **Side Effect**: Mutations
  **Cleanup**: Finalization
  💡 **Implementation Hint**: Guidance
  🚨 **Constraint**: Rules
  ✅ **Acceptance Criteria**: Tests
  🧪 **Test Scenarios**: Cases

## Canonical Rules

1. ⚡🚨✅🧪 = NORMATIVE
2. Capability > Global > Contract > Hint
3. Same ISL → Same Code
4. Presentation ≠ Business Logic
5. OPTIONAL = may omit, not ignore
```

---

## Appendix B: ISL Template

```markdown
# Project: [Your Project Name]

[Brief project description]

**Version**: 1.0.0
**ISL Version**: 1.6
**Created**: YYYY-MM-DD

---

## Domain Concepts

### [EntityName]

**Identity**: How uniquely identified
**Properties**:

- property1: description
- property2: description
  **Relationships**:
- Relationship to Entity (cardinality)

---

## Component: [ComponentName]

[Component description]

### Role: Presentation | Backend | Domain | Business Logic | Test

### 📐 Appearance / Interface (OPTIONAL)

- [Presentation: CSS, colors, layout]
- [Backend: Routes, schemas, headers]

### 📦 Content / Structure (OPTIONAL)

- [Presentation: DOM structure]
- [Backend: Dependencies, class members]

---

### ⚡ Capabilities / Methods (OPTIONAL)

#### [CapabilityName]

**Signature:** (OPTIONAL)

- **input**: {param: type}
- **output**: {result: type} | {error: type}

**Contract**: What this capability promises

**Trigger**: Activation event

**Flow**: (REQUIRED if multi-step)

1. Step 1
2. Step 2

**Side Effect**: State mutations

**Cleanup**: Finalization actions

**💡 Implementation Hint**: Guidance

**🚨 Constraint**: Rules

**✅ Acceptance Criteria**:

- [ ] Criterion 1
- [ ] Criterion 2

**🧪 Test Scenarios**:

1. **Scenario**: Input → Expected

---

### 💡 Global Implementation Hints (OPTIONAL)

- Architectural notes
- Recommended libraries

### 🚨 Global Constraints (OPTIONAL)

- Component-wide rules

### ✅ Acceptance Criteria (OPTIONAL)

- [ ] Component criterion 1
- [ ] Component criterion 2

### 🧪 Test Scenarios (OPTIONAL)

1. **Integration Scenario**: Description
```

---

**END OF SPECIFICATION**

---

_This document is the official specification for Intent Specification Language (ISL) version 1.6. For questions, contributions, or support, please visit [repository/forum URL]._
