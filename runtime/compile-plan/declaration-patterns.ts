/**
 * EXT-002: per-stack declaration / type search patterns for lookup-decl.
 * Templates use `{Name}` placeholder (escaped at runtime).
 */

export type LookupKind = "value" | "type";

export interface StackLookupConfig {
  declarationPatterns: string[];
  typePatterns: string[];
  lookupFileExtensions: string[];
  excludeTestGlobs: string[];
  /** Scan .razor only inside @code / @functions blocks. */
  razorCodeBlocks?: boolean;
}

const JS_VALUE = [
  String.raw`(?:export\s+)?(?:async\s+)?function\s+{Name}\s*\(`,
  String.raw`(?:export\s+)?(?:const|let|var)\s+{Name}\s*=`,
  String.raw`static\s+{Name}\s*\(`,
  String.raw`^\s*{Name}\s*\(`,
];

const JS_TYPE = [
  String.raw`(?:export\s+)?class\s+{Name}\b`,
  String.raw`(?:export\s+)?(?:const|let)\s+{Name}\s*=`,
];

const PY_VALUE = [
  String.raw`(?:async\s+)?def\s+{Name}\s*\(`,
];

const PY_TYPE = [
  String.raw`class\s+{Name}\s*[:(]`,
];

const CS_VALUE = [
  String.raw`(?:public|internal|protected|private|static|virtual|override|async|partial|[\s])+\b{Name}\s*\(`,
];

const CS_TYPE = [
  String.raw`(?:public|internal|protected|private|static|partial|[\s])+(?:class|record|interface|enum|struct)\s+{Name}\b`,
];

const DEFAULT_EXCLUDE = [
  "*.test.js",
  "*.test.jsx",
  "*.spec.js",
  "*.spec.jsx",
  "*.Tests.cs",
];

export const STACK_LOOKUP: Record<string, StackLookupConfig> = {
  "react-js": {
    declarationPatterns: JS_VALUE,
    typePatterns: JS_TYPE,
    lookupFileExtensions: [".js", ".jsx"],
    excludeTestGlobs: DEFAULT_EXCLUDE,
  },
  python: {
    declarationPatterns: PY_VALUE,
    typePatterns: PY_TYPE,
    lookupFileExtensions: [".py"],
    excludeTestGlobs: ["test_*.py", "*_test.py"],
  },
  "python-fastapi": {
    declarationPatterns: PY_VALUE,
    typePatterns: PY_TYPE,
    lookupFileExtensions: [".py"],
    excludeTestGlobs: ["test_*.py", "*_test.py"],
  },
  csharp: {
    declarationPatterns: CS_VALUE,
    typePatterns: CS_TYPE,
    lookupFileExtensions: [".cs"],
    excludeTestGlobs: DEFAULT_EXCLUDE,
  },
  blazor: {
    declarationPatterns: CS_VALUE,
    typePatterns: CS_TYPE,
    lookupFileExtensions: [".cs", ".razor"],
    excludeTestGlobs: DEFAULT_EXCLUDE,
    razorCodeBlocks: true,
  },
  winforms: {
    declarationPatterns: CS_VALUE,
    typePatterns: CS_TYPE,
    lookupFileExtensions: [".cs"],
    excludeTestGlobs: DEFAULT_EXCLUDE,
  },
};

export function getStackLookup(stackId: string): StackLookupConfig | null {
  return STACK_LOOKUP[stackId] || null;
}
