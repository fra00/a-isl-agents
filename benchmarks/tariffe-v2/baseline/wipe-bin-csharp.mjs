/**
 * Wipe baseline/bin-csharp before a baseline run.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binDir = path.join(__dirname, "bin-csharp");
const root = path.resolve(__dirname, "..");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const runId = arg("--run-id") || `run-${Date.now()}`;
const seriesDir = arg("--series-dir") || "baseline-csharp-s1";
if (!fs.existsSync(binDir)) {
  console.log(JSON.stringify({ ok: true, wiped: false, runId, seriesDir }));
  process.exit(0);
}
const dest = path.join(
  root,
  "results",
  "replicas",
  seriesDir,
  runId,
  "pre-wipe",
  `bin-csharp-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.renameSync(binDir, dest);
console.log(JSON.stringify({ ok: true, wiped: true, archived: dest, runId }, null, 2));
