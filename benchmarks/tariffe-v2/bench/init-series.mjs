/**
 * Create results/replicas/series.json once for a replica campaign.
 * Model is locked here and copied into every replica meta — not re-typed per run.
 *
 * Usage:
 *   node bench/init-series.mjs --model <id> [--model-version <v>] [--n 5] [--note "..."]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const model = arg("--model");
if (!model || model === "cursor-compile-agent") {
  console.error(
    JSON.stringify({
      ok: false,
      error: "model_required",
      hint: "real model id for the whole series, e.g. --model composer",
    }),
  );
  process.exit(2);
}

const seriesDirName = arg("--series-dir");
const stack = arg("--stack", "react-js");
const outDir = seriesDirName
  ? path.join(root, "results", "replicas", seriesDirName)
  : path.join(root, "results", "replicas");

const series = {
  seriesId: arg("--series-id") || `tariffe-v2-${stack}-${new Date().toISOString().slice(0, 10)}`,
  stack,
  createdAt: new Date().toISOString(),
  n: Number(arg("--n", "5")),
  model: {
    id: model,
    version: arg("--model-version"),
    declaredBy: "series.json (single source for all replicas)",
    subagentModelExplicit: false,
    note:
      "Operator/orchestrator declares the model used for compile subagents. Not verified by the runtime. If a subagent uses a different model, this field is wrong without detection.",
  },
  expectationsPath: seriesDirName
    ? `results/replicas/${seriesDirName}/EXPECTATIONS.md`
    : "results/replicas/EXPECTATIONS.md",
  isolation: {
    filesystem:
      "integrity over workspace except bin-react-js/, bin-csharp/, build/, results/, bin/, obj/",
    subagentOracleAccess: "prompt-only (not FS-enforced)",
  },
  note: arg("--note"),
};

fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "series.json");
if (fs.existsSync(outPath) && !process.argv.includes("--force")) {
  console.error(
    JSON.stringify({
      ok: false,
      error: "series_exists",
      hint: "pass --force to overwrite",
      path: outPath,
    }),
  );
  process.exit(1);
}
fs.writeFileSync(outPath, JSON.stringify(series, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, wrote: outPath, series }, null, 2));
