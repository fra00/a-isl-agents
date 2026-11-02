import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { mapCallToSymbol } from "../runtime/compile-plan/stacks.config";
import { lookupDeclaration } from "../runtime/compile-plan/lookup-decl";

const fix = path.resolve(__dirname, "fixtures/lookup-decl");

describe("mapCallToSymbol snake-case", () => {
  it("maps camel to snake", () => {
    expect(mapCallToSymbol("parseA1", "snake-case")).toBe("parse_a1");
    expect(mapCallToSymbol("calculateSheet", "snake-case")).toBe(
      "calculate_sheet",
    );
  });
});

describe("lookupDeclaration react-js", () => {
  const ws = fix;
  const sample = path.join(fix, "bin-react-js", "sample.js");

  it("finds function declaration and ignores if-call", () => {
    const r = lookupDeclaration({
      stackId: "react-js",
      name: "calculateSheet",
      kind: "value",
      files: [sample],
      workspace: ws,
    });
    expect(r.ok).toBe(true);
    expect(r.reason).toBe("ok");
    expect(r.candidates.length).toBeGreaterThan(0);
    const sigs = r.candidates.map((c) => c.signatureText).join("\n");
    expect(sigs).toMatch(/function calculateSheet/);
    expect(sigs).not.toMatch(/^if \(calculateSheet/);
  });

  it("finds one-line arrow const with semicolon", () => {
    const r = lookupDeclaration({
      stackId: "react-js",
      name: "calculateSheet",
      kind: "value",
      files: [sample],
      workspace: ws,
    });
    const arrows = r.candidates.filter((c) =>
      c.signatureText.includes("=>"),
    );
    expect(arrows.length).toBeGreaterThan(0);
  });

  it("balances multiline defaults with nested parens", () => {
    const r = lookupDeclaration({
      stackId: "react-js",
      name: "wideFn",
      files: [path.join(fix, "bin-react-js", "multiline.js")],
      workspace: ws,
    });
    expect(r.ok).toBe(true);
    expect(r.candidates[0].signatureText).toContain("fn()");
    expect(r.candidates[0].signatureText).toContain("{");
  });

  it("sets spanTruncated on unbalanced parens", () => {
    const r = lookupDeclaration({
      stackId: "react-js",
      name: "brokenBalance",
      files: [path.join(fix, "bin-react-js", "truncated.js")],
      workspace: ws,
      maxSpanLines: 5,
    });
    expect(r.ok).toBe(true);
    expect(r.candidates.some((c) => c.spanTruncated)).toBe(true);
  });

  it("excludes *.test.js from --dir by default", () => {
    const r = lookupDeclaration({
      stackId: "react-js",
      name: "calculateSheet",
      dir: path.join(fix, "bin-react-js"),
      workspace: ws,
    });
    expect(r.ok).toBe(true);
    expect(
      r.candidates.every((c) => !c.path.endsWith("sample.test.js")),
    ).toBe(true);
  });

  it("includes tests with flag", () => {
    const r = lookupDeclaration({
      stackId: "react-js",
      name: "calculateSheet",
      dir: path.join(fix, "bin-react-js"),
      workspace: ws,
      includeTests: true,
    });
    expect(r.candidates.some((c) => c.path.endsWith("sample.test.js"))).toBe(
      true,
    );
  });
});

describe("lookupDeclaration csharp", () => {
  const ws = fix;
  const file = path.join(fix, "bin-csharp", "Domain.cs");

  it("returns multiple ParseA1 candidates with kinds", () => {
    const r = lookupDeclaration({
      stackId: "csharp",
      name: "parseA1",
      kind: "any",
      files: [file],
      workspace: ws,
    });
    expect(r.ok).toBe(true);
    expect(r.candidates.length).toBeGreaterThanOrEqual(2);
    expect(r.candidates.every((c) => c.kind === "value" || c.kind === "type")).toBe(
      true,
    );
    expect(r.selected).toBe(0);
    const top = r.candidates[r.selected!];
    expect(top.enclosingType).toBeTruthy();
    expect(top.leadingContext.length).toBeGreaterThan(0);
  });
});

describe("lookupDeclaration python", () => {
  it("maps snake-case and finds def", () => {
    const r = lookupDeclaration({
      stackId: "python",
      name: "parseA1",
      files: [path.join(fix, "bin-python", "mod.py")],
      workspace: fix,
    });
    expect(r.mappedNamesTried[0]).toBe("parse_a1");
    expect(r.ok).toBe(true);
    expect(r.candidates[0].signatureText).toMatch(/def parse_a1/);
  });
});

describe("lookupDeclaration blazor", () => {
  it("finds method inside second @code block", () => {
    const r = lookupDeclaration({
      stackId: "blazor",
      name: "parseA1",
      files: [path.join(fix, "bin-blazor", "Widget.razor")],
      workspace: fix,
    });
    expect(r.ok).toBe(true);
    expect(r.candidates[0].signatureText).toMatch(/ParseA1/);
  });
});

describe("lookupDeclaration sandbox", () => {
  it("rejects symlink escaping workspace", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "a-isl-lookup-"));
    const outside = path.join(tmp, "outside.js");
    fs.writeFileSync(outside, "export function escapeHatch() {}");
    const ws = path.join(tmp, "ws");
    fs.mkdirSync(path.join(ws, "bin-react-js"), { recursive: true });
    const link = path.join(ws, "bin-react-js", "escape.js");
    try {
      fs.symlinkSync(outside, link);
    } catch {
      // Windows may need admin for symlinks — skip soft
      fs.rmSync(tmp, { recursive: true, force: true });
      return;
    }
    const r = lookupDeclaration({
      stackId: "react-js",
      name: "escapeHatch",
      files: [link],
      workspace: ws,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("path_rejected");
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
