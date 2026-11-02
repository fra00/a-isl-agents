import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

const repoRoot = path.resolve(__dirname, "..");
const demoRoot = path.join(repoRoot, "examples", "connect-four-workspace");

function runNpmScript(script: string, args: string[]) {
  return spawnSync("npm.cmd", ["run", script, "--", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    shell: true,
  });
}

describe("CLI smoke (connect-four-workspace)", () => {
  it("builder produces manifest with 8 units", () => {
    const result = runNpmScript("builder", [
      path.join("examples", "connect-four-workspace"),
    ]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(demoRoot, "build", "build-manifest.json"),
        "utf8",
      ),
    );
    expect(manifest).toHaveLength(8);
    const names = manifest.map((e: { sourceFile: string }) =>
      path.basename(e.sourceFile),
    );
    expect(names.indexOf("domain-game.isl.md")).toBeLessThan(
      names.indexOf("app-shell.isl.md"),
    );
  });

  it("queue JSON lists implementation paths and skips locked leaves", () => {
    const result = runNpmScript("queue", [
      "--root",
      path.join("examples", "connect-four-workspace"),
      "--json",
    ]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const jsonStart = result.stdout.indexOf("{");
    const payload = JSON.parse(result.stdout.slice(jsonStart));
    expect(payload.compileQueue.every((u: { implementationPath: string }) => u.implementationPath)).toBe(
      true,
    );
    expect(payload.skippedUnchanged).toBeGreaterThanOrEqual(0);
    const queuedSources = payload.compileQueue.map((u: { sourceFile: string }) =>
      path.basename(u.sourceFile),
    );
    expect(queuedSources).not.toContain("README.md");
  });
});
