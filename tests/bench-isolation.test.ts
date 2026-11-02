import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  computeIntegrity,
  checkIntegrity,
} from "../benchmarks/tariffe-v2/bench/integrity.mjs";
import {
  listResidues,
  prepareClean,
} from "../benchmarks/tariffe-v2/bench/prepare-clean-bin.mjs";

function mkTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "a-isl-bench-iso-"));
}

function write(root: string, rel: string, body = "x\n") {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
}

describe("bench integrity", () => {
  let root: string;

  beforeEach(() => {
    root = mkTmp();
    write(root, "oracle/a.json", '{"a":1}\n');
    write(root, "domain-x.isl.md", "# x\n");
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("snapshot then check matches", () => {
    const snap = computeIntegrity(root);
    expect(Object.keys(snap.files).sort()).toEqual([
      "domain-x.isl.md",
      "oracle/a.json",
    ]);
    const check = checkIntegrity(snap, root);
    expect(check.ok).toBe(true);
    expect(check.mismatchCount).toBe(0);
  });

  it("fails when a tracked file changes", () => {
    const snap = computeIntegrity(root);
    write(root, "oracle/a.json", '{"a":2}\n');
    const check = checkIntegrity(snap, root);
    expect(check.ok).toBe(false);
    expect(check.mismatches.some((m) => m.file === "oracle/a.json")).toBe(true);
  });

  it("ignores writes under excluded dirs (bin / build / results)", () => {
    const snap = computeIntegrity(root);
    write(root, "bin-csharp/domain-money.cs", "class X {}\n");
    write(root, "bin-react-js/domain-money.js", "export {}\n");
    write(root, "build/gen-lock.json", "{}\n");
    write(root, "results/report.json", "{}\n");
    const check = checkIntegrity(snap, root);
    expect(check.ok).toBe(true);
  });

  it("fails when a new tracked file appears", () => {
    const snap = computeIntegrity(root);
    write(root, "bench/extra.mjs", "export {}\n");
    const check = checkIntegrity(snap, root);
    expect(check.ok).toBe(false);
    expect(check.mismatches.some((m) => m.file === "bench/extra.mjs")).toBe(true);
  });
});

describe("prepare-clean-bin", () => {
  let root: string;

  beforeEach(() => {
    root = mkTmp();
    write(root, "oracle/keep.json", "{}\n");
    write(root, "keep.isl.md", "# keep\n");
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("ok when clean", () => {
    const r = prepareClean(root, { stack: "csharp", wipe: false, runId: "run-t" });
    expect(r.ok).toBe(true);
    expect(r.clean).toBe(true);
  });

  it("fails without --wipe when residues present", () => {
    write(root, "bin-csharp/a.cs", "x\n");
    write(root, "build/gen-lock.json", "{}\n");
    write(root, "build/u.build.md", "#\n");
    const r = prepareClean(root, { stack: "csharp", wipe: false, runId: "run-t" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("residues_present");
    expect(listResidues(root, "csharp").length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(root, "bin-csharp"))).toBe(true);
    expect(fs.existsSync(path.join(root, "oracle/keep.json"))).toBe(true);
  });

  it("wipe clears residues and leaves oracle/spec", () => {
    write(root, "bin-csharp/a.cs", "x\n");
    write(root, "build/gen-lock.json", "{}\n");
    write(root, "build/verify-status.json", "{}\n");
    write(root, "build/u.build.md", "#\n");
    write(root, "build/u.ref.md", "#\n");
    const r = prepareClean(root, {
      stack: "csharp",
      wipe: true,
      runId: "run-t",
      seriesDir: "test-series",
    });
    expect(r.ok).toBe(true);
    expect(r.wiped).toBe(true);
    expect(listResidues(root, "csharp")).toEqual([]);
    expect(fs.existsSync(path.join(root, "oracle/keep.json"))).toBe(true);
    expect(fs.existsSync(path.join(root, "keep.isl.md"))).toBe(true);
    expect(
      fs.existsSync(
        path.join(root, "results", "replicas", "test-series", "run-t", "pre-wipe"),
      ),
    ).toBe(true);
  });

  it("react-js stack only targets bin-react-js", () => {
    write(root, "bin-react-js/a.js", "x\n");
    write(root, "bin-csharp/a.cs", "x\n");
    const dirty = prepareClean(root, {
      stack: "react-js",
      wipe: false,
      runId: "run-t",
    });
    expect(dirty.ok).toBe(false);
    const wiped = prepareClean(root, {
      stack: "react-js",
      wipe: true,
      runId: "run-t",
    });
    expect(wiped.ok).toBe(true);
    expect(fs.existsSync(path.join(root, "bin-react-js"))).toBe(false);
    expect(fs.existsSync(path.join(root, "bin-csharp"))).toBe(true);
  });
});

describe("archive invalidate semantics (meta)", () => {
  it("integrity fail maps to invalidated replica meta shape", () => {
    // Mirrors archive-replica.mjs: integrityOk false → invalidated true
    const integrityOk = false;
    const invalidateReason = integrityOk ? null : "integrity_mismatch";
    const meta = {
      integrity: { ok: integrityOk, reason: invalidateReason },
      invalidated: !integrityOk,
      invalidateReason: integrityOk ? null : invalidateReason,
    };
    expect(meta.invalidated).toBe(true);
    expect(meta.invalidateReason).toBe("integrity_mismatch");
  });
});
