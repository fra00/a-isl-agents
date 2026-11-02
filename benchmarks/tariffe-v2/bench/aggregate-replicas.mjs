/**
 * Build vector×run matrix + summary from results/replicas/run-NN/report.json + meta.json
 * Denominator is always archived run count N (invalidated count as non-pass).
 * Fractions only (e.g. 4/5), not decimal percentages.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const replicasDir = path.join(root, "results", "replicas");
const vectorsPath = path.join(root, "oracle", "vectors.json");
const refPath = path.join(root, "results", "reference-report.json");
const seriesPath = path.join(replicasDir, "series.json");
const mutationsPath = path.join(replicasDir, "mutations.json");

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

if (!fs.existsSync(replicasDir)) {
  console.error("no results/replicas yet");
  process.exit(1);
}

const { vectors } = JSON.parse(fs.readFileSync(vectorsPath, "utf8"));
const freeze = fs.existsSync(refPath)
  ? JSON.parse(fs.readFileSync(refPath, "utf8"))
  : null;
const series = fs.existsSync(seriesPath)
  ? JSON.parse(fs.readFileSync(seriesPath, "utf8"))
  : null;
const mutationsDoc = fs.existsSync(mutationsPath)
  ? JSON.parse(fs.readFileSync(mutationsPath, "utf8"))
  : null;

const runs = fs
  .readdirSync(replicasDir)
  .filter((d) => fs.existsSync(path.join(replicasDir, d, "meta.json")))
  .sort();

if (!runs.length) {
  console.error("no replica meta.json yet");
  process.exit(1);
}

const N = runs.length;
const perRun = [];

for (const runId of runs) {
  const metaPath = path.join(replicasDir, runId, "meta.json");
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const reportPath = path.join(replicasDir, runId, "report.json");
  const report = fs.existsSync(reportPath)
    ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
    : { failed: [], missing_export: [], total: meta.score?.total };
  const failed = new Set((report.failed || []).map((f) => f.id));
  const missing = new Set((report.missing_export || []).map((f) => f.id));
  const invalidated =
    meta.invalidated === true || meta.integrity?.ok === false;
  const total = meta.score?.total ?? report.total;
  const passedFirst = meta.score?.passedFirst ?? null;
  const passedFinal = meta.score?.passedFinal ?? report.passed ?? null;
  perRun.push({
    runId,
    invalidated,
    invalidateReason: invalidated
      ? meta.invalidateReason || meta.integrity?.reason || "unknown"
      : null,
    model: meta.model ?? series?.model ?? null,
    passedFirst,
    passedFinal,
    total,
    passRateFirstCompile:
      !invalidated && passedFirst != null ? `${passedFirst}/${total}` : null,
    passRateFinal:
      !invalidated && passedFinal != null ? `${passedFinal}/${total}` : null,
    recompileCount: meta.recompileCount ?? null,
    turns: meta.turns ?? "non misurato",
    tokens: meta.tokens ?? "non misurato",
    dependencyUsageOk: invalidated
      ? false
      : (report.dependencyUsage?.ok ?? meta.dependencyUsageOk),
    dependencyUsageByUnit: meta.dependencyUsageByUnit || {},
    failedIds: [...failed],
    missingExportIds: [...missing],
    statusById: Object.fromEntries(
      vectors.map((v) => {
        if (invalidated) return [v.id, "invalidated"];
        if (missing.has(v.id)) return [v.id, "missing_export"];
        if (failed.has(v.id)) return [v.id, "fail"];
        return [v.id, "pass"];
      }),
    ),
  });
}

const matrix = {};
for (const v of vectors) {
  const failCount = perRun.filter((r) => {
    const s = r.statusById[v.id];
    return s === "fail" || s === "missing_export";
  }).length;
  matrix[v.id] = {
    visible: v.visible,
    unit: v.unit,
    call: v.call,
    byRun: Object.fromEntries(perRun.map((r) => [r.runId, r.statusById[v.id]])),
    failCount,
  };
}

function isFirstFull(r) {
  return (
    !r.invalidated &&
    r.passedFirst != null &&
    r.passedFirst === r.total &&
    r.dependencyUsageOk
  );
}
function isFinalFull(r) {
  return (
    !r.invalidated &&
    r.passedFinal != null &&
    r.passedFinal === r.total &&
    r.dependencyUsageOk
  );
}

const firstFull = perRun.filter(isFirstFull).length;
const finalFull = perRun.filter(isFinalFull).length;
const firstScores = perRun
  .filter((r) => !r.invalidated && r.passedFirst != null)
  .map((r) => r.passedFirst);
const finalScores = perRun
  .filter((r) => !r.invalidated && r.passedFinal != null)
  .map((r) => r.passedFinal);

const mutationTable = {};
if (mutationsDoc?.results) {
  for (const res of mutationsDoc.results) {
    const runId = res.runId || path.basename(path.dirname(res.bin || ""));
    for (const m of res.mutations || []) {
      if (!mutationTable[m.mutation]) mutationTable[m.mutation] = {};
      mutationTable[m.mutation][runId] =
        m.status ||
        (m.applied === false
          ? "non_applicabile"
          : m.ok
            ? "killed"
            : m.error
              ? "error"
              : "survived");
    }
  }
}

const out = {
  benchmark: "tariffe-v2",
  aggregatedAt: new Date().toISOString(),
  seriesModel: series?.model ?? null,
  freezeHashes: freeze?.hashes ?? null,
  runCount: N,
  validRunCount: perRun.filter((r) => !r.invalidated).length,
  invalidated: perRun
    .filter((r) => r.invalidated)
    .map((r) => ({ runId: r.runId, reason: r.invalidateReason })),
  runs: perRun.map((r) => ({
    runId: r.runId,
    status: r.invalidated
      ? `invalidata, motivo ${r.invalidateReason}`
      : "ok",
    invalidated: r.invalidated,
    invalidateReason: r.invalidateReason,
    model: r.model,
    passRateFirstCompile: r.passRateFirstCompile,
    passRateFinal: r.passRateFinal,
    recompileCount: r.recompileCount,
    turns: r.turns,
    tokens: r.tokens,
    dependencyUsageOk: r.dependencyUsageOk,
    dependencyUsageByUnit: r.dependencyUsageByUnit,
    failedIds: r.failedIds,
  })),
  summary: {
    firstCompileFullPass: `${firstFull}/${N}`,
    finalFullPass: `${finalFull}/${N}`,
    passedFirstMedian: median(firstScores),
    passedFirstMin: firstScores.length ? Math.min(...firstScores) : null,
    passedFirstMax: firstScores.length ? Math.max(...firstScores) : null,
    passedFinalMedian: median(finalScores),
    passedFinalMin: finalScores.length ? Math.min(...finalScores) : null,
    passedFinalMax: finalScores.length ? Math.max(...finalScores) : null,
  },
  vectorsFailingAtLeastOnce: Object.entries(matrix)
    .filter(([, m]) => m.failCount > 0)
    .sort((a, b) => b[1].failCount - a[1].failCount)
    .map(([id, m]) => ({
      id,
      failCount: `${m.failCount}/${N}`,
      visible: m.visible,
    })),
  mutationByReplica: mutationTable,
  matrix,
};

fs.writeFileSync(
  path.join(replicasDir, "aggregate.json"),
  JSON.stringify(out, null, 2) + "\n",
);

const mdLines = [
  `# Replica aggregate (${N} run archiviate)`,
  "",
  series?.model
    ? `Serie model (unico): \`${series.model.id}\` — ${series.model.note || ""}`
    : "Serie model: (manca series.json)",
  "",
  freeze?.hashes
    ? `Freeze: vectors \`${freeze.hashes.vectorsSha256.slice(0, 12)}…\` oracle \`${freeze.hashes.oracleSha256.slice(0, 12)}…\` specs \`${freeze.hashes.specsSha256.slice(0, 12)}…\``
    : "Freeze: (no reference-report.json)",
  "",
  `| run | status | first | final | recompiles | turns | tokens | deps |`,
  `|-----|--------|------:|------:|-----------:|------:|-------:|:----:|`,
  ...perRun.map((r) => {
    const st = r.invalidated
      ? `invalidata (${r.invalidateReason})`
      : "ok";
    return `| ${r.runId} | ${st} | ${r.passRateFirstCompile ?? "—"} | ${r.passRateFinal ?? "—"} | ${r.recompileCount ?? "—"} | ${r.turns} | ${r.tokens} | ${r.invalidated ? "—" : r.dependencyUsageOk ? "pass" : "fail"} |`;
  }),
  "",
  `First-compile full pass (score+deps; invalidate = non-pass): **${out.summary.firstCompileFullPass}**`,
  `Final full pass: **${out.summary.finalFullPass}**`,
  `First passed — median ${out.summary.passedFirstMedian}, min ${out.summary.passedFirstMin}, max ${out.summary.passedFirstMax}`,
  `Final passed — median ${out.summary.passedFinalMedian}, min ${out.summary.passedFinalMin}, max ${out.summary.passedFinalMax}`,
  "",
];

if (out.invalidated.length) {
  mdLines.push("## Repliche invalidate", "");
  for (const inv of out.invalidated) {
    mdLines.push(`- \`${inv.runId}\`: ${inv.reason}`);
  }
  mdLines.push("");
}

if (out.vectorsFailingAtLeastOnce.length) {
  mdLines.push("## Vettori falliti in almeno una run (non invalidata)", "");
  for (const v of out.vectorsFailingAtLeastOnce) {
    mdLines.push(`- \`${v.id}\` — ${v.failCount} (visible=${v.visible})`);
  }
} else {
  mdLines.push("Nessun vettore fallito su run non invalidate.");
}

const mutNames = Object.keys(mutationTable);
if (mutNames.length) {
  const runIds = perRun.map((r) => r.runId);
  mdLines.push("", "## Mutazioni × replica (hand sample)", "");
  mdLines.push(
    `| mutation | ${runIds.join(" | ")} |`,
    `|----------|${runIds.map(() => "-----").join("|")}|`,
  );
  for (const name of mutNames) {
    mdLines.push(
      `| ${name} | ${runIds.map((id) => mutationTable[name][id] ?? "—").join(" | ")} |`,
    );
  }
}

mdLines.push("", "## dependencyUsage by unit × run", "");
const units = [
  ...new Set(
    perRun.flatMap((r) => Object.keys(r.dependencyUsageByUnit || {})),
  ),
].sort();
if (units.length) {
  mdLines.push(
    `| unit | ${perRun.map((r) => r.runId).join(" | ")} |`,
    `|------|${perRun.map(() => "-----").join("|")}|`,
  );
  for (const u of units) {
    mdLines.push(
      `| ${u} | ${perRun.map((r) => (r.invalidated ? "inv" : r.dependencyUsageByUnit?.[u] ?? "—")).join(" | ")} |`,
    );
  }
}

fs.writeFileSync(path.join(replicasDir, "aggregate.md"), mdLines.join("\n") + "\n");
console.log(
  JSON.stringify(
    {
      ok: true,
      summary: out.summary,
      invalidated: out.invalidated,
      vectorsFailingAtLeastOnce: out.vectorsFailingAtLeastOnce,
    },
    null,
    2,
  ),
);
