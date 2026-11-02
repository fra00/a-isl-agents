/**
 * Ensure a truly empty compile surface before a replica.
 *
 * Default (no --wipe): FAIL if any residue exists (does not delete).
 * With --wipe: remove residues, then FAIL if anything remains.
 *
 * --stack react-js (default) | csharp
 * --root <dir> optional (default: parent of this script = tariffe-v2)
 *
 * Residues:
 *   - bin-<stack>/ (entire tree)
 *   - build/gen-lock.json
 *   - build/verify-status.json
 *   - build/*.build.md, build/*.ref.md
 *
 * Does NOT touch results/, oracle/, *.isl.md, bench scripts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "..");

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] ?? true : fallback;
}

export function binDirName(stack) {
  return stack === "csharp" ? "bin-csharp" : "bin-react-js";
}

export function listResidues(root, stack = "react-js") {
  const binName = binDirName(stack);
  const binDir = path.join(root, binName);
  const buildDir = path.join(root, "build");
  const found = [];
  if (fs.existsSync(binDir)) {
    found.push({ path: `${binName}/`, kind: "dir" });
  }
  const lock = path.join(buildDir, "gen-lock.json");
  if (fs.existsSync(lock)) found.push({ path: "build/gen-lock.json", kind: "file" });
  const verify = path.join(buildDir, "verify-status.json");
  if (fs.existsSync(verify)) found.push({ path: "build/verify-status.json", kind: "file" });
  if (fs.existsSync(buildDir)) {
    for (const f of fs.readdirSync(buildDir)) {
      if (f.endsWith(".build.md") || f.endsWith(".ref.md")) {
        found.push({ path: `build/${f}`, kind: "file" });
      }
    }
  }
  return found;
}

export function wipeResidues(root, residues, opts = {}) {
  const stack = opts.stack || "react-js";
  const binName = binDirName(stack);
  const binDir = path.join(root, binName);
  const runId = opts.runId || `run-${Date.now()}`;
  const seriesDir = opts.seriesDir || null;
  const archiveRoot = seriesDir
    ? path.join(root, "results", "replicas", seriesDir, runId, "pre-wipe")
    : path.join(root, "results", "replicas", runId, "pre-wipe");
  fs.mkdirSync(archiveRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const moved = [];

  if (fs.existsSync(binDir)) {
    const dest = path.join(archiveRoot, `${binName}-${stamp}`);
    fs.renameSync(binDir, dest);
    moved.push({ from: `${binName}/`, to: path.relative(root, dest) });
  }

  for (const r of residues) {
    if (r.path === `${binName}/`) continue;
    const abs = path.join(root, r.path);
    if (!fs.existsSync(abs)) continue;
    const dest = path.join(archiveRoot, r.path.replace(/\//g, "__") + "-" + stamp);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(abs, dest);
    moved.push({ from: r.path, to: path.relative(root, dest) });
  }
  return moved;
}

export function prepareClean(root, opts = {}) {
  const stack = opts.stack || "react-js";
  const doWipe = !!opts.wipe;
  const runId = opts.runId || `run-${Date.now()}`;
  const before = listResidues(root, stack);

  if (!doWipe) {
    if (before.length) {
      return {
        ok: false,
        error: "residues_present",
        hint: "re-run with --wipe after acknowledging isolation",
        runId,
        stack,
        residues: before,
      };
    }
    return { ok: true, clean: true, runId, stack, residues: [] };
  }

  const moved = wipeResidues(root, before, {
    stack,
    runId,
    seriesDir: opts.seriesDir || null,
  });
  const after = listResidues(root, stack);
  if (after.length) {
    return {
      ok: false,
      error: "wipe_incomplete",
      runId,
      stack,
      moved,
      stillPresent: after,
    };
  }
  return {
    ok: true,
    wiped: true,
    clean: true,
    runId,
    stack,
    moved,
    residuesAfter: [],
  };
}

function main() {
  const root = path.resolve(arg("--root") || defaultRoot);
  const stack = arg("--stack", "react-js");
  const runId = arg("--run-id", `run-${Date.now()}`);
  const doWipe = process.argv.includes("--wipe");
  const seriesDir = arg("--series-dir", null);

  const result = prepareClean(root, {
    stack,
    wipe: doWipe,
    runId,
    seriesDir,
  });

  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) main();
