/**
 * CLI for agent: merge manifest hashes into gen-lock (same semantics as StandardRunner publish).
 *
 * Usage:
 *   npx tsx runtime/cli/agent-update-gen-lock.ts --root examples/connect-four-workspace --build-file "<abs-path>"
 */

import * as fs from "fs";
import * as path from "path";
import type { ManifestEntry, GenLock } from "../compile-plan/types";
import { mergeLockEntriesFromManifest } from "../compile-plan/compile-plan";

function parseArgs(argv: string[]) {
  const out: {
    root: string | null;
    manifest: string | null;
    lock: string | null;
    buildFiles: string[];
  } = {
    root: null,
    manifest: null,
    lock: null,
    buildFiles: [],
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root" && argv[i + 1]) out.root = path.resolve(argv[++i]);
    else if (a === "--manifest" && argv[i + 1])
      out.manifest = path.resolve(argv[++i]);
    else if (a === "--lock" && argv[i + 1]) out.lock = path.resolve(argv[++i]);
    else if (a === "--build-file" && argv[i + 1])
      out.buildFiles.push(path.resolve(argv[++i]));
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);

  let manifestPath = args.manifest;
  let lockPath = args.lock;

  if (args.root) {
    manifestPath =
      manifestPath ||
      path.join(args.root, "build", "build-manifest.json");
    lockPath =
      lockPath || path.join(args.root, "build", "gen-lock.json");
  }

  if (!manifestPath || !fs.existsSync(manifestPath)) {
    console.error("Need --manifest or --root with build/build-manifest.json");
    process.exit(1);
  }
  if (!lockPath) {
    console.error("Need --lock or --root");
    process.exit(1);
  }
  if (args.buildFiles.length === 0) {
    console.error("Need at least one --build-file <path>");
    process.exit(1);
  }

  const manifest: ManifestEntry[] = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8"),
  );
  let existingLock: GenLock = {};
  if (fs.existsSync(lockPath)) {
    existingLock = JSON.parse(fs.readFileSync(lockPath, "utf-8"));
  }

  const touch = new Set(args.buildFiles.map((p) => path.normalize(p)));
  const { lock, updated, notFound } = mergeLockEntriesFromManifest(
    manifest,
    existingLock,
    touch,
  );

  if (notFound.length > 0) {
    console.error(
      "Warning: some --build-file paths were not found in manifest:",
    );
    for (const p of notFound) console.error("  ", p);
  }

  const dir = path.dirname(lockPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2), "utf8");
  console.log(
    `Updated ${updated} entries in ${lockPath} (manifest hash snapshot).`,
  );
}

main();
