/**
 * One-shot: selfcheck → verify → score
 * From repo root: npm run bench:v2 [-- --stack csharp]
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const benchRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(benchRoot, "../..");
const nodeCmd = process.execPath;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const stack = arg("--stack") || "react-js";

function run(label, command, args) {
  console.log(`\n=== ${label} ===`);
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

console.log(`Benchmark tariffe-v2 (stack=${stack})`);
console.log(`workspace: ${benchRoot}`);

run("1/4 coerenza dati (selfcheck)", nodeCmd, [
  path.join(benchRoot, "oracle", "selfcheck.mjs"),
]);

run("2/4 unit test Spec (verify)", nodeCmd, [
  path.join(repoRoot, "runtime", "llm-tools", "run-verify.cjs"),
  "--root",
  benchRoot,
  "--stack",
  stack,
]);

run("3/4 dependencyUsage (import strutturali)", nodeCmd, [
  path.join(benchRoot, "bench", "check-deps.mjs"),
  "--stack",
  stack,
]);

run("4/4 esame vettori (score)", nodeCmd, [
  path.join(benchRoot, "bench", "score.mjs"),
  "--stack",
  stack,
]);

console.log(`\n=== BENCH V2 PASS (${stack}) ===\n`);
