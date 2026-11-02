/**
 * Deterministic project gate before Compile Agent starts.
 * Checks structure/graph tooling — does NOT prove bin/ correctness.
 *
 * Usage:
 *   npx tsx runtime/cli/agent-preflight.ts --root examples/connect-four-workspace
 *   npx tsx runtime/cli/agent-preflight.ts --root examples/connect-four-workspace --skip-lint
 */

import * as fs from "fs";
import * as path from "path";
import { ISLBuilder } from "../builder/isl-builder";
import { shouldSkipProjectDir } from "../compile-plan/bin-paths";
import type { ManifestEntry } from "../compile-plan/types";
import { ISLParser, ISLValidator } from "../lint/isl-lint";

type Check = { id: string; ok: boolean; detail: string };

function parseArgs(argv: string[]) {
  const out = {
    root: null as string | null,
    skipLint: false,
    skipBuilder: false,
    json: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skip-lint") out.skipLint = true;
    else if (a === "--skip-builder") out.skipBuilder = true;
    else if (a === "--json") out.json = true;
    else if (a === "--root" && argv[i + 1]) out.root = path.resolve(argv[++i]);
    else if (!a.startsWith("-") && !out.root) out.root = path.resolve(a);
  }
  return out;
}

function listIslFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) {
        if (shouldSkipProjectDir(ent.name)) {
          continue;
        }
        walk(full);
      } else if (ent.isFile() && ent.name.endsWith(".isl.md")) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

function lintFile(file: string): { ok: boolean; errors: string[] } {
  let content = fs.readFileSync(file, "utf-8");
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const result = new ISLValidator(new ISLParser(content).parse()).validate();
  return {
    ok: result.valid,
    errors: result.errors.map((e) => `${e.rule}: ${e.message}`),
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.root) {
    console.error("Usage: agent-preflight.ts --root <project>");
    process.exit(1);
  }

  const root = args.root;
  const checks: Check[] = [];

  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error(`Not a directory: ${root}`);
    process.exit(1);
  }

  const islFiles = listIslFiles(root);
  checks.push({
    id: "isl-files",
    ok: islFiles.length > 0,
    detail: `${islFiles.length} .isl.md file(s)`,
  });

  if (!args.skipBuilder) {
    const logs: string[] = [];
    const origErr = console.error;
    const origLog = console.log;
    console.error = (...a: unknown[]) => {
      logs.push(a.map(String).join(" "));
    };
    console.log = (...a: unknown[]) => {
      logs.push(a.map(String).join(" "));
    };
    try {
      await new ISLBuilder(root).build();
    } finally {
      console.error = origErr;
      console.log = origLog;
    }

    const manifestPath = path.join(root, "build", "build-manifest.json");
    const builderOk =
      fs.existsSync(manifestPath) &&
      !logs.some((l) => l.includes("Build Failed") || l.includes("Broken reference"));
    checks.push({
      id: "builder",
      ok: builderOk,
      detail: builderOk
        ? `manifest at ${manifestPath}`
        : logs.filter((l) => /Fail|Broken|Circular/i.test(l)).join(" | ") ||
          "builder failed",
    });
  }

  const manifestPath = path.join(root, "build", "build-manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest: ManifestEntry[] = JSON.parse(
      fs.readFileSync(manifestPath, "utf-8"),
    );
    const withImpl = manifest.filter((e) => e.implementationPath);
    checks.push({
      id: "manifest-impl",
      ok: withImpl.length > 0,
      detail: `${withImpl.length}/${manifest.length} units with Implementation`,
    });

    const order = manifest.map((e) => path.basename(e.sourceFile));
    checks.push({
      id: "topo-order",
      ok: order.length === manifest.length,
      detail: order.join(" → "),
    });
  } else {
    checks.push({
      id: "manifest",
      ok: false,
      detail: "build-manifest.json missing",
    });
  }

  if (!args.skipLint && islFiles.length > 0) {
    const failed: string[] = [];
    for (const f of islFiles) {
      const { ok } = lintFile(f);
      if (!ok) failed.push(path.basename(f));
    }
    checks.push({
      id: "lint-errors",
      ok: failed.length === 0,
      detail:
        failed.length === 0
          ? `all ${islFiles.length} files lint-clean (errors)`
          : `lint errors in: ${failed.join(", ")}`,
    });
  }

  const ok = checks.every((c) => c.ok);

  if (args.json) {
    console.log(JSON.stringify({ root, ok, checks }, null, 2));
  } else {
    console.log(`Preflight: ${root}`);
    for (const c of checks) {
      console.log(`${c.ok ? "PASS" : "FAIL"}  [${c.id}] ${c.detail}`);
    }
    console.log(ok ? "\nPreflight OK — Compile Agent may start." : "\nPreflight FAILED.");
    console.log(
      "(Preflight does not prove bin/ correctness; only structure/graph/lint gates.)",
    );
  }

  process.exit(ok ? 0 : 1);
}

main();
