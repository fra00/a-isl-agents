/**
 * Score frozen vectors against bin-<stack>.
 * Exit ≠ 0 if any vector is non-pass (wrong_answer or missing_export).
 *
 * --stack react-js (default) | csharp
 * --bin <dir> overrides default bin-<stack>
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const repoRequire = createRequire(path.join(root, "package.json"));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const stack = arg("--stack") || "react-js";
const vectorsPath = path.join(root, "oracle", "vectors.json");
const callMapPath = path.join(
  __dirname,
  stack === "csharp" ? "call-map-csharp.json" : "call-map.json",
);
const oraclePath = path.join(root, "oracle", "oracle.mjs");
const defaultBin =
  stack === "csharp" ? path.join(root, "bin-csharp") : path.join(root, "bin-react-js");
const binDir = path.resolve(arg("--bin") || defaultBin);
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

async function scoreCsharp() {
  const proj = path.join(__dirname, "score-csharp", "TariffeScore.csproj");
  if (!fs.existsSync(binDir)) {
    console.error(JSON.stringify({ ok: false, error: "bin_missing", binDir }, null, 2));
    process.exit(3);
  }
  const csFiles = fs
    .readdirSync(binDir)
    .filter((f) => f.endsWith(".cs") && !f.endsWith(".Tests.cs"));
  if (!csFiles.length) {
    console.error(JSON.stringify({ ok: false, error: "no_cs_sources", binDir }, null, 2));
    process.exit(3);
  }

  const r = spawnSync(
    "dotnet",
    [
      "run",
      "--project",
      proj,
      "-c",
      "Release",
      "-p:TariffeBin=" + binDir,
      "--no-launch-profile",
      "--",
      binDir,
      vectorsPath,
      callMapPath,
    ],
    { encoding: "utf8", cwd: root },
  );
  const stdout = r.stdout || "";
  let report;
  try {
    const start = stdout.indexOf("{");
    report = JSON.parse(start >= 0 ? stdout.slice(start) : stdout);
  } catch {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: "csharp_score_parse_failed",
          status: r.status,
          stdout,
          stderr: r.stderr,
        },
        null,
        2,
      ),
    );
    process.exit(3);
  }

  report.vectorsSha256 = sha256File(vectorsPath);
  report.oracleSha256 = sha256File(oraclePath);
  report.stack = "csharp";
  report.binDir = binDir;

  try {
    const deps = spawnSync(
      process.execPath,
      [path.join(__dirname, "check-deps.mjs"), "--bin", binDir, "--stack", "csharp"],
      { encoding: "utf8", cwd: root },
    );
    report.dependencyUsage = JSON.parse(deps.stdout || "{}");
  } catch (e) {
    report.dependencyUsage = { ok: false, error: String(e) };
  }

  report.runLog = {
    date: null,
    model: null,
    recompileCount: null,
    passRateFirstCompile: null,
    passRateFinal: null,
    notes: "operator-filled before committing results/reference-report.json",
  };

  fs.mkdirSync(resultsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.join(resultsDir, `report-${stamp}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  console.error(`wrote ${outPath}`);
  const nonPass =
    (report.failed?.length || 0) + (report.missing_export?.length || 0);
  process.exit(nonPass === 0 ? 0 : 1);
}

async function main() {
  if (stack === "csharp") {
    await scoreCsharp();
    return;
  }

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

  let dependencyUsage = null;
  try {
    const { spawnSync } = await import("child_process");
    const depsScript = path.join(__dirname, "check-deps.mjs");
    const r = spawnSync(
      process.execPath,
      [depsScript, "--bin", binDir],
      {
        encoding: "utf8",
        cwd: root,
      },
    );
    dependencyUsage = JSON.parse(r.stdout || "{}");

  } catch (e) {
    dependencyUsage = { ok: false, error: String(e) };
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
    dependencyUsage,
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
