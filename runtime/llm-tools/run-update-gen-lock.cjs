/**
 * Agent/skill entrypoint: forwards to A-ISL gen-lock merge CLI.
 */
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.join(__dirname, "..", "..");
const cli = path.join(repoRoot, "runtime", "cli", "agent-update-gen-lock.ts");

const extra = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  [
    path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs"),
    cli,
    ...extra,
  ],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(result.status === null ? 1 : result.status);
