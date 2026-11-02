/**
 * Structural (syntactic) check: Logic units reference Domain / declared deps,
 * and forbid inline `* bps / 10000` outside domain-money.
 * Does NOT prove call-site correctness.
 *
 * Usage: node check-deps.mjs [--bin path] [--stack react-js|csharp]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const stack = arg("--stack") || "react-js";
const defaultBin =
  stack === "csharp"
    ? path.join(__dirname, "..", "bin-csharp")
    : path.join(__dirname, "..", "bin-react-js");
const binDir = path.resolve(arg("--bin") || defaultBin);

const RULES_JS = [
  {
    file: "logic-quote.js",
    mustImport: ["./domain-money.js"],
    forbidRegex: [/\*\s*bps\s*\/\s*10000/, /\/\s*10000n?\s*\*\s*.*bps/i],
  },
  {
    file: "logic-penalty.js",
    mustImport: ["./domain-money.js", "./domain-calendar.js"],
    forbidRegex: [/\*\s*bps\s*\/\s*10000/],
  },
  {
    file: "logic-invoice.js",
    mustImport: [
      "./domain-calendar.js",
      "./logic-quote.js",
      "./logic-penalty.js",
      "./logic-case-status.js",
    ],
    forbidRegex: [],
  },
];

const RULES_CS = [
  {
    file: "logic-quote.cs",
    mustContain: ["DomainMoney"],
    forbidRegex: [/\*\s*bps\s*\/\s*10000/],
  },
  {
    file: "logic-penalty.cs",
    mustContain: ["DomainMoney", "DomainCalendar"],
    forbidRegex: [/\*\s*bps\s*\/\s*10000/],
  },
  {
    file: "logic-invoice.cs",
    mustContain: ["LogicQuote", "LogicPenalty", "LogicCaseStatus", "DomainCalendar"],
    forbidRegex: [],
  },
];

const rules = stack === "csharp" ? RULES_CS : RULES_JS;
const results = [];
let allOk = true;

for (const rule of rules) {
  const p = path.join(binDir, rule.file);
  if (!fs.existsSync(p)) {
    allOk = false;
    results.push({
      unit: rule.file,
      dependencyUsage: "fail",
      missingImports: rule.mustImport || rule.mustContain,
      forbiddenHits: [],
      error: "file_missing",
    });
    continue;
  }
  const src = fs.readFileSync(p, "utf8");
  const required = rule.mustImport || rule.mustContain || [];
  const missing = required.filter((imp) => !src.includes(imp));
  const forbidden = (rule.forbidRegex || []).filter((re) => re.test(src));
  const pass = missing.length === 0 && forbidden.length === 0;
  if (!pass) allOk = false;
  results.push({
    unit: rule.file,
    dependencyUsage: pass ? "pass" : "fail",
    missingImports: missing,
    forbiddenHits: forbidden.map(String),
  });
}

console.log(
  JSON.stringify(
    {
      ok: allOk,
      kind: "syntactic",
      stack,
      note:
        stack === "csharp"
          ? "type name mentions + forbid *bps/10000; not call-site usage"
          : "imports present + forbid *bps/10000; not call-site usage",
      binDir,
      dependencyUsage: results,
    },
    null,
    2,
  ),
);
process.exit(allOk ? 0 : 1);
