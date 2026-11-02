/**
 * CLI for Cursor agent / skill: lists compile queue using isl-generator compile-plan (no LLM).
 *
 * Usage:
 *   npx tsx runtime/cli/agent-compile-queue.ts --root examples/connect-four-workspace
 *   npx tsx runtime/cli/agent-compile-queue.ts --manifest path --bin path --lock path --stack react-js
 *   npx tsx runtime/cli/agent-compile-queue.ts --root examples/dungeon-workspace --next --only dungeon
 *   npx tsx runtime/cli/agent-compile-queue.ts --root examples/dungeon-workspace --next --only dungeon --only dungeon-use-turn-logic
 */

import * as fs from "fs";
import * as path from "path";
import type { ManifestEntry, GenLock } from "../compile-plan/types";
import { getStackConfig } from "../compile-plan/stacks.config";
import { defaultBinDir } from "../compile-plan/bin-paths";
import {
  buildAgentCompileQueue,
  getTargetPathForEntry,
  resolveOnlyManifestEntries,
  shouldSkipGeneration,
} from "../compile-plan/compile-plan";

function parseArgs(argv: string[]) {
  const out: {
    root: string | null;
    manifest: string | null;
    bin: string | null;
    lock: string | null;
    stack: string;
    json: boolean;
    force: boolean;
    all: boolean;
    next: boolean;
    limit: number | null;
    only: string[];
  } = {
    root: null,
    manifest: null,
    bin: null,
    lock: null,
    stack: "react-js",
    json: false,
    force: false,
    all: false,
    next: false,
    limit: null,
    only: [],
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--force") out.force = true;
    else if (a === "--all") out.all = true;
    else if (a === "--next") {
      out.next = true;
      out.json = true;
      if (out.limit == null) out.limit = 1;
    } else if (a === "--limit" && argv[i + 1]) {
      out.limit = Math.max(0, parseInt(argv[++i], 10) || 0);
    } else if (a === "--only" && argv[i + 1]) {
      out.only.push(argv[++i]);
    } else if (a === "--root" && argv[i + 1]) out.root = path.resolve(argv[++i]);
    else if (a === "--manifest" && argv[i + 1])
      out.manifest = path.resolve(argv[++i]);
    else if (a === "--bin" && argv[i + 1]) out.bin = path.resolve(argv[++i]);
    else if (a === "--lock" && argv[i + 1]) out.lock = path.resolve(argv[++i]);
    else if (a === "--stack" && argv[i + 1]) out.stack = argv[++i];
  }
  return out;
}

function defaultsFromRoot(stackRoot: string, stackId: string) {
  return {
    manifest: path.join(stackRoot, "build", "build-manifest.json"),
    bin: defaultBinDir(stackRoot, stackId),
    lock: path.join(stackRoot, "build", "gen-lock.json"),
  };
}

function countSkippedUnchanged(
  manifest: ManifestEntry[],
  lock: GenLock,
  binDir: string,
  stackConfig: ReturnType<typeof getStackConfig>,
  force: boolean,
): number {
  let n = 0;
  for (const entry of manifest) {
    if (!entry.implementationPath) {
      continue;
    }
    const buildContext = fs.readFileSync(entry.buildFile, "utf-8");
    const paths = getTargetPathForEntry(
      entry,
      buildContext,
      binDir,
      stackConfig,
    );
    if (!paths) {
      continue;
    }
    if (shouldSkipGeneration(entry, lock, paths.targetPath, force)) {
      n++;
    }
  }
  return n;
}

function main() {
  const args = parseArgs(process.argv);
  let manifestPath = args.manifest;
  let binDir = args.bin;
  let lockPath = args.lock;

  if (args.root) {
    const d = defaultsFromRoot(args.root, args.stack);
    manifestPath = manifestPath || d.manifest;
    binDir = binDir || d.bin;
    lockPath = lockPath || d.lock;
  }

  if (!manifestPath || !fs.existsSync(manifestPath)) {
    console.error(
      "Missing or invalid --manifest (or --root with build/build-manifest.json).",
    );
    process.exit(1);
  }
  if (!binDir) {
    console.error("Missing --bin (or --root).");
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8"),
  );
  let lock: GenLock = {};
  if (lockPath && fs.existsSync(lockPath)) {
    lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
  }

  const stackConfig = getStackConfig(args.stack);
  if (args.only.length) {
    try {
      resolveOnlyManifestEntries(manifest, args.only);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  }
  const queue = buildAgentCompileQueue(manifest, lock, binDir, stackConfig, {
    force: args.force,
    only: args.only,
  });

  const skippedUnchanged = args.only.length
    ? 0
    : countSkippedUnchanged(
        manifest,
        lock,
        binDir,
        stackConfig,
        args.force,
      );

  if (args.all && args.json) {
    const rows = manifest.map((entry) => {
      if (!entry.implementationPath) {
        return {
          sourceFile: entry.sourceFile,
          buildFile: entry.buildFile,
          implementationPath: entry.implementationPath,
          manifestHash: entry.hash,
          compile: false,
          reason: "no-implementation-path",
        };
      }
      const buildContext = fs.readFileSync(entry.buildFile, "utf-8");
      const paths = getTargetPathForEntry(
        entry,
        buildContext,
        binDir,
        stackConfig,
      );
      if (!paths) {
        return {
          sourceFile: entry.sourceFile,
          buildFile: entry.buildFile,
          manifestHash: entry.hash,
          compile: false,
          reason: "no-paths",
        };
      }
      const compile = !shouldSkipGeneration(
        entry,
        lock,
        paths.targetPath,
        args.force,
      );
      return {
        sourceFile: entry.sourceFile,
        buildFile: entry.buildFile,
        implementationPath: entry.implementationPath,
        manifestHash: entry.hash,
        targetPath: paths.targetPath,
        compile,
        reason: compile ? "needs-compile" : "unchanged",
      };
    });
    console.log(
      JSON.stringify(
        {
          manifest: manifestPath,
          bin: binDir,
          lock: lockPath,
          stack: args.stack,
          entries: rows,
        },
        null,
        2,
      ),
    );
    return;
  }

  const limited =
    args.limit != null ? queue.slice(0, args.limit) : queue;

  if (args.next) {
    const next = limited[0] ?? null;
    console.log(
      JSON.stringify(
        {
          manifest: manifestPath,
          bin: binDir,
          lock: lockPath,
          stack: args.stack,
          only: args.only,
          next,
          remaining: queue.length,
          skippedUnchanged,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          manifest: manifestPath,
          bin: binDir,
          lock: lockPath,
          stack: args.stack,
          only: args.only,
          compileQueue: limited,
          queueTotal: queue.length,
          skippedUnchanged,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`Manifest: ${manifestPath}`);
  console.log(`Bin: ${binDir}`);
  console.log(`Lock: ${lockPath || "(none)"}`);
  console.log(`Stack: ${args.stack}`);
  if (args.only.length) {
    console.log(`Only: ${args.only.join(", ")}`);
  }
  console.log(`Compile queue (${limited.length}${args.limit != null ? ` of ${queue.length}` : ""}):`);
  for (const item of limited) {
    console.log(
      `  - ${path.basename(item.sourceFile)}  [${item.reason}]  →  ${item.targetPath}`,
    );
  }
  console.log(`Skipped unchanged: ${skippedUnchanged}`);
}

main();
