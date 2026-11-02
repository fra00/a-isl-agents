/**
 * EXT-001: run generated Spec tests; write build/verify-status.json.
 *
 *   npx tsx runtime/cli/agent-verify.ts --root <workspace> [--stack react-js] [--only unit]
 *
 * Status per unit: pass | fail | stale | skipped
 * Does not modify gen-lock.json.
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";
import { defaultBinDir } from "../compile-plan/bin-paths";
import { getStackConfig } from "../compile-plan/stacks.config";
import {
  getTestTargetPath,
  parseEligibleScenarios,
} from "../compile-plan/verify-eligible";
import {
  getTargetPathForEntry,
  manifestEntryMatchesOnly,
  normalizeUnitToken,
} from "../compile-plan/compile-plan";
import type { ManifestEntry } from "../compile-plan/types";

type UnitStatus = "pass" | "fail" | "stale" | "skipped";

interface UnitVerifyResult {
  unit: string;
  sourceFile: string;
  status: UnitStatus;
  reason?: string;
  eligibleScenarioIds: string[];
  testPath: string | null;
  implPath: string | null;
  implHash: string | null;
  testHash: string | null;
  runnerExitCode?: number | null;
}

interface VerifyStatusFile {
  version: 1;
  root: string;
  stackId: string;
  updatedAt: string;
  units: UnitVerifyResult[];
}

function parseArgs(argv: string[]) {
  let root: string | null = null;
  let stack = "react-js";
  const only: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root" && argv[i + 1]) root = path.resolve(argv[++i]);
    else if (a === "--stack" && argv[i + 1]) stack = argv[++i];
    else if (a === "--only" && argv[i + 1]) only.push(argv[++i]);
  }
  if (!root) {
    console.error(
      "Usage: agent-verify --root <workspace> [--stack <id>] [--only <unit>…]",
    );
    process.exit(2);
  }
  return { root, stack, only };
}

function sha256File(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(filePath));
  return h.digest("hex");
}

function loadManifest(root: string): ManifestEntry[] {
  const p = path.join(root, "build", "build-manifest.json");
  if (!fs.existsSync(p)) {
    throw new Error(`missing manifest: ${p} (run builder first)`);
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
  return Array.isArray(raw) ? raw : raw.entries || [];
}

function loadPreviousStatus(root: string): VerifyStatusFile | null {
  const p = path.join(root, "build", "verify-status.json");
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8")) as VerifyStatusFile;
  } catch {
    return null;
  }
}

function countProseScenariosWithoutId(source: string): number {
  let n = 0;
  for (const line of source.split(/\r?\n/)) {
    if (/^\s*\d+\.\s+\*\*/.test(line) && !/`id:\s*[^`]+`/i.test(line)) n++;
  }
  return n;
}

function repoRootFromWorkspace(root: string): string {
  return path.resolve(root, "../..");
}

function runVitest(
  root: string,
  testFiles: string[],
): { code: number | null; output: string } {
  if (testFiles.length === 0) return { code: 0, output: "" };
  const repoRoot = repoRootFromWorkspace(root);
  // Invoke vitest via node + vitest.mjs so paths with spaces work (no .cmd shell split).
  const vitestMjs = path.join(repoRoot, "node_modules", "vitest", "vitest.mjs");
  const config = path.join(root, "verify", "vitest.verify.config.mjs");
  const args = [
    vitestMjs,
    "run",
    ...(fs.existsSync(config) ? ["--config", config] : []),
    ...testFiles.map((f) => path.relative(root, f)),
  ];
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf-8",
    shell: false,
    env: process.env,
  });
  return {
    code: result.status,
    output: `${result.stdout || ""}${result.stderr || ""}`,
  };
}

function findDotnetVerifyProj(root: string): string | null {
  const verifyRoot = path.join(root, "verify");
  if (!fs.existsSync(verifyRoot)) return null;
  const preferred = [
    path.join(verifyRoot, "TariffeVerify.Tests", "TariffeVerify.Tests.csproj"),
    path.join(verifyRoot, "SheetVerify.Tests", "SheetVerify.Tests.csproj"),
  ];
  for (const p of preferred) {
    if (fs.existsSync(p)) return p;
  }
  for (const name of fs.readdirSync(verifyRoot)) {
    const cand = path.join(verifyRoot, name, `${name}.csproj`);
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

function runDotnetTest(root: string): { code: number | null; output: string } {
  const proj = findDotnetVerifyProj(root);
  if (!proj) {
    return {
      code: 1,
      output: `missing csharp harness under ${path.join(root, "verify")}`,
    };
  }
  const result = spawnSync("dotnet", ["test", proj, "--nologo"], {
    cwd: root,
    encoding: "utf-8",
    shell: false,
    env: process.env,
  });
  return {
    code: result.status,
    output: `${result.stdout || ""}${result.stderr || ""}`,
  };
}

function main() {
  const { root, stack, only } = parseArgs(process.argv.slice(2));
  const stackConfig = getStackConfig(stack);
  const binDir = defaultBinDir(root, stack);
  const manifest = loadManifest(root);
  const onlyNorm = only.map(normalizeUnitToken).filter(Boolean);
  const prev = loadPreviousStatus(root);
  const units: UnitVerifyResult[] = [];
  const runnableTestFiles: string[] = [];

  for (const entry of manifest) {
    if (!entry.implementationPath) continue;
    if (
      onlyNorm.length &&
      !onlyNorm.some((t) => manifestEntryMatchesOnly(entry, t))
    ) {
      continue;
    }

    const unit = path.basename(entry.sourceFile).replace(/\.isl\.md$/i, "");
    const source = fs.existsSync(entry.sourceFile)
      ? fs.readFileSync(entry.sourceFile, "utf-8")
      : "";
    const eligible = parseEligibleScenarios(
      source,
      stackConfig.verify?.callSymbol,
    );
    const proseOnly = countProseScenariosWithoutId(source);

    let implPath: string | null = null;
    if (fs.existsSync(entry.buildFile)) {
      const buildContext = fs.readFileSync(entry.buildFile, "utf-8");
      const paths = getTargetPathForEntry(
        entry,
        buildContext,
        binDir,
        stackConfig,
      );
      if (paths && fs.existsSync(paths.targetPath)) {
        implPath = paths.targetPath;
      }
    }

    const testPath = getTestTargetPath(
      entry.implementationPath,
      binDir,
      stackConfig,
    );
    const testExists = !!(testPath && fs.existsSync(testPath));
    const implHash = implPath ? sha256File(implPath) : null;
    const testHash = testExists && testPath ? sha256File(testPath) : null;

    const prevUnit =
      prev && prev.stackId === stack
        ? prev.units.find((u) => u.unit === unit)
        : undefined;

    if (eligible.length === 0) {
      units.push({
        unit,
        sourceFile: entry.sourceFile,
        status: "skipped",
        reason:
          proseOnly > 0
            ? `${proseOnly} prose scenario(s) lack id+Call`
            : "no verify-eligible scenarios",
        eligibleScenarioIds: [],
        testPath: testExists ? testPath : null,
        implPath,
        implHash,
        testHash,
      });
      continue;
    }

    if (!testExists || !testPath) {
      units.push({
        unit,
        sourceFile: entry.sourceFile,
        status: "skipped",
        reason: "eligible scenarios present but generated test file missing",
        eligibleScenarioIds: eligible.map((e) => e.id),
        testPath,
        implPath,
        implHash,
        testHash,
      });
      continue;
    }

    const hashMismatch =
      !!prevUnit &&
      prevUnit.status === "pass" &&
      (prevUnit.implHash !== implHash || prevUnit.testHash !== testHash);

    units.push({
      unit,
      sourceFile: entry.sourceFile,
      status: hashMismatch ? "stale" : "fail",
      reason: hashMismatch
        ? "impl or test hash differs from last pass; re-running"
        : "pending-runner",
      eligibleScenarioIds: eligible.map((e) => e.id),
      testPath,
      implPath,
      implHash,
      testHash,
    });
    runnableTestFiles.push(testPath);
  }

  let runnerCode: number | null = 0;
  let runnerOutput = "";

  const needRun = units.some(
    (u) => u.reason === "pending-runner" || u.status === "stale",
  );

  if (needRun && stackConfig.verify?.runner === "vitest") {
    const r = runVitest(root, runnableTestFiles);
    runnerCode = r.code;
    runnerOutput = r.output;
  } else if (needRun && stackConfig.verify?.runner === "dotnet") {
    const r = runDotnetTest(root);
    runnerCode = r.code;
    runnerOutput = r.output;
  } else if (needRun) {
    runnerCode = 1;
    runnerOutput = `stack ${stack} has no verify.runner`;
  }

  for (const u of units) {
    if (u.reason !== "pending-runner" && u.status !== "stale") continue;
    const ok = runnerCode === 0;
    u.status = ok ? "pass" : "fail";
    u.reason = ok ? "runner ok" : "runner failed";
    u.runnerExitCode = runnerCode;
  }

  const statusPath = path.join(root, "build", "verify-status.json");
  const doc: VerifyStatusFile = {
    version: 1,
    root,
    stackId: stack,
    updatedAt: new Date().toISOString(),
    units,
  };
  fs.mkdirSync(path.dirname(statusPath), { recursive: true });
  fs.writeFileSync(statusPath, JSON.stringify(doc, null, 2), "utf-8");

  const summary = {
    pass: units.filter((u) => u.status === "pass").length,
    fail: units.filter((u) => u.status === "fail").length,
    stale: units.filter((u) => u.status === "stale").length,
    skipped: units.filter((u) => u.status === "skipped").length,
  };

  console.log(
    JSON.stringify(
      {
        statusPath,
        stackId: stack,
        summary,
        skipped: units
          .filter((u) => u.status === "skipped")
          .map((u) => ({ unit: u.unit, reason: u.reason })),
        failed: units.filter((u) => u.status === "fail").map((u) => u.unit),
        runnerExitCode: runnerCode,
      },
      null,
      2,
    ),
  );

  if (runnerOutput && summary.fail) {
    console.error(runnerOutput.slice(-4000));
  }

  process.exit(summary.fail || (runnerCode ?? 0) !== 0 ? 1 : 0);
}

main();
