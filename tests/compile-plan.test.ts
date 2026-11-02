import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  extractRoleFromBuildContext,
  resolveRelativeImplPath,
  getTargetPathForEntry,
  shouldSkipGeneration,
  buildAgentCompileQueue,
  mergeLockEntriesFromManifest,
} from "../runtime/compile-plan/compile-plan";
import { getStackConfig } from "../runtime/compile-plan/stacks.config";
import type { ManifestEntry, GenLock } from "../runtime/compile-plan/types";

const stack = getStackConfig("react-js");

describe("extractRoleFromBuildContext", () => {
  it("reads Role only after SOURCE marker (ignores dependency Role)", () => {
    const ctx = `
<!-- dep -->
### Role: Presentation
<!-- SOURCE FILE TO IMPLEMENT -->
### Role: Domain
`;
    expect(extractRoleFromBuildContext(ctx)).toBe("Domain");
  });

  it("falls back to whole file when marker missing", () => {
    expect(extractRoleFromBuildContext("### Role: Backend\n")).toBe("Backend");
  });

  it("returns default when Role absent", () => {
    expect(extractRoleFromBuildContext("no role here")).toBe("default");
  });
});

describe("resolveRelativeImplPath", () => {
  it("maps Domain to .js and Presentation to .jsx", () => {
    expect(resolveRelativeImplPath("./domain-auth", "Domain", stack)).toBe(
      "./domain-auth.js",
    );
    expect(resolveRelativeImplPath("./login-page", "Presentation", stack)).toBe(
      "./login-page.jsx",
    );
  });

  it("maps Backend to .js", () => {
    expect(
      resolveRelativeImplPath("./google-auth-service", "Backend", stack),
    ).toBe("./google-auth-service.js");
  });

  it("replaces an existing extension", () => {
    expect(resolveRelativeImplPath("./x.ts", "Domain", stack)).toBe("./x.js");
  });
});

describe("getTargetPathForEntry / skip / queue / lock", () => {
  let tmp: string;
  let buildFile: string;
  let binDir: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "a-isl-cp-"));
    binDir = path.join(tmp, "bin");
    fs.mkdirSync(binDir);
    buildFile = path.join(tmp, "unit.build.md");
    fs.writeFileSync(
      buildFile,
      `<!-- SOURCE FILE TO IMPLEMENT -->\n### Role: Domain\n`,
      "utf8",
    );
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("getTargetPathForEntry returns null without implementationPath", () => {
    const entry: ManifestEntry = {
      sourceFile: "x.isl.md",
      buildFile,
      implementationPath: null,
      hash: "h1",
    };
    expect(
      getTargetPathForEntry(entry, fs.readFileSync(buildFile, "utf8"), binDir, stack),
    ).toBeNull();
  });

  it("shouldSkipGeneration requires force=false, hash match, and target file", () => {
    const target = path.join(binDir, "domain-auth.js");
    const entry: ManifestEntry = {
      sourceFile: "domain-auth.isl.md",
      buildFile,
      implementationPath: "./domain-auth",
      hash: "abc",
    };
    const lock: GenLock = { [buildFile]: "abc" };
    expect(shouldSkipGeneration(entry, lock, target, false)).toBe(false);
    fs.writeFileSync(target, "// ok", "utf8");
    expect(shouldSkipGeneration(entry, lock, target, false)).toBe(true);
    expect(shouldSkipGeneration(entry, lock, target, true)).toBe(false);
  });

  it("buildAgentCompileQueue skips locked+existing and reasons missing-target", () => {
    const entry: ManifestEntry = {
      sourceFile: "domain-auth.isl.md",
      buildFile,
      implementationPath: "./domain-auth",
      hash: "abc",
    };
    const lock: GenLock = {};
    let queue = buildAgentCompileQueue([entry], lock, binDir, stack);
    expect(queue).toHaveLength(1);
    expect(queue[0].reason).toBe("missing-target");
    expect(queue[0].role).toBe("Domain");
    expect(queue[0].relativeImplPath).toBe("./domain-auth.js");

    fs.writeFileSync(queue[0].targetPath, "export {}", "utf8");
    lock[buildFile] = "abc";
    queue = buildAgentCompileQueue([entry], lock, binDir, stack);
    expect(queue).toHaveLength(0);

    queue = buildAgentCompileQueue([entry], lock, binDir, stack, { force: true });
    expect(queue).toHaveLength(1);
    expect(queue[0].reason).toBe("force");
  });

  it("buildAgentCompileQueue reasons hash-mismatch when target exists but lock differs", () => {
    const entry: ManifestEntry = {
      sourceFile: "domain-auth.isl.md",
      buildFile,
      implementationPath: "./domain-auth",
      hash: "new",
    };
    const target = path.join(binDir, "domain-auth.js");
    fs.writeFileSync(target, "export {}", "utf8");
    const lock: GenLock = { [buildFile]: "old" };
    const queue = buildAgentCompileQueue([entry], lock, binDir, stack);
    expect(queue).toHaveLength(1);
    expect(queue[0].reason).toBe("hash-mismatch");
    expect(queue[0].previousHash).toBe("old");
  });

  it("buildAgentCompileQueue --only requeues locked unit and filters others", () => {
    const otherBuild = path.join(tmp, "other.build.md");
    fs.writeFileSync(
      otherBuild,
      `<!-- SOURCE FILE TO IMPLEMENT -->\n### Role: Domain\n`,
      "utf8",
    );
    const entryA: ManifestEntry = {
      sourceFile: "domain-auth.isl.md",
      buildFile,
      implementationPath: "./domain-auth",
      hash: "abc",
    };
    const entryB: ManifestEntry = {
      sourceFile: "other.isl.md",
      buildFile: otherBuild,
      implementationPath: "./other",
      hash: "xyz",
    };
    const targetA = path.join(binDir, "domain-auth.js");
    const targetB = path.join(binDir, "other.js");
    fs.writeFileSync(targetA, "export {}", "utf8");
    fs.writeFileSync(targetB, "export {}", "utf8");
    const lock: GenLock = { [buildFile]: "abc", [otherBuild]: "xyz" };

    expect(
      buildAgentCompileQueue([entryA, entryB], lock, binDir, stack),
    ).toHaveLength(0);

    const queue = buildAgentCompileQueue([entryA, entryB], lock, binDir, stack, {
      only: ["domain-auth"],
    });
    expect(queue).toHaveLength(1);
    expect(queue[0].sourceFile).toBe("domain-auth.isl.md");
    expect(queue[0].reason).toBe("force-only");
  });

  it("mergeLockEntriesFromManifest updates matching normalized paths", () => {
    const entry: ManifestEntry = {
      sourceFile: "a.isl.md",
      buildFile,
      implementationPath: "./a",
      hash: "h99",
    };
    const { lock, updated, notFound } = mergeLockEntriesFromManifest(
      [entry],
      {},
      new Set([path.normalize(buildFile)]),
    );
    expect(updated).toBe(1);
    expect(notFound).toEqual([]);
    expect(lock[buildFile]).toBe("h99");

    const miss = mergeLockEntriesFromManifest(
      [entry],
      {},
      new Set([path.normalize(path.join(tmp, "missing.build.md"))]),
    );
    expect(miss.updated).toBe(0);
    expect(miss.notFound).toHaveLength(1);
  });
});
