/** How Spec `Call:` names map to exported symbols in generated code / tests (EXT-001 / EXT-002). */
export type CallSymbolStyle = "as-is" | "pascal-case" | "snake-case";

export interface StackVerifyConfig {
  /** Map ISL Call name → stack symbol for generated tests / lookup-decl. */
  callSymbol: CallSymbolStyle;
  /** Suffix after implementation basename, e.g. `.test.js` → `domain-sheet.test.js`. */
  testSuffix: string;
  /** Local runner used by `npm run verify`. */
  runner: "vitest" | "dotnet" | "none";
}

export interface StackConfig {
  id: string;
  techStack: string[];
  extensions: {
    default: string;
    [role: string]: string;
  };
  promptPersona: string;
  constraints: string[];
  safetyConstraints: string[];
  signatureFormat: string;
  /** EXT-001 verify / generated-test conventions. */
  verify?: StackVerifyConfig;
}

/** Map Spec Call identifier to stack export/method name. */
export function mapCallToSymbol(
  call: string,
  style: CallSymbolStyle | undefined,
): string {
  const name = (call || "").trim();
  if (!name) return name;
  if (style === "pascal-case") {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  if (style === "snake-case") {
    return name
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/-/g, "_")
      .toLowerCase();
  }
  return name;
}

/** One alternate name to try after a miss (EXT-002). */
export function alternateMappedName(
  call: string,
  style: CallSymbolStyle | undefined,
): string | null {
  const primary = mapCallToSymbol(call, style);
  if (style === "pascal-case") {
    const asIs = mapCallToSymbol(call, "as-is");
    return asIs !== primary ? asIs : null;
  }
  if (style === "as-is") {
    const pascal = mapCallToSymbol(call, "pascal-case");
    return pascal !== primary ? pascal : null;
  }
  if (style === "snake-case") {
    const asIs = mapCallToSymbol(call, "as-is");
    return asIs !== primary ? asIs : null;
  }
  return null;
}

// GUARDRAILS: Universal rules applicable to ANY programming language to prevent common runtime errors.
const UNIVERSAL_GUARDRAILS = [
  "Null Safety: ALWAYS use safe access (`?.`, `!= null`, `is not None`) for nested properties/uninitialized variables",
  "Default Init: prefer valid default values (empty string/array, zero object) vs `null`/`undefined`",
  "Async State: EXPLICITLY handle loading (Loading, retry, blocking) - never assume data is immediately available",
];

// Export alias for backward compatibility if needed, though internal usage is preferred
export const UNIVERSAL_SAFETY_CONSTRAINTS = UNIVERSAL_GUARDRAILS;

const PYTHON_SAFETY = [
  "Null Safety: ALWAYS use safe access (`is not None`) for nested properties/uninitialized variables",
  "Default Init: prefer valid default values (empty string/list, zero) vs `None`",
  "Error Handling: Use try/except blocks for external operations (I/O, API calls)",
];

export const STACKS: Record<string, StackConfig> = {
  "react-js": {
    id: "react-js",
    techStack: ["React 18", "TailwindCSS", "Javascript (ES6+)", "Fetch API"],
    extensions: {
      default: ".jsx",
      Presentation: ".jsx",
      "Business Logic": ".js",
      Domain: ".js",
      Backend: ".js",
      Model: ".js",
      Test: ".js",
    },
    verify: {
      callSymbol: "as-is",
      testSuffix: ".test.js",
      runner: "vitest",
    },
    promptPersona: "Senior React Developer - Functional Components & Hooks",
    constraints: [
      "NO: TypeScript types, JsDoc, import @typedef, defaultProps (use ES6 default params)",
      "EXT-001 tests: file `bin-react-js/<implBasename>.test.js`; write tests BEFORE impl when eligible scenarios exist. Each Spec `Call:` MUST be imported as a **named** export: `import { <Call> } from \"./<implBasename>.js\"` (callSymbol=as-is). NEVER import a default factory and call `factory().<Call>()`. If `bench/call-map.json` (or workspace `call-map.json`) lists `unit.Call` → `{file, export}`, the test import MUST use that `export` name.",
      "React Hook Rules: Hooks (functions starting with `use`) MUST be called at the top level. NEVER call hooks inside loops, conditions, or nested functions (including callbacks of `useMemo`, `useEffect`).",
      "React Stability: Functions passed as props to child components or used in `useEffect` dependencies MUST be wrapped in `useCallback` to ensure referential stability.",
      "Custom Hooks Signature: Custom Hooks MUST always accept a single configuration object as an argument. Example: `useMyHook({ param1, param2 })`. NEVER use positional arguments.",
      "Naming Conventions: Function exports (Logic/Helpers/Domain capabilities) MUST be camelCase named exports matching Spec Call (e.g. `export function applyBps`). React Presentation components MAY use `export default`. Domain **entity** factories (data shapes) MAY be PascalCase named exports — not a substitute for capability exports.",
      "Domain & Business Logic capabilities: MUST `export function <Call>` / `export const <Call>` for every Capability in SOURCE. FORBIDDEN: `export default function Unit()` that returns `{ applyBps, ... }` or any default-export facade wrapping capabilities.",
      'Presentation Import: signature "export default [Name]" → `import Name from...`. Domain/Logic capability Import: always `import { Name } from...`.',
      "Import: Use correct **Implementation** as path for import, using relative paths",
      'Import: the start root MUST be "./ (e.g. \`from "./domain"\`). NEVER use absolute imports or paths starting with src/ or similar.',
      "Import: relative, ONLY necessary for execution",
      "Runtime: import ONLY real constants/functions/classes. NEVER types/interfaces (they do not exist in JS)",
      "Signature: ReactElement → use as JSX `<Comp />`",
      "Instantiation: use object literals `{}` or Factory Functions. NEVER use `new` for project components. Use `new` ONLY for built-in classes (Date, Map).",
      "Domain: only ES6 objects",
      "Domain Entity Naming: For each Entity (e.g. `User`), generate an exported Factory Function with the SAME PascalCase name (e.g. `export const User = (data) => ({...})`). NO `create`/`make` prefixes. Capability Calls remain separate camelCase named exports.",
      "Domain Objects: MUST be instantiated using Domain Factory Functions (e.g. `Paddle()`). DO NOT create ad-hoc object literals that might miss properties.",
      "Hooks: Custom Hooks (useName). Exposed functions MUST be stable (use refs for state access) to prevent consumer re-renders.",
      "Consumption: Hook import → call hook to get function. NO direct import of functions from hooks",
      'Avoid "React has detected a change in the order of Hooks called by [Component]. This will lead to bugs and errors if not fixed." ',
      "Business Logic: MUST use Named Exports for every Capability Call. DO NOT export a singleton object or default factory.",
      "Immutability: Always return new objects/arrays when updating state. Never mutate state in place.",
      "Visibility: All Capabilities in Business Logic/Domain MUST be named-exported. Presentation capabilities are internal to the component.",
      "Presentation Components: MUST NOT expose imperative methods (render, update). Logic must be driven by Props/State changes.",
      "Comments: standard syntax only",
    ],
    safetyConstraints: [
      ...UNIVERSAL_GUARDRAILS,
      "State Init: if synchronous use Lazy Init `useState(() => init())`. NEVER `useEffect` for synchronous init",
      "Conditional Render: state `null`/`undefined` → verify before passing to children (object or nested properties) `{data && <Child data={data} />}`",
      "Default Props: always default in destructuring if object might be missing",
    ],
    signatureFormat: `You MUST output the signature as a TypeScript Declaration (pseudo-code) block.
CRITICAL FOR FACTORIES: For Factory Functions (Domain Entities), you MUST expand the return type object literal to show ALL properties. NEVER return 'any', 'object' or the interface name alone.
Examples:
- Entity Factory: \`export const UserEntity: (data?: UserEntity) => { id: string; name: string; isActive: boolean };\`
- Function: \`export function calculate(a: number): number;\`
- Component: \`export default function MyComponent(props: { title: string }): React.Element;\`
- Hook: \`export function useMyHook(): { data: any };\``,
  },
  "python-fastapi": {
    id: "python-fastapi",
    techStack: ["Python 3.10", "FastAPI", "Pydantic"],
    extensions: { default: ".py" },
    verify: {
      callSymbol: "snake-case",
      testSuffix: ".py",
      runner: "none",
    },
    promptPersona: "Senior Python Backend Developer - FastAPI & Pydantic",
    constraints: [
      "Export: standard Python classes/functions",
      "Type Hints: Python 3.10+",
      "Models: Pydantic for domain",
      "Import: absolute or standard relative",
    ],
    safetyConstraints: [
      ...UNIVERSAL_GUARDRAILS,
      "Models: default values in Pydantic to avoid missing fields",
    ],
    signatureFormat: `You MUST output the signature as Python Type Hints (Stub file style).
Examples:
- Function: \`def calculate(a: int) -> int: ...\`
- Class: \`class MyModel(BaseModel): ...\`
- Variable: \`MAX_VALUE: int = ...\``,
  },
  python: {
    id: "python",
    techStack: ["Python 3.10"],
    extensions: {
      default: ".py",
      Presentation: ".py",
      "Business Logic": ".py",
      Domain: ".py",
      Model: ".py",
      Backend: ".py",
    },
    verify: {
      callSymbol: "snake-case",
      testSuffix: ".py",
      runner: "none",
    },
    promptPersona: "Senior Python Developer",
    constraints: [
      "Export: standard Python classes/functions",
      "Type Hints: Python 3.10+",
      "Import: absolute or standard relative",
      "Domain: use dataclasses for data structures",
      "Style: Follow PEP 8 guidelines",
    ],
    safetyConstraints: [...PYTHON_SAFETY, ...UNIVERSAL_GUARDRAILS],
    signatureFormat: `You MUST output the signature as Python Type Hints (Stub file style).
Examples:
- Function: \`def calculate(a: int) -> int: ...\`
- Class: \`class MyClass: ...\`
- Variable: \`MAX_VALUE: int = ...\``,
  },
  csharp: {
    id: "csharp",
    techStack: ["C# 12", ".NET 8"],
    extensions: {
      default: ".cs",
      Presentation: ".cs",
      "Business Logic": ".cs",
      Domain: ".cs",
      Backend: ".cs",
      Model: ".cs",
      Test: ".cs",
    },
    verify: {
      callSymbol: "pascal-case",
      testSuffix: ".Tests.cs",
      runner: "dotnet",
    },
    promptPersona: "Senior C# developer - clear types, immutable-friendly records where apt",
    constraints: [
      "SCOPE: library / headless C# only — classes, records, orchestrators, smoke. NOT a full UI app (use `blazor` or `winforms` for apps)",
      "EXT-001 tests: file `bin-csharp/<implBasename>.Tests.cs`; Call `parseA1` → method/factory `ParseA1` (PascalCase); write tests BEFORE impl when eligible scenarios exist",
      "Language: C# 12 / .NET 8 style; namespace: `SheetWorkspace` for sheet demo; `TariffeV2` for benchmarks/tariffe-v2; otherwise follow ISL/workspace",
      "NO: JavaScript, TypeScript, JSX, Python, Razor, WinForms controls",
      "Domain entities: public records or sealed classes with factory methods named like the entity (PascalCase), e.g. `CellAddr.Create(...)`",
      "Business Logic / Domain modules for Call-based units: prefer `public static class` named from the unit basename in PascalCase (`domain-money` → `DomainMoney`, `logic-quote` → `LogicQuote`); each Spec `Call` MUST be a **public static** method with that PascalCase name (e.g. `applyBps` → `ApplyBps`). Do NOT hide Calls behind a default factory instance.",
      "If `bench/call-map-csharp.json` or `bench/csharp-api-contract.md` exists in the workspace, method/file/class names MUST match that contract (score loads them by reflection).",
      "JSON-shaped Calls: first parameter and return type MUST deserialize/serialize to the Spec Signature JSON (camelCase property names via System.Text.Json case-insensitive bind).",
      "Imports: use project-local types in the same namespace; do not invent NuGet deps unless required",
      "Nullability: enable nullable reference types; use `?` and explicit null checks",
      "Immutability: prefer returning new collections/records over mutating inputs",
      "Hooks in ISL (`useX`): map to a plain C# orchestrator class (not React); Presentation maps to UI-agnostic view-models or skip if headless",
      "File name MUST match Implementation basename + `.cs` (e.g. `./domain-sheet` → `domain-sheet.cs`)",
      "Header comment DO NOT EDIT / Source isl required at top of each generated file",
    ],
    safetyConstraints: [
      ...UNIVERSAL_GUARDRAILS,
      "Never throw for expected domain errors when ISL uses error objects — return SheetError / result types instead",
      "Guard divide-by-zero and missing refs explicitly",
    ],
    signatureFormat: `You MUST sketch C# signatures (not TypeScript).
Examples:
- Factory: \`public static CellAddr Create(string col, int row);\`
- Function: \`public static ParseResult Parse(string raw);\`
- Class: \`public sealed class FormulaParser { ... }\``,
  },
  blazor: {
    id: "blazor",
    techStack: ["Blazor", ".NET 8", "Razor components"],
    extensions: {
      default: ".razor",
      Presentation: ".razor",
      "Business Logic": ".cs",
      Domain: ".cs",
      Backend: ".cs",
      Model: ".cs",
      Test: ".cs",
    },
    verify: {
      callSymbol: "pascal-case",
      testSuffix: ".Tests.cs",
      runner: "dotnet",
    },
    promptPersona: "Senior Blazor developer - full app: Razor UI + C# domain/logic in one stack",
    constraints: [
      "SCOPE: full Blazor app — like react-js. ALL units for this compile land in `bin-blazor/` (Presentation `.razor` + Domain/Logic/Backend `.cs`). Do NOT depend on `bin-csharp` or re-use another stack's engine",
      "EXT-001 Domain/Logic tests: same PascalCase Call mapping as csharp; UI e2e out of scope for verify v1",
      "UI stack: Blazor (.NET 8). Presentation units MUST be `.razor` components",
      "NO: React, JSX, Vue, WinForms",
      "Component file names are PascalCase (runtime maps `./formula-bar` → `FormulaBar.razor`)",
      "Generate Domain, Business Logic, Backend, and orchestrators as `.cs` beside the Razor UI in the same `bin-blazor/` output (namespace e.g. `SheetWorkspace`)",
      "Props from ISL Signature → `[Parameter]` properties; callbacks → `EventCallback<...>`",
      "Keep components presentational; mutate sheet state only via UseSheet methods passed from AppShell",
      "Header HTML comment DO NOT EDIT / Source isl at top of each generated .razor file; same for `.cs` headers",
      "Prefer simple HTML + CSS (or scoped CSS) — no mandatory component library",
    ],
    safetyConstraints: [
      ...UNIVERSAL_GUARDRAILS,
      "Do not steal focus incorrectly during formula ref-pick (preventDefault on mousedown when picking refs)",
      "Disable formula/style controls when selection is null",
    ],
    signatureFormat: `Sketch Blazor component parameters and C# engine signatures in the same stack.
Examples:
- \`[Parameter] public string Value { get; set; }\`
- \`[Parameter] public EventCallback<string> OnChange { get; set; }\`
- Component: \`FormulaBar.razor\`
- Engine: \`public sealed class FormulaParser { ... }\``,
  },
  winforms: {
    id: "winforms",
    techStack: ["WinForms", ".NET 8", "C# 12"],
    extensions: {
      default: ".cs",
      Presentation: ".cs",
      "Business Logic": ".cs",
      Domain: ".cs",
      Backend: ".cs",
      Model: ".cs",
      Test: ".cs",
    },
    verify: {
      callSymbol: "pascal-case",
      testSuffix: ".Tests.cs",
      runner: "dotnet",
    },
    promptPersona: "Senior WinForms developer - full desktop app: Forms/controls + C# domain/logic in one stack",
    constraints: [
      "SCOPE: full WinForms app — like react-js / blazor. ALL units for this compile land in `bin-winforms/` (Forms + Domain/Logic/Backend). Do NOT depend on `bin-csharp` or re-use another stack's engine",
      "EXT-001 Domain/Logic tests: same PascalCase Call mapping as csharp; UI e2e out of scope for verify v1",
      "UI: Windows Forms (.NET 8). Presentation units are Form / UserControl classes (PascalCase file names)",
      "NO: React, JSX, Blazor/Razor, WPF unless ISL explicitly asks",
      "Generate Domain, Business Logic, Backend, and orchestrators as `.cs` in the same `bin-winforms/` output",
      "Wire UI events to UseSheet / store methods; keep domain pure",
      "Header comment DO NOT EDIT / Source isl required at top of each generated file",
      "Prefer standard WinForms controls; no mandatory third-party UI kits",
    ],
    safetyConstraints: [
      ...UNIVERSAL_GUARDRAILS,
      "Do not steal focus incorrectly during formula ref-pick (e.g. suppress selection change while picking cell refs)",
      "Disable formula/style controls when selection is null",
    ],
    signatureFormat: `Sketch WinForms UI and C# engine signatures in the same stack.
Examples:
- Form: \`public partial class AppShellForm : Form { ... }\`
- Control handler: \`private void OnCellClick(object? sender, EventArgs e)\`
- Engine: \`public sealed class FormulaParser { ... }\``,
  },
};

export function getStackConfig(id: string): StackConfig {
  return STACKS[id] || STACKS["react-js"];
}
