import { describe, it, expect } from "vitest";
import * as path from "path";
import { spawnSync } from "child_process";

const repoRoot = path.resolve(__dirname, "..");
const demo = path.join("examples", "connect-four-workspace");

function run(script: string, args: string[]) {
  return spawnSync("npm.cmd", ["run", script, "--", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: process.env,
    shell: true,
  });
}

describe("queue --next", () => {
  it("returns a single next unit as JSON", () => {
    const result = run("queue", ["--root", demo, "--next"]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const jsonStart = result.stdout.indexOf("{");
    const payload = JSON.parse(result.stdout.slice(jsonStart));
    expect(payload).toHaveProperty("next");
    expect(payload).toHaveProperty("remaining");
    if (payload.next) {
      expect(payload.next).toHaveProperty("buildFile");
      expect(payload.next).toHaveProperty("targetPath");
      expect(payload.remaining).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("preflight", () => {
  it("passes connect-four-workspace", () => {
    const result = run("preflight", ["--root", demo, "--json"]);
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const jsonStart = result.stdout.indexOf("{");
    const payload = JSON.parse(result.stdout.slice(jsonStart));
    expect(payload.ok).toBe(true);
    expect(payload.checks.some((c: { id: string }) => c.id === "builder")).toBe(
      true,
    );
  });
});

describe("packet CLI", () => {
  it("emits packet for --only without inlined refs in markdown mode", () => {
    // --only re-queues even when gen-lock is fully green (connect-four often is)
    const result = run("packet", ["--root", demo, "--only", "domain-game"]);
    // may exit 2 if deps missing — still should print SOURCE
    expect([0, 2]).toContain(result.status);
    expect(result.stdout).toContain("Compile packet (light)");
    expect(result.stdout).toContain("## SOURCE");
    expect(result.stdout).not.toContain("START DEPENDENCY INTERFACE");
  });
});
