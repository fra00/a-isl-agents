/**
 * Copy agent-skills/* → .cursor/skills, .claude/skills, .github/skills
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(root, "agent-skills");
const targets = [
  path.join(root, ".cursor", "skills"),
  path.join(root, ".claude", "skills"),
  path.join(root, ".github", "skills"),
];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name === "README.md") continue;
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(srcRoot)) {
  console.error("missing agent-skills/");
  process.exit(1);
}

const skills = fs
  .readdirSync(srcRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const target of targets) {
  fs.mkdirSync(target, { recursive: true });
  for (const skill of skills) {
    copyDir(path.join(srcRoot, skill), path.join(target, skill));
  }
  console.log(`synced ${skills.length} skills → ${path.relative(root, target)}`);
}
