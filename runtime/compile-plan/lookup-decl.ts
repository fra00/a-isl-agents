/**
 * EXT-002: deterministic declaration / type lookup in bin-* files.
 */

import * as fs from "fs";
import * as path from "path";
import {
  alternateMappedName,
  getStackConfig,
  mapCallToSymbol,
  type CallSymbolStyle,
} from "./stacks.config";
import {
  getStackLookup,
  type LookupKind,
  type StackLookupConfig,
} from "./declaration-patterns";

export type LookupReason =
  | "ok"
  | "unknown_stack"
  | "path_rejected"
  | "file_missing"
  | "file_empty"
  | "no_match"
  | "bad_args";

export interface LookupCandidate {
  kind: LookupKind;
  path: string;
  line: number;
  patternUsed: string;
  signatureText: string;
  leadingContext: string;
  enclosingType: string | null;
  spanTruncated?: boolean;
  score: number;
}

export interface LookupResult {
  ok: boolean;
  reason: LookupReason;
  stackId: string;
  kind: "value" | "type" | "any";
  specName: string;
  mappedNamesTried: string[];
  selected: number | null;
  candidates: LookupCandidate[];
  message?: string;
}

export interface LookupOptions {
  stackId: string;
  name: string;
  kind?: "value" | "type" | "any";
  files?: string[];
  dir?: string | null;
  workspace: string;
  includeTests?: boolean;
  maxSpanLines?: number;
  maxLeadingContextLines?: number;
}

const CALL_PREFIX =
  /^(if|while|for|switch|return|await|yield|throw|new|case)\b/i;

const MAX_SPAN_LINES_DEFAULT = 40;
const MAX_LEADING = 8;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function templateToRegex(template: string, name: string): RegExp {
  const escaped = escapeRegExp(name);
  const body = template.replace(/\{Name\}/g, escaped);
  return new RegExp(body, "m");
}

function isAssignmentPattern(template: string): boolean {
  return /const\|let\|var|const\|let|=\s*$|=\s*/.test(template) ||
    /(?:const|let|var)\s+\{Name\}\s*=/.test(template);
}

function isSemicolonOkPattern(template: string): boolean {
  // abstract/interface-style or assignment
  return (
    isAssignmentPattern(template) ||
    /interface|abstract|extern|class|record|enum|struct|type/.test(template)
  );
}

function matchExcludeGlob(filePath: string, globs: string[]): boolean {
  const base = path.basename(filePath);
  for (const g of globs) {
    if (g.startsWith("*.") && base.endsWith(g.slice(1))) return true;
    if (g.startsWith("*") && g.endsWith("*")) {
      const mid = g.slice(1, -1);
      if (base.includes(mid)) return true;
    }
    if (g.startsWith("*_") && base.endsWith(g.slice(1))) return true;
    if (g.endsWith(".py") && g.startsWith("test_") && base.startsWith("test_"))
      return true;
    if (g === "*_test.py" && base.endsWith("_test.py")) return true;
    // simple: convert * to .*
    const re = new RegExp(
      "^" + g.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$",
      "i",
    );
    if (re.test(base)) return true;
  }
  return false;
}

export function assertPathAllowed(
  filePath: string,
  workspace: string,
): { ok: true; real: string } | { ok: false; reason: LookupReason; message: string } {
  const normWs = path.normalize(path.resolve(workspace));
  let real: string;
  try {
    real = fs.existsSync(filePath)
      ? fs.realpathSync(filePath)
      : path.normalize(path.resolve(filePath));
  } catch {
    return {
      ok: false,
      reason: "path_rejected",
      message: `cannot resolve path: ${filePath}`,
    };
  }
  const normReal = path.normalize(real);
  const wsPrefix = normWs.endsWith(path.sep) ? normWs : normWs + path.sep;
  if (
    normReal.toLowerCase() !== normWs.toLowerCase() &&
    !normReal.toLowerCase().startsWith(wsPrefix.toLowerCase())
  ) {
    return {
      ok: false,
      reason: "path_rejected",
      message: `path outside workspace: ${filePath}`,
    };
  }
  const parts = normReal.split(path.sep);
  const hasBin = parts.some((p) => p.startsWith("bin-"));
  const underFixtures = /[/\\]tests[/\\]fixtures[/\\]/.test(normReal);
  if (!hasBin && !underFixtures) {
    return {
      ok: false,
      reason: "path_rejected",
      message: `path must be under bin-* (got ${filePath})`,
    };
  }
  return { ok: true, real: normReal };
}

function extractRazorCodeRegions(content: string): { text: string; lineOffset: number }[] {
  const regions: { text: string; lineOffset: number }[] = [];
  const re = /@(?:code|functions)\s*\{/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const startIdx = m.index + m[0].length;
    const startLine =
      content.slice(0, m.index).split(/\r?\n/).length - 1;
    let depth = 1;
    let i = startIdx;
    let inStr: string | null = null;
    let truncated = false;
    const max = startIdx + 200000;
    while (i < content.length && depth > 0) {
      if (i > max) {
        truncated = true;
        break;
      }
      const ch = content[i];
      if (inStr) {
        if (ch === "\\" && inStr !== "@") {
          i += 2;
          continue;
        }
        if (ch === inStr) inStr = null;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inStr = ch;
        i++;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      i++;
    }
    const end = depth === 0 ? i - 1 : i;
    const text = content.slice(startIdx, end);
    regions.push({ text, lineOffset: startLine + 1 });
    if (truncated) break;
  }
  return regions;
}

function leadingContext(
  lines: string[],
  matchLineIdx: number,
  maxLines: number,
): string {
  const out: string[] = [];
  for (let i = matchLineIdx - 1; i >= 0 && out.length < maxLines; i--) {
    const t = lines[i].trim();
    if (
      t.startsWith("//") ||
      t.startsWith("/*") ||
      t.startsWith("*") ||
      t.startsWith("///") ||
      t.startsWith("#") ||
      /^\[[\w.]+/.test(t)
    ) {
      out.unshift(lines[i]);
    } else if (t === "") {
      continue;
    } else {
      break;
    }
  }
  return out.join("\n");
}

function enclosingType(lines: string[], matchLineIdx: number): string | null {
  for (let i = matchLineIdx - 1; i >= 0; i--) {
    const m = lines[i].match(
      /\b(?:class|record|interface|struct)\s+([A-Za-z_][\w]*)/,
    );
    if (m) return m[1];
  }
  return null;
}

function extractSignatureSpan(
  lines: string[],
  startLineIdx: number,
  startCol: number,
  maxLines: number,
): { text: string; truncated: boolean } {
  let depth = 0;
  let started = false;
  let inStr: string | null = null;
  const parts: string[] = [];
  let truncated = false;

  for (let li = startLineIdx; li < lines.length; li++) {
    if (li - startLineIdx > maxLines) {
      truncated = true;
      break;
    }
    const line = lines[li];
    const from = li === startLineIdx ? startCol : 0;
    let chunk = "";
    for (let i = from; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];
      if (inStr) {
        chunk += ch;
        if (ch === "\\" && inStr !== "@") {
          if (next) {
            chunk += next;
            i++;
          }
          continue;
        }
        if (inStr === "@" && ch === '"' && next !== '"') {
          // end of C# verbatim roughly when lone " — simplified
          inStr = null;
          continue;
        }
        if (ch === inStr && inStr !== "@") inStr = null;
        continue;
      }
      if (ch === "@" && next === '"') {
        inStr = "@";
        chunk += ch;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inStr = ch;
        chunk += ch;
        continue;
      }
      if (ch === "(") {
        depth++;
        started = true;
        chunk += ch;
        continue;
      }
      if (ch === ")") {
        depth--;
        chunk += ch;
        if (started && depth <= 0) {
          // include rest of line markers like { or : or => or ;
          const rest = line.slice(i + 1);
          const m = rest.match(/^\s*(=>|\{|:|;)/);
          if (m) chunk += rest.slice(0, m[0].length);
          parts.push(chunk);
          return { text: parts.join("\n").trim(), truncated: false };
        }
        continue;
      }
      // types without paren (class Foo)
      if (!started && (ch === "{" || ch === ":" || ch === ";")) {
        chunk += ch;
        parts.push(chunk);
        return { text: parts.join("\n").trim(), truncated: false };
      }
      chunk += ch;
    }
    parts.push(li === startLineIdx ? line.slice(startCol) : line);
  }
  truncated = true;
  return { text: parts.join("\n").trim(), truncated };
}

function indentWidth(line: string): number {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

function scoreCandidate(
  c: Omit<LookupCandidate, "score">,
  template: string,
): number {
  let s = 0;
  if (/[{:]/.test(c.signatureText.slice(-20)) || /\)\s*\{/.test(c.signatureText))
    s += 40;
  if (/function\s|def\s|const\s|let\s|public\s|class\s|record\s/.test(template))
    s += 30;
  else s += 10;
  s += Math.max(0, 20 - indentWidth(c.signatureText.split("\n")[0] || ""));
  s -= c.line * 0.001;
  return s;
}

function shouldDiscardCallLike(
  line: string,
  template: string,
  allowTrailingSemicolon: boolean,
): boolean {
  const trimmed = line.trim();
  if (CALL_PREFIX.test(trimmed)) return true;
  if (isSemicolonOkPattern(template) || isAssignmentPattern(template)) {
    return false;
  }
  if (allowTrailingSemicolon) return false;
  if (trimmed.endsWith(";") && !trimmed.includes("{")) return true;
  return false;
}

function searchInText(
  content: string,
  absolutePath: string,
  kind: LookupKind,
  name: string,
  templates: string[],
  maxSpanLines: number,
  maxLeading: number,
  lineOffset = 0,
  allowTrailingSemicolon = false,
): LookupCandidate[] {
  const lines = content.split(/\r?\n/);
  const found: LookupCandidate[] = [];

  for (const template of templates) {
    const re = templateToRegex(template, name);
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const m = re.exec(line);
      if (!m) continue;
      if (shouldDiscardCallLike(line, template, allowTrailingSemicolon)) continue;

      const span = extractSignatureSpan(lines, li, m.index, maxSpanLines);
      const candBase = {
        kind,
        path: absolutePath,
        line: li + 1 + lineOffset,
        patternUsed: template,
        signatureText: span.text,
        leadingContext: leadingContext(lines, li, maxLeading),
        enclosingType: enclosingType(lines, li),
        spanTruncated: span.truncated || undefined,
      };
      found.push({
        ...candBase,
        score: scoreCandidate(candBase, template),
      });
    }
  }
  return found;
}

function collectFiles(
  opts: LookupOptions,
  lookup: StackLookupConfig,
): { files: string[]; error?: LookupResult } {
  const out: string[] = [];
  const files = opts.files || [];
  for (const f of files) {
    const check = assertPathAllowed(f, opts.workspace);
    if (!check.ok) {
      return {
        files: [],
        error: {
          ok: false,
          reason: check.reason,
          stackId: opts.stackId,
          kind: opts.kind || "any",
          specName: opts.name,
          mappedNamesTried: [],
          selected: null,
          candidates: [],
          message: check.message,
        },
      };
    }
    out.push(check.real);
  }
  if (opts.dir) {
    const check = assertPathAllowed(opts.dir, opts.workspace);
    if (!check.ok) {
      return {
        files: [],
        error: {
          ok: false,
          reason: check.reason,
          stackId: opts.stackId,
          kind: opts.kind || "any",
          specName: opts.name,
          mappedNamesTried: [],
          selected: null,
          candidates: [],
          message: check.message,
        },
      };
    }
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
          walk(full);
        } else {
          const ext = path.extname(ent.name);
          if (!lookup.lookupFileExtensions.includes(ext)) continue;
          if (
            !opts.includeTests &&
            matchExcludeGlob(full, lookup.excludeTestGlobs)
          ) {
            continue;
          }
          const c = assertPathAllowed(full, opts.workspace);
          if (c.ok) out.push(c.real);
        }
      }
    };
    walk(check.real);
  }
  return { files: [...new Set(out)] };
}

export function lookupDeclaration(opts: LookupOptions): LookupResult {
  const stack = getStackConfig(opts.stackId);
  const lookup = getStackLookup(opts.stackId);
  const kindReq = opts.kind || "any";
  if (!lookup || !STACKS_HAS(opts.stackId)) {
    // unknown if no lookup patterns
  }
  if (!lookup) {
    return {
      ok: false,
      reason: "unknown_stack",
      stackId: opts.stackId,
      kind: kindReq,
      specName: opts.name,
      mappedNamesTried: [],
      selected: null,
      candidates: [],
      message: `unknown stack or no lookup patterns: ${opts.stackId}`,
    };
  }
  if (!opts.name?.trim()) {
    return {
      ok: false,
      reason: "bad_args",
      stackId: opts.stackId,
      kind: kindReq,
      specName: opts.name || "",
      mappedNamesTried: [],
      selected: null,
      candidates: [],
      message: "missing --name",
    };
  }

  const style: CallSymbolStyle | undefined = stack.verify?.callSymbol;
  const primary = mapCallToSymbol(opts.name, style);
  const alt = alternateMappedName(opts.name, style);
  const names = alt && alt !== primary ? [primary, alt] : [primary];

  const collected = collectFiles(opts, lookup);
  if (collected.error) return collected.error;
  if (collected.files.length === 0) {
    return {
      ok: false,
      reason: "file_missing",
      stackId: opts.stackId,
      kind: kindReq,
      specName: opts.name,
      mappedNamesTried: names,
      selected: null,
      candidates: [],
      message: "no files to search",
    };
  }

  const maxSpan = opts.maxSpanLines ?? MAX_SPAN_LINES_DEFAULT;
  const maxLead = opts.maxLeadingContextLines ?? MAX_LEADING;
  let candidates: LookupCandidate[] = [];

  for (const filePath of collected.files) {
    if (!fs.existsSync(filePath)) {
      return {
        ok: false,
        reason: "file_missing",
        stackId: opts.stackId,
        kind: kindReq,
        specName: opts.name,
        mappedNamesTried: names,
        selected: null,
        candidates: [],
        message: `file missing: ${filePath}`,
      };
    }
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.trim()) {
      if (opts.files?.some((f) => path.normalize(f) === filePath || path.resolve(f) === filePath)) {
        return {
          ok: false,
          reason: "file_empty",
          stackId: opts.stackId,
          kind: kindReq,
          specName: opts.name,
          mappedNamesTried: names,
          selected: null,
          candidates: [],
          message: `file empty: ${filePath}`,
        };
      }
      continue;
    }

    const allowSemi =
      opts.stackId === "csharp" ||
      opts.stackId === "blazor" ||
      opts.stackId === "winforms";

    const runSearch = (
      text: string,
      lineOffset: number,
      kind: LookupKind,
      templates: string[],
      mapped: string,
    ) => {
      candidates.push(
        ...searchInText(
          text,
          filePath,
          kind,
          mapped,
          templates,
          maxSpan,
          maxLead,
          lineOffset,
          allowSemi,
        ),
      );
    };

    const valuePatterns = lookup.declarationPatterns;
    const typePatterns = lookup.typePatterns;

    for (const mapped of names) {
      const searchContent = () => {
        if (lookup.razorCodeBlocks && filePath.endsWith(".razor")) {
          const regions = extractRazorCodeRegions(content);
          for (const reg of regions) {
            if (kindReq === "value" || kindReq === "any") {
              runSearch(reg.text, reg.lineOffset, "value", valuePatterns, mapped);
            }
            if (kindReq === "type" || kindReq === "any") {
              runSearch(reg.text, reg.lineOffset, "type", typePatterns, mapped);
            }
          }
          return;
        }
        if (kindReq === "value" || kindReq === "any") {
          runSearch(content, 0, "value", valuePatterns, mapped);
        }
        if (kindReq === "type" || kindReq === "any") {
          runSearch(content, 0, "type", typePatterns, mapped);
        }
      };
      searchContent();
      if (candidates.length) break; // primary mapped name wins; else try alternate
    }
  }

  // Dedupe by path+line+kind
  const seen = new Set<string>();
  candidates = candidates.filter((c) => {
    const k = `${c.path}:${c.line}:${c.kind}:${c.signatureText.slice(0, 40)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.line !== b.line) return a.line - b.line;
    return a.path.localeCompare(b.path);
  });

  if (!candidates.length) {
    return {
      ok: false,
      reason: "no_match",
      stackId: opts.stackId,
      kind: kindReq,
      specName: opts.name,
      mappedNamesTried: names,
      selected: null,
      candidates: [],
      message: `no declaration for ${opts.name} (tried ${names.join(", ")})`,
    };
  }

  return {
    ok: true,
    reason: "ok",
    stackId: opts.stackId,
    kind: kindReq,
    specName: opts.name,
    mappedNamesTried: names,
    selected: 0,
    candidates,
  };
}

function STACKS_HAS(id: string): boolean {
  return !!getStackLookup(id);
}

export function appendLookupLog(
  workspace: string,
  entry: Record<string, unknown>,
): void {
  try {
    const dir = path.join(workspace, "build");
    fs.mkdirSync(dir, { recursive: true });
    const line = JSON.stringify({ ...entry, ts: new Date().toISOString() });
    fs.appendFileSync(path.join(dir, "lookup-log.jsonl"), line + "\n", "utf-8");
  } catch {
    // ignore log failures
  }
}
