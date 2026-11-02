/**
 * Archive baseline bin + score report into results/replicas/baseline-s1/<run-id>/
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const binDir = path.join(__dirname, "bin-react-js");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const runId = arg("--run-id");
if (!runId) {
  console.error("missing --run-id");
  process.exit(2);
}
const passFirst = Number(arg("--pass-first"));
const passFinal = Number(arg("--pass-final"));
const total = Number(arg("--total") || "27");
const recompileCount = Number(arg("--recompile-count") || "0");
const seriesPath = path.join(root, "results", "replicas", "baseline-s1", "series.json");

const dest = path.join(root, "results", "replicas", "baseline-s1", runId);
fs.mkdirSync(dest, { recursive: true });

const score = spawnSync(
  process.execPath,
  [path.join(root, "bench", "score.mjs"), "--bin", binDir],
  { encoding: "utf8", cwd: root },
);
const report = JSON.parse(score.stdout);
fs.writeFileSync(path.join(dest, "report.json"), JSON.stringify(report, null, 2) + "\n");

const deps = spawnSync(
  process.execPath,
  [path.join(root, "bench", "check-deps.mjs"), "--bin", binDir],
  { encoding: "utf8", cwd: root },
);
let dependencyUsage = null;
try {
  dependencyUsage = JSON.parse(deps.stdout || "{}");
} catch {
  dependencyUsage = { ok: false };
}

const binDest = path.join(dest, "bin-react-js");
if (fs.existsSync(binDest)) fs.rmSync(binDest, { recursive: true, force: true });
if (fs.existsSync(binDir)) fs.cpSync(binDir, binDest, { recursive: true });

const series = fs.existsSync(seriesPath)
  ? JSON.parse(fs.readFileSync(seriesPath, "utf8"))
  : { model: { id: "composer", subagentModelExplicit: false } };

const meta = {
  kind: "baseline",
  runId,
  archivedAt: new Date().toISOString(),
  model: series.model,
  score: {
    total,
    passRateFirstCompile: `${passFirst}/${total}`,
    passRateFinal: `${passFinal}/${total}`,
    passedFirst: passFirst,
    passedFinal: passFinal,
  },
  recompileCount,
  turns: "non misurato",
  tokens: "non misurato",
  dependencyUsageOk: dependencyUsage?.ok ?? null,
  dependencyUsageByUnit: Object.fromEntries(
    (dependencyUsage?.dependencyUsage || []).map((d) => [d.unit, d.dependencyUsage]),
  ),
  failedIds: (report.failed || []).map((f) => f.id),
  missingExportIds: (report.missing_export || []).map((f) => f.id),
  firstFailKind:
    (report.missing_export || []).length > 0 && (report.failed || []).length === 0
      ? "forma"
      : (report.failed || []).length > 0
        ? "logica"
        : null,
};
fs.writeFileSync(path.join(dest, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, dest, meta }, null, 2));
process.exit(report.passed === report.total && dependencyUsage?.ok ? 0 : 1);
