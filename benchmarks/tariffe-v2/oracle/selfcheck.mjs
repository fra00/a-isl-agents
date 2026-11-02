/**
 * Selfcheck: oracle vs vectors.json + call-map sync.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { API } from "./oracle.mjs";

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
  let got;
  try {
    got = API[v.call](v.input);
  } catch (e) {
    console.error(`throw ${v.id}:`, e.message);
    failed++;
    continue;
  }
  if (!eq(got, v.expected)) {
    console.error(`mismatch ${v.id}`, { got, expected: v.expected });
    failed++;
  }
}

console.log(
  JSON.stringify({
    ok: failed === 0,
    total: vectors.length,
    visible: vectors.filter((v) => v.visible).length,
    holdout: vectors.filter((v) => !v.visible).length,
    failed,
  }),
);
process.exit(failed === 0 ? 0 : 1);
