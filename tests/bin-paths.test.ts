import { describe, it, expect } from "vitest";
import path from "path";
import {
  binDirNameForStack,
  defaultBinDir,
  shouldSkipProjectDir,
} from "../runtime/compile-plan/bin-paths";

describe("bin-paths", () => {
  it("names bin-<stackId>", () => {
    expect(binDirNameForStack("react-js")).toBe("bin-react-js");
    expect(binDirNameForStack("csharp")).toBe("bin-csharp");
    expect(binDirNameForStack("csharp")).not.toBe("bin");
    expect(binDirNameForStack("python-fastapi")).toBe("bin-python-fastapi");
  });

  it("defaults under project root", () => {
    const root = path.resolve("/tmp/proj");
    expect(defaultBinDir(root, "react-js")).toBe(
      path.join(root, "bin-react-js"),
    );
  });

  it("skips bin and bin-* dirs", () => {
    expect(shouldSkipProjectDir("bin")).toBe(true);
    expect(shouldSkipProjectDir("bin-react-js")).toBe(true);
    expect(shouldSkipProjectDir("bin-csharp")).toBe(true);
    expect(shouldSkipProjectDir("verify")).toBe(true);
    expect(shouldSkipProjectDir("domain")).toBe(false);
  });
});
