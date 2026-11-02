/**
 * Freeze reference-report.json: vectors/oracle/spec hashes + optional score snapshot.
 * Usage: node bench/freeze-reference.mjs [--from-report path] [--model name]
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const resultsDir = path.join(root, "results");

function sha256File(p) {
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function sha256Text(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function parseArgs(argv) {
  const out = { fromReport: null, model: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--from-report") out.fromReport = argv[++i];
    else if (argv[i] === "--model") out.model = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv);
const specFiles = fs
  .readdirSync(root)
  .filter((f) => f.endsWith(".isl.md"))
  .sort();

const specs = {};
const versions = {};
for (const f of specFiles) {
  const abs = path.join(root, f);
  const text = fs.readFileSync(abs, "utf8");
  specs[f] = sha256File(abs);
  const vm = text.match(/\*\*Version\*\*:\s*([^\n]+)/);
  versions[f] = vm ? vm[1].trim() : null;
}

const vectorsPath = path.join(root, "oracle", "vectors.json");
const oraclePath = path.join(root, "oracle", "oracle.mjs");
const callMapPath = path.join(root, "bench", "call-map.json");

const specsConcatHash = sha256Text(
  specFiles.map((f) => `${f}:${specs[f]}`).join("\n") + "\n",
);

let scoreSlice = {};
if (args.fromReport) {
  const rep = JSON.parse(fs.readFileSync(path.resolve(args.fromReport), "utf8"));
  scoreSlice = {
    passed: rep.passed,
    total: rep.total,
    visiblePassRate: rep.visiblePassRate,
    holdoutPassRate: rep.holdoutPassRate,
    dependencyUsage: rep.dependencyUsage,
    failed: rep.failed,
    missing_export: rep.missing_export,
  };
}

const report = {
  benchmark: "tariffe-v2",
  frozenAt: new Date().toISOString(),
  specVersionExpected: "1.1.0",
  specVersions: versions,
  hashes: {
    vectorsSha256: sha256File(vectorsPath),
    oracleSha256: sha256File(oraclePath),
    callMapSha256: sha256File(callMapPath),
    specsSha256: specsConcatHash,
    specs: specs,
  },
  ...scoreSlice,
  runLog: {
    date: new Date().toISOString().slice(0, 10),
    model: args.model,
    recompileCount: null,
    passRateFirstCompile:
      scoreSlice.total != null
        ? scoreSlice.passed / scoreSlice.total
        : null,
    passRateFinal: null,
    notes:
      "Closed-rules adherence (A1–A3 closed). Spec/oracle/vectors same-agent bias. dependencyUsage is syntactic (imports + forbid *bps/10000).",
  },
  honesty: {
    measures: "adherence to closed Spec rules + structural imports",
    doesNotMeasure: [
      "agent interpretation under open ambiguity",
      "whether imported Domain symbols are used at the correct call site",
      "cross-session hold-out authored without Spec",
    ],
    dependencyUsage: "syntactic",
    sameAgentSpecOracleVectors: true,
  },
  integritySnapshot: "results/integrity-freeze.json",
};

fs.mkdirSync(resultsDir, { recursive: true });
const outPath = path.join(resultsDir, "reference-report.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, wrote: outPath, hashes: report.hashes }, null, 2));
