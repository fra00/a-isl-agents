/**
 * Hash almost the whole bench project. Unexpected writes outside bin/build/results
 * invalidate a replica.
 *
 * Excluded from the bundle:
 *   - bin-react-js/     (compile output)
 *   - bin-csharp/
 *   - build/            (builder/lock/verify artifacts)
 *   - results/          (orchestrator archives; includes this snapshot)
 *   - node_modules/
 *
 * Usage:
 *   node bench/integrity.mjs --write-snapshot path.json [--root dir]
 *   node bench/integrity.mjs --check path.json [--root dir]
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(__dirname, "..");

export const EXCLUDE_DIR_NAMES = new Set([
  "bin-react-js",
  "bin-csharp",
  "build",
  "results",
  "node_modules",
  ".git",
  "bin",
  "obj",
]);

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function walk(dir, out, excludeNames) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name === "." || name === "..") continue;
    const abs = path.join(dir, name);
    let st;
    try {
      st = fs.lstatSync(abs);
    } catch {
      continue;
    }
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) {
      if (excludeNames.has(name)) continue;
      walk(abs, out, excludeNames);
      continue;
    }
    if (!st.isFile()) continue;
    out.push(abs);
  }
}

export function computeIntegrity(root = defaultRoot, excludeNames = EXCLUDE_DIR_NAMES) {
  const files = {};
  const list = [];
  walk(root, list, excludeNames);
  list.sort((a, b) => a.localeCompare(b));
  for (const abs of list) {
    const rel = path.relative(root, abs).replace(/\\/g, "/");
    files[rel] = sha256File(abs);
  }
  const canonical = Object.keys(files)
    .sort()
    .map((k) => `${k}:${files[k]}`)
    .join("\n");
  const bundleSha256 = crypto
    .createHash("sha256")
    .update(canonical + "\n", "utf8")
    .digest("hex");
  return {
    bundleSha256,
    files,
    at: new Date().toISOString(),
    excludes: [...excludeNames],
    note: "Any write under tracked paths (e.g. oracle/, bench/, *.isl.md, package files in bench root) invalidates the replica. Compile output under bin-react-js/ and build/ is excluded by design.",
  };
}

export function checkIntegrity(expected, root = defaultRoot) {
  const snap = computeIntegrity(root);
  const mismatches = [];
  const expFiles = expected.files || {};
  const allKeys = new Set([...Object.keys(expFiles), ...Object.keys(snap.files)]);
  for (const k of [...allKeys].sort()) {
    if (expFiles[k] !== snap.files[k]) {
      mismatches.push({
        file: k,
        expected: expFiles[k] ?? null,
        actual: snap.files[k] ?? null,
      });
    }
  }
  const ok =
    mismatches.length === 0 && expected.bundleSha256 === snap.bundleSha256;
  return {
    ok,
    expectedBundle: expected.bundleSha256,
    actualBundle: snap.bundleSha256,
    mismatchCount: mismatches.length,
    mismatches: mismatches.slice(0, 50),
    snap,
  };
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function main() {
  const root = path.resolve(arg("--root") || defaultRoot);
  const writePath = arg("--write-snapshot");
  const checkPath = arg("--check");
  const snap = computeIntegrity(root);

  if (writePath) {
    const abs = path.resolve(writePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, JSON.stringify(snap, null, 2) + "\n");
    console.log(
      JSON.stringify(
        {
          ok: true,
          wrote: abs,
          bundleSha256: snap.bundleSha256,
          fileCount: Object.keys(snap.files).length,
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  if (checkPath) {
    const expected = JSON.parse(fs.readFileSync(path.resolve(checkPath), "utf8"));
    const result = checkIntegrity(expected, root);
    console.log(
      JSON.stringify(
        {
          ok: result.ok,
          expectedBundle: result.expectedBundle,
          actualBundle: result.actualBundle,
          mismatchCount: result.mismatchCount,
          mismatches: result.mismatches,
        },
        null,
        2,
      ),
    );
    process.exit(result.ok ? 0 : 1);
  }

  console.log(JSON.stringify(snap, null, 2));
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) main();
