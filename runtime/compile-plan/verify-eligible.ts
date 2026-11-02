/**
 * EXT-001: parse verify-eligible Test Scenarios and resolve generated test paths.
 */

import * as path from "path";
import type { CallSymbolStyle, StackConfig } from "./stacks.config";
import { mapCallToSymbol } from "./stacks.config";

export interface EligibleScenario {
  id: string;
  call: string;
  symbol: string;
  title: string;
}

/**
 * Parse markdown Test Scenarios for lines with both `id:` and a following `Call:`.
 * Eligible shape:
 *   1. **title** `id: some-id`
 *      - Call: parseA1
 */
export function parseEligibleScenarios(
  sourceMarkdown: string,
  callSymbolStyle?: CallSymbolStyle,
): EligibleScenario[] {
  const style = callSymbolStyle ?? "as-is";
  const lines = sourceMarkdown.split(/\r?\n/);
  const out: EligibleScenario[] = [];

  for (let i = 0; i < lines.length; i++) {
    const header = lines[i];
    const idMatch = header.match(
      /^\s*\d+\.\s+\*\*(.+?)\*\*\s*`id:\s*([^`]+)`/i,
    );
    if (!idMatch) continue;
    const title = idMatch[1].trim();
    const id = idMatch[2].trim();
    let call: string | null = null;
    for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
      if (/^\s*\d+\.\s+\*\*/.test(lines[j])) break;
      const callMatch = lines[j].match(/^\s*-\s*Call:\s*(.+)\s*$/i);
      if (callMatch) {
        call = callMatch[1].trim().replace(/[`*]/g, "");
        break;
      }
    }
    if (!call) continue;
    out.push({
      id,
      call,
      title,
      symbol: mapCallToSymbol(call, style),
    });
  }
  return out;
}

/** `./domain-sheet` + `.js` impl → `domain-sheet.test.js` beside impl in bin. */
export function getTestRelativePath(
  implementationPath: string,
  stackConfig: StackConfig,
): string | null {
  const verify = stackConfig.verify;
  if (!verify || verify.runner === "none") return null;
  const rel = implementationPath.replace(/\\/g, "/").replace(/^\.\//, "");
  const noExt = rel.replace(/\.[^.]+$/, "");
  return `${noExt}${verify.testSuffix}`;
}

export function getTestTargetPath(
  implementationPath: string,
  outputBaseDir: string,
  stackConfig: StackConfig,
): string | null {
  const rel = getTestRelativePath(implementationPath, stackConfig);
  if (!rel) return null;
  return path.join(outputBaseDir, rel);
}
