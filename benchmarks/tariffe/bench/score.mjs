/**
 * Score frozen vectors against bin-react-js.
 * Exit ≠ 0 if any vector is non-pass (wrong_answer or missing_export).
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const repoRequire = createRequire(path.join(root, "package.json"));

const vectorsPath = path.join(root, "oracle", "vectors.json");
const callMapPath = path.join(__dirname, "call-map.json");
const oraclePath = path.join(root, "oracle", "oracle.mjs");
const binDir = path.join(root, "bin-react-js");
const resultsDir = path.join(root, "results");

function sha256File(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function rate(passed, total) {
  return total === 0 ? null : passed / total;
}

function checkCallMapSync(vectors, callMap) {
  const keys = new Set(Object.keys(callMap));
  const used = new Set();
  const errors = [];
  for (const v of vectors) {
    const k = `${v.unit}.${v.call}`;
    used.add(k);
    if (!keys.has(k)) {
      errors.push(`vector ${v.id}: missing call-map entry ${k}`);
    }
  }
  for (const k of keys) {
    if (![...used].includes(k)) {
      errors.push(`call-map ${k}: no vectors`);
    }
  }
  return errors;
}

async function loadExport(file, exportName) {
  const abs = path.join(binDir, file);
  if (!fs.existsSync(abs)) {
    return { error: "file_missing", abs };
  }
  let mod;
  try {
    mod = await import(pathToFileURL(abs).href + `?t=${Date.now()}`);
  } catch (e) {
    // CJS fallback
    try {
      delete repoRequire.cache[abs];
      mod = repoRequire(abs);
    } catch (e2) {
      return { error: "load_failed", message: String(e2) };
    }
  }
  const fn =
    mod[exportName] ||
    (mod.default && mod.default[exportName]) ||
    (mod.default && typeof mod.default === "function" && exportName === "default"
      ? mod.default
      : null);
  if (typeof fn !== "function") {
    return { error: "missing_export", abs };
  }
  return { fn };
}

async function main() {
  const { vectors } = JSON.parse(fs.readFileSync(vectorsPath, "utf8"));
  const callMap = JSON.parse(fs.readFileSync(callMapPath, "utf8"));

  const syncErrors = checkCallMapSync(vectors, callMap);
  if (syncErrors.length) {
    console.error(JSON.stringify({ ok: false, setupErrors: syncErrors }, null, 2));
    process.exit(3);
  }

  const failed = [];
  const missing_export = [];
  let visiblePass = 0;
  let visibleTotal = 0;
  let holdoutPass = 0;
  let holdoutTotal = 0;
  let holdoutHandPass = 0;
  let holdoutHandTotal = 0;
  let holdoutOdPass = 0;
  let holdoutOdTotal = 0;
  let passed = 0;

  const moduleCache = new Map();

  for (const v of vectors) {
    const key = `${v.unit}.${v.call}`;
    const entry = callMap[key];
    const cacheKey = `${entry.file}::${entry.export}`;
    if (!moduleCache.has(cacheKey)) {
      moduleCache.set(cacheKey, await loadExport(entry.file, entry.export));
    }
    const loaded = moduleCache.get(cacheKey);

    const bucket = () => {
      if (v.visible) visibleTotal++;
      else {
        holdoutTotal++;
        if (v.provenance === "hand") holdoutHandTotal++;
        else holdoutOdTotal++;
      }
    };
    bucket();

    if (loaded.error) {
      missing_export.push({
        id: v.id,
        unit: v.unit,
        call: v.call,
        reason: loaded.error,
      });
      continue;
    }

    let actual;
    try {
      actual = loaded.fn(v.input);
    } catch (e) {
      failed.push({
        id: v.id,
        reason: "wrong_answer",
        expected: v.expected,
        actual: { threw: String(e) },
      });
      continue;
    }

    if (!eq(actual, v.expected)) {
      failed.push({
        id: v.id,
        reason: "wrong_answer",
        expected: v.expected,
        actual,
      });
      continue;
    }

    passed++;
    if (v.visible) visiblePass++;
    else {
      holdoutPass++;
      if (v.provenance === "hand") holdoutHandPass++;
      else holdoutOdPass++;
    }
  }

  const report = {
    stack: "react-js",
    binDir,
    vectorsSha256: sha256File(vectorsPath),
    oracleSha256: sha256File(oraclePath),
    passed,
    total: vectors.length,
    visiblePassRate: rate(visiblePass, visibleTotal),
    holdoutPassRate: rate(holdoutPass, holdoutTotal),
    holdoutPassRateHand: rate(holdoutHandPass, holdoutHandTotal),
    holdoutPassRateOracleDerived: rate(holdoutOdPass, holdoutOdTotal),
    visibleTotal,
    holdoutTotal,
    holdoutHandTotal,
    holdoutOdTotal,
    failed,
    missing_export,
    verifyNote:
      "EXT-001 vitest is separate; see build/verify-status.json after npm run verify",
    runLog: {
      date: null,
      model: null,
      recompileCount: null,
      passRateFirstCompile: null,
      passRateFinal: null,
      notes: "operator-filled before committing results/reference-report.json",
    },
  };

  fs.mkdirSync(resultsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(resultsDir, `report-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

  // Placeholder reference schema if missing (not a freeze until operator fills runLog after compile)
  const refPath = path.join(resultsDir, "reference-report.schema.json");
  if (!fs.existsSync(refPath)) {
    fs.writeFileSync(
      refPath,
      JSON.stringify(
        {
          description:
            "Copy a score report to reference-report.json after first compile; fill runLog.",
          requiredFields: [
            "vectorsSha256",
            "oracleSha256",
            "holdoutPassRate",
            "failed",
            "missing_export",
            "runLog",
          ],
        },
        null,
        2,
      ) + "\n",
    );
  }

  console.log(JSON.stringify(report, null, 2));
  console.error(`wrote ${outPath}`);

  const nonPass = failed.length + missing_export.length;
  process.exit(nonPass === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(3);
});
