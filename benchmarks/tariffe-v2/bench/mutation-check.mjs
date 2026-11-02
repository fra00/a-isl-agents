/**
 * Mutation sensitivity on a named bin.
 * Status per cell: killed | survived | non_applicabile (patch did not apply).
 * Kill rate counts only applied mutations.
 *
 * Usage:
 *   node bench/mutation-check.mjs --bin path/to/bin-react-js [--run-id run-01]
 *   node bench/mutation-check.mjs --run-id run-03
 *   node bench/mutation-check.mjs --all-replicas
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const replicasDir = path.join(root, "results", "replicas");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const cases = [
  {
    name: "applyBps floor (no half-up)",
    file: "domain-money.js",
    mutate: (s) => {
      let next = s.replace(
        /if \(absRem \* 2n >= den\) \{\s*return num >= 0n \? quot \+ 1n : quot - 1n;\s*\}\s*return quot;/,
        "return quot;",
      );
      if (next !== s) return next;
      // alternate half-away helper style
      next = s.replace(
        /if \(n >= 0\) \{\s*return Math\.floor\(\(n \+ Math\.floor\(d \/ 2\)\) \/ d\);\s*\}\s*return -Math\.floor\(\(-n \+ Math\.floor\(d \/ 2\)\) \/ d\);/,
        "return Math.trunc(n / d);",
      );
      return next;
    },
    expect: ["money-apply-half", "quote-half", "pen-half", "inv-half"],
  },
  {
    name: "ignore holidays",
    file: "domain-calendar.js",
    mutate: (s) => {
      let next = s.replace(
        "if (holidaySet.has(ymd)) return false;",
        "// holiday ignored",
      );
      if (next !== s) return next;
      return s.replace(
        /if\s*\(\s*holidaySet\.has\([^)]+\)\s*\)\s*return\s+false\s*;/,
        "// holiday ignored",
      );
    },
    expect: ["cal-between-holiday", "pen-holiday"],
  },
  {
    name: "grace exclusive (charge at lateDays==grace)",
    file: "logic-penalty.js",
    mutate: (s) => {
      // Flipping only <= to < leaves excess=0 at equality; need +1 day charge.
      let next = s.replace(
        /lateDays\s*<=\s*graceBusinessDays/g,
        "lateDays < graceBusinessDays",
      );
      if (next === s) return s;
      next = next.replace(
        /lateDays\s*-\s*graceBusinessDays/g,
        "lateDays - graceBusinessDays + 1",
      );
      return next;
    },
    expect: ["pen-grace-eq"],
  },
  {
    name: "floor before discounts",
    file: "logic-quote.js",
    mutate: (s) => {
      const re =
        /let amount = priced;\s*(?:for \(const discountBps of discountsBps \|\| \[\]\) \{[\s\S]*?\}\s*)if \(amount < invoiceFloorCents\) amount = invoiceFloorCents;/;
      const next = s.replace(
        re,
        `let amount = priced;
  if (amount < invoiceFloorCents) amount = invoiceFloorCents;
  for (const discountBps of discountsBps || []) {
    const keepBps = 10000 - discountBps;
    amount = applyBps({ cents: amount, bps: keepBps }).cents;
  }`,
      );
      return next;
    },
    expect: ["quote-floor"],
  },
  {
    name: "void from issued",
    file: "logic-case-status.js",
    mutate: (s) => {
      let next = s.replace(
        /issued:\s*\{\s*mark_overdue:\s*"overdue",\s*pay:\s*"paid"\s*\}/,
        'issued: { mark_overdue: "overdue", pay: "paid", void: "voided" }',
      );
      if (next !== s) return next;
      return s.replace(
        "issued: { mark_overdue: \"overdue\", pay: \"paid\" },",
        "issued: { mark_overdue: \"overdue\", pay: \"paid\", void: \"voided\" },",
      );
    },
    expect: ["st-void-from-issued"],
  },
];

function resolveTargets() {
  if (process.argv.includes("--all-replicas")) {
    if (!fs.existsSync(replicasDir)) {
      console.error("no results/replicas");
      process.exit(1);
    }
    const out = [];
    for (const d of fs.readdirSync(replicasDir).sort()) {
      const direct = path.join(replicasDir, d, "bin-react-js");
      if (fs.existsSync(direct)) {
        out.push({ runId: d, bin: direct });
        continue;
      }
      const nested = path.join(replicasDir, d);
      if (!fs.statSync(nested).isDirectory()) continue;
      for (const r of fs.readdirSync(nested).sort()) {
        const bin = path.join(nested, r, "bin-react-js");
        if (fs.existsSync(bin)) out.push({ runId: `${d}/${r}`, bin });
      }
    }
    return out;
  }
  const runId = arg("--run-id");
  let bin = arg("--bin");
  if (runId && !bin) {
    bin = path.join(replicasDir, runId, "bin-react-js");
  }
  if (!bin) {
    console.error(
      JSON.stringify({
        ok: false,
        error: "bin_required",
        hint: "pass --bin <path> or --run-id run-01 or --all-replicas",
      }),
    );
    process.exit(2);
  }
  return [{ runId: runId || null, bin: path.resolve(bin) }];
}

function scoreFailedIds(binDir) {
  const r = spawnSync(
    process.execPath,
    [path.join(root, "bench", "score.mjs"), "--bin", binDir],
    { encoding: "utf8", cwd: root },
  );
  if (!r.stdout) {
    console.error(r.stderr);
    throw new Error(`score produced no stdout for ${binDir}`);
  }
  const j = JSON.parse(r.stdout);
  return (j.failed || []).map((f) => f.id).concat(
    (j.missing_export || []).map((f) => f.id),
  );
}

function runOnBin(target) {
  const { runId, bin } = target;
  if (!fs.existsSync(bin)) {
    return { runId, bin, ok: false, error: "bin_missing", mutations: [] };
  }
  const mutations = [];
  let applied = 0;
  let killed = 0;
  let survived = 0;
  let nonApplicabile = 0;

  for (const c of cases) {
    const p = path.join(bin, c.file);
    if (!fs.existsSync(p)) {
      mutations.push({
        mutation: c.name,
        applied: false,
        status: "non_applicabile",
        reason: "file_missing",
      });
      nonApplicabile++;
      continue;
    }
    const orig = fs.readFileSync(p, "utf8");
    const next = c.mutate(orig);
    if (next === orig) {
      mutations.push({
        mutation: c.name,
        applied: false,
        status: "non_applicabile",
        reason: "patch_noop",
      });
      nonApplicabile++;
      continue;
    }
    applied++;
    fs.writeFileSync(p, next);
    let failed;
    try {
      failed = scoreFailedIds(bin);
    } catch (e) {
      fs.writeFileSync(p, orig);
      mutations.push({
        mutation: c.name,
        applied: true,
        status: "error",
        reason: String(e.message || e),
      });
      survived++; // treat as not killed
      continue;
    }
    fs.writeFileSync(p, orig);
    const missing = c.expect.filter((id) => !failed.includes(id));
    const status = missing.length === 0 ? "killed" : "survived";
    if (status === "killed") killed++;
    else survived++;
    mutations.push({
      mutation: c.name,
      applied: true,
      status,
      expect: c.expect,
      missing,
      failed,
    });
  }

  return {
    runId,
    bin,
    applied,
    killed,
    survived,
    nonApplicabile,
    killedOfApplied: `${killed}/${applied}`,
    ok: applied > 0 && survived === 0,
    mutations,
  };
}

const targets = resolveTargets();
const results = targets.map(runOnBin);

const totals = results.reduce(
  (a, r) => {
    a.applied += r.applied || 0;
    a.killed += r.killed || 0;
    a.survived += r.survived || 0;
    a.nonApplicabile += r.nonApplicabile || 0;
    return a;
  },
  { applied: 0, killed: 0, survived: 0, nonApplicabile: 0 },
);

const byMutation = {};
for (const r of results) {
  for (const m of r.mutations || []) {
    if (!byMutation[m.mutation]) {
      byMutation[m.mutation] = {
        applied: 0,
        killed: 0,
        survived: 0,
        non_applicabile: 0,
      };
    }
    const row = byMutation[m.mutation];
    if (!m.applied) row.non_applicabile++;
    else if (m.status === "killed") {
      row.applied++;
      row.killed++;
    } else {
      row.applied++;
      row.survived++;
    }
  }
}

const out = {
  ok: totals.applied > 0 && totals.survived === 0,
  kind: "hand_sample",
  note: "Only applied mutations count toward kill rate. non_applicabile = patch noop / missing file (not survived).",
  totals: {
    ...totals,
    killedOfApplied: `${totals.killed}/${totals.applied}`,
  },
  byMutation,
  results,
};
console.log(JSON.stringify(out, null, 2));

if (fs.existsSync(replicasDir)) {
  fs.writeFileSync(
    path.join(replicasDir, "mutations.json"),
    JSON.stringify(out, null, 2) + "\n",
  );
}

process.exit(out.ok ? 0 : 1);
