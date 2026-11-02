# ISL Code Generation Protocol

This document defines the mandatory protocol for translating ISL specifications into executable code artifacts. It ensures that file organization remains deterministic and enforces the distinction between **Source** (ISL) and **Artifact** (Code).

## 1. The Compilation Pipeline

The generation process is divided into two distinct phases to ensure determinism and referential integrity:

1.  **Build Phase (The Builder)**: Resolves dependencies, determines structure, and produces a build manifest.
2.  **Compile Phase (The Generator)**: Translates resolved contexts into executable code.

### Directory Structure Standard

- R Contains source `.isl.md` files.
- `build/`: Contains intermediate build artifacts (`build-manifest.json`, resolved contexts).
- `bin/`: Contains the final generated code (The "Binary" equivalent). **Files in `bin/` are read-only artifacts.**

## 2. Phase 1: Context Preparation (The Builder)

The Builder is responsible for analyzing the project structure and preparing self-contained contexts for the LLM.

### 1. Dependency Analysis & Hierarchy

- **Scanning**: The Builder scans all `.isl.md` files to identify nodes.
- **Graph Construction**: It builds a dependency graph based on `> **Reference**:` directives.
- **Circular Reference Check**: It MUST detect and report circular references (e.g., A -> B -> A) as fatal errors.
- **Topological Sort**: It determines the deterministic build order (leaves first, then dependents).

### 2. Manifest Generation

- **Build Manifest**: Generates `build/build-manifest.json` containing the ordered list of compilation units.
- **Hashing**: Calculates content hashes to enable incremental builds.

### 3. Context Generation (For each file in order)

- **Interface Extraction (.ref.md)**: Extracts public contracts (Headers, Signatures, Constraints) and strips implementation details (Flows).
- **Transclusion (.build.md)**: Resolves all `> **Reference**:` directives by injecting the content of the referenced `.ref.md` files directly into the context. This produces a standalone file containing everything needed to generate the code.

## 3. Phase 2: Code Generation (The Compiler)

The Compiler executes the generation pipeline using the artifacts prepared by the Builder.

### 1. Execution Loop

- **Manifest Loading**: The Compiler loads `build/build-manifest.json`.
- **Ordered Execution**: It iterates through components in the strict topological order calculated by the Builder.

### 2. Context Assembly (Dependency Injection)

For each component, the Compiler assembles the context:

- **Reference Context (`.ref`)**: Loaded from the `.build.md`, providing Contracts, Constraints, and Usage Guides for dependencies.
- **Implementation Signatures**: The Compiler checks for existing `.sign.ts` files for all dependencies. If present, these signatures are injected into the prompt.

**Result**: The component is compiled with **Intent** (ISL Source), **Dependency Contracts** (from `.ref`), and **Dependency Realities** (from `.sign.ts`). This ensures the component is autonomous but fully aware of its dependencies' interfaces, minimizing context noise.

### 3. Generation & Output

- **Prompt Strategy**: The LLM is instructed to generate both the **Implementation Code** and the **Public Signatures** (exports).
- **Path Resolution**: The output filename is derived strictly from the `**Implementation**` key in the ISL.
- **Output Format Standard**: To ensure deterministic parsing, the LLM MUST return a multipart response using strict delimiters:
  ```text
  #[CODE]
  (The implementation code)
  #[CODE-END]
  #[SIGNATURE]
  (The TypeScript declaration signature)
  #[SIGNATURE-END]
  ```
- **Artifact Writing**:
  - **Code File**: Written to `bin/` with the "DO NOT EDIT" header.
  - **Signature File**: Written as `*.sign.ts` alongside the code. This file becomes the source of truth for subsequent compilations.

## 4. Artifact Categorization Standards (Convention)

Since the `**Implementation**` path is explicitly defined in the ISL, this section defines the **Conventions** that the ISL Author (Human or LLM) MUST follow when defining paths. The Compiler does not infer these; it blindly follows the ISL.

**Standard Semantic Categories:**

- **Component**: UI or Backend main unit.
- **Pure Function**: Deterministic, no side effects, no I/O.
- **Helper**: Supporting logic, reusable, non-core, may have side effects.
- **Service**: Business logic, orchestration, state management.
- **Adapter**: Integration boundary (external APIs, DBs).
- **Model / Type**: Data structures, domain models, schemas.

## 5. File Structure Convention

**Rule**: The filesystem structure inside `bin/` is determined by the `**Implementation**` header in the ISL source. To maintain a clean architecture, ISL files SHOULD define paths following these rules:

1.  **Source of Truth**: The `**Implementation**` header in `.isl.md` defines the relative path inside `bin/`.
2.  **Path Convention (Recommended)**:
    - `components/{ComponentName}/{ArtifactName}`
    - `services/{ServiceName}/{ArtifactName}`
    - `model/{DomainName}/{ArtifactName}`

## 6. Naming Conventions (Convention)

To enable deterministic tooling and maintain a readable project structure, ISL Authors SHOULD follow strict naming conventions when defining capability names. The Generator itself does not enforce these; it follows the ISL.

**Recommended Naming Signals for Capabilities:**

- `computeX`, `calculateX`, `formatX` → **Pure Functions**
- `useX`, `buildX`, `resolveX` → **Helpers**
- `XService` → **Services**
- `XAdapter` → **Adapters**
- `XModel`, `XType` → **Models**

## 7. Artifact Integrity & Linking

To support the "ISL as Source" paradigm:

1.  **Read-Only Artifacts**: Generated files in `bin/` are disposable.
2.  **Signatures**: For every generated component, a corresponding `.sign.ts` MUST be generated. This file contains the public interface (exports) of the component to enable Dynamic Linking in dependent components.
3.  **Gen-Lock (Incremental Integrity)**: A `gen-lock.json` tracks the hash of the **Resolved Build Context** (Source + Dependencies).
    - **Purpose**: It enables smart incremental builds. If a dependency changes (modifying the included `.ref.md`), the context hash changes, forcing a recompilation of the dependent component even if its source ISL was not touched.

## 8. Generation Scope & Content

The Generator operates within the strict boundary of the single file being compiled.

**Content Requirements:**

- **Implementation of Intent**: The code MUST implement the Contracts and Flows defined in the ISL.
- **Internal Helpers**: The Generator MAY create internal helper functions or constants _within the generated file_ if required to satisfy the logic.
- **Boilerplate & Imports**: The Generator MUST include all necessary imports and framework scaffolding required to make the file executable.

**Prohibitions:**

- **No Scope Creep**: Do NOT generate features not implied by the ISL.
- **No External Files**: The Generator MUST NOT attempt to create or modify files other than the target implementation file.
- **Role Adherence**: Do NOT generate visual logic in Backend components or business logic in Presentation components.

## 9. End-to-End Process Flow

### Step 1: The Builder

1.  Scans `.isl.md` files.
2.  Resolves imports/references.
3.  Calculates hashes.
4.  Writes `build/build-manifest.json`.

### Step 2: The Compiler

1.  Reads `build-manifest.json`.
2.  Checks `gen-lock.json` for changes.
3.  For each changed component:
    - Injects Dependency Interfaces (from `.sign.ts` of dependencies).
    - Generates code.
    - Writes to `bin/path/to/file`.
    - Writes `bin/path/to/file.sign.ts`.
    - Updates `gen-lock.json`.
