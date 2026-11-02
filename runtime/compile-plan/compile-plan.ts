/**
 * Pure compile planning shared by StandardRunner (isl-generator) and agent-facing CLIs.
 * Encodes target resolution, role extraction, and hash/skip rules — no LLM calls.
 */

import * as fs from "fs";
import * as path from "path";
import type { GenLock, ManifestEntry } from "./types";
import type { StackConfig } from "./stacks.config";

const SOURCE_MARK = "<!-- SOURCE FILE TO IMPLEMENT -->";

/** Same scope as StandardRunner: Role from the source unit only (after SOURCE marker). */
export function extractRoleFromBuildContext(buildContext: string): string {
  const idx = buildContext.indexOf(SOURCE_MARK);
  const sourceContent =
    idx >= 0
      ? buildContext.slice(idx + SOURCE_MARK.length)
      : buildContext;
  const roleMatch = sourceContent.match(
    /(?:###|\*\*)\s*Role(?:\*\*)?\s*:\s*(.+)/i,
  );
  return roleMatch ? roleMatch[1].trim() : "default";
}

/** `./formula-bar` → `./FormulaBar` (Blazor component file names). */
function kebabPathToPascalBasename(relativeImplPath: string): string {
  const dir = path.posix.dirname(relativeImplPath.replace(/\\/g, "/"));
  const base = path.posix.basename(relativeImplPath.replace(/\\/g, "/"));
  const noExt = base.replace(/\.[^.]+$/, "");
  const pascal = noExt
    .split("-")
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  if (!pascal) return relativeImplPath;
  if (dir === "." || dir === "") return `./${pascal}`;
  return `${dir}/${pascal}`;
}

export function resolveRelativeImplPath(
  implementationPath: string,
  role: string,
  stackConfig: StackConfig,
): string {
  let relativeImplPath = implementationPath;
  if (stackConfig.id === "blazor" && role === "Presentation") {
    relativeImplPath = kebabPathToPascalBasename(relativeImplPath);
  }
  const extMap = stackConfig.extensions;
  const desiredExt = extMap[role] || extMap.default || ".js";
  const currentExt = path.extname(relativeImplPath);
  if (currentExt) {
    relativeImplPath =
      relativeImplPath.slice(0, -currentExt.length) + desiredExt;
  } else {
    relativeImplPath = relativeImplPath + desiredExt;
  }
  return relativeImplPath;
}

export function getTargetPathForEntry(
  entry: ManifestEntry,
  buildContext: string,
  outputBaseDir: string,
  stackConfig: StackConfig,
): { targetPath: string; relativeImplPath: string; role: string } | null {
  if (!entry.implementationPath) {
    return null;
  }
  const role = extractRoleFromBuildContext(buildContext);
  const relativeImplPath = resolveRelativeImplPath(
    entry.implementationPath,
    role,
    stackConfig,
  );
  const targetPath = path.join(outputBaseDir, relativeImplPath);
  return { targetPath, relativeImplPath, role };
}

/** Mirrors StandardRunner skip condition (before LLM). */
export function shouldSkipGeneration(
  entry: ManifestEntry,
  lock: GenLock,
  targetPath: string,
  force: boolean,
): boolean {
  const lastHash = lock[entry.buildFile];
  const targetExists = fs.existsSync(targetPath);
  const hashMatch = lastHash === entry.hash;
  return !force && hashMatch && targetExists;
}

export type AgentCompileReason =
  | "force"
  | "force-only"
  | "missing-target"
  | "hash-mismatch";

export interface AgentCompileItem {
  sourceFile: string;
  buildFile: string;
  implementationPath: string;
  hash: string;
  targetPath: string;
  relativeImplPath: string;
  role: string;
  reason: AgentCompileReason;
  previousHash: string | null;
}

/** Normalize a user token for --only matching (dungeon, dungeon.isl.md, ./dungeon). */
export function normalizeUnitToken(token: string): string {
  return token
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.isl\.md$/i, "")
    .replace(/\.build\.md$/i, "")
    .replace(/^\.\//, "")
    .toLowerCase();
}

/**
 * Match manifest entry to --only token by source basename, Implementation path,
 * or build basename (e.g. dungeon, dungeon.isl.md, ./dungeon).
 */
export function manifestEntryMatchesOnly(
  entry: ManifestEntry,
  token: string,
): boolean {
  const t = normalizeUnitToken(token);
  if (!t) return false;
  const sourceBase = path
    .basename(entry.sourceFile)
    .replace(/\.isl\.md$/i, "")
    .toLowerCase();
  const buildBase = path
    .basename(entry.buildFile)
    .replace(/\.build\.md$/i, "")
    .toLowerCase();
  const impl = (entry.implementationPath || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .toLowerCase();
  const sourceFull = entry.sourceFile.replace(/\\/g, "/").toLowerCase();
  return (
    t === sourceBase ||
    t === buildBase ||
    t === impl ||
    sourceFull.endsWith(`/${t}.isl.md`) ||
    sourceFull.endsWith(t)
  );
}

export function buildAgentCompileQueue(
  manifest: ManifestEntry[],
  lock: GenLock,
  outputBaseDir: string,
  stackConfig: StackConfig,
  options: { force?: boolean; only?: string[] } = {},
): AgentCompileItem[] {
  const forceAll = options.force ?? false;
  const only = (options.only || []).map(normalizeUnitToken).filter(Boolean);
  const onlyActive = only.length > 0;
  const out: AgentCompileItem[] = [];

  for (const entry of manifest) {
    if (!entry.implementationPath) {
      continue;
    }
    const selected =
      !onlyActive ||
      only.some((token) => manifestEntryMatchesOnly(entry, token));
    if (!selected) {
      continue;
    }

    const buildContext = fs.readFileSync(entry.buildFile, "utf-8");
    const paths = getTargetPathForEntry(
      entry,
      buildContext,
      outputBaseDir,
      stackConfig,
    );
    if (!paths) {
      continue;
    }
    const { targetPath, relativeImplPath, role } = paths;

    // Targeted --only always re-queues the unit (even if lock says unchanged).
    const forceThis = forceAll || onlyActive;
    if (shouldSkipGeneration(entry, lock, targetPath, forceThis)) {
      continue;
    }

    const lastHash = lock[entry.buildFile] ?? null;
    let reason: AgentCompileReason;
    if (onlyActive && !forceAll) {
      reason = "force-only";
    } else if (forceAll) {
      reason = "force";
    } else if (!fs.existsSync(targetPath)) {
      reason = "missing-target";
    } else {
      reason = "hash-mismatch";
    }

    out.push({
      sourceFile: entry.sourceFile,
      buildFile: entry.buildFile,
      implementationPath: entry.implementationPath,
      hash: entry.hash,
      targetPath,
      relativeImplPath,
      role,
      reason,
      previousHash: lastHash,
    });
  }

  return out;
}

/** Resolve --only tokens to manifest entries; throws if any token matches nothing. */
export function resolveOnlyManifestEntries(
  manifest: ManifestEntry[],
  onlyTokens: string[],
): ManifestEntry[] {
  const tokens = onlyTokens.map(normalizeUnitToken).filter(Boolean);
  if (tokens.length === 0) return [];
  const matched: ManifestEntry[] = [];
  const missing: string[] = [];
  for (const token of tokens) {
    const hits = manifest.filter((entry) =>
      manifestEntryMatchesOnly(entry, token),
    );
    if (hits.length === 0) {
      missing.push(token);
      continue;
    }
    for (const hit of hits) {
      if (!matched.some((e) => e.buildFile === hit.buildFile)) {
        matched.push(hit);
      }
    }
  }
  if (missing.length) {
    const available = manifest
      .map((e) => path.basename(e.sourceFile).replace(/\.isl\.md$/i, ""))
      .filter(Boolean)
      .slice(0, 40)
      .join(", ");
    throw new Error(
      `Unknown --only unit(s): ${missing.join(", ")}. Examples: ${available}${manifest.length > 40 ? ", …" : ""}`,
    );
  }
  return matched;
}

/**
 * Set lock[buildFile] = manifest hash for each matching build file path (normalized).
 * Does not write — caller writes JSON. Same values StandardRunner publishes after success.
 */
export function mergeLockEntriesFromManifest(
  manifest: ManifestEntry[],
  existingLock: GenLock,
  normalizedBuildFilesToTouch: Set<string>,
): { lock: GenLock; updated: number; notFound: string[] } {
  const lock: GenLock = { ...existingLock };
  const pending = new Set(normalizedBuildFilesToTouch);
  let updated = 0;

  for (const entry of manifest) {
    const keyNorm = path.normalize(entry.buildFile);
    if (!pending.has(keyNorm)) {
      continue;
    }
    lock[entry.buildFile] = entry.hash;
    pending.delete(keyNorm);
    updated++;
  }

  return {
    lock,
    updated,
    notFound: [...pending],
  };
}
