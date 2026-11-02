import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  ISLParser,
  ISLValidator,
} from "../runtime/lint/isl-lint.ts";

const VALID = `# Project: LintProbe

Short purpose line for the lint probe unit.

**Version**: 1.0.0
**ISL Version**: 1.6.2
**Created**: 2026-10-31
**Implementation**: ./lint-probe

---

## Domain Concepts

### Thing

- **Identity**: id
- **Properties**:
  - \`id\`: String

## Component: LintProbe

### Role: Domain

### ⚡ Capabilities

#### Thing

- **Contract**: Builds a Thing.
- **Signature**: Thing(data: { id: String }): Thing
- **Flow**:
  1. Return { id }.

### 🚨 Constraints

- Thing MUST have id.

### ✅ Acceptance Criteria

- [ ] ok

### 🧪 Test Scenarios

1. **ok**
`;

describe("isl-lint validator", () => {
  it("passes a minimal Domain unit", () => {
    const sections = new ISLParser(VALID).parse();
    const result = new ISLValidator(sections).validate();
    expect(result.errors, JSON.stringify(result.errors)).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("accepts Business Logic role (A-ISL patch)", () => {
    const content = VALID.replace("### Role: Domain", "### Role: Business Logic");
    const result = new ISLValidator(new ISLParser(content).parse()).validate();
    expect(result.valid).toBe(true);
  });

  it("errors without any level-1 heading", () => {
    const content = VALID.replace("# Project: LintProbe\n\n", "");
    const result = new ISLValidator(new ISLParser(content).parse()).validate();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule === "ISL-001")).toBe(true);
  });

  it("errors when capability lacks Contract", () => {
    const content = VALID.replace(
      "- **Contract**: Builds a Thing.",
      "- **NotContract**: missing",
    );
    const result = new ISLValidator(new ISLParser(content).parse()).validate();
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.rule === "ISL-030")).toBe(true);
  });

  it("connect-four domain-game.isl.md validates", () => {
    const file = path.join(
      __dirname,
      "..",
      "examples",
      "connect-four-workspace",
      "domain-game.isl.md",
    );
    let text = fs.readFileSync(file, "utf8");
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const result = new ISLValidator(new ISLParser(text).parse()).validate();
    expect(result.valid).toBe(true);
  });
});

describe("isl-lint CLI", () => {
  it("exits 0 on valid temp file via npm run lint", () => {
    const { spawnSync } = require("child_process") as typeof import("child_process");
    const repoRoot = path.resolve(__dirname, "..");
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "a-isl-lint-"));
    const file = path.join(tmp, "ok.isl.md");
    fs.writeFileSync(file, VALID, "utf8");
    const result = spawnSync("npm.cmd", ["run", "lint", "--", file], {
      cwd: repoRoot,
      encoding: "utf8",
      env: process.env,
      shell: true,
    });
    fs.rmSync(tmp, { recursive: true, force: true });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain("Validation PASSED");
  });
});
