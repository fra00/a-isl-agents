/**
 * After compile + measure: snapshot bin (incl. tests) + report + run log.
 * Model is taken from results/replicas/series.json (single series source).
 *
 * Usage:
 *   node bench/archive-replica.mjs --run-id run-01 \
 *     [--report path] \
 *     --pass-first <n> --pass-final <n> --total <n> \
 *     --recompile-count <n> \
 *     [--turns <n>|non-misurato] [--tokens <n>|non-misurato] \
 *     [--integrity-ok true|false] [--invalidate-reason "..."] \
 *     [--integrity-snapshot path]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const resultsDir = path.join(root, "results");

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0) return null;
  return process.argv[i + 1];
}

const stack = arg("--stack") || "react-js";
const binName = stack === "csharp" ? "bin-csharp" : "bin-react-js";
const binDir = path.join(root, binName);
const seriesDirName = arg("--series-dir");
const seriesPath = seriesDirName
  ? path.join(resultsDir, "replicas", seriesDirName, "series.json")
  : path.join(resultsDir, "replicas", "series.json");

function argNum(name) {
  const v = arg(name);
  return v == null ? null : Number(v);
}

function argMetric(name) {
  const v = arg(name);
  if (v == null || v === "" || v === "non-misurato") return "non misurato";
  const n = Number(v);
  return Number.isFinite(n) ? n : "non misurato";
}

const runId = arg("--run-id");
if (!runId) {
  console.error("missing --run-id");
  process.exit(2);
}

if (!fs.existsSync(seriesPath)) {
  console.error(
    JSON.stringify({
      ok: false,
      error: "series_missing",
      hint: "run init-series.mjs first",
    }),
  );
  process.exit(2);
}

const series = JSON.parse(fs.readFileSync(seriesPath, "utf8"));
const model = series.model;
if (!model?.id || model.id === "cursor-compile-agent") {
  console.error(JSON.stringify({ ok: false, error: "series_model_invalid" }));
  process.exit(2);
}

const dest = seriesDirName
  ? path.join(resultsDir, "replicas", seriesDirName, runId)
  : path.join(resultsDir, "replicas", runId);
fs.mkdirSync(dest, { recursive: true });

let reportPath = arg("--report");
if (!reportPath) {
  const reports = fs
    .readdirSync(resultsDir)
    .filter((f) => f.startsWith("report-") && f.endsWith(".json"))
    .map((f) => ({ f, t: fs.statSync(path.join(resultsDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!reports.length) {
    console.error("no report-*.json found");
    process.exit(1);
  }
  reportPath = path.join(resultsDir, reports[0].f);
}

const reportDest = path.join(dest, "report.json");
fs.copyFileSync(reportPath, reportDest);

const binDest = path.join(dest, binName);
if (fs.existsSync(binDest)) fs.rmSync(binDest, { recursive: true, force: true });
if (fs.existsSync(binDir)) {
  fs.cpSync(binDir, binDest, { recursive: true });
}

const report = JSON.parse(fs.readFileSync(reportDest, "utf8"));
const total = argNum("--total") ?? report.total;
const passFinal = argNum("--pass-final") ?? report.passed;
const passFirst = argNum("--pass-first");
const recompileCount = argNum("--recompile-count") ?? 0;
const integrityOk = arg("--integrity-ok") === "true";
const invalidateReason =
  arg("--invalidate-reason") ||
  (integrityOk ? null : "integrity_mismatch");

if (passFirst == null) {
  console.error(
    JSON.stringify({
      ok: false,
      error: "pass_first_required",
      hint: "pass --pass-first <n>",
    }),
  );
  process.exit(2);
}

const deps = report.dependencyUsage?.dependencyUsage || [];
const meta = {
  runId,
  seriesId: series.seriesId,
  stack,
  archivedAt: new Date().toISOString(),
  sourceReport: path.relative(root, reportPath).replace(/\\/g, "/"),
  model: {
    ...model,
    copiedFrom: seriesDirName
      ? `results/replicas/${seriesDirName}/series.json`
      : "results/replicas/series.json",
  },
  score: {
    total,
    passRateFirstCompile: `${passFirst}/${total}`,
    passRateFinal: `${passFinal}/${total}`,
    passedFirst: passFirst,
    passedFinal: passFinal,
    firstCompileFullPass: passFirst === total,
    finalFullPass: passFinal === total,
  },
  recompileCount,
  turns: argMetric("--turns"),
  tokens: argMetric("--tokens"),
  holdout: {
    passed: report.holdoutPass ?? null,
    total: report.holdoutTotal ?? null,
    asFraction:
      report.holdoutPass != null && report.holdoutTotal != null
        ? `${report.holdoutPass}/${report.holdoutTotal}`
        : null,
  },
  dependencyUsageOk: report.dependencyUsage?.ok ?? null,
  dependencyUsageByUnit: Object.fromEntries(
    deps.map((d) => [d.unit, d.dependencyUsage]),
  ),
  failedIds: (report.failed || []).map((f) => f.id),
  missingExportIds: (report.missing_export || []).map((f) => f.id),
  integrity: {
    ok: integrityOk,
    snapshot: arg("--integrity-snapshot"),
    reason: invalidateReason,
  },
  binFileCount: fs.existsSync(binDest)
    ? fs.readdirSync(binDest).filter((f) => !f.startsWith(".")).length
    : 0,
  invalidated: !integrityOk,
  invalidateReason: integrityOk ? null : invalidateReason,
};

fs.writeFileSync(path.join(dest, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
fs.copyFileSync(seriesPath, path.join(dest, "series.json"));
console.log(JSON.stringify({ ok: true, dest, meta }, null, 2));
if (meta.invalidated) process.exit(3);
