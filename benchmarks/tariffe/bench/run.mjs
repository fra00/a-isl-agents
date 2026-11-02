/**
 * One-shot benchmark runner: selfcheck → verify → score.
 * Usage (from repo root): npm run bench
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const benchRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(benchRoot, "../..");

function run(label, command, args) {
  console.log(`\n=== ${label} ===`);
  // shell:false so paths with spaces (e.g. "A-ISL for agents") stay intact
  const r = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (r.error) {
    console.error(`\nFAIL: ${label}:`, r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`\nFAIL: ${label} (exit ${r.status})`);
    process.exit(r.status ?? 1);
  }
  console.log(`OK: ${label}`);
}

const nodeCmd = process.execPath;

console.log("Benchmark tariffe");
console.log(`workspace: ${benchRoot}`);

run("1/3 coerenza dati (selfcheck)", nodeCmd, [
  path.join(benchRoot, "oracle", "selfcheck.mjs"),
]);

// Call verify CLI via node (avoid npm.cmd + spaces / EINVAL on Windows)
run("2/3 unit test Spec (verify)", nodeCmd, [
  path.join(repoRoot, "runtime", "llm-tools", "run-verify.cjs"),
  "--root",
  benchRoot,
  "--stack",
  "react-js",
]);

run("3/3 esame vettori (score)", nodeCmd, [
  path.join(benchRoot, "bench", "score.mjs"),
]);

console.log("\n=== BENCH PASS ===\n");
