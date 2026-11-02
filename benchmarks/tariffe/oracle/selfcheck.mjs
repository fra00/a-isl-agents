/**
 * Dual-oracle selfcheck vs vectors.json. Exit 0 only if both agree with expected.
 * Proves coherence, not real-world truth.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { API as big } from "./oracle.mjs";
import { API as num } from "./oracle-number.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vectorsPath = path.join(__dirname, "vectors.json");
const callMapPath = path.join(__dirname, "..", "bench", "call-map.json");
const { vectors } = JSON.parse(fs.readFileSync(vectorsPath, "utf8"));
const callMap = JSON.parse(fs.readFileSync(callMapPath, "utf8"));

const mapKeys = new Set(Object.keys(callMap));
const used = new Set();
for (const v of vectors) {
  const k = `${v.unit}.${v.call}`;
  used.add(k);
  if (!mapKeys.has(k)) {
    console.error(`call-map missing: ${k} (vector ${v.id})`);
    process.exit(3);
  }
}
for (const k of mapKeys) {
  if (!used.has(k)) {
    console.error(`call-map unused: ${k}`);
    process.exit(3);
  }
}

function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

let failed = 0;
for (const v of vectors) {
  let gotBig;
  let gotNum;
  try {
    gotBig = big[v.call](v.input);
  } catch (e) {
    console.error(`BIGINT throw ${v.id}:`, e.message);
    failed++;
    continue;
  }
  try {
    gotNum = num[v.call](v.input);
  } catch (e) {
    console.error(`NUMBER throw/guardrail ${v.id}:`, e.message);
    failed++;
    continue;
  }
  if (!eq(gotBig, v.expected)) {
    console.error(`BIGINT mismatch ${v.id}`, { gotBig, expected: v.expected });
    failed++;
  }
  if (!eq(gotNum, v.expected)) {
    console.error(`NUMBER mismatch ${v.id}`, { gotNum, expected: v.expected });
    failed++;
  }
  if (!eq(gotBig, gotNum)) {
    console.error(`DUAL diverge ${v.id}`, { gotBig, gotNum });
    failed++;
  }
}

const holdout = vectors.filter((v) => !v.visible).length;
const visible = vectors.filter((v) => v.visible).length;
const handHold = vectors.filter((v) => !v.visible && v.provenance === "hand").length;
console.log(
  JSON.stringify({
    ok: failed === 0,
    total: vectors.length,
    visible,
    holdout,
    handHoldout: handHold,
    failed,
  }),
);
process.exit(failed === 0 ? 0 : 1);
