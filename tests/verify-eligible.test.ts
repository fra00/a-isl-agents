import { describe, expect, it } from "vitest";
import {
  mapCallToSymbol,
  getStackConfig,
} from "../runtime/compile-plan/stacks.config";
import {
  getTestRelativePath,
  parseEligibleScenarios,
} from "../runtime/compile-plan/verify-eligible";

describe("mapCallToSymbol", () => {
  it("keeps as-is for react-js", () => {
    expect(mapCallToSymbol("parseA1", "as-is")).toBe("parseA1");
  });

  it("pascal-cases for csharp", () => {
    expect(mapCallToSymbol("parseA1", "pascal-case")).toBe("ParseA1");
    expect(mapCallToSymbol("evaluateAst", "pascal-case")).toBe("EvaluateAst");
  });
});

describe("parseEligibleScenarios", () => {
  it("requires id and Call", () => {
    const md = `
### 🧪 Test Scenarios

1. **parseA1 valid** \`id: parseA1-valid\`
   - Call: parseA1
   - Input: "A1"

2. **prose only**:
   - Input: something
`;
    const found = parseEligibleScenarios(md, "as-is");
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      id: "parseA1-valid",
      call: "parseA1",
      symbol: "parseA1",
    });
  });

  it("maps symbols for csharp style", () => {
    const md = `
1. **Add** \`id: evaluateAst-add\`
   - Call: evaluateAst
`;
    const found = parseEligibleScenarios(md, "pascal-case");
    expect(found[0].symbol).toBe("EvaluateAst");
  });
});

describe("getTestRelativePath", () => {
  it("uses stack testSuffix", () => {
    const react = getStackConfig("react-js");
    expect(getTestRelativePath("./domain-sheet", react)).toBe(
      "domain-sheet.test.js",
    );
    const csharp = getStackConfig("csharp");
    expect(getTestRelativePath("./domain-sheet", csharp)).toBe(
      "domain-sheet.Tests.cs",
    );
  });
});
