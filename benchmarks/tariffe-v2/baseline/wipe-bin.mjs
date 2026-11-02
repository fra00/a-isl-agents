/**
 * Remove baseline/bin-react-js for a clean baseline run.
 * Usage: node wipe-bin.mjs --run-id run-01
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bin = path.join(__dirname, "bin-react-js");
const i = process.argv.indexOf("--run-id");
const runId = i >= 0 ? process.argv[i + 1] : `run-${Date.now()}`;
const archive = path.join(
  __dirname,
  "..",
  "results",
  "replicas",
  "baseline-s1",
  runId,
  "pre-wipe",
);

if (fs.existsSync(bin)) {
  fs.mkdirSync(archive, { recursive: true });
  const dest = path.join(archive, `bin-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  fs.renameSync(bin, dest);
  console.log(JSON.stringify({ ok: true, wiped: true, archived: dest, runId }, null, 2));
} else {
  console.log(JSON.stringify({ ok: true, wiped: false, runId }, null, 2));
}
