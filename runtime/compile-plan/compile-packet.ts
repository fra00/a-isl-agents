/**
 * Build a minimal compile packet for the agent (SOURCE + dep bin paths, no inlined refs).
 */

import * as fs from "fs";
import * as path from "path";
import type { ManifestEntry } from "./types";
import type { StackConfig } from "./stacks.config";
import {
  extractRoleFromBuildContext,
  getTargetPathForEntry,
} from "./compile-plan";

export const SOURCE_MARK = "<!-- SOURCE FILE TO IMPLEMENT -->";

const REF_PATTERN =
  /^>\s*\*\*Reference\*\*.*(?:\[.*?\]\(([^"\s)]+)(?:\s+".*?")?\)|`([^`]+)`)/;

export interface DependencyBinInfo {
  islPath: string;
  islBasename: string;
  binPath: string | null;
  binExists: boolean;
  role: string | null;
}

export interface CompilePacket {
  buildFile: string;
  sourceFile: string | null;
  targetPath: string;
  relativeImplPath: string;
  role: string;
  stackId: string;
  stackConstraints: string[];
  stackSafetyConstraints: string[];
  /** Full SOURCE unit only (after marker). */
  sourceMarkdown: string;
  dependencies: DependencyBinInfo[];
  missingDependencyBins: string[];
  /** Absolute path to full .build.md if agent must escalate. */
  fullBuildFile: string;
  mode: "light";
  escalationHints: string[];
}

function extractSourceMarkdown(buildContext: string): string {
  const idx = buildContext.indexOf(SOURCE_MARK);
  if (idx < 0) {
    return buildContext.trim();
  }
  return buildContext.slice(idx + SOURCE_MARK.length).trim();
}

function collectReferencedIslPaths(
  sourceMarkdown: string,
  sourceFileDir: string,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const line of sourceMarkdown.split(/\r?\n/)) {
    const match = line.match(REF_PATTERN);
    if (!match) continue;
    const rel = match[1] || match[2];
    if (!rel) continue;
    const abs = path.normalize(path.resolve(sourceFileDir, rel));
    if (!seen.has(abs)) {
      seen.add(abs);
      out.push(abs);
    }
  }
  return out;
}

function findManifestEntryForSource(
  manifest: ManifestEntry[],
  sourceIslPath: string,
): ManifestEntry | undefined {
  const norm = path.normalize(sourceIslPath);
  return manifest.find((e) => path.normalize(e.sourceFile) === norm);
}

/**
 * Light compile packet: SOURCE markdown + dependency bin paths (not inlined .ref.md).
 */
export function buildCompilePacket(options: {
  buildFile: string;
  manifest: ManifestEntry[];
  binDir: string;
  stackConfig: StackConfig;
}): CompilePacket {
  const { buildFile, manifest, binDir, stackConfig } = options;
  if (!fs.existsSync(buildFile)) {
    throw new Error(`build file not found: ${buildFile}`);
  }

  const entry = manifest.find(
    (e) => path.normalize(e.buildFile) === path.normalize(buildFile),
  );
  if (!entry) {
    throw new Error(`build file not in manifest: ${buildFile}`);
  }
  if (!entry.implementationPath) {
    throw new Error(`no implementationPath for ${buildFile}`);
  }

  const buildContext = fs.readFileSync(buildFile, "utf-8");
  const paths = getTargetPathForEntry(
    entry,
    buildContext,
    binDir,
    stackConfig,
  );
  if (!paths) {
    throw new Error(`cannot resolve target path for ${buildFile}`);
  }

  const sourceMarkdown = extractSourceMarkdown(buildContext);
  const sourceFile = entry.sourceFile;
  const sourceDir = path.dirname(sourceFile);
  const refIslPaths = collectReferencedIslPaths(sourceMarkdown, sourceDir);

  const dependencies: DependencyBinInfo[] = [];
  const missingDependencyBins: string[] = [];

  for (const islPath of refIslPaths) {
    const depEntry = findManifestEntryForSource(manifest, islPath);
    let binPath: string | null = null;
    let role: string | null = null;
    let binExists = false;

    if (depEntry?.implementationPath && fs.existsSync(depEntry.buildFile)) {
      const depCtx = fs.readFileSync(depEntry.buildFile, "utf-8");
      const depPaths = getTargetPathForEntry(
        depEntry,
        depCtx,
        binDir,
        stackConfig,
      );
      if (depPaths) {
        binPath = depPaths.targetPath;
        role = depPaths.role;
        binExists = fs.existsSync(binPath);
      }
    }

    if (!binExists) {
      missingDependencyBins.push(path.basename(islPath));
    }

    dependencies.push({
      islPath,
      islBasename: path.basename(islPath),
      binPath,
      binExists,
      role,
    });
  }

  const escalationHints: string[] = [];
  if (missingDependencyBins.length > 0) {
    escalationHints.push(
      "STOP: missing dependency bin(s). Run queue/builder; do not invent APIs.",
    );
  }
  if (!buildContext.includes(SOURCE_MARK)) {
    escalationHints.push(
      "SOURCE marker missing — read fullBuildFile once to recover.",
    );
  }

  return {
    buildFile,
    sourceFile,
    targetPath: paths.targetPath,
    relativeImplPath: paths.relativeImplPath,
    role: paths.role || extractRoleFromBuildContext(buildContext),
    stackId: stackConfig.id,
    stackConstraints: stackConfig.constraints.slice(0, 12),
    stackSafetyConstraints: stackConfig.safetyConstraints,
    sourceMarkdown,
    dependencies,
    missingDependencyBins,
    fullBuildFile: buildFile,
    mode: "light",
    escalationHints,
  };
}

/** Human-readable packet for agent stdin/stdout (markdown). */
export function formatCompilePacketMarkdown(packet: CompilePacket): string {
  const lines: string[] = [];
  lines.push(`# Compile packet (light)`);
  lines.push(``);
  lines.push(`- **mode**: \`${packet.mode}\``);
  lines.push(`- **role**: ${packet.role}`);
  lines.push(`- **stack**: ${packet.stackId}`);
  lines.push(`- **targetPath**: \`${packet.targetPath}\``);
  lines.push(`- **relativeImplPath**: \`${packet.relativeImplPath}\``);
  lines.push(`- **buildFile**: \`${packet.buildFile}\``);
  if (packet.sourceFile) {
    lines.push(`- **sourceFile**: \`${packet.sourceFile}\``);
  }
  lines.push(``);
  lines.push(`## Dependency bins (import these — do not re-read full .ref.md)`);
  if (packet.dependencies.length === 0) {
    lines.push(`_(none)_`);
  } else {
    for (const d of packet.dependencies) {
      const status = d.binExists ? "ok" : "MISSING";
      lines.push(
        `- [${status}] \`${d.islBasename}\` → \`${d.binPath ?? "(unresolved)"}\`${d.role ? ` (${d.role})` : ""}`,
      );
    }
  }
  if (packet.escalationHints.length > 0) {
    lines.push(``);
    lines.push(`## Escalation`);
    for (const h of packet.escalationHints) {
      lines.push(`- ${h}`);
    }
  }
  lines.push(``);
  lines.push(`## Stack constraints (subset)`);
  for (const c of packet.stackConstraints) {
    lines.push(`- ${c}`);
  }
  lines.push(``);
  lines.push(`## SOURCE (implement this unit)`);
  lines.push(``);
  lines.push(packet.sourceMarkdown);
  lines.push(``);
  return lines.join("\n");
}
